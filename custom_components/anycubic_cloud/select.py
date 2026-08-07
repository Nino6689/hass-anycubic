"""Selects for Anycubic Cloud.

Print speed mode, which the printer publishes its own options for -- Quiet,
Standard and Sport on a Kobra S1 -- rather than a list hardcoded here that
would be wrong on another model.

Like the other live controls, the printer only accepts a change while a job
is running, so this reports unavailable when idle instead of accepting a
value that would be silently dropped.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING, Any

from homeassistant.components.select import SelectEntity, SelectEntityDescription
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from .const import AXIS_STEPS_MM, LOGGER, PrinterEntityType
from .entity import AnycubicCloudEntity, AnycubicCloudEntityDescription
from .helpers import printer_attributes_for_key, printer_state_for_key

# Writes go through the cloud API one request at a time.
PARALLEL_UPDATES = 0

if TYPE_CHECKING:
    from .coordinator import AnycubicCloudDataUpdateCoordinator


@dataclass(frozen=True)
class AnycubicSelectEntityDescription(
    SelectEntityDescription, AnycubicCloudEntityDescription
):
    """Describes an Anycubic Cloud select entity."""

    # Where the current value and the option list are read from. Kept apart
    # from `key` because unique ids are built from the key, and a sensor
    # already reports this same reading -- sharing the key collides.
    state_key: str = ""


SELECT_TYPES: list[AnycubicSelectEntityDescription] = list([
    AnycubicSelectEntityDescription(
        key="axis_step",
        translation_key="axis_step",
        printer_entity_type=PrinterEntityType.FDM,
        options=[f"{step} mm" for step in AXIS_STEPS_MM],
    ),
    AnycubicSelectEntityDescription(
        key="set_speed_mode",
        translation_key="set_speed_mode",
        state_key="job_speed_mode",
        # PRINTER rather than FDM: the real gate is whether the printer
        # publishes any speed modes, which `available` already checks.
        printer_entity_type=PrinterEntityType.PRINTER,
    ),
])


async def async_setup_entry(
    hass: HomeAssistant, entry: ConfigEntry, async_add_entities: AddEntitiesCallback
) -> None:
    """Set up the Anycubic Cloud select entry."""
    coordinator: AnycubicCloudDataUpdateCoordinator = entry.runtime_data
    coordinator.add_entities_for_seen_printers(
        async_add_entities=async_add_entities,
        entity_constructor=AnycubicSelect,
        platform=Platform.SELECT,
        available_descriptors=list(SELECT_TYPES),
    )


class AnycubicSelect(AnycubicCloudEntity, SelectEntity):
    """A print setting chosen from the printer's own list of options."""

    entity_description: AnycubicSelectEntityDescription

    def _modes(self) -> list[dict[str, Any]]:
        """The modes this printer says it supports, in its own order."""
        attributes = printer_attributes_for_key(
            self.coordinator, self._printer_id, self.entity_description.state_key
        )
        modes = (attributes or {}).get("available_modes")

        return [m for m in modes if isinstance(m, dict)] if modes else []

    @property
    def options(self) -> list[str]:
        if self.entity_description.key == "axis_step":
            return list(self.entity_description.options or [])

        return [str(m.get("description")) for m in self._modes() if m.get("description")]

    @property
    def available(self) -> bool:
        if self.entity_description.key == "axis_step":
            return super().available

        # No options means no job running, and the printer would refuse the
        # change -- better to look unavailable than to accept and drop it.
        return super().available and bool(self.options)

    @property
    def current_option(self) -> str | None:
        if self.entity_description.key == "axis_step":
            return f"{self.coordinator.get_axis_step(self._printer_id)} mm"

        state = printer_state_for_key(
            self.coordinator, self._printer_id, self.entity_description.state_key
        )

        return str(state) if state else None

    async def async_select_option(self, option: str) -> None:
        """Send the printer the mode code behind the chosen name."""
        if self.entity_description.key == "axis_step":
            await self.coordinator.async_set_axis_step(
                self._printer_id, int(option.split()[0])
            )
            return

        code = next(
            (
                m.get("mode")
                for m in self._modes()
                if str(m.get("description")) == option
            ),
            None,
        )

        if code is None:
            raise HomeAssistantError(f"{option} is not a speed mode this printer offers")

        LOGGER.debug("Setting print speed mode to %s (code %s).", option, code)
        await self.coordinator.async_set_print_speed_mode(self._printer_id, int(code))
