"""The printer's built-in camera.

Only available over the local connection: the printer names its own stream
endpoint in the discovery document, and the cloud never does. The stream is
HTTP-FLV and stays closed until the printer is told to start capturing, so
that command goes out whenever a stream is asked for.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING, Any

from homeassistant.components.camera import Camera, CameraEntityDescription, CameraEntityFeature
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from .const import PrinterEntityType
from .entity import AnycubicCloudEntity, AnycubicCloudEntityDescription

# One camera per printer, and starting the stream is a single cloud-free
# publish, so there is nothing to serialise.
PARALLEL_UPDATES = 0

if TYPE_CHECKING:
    from .coordinator import AnycubicCloudDataUpdateCoordinator


@dataclass(frozen=True)
class AnycubicCameraEntityDescription(
    CameraEntityDescription, AnycubicCloudEntityDescription
):
    """Describes an Anycubic Cloud camera entity."""


CAMERA_TYPES: list[AnycubicCameraEntityDescription] = list([
    AnycubicCameraEntityDescription(
        key="camera",
        translation_key="camera",
        printer_entity_type=PrinterEntityType.PRINTER,
    )
])


async def async_setup_entry(
    hass: HomeAssistant, entry: ConfigEntry, async_add_entities: AddEntitiesCallback
) -> None:
    """Set up the Anycubic Cloud camera entry."""

    coordinator: AnycubicCloudDataUpdateCoordinator = entry.runtime_data
    coordinator.add_entities_for_seen_printers(
        async_add_entities=async_add_entities,
        entity_constructor=AnycubicCamera,
        platform=Platform.CAMERA,
        available_descriptors=list(CAMERA_TYPES),
    )


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

        await self.coordinator.async_start_camera(self._printer_id)

        return url
