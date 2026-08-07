"""Switches for Anycubic Cloud."""
from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING, Any

from homeassistant.components.switch import SwitchEntity, SwitchEntityDescription
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import EntityCategory, Platform
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
class AnycubicSwitchEntityDescription(
    SwitchEntityDescription, AnycubicCloudEntityDescription
):
    """Describes Anycubic Cloud switch entity."""

    # Report unknown rather than "off" when the printer hasn't said.
    #
    # bool(None) is False, which turns "I have not been told" into a
    # confident "it is off" -- and unlike a sensor, someone acts on a switch.
    # Reading off and flicking it on writes a setting based on a reading that
    # was never real. Returning None leaves the state unknown while keeping
    # the switch operable, so the first toggle both sets it and settles it.
    # Opt-in, so switches whose value always arrives keep their behaviour.
    unknown_when_none: bool = False


PRIMARY_MULTI_COLOR_BOX_SWITCH_TYPES: list[AnycubicSwitchEntityDescription] = list([
    AnycubicSwitchEntityDescription(
        key="multi_color_box_runout_refill",
        translation_key="multi_color_box_runout_refill",
        printer_entity_type=PrinterEntityType.ACE_PRIMARY,
    ),
])

SECONDARY_MULTI_COLOR_BOX_SWITCH_TYPES: list[AnycubicSwitchEntityDescription] = list([
    AnycubicSwitchEntityDescription(
        key="secondary_multi_color_box_runout_refill",
        translation_key="secondary_multi_color_box_runout_refill",
        printer_entity_type=PrinterEntityType.ACE_SECONDARY,
    ),
])

SWITCH_TYPES: list[AnycubicSwitchEntityDescription] = list([
    # Read-only until now: the printer reports whether AI print-failure
    # detection is on, but nothing could change it. Order 1243 does, with
    # every other setting preserved as the printer already has it. Belongs to
    # the printer, not the ACE -- it works on machines with no ACE fitted.
    #
    # The settings arrive unprompted over a local connection, but over the
    # cloud only in reply to a write, so this sits at unknown until either the
    # printer volunteers them or someone uses the switch.
    AnycubicSwitchEntityDescription(
        key="ai_detection_enabled",
        translation_key="ai_detection_enabled",
        printer_entity_type=PrinterEntityType.PRINTER,
        entity_category=EntityCategory.CONFIG,
        unknown_when_none=True,
    ),
])

GLOBAL_SWITCH_TYPES: list[AnycubicSwitchEntityDescription] = list([
    AnycubicSwitchEntityDescription(
        key="manual_mqtt_connection_enabled",
        translation_key="manual_mqtt_connection_enabled",
        entity_category=EntityCategory.DIAGNOSTIC,
        printer_entity_type=PrinterEntityType.GLOBAL,
    ),
])


async def async_setup_entry(
    hass: HomeAssistant, entry: ConfigEntry, async_add_entities: AddEntitiesCallback
) -> None:
    """Set up the Anycubic Cloud switch entry."""

    coordinator: AnycubicCloudDataUpdateCoordinator = entry.runtime_data
    coordinator.add_entities_for_seen_printers(
        async_add_entities=async_add_entities,
        entity_constructor=AnycubicSwitch,
        platform=Platform.SWITCH,
        available_descriptors=list(
            SWITCH_TYPES
            + PRIMARY_MULTI_COLOR_BOX_SWITCH_TYPES
            + SECONDARY_MULTI_COLOR_BOX_SWITCH_TYPES
            + GLOBAL_SWITCH_TYPES
        ),
    )


class AnycubicSwitch(AnycubicCloudEntity, SwitchEntity):
    """Representation of a Anycubic switch."""

    entity_description: AnycubicSwitchEntityDescription

    def __init__(
        self,
        hass: HomeAssistant,
        coordinator: AnycubicCloudDataUpdateCoordinator,
        printer_id: int,
        entity_description: AnycubicSwitchEntityDescription,
    ) -> None:
        """Initiate Anycubic Switch."""
        super().__init__(hass, coordinator, printer_id, entity_description)

    @property
    def is_on(self) -> bool | None:
        """Return true if the switch is on, None if the printer hasn't said."""
        state = printer_state_for_key(
            self.coordinator, self._printer_id, self.entity_description.key
        )

        if state is None and self.entity_description.unknown_when_none:
            return None

        return bool(state)

    async def async_turn_on(self, **kwargs: Any) -> None:
        """Turn the device on."""

        await self.coordinator.switch_on_event(self._printer_id, self.entity_description.key)

    async def async_turn_off(self, **kwargs: Any) -> None:
        """Turn the device off."""

        await self.coordinator.switch_off_event(self._printer_id, self.entity_description.key)
