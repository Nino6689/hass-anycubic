"""The printer's built-in camera, over both transports.

The printer serves two entirely different streams and neither can stand in for
the other, so each gets its own entity:

* ``camera`` -- local only. The printer names its own HTTP-FLV endpoint in the
  discovery document and the cloud never does. The stream stays closed until
  the printer is told to start capturing, so that command goes out whenever a
  stream is asked for. This one can produce still images.
* ``cloud_camera`` -- Agora ("shengwang") WebRTC, which is what the cloud
  offers. The browser is the WebRTC peer and Home Assistant only brokers the
  signalling, so no video passes through Home Assistant -- and therefore no
  snapshots, entity picture or recording on this entity.

They cannot be merged: Home Assistant decides a camera's stream type from
whether its class overrides ``async_handle_async_webrtc_offer``, once, for the
whole class. Defining it on the local camera would silently drop the HLS path.
"""

from __future__ import annotations

import secrets
from dataclasses import dataclass, replace
from http import HTTPStatus
from pathlib import Path
from typing import TYPE_CHECKING, Any
from urllib.parse import urlsplit

from aiohttp import ClientError, ClientTimeout, hdrs, web
from homeassistant.components.camera import (
    Camera,
    CameraEntityDescription,
    CameraEntityFeature,
    CameraView,
    WebRTCAnswer,
    WebRTCSendMessage,
)
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant, callback
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.network import get_url
from webrtc_models import RTCIceCandidateInit

from .agora import AgoraError, AgoraStreamSession
from .const import CAMERA_STREAM_PORT, LOGGER, PrinterEntityType
from .entity import AnycubicCloudEntity, AnycubicCloudEntityDescription

# One camera per printer, and starting the stream is a single cloud-free
# publish, so there is nothing to serialise.
PARALLEL_UPDATES = 0

_KOBRA_X_MODEL_ID = "20030"
_LOCAL_STREAM_PROXY_URL = "/api/anycubic_cloud/camera_stream/{entity_id}"
_STREAM_CHUNK_SIZE = 64 * 1024
_STREAM_CONNECT_TIMEOUT = 10

if TYPE_CHECKING:
    from .coordinator import AnycubicCloudDataUpdateCoordinator


@dataclass(frozen=True)
class AnycubicCameraEntityDescription(
    CameraEntityDescription, AnycubicCloudEntityDescription
):
    """Describes an Anycubic Cloud camera entity."""

    # Which entity class serves this descriptor. The two transports need
    # different classes because the stream type is decided per class.
    entity_class: type[AnycubicCloudEntity] | None = None


CAMERA_TYPES: list[AnycubicCameraEntityDescription] = list([
    AnycubicCameraEntityDescription(
        key="camera",
        translation_key="camera",
        printer_entity_type=PrinterEntityType.PRINTER,
        entity_class=None,  # set below, the classes are defined further down
    ),
    AnycubicCameraEntityDescription(
        key="cloud_camera",
        translation_key="cloud_camera",
        printer_entity_type=PrinterEntityType.PRINTER,
        entity_class=None,
    ),
])


async def async_setup_entry(
    hass: HomeAssistant, entry: ConfigEntry, async_add_entities: AddEntitiesCallback
) -> None:
    """Set up the Anycubic Cloud camera entry."""

    coordinator: AnycubicCloudDataUpdateCoordinator = entry.runtime_data
    coordinator.add_entities_for_seen_printers(
        async_add_entities=async_add_entities,
        entity_constructor=_build_camera,
        platform=Platform.CAMERA,
        available_descriptors=list(CAMERA_TYPES),
    )


_PLACEHOLDER_PATH = Path(__file__).parent / "agora" / "cloud_camera_placeholder.png"
_placeholder_cache: bytes | None = None


async def _async_placeholder_image(hass: HomeAssistant) -> bytes | None:
    """The cloud camera's still, read from disk once and kept."""
    global _placeholder_cache

    if _placeholder_cache is None:
        try:
            _placeholder_cache = await hass.async_add_executor_job(
                _PLACEHOLDER_PATH.read_bytes
            )
        except OSError as err:
            LOGGER.warning("Could not read the cloud camera placeholder: %s", err)
            return None

    return _placeholder_cache


def _build_camera(
    hass: HomeAssistant,
    coordinator: AnycubicCloudDataUpdateCoordinator,
    printer_id: int,
    description: AnycubicCameraEntityDescription,
) -> AnycubicCloudEntity:
    """Pick the entity class the descriptor asks for."""
    entity_class = description.entity_class

    if entity_class is None:
        raise ValueError(
            f"Camera descriptor {description.key} has no entity_class."
        )

    return entity_class(hass, coordinator, printer_id, description)


