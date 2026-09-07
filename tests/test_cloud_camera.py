"""Tests for the cloud camera, which is Agora WebRTC rather than a stream URL.

The printer offers two completely different video transports and neither
substitutes for the other, so they are two entities. The split is not
cosmetic: Home Assistant decides a camera's stream type from whether its
*class* overrides ``async_handle_async_webrtc_offer``, once, for every
instance -- so putting the WebRTC handler on the local camera would silently
take away its HLS stream. That is the first thing tested here, because it is
the thing a later refactor is most likely to undo by accident.
"""

from __future__ import annotations

from http import HTTPStatus
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from aiohttp import ClientError, hdrs, web
from homeassistant.components.camera import Camera, StreamType, WebRTCAnswer
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import HomeAssistantError

from custom_components.anycubic_cloud.agora import AgoraError
from custom_components.anycubic_cloud.camera import (
    CAMERA_TYPES,
    AnycubicCamera,
    AnycubicCameraStreamView,
    AnycubicCloudCamera,
)


def _credentials() -> MagicMock:
    credentials = MagicMock()
    credentials.appid = "6fc7f83702e44c67a0e1104933b01d4f"
    credentials.channel = "311f171de29b3b8c0f059b1ddd223215"
    credentials.client_uid = 139781340
    credentials.device_uid = 71431
    credentials.is_encrypted = True
    credentials.web_encryption_mode = "aes-256-gcm2"
    return credentials


def _cloud_camera(hass: HomeAssistant) -> tuple[AnycubicCloudCamera, MagicMock]:
    coordinator = MagicMock()
    coordinator.printers = {1: MagicMock()}
    coordinator.last_update_success = True
    coordinator.async_open_cloud_camera = AsyncMock(return_value=_credentials())

    # Skip the entity plumbing; only the WebRTC behaviour is under test.
    with patch.object(AnycubicCloudCamera, "__init__", lambda self, *a, **k: None):
        camera = AnycubicCloudCamera()

    camera.coordinator = coordinator
    camera._printer_id = 1
    camera.entity_description = CAMERA_TYPES[1]
    camera._sessions = {}
    camera.hass = hass

    return camera, coordinator


def _local_camera(
    hass: HomeAssistant,
    stream_url: str | None = "http://printer/flv",
    *,
    machine_type: int = 20025,
) -> tuple[AnycubicCamera, MagicMock]:
    coordinator = MagicMock()
    printer = MagicMock(machine_type=machine_type)
    coordinator.printers = {1: printer}
    coordinator.last_update_success = True
    coordinator.camera_stream_url = MagicMock(return_value=stream_url)
    coordinator.get_printer_for_id = MagicMock(return_value=printer)
    coordinator.async_start_camera = AsyncMock()

    with patch.object(AnycubicCamera, "__init__", lambda self, *a, **k: None):
        camera = AnycubicCamera()

    camera.coordinator = coordinator
    camera._printer_id = 1
    camera.entity_description = CAMERA_TYPES[0]
    camera.hass = hass
    camera.entity_id = "camera.anycubic_kobra"
    camera._stream_proxy_token = "camera-token"

    return camera, coordinator


def _kobra_x_camera(
    hass: HomeAssistant,
    stream_url: str | None = "http://10.0.66.28:18088/flv",
) -> tuple[AnycubicCamera, MagicMock]:
    return _local_camera(hass, stream_url, machine_type=20030)


def _upstream_response(
    status: HTTPStatus,
    *,
    chunks: tuple[bytes, ...] = (),
    content_type: str | None = "video/x-flv",
) -> MagicMock:
    headers = {} if content_type is None else {hdrs.CONTENT_TYPE: content_type}
    response = MagicMock(status=status, headers=headers)

    async def body():
        for chunk in chunks:
            yield chunk

    response.content.iter_chunked.return_value = body()
    return response


def _downstream_response() -> MagicMock:
    response = MagicMock()
    response.prepare = AsyncMock()
    response.write = AsyncMock()
    response.write_eof = AsyncMock()
    return response


