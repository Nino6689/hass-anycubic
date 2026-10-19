"""One set of redaction rules for diagnostics and logs (Beta 3, D9 and D14).

A value is hidden when its key is sensitive or when the value itself looks
like a secret, wherever it sits in a document:

- by key: credentials and personal fields of the account, printer
  identifiers (serials, ``cn_code``, MACs, IP addresses, printer keys,
  device ids), signed URLs and camera credentials, and every print's file
  name and image;
- by key pattern: any key containing ``token``, ``secret`` or ``password``
  (or ``url``, or a file name), so a credential added later under a new key
  is hidden too;
- by shape: a JWT (three base64url segments starting ``eyJ``), a MAC
  address, an IP address inside a URL or with a port, and a signed URL.

Empty and null values stay visible: they say a field was absent.
:func:`redact_data` serves diagnostics, :func:`redact_text` and
:func:`redact_payload` serve log lines.
"""

from __future__ import annotations

from collections.abc import Collection, Mapping
import json
import re
from typing import Any

REDACTED = "**REDACTED**"

SENSITIVE_KEYS = frozenset(
    key.lower()
    for key in (
        # config entry data and the cloud session store (COMPAT §1, §6)
        "unique_id",
        "user_device_id",
        "app_client_id",
        "app_id",
        "appid",
        # the account (PROTOCOL A §2.6.1; D9)
        "user_email",
        "email",
        "mobile",
        "phone",
        "user_id",
        "user_nickname",
        "nickname",
        "casdoor_user",
        "casdoor_user_id",
        "tourist_device_id",
        "user_activation_key",
        "message_key",
        "last_login_ip",
        "ip_country",
        "ip_province",
        "ip_city",
        "birthday",
        "avatar",
        # LAN handshake and discovery document
        "username",
        "cn",
        "usn",
        # printer identifiers (D9, D14)
        "serial",
        "sn",
        "cn_code",
        "description",  # the cloud record's printer serial, hex-encoded
        "mac",
        "machine_mac",
        "connection_mac",
        "device_id",
        "deviceid",
        "device_unionid",
        "key",
        "printer_key",
        "ip",
        # every print's file name and image (D9)
        "name",
        "task_name",
        "filename",
        "file_name",
        "display_filename",
        "gcode_name",
        "temp_gcode",
        "origin3mf",
        "job_name",
        "img",
        "image_id",
        "thumbnail",
        # camera credentials
        "channel",
        "client_uid",
        "encryption_key",
        "encryption_kdf_salt",
        "event_id",
    )
)
SENSITIVE_KEY_PARTS = (
    "token",
    "secret",
    "password",
    "url",
    "host",  # ``lan_host``, the broker's ``host``: an address
    # any variant of a print's file name (``old_filename``, ``gcode_name``)
    "filename",
    "file_name",
    "gcode_name",
)

_JWT = re.compile(r"eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*")
_MAC = re.compile(
    r"(?<![0-9A-Fa-f])(?:[0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}(?![0-9A-Fa-f])"
)
# An IPv4 address is only told from a version number by its context: after
# a scheme or an "@", or followed by a port.
_IP = re.compile(
    r"(?:(?<=://)|(?<=@))(?:[0-9]{1,3}\.){3}[0-9]{1,3}"
    r"|(?<![\w.])(?:[0-9]{1,3}\.){3}[0-9]{1,3}(?=:[0-9])"
)
_SIGNED_MARKERS = ("gcode_upload?s=", "X-Amz-", "Signature=", "signature=")
# Digits a printer id needs before it is replaced inside values (D9).
_MIN_ID = 5


def is_sensitive_key(key: object) -> bool:
    """Whether a value under ``key`` is hidden."""
    if not isinstance(key, str):
        return False
    lowered = key.lower()
    return lowered in SENSITIVE_KEYS or any(
        part in lowered for part in SENSITIVE_KEY_PARTS
    )


def _empty(value: Any) -> bool:
    return value is None or (isinstance(value, str | list | dict) and not value)


def redact_text(text: str, *known: str) -> str:
    """A string with every secret-shaped part, and each of ``known``, hidden."""
    if any(marker in text for marker in _SIGNED_MARKERS):
        return REDACTED
    for value in known:
        if value:
            text = text.replace(value, REDACTED)
    text = _JWT.sub(REDACTED, text)
    text = _MAC.sub(REDACTED, text)
    return _IP.sub(REDACTED, text)


class _Ids:
    """Printer ids, each shown as the same placeholder everywhere (D9)."""

    def __init__(self, printer_ids: Collection[int | str]) -> None:
        self._names = {
            str(printer_id): f"printer_{position}"
            for position, printer_id in enumerate(
                dict.fromkeys(str(i) for i in printer_ids), start=1
            )
        }
        # Values are matched only for ids long enough not to be mistaken
        # for an ordinary figure; keys always are.
        self._values = {i: n for i, n in self._names.items() if len(i) >= _MIN_ID}
        self._pattern = (
            re.compile(
                r"(?<![0-9])(" + "|".join(map(re.escape, self._values)) + r")(?![0-9])"
            )
            if self._values
            else None
        )

    def key(self, key: Any) -> Any:
        return self._names.get(str(key), key) if isinstance(key, str) else key

    def value(self, value: Any) -> Any:
        if self._pattern is None:
            return value
        if isinstance(value, int) and not isinstance(value, bool):
            return self._values.get(str(value), value)
        if isinstance(value, str):
            return self._pattern.sub(lambda m: self._values[m.group(1)], value)
        return value


def redact_data(value: Any, printer_ids: Collection[int | str] = ()) -> Any:
    """A copy of a JSON-like document with every rule applied.

    ``printer_ids`` are replaced by ``printer_1``, ``printer_2``, ... in keys
    and values alike, so a printer can be followed across blocks.
    """
    return _redact(value, _Ids(printer_ids))


def _redact(value: Any, ids: _Ids) -> Any:
    if isinstance(value, Mapping):
        return {
            ids.key(key): (
                REDACTED
                if is_sensitive_key(key) and not _empty(item)
                else _redact(item, ids)
            )
            for key, item in value.items()
        }
    if isinstance(value, list | tuple):
        return [_redact(item, ids) for item in value]
    if isinstance(value, str):
        return ids.value(redact_text(value))
    return ids.value(value)


def redact_payload(payload: bytes | str) -> str:
    """A raw printer message, made safe to log (D14).

    JSON is redacted by key and shape; anything else by shape only.
    """
    text = payload.decode("utf-8", "replace") if isinstance(payload, bytes) else payload
    try:
        document = json.loads(text)
    except ValueError:
        return redact_text(text)
    return json.dumps(redact_data(document), separators=(",", ":"))