class AnycubicCamera(AnycubicCloudEntity, Camera):
    """The printer's camera, served straight off the printer."""

    entity_description: AnycubicCameraEntityDescription
    # Without this Home Assistant never calls stream_source at all, so the
    # entity exists, reports idle, and shows nothing -- which is exactly what
    # it has been doing.
    _attr_supported_features = CameraEntityFeature.STREAM

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        """Initialise both halves -- Camera keeps its own state."""
        super().__init__(*args, **kwargs)
        Camera.__init__(self)
        self._stream_proxy_token = secrets.token_urlsafe(32)

    @property
    def _stream_url(self) -> str | None:
        return self.coordinator.camera_stream_url(self._printer_id)

    @property
    def available(self) -> bool:
        # The printer names the stream over a local connection; on a cloud
        # connection it can still be reached if the printer's address is
        # known. With neither, stay unavailable rather than offer a dead URL.
        return super().available and self._stream_url is not None

    async def stream_source(self) -> str | None:
        """Where to read the video from, having asked the printer to send it."""
        url = self._stream_url

        if url is None:
            return None

        if self._needs_stream_proxy(url):
            if self.entity_id is None:
                return None

            base_url = get_url(
                self.hass,
                allow_external=False,
                prefer_external=False,
            ).rstrip("/")
            path = _LOCAL_STREAM_PROXY_URL.format(entity_id=self.entity_id)
            return f"{base_url}{path}?token={self._stream_proxy_token}"

        await self.coordinator.async_start_camera(self._printer_id)

        return url

    def _needs_stream_proxy(self, url: str) -> bool:
        """Return whether this is the Kobra X endpoint that misreports 206."""
        printer = self.coordinator.get_printer_for_id(self._printer_id)

        if printer is None or str(printer.machine_type) != _KOBRA_X_MODEL_ID:
            return False

        try:
            parsed = urlsplit(url)
            return parsed.scheme == "http" and parsed.port == CAMERA_STREAM_PORT
        except ValueError:
            return False

    @property
    def use_stream_for_stills(self) -> bool:
        """Take stills from the stream Home Assistant already has open.

        The printer serves video and nothing else -- there is no snapshot
        endpoint to ask -- so a still has to come out of the stream. Home
        Assistant does that itself for stream-only cameras when this is set,
        reusing the connection go2rtc is already holding.

        2.2.0 did it by hand instead, opening a second ffmpeg straight at the
        printer's FLV endpoint. That competed with the live view for a stream
        the printer only serves once: the snapshot blocked until Home
        Assistant's ten-second limit gave up, and the live view came back
        "DESCRIBE failed: 404" because the stream it wanted had been pulled
        out from under it (#20, reported on 2.2.0 by the same person the
        original fix was for). Nothing about that was visible from the tests,
        which only ever proved ffmpeg had been called.
        """
        return True


class AnycubicCameraStreamView(CameraView):
    """Normalize the Kobra X's valid HTTP-FLV response for Home Assistant."""

    url = _LOCAL_STREAM_PROXY_URL
    name = "api:anycubic_cloud:camera_stream"

    async def get(
        self,
        request: web.Request,
        entity_id: str,
    ) -> web.StreamResponse:
        """Authorize the internal consumer with a stable per-entity token."""
        camera = self.component.get_entity(entity_id)

        if not isinstance(camera, AnycubicCamera):
            raise web.HTTPNotFound

        token = request.query.get("token", "")
        if not secrets.compare_digest(token, camera._stream_proxy_token):
            raise web.HTTPForbidden

        if not camera.is_on:
            raise web.HTTPServiceUnavailable

        return await self.handle(request, camera)

    async def handle(
        self,
        request: web.Request,
        camera: Camera,
    ) -> web.StreamResponse:
        """Relay the stream unchanged, replacing the incorrect 206 with 200."""
        if not isinstance(camera, AnycubicCamera):
            raise web.HTTPNotFound

        source_url = camera._stream_url

        if source_url is None:
            raise web.HTTPServiceUnavailable

        if not camera._needs_stream_proxy(source_url):
            raise web.HTTPNotFound

        await camera.coordinator.async_start_camera(camera._printer_id)

        try:
            upstream = await async_get_clientsession(camera.hass).get(
                source_url,
                timeout=ClientTimeout(
                    total=None,
                    sock_connect=_STREAM_CONNECT_TIMEOUT,
                    sock_read=None,
                ),
            )
        except (ClientError, TimeoutError) as err:
            raise web.HTTPBadGateway(reason="Could not connect to the printer camera") from err

        try:
            if upstream.status not in (HTTPStatus.OK, HTTPStatus.PARTIAL_CONTENT):
                raise web.HTTPBadGateway(
                    reason=f"Printer camera returned HTTP {upstream.status}"
                )

            response = web.StreamResponse(
                status=HTTPStatus.OK,
                headers={
                    hdrs.CONTENT_TYPE: upstream.headers.get(
                        hdrs.CONTENT_TYPE,
                        "video/x-flv",
                    ),
                    hdrs.CACHE_CONTROL: "no-store",
                },
            )
            await response.prepare(request)

            async for chunk in upstream.content.iter_chunked(_STREAM_CHUNK_SIZE):
                await response.write(chunk)

            await response.write_eof()
            return response
        finally:
            upstream.release()


