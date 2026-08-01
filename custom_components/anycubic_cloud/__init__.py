"""The anycubic_cloud component."""
from __future__ import annotations

import homeassistant.helpers.config_validation as cv
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.typing import ConfigType

from .const import (
    CONF_CARD_CONFIG,
    DOMAIN,
    PLATFORMS,
)
from .coordinator import AnycubicCloudDataUpdateCoordinator
from .panel import async_register_panel, async_unregister_panel
from .services import SERVICES

CONFIG_SCHEMA = cv.config_entry_only_config_schema(DOMAIN)


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Register actions once, at startup.

    Quality scale (action-setup): actions must exist even when no config entry
    is loaded, so automations referencing them still validate. The handlers
    themselves raise if the entry they need is missing.
    """
    for service_name, service in SERVICES:
        hass.services.async_register(
            DOMAIN,
            service_name,
            service(hass).async_call_service,
            service.schema,
        )

    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up Anycubic Cloud from a config entry."""

    coordinator = AnycubicCloudDataUpdateCoordinator(hass, entry)

    await coordinator.async_config_entry_first_refresh()

    # Per-entry state lives on the entry itself (quality scale: runtime-data).
    entry.runtime_data = coordinator

    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    entry.async_on_unload(entry.add_update_listener(update_listener))

    # register panel
    await async_register_panel(
        hass,
        entry.options.get(CONF_CARD_CONFIG)
    )

    return True


async def update_listener(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Handle options update."""
    await hass.config_entries.async_reload(entry.entry_id)


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a config entry."""

    unload_ok = await hass.config_entries.async_unload_platforms(
        entry, PLATFORMS
    )

    if unload_ok:
        coordinator = getattr(entry, "runtime_data", None)
        if coordinator is not None:
            await coordinator.stop_anycubic_mqtt_connection_if_started()

    # Actions are registered in async_setup and deliberately left in place:
    # they are owned by the integration, not by any single config entry.

    # unregister panel
    async_unregister_panel(hass)

    return unload_ok
