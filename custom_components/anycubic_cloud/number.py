"""Numbers for Anycubic Cloud.

One entry per ACE slot, holding how much filament is actually on that reel
right now. The printer can't weigh a spool, so this is the figure the
remaining-filament estimate counts down from.

Set it to what the reel really holds -- 334 g for a part-used one, 5000 for a
5 kg roll. The grams sensor counts down from here; the percentage sensor
reports against a full reel, so a part-used spool reads as the fraction of a
reel it is rather than as nearly full.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING

from homeassistant.components.number import (
    NumberDeviceClass,
    NumberEntity,
    NumberEntityDescription,
    NumberMode,
)
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import EntityCategory, Platform, UnitOfMass
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from .const import (
    ACE_SLOT_COUNT,
    PrinterEntityType,
)
from .entity import AnycubicCloudEntity, AnycubicCloudEntityDescription

# All data comes from the shared coordinator, and writes go through the
# cloud API one request at a time, so no per-entity parallelism is wanted.
PARALLEL_UPDATES = 0

if TYPE_CHECKING:
    from .coordinator import AnycubicCloudDataUpdateCoordinator


@dataclass(frozen=True)
class AnycubicNumberEntityDescription(
    NumberEntityDescription, AnycubicCloudEntityDescription
):
    """Describes an Anycubic Cloud number entity."""

    slot_index: int = 0


PRIMARY_MULTI_COLOR_BOX_NUMBER_TYPES: list[AnycubicNumberEntityDescription] = list([
    AnycubicNumberEntityDescription(
        key=f"ace_slot_{slot_num}_spool_weight",
        translation_key=f"ace_slot_{slot_num}_spool_weight",
        printer_entity_type=PrinterEntityType.ACE_PRIMARY,
        slot_index=slot_num - 1,
        native_unit_of_measurement=UnitOfMass.GRAMS,
        device_class=NumberDeviceClass.WEIGHT,
        native_min_value=0,
        native_max_value=10000,
        # 1 g, not a coarse step: people weigh a part-used spool on kitchen
        # scales and get numbers like 334, which a 50 g step silently rejects.
        native_step=1,
        mode=NumberMode.BOX,
        entity_category=EntityCategory.CONFIG,
        entity_registry_enabled_default=False,
    )
    for slot_num in range(1, ACE_SLOT_COUNT + 1)
])


async def async_setup_entry(
    hass: HomeAssistant, entry: ConfigEntry, async_add_entities: AddEntitiesCallback
) -> None:
    """Set up the Anycubic Cloud number entry."""

    coordinator: AnycubicCloudDataUpdateCoordinator = entry.runtime_data
    coordinator.add_entities_for_seen_printers(
        async_add_entities=async_add_entities,
        entity_constructor=AnycubicNumber,
        platform=Platform.NUMBER,
        available_descriptors=list(PRIMARY_MULTI_COLOR_BOX_NUMBER_TYPES),
    )


class AnycubicNumber(AnycubicCloudEntity, NumberEntity):
    """How much filament a spool started with."""

    entity_description: AnycubicNumberEntityDescription

    @property
    def native_value(self) -> float:
        """The configured starting weight for this slot's spool."""
        return self.coordinator.get_spool_weight(
            self._printer_id, self.entity_description.slot_index
        )

    async def async_set_native_value(self, value: float) -> None:
        """Record a new starting weight and recalculate what's left."""
        await self.coordinator.async_set_spool_weight(
            self._printer_id, self.entity_description.slot_index, value
        )
