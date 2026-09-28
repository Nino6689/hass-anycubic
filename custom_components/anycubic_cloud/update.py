"""Firmware update entities (BEHAVIOUR §2.17, G10, DECISIONS V17).

Firmware updates are a cloud service. Over the cloud the installed version
comes from the printer record (and the printer's own reports), the latest
version is the cloud's target - the installed version when no update is
offered (V17) - and install asks the cloud to update only when it flags one
as available. Over LAN the printer's installed version comes from
``info.version``; the latest version stays unknown, never a copy of the
installed one (G10, acceptance U5), and nothing can be installed.

The ACE firmware entities are cloud only and are not created on LAN-only
entries (DECISIONS round 2, Q8).
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING, Any

from homeassistant.components.update import (
    UpdateDeviceClass,
    UpdateEntity,
    UpdateEntityDescription,
    UpdateEntityFeature,
)
from homeassistant.const import EntityCategory

from . import control
from .entity import (
    AnycubicEntity,
    AnycubicEntityDescription,
    Device,
    Kind,
    async_add_when_ready,
)

if TYPE_CHECKING:
    from anycubic_cloud_client import FirmwareInfo, FirmwareProgress
    from homeassistant.core import HomeAssistant
    from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

    from .coordinator import AnycubicConfigEntry, AnycubicCoordinator


@dataclass(frozen=True, kw_only=True)
class AnycubicUpdateDescription(AnycubicEntityDescription, UpdateEntityDescription):
    """A firmware update entity; ``box`` is the ACE index, None for the printer."""

    box: int | None = None


FIRMWARE = AnycubicUpdateDescription(
    key="fw_version",
    device_class=UpdateDeviceClass.FIRMWARE,
    entity_category=EntityCategory.CONFIG,
)
ACE_FIRMWARE = (
    AnycubicUpdateDescription(
        key="multi_color_box_fw_version",
        kind=Kind.ACE1,
        device=Device.ACE1,
        box=0,
        cloud_only=True,
        device_class=UpdateDeviceClass.FIRMWARE,
        entity_category=EntityCategory.CONFIG,
    ),
    AnycubicUpdateDescription(
        key="secondary_multi_color_box_fw_version",
        kind=Kind.ACE2,
        device=Device.ACE2,
        box=1,
        cloud_only=True,
        device_class=UpdateDeviceClass.FIRMWARE,
        entity_category=EntityCategory.CONFIG,
    ),
)


async def async_setup_entry(
    hass: HomeAssistant,
    entry: AnycubicConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Set up the update entities of a config entry."""
    async_add_when_ready(
        entry.runtime_data,
        (FIRMWARE, *ACE_FIRMWARE),
        PrinterFirmware,
        async_add_entities,
    )


class PrinterFirmware(AnycubicEntity, UpdateEntity):
    """The firmware of the printer or of one ACE unit."""

    entity_description: AnycubicUpdateDescription

    def __init__(
        self, coordinator: AnycubicCoordinator, description: AnycubicUpdateDescription
    ) -> None:
        super().__init__(coordinator, description)
        self._box = description.box

    def _record(self) -> FirmwareInfo | None:
        printer = self.printer
        cloud = printer.cloud if printer.via_cloud else None
        detail = cloud.detail if cloud is not None else None
        if detail is None:
            return None
        if self._box is None:
            return detail.firmware
        for index, info in enumerate(detail.ace_firmware):
            box = info.box_id if info.box_id is not None else index
            if box == self._box:
                return info
        return None

    def _progress(self) -> FirmwareProgress | None:
        printer = self.printer
        cloud = printer.cloud if printer.via_cloud else None
        if cloud is None:
            return None
        if self._box is None:
            return cloud.firmware
        return cloud.ace_progress(self._box)

    @property
    def supported_features(self) -> UpdateEntityFeature:
        if self._record() is None:
            return UpdateEntityFeature(0)
        return UpdateEntityFeature.INSTALL | UpdateEntityFeature.PROGRESS

    @property
    def installed_version(self) -> str | None:
        progress = self._progress()
        if progress is not None and progress.installed_version:
            return progress.installed_version
        if self._box is None:
            return self.printer.firmware_version
        record = self._record()
        return record.firmware_version if record is not None else None

    @property
    def latest_version(self) -> str | None:
        # Only the cloud knows a target; LAN leaves it unknown (G10).
        record = self._record()
        return record.latest_version if record is not None else None

    @property
    def in_progress(self) -> bool:
        progress = self._progress()
        if progress is None:
            return False
        progress.expire()
        return progress.in_progress

    @property
    def update_percentage(self) -> int | None:
        progress = self._progress()
        return progress.percent if progress is not None else None

    async def async_install(
        self, version: str | None, backup: bool, **kwargs: Any
    ) -> None:
        """Wake the cloud MQTT, then ask for the update (§2.17)."""
        record = self._record()
        if record is None or not record.need_update:
            return  # nothing is offered: nothing happens
        await control.async_install_firmware(self.coordinator, self._box)
