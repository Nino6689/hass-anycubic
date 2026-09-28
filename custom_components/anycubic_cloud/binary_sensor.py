"""Binary sensors (BEHAVIOUR §2.1, §2.3, §2.6-§2.10)."""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass
from typing import TYPE_CHECKING, Any

from homeassistant.components.binary_sensor import (
    BinarySensorDeviceClass,
    BinarySensorEntity,
    BinarySensorEntityDescription,
)
from homeassistant.const import EntityCategory

from .entity import (
    AnycubicEntity,
    AnycubicEntityDescription,
    Device,
    Kind,
    async_add_when_ready,
)
from .model import WORK_BUSY, WORK_FREE

if TYPE_CHECKING:
    from homeassistant.core import HomeAssistant
    from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

    from .coordinator import AnycubicConfigEntry, AnycubicCoordinator


@dataclass(frozen=True, kw_only=True)
class AnycubicBinarySensorDescription(
    AnycubicEntityDescription, BinarySensorEntityDescription
):
    """``value_fn`` returns ``None`` for "no value": off, or unavailable
    when ``unavailable_without_value`` is set."""

    value_fn: Callable[[AnycubicCoordinator], bool | None]
    attrs_fn: Callable[[AnycubicCoordinator], dict[str, Any]] | None = None
    unavailable_without_value: bool = False


def _external_loaded(c: AnycubicCoordinator) -> bool | None:
    spool = c.printer.external_spool
    return spool.loaded if spool is not None else None


def _insufficient(c: AnycubicCoordinator) -> bool | None:
    return c.forecast.insufficient if c.forecast is not None else None


def _mqtt_active(c: AnycubicCoordinator) -> bool:
    cloud = c.runtime.cloud
    return cloud is not None and cloud.mqtt.active


def _mqtt_attrs(c: AnycubicCoordinator) -> dict[str, Any]:
    cloud = c.runtime.cloud
    return {
        "supports_mqtt_login": cloud is not None and cloud.mqtt.supports_login,
        "last_error": cloud.mqtt.last_error if cloud is not None else None,
    }


BINARY_SENSORS: tuple[AnycubicBinarySensorDescription, ...] = (
    AnycubicBinarySensorDescription(
        key="printer_online", value_fn=lambda c: c.printer.is_online
    ),
    AnycubicBinarySensorDescription(
        key="is_available", value_fn=lambda c: c.printer.work_status == WORK_FREE
    ),
    AnycubicBinarySensorDescription(
        key="is_busy", value_fn=lambda c: c.printer.work_status == WORK_BUSY
    ),
    AnycubicBinarySensorDescription(
        key="job_in_progress", value_fn=lambda c: c.printer.job_in_progress
    ),
    AnycubicBinarySensorDescription(
        key="job_complete", value_fn=lambda c: c.printer.job_complete
    ),
    AnycubicBinarySensorDescription(
        key="job_failed", value_fn=lambda c: c.printer.job_failed
    ),
    AnycubicBinarySensorDescription(
        key="job_is_paused", value_fn=lambda c: c.printer.job_is_paused
    ),
    AnycubicBinarySensorDescription(
        key="axis_moving",
        kind=Kind.FDM,
        device_class=BinarySensorDeviceClass.MOVING,
        value_fn=lambda c: c.printer.is_moving,
    ),
    AnycubicBinarySensorDescription(
        key="axis_move_failed",
        kind=Kind.FDM,
        device_class=BinarySensorDeviceClass.PROBLEM,
        value_fn=lambda c: c.printer.axis_move_failed,
    ),
    AnycubicBinarySensorDescription(
        key="external_spool_loaded",
        entity_registry_enabled_default=False,
        # G15: unavailable when there is no holder at all.
        unavailable_without_value=True,
        value_fn=_external_loaded,
    ),
    AnycubicBinarySensorDescription(
        key="job_filament_insufficient",
        kind=Kind.FDM,
        device_class=BinarySensorDeviceClass.PROBLEM,
        # B19: unknown is unavailable, never "off" (= no problem).
        unavailable_without_value=True,
        value_fn=_insufficient,
    ),
    AnycubicBinarySensorDescription(
        key="dry_status_is_drying",
        kind=Kind.ACE1,
        device=Device.ACE1,
        value_fn=lambda c: c.printer.is_drying(0),
        attrs_fn=lambda c: {"dry_status_code": c.printer.drying_status_code(0)},
    ),
    AnycubicBinarySensorDescription(
        key="secondary_dry_status_is_drying",
        kind=Kind.ACE2,
        device=Device.ACE2,
        value_fn=lambda c: c.printer.is_drying(1),
        attrs_fn=lambda c: {
            "secondary_dry_status_code": c.printer.drying_status_code(1)
        },
    ),
    AnycubicBinarySensorDescription(
        key="mqtt_connection_active",
        cloud_only=True,
        entity_category=EntityCategory.DIAGNOSTIC,
        value_fn=_mqtt_active,
        attrs_fn=_mqtt_attrs,
    ),
)


async def async_setup_entry(
    hass: HomeAssistant,
    entry: AnycubicConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Set up the binary sensors of a config entry."""
    async_add_when_ready(
        entry.runtime_data, BINARY_SENSORS, AnycubicBinarySensor, async_add_entities
    )


class AnycubicBinarySensor(AnycubicEntity, BinarySensorEntity):
    """A printer or ACE binary sensor."""

    entity_description: AnycubicBinarySensorDescription

    @property
    def available(self) -> bool:
        if not super().available:
            return False
        if self.entity_description.unavailable_without_value:
            return self.entity_description.value_fn(self.coordinator) is not None
        return True

    @property
    def is_on(self) -> bool:
        return bool(self.entity_description.value_fn(self.coordinator))

    @property
    def extra_state_attributes(self) -> dict[str, Any] | None:
        if (attrs_fn := self.entity_description.attrs_fn) is None:
            return None
        return attrs_fn(self.coordinator)
