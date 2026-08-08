"""Anycubic Cloud frontend panel."""
from __future__ import annotations

from typing import Any

import anycubic_cloud_frontend
from homeassistant.components import frontend, panel_custom
from homeassistant.components.http import StaticPathConfig
from homeassistant.core import HomeAssistant

from .const import (
    DOMAIN,
    LOGGER,
    PANEL_ICON,
    PANEL_TITLE,
)
from .helpers import extract_panel_card_config

PANEL_URL = "/anycubic-cloud-panel-static"


def process_card_config(
    conf_object: Any,
) -> dict[str, Any]:
    if isinstance(conf_object, dict):
        return extract_panel_card_config(conf_object)
    else:
        return {}


def async_register_card(hass: HomeAssistant) -> None:
    """Make the Anycubic card available to dashboards.

    Home Assistant does not load third-party cards into dashboards on its own,
    so without this the card ships with the integration but never appears in
    the card picker unless the user adds it as a resource by hand.
    """
    frontend.add_extra_js_url(
        hass, f"{PANEL_URL}/{anycubic_cloud_frontend.card_js_url}"
    )


async def async_register_panel(
    hass: HomeAssistant,
    conf_object: Any,
) -> None:
    """Register the Anycubic Cloud frontend panel."""
    if DOMAIN not in hass.data.get("frontend_panels", {}):
        # The built panel ships in its own package rather than inside the
        # integration, so Home Assistant core's rule against bundled frontend
        # assets is satisfied. Serve the whole directory: the entrypoint
        # filename carries a content hash for cache-busting.
        panel_dir = anycubic_cloud_frontend.locate_dir()

        try:
            await hass.http.async_register_static_paths(
                [StaticPathConfig(PANEL_URL, panel_dir, cache_headers=False)]
            )
        except RuntimeError as e:
            if "already registered" not in str(e):
                raise e

        async_register_card(hass)

        conf = process_card_config(conf_object)

        LOGGER.debug(f"Processed panel config: {conf}")

        await panel_custom.async_register_panel(
            hass,
            webcomponent_name=anycubic_cloud_frontend.webcomponent_name,
            frontend_url_path=DOMAIN,
            module_url=f"{PANEL_URL}/{anycubic_cloud_frontend.entrypoint_js}",
            sidebar_title=PANEL_TITLE,
            sidebar_icon=PANEL_ICON,
            require_admin=False,
            config=conf,
        )


def async_unregister_panel(hass: HomeAssistant) -> None:
    frontend.async_remove_panel(hass, DOMAIN)
    LOGGER.debug("Removing panel")
