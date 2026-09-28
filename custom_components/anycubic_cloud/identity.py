"""Identity rules shared by setup, entities and stored data (COMPAT §1-§3)."""

from __future__ import annotations

import hashlib
from typing import TYPE_CHECKING, Final

from homeassistant.helpers.device_registry import format_mac

from .const import CONF_USER_TOKEN, DOMAIN, LAN_ONLY_USER_ID

if TYPE_CHECKING:
    from homeassistant.config_entries import ConfigEntry

# A LAN deviceId made only of digits and at most this long is used as the
# printer id directly (COMPAT §2).
_MAX_NUMERIC_ID_LENGTH = 15


def lan_printer_id(device_id: str) -> int:
    """Printer id of a LAN-only printer, from the broker's ``deviceId``.

    All digits and at most 15 characters: that number. Otherwise the 6-byte
    BLAKE2b digest of the id, read as a big-endian unsigned integer (COMPAT
    §2), which stays below 2**48 and so is safe in Home Assistant's JSON
    storage.
    """
    if device_id.isdigit() and len(device_id) <= _MAX_NUMERIC_ID_LENGTH:
        return int(device_id)
    digest = hashlib.blake2b(device_id.encode("utf-8"), digest_size=6).digest()
    return int.from_bytes(digest, "big")


def entry_unique_id_for_lan(mac: str | None, host: str) -> str:
    """Config entry unique id of a LAN-only setup: ``aa:bb:..`` or ``lan-<host>``."""
    if mac:
        return format_mac(mac)
    return f"lan-{host.strip()}"


# Unique-id prefix of a printer that reports no MAC (DECISIONS round 2, Q4).
NO_MAC: Final = "None"


def unique_id_mac(mac: str) -> str:
    """The MAC as used in entity unique ids: upper case, hyphen separated.

    ``aa:bb:cc:dd:ee:ff`` and ``A4-E8-8D-80-54-C8`` both become
    ``A4-E8-8D-80-54-C8`` (COMPAT §3; BEHAVIOUR §6 B32).
    """
    return format_mac(mac).replace(":", "-").upper()


def is_cloud_entry(entry: ConfigEntry) -> bool:
    """An entry set up with an Anycubic token (BEHAVIOUR §0.1).

    LAN-only entries have no ``user_token`` at all; a cloud entry whose token
    is empty is still one, and asks for re-authentication (§5.7).
    """
    return CONF_USER_TOKEN in entry.data


def device_user_id(entry: ConfigEntry) -> str:
    """The user-id part of device identifiers.

    Cloud entries are keyed by the account's user id (the entry's unique id);
    LAN-only entries have no account and use the literal ``None`` (COMPAT §2).
    """
    if is_cloud_entry(entry) and entry.unique_id:
        return entry.unique_id
    return LAN_ONLY_USER_ID


def printer_identifier(entry: ConfigEntry, printer_id: int) -> tuple[str, str]:
    """Device registry identifier of a printer."""
    return (DOMAIN, f"{device_user_id(entry)}-{printer_id}")


def ace_identifier(entry: ConfigEntry, printer_id: int, box: int) -> tuple[str, str]:
    """Device registry identifier of the ACE with index ``box`` (0 or 1)."""
    return (DOMAIN, f"{device_user_id(entry)}-{printer_id}-ace{box}")
