"""Numbers for Anycubic Cloud.

Two groups.

**Spool settings**, one per ACE slot: what the reel started at and what it
cost. The printer can't weigh a spool, so these are what the remaining
estimate and the cost figures are derived from.

**Live print controls**: nozzle and bed temperature, print speed and the
three fans. These have always been available as actions, but only as actions
-- so from the device page the printer looked like it could do nothing but
pause and stop. They're the same calls, surfaced where people actually look
for them.

⚠ The printer only accepts these while a job is running, so those entities
report unavailable when it is idle rather than accepting a value that would
be silently dropped.
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
from homeassistant.const import (
    PERCENTAGE,
    EntityCategory,
    Platform,
    UnitOfMass,
    UnitOfTemperature,
    UnitOfTime,
)
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from .const import (
    ACE_SLOT_COUNT,
    ATTR_DRYING_DURATION,
    ATTR_DRYING_TEMPERATURE,
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
class AnycubicNumberEntityDescription(
    NumberEntityDescription, AnycubicCloudEntityDescription
):
    """Describes an Anycubic Cloud number entity."""

    slot_index: int = 0
    # Name of the AnycubicPrinter coroutine this entity writes through. When
    # set, the entity is a live print control rather than a stored setting.
    printer_method: str | None = None
    # Coordinator state key holding the current value.
    state_key: str | None = None


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

# What the reel cost, per kilogram. Priced per kilo rather than per spool so
# the figure survives a part-used reel: you paid the same per kilo whether the
# spool is full or half gone.
PRIMARY_MULTI_COLOR_BOX_PRICE_TYPES: list[AnycubicNumberEntityDescription] = list([
    AnycubicNumberEntityDescription(
        key=f"ace_slot_{slot_num}_spool_price",
        translation_key=f"ace_slot_{slot_num}_spool_price",
        printer_entity_type=PrinterEntityType.ACE_PRIMARY,
        slot_index=slot_num - 1,
        native_min_value=0,
        native_max_value=1000,
        native_step=0.01,
        mode=NumberMode.BOX,
        entity_category=EntityCategory.CONFIG,
        entity_registry_enabled_default=False,
    )
    for slot_num in range(1, ACE_SLOT_COUNT + 1)
])


# Live print controls. Every one of these has existed as an action since
# before this fork; none of them were reachable from the device page, which is
# where people look. Same calls, surfaced properly.
PRINT_CONTROL_NUMBER_TYPES: list[AnycubicNumberEntityDescription] = list([
    AnycubicNumberEntityDescription(
        key="set_target_nozzle_temp",
        translation_key="set_target_nozzle_temp",
        printer_entity_type=PrinterEntityType.FDM,
        printer_method="change_print_setting_target_nozzle_temp",
        state_key="target_nozzle_temp",
        native_unit_of_measurement=UnitOfTemperature.CELSIUS,
        device_class=NumberDeviceClass.TEMPERATURE,
        native_min_value=0,
        native_max_value=320,
        native_step=1,
        mode=NumberMode.BOX,
    ),
    AnycubicNumberEntityDescription(
        key="set_target_hotbed_temp",
        translation_key="set_target_hotbed_temp",
        printer_entity_type=PrinterEntityType.FDM,
        printer_method="change_print_setting_target_hotbed_temp",
        state_key="target_hotbed_temp",
        native_unit_of_measurement=UnitOfTemperature.CELSIUS,
        device_class=NumberDeviceClass.TEMPERATURE,
        native_min_value=0,
        native_max_value=120,
        native_step=1,
        mode=NumberMode.BOX,
    ),
    AnycubicNumberEntityDescription(
        key="set_fan_speed_pct",
        translation_key="set_fan_speed_pct",
        printer_entity_type=PrinterEntityType.FDM,
        printer_method="change_print_setting_fan_speed_pct",
        state_key="fan_speed_pct",
        native_unit_of_measurement=PERCENTAGE,
        native_min_value=0,
        native_max_value=100,
        native_step=1,
        mode=NumberMode.SLIDER,
    ),
    AnycubicNumberEntityDescription(
        key="set_aux_fan_speed_pct",
        translation_key="set_aux_fan_speed_pct",
        printer_entity_type=PrinterEntityType.FDM,
        printer_method="change_print_setting_aux_fan_speed_pct",
        state_key="aux_fan_speed_pct",
        native_unit_of_measurement=PERCENTAGE,
        native_min_value=0,
        native_max_value=100,
        native_step=1,
        mode=NumberMode.SLIDER,
    ),
    AnycubicNumberEntityDescription(
        key="set_box_fan_level",
        translation_key="set_box_fan_level",
        printer_entity_type=PrinterEntityType.FDM,
        printer_method="change_print_setting_box_fan_level",
        state_key="box_fan_level",
        native_min_value=0,
        native_max_value=100,
        native_step=1,
        mode=NumberMode.SLIDER,
    ),
])


# Drying, on the ACE device where the stop button already lives. Starting a
# dry cycle previously required configuring a preset in the options first,
# which is why the ACE page offered stop and nothing else.
DRYING_NUMBER_TYPES: list[AnycubicNumberEntityDescription] = list([
    AnycubicNumberEntityDescription(
        key="drying_set_temperature",
        translation_key="drying_set_temperature",
        printer_entity_type=PrinterEntityType.ACE_PRIMARY,
        native_unit_of_measurement=UnitOfTemperature.CELSIUS,
        device_class=NumberDeviceClass.TEMPERATURE,
        native_min_value=35,
        native_max_value=70,
        native_step=1,
        mode=NumberMode.BOX,
        entity_category=EntityCategory.CONFIG,
    ),
    AnycubicNumberEntityDescription(
        key="drying_set_duration",
        translation_key="drying_set_duration",
        printer_entity_type=PrinterEntityType.ACE_PRIMARY,
        native_unit_of_measurement=UnitOfTime.MINUTES,
        device_class=NumberDeviceClass.DURATION,
        native_min_value=1,
        native_max_value=720,
        native_step=1,
        mode=NumberMode.BOX,
        entity_category=EntityCategory.CONFIG,
    ),
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
        available_descriptors=list(
            PRIMARY_MULTI_COLOR_BOX_NUMBER_TYPES
            + PRIMARY_MULTI_COLOR_BOX_PRICE_TYPES
            + PRINT_CONTROL_NUMBER_TYPES
            + DRYING_NUMBER_TYPES
        ),
    )


class AnycubicNumber(AnycubicCloudEntity, NumberEntity):
    """How much filament a spool started with."""

    entity_description: AnycubicNumberEntityDescription

    def __init__(
        self,
        hass: HomeAssistant,
        coordinator: AnycubicCloudDataUpdateCoordinator,
        printer_id: int,
        entity_description: AnycubicNumberEntityDescription,
    ) -> None:
        """Initiate the number, giving price entities the local currency."""
        super().__init__(hass, coordinator, printer_id, entity_description)

        if entity_description.key.endswith("_spool_price"):
            self._attr_native_unit_of_measurement = hass.config.currency

    @property
    def _is_price(self) -> bool:
        return self.entity_description.key.endswith("_spool_price")

    @property
    def _drying_key(self) -> str | None:
        key = self.entity_description.key
        if key == "drying_set_temperature":
            return ATTR_DRYING_TEMPERATURE
        if key == "drying_set_duration":
            return ATTR_DRYING_DURATION
        return None

    @property
    def available(self) -> bool:
        """Live controls need a running job; stored settings never do."""
        if self.entity_description.printer_method is None:
            return super().available

        return super().available and bool(
            printer_state_for_key(self.coordinator, self._printer_id, "job_in_progress")
        )

    @property
    def native_value(self) -> float | None:
        """The current value, from the printer or from what was stored."""
        description = self.entity_description

        if description.state_key is not None:
            state = printer_state_for_key(
                self.coordinator, self._printer_id, description.state_key
            )
            return float(state) if isinstance(state, (int, float)) else None

        if (drying_key := self._drying_key) is not None:
            default = 45.0 if drying_key == ATTR_DRYING_TEMPERATURE else 120.0
            return self.coordinator.get_drying_setting(
                self._printer_id, drying_key, default
            )

        if self._is_price:
            return self.coordinator.get_spool_price(
                self._printer_id, description.slot_index
            )

        return self.coordinator.get_spool_weight(
            self._printer_id, description.slot_index
        )

    async def async_set_native_value(self, value: float) -> None:
        """Send the value to the printer, or store it, depending which this is."""
        description = self.entity_description

        if description.printer_method is not None:
            await self.coordinator.async_set_print_setting(
                self._printer_id, description.printer_method, value
            )
            return

        if (drying_key := self._drying_key) is not None:
            await self.coordinator.async_set_drying_setting(
                self._printer_id, drying_key, value
            )
            return

        if self._is_price:
            await self.coordinator.async_set_spool_price(
                self._printer_id, description.slot_index, value
            )
            return

        await self.coordinator.async_set_spool_weight(
            self._printer_id, description.slot_index, value
        )
