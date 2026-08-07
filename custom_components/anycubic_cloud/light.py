"""Lights for Anycubic Cloud."""
from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING, Any

from homeassistant.components.light import (
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

    # On/off only. The printer accepts a brightness field and reports one
    # back, but the light does not dim: Anycubic's own slicer only ever
    # sends 0 or 100, intermediate values change nothing on a Kobra S1,
    # and the printer sends no light report in response to them. A slider
    # that does nothing is worse than no slider.
    _attr_color_mode = ColorMode.ONOFF
    _attr_supported_color_modes = {ColorMode.ONOFF}

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

    async def async_turn_on(self, **kwargs: Any) -> None:
        """Turn the light on. Full brightness is the only setting there is."""
        await self.coordinator.set_printer_light(
            self._printer_id,
            light_on=True,
            brightness=100,
        )

    async def async_turn_off(self, **kwargs: Any) -> None:
        """Turn the light off."""
        await self.coordinator.set_printer_light(
            self._printer_id,
            light_on=False,
        )
