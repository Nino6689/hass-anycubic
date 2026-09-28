"""The Anycubic Cloud & LAN integration (``anycubic_cloud`` 3.0).

An entry reaches its printers over LAN Mode, over the Anycubic cloud, or
both (a *hybrid* entry: LAN for the printer LAN Mode reaches, the cloud for
the rest; BEHAVIOUR §5.4). LAN-only entries have no account.
"""

from __future__ import annotations

import logging

from anycubic_cloud_client import (
    AnycubicCloudError,
    PrinterDetail,
    PrinterRemovedError,
    UnexpectedResponseError,
)
from homeassistant.const import EVENT_HOMEASSISTANT_STOP, Platform
from homeassistant.core import Event, HomeAssistant
from homeassistant.exceptions import (
    ConfigEntryAuthFailed,
    ConfigEntryError,
    ConfigEntryNotReady,
)
from homeassistant.helpers import (
    config_validation as cv,
    device_registry as dr,
    issue_registry as ir,
)
from homeassistant.helpers.start import async_at_started
from homeassistant.helpers.typing import ConfigType

from .cloud import ISSUE_TOKEN_EXPIRING, CloudAccount
from .const import CONF_LAN_HOST, CONF_LAN_MODE_ENABLED, CONF_PRINTER_IDS, DOMAIN
from .coordinator import AnycubicConfigEntry, AnycubicCoordinator, AnycubicRuntime
from .credentials import async_get_cloud_secrets
from .entity import async_register_printer_device
from .identity import device_user_id, is_cloud_entry
from .panel import async_register_frontend, async_unregister_frontend
from .services import async_setup_services

_LOGGER = logging.getLogger(__name__)

PLATFORMS = [
    Platform.BINARY_SENSOR,
    Platform.BUTTON,
    Platform.CAMERA,
    Platform.IMAGE,
    Platform.LIGHT,
    Platform.NUMBER,
    Platform.SELECT,
    Platform.SENSOR,
    Platform.SWITCH,
    Platform.UPDATE,
]

CONFIG_SCHEMA = cv.config_entry_only_config_schema(DOMAIN)