class TestTheTwoTransportsStaySeparate:
    """The reason there are two entity classes at all."""

    def test_only_the_cloud_camera_overrides_the_webrtc_offer(self) -> None:
        assert AnycubicCloudCamera.async_handle_async_webrtc_offer is not Camera.async_handle_async_webrtc_offer
        # If this ever becomes true the local camera silently loses HLS.
        assert AnycubicCamera.async_handle_async_webrtc_offer is Camera.async_handle_async_webrtc_offer

    def test_the_descriptors_name_their_own_class(self) -> None:
        by_key = {description.key: description for description in CAMERA_TYPES}

        assert by_key["camera"].entity_class is AnycubicCamera
        assert by_key["cloud_camera"].entity_class is AnycubicCloudCamera

    def test_home_assistant_reports_the_expected_stream_types(self, hass: HomeAssistant) -> None:
        """The capability is computed per class, from the override above."""
        local = AnycubicCamera.__new__(AnycubicCamera)
        Camera.__init__(local)
        cloud = AnycubicCloudCamera.__new__(AnycubicCloudCamera)
        Camera.__init__(cloud)

        assert local._supports_native_async_webrtc is False
        assert cloud._supports_native_async_webrtc is True
        assert StreamType.WEB_RTC in cloud.camera_capabilities.frontend_stream_types


class TestOpeningAStream:
    async def test_an_offer_is_answered_with_the_agora_answer(self, hass: HomeAssistant) -> None:
        camera, coordinator = _cloud_camera(hass)
        session = AsyncMock()
        session.async_start = AsyncMock(return_value="v=0\r\na=answer\r\n")
        messages = []

        with patch(
            "custom_components.anycubic_cloud.camera.AgoraStreamSession",
            return_value=session,
        ):
            await camera.async_handle_async_webrtc_offer("v=0\r\na=offer\r\n", "session-1", messages.append)

        assert messages == [WebRTCAnswer("v=0\r\na=answer\r\n")]
        coordinator.async_open_cloud_camera.assert_awaited_once_with(1)
        assert camera._sessions["session-1"] is session

    async def test_each_session_asks_the_cloud_for_its_own_credentials(self, hass: HomeAssistant) -> None:
        """client_uid is issued fresh every call, so they cannot be reused."""
        camera, coordinator = _cloud_camera(hass)
        session = AsyncMock()
        session.async_start = AsyncMock(return_value="answer")

        with patch(
            "custom_components.anycubic_cloud.camera.AgoraStreamSession",
            return_value=session,
        ):
            await camera.async_handle_async_webrtc_offer("offer", "one", lambda _m: None)
            await camera.async_handle_async_webrtc_offer("offer", "two", lambda _m: None)

        assert coordinator.async_open_cloud_camera.await_count == 2

    async def test_a_failed_join_is_reported_and_leaves_nothing_behind(self, hass: HomeAssistant) -> None:
        camera, _ = _cloud_camera(hass)
        session = AsyncMock()
        session.async_start = AsyncMock(side_effect=AgoraError("gateway refused"))

        with (
            patch(
                "custom_components.anycubic_cloud.camera.AgoraStreamSession",
                return_value=session,
            ),
            pytest.raises(HomeAssistantError, match="gateway refused"),
        ):
            await camera.async_handle_async_webrtc_offer("offer", "session-1", lambda _m: None)

        assert camera._sessions == {}
        session.async_close.assert_awaited_once()

    async def test_a_printer_with_no_camera_surfaces_the_cloud_error(self, hass: HomeAssistant) -> None:
        """The cloud answers "Operation successful" and omits the block."""
        camera, coordinator = _cloud_camera(hass)
        coordinator.async_open_cloud_camera = AsyncMock(side_effect=HomeAssistantError("no camera credentials"))

        with pytest.raises(HomeAssistantError, match="no camera credentials"):
            await camera.async_handle_async_webrtc_offer("offer", "session-1", lambda _m: None)

        assert camera._sessions == {}


