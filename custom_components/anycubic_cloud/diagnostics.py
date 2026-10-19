"""Diagnostics with every secret and personal value redacted (COMPAT §6, D9).

The rules are :mod:`.redact`'s, shared with the log lines (D14): credentials
and personal fields of the account, printer identifiers, signed URLs, camera
credentials and every print's file name and image are hidden by key; any key
containing ``token``, ``secret`` or ``password`` and any JWT-shaped string
are hidden wherever they appear. Each printer id reads as the same
placeholder in every block, and the job history keeps its figures under
numbered keys instead of file names. Anycubic's app credentials are never
collected at all.
"""

from __future__ import annotations

from collections.abc import Mapping
import dataclasses
from enum import Enum
from typing import TYPE_CHECKING, Any

from .const import CONF_PRINTER_IDS
from .redact import REDACTED, redact_data

if TYPE_CHECKING:
    from homeassistant.core import HomeAssistant

    from .coordinator import AnycubicConfigEntry, AnycubicCoordinator, AnycubicRuntime


def _plain(value: Any) -> Any:
    """Frozen dataclasses, mapping proxies and enums as plain JSON values."""
    if dataclasses.is_dataclass(value) and not isinstance(value, type):
        return {
            field.name: _plain(getattr(value, field.name))
            for field in dataclasses.fields(value)
            if not field.name.startswith("_")
        }
    if isinstance(value, Mapping):
        return {str(key): _plain(item) for key, item in value.items()}
    if isinstance(value, list | tuple | set | frozenset):
        return [_plain(item) for item in value]
    if isinstance(value, Enum):
        return value.value
    return value


def _printer(coordinator: AnycubicCoordinator) -> dict[str, Any]:
    link = coordinator.link
    info = link.info if link is not None else None
    printer = coordinator.printer if coordinator.has_printer else None
    cloud = printer.cloud if printer is not None else None
    return {
        "connection": {
            "source": printer.source if printer is not None else None,
            "lan_connected": coordinator.lan_connected,
            "last_update_success": coordinator.last_update_success,
            "discovery": info.discovery.as_redacted_dict() if info else None,
            "model_id": info.model_id if info else None,
            "broker": (
                {
                    "host": info.credentials.host,
                    "port": info.credentials.port,
                    "scheme": info.credentials.scheme,
                }
                if info
                else None
            ),
        },
        "printer": (
            {
                "identity": _plain(printer.identity),
                "info_seen": printer.info_seen,
                "axis_move_state": printer.axis_move_state,
                "state": _plain(printer.state),
            }
            if printer
            else None
        ),
        "cloud": (
            {
                "detail": _plain(cloud.detail.raw) if cloud.detail else None,
                "job": _plain(cloud.job.raw) if cloud.job else None,
                "job_detail": _plain(cloud.job_detail.raw)
                if cloud.job_detail
                else None,
                "device_status": cloud.device_status,
                "work_status": cloud.work_status,
                "removed": cloud.removed,
                "download_progress": cloud.download_progress,
                "file_lists": _plain(cloud.file_lists),
                "firmware": _plain(cloud.firmware),
                "ace_firmware": _plain(cloud.ace_firmware),
                "faults": _plain(cloud.faults),
            }
            if cloud is not None
            else None
        ),
        "forecast": _plain(coordinator.forecast),
    }


def _account(runtime: AnycubicRuntime) -> dict[str, Any] | None:
    account = runtime.cloud
    if account is None:
        return None
    client = account.client
    mqtt = account.mqtt
    return {
        "region": account.region.value,
        "auth_mode": int(client.auth_mode) if client is not None else None,
        # The account's "id" is its user id: shown under a redacted key.
        "account": (
            {
                ("user_id" if key == "id" else key): value
                for key, value in _plain(account.account.raw).items()
            }
            if account.account
            else None
        ),
        "last_poll_ok": account.last_poll_ok,
        "mqtt": {
            "mode": mqtt.mode,
            "possible": mqtt.possible,
            "supports_login": mqtt.supports_login,
            "active": mqtt.active,
            "connected": mqtt.connected,
            "manual": mqtt.manual,
            "last_error": mqtt.last_error,
        },
        "cloud_files": _plain(account.cloud_files),
    }


def _ledger(data: Mapping[str, Any]) -> dict[str, Any]:
    """The ledger with its job history under numbered keys, not file names."""
    ledger = dict(data)
    jobs = ledger.get("jobs")
    if isinstance(jobs, Mapping):
        ledger["jobs"] = {
            f"job_{number}": samples
            for number, samples in enumerate(jobs.values(), start=1)
        }
    return ledger


def _printer_ids(entry: AnycubicConfigEntry, runtime: AnycubicRuntime) -> list[Any]:
    ids: list[Any] = [c.printer_id for c in runtime.coordinators.values()]
    configured = entry.data.get(CONF_PRINTER_IDS)
    if isinstance(configured, list):
        ids.extend(configured)
    for block in (runtime.ledger.data, runtime.capability_data):
        printers = block.get("printers")
        if isinstance(printers, Mapping):
            ids.extend(printers)
    return [i for i in ids if str(i).strip()]


async def async_get_config_entry_diagnostics(
    hass: HomeAssistant, entry: AnycubicConfigEntry
) -> dict[str, Any]:
    """Diagnostics of a config entry."""
    runtime = entry.runtime_data
    result: dict[str, Any] = {
        "entry": {
            "title": REDACTED,  # the account's e-mail
            "version": entry.version,
            "minor_version": entry.minor_version,
            "data": dict(entry.data),
            "options": dict(entry.options),
        },
        "cloud": _account(runtime),
        "printers": [_printer(c) for c in runtime.coordinators.values()],
        "ledger": _ledger(runtime.ledger.data),
        "capabilities": runtime.capability_data,
    }
    return redact_data(result, _printer_ids(entry, runtime))  # type: ignore[no-any-return]
