"""Buttons (BEHAVIOUR §2.12).

Cloud-only buttons are not created on LAN-only entries (ones a 2.x install
registered stay in the registry, never removed: DECISIONS round 2, Q8),
except the three ``request_file_list_<source>`` buttons: they always exist and
are unavailable while their list cannot be fetched over the printer's current
connection, which the frontend uses as its signal (DECISIONS round 2, F3).
"""

from __future__ import annotations

from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from functools import partial
from typing import TYPE_CHECKING, Any

from homeassistant.components.button import ButtonEntity, ButtonEntityDescription
from homeassistant.const import EntityCategory

from . import control
from .const import (
    ACE_SLOTS,
    AXIS_X,
    AXIS_XY,
    AXIS_Y,
    AXIS_Z,
    DRYING_PRESETS,
    MOVE_HOME,
    MOVE_MINUS,
    MOVE_PLUS,
)
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
class AnycubicButtonDescription(AnycubicEntityDescription, ButtonEntityDescription):
    """A button and what pressing it does."""

    press_fn: Callable[[AnycubicCoordinator], Awaitable[None]]
    available_fn: Callable[[AnycubicCoordinator], bool] | None = None


FILE_LIST_SOURCES = ("local", "udisk", "cloud")


def _file_list_fetchable(source: str) -> Callable[[AnycubicCoordinator], bool]:
    def available(c: AnycubicCoordinator) -> bool:
        return c.can_fetch_file_list(source)

    return available


def _request_file_list(
    source: str,
) -> Callable[[AnycubicCoordinator], Awaitable[None]]:
    return lambda c: control.async_request_file_list(c, source)


async def _refresh_mqtt(c: AnycubicCoordinator) -> None:
    if (cloud := c.runtime.cloud) is not None:
        await cloud.mqtt.async_refresh()


async def _reset_nozzle(c: AnycubicCoordinator) -> None:
    c.ledger.reset_nozzle(c.printer.printer_id)
    c.async_update_listeners()


def _reset_slot(number: int) -> Callable[[AnycubicCoordinator], Awaitable[None]]:
    async def press(c: AnycubicCoordinator) -> None:
        c.ledger.reset_slot(c.printer.printer_id, number)
        c.async_update_listeners()

    return press


_AXES = {"x": AXIS_X, "y": AXIS_Y, "z": AXIS_Z}
_DIRECTIONS = {"plus": MOVE_PLUS, "minus": MOVE_MINUS}


def _ace_buttons(box: int) -> tuple[AnycubicButtonDescription, ...]:
    prefix = "" if box == 0 else "secondary_"
    kind = Kind.ACE1 if box == 0 else Kind.ACE2
    device = Device.ACE1 if box == 0 else Device.ACE2
    return (
        AnycubicButtonDescription(
            key=f"{prefix}ace_retract",
            kind=kind,
            device=device,
            press_fn=lambda c: control.async_ace_retract(c, box),
        ),
        AnycubicButtonDescription(
            key=f"{prefix}drying_start",
            kind=kind,
            device=device,
            press_fn=lambda c: control.async_drying_start(c, box),
        ),
        AnycubicButtonDescription(
            key=f"{prefix}drying_stop",
            kind=kind,
            device=device,
            press_fn=lambda c: control.async_drying_stop(c, box),
        ),
        *(
            AnycubicButtonDescription(
                key=f"{prefix}drying_start_preset_{number}",
                kind=kind,
                device=device,
                preset=number,
                press_fn=partial(control.async_drying_start, box=box, preset=number),
            )
            for number in DRYING_PRESETS
        ),
    )


