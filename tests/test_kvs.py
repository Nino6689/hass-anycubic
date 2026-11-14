"""The Kinesis Video camera transport (#49).

Some accounts get no Agora block from the camera-open order, only temporary
AWS credentials for a Kinesis Video WebRTC signalling channel named after the
printer's key. Home Assistant joins it as a VIEWER: the browser's offer goes
out, the printer's answer and trickled candidates come back.

The SigV4 expectations were produced by botocore for the same inputs, so the
signer is checked against AWS's own implementation, not against itself.
"""

from __future__ import annotations

import asyncio
import base64
import json
from datetime import UTC, datetime
from typing import Any
from unittest.mock import AsyncMock, MagicMock, patch
from urllib.parse import parse_qs, urlsplit

import aiohttp
import pytest
from anycubic_cloud_api import AnycubicKvsCredentials
from homeassistant.components.camera import WebRTCAnswer, WebRTCCandidate
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import HomeAssistantError
from webrtc_models import RTCIceCandidateInit

from custom_components.anycubic_cloud.camera import CAMERA_TYPES, AnycubicCloudCamera
from custom_components.anycubic_cloud.kvs import KvsError, KvsStreamSession
from custom_components.anycubic_cloud.kvs import session as kvs_session
from custom_components.anycubic_cloud.kvs.sigv4 import (
    AwsCredentials,
    presigned_wss_url,
    signed_json_post,
)

NOW = datetime(2026, 11, 14, 10, 30, 0, tzinfo=UTC)
AWS = AwsCredentials("ASIAEXAMPLE", "secret/Key+Example", "token/with+chars==")
ARN = "arn:aws:kinesisvideo:eu-west-3:123456789012:channel/abc123/1"
WSS = "wss://v-1a2b3c4d.kinesisvideo.eu-west-3.amazonaws.com"


class TestSigV4:
    def test_the_json_post_matches_botocore(self) -> None:
        body, headers = signed_json_post(
            "https://kinesisvideo.eu-west-3.amazonaws.com/describeSignalingChannel",
            {"ChannelName": "abc123"},
            AWS,
            "eu-west-3",
            now=NOW,
        )

        assert json.loads(body) == {"ChannelName": "abc123"}
        assert headers["x-amz-date"] == "20261114T103000Z"
        assert headers["x-amz-security-token"] == AWS.session_token
        assert "host" not in headers
        assert headers["authorization"] == (
            "AWS4-HMAC-SHA256 Credential=ASIAEXAMPLE/20261114/eu-west-3/kinesisvideo/aws4_request, "
            "SignedHeaders=content-type;host;x-amz-date;x-amz-security-token, "
            "Signature=9fc791b64d0b67675050e5dfb3652ee87771fc20dbda3fca3dd8c0adf50a2c45"
        )

    def test_the_presigned_socket_url_matches_botocore(self) -> None:
        url = presigned_wss_url(
            WSS,
            {"X-Amz-ChannelARN": ARN, "X-Amz-ClientId": "ha-viewer-1"},
            AWS,
            "eu-west-3",
            now=NOW,
        )

        parts = urlsplit(url)
        query = parse_qs(parts.query)
        assert parts.scheme == "wss"
        assert parts.netloc == "v-1a2b3c4d.kinesisvideo.eu-west-3.amazonaws.com"
        assert query["X-Amz-ChannelARN"] == [ARN]
        assert query["X-Amz-Expires"] == ["299"]
        assert query["X-Amz-Security-Token"] == [AWS.session_token]
        assert query["X-Amz-Signature"] == ["aa225bd6c70f6ec5e120ef28371ff09942de7dd559a439eaad9ba8077aab594e"]

    def test_credentials_never_render(self) -> None:
        assert "ASIA" not in repr(AWS)
        assert "secret" not in repr(AWS)

    def test_no_session_token_leaves_it_out(self) -> None:
        bare = AwsCredentials("AKIA", "secret")
        _, headers = signed_json_post("https://h/x", {}, bare, "eu-west-3", now=NOW)
        assert "x-amz-security-token" not in headers
        assert "X-Amz-Security-Token" not in presigned_wss_url(WSS, {}, bare, "eu-west-3", now=NOW)


# --- a fake AWS control plane and signalling socket -------------------------


