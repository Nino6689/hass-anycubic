"""Support for Anycubic Cloud button."""
from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING, Any

from homeassistant.components.button import ButtonEntity, ButtonEntityDescription
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import EntityCategory, Platform
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from .const import (
    ACE_SLOT_COUNT,
    ENTITY_ID_DRYING_START_PRESET_,
    MAX_DRYING_PRESETS,
    PrinterEntityType,
)
from .entity import AnycubicCloudEntity, AnycubicCloudEntityDescription
from .helpers import printer_attributes_for_key

# All data comes from the shared coordinator, and writes go through the
# cloud API one request at a time, so no per-entity parallelism is wanted.
PARALLEL_UPDATES = 0

if TYPE_CHECKING:
    from .coordinator import AnycubicCloudDataUpdateCoordinator


@dataclass(frozen=True)
class AnycubicButtonEntityDescription(
    ButtonEntityDescription, AnycubicCloudEntityDescription
):
    """Describes Anycubic Cloud button entity."""


# Zero a slot's consumption estimate. Swapping a spool is normally detected
# automatically from its colour, material and SKU, but two identical reels look
# the same, so this covers that case.
# Nozzle wear is tracked in filament pushed through, so fitting a new nozzle
# has to be told to it -- there is nothing the printer reports that would
# reveal a nozzle change on its own.
NOZZLE_BUTTON_TYPES: list[AnycubicButtonEntityDescription] = list([
    AnycubicButtonEntityDescription(
        key="reset_nozzle_wear",
        translation_key="reset_nozzle_wear",
        printer_entity_type=PrinterEntityType.PRINTER,
        entity_category=EntityCategory.CONFIG,
        entity_registry_enabled_default=False,
    ),
])


BUTTON_TYPES_AXIS: list[AnycubicButtonEntityDescription] = list([
    AnycubicButtonEntityDescription(
        key="request_axis_position",
        translation_key="request_axis_position",
        printer_entity_type=PrinterEntityType.PRINTER,
        entity_category=EntityCategory.DIAGNOSTIC,
        entity_registry_enabled_default=False,
    ),
])


PRIMARY_SPOOL_RESET_BUTTON_TYPES: list[AnycubicButtonEntityDescription] = list([
    AnycubicButtonEntityDescription(
        key=f"ace_slot_{slot_num}_reset_spool",
        translation_key=f"ace_slot_{slot_num}_reset_spool",
        printer_entity_type=PrinterEntityType.ACE_PRIMARY,
        entity_category=EntityCategory.CONFIG,
        entity_registry_enabled_default=False,
    )
    for slot_num in range(1, ACE_SLOT_COUNT + 1)
])


PRIMARY_DRYING_PRESET_BUTTON_TYPES: list[AnycubicButtonEntityDescription] = list([
    AnycubicButtonEntityDescription(
        key=f"{ENTITY_ID_DRYING_START_PRESET_}{x + 1}",
        translation_key=f"{ENTITY_ID_DRYING_START_PRESET_}{x + 1}",
        printer_entity_type=PrinterEntityType.DRY_PRESET_PRIMARY,
    ) for x in range(MAX_DRYING_PRESETS)
])

SECONDARY_DRYING_PRESET_BUTTON_TYPES: list[AnycubicButtonEntityDescription] = list([
    AnycubicButtonEntityDescription(
        key=f"secondary_{ENTITY_ID_DRYING_START_PRESET_}{x + 1}",
        translation_key=f"secondary_{ENTITY_ID_DRYING_START_PRESET_}{x + 1}",
        printer_entity_type=PrinterEntityType.DRY_PRESET_SECONDARY,
    ) for x in range(MAX_DRYING_PRESETS)
])

PRIMARY_MULTI_COLOR_BOX_BUTTON_TYPES: list[AnycubicButtonEntityDescription] = list([
    AnycubicButtonEntityDescription(
        key="drying_stop",
        translation_key="drying_stop",
        printer_entity_type=PrinterEntityType.ACE_PRIMARY,
    ),
    AnycubicButtonEntityDescription(
        key="drying_start",
        translation_key="drying_start",
        printer_entity_type=PrinterEntityType.ACE_PRIMARY,
    ),
    AnycubicButtonEntityDescription(
        key="ace_refresh_spools",
        translation_key="ace_refresh_spools",
        printer_entity_type=PrinterEntityType.ACE_PRIMARY,
    ),
])