BUTTONS: tuple[AnycubicButtonDescription, ...] = (
    AnycubicButtonDescription(
        key="pause_print", press_fn=lambda c: control.async_job_command(c, "pause")
    ),
    AnycubicButtonDescription(
        key="resume_print", press_fn=lambda c: control.async_job_command(c, "resume")
    ),
    AnycubicButtonDescription(
        key="cancel_print", press_fn=lambda c: control.async_job_command(c, "stop")
    ),
    AnycubicButtonDescription(
        key="request_axis_position",
        entity_category=EntityCategory.DIAGNOSTIC,
        entity_registry_enabled_default=False,
        press_fn=control.async_request_position,
    ),
    AnycubicButtonDescription(
        key="axis_home_xy",
        kind=Kind.FDM,
        press_fn=lambda c: control.async_move_axis(c, AXIS_XY, MOVE_HOME),
    ),
    AnycubicButtonDescription(
        key="axis_home_z",
        kind=Kind.FDM,
        press_fn=lambda c: control.async_move_axis(c, AXIS_Z, MOVE_HOME),
    ),
    AnycubicButtonDescription(
        key="axis_home_all", kind=Kind.FDM, press_fn=control.async_home_all
    ),
    *(
        AnycubicButtonDescription(
            key=f"axis_move_{axis}_{direction}",
            kind=Kind.FDM,
            press_fn=partial(control.async_move_axis, axis=axis_id, move_type=move),
        )
        for axis, axis_id in _AXES.items()
        for direction, move in _DIRECTIONS.items()
    ),
    AnycubicButtonDescription(
        key="axis_motors_off", kind=Kind.FDM, press_fn=control.async_motors_off
    ),
    *(
        AnycubicButtonDescription(
            key=f"request_file_list_{source}",
            press_fn=_request_file_list(source),
            available_fn=_file_list_fetchable(source),
        )
        for source in FILE_LIST_SOURCES
    ),
    AnycubicButtonDescription(
        key="reset_nozzle_wear",
        kind=Kind.FDM,
        entity_category=EntityCategory.CONFIG,
        entity_registry_enabled_default=False,
        press_fn=_reset_nozzle,
    ),
    AnycubicButtonDescription(
        key="ace_refresh_spools",
        kind=Kind.ACE1,
        device=Device.ACE1,
        press_fn=control.async_ace_refresh,
    ),
    *(
        AnycubicButtonDescription(
            key=f"ace_slot_{number}_feed",
            kind=Kind.ACE1,
            device=Device.ACE1,
            entity_registry_enabled_default=False,
            press_fn=partial(control.async_ace_feed, box=0, slot_index=number - 1),
        )
        for number in ACE_SLOTS
    ),
    *(
        AnycubicButtonDescription(
            key=f"ace_slot_{number}_reset_spool",
            kind=Kind.ACE1,
            device=Device.ACE1,
            entity_category=EntityCategory.CONFIG,
            entity_registry_enabled_default=False,
            press_fn=_reset_slot(number),
        )
        for number in ACE_SLOTS
    ),
    *_ace_buttons(0),
    *_ace_buttons(1),
    AnycubicButtonDescription(
        key="refresh_mqtt_connection",
        cloud_only=True,
        entity_category=EntityCategory.DIAGNOSTIC,
        press_fn=_refresh_mqtt,
    ),
)


async def async_setup_entry(
    hass: HomeAssistant,
    entry: AnycubicConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Set up the buttons of a config entry."""
    async_add_when_ready(
        entry.runtime_data, BUTTONS, AnycubicButton, async_add_entities
    )


class AnycubicButton(AnycubicEntity, ButtonEntity):
    """A printer or ACE button."""

    entity_description: AnycubicButtonDescription

    @property
    def available(self) -> bool:
        available_fn = self.entity_description.available_fn
        if available_fn is not None and not available_fn(self.coordinator):
            return False
        return super().available

    async def async_press(self) -> None:
        await self.entity_description.press_fn(self.coordinator)

    @property
    def extra_state_attributes(self) -> dict[str, Any] | None:
        """Preset buttons show their preset (§2.12)."""
        if (preset := self.entity_description.preset) is None:
            return None
        values = self.coordinator.drying_preset(preset)
        if values is None:
            return None
        duration, temperature = values
        return {"duration": duration, "temperature": temperature}
