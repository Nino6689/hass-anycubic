"""Lights for Anycubic Cloud."""
from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING, Any

from homeassistant.components.light import (
    ATTR_BRIGHTNESS,
    ColorMode,
    LightEntity,
    LightEntityDescription,
)
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from .const import (
    PrinterEntityType,
)
from .entity import AnycubicCloudEntity, AnycubicCloudEntityDescription
from .helpers import printer_state_for_key

# All data comes from the shared coordinator, and writes go through the
# cloud API one request at a time, so no per-entity parallelism is wanted.
PARALLEL_UPDATES = 0

if TYPE_CHECKING:
    from .coordinator import AnycubicCloudDataUpdateCoordinator


@dataclass(frozen=True)
class AnycubicLightEntityDescription(
    LightEntityDescription, AnycubicCloudEntityDescription
):
    """Describes Anycubic Cloud light entity."""


LIGHT_TYPES: list[AnycubicLightEntityDescription] = list([
    AnycubicLightEntityDescription(
        key="printer_light",
        translation_key="printer_light",
        printer_entity_type=PrinterEntityType.PRINTER,
    ),
])


async def async_setup_entry(
    hass: HomeAssistant, entry: ConfigEntry, async_add_entities: AddEntitiesCallback
) -> None:
    """Set up the Anycubic Cloud light entry."""

    coordinator: AnycubicCloudDataUpdateCoordinator = entry.runtime_data
    coordinator.add_entities_for_seen_printers(
        async_add_entities=async_add_entities,
        entity_constructor=AnycubicLight,
        platform=Platform.LIGHT,
        available_descriptors=list(LIGHT_TYPES),
    )


class AnycubicLight(AnycubicCloudEntity, LightEntity):
    """Representation of an Anycubic printer light."""

    entity_description: AnycubicLightEntityDescription

    _attr_color_mode = ColorMode.BRIGHTNESS
    _attr_supported_color_modes = {ColorMode.BRIGHTNESS}

    def __init__(
        self,
        hass: HomeAssistant,
        coordinator: AnycubicCloudDataUpdateCoordinator,
        printer_id: int,
        entity_description: AnycubicLightEntityDescription,
    ) -> None:
        """Initiate Anycubic Light."""
        super().__init__(hass, coordinator, printer_id, entity_description)

    @property
    def available(self) -> bool:
        # The printer reports its lights over MQTT. Until it has, we don't know
        # that it has one -- resin printers and older models may not.
        return bool(
            printer_state_for_key(
                self.coordinator, self._printer_id, "has_controllable_light"
            )
        )

    @property
    def is_on(self) -> bool:
        return bool(
            printer_state_for_key(self.coordinator, self._printer_id, "printer_light")
        )

    @property
    def brightness(self) -> int | None:
        """Anycubic reports 0-100; Home Assistant expects 0-255."""
        pct = printer_state_for_key(
            self.coordinator, self._printer_id, "printer_light_brightness"
        )

        if pct is None:
            return None

        return round(int(pct) * 255 / 100)

    async def async_turn_on(self, **kwargs: Any) -> None:
        """Turn the light on, optionally at a given brightness."""
        brightness_pct: int | None = None

        if ATTR_BRIGHTNESS in kwargs:
            brightness_pct = max(1, round(int(kwargs[ATTR_BRIGHTNESS]) * 100 / 255))

        await self.coordinator.set_printer_light(
            self._printer_id,
            light_on=True,
            brightness=brightness_pct,
        )

    async def async_turn_off(self, **kwargs: Any) -> None:
        """Turn the light off."""
        await self.coordinator.set_printer_light(
            self._printer_id,
            light_on=False,
        )
