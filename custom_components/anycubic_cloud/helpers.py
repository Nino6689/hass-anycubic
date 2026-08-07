from __future__ import annotations

import asyncio
import base64
import binascii
import hashlib
import json
import re
from enum import IntEnum
from types import MappingProxyType
from typing import TYPE_CHECKING, Any

import aiohttp
from anycubic_cloud_api import AnycubicAPI
from anycubic_cloud_api.const.enums import AnycubicPrinterMaterialType
from anycubic_cloud_api.models.auth import AnycubicAuthMode
from homeassistant.core import HomeAssistant
from homeassistant.helpers.device_registry import CONNECTION_NETWORK_MAC, DeviceInfo
from homeassistant.helpers.storage import Store

from .const import (
    ACE_MODEL_FALLBACK,
    ACE_MODEL_NAMES,
    CONF_DRYING_PRESET_DURATION_,
    CONF_DRYING_PRESET_TEMPERATURE_,
    DOMAIN,
    MANUFACTURER,
    STORAGE_KEY,
    STORAGE_VERSION,
    PrinterEntityType,
)

if TYPE_CHECKING:
    from .coordinator import AnycubicCloudDataUpdateCoordinator
    from .entity import AnycubicCloudEntityDescription


class AnycubicMQTTConnectMode(IntEnum):
    Printing_Only = 1
    Printing_Drying = 2
    Device_Online = 3
    Always = 4
    Never_Connect = 5


def build_printer_device_info(
    coordinator_data: dict[str, Any],
    printer_id: int,
) -> DeviceInfo:
    printer_data = coordinator_data['printers'][printer_id]['states']
    user_data = coordinator_data['user_info']
    mac = printer_data.get("machine_mac")

    return DeviceInfo(
        identifiers={(DOMAIN, f"{user_data['id']}-{printer_data['id']}")},
        manufacturer=MANUFACTURER,
        model=printer_data["machine_name"],
        name=printer_data["name"],
        # A printer that has never been seen through the cloud may not report
        # one, and the device registry rejects a null connection outright.
        connections={(CONNECTION_NETWORK_MAC, mac)} if mac else set(),
        sw_version=printer_data["fw_version"],
        hw_version=f"Printer ID: {printer_id}",
        serial_number=f"{printer_id}",
    )


def build_ace_device_info(
    coordinator_data: dict[str, Any],
    printer_id: int,
    secondary: bool = False,
) -> DeviceInfo:
    """An ACE is a physically separate unit, so give it its own device.

    A printer can have two of them, and keeping every spool, drying and fan
    entity under the printer made the device page hard to read.
    """
    printer_data = coordinator_data['printers'][printer_id]['states']
    printer_attrs = coordinator_data['printers'][printer_id]['attributes']
    user_data = coordinator_data['user_info']

    box_index = 1 if secondary else 0
    prefix = "secondary_" if secondary else ""

    box_info = (printer_attrs.get(f"{prefix}ace_spools") or {}).get('box_info') or {}
    model_id = box_info.get('model_id')
    model = (
        ACE_MODEL_NAMES.get(int(model_id), ACE_MODEL_FALLBACK)
        if isinstance(model_id, int)
        else ACE_MODEL_FALLBACK
    )
    name = f"{printer_data['name']} {model}"

    if secondary:
        name = f"{name} 2"

    return DeviceInfo(
        identifiers={(DOMAIN, f"{user_data['id']}-{printer_data['id']}-ace{box_index}")},
        manufacturer=MANUFACTURER,
        model=model,
        name=name,
        sw_version=printer_data.get(f"{prefix}multi_color_box_fw_version"),
        via_device=(DOMAIN, f"{user_data['id']}-{printer_data['id']}"),
    )


def file_count(file_list: Any) -> int | None:
    """How many files a list holds, or None if it was never fetched.

    None keeps the entity unavailable until the list is requested, which is
    honest: zero files and "not asked yet" are different states.
    """
    if file_list is None:
        return None

    try:
        return len(file_list)
    except TypeError:
        return None


def safe_external_shelves(printer: Any) -> dict[str, Any] | None:
    """The external filament holder as a plain dict, or None.

    AnycubicPrinter uses __slots__, and a printer built with ignore_init_errors
    leaves the slot unassigned when that part of the payload fails to parse --
    so the attribute raises rather than returning None. That guard is why this
    exists; the values themselves now come from public accessors.
    """
    try:
        shelves = printer.external_shelves
    except AttributeError:
        return None

    if shelves is None:
        return None

    return {
        "material": shelves.material_type,
        "color": shelves.color or None,
        "color_hex": shelves.color_hex,
        "loaded": shelves.loaded,
    }


