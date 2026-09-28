"""The job preview picture (BEHAVIOUR §2.3, B23). Cloud only.

A PNG fetched from the job's preview URL; the cached picture is dropped
whenever the URL changes. Unavailable with no URL, rather than serving an
error that dashboards draw as a broken image.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING

from homeassistant.components.image import ImageEntity, ImageEntityDescription
from homeassistant.core import callback
from homeassistant.util import dt as dt_util

from .entity import AnycubicEntity, AnycubicEntityDescription, async_add_when_ready

if TYPE_CHECKING:
    from homeassistant.core import HomeAssistant
    from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

    from .coordinator import AnycubicConfigEntry, AnycubicCoordinator


@dataclass(frozen=True, kw_only=True)
class AnycubicImageDescription(AnycubicEntityDescription, ImageEntityDescription):
    """The job preview."""


JOB_PREVIEW = AnycubicImageDescription(key="job_image_url", cloud_only=True)


async def async_setup_entry(
    hass: HomeAssistant,
    entry: AnycubicConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Set up the job preview of a config entry."""
    async_add_when_ready(
        entry.runtime_data, (JOB_PREVIEW,), JobPreview, async_add_entities
    )


class JobPreview(AnycubicEntity, ImageEntity):
    """The current job's preview picture."""

    entity_description: AnycubicImageDescription
    _attr_content_type = "image/png"

    def __init__(
        self, coordinator: AnycubicCoordinator, description: AnycubicImageDescription
    ) -> None:
        AnycubicEntity.__init__(self, coordinator, description)
        ImageEntity.__init__(self, coordinator.hass)
        self._url = self.printer.job_image_url
        self._attr_image_url = self._url
        self._attr_image_last_updated = dt_util.utcnow()

    @property
    def available(self) -> bool:
        return super().available and self._url is not None

    @callback
    def _handle_coordinator_update(self) -> None:
        url = self.printer.job_image_url
        if url != self._url:
            # A new URL: the cached picture is dropped and fetched again.
            self._url = url
            self._attr_image_url = url
            self._cached_image = None
            self._attr_image_last_updated = dt_util.utcnow()
        super()._handle_coordinator_update()