class TestWhenTheCameraIsOffered:
    """A printer with no camera should not carry a camera entity.

    But silence is not a no: the printer only says what it has once it has
    answered the peripherals poll, and hiding a working camera while that is
    still in flight is the worse of the two mistakes.
    """

    def _with_camera_flag(self, hass: HomeAssistant, flag: bool | None):
        camera, coordinator = _cloud_camera(hass)
        printer = MagicMock()
        printer.has_peripheral_camera = flag
        coordinator.printers = {1: printer}
        return camera

    def test_a_printer_that_reports_a_camera_is_offered(self, hass: HomeAssistant) -> None:
        assert self._with_camera_flag(hass, True).available is True

    def test_a_printer_that_has_not_answered_yet_is_still_offered(self, hass: HomeAssistant) -> None:
        assert self._with_camera_flag(hass, None).available is True

    def test_a_printer_that_says_it_has_no_camera_is_hidden(self, hass: HomeAssistant) -> None:
        assert self._with_camera_flag(hass, False).available is False


class TestTheStillImage:
    """No frame can exist here, but the card must still render."""

    async def test_a_placeholder_is_served_rather_than_a_broken_image(self, hass: HomeAssistant) -> None:
        camera, _ = _cloud_camera(hass)

        image = await camera.async_camera_image()

        assert image is not None
        # PNG magic -- a real image, not an error page or empty bytes.
        assert image[:8] == b"\x89PNG\r\n\x1a\n"

    async def test_the_placeholder_is_read_from_disk_only_once(self, hass: HomeAssistant) -> None:
        import custom_components.anycubic_cloud.camera as camera_module

        camera_module._placeholder_cache = None
        camera, _ = _cloud_camera(hass)

        first = await camera.async_camera_image()
        exploding = MagicMock()
        exploding.read_bytes.side_effect = AssertionError("read twice")
        with patch.object(camera_module, "_PLACEHOLDER_PATH", exploding):
            second = await camera.async_camera_image()

        assert first == second
        exploding.read_bytes.assert_not_called()

    async def test_a_missing_placeholder_does_not_raise(self, hass: HomeAssistant) -> None:
        """A packaging slip must not take the whole entity down."""
        import custom_components.anycubic_cloud.camera as camera_module

        camera_module._placeholder_cache = None
        camera, _ = _cloud_camera(hass)

        missing = MagicMock()
        missing.read_bytes.side_effect = OSError("gone")
        with patch.object(camera_module, "_PLACEHOLDER_PATH", missing):
            assert await camera.async_camera_image() is None

        camera_module._placeholder_cache = None


class TestCandidatesAndTeardown:
    async def test_candidates_are_passed_to_the_right_session(self, hass: HomeAssistant) -> None:
        camera, _ = _cloud_camera(hass)
        session = AsyncMock()
        camera._sessions["session-1"] = session
        candidate = MagicMock()

        await camera.async_on_webrtc_candidate("session-1", candidate)

        session.async_add_candidate.assert_awaited_once_with(candidate)

    async def test_a_candidate_for_an_unknown_session_is_ignored(self, hass: HomeAssistant) -> None:
        """They can arrive after teardown; raising would log a stack trace."""
        camera, _ = _cloud_camera(hass)

        await camera.async_on_webrtc_candidate("gone", MagicMock())

    async def test_closing_drops_the_session(self, hass: HomeAssistant) -> None:
        camera, _ = _cloud_camera(hass)
        session = AsyncMock()
        camera._sessions["session-1"] = session

        camera.close_webrtc_session("session-1")
        await hass.async_block_till_done()

        assert camera._sessions == {}
        session.async_close.assert_awaited_once()

    def test_closing_an_unknown_session_does_nothing(self, hass: HomeAssistant) -> None:
        camera, _ = _cloud_camera(hass)

        camera.close_webrtc_session("never-existed")

    async def test_removal_closes_every_live_session(self, hass: HomeAssistant) -> None:
        camera, _ = _cloud_camera(hass)
        first, second = AsyncMock(), AsyncMock()
        camera._sessions.update({"a": first, "b": second})

        with patch.object(Camera, "async_will_remove_from_hass", AsyncMock()):
            await camera.async_will_remove_from_hass()

        assert camera._sessions == {}
        first.async_close.assert_awaited_once()
        second.async_close.assert_awaited_once()