def async_filament_store(hass: HomeAssistant, entry_id: str) -> Store[dict[str, Any]]:
    """Per-entry store for the filament-remaining estimate."""
    return Store[dict[str, Any]](
        hass, STORAGE_VERSION, f"{STORAGE_KEY}.filament.{entry_id}"
    )


def async_token_store(hass: HomeAssistant, entry_id: str) -> Store[dict[str, Any]]:
    """The saved-token store for one config entry.

    Keyed per entry: the tokens the cloud hands back are account-specific, so a
    single shared key meant two accounts overwrote each other's credentials.
    """
    return Store[dict[str, Any]](hass, STORAGE_VERSION, f"{STORAGE_KEY}.{entry_id}")


async def async_load_saved_tokens(
    hass: HomeAssistant,
    entry_id: str,
    anycubic_api: AnycubicAPI,
) -> None:
    """Load previously saved tokens into the API client.

    The token the user pasted is only the starting point -- the cloud refreshes
    it, and the refreshed value is what stays valid. Without this the
    integration re-authenticates from the original token on every restart and
    demands re-auth once that one ages out, even though working credentials
    were sitting in storage.
    """
    config = await async_token_store(hass, entry_id).async_load()

    if not config:
        # Fall back to the pre-per-entry store, then migrate it across.
        legacy = Store[dict[str, Any]](hass, STORAGE_VERSION, STORAGE_KEY)
        config = await legacy.async_load()
        if config:
            await async_token_store(hass, entry_id).async_save(config)

    if config:
        anycubic_api.load_auth_config_from_dict(config, minimal=True)


def build_color_swatch_data_uri(colors_hex: list[str] | None) -> str | None:
    """Build a small SVG swatch of the filament colour(s), as a data URI.

    Used as the entity picture for ACE slots so the colour is visible on the
    normal device page. Multi-colour spools are drawn as vertical bands, in
    the order the printer reports them.
    """
    if not colors_hex:
        return None

    safe = [c for c in colors_hex if re.fullmatch(r"#[0-9A-Fa-f]{6}", str(c))]

    if not safe:
        return None

    size = 48
    band = size / len(safe)
    bands = "".join(
        f'<rect x="{i * band:.3f}" y="0" width="{band:.3f}" height="{size}" fill="{c}"/>'
        for i, c in enumerate(safe)
    )
    # A filament spool seen face on: the wound filament is the coloured ring,
    # masked out in the middle for the hub. The neutral rims keep white and
    # very light filament visible against a white background.
    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size} {size}">'
        f'<defs><mask id="m">'
        f'<circle cx="24" cy="24" r="22" fill="white"/>'
        f'<circle cx="24" cy="24" r="7" fill="black"/>'
        f'</mask></defs>'
        f'<g mask="url(#m)">{bands}</g>'
        f'<circle cx="24" cy="24" r="22" fill="none" stroke="#8b8b8b" stroke-width="2"/>'
        f'<circle cx="24" cy="24" r="12" fill="none" stroke="#8b8b8b" stroke-width="1.5" opacity="0.55"/>'
        f'<circle cx="24" cy="24" r="7" fill="none" stroke="#8b8b8b" stroke-width="2"/>'
        f'</svg>'
    )

    encoded = base64.b64encode(svg.encode("utf-8")).decode("ascii")

    return f"data:image/svg+xml;base64,{encoded}"


def get_drying_preset_from_entry_options(
    entry_options: MappingProxyType[str, Any],
    preset_number: int | str,
) -> tuple[int | None, int | None]:
    preset_duration = entry_options.get(f"{CONF_DRYING_PRESET_DURATION_}{preset_number}")
    preset_temperature = entry_options.get(f"{CONF_DRYING_PRESET_TEMPERATURE_}{preset_number}")

    return (
        preset_duration,
        preset_temperature,
    )


def printer_state_for_key(
    coordinator: AnycubicCloudDataUpdateCoordinator,
    printer_id: int,
    state_key: str,
) -> Any:
    return coordinator.data['printers'][printer_id]['states'][state_key]


def printer_attributes_for_key(
    coordinator: AnycubicCloudDataUpdateCoordinator,
    printer_id: int,
    attribute_key: str,
) -> dict[str, Any] | None:
    attr: dict[str, Any] | None = coordinator.data['printers'][printer_id]['attributes'].get(attribute_key)
    return attr