def _b64(payload: dict[str, Any]) -> str:
    return base64.b64encode(json.dumps(payload).encode()).decode()


class FakeResponse:
    def __init__(self, status: int, body: Any) -> None:
        self.status = status
        self._body = body if isinstance(body, str) else json.dumps(body)

    async def text(self) -> str:
        return self._body

    async def __aenter__(self) -> FakeResponse:
        return self

    async def __aexit__(self, *args: Any) -> None:
        return None


class FakeSocket:
    """A signalling socket the test scripts: it answers what the client sends."""

    def __init__(self, on_send: Any = None) -> None:
        self.sent: list[dict[str, Any]] = []
        self.closed = False
        self._inbox: asyncio.Queue[Any] = asyncio.Queue()
        self._on_send = on_send

    def push(self, message: dict[str, Any] | str) -> None:
        data = message if isinstance(message, str) else json.dumps(message)
        self._inbox.put_nowait(MagicMock(type=aiohttp.WSMsgType.TEXT, data=data))

    def hang_up(self) -> None:
        self._inbox.put_nowait(MagicMock(type=aiohttp.WSMsgType.CLOSED, data=None))

    async def send_str(self, data: str) -> None:
        message = json.loads(data)
        message["decoded"] = json.loads(base64.b64decode(message["messagePayload"]))
        self.sent.append(message)
        if self._on_send is not None:
            self._on_send(self, message)

    async def close(self) -> None:
        self.closed = True
        self.hang_up()

    def __aiter__(self) -> FakeSocket:
        return self

    async def __anext__(self) -> Any:
        message = await self._inbox.get()
        if message.type is aiohttp.WSMsgType.CLOSED:
            raise StopAsyncIteration
        return message


def _answer_every_offer(socket: FakeSocket, message: dict[str, Any]) -> None:
    if message["action"] == "SDP_OFFER":
        socket.push({"messageType": "SDP_ANSWER", "messagePayload": _b64({"type": "answer", "sdp": "v=0 answer"})})
        socket.push(
            {
                "messageType": "ICE_CANDIDATE",
                "messagePayload": _b64(
                    {"candidate": "candidate:1 1 udp 1 1.2.3.4 5 typ relay", "sdpMid": "0", "sdpMLineIndex": 0}
                ),
            }
        )


def _http(socket: FakeSocket, responses: list[FakeResponse] | None = None) -> MagicMock:
    http = MagicMock()
    http.post = MagicMock(
        side_effect=responses
        or [
            FakeResponse(200, {"ChannelInfo": {"ChannelARN": ARN}}),
            FakeResponse(
                200,
                {
                    "ResourceEndpointList": [
                        {"Protocol": "HTTPS", "ResourceEndpoint": "https://r-1.kinesisvideo.eu-west-3.amazonaws.com"},
                        {"Protocol": "WSS", "ResourceEndpoint": WSS},
                    ]
                },
            ),
        ]
    )
    http.ws_connect = AsyncMock(return_value=socket)
    return http


def _credentials() -> AnycubicKvsCredentials:
    creds = AnycubicKvsCredentials.from_order_response(
        {
            "token": {
                "region": "eu-west-3",
                "tmpSecretId": "ASIAEXAMPLE",
                "tmpSecretKey": "secret",
                "sessionToken": "session",
            }
        },
        "abc123",
    )
    assert creds is not None
    return creds


def _session(http: MagicMock, push_state: Any = None) -> tuple[KvsStreamSession, list[RTCIceCandidateInit]]:
    received: list[RTCIceCandidateInit] = []
    session = KvsStreamSession(
        session=http,
        credentials=_credentials(),
        logger=MagicMock(),
        on_candidate=received.append,
        push_state=push_state,
    )
    return session, received


