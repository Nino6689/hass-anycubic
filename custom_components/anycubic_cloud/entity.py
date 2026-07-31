"""Base class for anycubic_cloud entity."""
from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING

from homeassistant.helpers.entity import Entity, EntityDescription
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from .const import PrinterEntityType
from .coordinator import AnycubicCloudDataUpdateCoordinator
from .helpers import (
    build_ace_device_info,
    build_printer_device_info,
    printer_entity_unique_id,
)

ACE_PRIMARY_ENTITY_TYPES = (
    PrinterEntityType.ACE_PRIMARY,
    PrinterEntityType.DRY_PRESET_PRIMARY,
)
ACE_SECONDARY_ENTITY_TYPES = (
    PrinterEntityType.ACE_SECONDARY,
    PrinterEntityType.DRY_PRESET_SECONDARY,
)

if TYPE_CHECKING:
    from homeassistant.core import HomeAssistant
    from homeassistant.helpers.device_registry import DeviceInfo


@dataclass(frozen=True, kw_only=True)
class AnycubicCloudEntityDescription(EntityDescription):
    """Generic Anycubic Cloud entity description."""

    printer_entity_type: PrinterEntityType | None = None


class AnycubicCloudEntity(CoordinatorEntity[AnycubicCloudDataUpdateCoordinator], Entity):
    """Base implementation for Anycubic Printer device."""

    _attr_has_entity_name = True

    def __init__(
        self,
        hass: HomeAssistant,
        coordinator: AnycubicCloudDataUpdateCoordinator,
        printer_id: int,
        entity_description: AnycubicCloudEntityDescription,
    ) -> None:
        """Initialize an Anycubic device."""
        super().__init__(coordinator)
        self._printer_id = int(printer_id)

        # ACE units are separate physical hardware and a printer can have two,
        # so their entities live on their own device rather than cluttering
        # the printer's.
        entity_type = entity_description.printer_entity_type

        if entity_type in ACE_PRIMARY_ENTITY_TYPES:
            self._attr_device_info: DeviceInfo = build_ace_device_info(
                coordinator.data,
                self._printer_id,
            )
        elif entity_type in ACE_SECONDARY_ENTITY_TYPES:
            self._attr_device_info = build_ace_device_info(
                coordinator.data,
                self._printer_id,
                secondary=True,
            )
        else:
            self._attr_device_info = build_printer_device_info(
                coordinator.data,
                self._printer_id,
            )
        self.entity_description = entity_description
        self._attr_unique_id = printer_entity_unique_id(coordinator, self._printer_id, entity_description.key)