def printer_state_connected_ace_units(
    coordinator: AnycubicCloudDataUpdateCoordinator,
    printer_id: int,
) -> int:
    return int(
        printer_state_for_key(
            coordinator,
            printer_id,
            'connected_ace_units',
        )
    )


def printer_state_supports_ace(
    coordinator: AnycubicCloudDataUpdateCoordinator,
    printer_id: int,
) -> bool:
    return bool(
        printer_state_for_key(
            coordinator,
            printer_id,
            'supports_function_multi_color_box',
        )
    )


def check_descriptor_status_not_lcd(
    description: AnycubicCloudEntityDescription,
    material_type: AnycubicPrinterMaterialType,
) -> bool:
    return (
        description.printer_entity_type == PrinterEntityType.LCD
        and material_type != AnycubicPrinterMaterialType.RESIN
    )


def check_descriptor_status_not_fdm(
    description: AnycubicCloudEntityDescription,
    material_type: AnycubicPrinterMaterialType,
) -> bool:
    return (
        description.printer_entity_type == PrinterEntityType.FDM
        and material_type != AnycubicPrinterMaterialType.FILAMENT
    )


def check_descriptor_state_ace_not_supported(
    description: AnycubicCloudEntityDescription,
    supports_ace: bool,
) -> bool:
    return (
        description.printer_entity_type in [
            PrinterEntityType.ACE_PRIMARY,
            PrinterEntityType.ACE_SECONDARY,
            PrinterEntityType.DRY_PRESET_PRIMARY,
            PrinterEntityType.DRY_PRESET_SECONDARY,
        ]
        and not supports_ace
    )


def check_descriptor_state_ace_primary_unavailable(
    description: AnycubicCloudEntityDescription,
    supports_ace: bool,
    connected_ace_units: int,
) -> bool:
    return (
        description.printer_entity_type in [
            PrinterEntityType.ACE_PRIMARY,
            PrinterEntityType.DRY_PRESET_PRIMARY,
        ]
        and supports_ace
        and connected_ace_units < 1
    )


def check_descriptor_state_ace_secondary_unavailable(
    description: AnycubicCloudEntityDescription,
    supports_ace: bool,
    connected_ace_units: int,
) -> bool:
    return (
        description.printer_entity_type in [
            PrinterEntityType.ACE_SECONDARY,
            PrinterEntityType.DRY_PRESET_SECONDARY,
        ]
        and supports_ace
        and connected_ace_units < 2
    )


def check_descriptor_state_drying_available(
    description: AnycubicCloudEntityDescription,
    supports_ace: bool,
    connected_ace_units: int,
) -> bool:
    return (
        supports_ace
        and (
            description.printer_entity_type == PrinterEntityType.DRY_PRESET_PRIMARY
            and connected_ace_units >= 1
        ) or (
            description.printer_entity_type == PrinterEntityType.DRY_PRESET_SECONDARY
            and connected_ace_units >= 2
        )
    )


def check_descriptor_state_drying_unavailable(
    description: AnycubicCloudEntityDescription,
    supports_ace: bool,
    connected_ace_units: int,
    entry_options: MappingProxyType[str, Any],
) -> bool:
    drying_available = check_descriptor_state_drying_available(
        description,
        supports_ace,
        connected_ace_units,
    )

    if not drying_available:
        return False

    preset_duration, preset_temperature = get_drying_preset_from_entry_options(
        entry_options,
        description.key[-1],
    )

    return (
        not preset_duration
        or not preset_temperature
        or int(preset_temperature) <= 0
        or int(preset_duration) <= 0
    )


def printer_entity_unique_id(
    coordinator: AnycubicCloudDataUpdateCoordinator,
    printer_id: int,
    entity_suffix: str,
) -> str:
    return f"{printer_state_for_key(coordinator, printer_id, 'machine_mac')}-{entity_suffix}"


def state_string_active(state: Any) -> str:
    return "active" if state is not None else "inactive"


def state_string_loaded(state: Any) -> str:
    return "loaded" if state is not None else "not loaded"


# REGEX_TOKEN_STRING = re.compile(r"^['\"]?([_-A-Za-z0-9+\/.]{236,238})['\"]?$")


# def clean_user_token(input_token):
#     token_length = len(input_token)
#     if token_length == 236:
#         return input_token
#     if token_length > 236:
#         matches = REGEX_TOKEN_STRING.findall(input_token)
#         if len(matches) == 1:
#             return matches[0]
#     raise TypeError(f"Invalid token, expected 236 or 238 chars, got {token_length}.")