# The LAN-only beta's repair for cloud entries; deleted when found (CLOUD.md §2).
ISSUE_CLOUD_PENDING = "cloud_not_supported_yet"


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Register the actions, with or without entries (BEHAVIOUR §4)."""
    async_setup_services(hass)
    return True


def _lan_host(entry: AnycubicConfigEntry) -> str | None:
    host = str(entry.options.get(CONF_LAN_HOST) or "").strip()
    return host if entry.options.get(CONF_LAN_MODE_ENABLED) and host else None


async def async_setup_entry(hass: HomeAssistant, entry: AnycubicConfigEntry) -> bool:
    """Set up one entry (BEHAVIOUR §5.7)."""
    # The card is served before anything can fail (B26).
    await async_register_frontend(hass, entry)
    ir.async_delete_issue(hass, DOMAIN, f"{ISSUE_CLOUD_PENDING}_{entry.entry_id}")
    runtime = AnycubicRuntime(hass, entry)
    await runtime.async_load()
    host = _lan_host(entry)
    try:
        if is_cloud_entry(entry):
            await _async_setup_cloud_entry(hass, entry, runtime, host)
        elif host is not None:
            coordinator = AnycubicCoordinator(hass, runtime, host=host)
            await coordinator.async_setup_lan()
            runtime.add(coordinator)
        else:
            raise ConfigEntryNotReady(
                translation_domain=DOMAIN, translation_key="lan_mode_off"
            )
    except BaseException:
        await runtime.async_shutdown()
        raise
    entry.runtime_data = runtime
    entry.async_on_unload(runtime.async_shutdown)

    async def _on_stop(_event: Event) -> None:
        if runtime.cloud is not None:
            await runtime.cloud.async_shutdown()

    entry.async_on_unload(
        hass.bus.async_listen_once(EVENT_HOMEASSISTANT_STOP, _on_stop)
    )

    async def _on_started(_hass: HomeAssistant) -> None:
        # Nothing is started while Home Assistant starts (§5.2): check now.
        if runtime.cloud is not None:
            await runtime.cloud.mqtt.async_check()

    entry.async_on_unload(async_at_started(hass, _on_started))
    for coordinator in list(runtime.coordinators.values()):
        await coordinator.async_config_entry_first_refresh()
        async_register_printer_device(coordinator)
    _async_remove_unselected_devices(hass, entry)
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    return True


async def _async_setup_cloud_entry(
    hass: HomeAssistant,
    entry: AnycubicConfigEntry,
    runtime: AnycubicRuntime,
    host: str | None,
) -> None:
    """A cloud entry, hybrid when ``host`` is set (BEHAVIOUR §5.4, §5.7)."""
    secrets = await async_get_cloud_secrets(hass)
    if secrets is None and host is None:
        # Cloud-only entries wait, their data untouched (CLOUD.md §1).
        raise ConfigEntryNotReady(
            translation_domain=DOMAIN, translation_key="cloud_credentials_unavailable"
        )
    printer_ids = [int(pid) for pid in entry.data.get(CONF_PRINTER_IDS) or []]
    details: dict[int, PrinterDetail] = {}
    missing: list[int] = []
    if secrets is not None:
        account = CloudAccount(hass, entry, runtime, secrets)
        try:
            await account.async_sign_in()
        except ConfigEntryAuthFailed:
            if host is None:
                raise
            # Hybrid: LAN keeps working while the user renews the token.
            entry.async_start_reauth(hass)
        except ConfigEntryNotReady as err:
            if host is None:
                raise
            _LOGGER.debug("Cloud not available at setup, using LAN: %s", err)
        else:
            runtime.cloud = account
            for index, printer_id in enumerate(printer_ids):
                try:
                    details[printer_id] = await account.async_fetch_printer(printer_id)
                except PrinterRemovedError as err:
                    # 1007: what LAN Mode does - never an authentication
                    # failure (B8). A hybrid entry reads it over LAN.
                    if host is None:
                        raise ConfigEntryNotReady(
                            translation_domain=DOMAIN,
                            translation_key="printer_not_in_cloud",
                        ) from err
                    missing.append(printer_id)
                except UnexpectedResponseError as err:
                    if host is None and index == 0:
                        raise ConfigEntryNotReady(
                            translation_domain=DOMAIN,
                            translation_key="cloud_read_error",
                        ) from err
                    missing.append(printer_id)
                except AnycubicCloudError as err:
                    if host is None:
                        raise ConfigEntryNotReady(
                            translation_domain=DOMAIN,
                            translation_key="printer_not_in_cloud",
                        ) from err
                    missing.append(printer_id)
    if runtime.cloud is None:
        missing = list(printer_ids)
    lan_target = _lan_printer(printer_ids, missing, host)
    for printer_id in printer_ids:
        detail = details.get(printer_id)
        if detail is not None:
            coordinator = AnycubicCoordinator.from_cloud(
                hass, runtime, detail, host=host if printer_id == lan_target else None
            )
            if coordinator.link is not None:
                await coordinator.async_setup_lan()
            runtime.add(coordinator)
        elif printer_id == lan_target and host is not None:
            coordinator = AnycubicCoordinator(
                hass, runtime, host=host, lan_printer_id=printer_id
            )
            await coordinator.async_setup_lan()
            runtime.add(coordinator)
        elif runtime.cloud is not None:
            # Printers neither the cloud nor LAN can supply: retried (B37,
            # G23); the retried setup picks them up (E2-Q5 in QUESTIONS.md).
            raise ConfigEntryNotReady(
                translation_domain=DOMAIN, translation_key="printer_not_in_cloud"
            )
        else:
            # Hybrid while the cloud is unavailable: the LAN printer runs, the
            # others come with the cloud (the next setup).
            _LOGGER.debug("Printer %s waits for the Anycubic cloud", printer_id)
    if not runtime.coordinators:
        raise ConfigEntryError(translation_domain=DOMAIN, translation_key="no_printers")


def _lan_printer(
    printer_ids: list[int], missing: list[int], host: str | None
) -> int | None:
    """Which printer LAN Mode reaches on a hybrid entry.

    The only one; else the one the cloud could not supply (a printer in LAN
    Mode leaves the account); else the first, with a warning (DECISIONS
    round 2, Q5).
    """
    if host is None or not printer_ids:
        return None
    if len(printer_ids) == 1:
        return printer_ids[0]
    if missing:
        return missing[0]
    _LOGGER.warning(
        "Several printers and one LAN Mode address; LAN is used for printer %s",
        printer_ids[0],
    )
    return printer_ids[0]


def _async_remove_unselected_devices(
    hass: HomeAssistant, entry: AnycubicConfigEntry
) -> None:
    """Devices of printers no longer selected leave the entry (§1.7).

    Only cloud entries choose printers; ACE devices go with their printer.
    """
    if not is_cloud_entry(entry):
        return
    selected = {str(pid) for pid in entry.data.get(CONF_PRINTER_IDS) or []}
    prefix = f"{device_user_id(entry)}-"
    registry = dr.async_get(hass)
    for device in dr.async_entries_for_config_entry(registry, entry.entry_id):
        for domain, identifier in device.identifiers:
            if domain != DOMAIN or not identifier.startswith(prefix):
                continue
            printer_id = identifier[len(prefix) :].split("-", 1)[0]
            if printer_id not in selected:
                if set(device.config_entries) == {entry.entry_id}:
                    registry.async_remove_device(device.id)
                else:  # pragma: no cover - shared devices exist only before 2026.9
                    registry.async_update_device(
                        device.id, remove_config_entry_id=entry.entry_id
                    )
                break


async def async_unload_entry(hass: HomeAssistant, entry: AnycubicConfigEntry) -> bool:
    """Unload an entry; the runtime closes the links and saves the stores."""
    unloaded = await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
    if unloaded:
        async_unregister_frontend(hass, entry)
    return unloaded


async def async_remove_entry(hass: HomeAssistant, entry: AnycubicConfigEntry) -> None:
    """Forget the entry's repair issues."""
    ir.async_delete_issue(hass, DOMAIN, f"{ISSUE_CLOUD_PENDING}_{entry.entry_id}")
    ir.async_delete_issue(hass, DOMAIN, f"{ISSUE_TOKEN_EXPIRING}_{entry.entry_id}")
