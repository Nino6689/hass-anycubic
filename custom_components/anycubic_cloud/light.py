"""The printer light (BEHAVIOUR §2.16): on/off only, no dimming."""

from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING, Any

from homeassistant.components.light import LightEntity, LightEntityDescription
from homeassistant.components.light.const import ColorMode

from . import control
from .entity import AnycubicEntity, AnycubicEntityDescription, async_add_when_ready

if TYPE_CHECKING:
    from homeassistant.core import HomeAssistant
    from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

    from .coordinator import AnycubicConfigEntry


@dataclass(frozen=True, kw_only=True)
class AnycubicLightDescription(AnycubicEntityDescription, LightEntityDescription):
    """The printer light."""


PRINTER_LIGHT = AnycubicLightDescription(key="printer_light")


async def async_setup_entry(
    hass: HomeAssistant,
    entry: AnycubicConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Set up the light of a config entry."""
    async_add_when_ready(
        entry.runtime_data, (PRINTER_LIGHT,), PrinterLight, async_add_entities
    )


class PrinterLight(AnycubicEntity, LightEntity):
    """Exists on every printer; available once a light is known (§3.13)."""

    _attr_color_mode = ColorMode.ONOFF
    entity_description: AnycubicLightDescription
    _attr_supported_color_modes = {ColorMode.ONOFF}

    @property
    def available(self) -> bool:
        return super().available and self.printer.has_light

    @property
    def is_on(self) -> bool | None:
        return self.printer.light_on

    async def async_turn_on(self, **kwargs: Any) -> None:
        await control.async_set_light(self.coordinator, True)

    async def async_turn_off(self, **kwargs: Any) -> None:
        await control.async_set_light(self.coordinator, False)