REGEX_NOQUOTE_STRING = re.compile(r"^['\"]?([^'\"]+)['\"]?$")


def remove_quotes_from_string(input_string: str) -> str:
    matches = REGEX_NOQUOTE_STRING.findall(input_string)

    if len(matches) == 1:
        return str(matches[0])

    raise TypeError("Unexpected quotes in string.")


def validate_value_is_type[T: Any](
    value: Any,
    value_type: type[T],
    allow_lists: bool = False,
) -> T | list[T] | None:
    if allow_lists and isinstance(value, list):
        for v in value:
            if not isinstance(v, value_type):
                return None
        return value
    elif isinstance(value, value_type):
        return value

    return None


def get_value_from_dict_if_type[T: Any](
    input_dict: dict[str, Any],
    key: str,
    value_type: type[T],
    allow_lists: bool = False,
) -> T | list[T] | None:
    if (
        key in input_dict
        and (
            val := validate_value_is_type(
                input_dict[key],
                value_type,
                allow_lists,
            )
        )
    ):
        return val

    return None


def update_dict_and_validate(
    output_dict: dict[str, Any],
    input_dict: dict[str, Any],
    key: str,
    value_type: Any,
    allow_lists: bool = False,
) -> None:
    if val := get_value_from_dict_if_type(input_dict, key, value_type, allow_lists):
        output_dict[key] = val


def extract_panel_card_config(
    input_conf: dict[str, Any],
) -> dict[str, Any]:
    card_conf: dict[str, Any] = {}

    if len(input_conf) == 0:
        return card_conf

    update_dict_and_validate(card_conf, input_conf, 'vertical', bool)
    update_dict_and_validate(card_conf, input_conf, 'round', bool)
    update_dict_and_validate(card_conf, input_conf, 'use_24hr', bool)
    update_dict_and_validate(card_conf, input_conf, 'temperatureUnit', str)
    update_dict_and_validate(card_conf, input_conf, 'lightEntityId', str)
    update_dict_and_validate(card_conf, input_conf, 'powerEntityId', str)
    update_dict_and_validate(card_conf, input_conf, 'cameraEntityId', str)
    update_dict_and_validate(card_conf, input_conf, 'monitoredStats', str, allow_lists=True)
    update_dict_and_validate(card_conf, input_conf, 'scaleFactor', float)
    update_dict_and_validate(card_conf, input_conf, 'slotColors', str, allow_lists=True)
    update_dict_and_validate(card_conf, input_conf, 'showSettingsButton', bool)
    update_dict_and_validate(card_conf, input_conf, 'alwaysShow', bool)

    return card_conf


# --- Pasted-token handling -------------------------------------------------
#
# Users paste tokens from three very different places (slicer config file,
# browser console, network capture), so what actually arrives is often not a
# bare token: it can carry quotes, whitespace, a `copy(...)` wrapper, or be a
# whole JSON blob. Rather than rejecting that, we dig the token out.

# A Casdoor/slicer token is a JWT: three base64url segments separated by dots.
REGEX_JWT = re.compile(r"eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+")

# Keys the token hides behind when a whole config/localStorage blob is pasted.
TOKEN_JSON_KEYS = ("access_token", "XX-Token", "token", "auth_token")


def extract_pasted_token(raw: str | None) -> str | None:
    """Pull a usable token out of whatever the user pasted.

    Handles a bare token, a quoted token, a `"access_token": "..."` fragment,
    a full slicer config, or console output. Returns None if nothing looks
    like a token at all.
    """
    if not raw:
        return None

    text = str(raw).strip()

    # A JWT is unambiguous wherever it appears, so prefer it. This covers the
    # slicer config, console output and stray wrapping in one shot.
    jwt_match = REGEX_JWT.search(text)
    if jwt_match:
        return jwt_match.group(0)

    # Otherwise it may be a JSON object containing an opaque (web) token.
    if text.startswith("{"):
        try:
            data = json.loads(text)
        except ValueError:
            data = None

        if isinstance(data, dict):
            # Slicer configs nest the token under `anycubic_cloud`.
            candidates: list[Any] = [data, data.get("anycubic_cloud")]
            for candidate in candidates:
                if not isinstance(candidate, dict):
                    continue
                for key in TOKEN_JSON_KEYS:
                    value = candidate.get(key)
                    if isinstance(value, str) and value.strip():
                        return value.strip()

    # A `"key": "value"` fragment pasted out of a config file.
    fragment = re.search(
        rf"[\"']?(?:{'|'.join(TOKEN_JSON_KEYS)})[\"']?\s*[:=]\s*[\"']([^\"']+)[\"']",
        text,
    )
    if fragment:
        return fragment.group(1).strip()

    # Plain token, possibly wrapped in quotes or a copy()/print() call.
    stripped = text.strip("()[]{} \t\r\n")
    stripped = stripped.strip("\"'")

    # Reject anything with internal whitespace -- that isn't a token, it's prose.
    if not stripped or any(ch.isspace() for ch in stripped):
        return None

    return stripped


