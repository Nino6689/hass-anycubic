"""Numbers (BEHAVIOUR §2.13)."""

from __future__ import annotations

from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from typing import TYPE_CHECKING

from homeassistant.components.number import (
    NumberDeviceClass,
    NumberEntity,
    NumberEntityDescription,
    NumberMode,
)
from homeassistant.const import (
    PERCENTAGE,
    EntityCategory,
    UnitOfMass,
    UnitOfTemperature,
    UnitOfTime,
)

from . import control
from .const import ACE_SLOTS
from .entity import (
    AnycubicEntity,
    AnycubicEntityDescription,
    Device,
    Kind,
    async_add_when_ready,
)

if TYPE_CHECKING:
    from homeassistant.core import HomeAssistant
    from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

    from .coordinator import AnycubicConfigEntry, AnycubicCoordinator


@dataclass(frozen=True, kw_only=True)
class AnycubicNumberDescription(AnycubicEntityDescription, NumberEntityDescription):
    """A number: how to read it and how to set it."""

    value_fn: Callable[[AnycubicCoordinator], float | None]
    set_fn: Callable[[AnycubicCoordinator, float], Awaitable[None]]
    monetary: bool = False


def _printer_setting(
    order: Callable[[AnycubicCoordinator, str, int], Awaitable[None]], key: str
) -> Callable[[AnycubicCoordinator, float], Awaitable[None]]:
    return lambda c, value: order(c, key, int(value))


def _ledger_setting(
    apply: Callable[[AnycubicCoordinator, float], None],
) -> Callable[[AnycubicCoordinator, float], Awaitable[None]]:
    async def set_value(c: AnycubicCoordinator, value: float) -> None:
        apply(c, value)
        c.async_update_listeners()
        await c.async_request_refresh()

    return set_value


def _pid(c: AnycubicCoordinator) -> int:
    return c.printer.printer_id


def _slot_weight(number: int) -> Callable[[AnycubicCoordinator], float | None]:
    return lambda c: c.ledger.slot_weight(_pid(c), number)


def _slot_price(number: int) -> Callable[[AnycubicCoordinator], float | None]:
    return lambda c: c.ledger.slot_price(_pid(c), number)


def _set_slot_weight(number: int) -> Callable[[AnycubicCoordinator, float], None]:
    return lambda c, value: c.ledger.set_slot_weight(_pid(c), number, value)


def _set_slot_price(number: int) -> Callable[[AnycubicCoordinator, float], None]:
    return lambda c, value: c.ledger.set_slot_price(_pid(c), number, value)


def _set_drying(name: str) -> Callable[[AnycubicCoordinator, float], None]:
    return lambda c, value: c.ledger.set_drying_setting(_pid(c), name, value)