class TestStillsComeOffTheStreamHomeAssistantAlreadyHas:
    """Issue #20, twice over.

    First report: `camera.snapshot` failed while `camera.record` worked --
    a camera with a stream and no still. 2.2.0 answered it by opening a
    second ffmpeg straight at the printer's FLV endpoint.

    Second report, on 2.2.0, from the same person: the snapshot timed out
    after ten seconds and the live view started failing with "DESCRIBE
    failed: 404". The printer serves that stream once, so the hand-rolled
    grab was fighting the live view for it.

    Home Assistant already knows how to take a still off a stream-only
    camera -- reusing the connection rather than opening a rival one -- and
    it does it when `use_stream_for_stills` is set. The tests that shipped
    with 2.2.0 could not have caught this: they asserted ffmpeg had been
    called, which was the thing that was wrong.
    """

    async def test_the_still_comes_off_the_existing_stream(self, hass: HomeAssistant) -> None:
        camera, _ = _local_camera(hass)

        assert camera.use_stream_for_stills is True

    async def test_the_entity_opens_no_connection_of_its_own(self, hass: HomeAssistant) -> None:
        """The whole point: one consumer of the printer's stream, not two.

        Home Assistant only routes a still through the stream when the entity
        has not claimed the job itself, so the absence of an override is the
        behaviour -- assert it rather than trusting it to stay absent.
        """
        from homeassistant.components.camera import Camera

        camera, _ = _local_camera(hass)

        assert type(camera).async_camera_image is Camera.async_camera_image

    async def test_asking_for_the_stream_still_starts_the_capture(self, hass: HomeAssistant) -> None:
        """The printer keeps the stream shut until told, stills included."""
        camera, coordinator = _local_camera(hass)

        assert await camera.stream_source() == "http://printer/flv"
        coordinator.async_start_camera.assert_awaited_once_with(1)

    async def test_no_stream_url_means_no_stream(self, hass: HomeAssistant) -> None:
        camera, coordinator = _local_camera(hass, stream_url=None)

        assert await camera.stream_source() is None
        coordinator.async_start_camera.assert_not_awaited()