def detect_auth_mode(
    token: str | None,
    device_id: str | None = None,
) -> AnycubicAuthMode:
    """Work out which Anycubic auth mode a pasted token belongs to.

    Saves the user having to understand the difference before they've even set
    the integration up:
      * a device id is only ever supplied for the Android flow
      * anything else is guessed as a slicer token, since that is the mode
        worth having -- it is the only one that gets live MQTT updates

    This is a guess and cannot be anything else: web tokens are JWTs too, so
    nothing about a token distinguishes them. A wrong guess is recovered from
    rather than prevented -- the slicer login is tried, and if the server
    rejects it the token is retried as a web token instead.
    """
    if device_id:
        return AnycubicAuthMode.ANDROID

    if token and token.startswith("eyJ"):
        return AnycubicAuthMode.SLICER

    return AnycubicAuthMode.WEB


def _token_claims(token: str | None) -> dict[str, Any]:
    """Decode a JWT's payload claims, without verifying anything.

    Returns {} for anything that is not a readable JWT -- callers treat that
    as "the token has nothing to say", never as an error.
    """
    if not token or not token.startswith("eyJ"):
        return {}

    parts = token.split(".")
    if len(parts) < 2:
        return {}

    payload = parts[1]
    payload += "=" * (-len(payload) % 4)  # restore stripped base64 padding

    try:
        claims = json.loads(base64.urlsafe_b64decode(payload))
    except Exception:  # noqa: BLE001 - a malformed token simply has no claims
        return {}

    return claims if isinstance(claims, dict) else {}


def token_expiry_timestamp(token: str | None) -> int | None:
    """Read the `exp` claim out of a JWT token, without verifying it.

    Anycubic slicer tokens are 90-day JWTs. We only read the expiry so we can
    warn before it lapses -- the signature is the server's business, and we
    deliberately don't trust anything else in here.
    """
    expiry = _token_claims(token).get("exp")

    return int(expiry) if isinstance(expiry, (int, float)) else None

# What a working Anycubic slicer token carries. A JWT with anything else in
# `tokenType` is a real token, just not the one the API accepts -- and the
# server's answer to those is a flat "User does not exist", which sends people
# looking for account problems they don't have.
TOKEN_TYPE_EXPECTED = "access-token"


def describe_token(token: str | None) -> dict[str, Any]:
    """The non-identifying claims of a pasted token, for diagnostics.

    Deliberately excludes `sub`, `id`, `email` and `phone` -- this ends up in
    debug logs that get pasted into issue reports.
    """
    claims = _token_claims(token)

    return {
        k: claims[k]
        for k in ("tokenType", "scope", "iss", "aud")
        if k in claims
    }


def token_type_looks_wrong(token: str | None) -> str | None:
    """The token's own `tokenType`, when it is not the one the API wants.

    Returns None when the token is fine, unreadable, or does not say -- only a
    positive, contradictory answer is worth reporting to the user.
    """
    kind = describe_token(token).get("tokenType")

    if kind and kind != TOKEN_TYPE_EXPECTED:
        return str(kind)

    return None


# Access tokens are RS256 JWTs from Anycubic's Casdoor instance, which
# publishes its signing keys. That lets a pasted token be verified locally
# before the server ever sees it -- which matters because the server's answer
# to ANY invalid token (corrupted, truncated, stale, or not a token at all) is
# a flat "User does not exist". Verified empirically by mutating a known-good
# token four different ways: every mutation got that same message.
CASDOOR_ISSUER = "https://uc.makeronline.com"
JWKS_URL = "https://uc.makeronline.com/.well-known/jwks"
# ASN.1 DigestInfo prefix for SHA-256, per EMSA-PKCS1-v1_5.
_SHA256_DIGEST_INFO = bytes.fromhex("3031300d060960864801650304020105000420")


