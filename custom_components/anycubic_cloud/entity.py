"""Base entity, device info and the pending-entity rule (BEHAVIOUR §1.7)."""

from __future__ import annotations

from collections.abc import Callable, Iterable
from dataclasses import dataclass
from enum import StrEnum
from typing import TYPE_CHECKING, Any, cast

from homeassistant.core import callback
from homeassistant.helpers import device_registry as dr
from homeassistant.helpers.device_registry import CONNECTION_NETWORK_MAC, DeviceInfo
from homeassistant.helpers.entity import EntityDescription
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from .const import MANUFACTURER
from .coordinator import AnycubicCoordinator, AnycubicRuntime
from .identity import ace_identifier, printer_identifier
from .model import MATERIAL_FILAMENT, MATERIAL_RESIN

if TYPE_CHECKING:
    from homeassistant.helpers.entity import Entity
    from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

    from .model import Printer


# Current Home Assistant links a device to its parent by the parent's registry
# id and reports the older ``via_device`` identifier form as deprecated; the
# oldest supported versions have only the identifier form.
VIA_DEVICE_ID = "via_device_id" in DeviceInfo.__optional_keys__


class Kind(StrEnum):
    """When a descriptor's entity exists (COMPAT §3 "Type")."""

    PRINTER = "printer"
    FDM = "fdm"
    LCD = "lcd"
    ACE1 = "ace1"
    ACE2 = "ace2"


class Device(StrEnum):
    """Which device an entity sits on."""

    PRINTER = "printer"
    ACE1 = "ace1"
    ACE2 = "ace2"


@dataclass(frozen=True, kw_only=True)
class AnycubicEntityDescription(EntityDescription):
    """Common description fields. ``translation_key`` is always the key."""

    kind: Kind = Kind.PRINTER
    device: Device = Device.PRINTER
    preset: int | None = None
    """Drying preset number for the preset buttons (``dry1``/``dry2``)."""
    cloud_only: bool = False
    """Created only on entries with an Anycubic account (DECISIONS round 2,
    Q8: never on LAN-only entries)."""


def device_info(coordinator: AnycubicCoordinator, device: Device) -> DeviceInfo:
    """Device registry entry of the printer or one of its ACE units (COMPAT §2)."""
    printer = coordinator.printer
    entry = coordinator.config_entry
    identity = printer.identity
    printer_id = identity.printer_id
    if device is Device.PRINTER:
        info = DeviceInfo(
            identifiers={printer_identifier(entry, printer_id)},
            manufacturer=MANUFACTURER,
            model=identity.model_name,
            name=identity.name,
            sw_version=printer.firmware_version,
            serial_number=str(printer_id),
        )
        if identity.connection_mac:
            info["connections"] = {(CONNECTION_NETWORK_MAC, identity.connection_mac)}
        return info
    box = 0 if device is Device.ACE1 else 1
    model = printer.ace_model(box)
    name = f"{identity.name} {model}" if box == 0 else f"{identity.name} {model} 2"
    info = DeviceInfo(
        identifiers={ace_identifier(entry, printer_id, box)},
        manufacturer=MANUFACTURER,
        model=model,
        name=name,
    )
    link: dict[str, Any]
    if not VIA_DEVICE_ID:
        link = {"via_device": printer_identifier(entry, printer_id)}
    elif coordinator.printer_device_id is not None:
        link = {"via_device_id": coordinator.printer_device_id}
    else:  # pragma: no cover - setup registers the printer before any entity
        link = {}
    info.update(cast("DeviceInfo", link))
    return info


@callback
def async_register_printer_device(coordinator: AnycubicCoordinator) -> None:
    """Register the printer's device, the parent its ACE units link to."""
    device = dr.async_get(coordinator.hass).async_get_or_create(
        config_entry_id=coordinator.config_entry.entry_id,
        **device_info(coordinator, Device.PRINTER),
    )
    coordinator.printer_device_id = device.id


class AnycubicEntity(CoordinatorEntity[AnycubicCoordinator]):
    """An entity of one printer. Unique id ``<MAC>-<key>`` (COMPAT §3)."""

    _attr_has_entity_name = True
    entity_description: AnycubicEntityDescription

    def __init__(
        self,
        coordinator: AnycubicCoordinator,
        description: AnycubicEntityDescription,
    ) -> None:
        super().__init__(coordinator)
        self.entity_description = description
        printer = coordinator.printer
        self._attr_unique_id = f"{printer.identity.mac}-{description.key}"
        # The frontend finds entities by translation key (FRONTEND §3.3). The
        # English names are COMPAT's "Name (en)" (DECISIONS round 2, Q9.1).
        self._attr_translation_key = description.key
        self._attr_device_info = device_info(coordinator, description.device)

    @property
    def printer(self) -> Printer:
        return self.coordinator.printer


def description_ready(
    coordinator: AnycubicCoordinator, description: AnycubicEntityDescription
) -> bool | None:
    """``True`` to create now, ``False`` to wait, ``None`` to drop for good."""
    if not coordinator.has_printer:
        return False
    if description.cloud_only and coordinator.runtime.cloud is None:
        return None
    printer = coordinator.printer
    kind = description.kind
    if kind in (Kind.FDM, Kind.LCD):
        material = printer.identity.material_type
        if material is None:
            return False  # G14: kept pending until the material is known
        wanted = MATERIAL_FILAMENT if kind is Kind.FDM else MATERIAL_RESIN
        return True if material == wanted else None
    if kind in (Kind.ACE1, Kind.ACE2):
        # B1 (#41): kept pending until the ACE reports, never dropped.
        needed = 1 if kind is Kind.ACE1 else 2
        if not printer.supports_ace or printer.ace_count < needed:
            return False
        if description.preset is not None:
            return coordinator.drying_preset(description.preset) is not None
    return True


def async_add_when_ready[D: AnycubicEntityDescription](
    runtime: AnycubicRuntime,
    descriptions: Iterable[D],
    factory: Callable[[AnycubicCoordinator, D], Entity],
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Add each printer's entities once their existence rule holds.

    Re-checked on every update of that printer (BEHAVIOUR §1.7).
    """
    wanted = tuple(descriptions)
    entry = runtime.entry

    @callback
    def _track(coordinator: AnycubicCoordinator) -> None:
        pending: list[D] = list(wanted)

        @callback
        def _check() -> None:
            ready: list[Entity] = []
            for description in list(pending):
                verdict = description_ready(coordinator, description)
                if verdict is False:
                    continue
                pending.remove(description)
                if verdict:
                    ready.append(factory(coordinator, description))
            if ready:
                async_add_entities(ready)

        _check()
        if pending:
            entry.async_on_unload(coordinator.async_add_listener(_check))

    for coordinator in list(runtime.coordinators.values()):
        _track(coordinator)


def attrs_or_none(value: dict[str, Any] | None) -> dict[str, Any] | None:
    return value if value else None
