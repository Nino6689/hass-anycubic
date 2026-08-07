"""Binary sensors for Anycubic Cloud."""
from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING, Any

from homeassistant.components.binary_sensor import (
    BinarySensorDeviceClass,
    BinarySensorEntity,
    BinarySensorEntityDescription,
)
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import EntityCategory, Platform
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from .const import (
    PrinterEntityType,
)
from .entity import AnycubicCloudEntity, AnycubicCloudEntityDescription
from .helpers import printer_attributes_for_key, printer_state_for_key

# All data comes from the shared coordinator, and writes go through the
# cloud API one request at a time, so no per-entity parallelism is wanted.
PARALLEL_UPDATES = 0

if TYPE_CHECKING:
    from .coordinator import AnycubicCloudDataUpdateCoordinator


@dataclass(frozen=True)
class AnycubicBinarySensorEntityDescription(
    BinarySensorEntityDescription, AnycubicCloudEntityDescription
):
    """Describes Anycubic Cloud binary sensor entity."""

    # Report unavailable rather than "off" when there is no state.
    #
    # For most of these, off is the honest reading of a missing value -- a job
    # that isn't paused is not paused. For a PROBLEM sensor it is the opposite:
    # off means "no problem", and saying that when the answer isn't known yet
    # is a false reassurance, both to a person glancing at a dashboard and to
    # an automation gating on it. Opt-in so existing sensors keep their
    # behaviour.
    unknown_when_none: bool = False


PRIMARY_MULTI_COLOR_BOX_SENSOR_TYPES: list[AnycubicBinarySensorEntityDescription] = list([
    AnycubicBinarySensorEntityDescription(
        key="ai_detection_enabled",
        translation_key="ai_detection_enabled",
        printer_entity_type=PrinterEntityType.PRINTER,
        entity_category=EntityCategory.DIAGNOSTIC,
        entity_registry_enabled_default=False,
    ),
    AnycubicBinarySensorEntityDescription(
        key="external_spool_loaded",
        translation_key="external_spool_loaded",
        printer_entity_type=PrinterEntityType.PRINTER,
        entity_registry_enabled_default=False,
    ),
    AnycubicBinarySensorEntityDescription(
        key="dry_status_is_drying",
        translation_key="dry_status_is_drying",
        printer_entity_type=PrinterEntityType.ACE_PRIMARY,
    ),
])

SECONDARY_MULTI_COLOR_BOX_SENSOR_TYPES: list[AnycubicBinarySensorEntityDescription] = list([
    AnycubicBinarySensorEntityDescription(
        key="secondary_dry_status_is_drying",
        translation_key="secondary_dry_status_is_drying",
        printer_entity_type=PrinterEntityType.ACE_SECONDARY,
    ),
])

SENSOR_TYPES: list[AnycubicBinarySensorEntityDescription] = list([
    AnycubicBinarySensorEntityDescription(
        key="job_in_progress",
        translation_key="job_in_progress",
        printer_entity_type=PrinterEntityType.PRINTER,
    ),
    AnycubicBinarySensorEntityDescription(
        key="job_complete",
        translation_key="job_complete",
        printer_entity_type=PrinterEntityType.PRINTER,
    ),
    AnycubicBinarySensorEntityDescription(
        key="job_failed",
        translation_key="job_failed",
        printer_entity_type=PrinterEntityType.PRINTER,
    ),
    AnycubicBinarySensorEntityDescription(
        key="job_is_paused",
        translation_key="job_is_paused",
        printer_entity_type=PrinterEntityType.PRINTER,
    ),
    AnycubicBinarySensorEntityDescription(
        key="printer_online",
        translation_key="printer_online",
        printer_entity_type=PrinterEntityType.PRINTER,
    ),
    # The one that earns its keep: on means the reel now loaded will not see
    # this print out, worked out from actual extrusion within the first couple
    # of percent -- early enough to do something about it.
    AnycubicBinarySensorEntityDescription(
        key="job_filament_insufficient",
        translation_key="job_filament_insufficient",
        device_class=BinarySensorDeviceClass.PROBLEM,
        printer_entity_type=PrinterEntityType.PRINTER,
        unknown_when_none=True,
    ),
    AnycubicBinarySensorEntityDescription(
        key="is_busy",
        translation_key="is_busy",
        printer_entity_type=PrinterEntityType.PRINTER,
    ),
    AnycubicBinarySensorEntityDescription(
        key="is_available",
        translation_key="is_available",
        printer_entity_type=PrinterEntityType.PRINTER,
    ),
    AnycubicBinarySensorEntityDescription(
        key="mqtt_connection_active",
        translation_key="mqtt_connection_active",
        entity_category=EntityCategory.DIAGNOSTIC,
        printer_entity_type=PrinterEntityType.PRINTER,
    ),
])

GLOBAL_SENSOR_TYPES: list[AnycubicBinarySensorEntityDescription] = list([
])


async def async_setup_entry(
    hass: HomeAssistant, entry: ConfigEntry, async_add_entities: AddEntitiesCallback
) -> None:
    """Set up the Anycubic Cloud binary sensor entry."""

    coordinator: AnycubicCloudDataUpdateCoordinator = entry.runtime_data
    coordinator.add_entities_for_seen_printers(
        async_add_entities=async_add_entities,
        entity_constructor=AnycubicBinarySensor,
        platform=Platform.BINARY_SENSOR,
        available_descriptors=list(
            SENSOR_TYPES
            + PRIMARY_MULTI_COLOR_BOX_SENSOR_TYPES
            + SECONDARY_MULTI_COLOR_BOX_SENSOR_TYPES
            + GLOBAL_SENSOR_TYPES
        ),
    )


class AnycubicBinarySensor(AnycubicCloudEntity, BinarySensorEntity):
    """Representation of a Anycubic binary sensor."""

    entity_description: AnycubicBinarySensorEntityDescription

    def __init__(
        self,
        hass: HomeAssistant,
        coordinator: AnycubicCloudDataUpdateCoordinator,
        printer_id: int,
        entity_description: AnycubicBinarySensorEntityDescription,
    ) -> None:
        """Initiate Anycubic Binary Sensor."""
        super().__init__(hass, coordinator, printer_id, entity_description)

    @property
    def available(self) -> bool:
        """Whether this sensor has anything to say."""
        if not self.entity_description.unknown_when_none:
            return super().available

        return (
            printer_state_for_key(
                self.coordinator, self._printer_id, self.entity_description.key
            )
            is not None
        )

    @property
    def is_on(self) -> bool:
        """Return true if the binary sensor is on."""
        return bool(
            printer_state_for_key(self.coordinator, self._printer_id, self.entity_description.key)
        )

    @property
    def extra_state_attributes(self) -> dict[str, Any] | None:
        """Return extra state attributes."""
        attrib = printer_attributes_for_key(self.coordinator, self._printer_id, self.entity_description.key)
        if attrib is not None:
            return attrib
        else:
            return None