def _b64url_decode(segment: str) -> bytes:
    return base64.urlsafe_b64decode(segment + "=" * (-len(segment) % 4))


def _rsa_sha256_verifies(signed: bytes, signature: bytes, jwk: dict[str, Any]) -> bool:
    """Pure-stdlib RSASSA-PKCS1-v1_5 / SHA-256 check against one JWK.

    Implemented directly rather than via a JWT library so nothing new has to
    be importable inside Home Assistant -- it is one modular exponentiation
    and a byte comparison.
    """
    try:
        n = int.from_bytes(_b64url_decode(jwk["n"]), "big")
        e = int.from_bytes(_b64url_decode(jwk["e"]), "big")
        length = (n.bit_length() + 7) // 8
        decrypted = pow(int.from_bytes(signature, "big"), e, n).to_bytes(length, "big")
    except (KeyError, ValueError, OverflowError):
        return False

    digest_info = _SHA256_DIGEST_INFO + hashlib.sha256(signed).digest()
    padding_len = length - len(digest_info) - 3
    if padding_len < 8:  # PKCS#1 requires at least 8 bytes of 0xFF padding
        return False

    return decrypted == b"\x00\x01" + b"\xff" * padding_len + b"\x00" + digest_info


def _signature_length_for(jwk: dict[str, Any]) -> int | None:
    """How many base64url characters this key's signatures occupy.

    A signature is exactly as long as the modulus, so the key itself says
    where a signature must end -- which is what makes over-long ones
    repairable rather than merely detectable.
    """
    try:
        n = int.from_bytes(_b64url_decode(jwk["n"]), "big")
    except (KeyError, ValueError, binascii.Error):
        return None

    size = (n.bit_length() + 7) // 8

    return (size * 8 + 5) // 6


async def _async_fetch_signing_keys(
    session: aiohttp.ClientSession,
) -> list[dict[str, Any]] | None:
    """Casdoor's published signing keys, or None if they can't be had."""
    try:
        async with asyncio.timeout(15):
            # The endpoint answers 403 to non-browser user agents.
            resp = await session.get(JWKS_URL, headers={"User-Agent": "Mozilla/5.0"})
            resp.raise_for_status()
            jwks = await resp.json(content_type=None)
        keys = jwks["keys"]
    except Exception:  # noqa: BLE001 - unreachable/changed endpoint: can't judge
        return None

    return keys if isinstance(keys, list) else None


async def async_repair_access_token(
    session: aiohttp.ClientSession,
    token: str,
) -> tuple[str, bool]:
    """Verify a pasted access token, trimming stray trailing bytes if needed.

    Returns `(token_to_use, definitely_corrupt)`.

    Tokens recovered from a slicer memory dump are found by pattern-matching
    base64 in raw memory, and the match happily runs on past the end of the
    signature into whatever bytes follow it. The result decodes perfectly,
    carries correct claims, and is rejected by the server with "User does not
    exist" -- the reporter on #8 lost a day to exactly this. The key's modulus
    says precisely how long its signatures are, so the surplus can simply be
    cut off and the token used.

    Deliberately one-sided about failure: only tokens claiming Casdoor's
    issuer are judged at all (Anycubic's own user tokens are HS512 with no
    published key), and if the key set cannot be fetched nothing is corrupt --
    never block a login on our own inability to check.
    """
    if _token_claims(token).get("iss") != CASDOOR_ISSUER:
        return token, False

    parts = token.split(".")
    if len(parts) != 3:
        # It carries Casdoor claims but has no signature segment to check --
        # that IS the corruption, most likely a truncated copy.
        return token, True

    keys = await _async_fetch_signing_keys(session)
    if keys is None:
        return token, False

    head, payload, signature_text = parts
    signed = f"{head}.{payload}".encode()

    for key in keys:
        expected_len = _signature_length_for(key)
        candidates = [signature_text]

        # Only ever shorten, and only to the length this key demands. A
        # signature that is too SHORT is genuinely damaged -- there is nothing
        # to put back -- so no padding is attempted.
        if expected_len is not None and len(signature_text) > expected_len:
            candidates.append(signature_text[:expected_len])

        for candidate in candidates:
            try:
                signature = _b64url_decode(candidate)
            except (ValueError, binascii.Error):
                continue

            if _rsa_sha256_verifies(signed, signature, key):
                return f"{head}.{payload}.{candidate}", False

    return token, True
