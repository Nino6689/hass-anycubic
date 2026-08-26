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

        try:
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
        except ValueError:
            # Multi-printer setups create one config entry per printer. Each
            # entry calls async_register_panel(), and Home Assistant sets the
            # entries up concurrently, so more than one can pass the
            # `frontend_panels` guard above before the first has actually
            # registered the panel -- the await in between is a real suspension
            # point. The loser then raises, and unhandled that failed the whole
            # entry: its entities stayed unavailable and only one printer
            # worked.
            #
            # There is one panel for the integration however many printers are
            # configured, so a panel that is already there is the outcome we
            # wanted, not an error.
            #
            # Judged by asking the registry rather than by reading the
            # exception's message. Core spells it "Overwriting panel
            # <frontend_url_path>" today, but that is a formatted string with
            # no promises attached, and a fix that stops working when someone
            # rewords it would fail exactly the way it does now: silently, on
            # somebody else's multi-printer setup.
            if DOMAIN not in hass.data.get("frontend_panels", {}):
                raise

            LOGGER.debug("Panel already registered by a sibling entry.")


def async_unregister_panel(hass: HomeAssistant) -> None:
    """Take the panel away, but only once the last printer has gone.

    The same singleton, in the other direction. There is one panel for the
    integration however many printers are configured, and removing it is an
    unconditional pop -- so unloading one entry took the sidebar away from
    every other printer that was still perfectly well loaded. Reloading a
    single entry did it too: the panel vanished for everyone and came back
    only as a side effect of that one entry setting itself up again.

    Home Assistant is asked which entries are still loaded rather than any
    count being kept here, because a tally maintained by hand is a tally that
    drifts the first time a setup fails halfway. The entry being unloaded is
    already excluded: core moves it to UNLOAD_IN_PROGRESS before calling this,
    and async_loaded_entries returns only entries in LOADED.
    """
    still_loaded = hass.config_entries.async_loaded_entries(DOMAIN)

    if still_loaded:
        LOGGER.debug(
            "Keeping the panel: %s other printer(s) still loaded.",
            len(still_loaded),
        )
        return

    frontend.async_remove_panel(hass, DOMAIN)
    LOGGER.debug("Removing panel")