@pytest.fixture(autouse=True)
def _fast(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(kvs_session, "ANSWER_WAIT", 0.05)
    monkeypatch.setattr(kvs_session, "PUSH_READY_TIMEOUT", 0.1)
    monkeypatch.setattr(kvs_session, "PUSH_READY_POLL", 0.01)


class TestTheViewerFlow:
    async def test_the_offer_is_answered_and_candidates_flow_both_ways(self) -> None:
        socket = FakeSocket(_answer_every_offer)
        http = _http(socket)
        session, received = _session(http)

        # A browser candidate that trickles in before the offer is out is held.
        await session.async_add_candidate(RTCIceCandidateInit("candidate:early", sdp_mid="0", sdp_m_line_index=0))
        answer = await session.async_start("v=0 offer", "s1")
        await asyncio.sleep(0)

        assert answer == "v=0 answer"
        offer = socket.sent[0]
        assert offer["action"] == "SDP_OFFER"
        assert offer["decoded"] == {"type": "offer", "sdp": "v=0 offer"}
        assert "recipientClientId" not in offer
        assert socket.sent[1]["action"] == "ICE_CANDIDATE"
        assert socket.sent[1]["decoded"] == {"candidate": "candidate:early", "sdpMid": "0", "sdpMLineIndex": 0}

        assert [c.candidate for c in received] == ["candidate:1 1 udp 1 1.2.3.4 5 typ relay"]
        assert received[0].sdp_m_line_index == 0

        # After the offer, candidates go straight out.
        await session.async_add_candidate(RTCIceCandidateInit("candidate:late"))
        # webrtc_models fills in line index 0 when neither is given.
        assert socket.sent[-1]["decoded"] == {"candidate": "candidate:late", "sdpMLineIndex": 0}
        assert session.is_connected

        await session.async_close()
        assert socket.closed
        assert not session.is_connected

    async def test_the_channel_is_looked_up_by_the_printer_key_as_a_viewer(self) -> None:
        socket = FakeSocket(_answer_every_offer)
        http = _http(socket)
        session, _ = _session(http)

        await session.async_start("v=0 offer", "s1")
        await session.async_close()

        describe, endpoint = (call.args[0] for call in http.post.call_args_list)
        assert describe == "https://kinesisvideo.eu-west-3.amazonaws.com/describeSignalingChannel"
        assert json.loads(http.post.call_args_list[0].kwargs["data"]) == {"ChannelName": "abc123"}
        assert endpoint.endswith("/getSignalingChannelEndpoint")
        body = json.loads(http.post.call_args_list[1].kwargs["data"])
        assert body["ChannelARN"] == ARN
        assert body["SingleMasterChannelEndpointConfiguration"]["Role"] == "VIEWER"

        url = http.ws_connect.call_args.args[0]
        query = parse_qs(urlsplit(url).query)
        assert query["X-Amz-ChannelARN"] == [ARN]
        assert query["X-Amz-ClientId"][0].startswith("ha-")

    async def test_the_offer_waits_for_the_printer_to_start_pushing(self) -> None:
        states = iter([None, "initSuccess", "pushStarted"])
        socket = FakeSocket(_answer_every_offer)
        session, _ = _session(_http(socket), push_state=lambda: next(states, "pushStarted"))

        assert await session.async_start("v=0 offer", "s1") == "v=0 answer"
        await session.async_close()

    async def test_no_push_report_still_sends_the_offer(self) -> None:
        socket = FakeSocket(_answer_every_offer)
        session, _ = _session(_http(socket), push_state=lambda: None)

        assert await session.async_start("v=0 offer", "s1") == "v=0 answer"
        await session.async_close()

    async def test_a_failed_push_is_reported(self) -> None:
        socket = FakeSocket(_answer_every_offer)
        session, _ = _session(_http(socket), push_state=lambda: "initFailed")

        with pytest.raises(KvsError, match="initFailed"):
            await session.async_start("v=0 offer", "s1")
        assert socket.sent == []
        assert socket.closed

    async def test_an_unanswered_offer_is_resent_then_given_up(self) -> None:
        socket = FakeSocket()
        session, _ = _session(_http(socket))

        with pytest.raises(KvsError, match="never answered"):
            await session.async_start("v=0 offer", "s1")
        assert [m["action"] for m in socket.sent] == ["SDP_OFFER"] * kvs_session.OFFER_ATTEMPTS

    async def test_a_late_first_answer_still_wins(self) -> None:
        def answer_second(socket: FakeSocket, message: dict[str, Any]) -> None:
            if len(socket.sent) == 2:
                _answer_every_offer(socket, message)

        socket = FakeSocket(answer_second)
        session, _ = _session(_http(socket))

        assert await session.async_start("v=0 offer", "s1") == "v=0 answer"
        await session.async_close()


class TestFailures:
    async def test_aws_refusing_the_credentials_is_reported(self) -> None:
        http = _http(FakeSocket(), [FakeResponse(403, {"message": "The security token included in the request is expired"})])
        session, _ = _session(http)

        with pytest.raises(KvsError, match="403.*expired"):
            await session.async_start("v=0 offer", "s1")

    @pytest.mark.parametrize(
        "replies",
        [
            [FakeResponse(200, {"ChannelInfo": {}})],
            [FakeResponse(200, "not json")],
            [FakeResponse(200, [1, 2])],
            [FakeResponse(200, {"ChannelInfo": {"ChannelARN": ARN}}), FakeResponse(200, {"ResourceEndpointList": []})],
            [FakeResponse(500, "plain text error")],
        ],
    )
    async def test_unusable_control_plane_replies(self, replies: list[FakeResponse]) -> None:
        session, _ = _session(_http(FakeSocket(), replies))

        with pytest.raises(KvsError):
            await session.async_start("v=0 offer", "s1")

    async def test_a_network_failure_is_a_kvs_error(self) -> None:
        http = _http(FakeSocket())
        http.post = MagicMock(side_effect=aiohttp.ClientConnectionError("down"))
        session, _ = _session(http)

        with pytest.raises(KvsError, match="Could not reach"):
            await session.async_start("v=0 offer", "s1")

    async def test_an_unexpected_failure_is_wrapped(self) -> None:
        http = _http(FakeSocket())
        http.post = MagicMock(side_effect=RuntimeError("boom"))
        session, _ = _session(http)

        with pytest.raises(KvsError, match="boom"):
            await session.async_start("v=0 offer", "s1")

    async def test_a_signalling_error_fails_the_answer(self) -> None:
        def refuse(socket: FakeSocket, message: dict[str, Any]) -> None:
            socket.push(
                {
                    "messageType": "STATUS_RESPONSE",
                    "statusResponse": {"errorType": "InvalidArgumentException", "statusCode": "400", "description": "bad sdp"},
                }
            )

        session, _ = _session(_http(FakeSocket(refuse)))

        with pytest.raises(KvsError, match="InvalidArgumentException 400 bad sdp"):
            await session.async_start("v=0 offer", "s1")

    async def test_a_success_status_is_not_an_error(self) -> None:
        def ok_then_answer(socket: FakeSocket, message: dict[str, Any]) -> None:
            socket.push({"messageType": "STATUS_RESPONSE", "statusResponse": {"statusCode": "200"}})
            _answer_every_offer(socket, message)

        session, _ = _session(_http(FakeSocket(ok_then_answer)))
        assert await session.async_start("v=0 offer", "s1") == "v=0 answer"
        await session.async_close()

    async def test_an_unreadable_answer_fails(self) -> None:
        def garble(socket: FakeSocket, message: dict[str, Any]) -> None:
            socket.push({"messageType": "SDP_ANSWER", "messagePayload": "!!!"})

        session, _ = _session(_http(FakeSocket(garble)))
        with pytest.raises(KvsError, match="unreadable answer"):
            await session.async_start("v=0 offer", "s1")

    async def test_the_socket_closing_before_an_answer_fails(self) -> None:
        def hang_up(socket: FakeSocket, message: dict[str, Any]) -> None:
            socket.hang_up()

        session, _ = _session(_http(FakeSocket(hang_up)))
        with pytest.raises(KvsError, match="closed the signalling socket"):
            await session.async_start("v=0 offer", "s1")

    async def test_noise_on_the_socket_is_ignored(self) -> None:
        def noisy(socket: FakeSocket, message: dict[str, Any]) -> None:
            socket.push("")
            socket.push("not json")
            socket.push("[1]")
            socket.push({"messageType": "GO_AWAY"})
            socket.push({"messageType": "ICE_CANDIDATE", "messagePayload": "!!!"})
            _answer_every_offer(socket, message)
            # A second answer after the first changes nothing.
            socket.push({"messageType": "SDP_ANSWER", "messagePayload": _b64({"type": "answer", "sdp": "other"})})

        session, received = _session(_http(FakeSocket(noisy)))
        assert await session.async_start("v=0 offer", "s1") == "v=0 answer"
        await asyncio.sleep(0.01)
        assert len(received) == 1
        await session.async_close()

    async def test_a_session_starts_once(self) -> None:
        session, _ = _session(_http(FakeSocket(_answer_every_offer)))
        await session.async_start("v=0 offer", "s1")
        with pytest.raises(KvsError, match="already been started"):
            await session.async_start("v=0 offer", "s1")
        await session.async_close()
        await session.async_close()

        closed, _ = _session(_http(FakeSocket()))
        await closed.async_close()
        with pytest.raises(KvsError, match="already been closed"):
            await closed.async_start("v=0 offer", "s1")
        # Candidates for a closed session go nowhere, quietly.
        await closed.async_add_candidate(RTCIceCandidateInit("candidate:x"))

    async def test_sending_on_a_closed_socket_fails(self) -> None:
        session, _ = _session(_http(FakeSocket()))
        with pytest.raises(KvsError, match="closed"):
            await session._async_send("SDP_OFFER", {})


class TestTheCameraPicksTheTransport:
    def _camera(self, hass: HomeAssistant, credentials: Any) -> tuple[AnycubicCloudCamera, MagicMock]:
        coordinator = MagicMock()
        printer = MagicMock(camera_push_state="pushStarted")
        coordinator.printers = {1: printer}
        coordinator.async_open_cloud_camera = AsyncMock(return_value=credentials)
        with patch.object(AnycubicCloudCamera, "__init__", lambda self, *a, **k: None):
            camera = AnycubicCloudCamera()
        camera.coordinator = coordinator
        camera._printer_id = 1
        camera.entity_description = CAMERA_TYPES[1]
        camera._sessions = {}
        camera.hass = hass
        return camera, printer

    async def test_kvs_credentials_open_a_kvs_session(self, hass: HomeAssistant) -> None:
        camera, _ = self._camera(hass, _credentials())
        messages: list[Any] = []

        with patch("custom_components.anycubic_cloud.camera.KvsStreamSession") as session_class:
            session = session_class.return_value
            session.async_start = AsyncMock(return_value="v=0 answer")
            await camera.async_handle_async_webrtc_offer("v=0 offer", "s1", messages.append)

            kwargs = session_class.call_args.kwargs
            # The printer's trickled candidates reach the browser.
            kwargs["on_candidate"](RTCIceCandidateInit("candidate:1"))
            assert kwargs["push_state"]() == "pushStarted"

        assert isinstance(messages[0], WebRTCAnswer)
        assert isinstance(messages[1], WebRTCCandidate)
        assert camera._sessions["s1"] is session

    async def test_a_failed_kvs_session_is_reported_and_dropped(self, hass: HomeAssistant) -> None:
        camera, _ = self._camera(hass, _credentials())

        with patch("custom_components.anycubic_cloud.camera.KvsStreamSession") as session_class:
            session = session_class.return_value
            session.async_start = AsyncMock(side_effect=KvsError("never answered"))
            session.async_close = AsyncMock()
            with pytest.raises(HomeAssistantError, match="never answered"):
                await camera.async_handle_async_webrtc_offer("v=0 offer", "s1", MagicMock())

        assert camera._sessions == {}
        session.async_close.assert_awaited()


class TestTheCoordinatorAsksForEither:
    async def test_kvs_credentials_are_returned_and_the_push_state_reset(self) -> None:
        from custom_components.anycubic_cloud.coordinator import (
            AnycubicCloudDataUpdateCoordinator,
        )

        coordinator = MagicMock()
        printer = MagicMock()
        coordinator.printers = {1: printer}
        credentials = _credentials()
        coordinator.anycubic_api.send_anycubic_camera_open_order = AsyncMock(return_value=credentials)

        result = await AnycubicCloudDataUpdateCoordinator.async_open_cloud_camera(coordinator, 1)

        assert result is credentials
        printer.clear_camera_push_state.assert_called_once()

    async def test_neither_transport_is_an_honest_error(self) -> None:
        from custom_components.anycubic_cloud.coordinator import (
            AnycubicCloudDataUpdateCoordinator,
        )

        coordinator = MagicMock()
        coordinator.printers = {1: MagicMock()}
        coordinator.anycubic_api.send_anycubic_camera_open_order = AsyncMock(return_value=None)

        with pytest.raises(HomeAssistantError, match="no camera credentials"):
            await AnycubicCloudDataUpdateCoordinator.async_open_cloud_camera(coordinator, 1)
