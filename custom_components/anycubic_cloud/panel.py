"""Serve the dashboard card and register the side panel (FRONTEND §1).

The bundles come from the ``anycubic_cloud_frontend`` package (built from
this repository's ``frontend/``) through its interface: ``locate_dir()``,
``entrypoint_js()``, ``webcomponent_name()``, ``card_js()`` and
``card_hash()`` (DECISIONS round 2, Q6). Only version 1.0.0 or later is
used; the version is read from the package metadata before anything is
imported, so an older release is never loaded. Without it, the bundles
shipped in ``www/`` (``anycubic-card.js`` and one ``entrypoint*.js``) are
served instead; without either, nothing is registered and the integration
works without its card.

Registration happens at the start of entry setup, before the first refresh,
so a failing entry still serves its card (B26).
"""

from __future__ import annotations

from dataclasses import dataclass
import hashlib
import importlib
from importlib import metadata
import logging
from pathlib import Path
from typing import TYPE_CHECKING, Any

from homeassistant.components import frontend, panel_custom
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntryState
from packaging.version import InvalidVersion, Version

from .const import CONF_CARD_CONFIG, DOMAIN

if TYPE_CHECKING:
    from homeassistant.config_entries import ConfigEntry
    from homeassistant.core import HomeAssistant

_LOGGER = logging.getLogger(__name__)

WWW = Path(__file__).parent / "www"
STATIC_PREFIX = "/anycubic-cloud-panel-static"
CARD_FILE = "anycubic-card.js"
PANEL_URL_PATH = "anycubic_cloud"
PANEL_COMPONENT = "anycubic-cloud-panel"
PANEL_TITLE = "Anycubic Cloud & LAN"
PANEL_ICON = "mdi:printer-3d"
_DATA = f"{DOMAIN}_frontend"

FRONTEND_PACKAGE = "anycubic_cloud_frontend"
FRONTEND_DISTRIBUTION = "anycubic-cloud-frontend"
FRONTEND_MIN_VERSION = Version("1.0.0")


@dataclass(frozen=True, slots=True)
class FrontendFiles:
    """Where the built panel and card are, and what they are called."""

    directory: str
    panel_file: str
    component: str
    card_file: str
    card_hash: str


def _short_hash(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()[:8]


def _package_files() -> FrontendFiles | None:
    """The files of ``anycubic_cloud_frontend`` >= 1.0.0, if installed."""
    try:
        installed = Version(metadata.version(FRONTEND_DISTRIBUTION))
    except metadata.PackageNotFoundError:
        return None
    except InvalidVersion:
        _LOGGER.debug("Ignoring %s with an unreadable version", FRONTEND_DISTRIBUTION)
        return None
    if installed < FRONTEND_MIN_VERSION:
        # Checked before importing: releases before 1.0.0 are never loaded.
        _LOGGER.debug(
            "Ignoring %s %s; %s or later is needed",
            FRONTEND_DISTRIBUTION,
            installed,
            FRONTEND_MIN_VERSION,
        )
        return None
    try:
        package = importlib.import_module(FRONTEND_PACKAGE)
        return FrontendFiles(
            directory=str(package.locate_dir()),
            panel_file=str(package.entrypoint_js()),
            component=str(package.webcomponent_name()),
            card_file=str(package.card_js()),
            card_hash=str(package.card_hash()),
        )
    except Exception:
        # A broken package must not stop the entry; fall back to www/.
        _LOGGER.exception("Could not load %s", FRONTEND_PACKAGE)
        return None


def _www_files(www: Path) -> FrontendFiles | None:
    """The bundles shipped in ``www/``, or ``None`` when not shipped."""
    card = www / CARD_FILE
    panels = sorted(www.glob("entrypoint*.js"))
    if not card.is_file() or not panels:
        return None
    return FrontendFiles(
        directory=str(www),
        panel_file=panels[0].name,
        component=PANEL_COMPONENT,
        card_file=CARD_FILE,
        card_hash=_short_hash(card),
    )


def _find_frontend() -> FrontendFiles | None:
    """The package first, then the ``www/`` fallback (round 2, Q6)."""
    return _package_files() or _www_files(WWW)


def _static_path_served(hass: HomeAssistant) -> bool:
    return any(
        resource.canonical == STATIC_PREFIX
        for resource in hass.http.app.router.resources()
        if hasattr(resource, "canonical")
    )


async def async_register_frontend(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Serve the card and register the panel once for the whole integration."""
    if "frontend" not in hass.config.components:
        return
    files = await hass.async_add_executor_job(_find_frontend)
    if files is None:
        _LOGGER.debug("No card or panel bundle installed or shipped in %s", WWW)
        return
    state: dict[str, Any] = hass.data.setdefault(_DATA, {})
    if not state.get("static"):
        # Claimed before the await so concurrent setups do not both register;
        # released again if registration fails, so a later entry retries.
        state["static"] = True
        try:
            await hass.http.async_register_static_paths(
                [StaticPathConfig(STATIC_PREFIX, files.directory, cache_headers=False)]
            )
        except RuntimeError:
            # Registered by a concurrent setup: fine if it is being served.
            if not _static_path_served(hass):
                state["static"] = False
                raise
        except BaseException:
            state["static"] = False
            raise
        frontend.add_extra_js_url(
            hass, f"{STATIC_PREFIX}/{files.card_file}?v={files.card_hash}"
        )
    if PANEL_URL_PATH in hass.data.get(frontend.DATA_PANELS, {}):
        return
    try:
        await panel_custom.async_register_panel(
            hass,
            frontend_url_path=PANEL_URL_PATH,
            webcomponent_name=files.component,
            sidebar_title=PANEL_TITLE,
            sidebar_icon=PANEL_ICON,
            module_url=f"{STATIC_PREFIX}/{files.panel_file}",
            embed_iframe=False,
            require_admin=False,
            # The stored card_config is the panel's config itself (round 2, F1).
            config=dict(entry.options.get(CONF_CARD_CONFIG) or {}),
        )
    except ValueError:
        # Lost a race with another entry: success if the panel exists.
        if PANEL_URL_PATH not in hass.data.get(frontend.DATA_PANELS, {}):
            raise


def async_unregister_frontend(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Remove the panel only when no other entry of the domain is loaded."""
    others = [
        other
        for other in hass.config_entries.async_entries(DOMAIN)
        if other.entry_id != entry.entry_id and other.state is ConfigEntryState.LOADED
    ]
    if others:
        return
    if PANEL_URL_PATH in hass.data.get(frontend.DATA_PANELS, {}):
        frontend.async_remove_panel(hass, PANEL_URL_PATH, warn_if_unknown=False)