class AnycubicCloudCamera(AnycubicCloudEntity, Camera):
    """The printer's camera over the cloud, as Agora WebRTC.

    Home Assistant only brokers the signalling -- the browser is the WebRTC
    peer and the media goes straight from Agora's edge to the browser, never
    through Home Assistant. That is what keeps this cheap and what makes it
    work unchanged over a remote connection, and it is also why there are no
    still images here.
    """

    entity_description: AnycubicCameraEntityDescription
    # Overriding async_handle_async_webrtc_offer is what makes Home Assistant
    # treat this entity as WebRTC; it is decided per class, once.
    _attr_supported_features = CameraEntityFeature.STREAM

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        """Initialise both halves -- Camera keeps its own state."""
        super().__init__(*args, **kwargs)
        Camera.__init__(self)
        self._sessions: dict[str, AgoraStreamSession] = {}

    @property
    def available(self) -> bool:
        # Needs the cloud, not the local connection. The printer being loaded
        # at all means the cloud answered for it.
        if not super().available or self._printer_id not in self.coordinator.printers:
            return False

        # Only hide the camera once the printer has positively said it has
        # none. Silence means it has not answered the peripherals poll yet,
        # and hiding a working camera because a poll is in flight is the worse
        # of the two mistakes.
        has_camera = self.coordinator.printers[self._printer_id].has_peripheral_camera

        return has_camera is not False

    async def async_camera_image(
        self,
        width: int | None = None,
        height: int | None = None,
    ) -> bytes | None:
        """A placeholder, because no still can exist on this transport.

        The video goes straight from Agora's edge to the browser and never
        passes through Home Assistant, so there is no frame here to hand back
        and no snapshot endpoint on Anycubic's side either -- the SDK's own
        capture is a browser canvas call.

        Without this the card falls back to Home Assistant's broken-image
        placeholder, which reads as a fault rather than as "this one is live
        only". Returning something deliberate is the difference between a
        dashboard that looks wrong and one that looks intentional.
        """
        return await _async_placeholder_image(self.hass)

    async def async_handle_async_webrtc_offer(
        self,
        offer_sdp: str,
        session_id: str,
        send_message: WebRTCSendMessage,
    ) -> None:
        """Join the printer's Agora channel and answer the browser."""
        # Credentials are single use -- client_uid is issued fresh every call
        # -- so this happens per session and is never cached.
        credentials = await self.coordinator.async_open_cloud_camera(
            self._printer_id,
        )

        session = AgoraStreamSession(
            session=async_get_clientsession(self.hass),
            credentials=credentials,
            logger=LOGGER,
        )
        self._sessions[session_id] = session

        try:
            answer_sdp = await session.async_start(
                offer_sdp=offer_sdp,
                session_id=session_id,
            )
        except AgoraError as err:
            self._sessions.pop(session_id, None)
            await session.async_close()
            raise HomeAssistantError(
                f"Could not open the Anycubic cloud camera: {err}"
            ) from err
        except Exception:
            self._sessions.pop(session_id, None)
            await session.async_close()
            raise

        send_message(WebRTCAnswer(answer_sdp))

    async def async_on_webrtc_candidate(
        self,
        session_id: str,
        candidate: RTCIceCandidateInit,
    ) -> None:
        """Pass a browser ICE candidate on to Agora."""
        session = self._sessions.get(session_id)

        if session is None:
            return

        await session.async_add_candidate(candidate)

    @callback
    def close_webrtc_session(self, session_id: str) -> None:
        """Tear the session down. Called by Home Assistant, so never blocks."""
        session = self._sessions.pop(session_id, None)

        if session is None:
            return

        self.hass.async_create_task(
            session.async_close(),
            name=f"anycubic close agora session {session_id}",
        )

    async def async_will_remove_from_hass(self) -> None:
        """Drop every live session with the entity."""
        sessions = list(self._sessions.values())
        self._sessions.clear()

        for session in sessions:
            await session.async_close()

        await super().async_will_remove_from_hass()


# Declared after the classes exist.
CAMERA_TYPES[0] = replace(CAMERA_TYPES[0], entity_class=AnycubicCamera)
CAMERA_TYPES[1] = replace(CAMERA_TYPES[1], entity_class=AnycubicCloudCamera)