NUMBERS: tuple[AnycubicNumberDescription, ...] = (
    AnycubicNumberDescription(
        key="set_target_nozzle_temp",
        kind=Kind.FDM,
        native_min_value=0,
        native_max_value=320,
        native_step=1,
        mode=NumberMode.BOX,
        native_unit_of_measurement=UnitOfTemperature.CELSIUS,
        device_class=NumberDeviceClass.TEMPERATURE,
        value_fn=lambda c: c.printer.target_nozzle_temperature,
        set_fn=_printer_setting(control.async_set_temperature, "target_nozzle_temp"),
    ),
    AnycubicNumberDescription(
        key="set_target_hotbed_temp",
        kind=Kind.FDM,
        native_min_value=0,
        native_max_value=120,
        native_step=1,
        mode=NumberMode.BOX,
        native_unit_of_measurement=UnitOfTemperature.CELSIUS,
        device_class=NumberDeviceClass.TEMPERATURE,
        value_fn=lambda c: c.printer.target_hotbed_temperature,
        set_fn=_printer_setting(control.async_set_temperature, "target_hotbed_temp"),
    ),
    AnycubicNumberDescription(
        key="set_fan_speed_pct",
        kind=Kind.FDM,
        native_min_value=0,
        native_max_value=100,
        native_step=1,
        mode=NumberMode.SLIDER,
        native_unit_of_measurement=PERCENTAGE,
        value_fn=lambda c: c.printer.fan_speed,
        set_fn=_printer_setting(control.async_set_fan, "fan_speed_pct"),
    ),
    AnycubicNumberDescription(
        key="set_aux_fan_speed_pct",
        kind=Kind.FDM,
        native_min_value=0,
        native_max_value=100,
        native_step=1,
        mode=NumberMode.SLIDER,
        native_unit_of_measurement=PERCENTAGE,
        value_fn=lambda c: c.printer.aux_fan_speed,
        set_fn=_printer_setting(control.async_set_fan, "aux_fan_speed_pct"),
    ),
    AnycubicNumberDescription(
        key="set_box_fan_level",
        kind=Kind.FDM,
        native_min_value=0,
        native_max_value=100,
        native_step=1,
        mode=NumberMode.SLIDER,
        value_fn=lambda c: c.printer.box_fan_level,
        set_fn=_printer_setting(control.async_set_fan, "box_fan_level"),
    ),
    *(
        description
        for number in ACE_SLOTS
        for description in (
            AnycubicNumberDescription(
                key=f"ace_slot_{number}_spool_weight",
                kind=Kind.ACE1,
                device=Device.ACE1,
                entity_category=EntityCategory.CONFIG,
                entity_registry_enabled_default=False,
                native_min_value=0,
                native_max_value=10000,
                native_step=1,
                mode=NumberMode.BOX,
                native_unit_of_measurement=UnitOfMass.GRAMS,
                device_class=NumberDeviceClass.WEIGHT,
                value_fn=_slot_weight(number),
                set_fn=_ledger_setting(_set_slot_weight(number)),
            ),
            AnycubicNumberDescription(
                key=f"ace_slot_{number}_spool_price",
                kind=Kind.ACE1,
                device=Device.ACE1,
                entity_category=EntityCategory.CONFIG,
                entity_registry_enabled_default=False,
                native_min_value=0,
                native_max_value=1000,
                native_step=0.01,
                mode=NumberMode.BOX,
                monetary=True,
                value_fn=_slot_price(number),
                set_fn=_ledger_setting(_set_slot_price(number)),
            ),
        )
    ),
    AnycubicNumberDescription(
        key="drying_set_temperature",
        kind=Kind.ACE1,
        device=Device.ACE1,
        entity_category=EntityCategory.CONFIG,
        native_min_value=35,
        native_max_value=70,
        native_step=1,
        mode=NumberMode.BOX,
        native_unit_of_measurement=UnitOfTemperature.CELSIUS,
        device_class=NumberDeviceClass.TEMPERATURE,
        value_fn=lambda c: control.drying_defaults(c, 0)[0],
        set_fn=_ledger_setting(_set_drying("temperature")),
    ),
    AnycubicNumberDescription(
        key="drying_set_duration",
        kind=Kind.ACE1,
        device=Device.ACE1,
        entity_category=EntityCategory.CONFIG,
        native_min_value=1,
        native_max_value=720,
        native_step=1,
        mode=NumberMode.BOX,
        native_unit_of_measurement=UnitOfTime.MINUTES,
        device_class=NumberDeviceClass.DURATION,
        value_fn=lambda c: control.drying_defaults(c, 0)[1],
        set_fn=_ledger_setting(_set_drying("duration")),
    ),
)


async def async_setup_entry(
    hass: HomeAssistant,
    entry: AnycubicConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Set up the numbers of a config entry."""
    async_add_when_ready(
        entry.runtime_data, NUMBERS, AnycubicNumber, async_add_entities
    )


class AnycubicNumber(AnycubicEntity, NumberEntity):
    """A printer setting or a stored ledger figure."""

    entity_description: AnycubicNumberDescription

    @property
    def native_value(self) -> float | None:
        # Always a float: the state reads ``45.0``, never ``45`` (COMPAT §3
        # "State formats"), whatever type the printer or ledger holds.
        value = self.entity_description.value_fn(self.coordinator)
        return None if value is None else float(value)

    @property
    def native_unit_of_measurement(self) -> str | None:
        if self.entity_description.monetary:
            return self.hass.config.currency
        return super().native_unit_of_measurement

    async def async_set_native_value(self, value: float) -> None:
        await self.entity_description.set_fn(self.coordinator, value)