class TestKobraXPartialContentStream:
    """The Kobra X sends valid FLV with HTTP 206 even without a Range request."""

    async def test_only_the_affected_model_uses_the_proxy(self, hass: HomeAssistant) -> None:
        camera, coordinator = _kobra_x_camera(hass)

        with patch(
            "custom_components.anycubic_cloud.camera.get_url",
            return_value="http://homeassistant.local:8123",
        ):
            source = await camera.stream_source()

        assert source == (
            "http://homeassistant.local:8123/api/anycubic_cloud/camera_stream/camera.anycubic_kobra?token=camera-token"
        )
        coordinator.async_start_camera.assert_not_awaited()

    async def test_the_proxy_requires_its_entity_token(self, hass: HomeAssistant) -> None:
        camera, _ = _kobra_x_camera(hass)
        component = MagicMock()
        component.get_entity.return_value = camera
        view = AnycubicCameraStreamView(component)
        request = MagicMock()
        request.query = {"token": "wrong"}

        with pytest.raises(web.HTTPForbidden):
            await view.get(request, camera.entity_id)

    async def test_the_proxy_accepts_its_entity_token(self, hass: HomeAssistant) -> None:
        camera, _ = _kobra_x_camera(hass)
        component = MagicMock()
        component.get_entity.return_value = camera
        view = AnycubicCameraStreamView(component)
        view.handle = AsyncMock(return_value=MagicMock())
        request = MagicMock()
        request.query = {"token": "camera-token"}

        await view.get(request, camera.entity_id)

        view.handle.assert_awaited_once_with(request, camera)

    async def test_other_endpoints_keep_the_direct_path(self, hass: HomeAssistant) -> None:
        camera, coordinator = _kobra_x_camera(hass, "http://10.0.66.28:8080/flv")

        assert await camera.stream_source() == "http://10.0.66.28:8080/flv"
        coordinator.async_start_camera.assert_awaited_once_with(1)

    async def test_malformed_urls_keep_the_direct_path(self, hass: HomeAssistant) -> None:
        camera, coordinator = _kobra_x_camera(hass, "http://printer:not-a-port/flv")

        assert await camera.stream_source() == "http://printer:not-a-port/flv"
        coordinator.async_start_camera.assert_awaited_once_with(1)

    async def test_the_proxy_normalizes_206_without_touching_the_body(
        self,
        hass: HomeAssistant,
    ) -> None:
        camera, coordinator = _kobra_x_camera(hass)
        upstream = _upstream_response(
            HTTPStatus.PARTIAL_CONTENT,
            chunks=(b"FLV", b"video-bytes"),
        )
        session = MagicMock()
        session.get = AsyncMock(return_value=upstream)
        downstream = _downstream_response()

        with (
            patch(
                "custom_components.anycubic_cloud.camera.async_get_clientsession",
                return_value=session,
            ),
            patch(
                "custom_components.anycubic_cloud.camera.web.StreamResponse",
                return_value=downstream,
            ) as stream_response,
        ):
            response = await AnycubicCameraStreamView(MagicMock()).handle(
                MagicMock(),
                camera,
            )

        assert response is downstream
        coordinator.async_start_camera.assert_awaited_once_with(1)
        session.get.assert_awaited_once()
        timeout = session.get.await_args.kwargs["timeout"]
        assert timeout.total is None
        assert timeout.sock_connect == 10
        stream_response.assert_called_once_with(
            status=HTTPStatus.OK,
            headers={
                hdrs.CONTENT_TYPE: "video/x-flv",
                hdrs.CACHE_CONTROL: "no-store",
            },
        )
        assert [call.args[0] for call in downstream.write.await_args_list] == [
            b"FLV",
            b"video-bytes",
        ]
        downstream.write_eof.assert_awaited_once()
        upstream.release.assert_called_once()

    async def test_a_fixed_firmware_returning_200_is_also_accepted(
        self,
        hass: HomeAssistant,
    ) -> None:
        camera, _ = _kobra_x_camera(hass)
        upstream = _upstream_response(HTTPStatus.OK, content_type=None)
        session = MagicMock()
        session.get = AsyncMock(return_value=upstream)
        downstream = _downstream_response()

        with (
            patch(
                "custom_components.anycubic_cloud.camera.async_get_clientsession",
                return_value=session,
            ),
            patch(
                "custom_components.anycubic_cloud.camera.web.StreamResponse",
                return_value=downstream,
            ) as stream_response,
        ):
            await AnycubicCameraStreamView(MagicMock()).handle(MagicMock(), camera)

        assert stream_response.call_args.kwargs["headers"][hdrs.CONTENT_TYPE] == "video/x-flv"
        upstream.release.assert_called_once()

    async def test_upstream_http_errors_become_bad_gateway(self, hass: HomeAssistant) -> None:
        camera, _ = _kobra_x_camera(hass)
        upstream = _upstream_response(HTTPStatus.NOT_FOUND)
        session = MagicMock()
        session.get = AsyncMock(return_value=upstream)

        with (
            patch(
                "custom_components.anycubic_cloud.camera.async_get_clientsession",
                return_value=session,
            ),
            pytest.raises(web.HTTPBadGateway, match="HTTP 404"),
        ):
            await AnycubicCameraStreamView(MagicMock()).handle(MagicMock(), camera)

        upstream.release.assert_called_once()

    async def test_connection_errors_become_bad_gateway(self, hass: HomeAssistant) -> None:
        camera, _ = _kobra_x_camera(hass)
        session = MagicMock()
        session.get = AsyncMock(side_effect=ClientError("offline"))

        with (
            patch(
                "custom_components.anycubic_cloud.camera.async_get_clientsession",
                return_value=session,
            ),
            pytest.raises(web.HTTPBadGateway, match="Could not connect"),
        ):
            await AnycubicCameraStreamView(MagicMock()).handle(MagicMock(), camera)

    @pytest.mark.parametrize("stream_url", [None, "http://printer:18088/flv"])
    async def test_the_proxy_rejects_unavailable_or_unaffected_cameras(
        self,
        hass: HomeAssistant,
        stream_url: str | None,
    ) -> None:
        camera, coordinator = _local_camera(
            hass,
            stream_url,
            machine_type=20025,
        )
        expected = web.HTTPServiceUnavailable if stream_url is None else web.HTTPNotFound

        with pytest.raises(expected):
            await AnycubicCameraStreamView(MagicMock()).handle(MagicMock(), camera)

        coordinator.async_start_camera.assert_not_awaited()

    async def test_the_proxy_rejects_other_camera_integrations(self) -> None:
        with pytest.raises(web.HTTPNotFound):
            await AnycubicCameraStreamView(MagicMock()).handle(
                MagicMock(),
                MagicMock(spec=Camera),
            )
