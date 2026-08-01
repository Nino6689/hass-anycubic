from __future__ import annotations

import base64
import json
import re
from enum import IntEnum
from types import MappingProxyType
from typing import TYPE_CHECKING, Any

from homeassistant.helpers.device_registry import CONNECTION_NETWORK_MAC, DeviceInfo

from anycubic_cloud_api.const.enums import AnycubicPrinterMaterialType
from anycubic_cloud_api.models.auth import AnycubicAuthMode
from .const import (
    ACE_MODEL_FALLBACK,
    ACE_MODEL_NAMES,
    CONF_DRYING_PRESET_DURATION_,
    CONF_DRYING_PRESET_TEMPERATURE_,
    DOMAIN,
    MANUFACTURER,
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
    return DeviceInfo(
        identifiers={(DOMAIN, f"{user_data['id']}-{printer_data['id']}")},
        manufacturer=MANUFACTURER,
        model=printer_data["machine_name"],
        name=printer_data["name"],
        connections={(CONNECTION_NETWORK_MAC, printer_data["machine_mac"])},
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
    model = ACE_MODEL_NAMES.get(box_info.get('model_id'), ACE_MODEL_FALLBACK)
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
      * slicer tokens are long JWTs (they start `eyJ`)
      * anything else is an opaque web token
    """
    if device_id:
        return AnycubicAuthMode.ANDROID

    if token and token.startswith("eyJ"):
        return AnycubicAuthMode.SLICER

    return AnycubicAuthMode.WEB


def token_expiry_timestamp(token: str | None) -> int | None:
    """Read the `exp` claim out of a JWT token, without verifying it.

    Anycubic slicer tokens are 90-day JWTs. We only read the expiry so we can
    warn before it lapses -- the signature is the server's business, and we
    deliberately don't trust anything else in here.
    """
    if not token or not token.startswith("eyJ"):
        return None

    parts = token.split(".")
    if len(parts) < 2:
        return None

    payload = parts[1]
    payload += "=" * (-len(payload) % 4)  # restore stripped base64 padding

    try:
        claims = json.loads(base64.urlsafe_b64decode(payload))
    except Exception:  # noqa: BLE001 - a malformed token simply has no expiry
        return None

    expiry = claims.get("exp")

    return int(expiry) if isinstance(expiry, (int, float)) else None
