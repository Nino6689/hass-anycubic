"""Diagnostics with every secret redacted (COMPAT §6, anycubic-lan HW4).

Redacted: the pasted token and cloud session fields, the account's e-mail,
mobile and other personal fields (the entry title is the e-mail), LAN broker
credentials, the discovery token, serial numbers, MACs and printer keys,
signed URLs and camera credentials - by key and, as a second net, any string
that carries a URL signature, wherever it appears. Anycubic's app
credentials are never collected at all.
"""

from __future__ import annotations

from collections.abc import Mapping
import dataclasses
from enum import Enum
from typing import TYPE_CHECKING, Any

from homeassistant.components.diagnostics import REDACTED, async_redact_data

if TYPE_CHECKING:
    from homeassistant.core import HomeAssistant

    from .coordinator import AnycubicConfigEntry, AnycubicCoordinator, AnycubicRuntime

TO_REDACT = {
    # cloud entry data and session store (COMPAT §1, §6)
    "title",
    "unique_id",
    "user_token",
    "user_device_id",
    "auth_token",
    "auth_access_token",
    "app_secret",
    "app_client_id",
    "app_id",
    "appid",
    # the account (PROTOCOL A §2.6.1)
    "user_email",
    "email",
    "mobile",
    "user_id",
    "user_nickname",
    "casdoor_user",
    "casdoor_user_id",
    "message_key",
    "last_login_ip",
    "ip_country",
    "ip_province",
    "ip_city",
    "birthday",
    # LAN handshake and discovery document
    "token",
    "username",
    "password",
    "cn",
    "usn",
    "serial",
    "sn",
    "description",  # the cloud record's printer serial (PROTOCOL B §2.3.2)
    "fileUploadurl",
    "fileuploadurl",
    "file_upload_url",
    # printer identifiers
    "mac",
    "machine_mac",
    "connection_mac",
    "device_id",
    "deviceId",
    "device_unionid",
    "key",
    "printer_key",
    "ip",
    # signed URLs and camera credentials
    "url",
    "thumbnail",
    "preSignUrl",
    "img",
    "image_url",
    "rtc_token",
    "channel",
    "client_uid",
    "encryption_key",
    "encryption_kdf_salt",
    "event_id",
}

# Any string carrying one of these is a signed URL or credential.
_SIGNED_MARKERS = ("gcode_upload?s=", "X-Amz-", "Signature=", "signature=")


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


def _scrub(value: Any) -> Any:
    """Replace any string that carries a signed URL."""
    if isinstance(value, str):
        return REDACTED if any(m in value for m in _SIGNED_MARKERS) else value
    if isinstance(value, dict):
        return {key: _scrub(item) for key, item in value.items()}
    if isinstance(value, list):
        return [_scrub(item) for item in value]
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


async def async_get_config_entry_diagnostics(
    hass: HomeAssistant, entry: AnycubicConfigEntry
) -> dict[str, Any]:
    """Diagnostics of a config entry."""
    runtime = entry.runtime_data
    result: dict[str, Any] = {
        "entry": {
            "title": entry.title,
            "version": entry.version,
            "minor_version": entry.minor_version,
            "data": dict(entry.data),
            "options": dict(entry.options),
        },
        "cloud": _account(runtime),
        "printers": [_printer(c) for c in runtime.coordinators.values()],
        "ledger": runtime.ledger.data,
        "capabilities": runtime.capability_data,
    }
    return _scrub(async_redact_data(result, TO_REDACT))  # type: ignore[no-any-return]