SECONDARY_MULTI_COLOR_BOX_BUTTON_TYPES: list[AnycubicButtonEntityDescription] = list([
    AnycubicButtonEntityDescription(
        key="secondary_drying_stop",
        translation_key="secondary_drying_stop",
        printer_entity_type=PrinterEntityType.ACE_SECONDARY,
    ),
])

BUTTON_TYPES: list[AnycubicButtonEntityDescription] = list([
    AnycubicButtonEntityDescription(
        key="pause_print",
        translation_key="pause_print",
        printer_entity_type=PrinterEntityType.PRINTER,
    ),
    AnycubicButtonEntityDescription(
        key="resume_print",
        translation_key="resume_print",
        printer_entity_type=PrinterEntityType.PRINTER,
    ),
    AnycubicButtonEntityDescription(
        key="cancel_print",
        translation_key="cancel_print",
        printer_entity_type=PrinterEntityType.PRINTER,
    ),
    AnycubicButtonEntityDescription(
        key="request_file_list_local",
        translation_key="request_file_list_local",
        printer_entity_type=PrinterEntityType.PRINTER,
    ),
    AnycubicButtonEntityDescription(
        key="request_file_list_udisk",
        translation_key="request_file_list_udisk",
        printer_entity_type=PrinterEntityType.PRINTER,
    ),
])

GLOBAL_BUTTON_TYPES: list[AnycubicButtonEntityDescription] = list([
    AnycubicButtonEntityDescription(
        key="request_file_list_cloud",
        translation_key="request_file_list_cloud",
        printer_entity_type=PrinterEntityType.GLOBAL,
    ),
    AnycubicButtonEntityDescription(
        key="refresh_mqtt_connection",
        translation_key="refresh_mqtt_connection",
        entity_category=EntityCategory.DIAGNOSTIC,
        printer_entity_type=PrinterEntityType.GLOBAL,
    ),
])


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up the button from a config entry."""

    coordinator: AnycubicCloudDataUpdateCoordinator = entry.runtime_data

    coordinator.add_entities_for_seen_printers(
        async_add_entities=async_add_entities,
        entity_constructor=AnycubicCloudButton,
        platform=Platform.BUTTON,
        available_descriptors=list(
            BUTTON_TYPES
            + PRIMARY_MULTI_COLOR_BOX_BUTTON_TYPES
            + SECONDARY_MULTI_COLOR_BOX_BUTTON_TYPES
            + PRIMARY_DRYING_PRESET_BUTTON_TYPES
            + SECONDARY_DRYING_PRESET_BUTTON_TYPES
            + GLOBAL_BUTTON_TYPES
            + PRIMARY_SPOOL_RESET_BUTTON_TYPES
            + BUTTON_TYPES_AXIS
            + NOZZLE_BUTTON_TYPES
        ),
    )


class AnycubicCloudButton(AnycubicCloudEntity, ButtonEntity):
    """A button for Anycubic Cloud."""

    entity_description: AnycubicButtonEntityDescription

    def __init__(
        self,
        hass: HomeAssistant,
        coordinator: AnycubicCloudDataUpdateCoordinator,
        printer_id: int,
        entity_description: AnycubicButtonEntityDescription,
    ) -> None:
        """Initialize."""
        super().__init__(hass, coordinator, printer_id, entity_description)

    async def async_press(self) -> None:
        """Press the button."""
        if TYPE_CHECKING:
            assert self.coordinator.anycubic_api, "Connection to API is missing"

        key = self.entity_description.key

        if key.endswith("_reset_spool"):
            slot_index = int(key.split("_")[2]) - 1
            await self.coordinator.async_reset_spool(self._printer_id, slot_index)
            return

        if key == "reset_nozzle_wear":
            await self.coordinator.async_reset_nozzle(self._printer_id)
            return

        if key == "drying_start":
            await self.coordinator.async_start_drying(self._printer_id)
            return

        await self.coordinator.button_press_event(self._printer_id, key)

    @property
    def extra_state_attributes(self) -> dict[str, Any] | None:
        """Return extra state attributes."""
        attrib = printer_attributes_for_key(self.coordinator, self._printer_id, self.entity_description.key)
        if attrib is not None:
            return attrib
        else:
            return None
