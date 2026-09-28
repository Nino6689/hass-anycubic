"""Selects (BEHAVIOUR §2.14)."""

from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING

from homeassistant.components.select import SelectEntity, SelectEntityDescription
from homeassistant.exceptions import ServiceValidationError

from . import control
from .const import AXIS_STEPS, DOMAIN
from .entity import (
    AnycubicEntity,
    AnycubicEntityDescription,
    Kind,
    async_add_when_ready,
)

if TYPE_CHECKING:
    from homeassistant.core import HomeAssistant
    from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

    from .coordinator import AnycubicConfigEntry, AnycubicCoordinator


@dataclass(frozen=True, kw_only=True)
class AnycubicSelectDescription(AnycubicEntityDescription, SelectEntityDescription):
    """A select of a printer."""


AXIS_STEP = AnycubicSelectDescription(key="axis_step", kind=Kind.FDM)
SPEED_MODE = AnycubicSelectDescription(key="set_speed_mode")


async def async_setup_entry(
    hass: HomeAssistant,
    entry: AnycubicConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Set up the selects of a config entry."""

    def factory(
        coordinator: AnycubicCoordinator, description: AnycubicSelectDescription
    ) -> AnycubicEntity:
        if description is AXIS_STEP:
            return AxisStepSelect(coordinator, description)
        return SpeedModeSelect(coordinator, description)

    async_add_when_ready(
        entry.runtime_data, (AXIS_STEP, SPEED_MODE), factory, async_add_entities
    )


class AxisStepSelect(AnycubicEntity, SelectEntity):
    """Jog step, stored per printer in the ledger (BEHAVIOUR §3.12)."""

    entity_description: AnycubicSelectDescription
    _attr_options = [f"{step} mm" for step in AXIS_STEPS]

    @property
    def current_option(self) -> str:
        return f"{self.coordinator.ledger.axis_step(self.printer.printer_id)} mm"

    async def async_select_option(self, option: str) -> None:
        step = int(option.split(maxsplit=1)[0])
        self.coordinator.ledger.set_axis_step(self.printer.printer_id, step)
        self.async_write_ha_state()


class SpeedModeSelect(AnycubicEntity, SelectEntity):
    """Print speed mode, named from the cloud's list (BEHAVIOUR §1.5).

    LAN has no list of mode names, so on a LAN connection this entity is
    always unavailable. Over the cloud the list survives the job, so it is
    available while idle but refuses a change.
    """

    entity_description: AnycubicSelectDescription

    @property
    def options(self) -> list[str]:
        return [str(mode["description"]) for mode in self.printer.speed_modes]

    @property
    def available(self) -> bool:
        return super().available and bool(self.options)

    @property
    def current_option(self) -> str | None:
        return self.printer.job_speed_mode

    async def async_select_option(self, option: str) -> None:
        """Send the code paired with the name (order 6); refused unless a
        job is in progress (BEHAVIOUR §2.14)."""
        for mode in self.printer.speed_modes:
            if str(mode["description"]) == option:
                await control.async_set_speed_mode(self.coordinator, int(mode["mode"]))
                return
        raise ServiceValidationError(
            translation_domain=DOMAIN, translation_key="speed_mode_unavailable"
        )
