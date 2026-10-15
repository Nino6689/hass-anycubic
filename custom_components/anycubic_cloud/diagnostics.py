"""Diagnostics support for Anycubic Cloud."""
from __future__ import annotations

import json
from typing import TYPE_CHECKING, Any

from anycubic_cloud_api.const.regions import AnycubicEndpoints
from homeassistant.components.diagnostics import REDACTED, async_redact_data
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant

from .config_flow import region_from_entry_data

if TYPE_CHECKING:
    from .coordinator import AnycubicCloudDataUpdateCoordinator

USER_TO_REDACT = {
    # Anycubic's own sign-in token for the account: a live credential (#33).
    "casdoor_user_token",
    "user_activation_key",
    "tourist_device_id",
    "user_url",
    "birthday",
    "user_email",
    "password",
    "message_key",
    "last_login_ip",
    "casdoor_user_id",
    "casdoor_user",
    "user_nickname",
    "ip_country",
    "ip_province",
    "ip_city",
    "create_time",
    "create_day_time",
    "last_login_time",
}
PRINTER_TO_REDACT = {
    "machine_mac",
    # The cloud record's printer serial, hex-encoded (#33).
    "description",
}
# A print history is useful for status bugs; what was printed is nobody's business.
PROJECT_TO_REDACT = {
    "model",
    "name",
    "task_name",
    "filename",
    "display_filename",
    "gcode_name",
    "temp_gcode",
    "img",
    "image_id",
}

# A last pass over the whole download, whatever key a credential turns up
# under. casdoor_user_token leaked because the lists above match exact names
# and nobody had listed it.
SECRET_KEY_PARTS = ("token", "secret", "password", "activation_key")

TO_TAGGED_REDACT = {
    "id",
    "taskid",
    "user_id",
    "printer_id",
    "gcode_id",
    "key",
}


class TaggedRedacter:
    def __init__(self) -> None:
        self.redacted_values: dict[str, str] = dict()

    def _get_redacted_name(
        self,
        value: Any,
    ) -> str:
        if value not in self.redacted_values:
            num = len(self.redacted_values) + 1
            self.redacted_values[value] = f"**REDACTED_{num}**"

        return self.redacted_values[value]

    def redact_data(
        self,
        data: Any,
        to_redact: set[str],
    ) -> Any:
        if not isinstance(data, (dict, list)):
            return data

        if isinstance(data, list):
            return list([self.redact_data(val, to_redact) for val in data])

        redacted = {**data}

        for key, value in redacted.items():
            if value is None:
                continue
            if isinstance(value, str) and not value:
                continue
            if key in to_redact:
                redacted[key] = self._get_redacted_name(value)
            elif isinstance(value, dict):
                redacted[key] = self.redact_data(value, to_redact)
            elif isinstance(value, list):
                redacted[key] = list([self.redact_data(item, to_redact) for item in value])

        return redacted


def _looks_like_jwt(value: str) -> bool:
    parts = value.split(".")
    return len(parts) == 3 and value.startswith("eyJ") and all(parts)


def redact_secrets(data: Any) -> Any:
    """Redact credentials wherever they are: by key name, and any JWT by value."""
    if isinstance(data, list):
        return [redact_secrets(item) for item in data]
    if isinstance(data, str):
        return REDACTED if _looks_like_jwt(data) else data
    if not isinstance(data, dict):
        return data
    return {
        key: (
            REDACTED
            if isinstance(key, str)
            and any(part in key.lower() for part in SECRET_KEY_PARTS)
            and value not in (None, "")
            else redact_secrets(value)
        )
        for key, value in data.items()
    }


def json_dict_or_value(value: str) -> dict[Any, Any] | str:
    try:
        parsed_value: Any = json.loads(value)
        if not isinstance(parsed_value, dict):
            return value

        parsed_value["__JSON_STRING_PARSED__"] = True
        return parsed_value
    except json.decoder.JSONDecodeError:
        return value


def parse_all_json_data(
    input_data: Any
) -> Any:
    if isinstance(input_data, str):
        return json_dict_or_value(input_data)

    if not isinstance(input_data, (dict, list)):
        return input_data

    if isinstance(input_data, list):
        return list([parse_all_json_data(item) for item in input_data])

    output_dict: dict[Any, Any] = dict()
    for key, value in input_data.items():
        if isinstance(value, dict):
            output_dict[key] = parse_all_json_data(value)
        elif isinstance(value, list):
            output_dict[key] = list([parse_all_json_data(item) for item in value])
        elif isinstance(value, str):
            output_dict[key] = json_dict_or_value(value)
        else:
            output_dict[key] = value

    return output_dict


def _build_capabilities(
    coordinator: AnycubicCloudDataUpdateCoordinator,
) -> list[dict[str, Any]]:
    """What each printer says it is and what it can do.

    This is the part that makes a report about hardware nobody here owns
    actionable: the model id, the printer's own feature map, and whether the
    optional pieces are actually present. None of it identifies anyone.
    """
    capabilities = []

    for printer_id, printer in coordinator.printers.items():
        boxes = printer.multi_color_box or []
        capabilities.append({
            "printer_id": printer_id,
            "model_id": printer.machine_type,
            "model_name": printer.machine_name,
            "firmware": (
                printer.fw_version.firmware_version if printer.fw_version else None
            ),
            "local_firmware": printer.local_firmware_version,
            "connection": "local" if coordinator.lan_is_connected else "cloud",
            # Reported only over the local connection; empty on cloud setups.
            "features": printer.features,
            "multi_color_box_count": len(boxes),
            "multi_color_box_models": [box.model_id for box in boxes],
            # What the printer itself says is fitted. None means it has not
            # answered the peripherals poll yet, which is a different thing
            # from saying no -- and the difference decides whether the cloud
            # camera entity is offered.
            "peripherals": printer.connected_peripherals,
            # Whether the LOCAL stream endpoint is known. This used to be
            # reported as "has_camera", which read as "a camera exists" when
            # it only ever meant "we have a LAN URL for one".
            "has_lan_stream_url": printer.camera_stream_url is not None,
            "has_controllable_light": printer.has_controllable_light,
            "chamber_temperature": printer.chamber_temperature,
            "curr_nozzle_temp": printer.curr_nozzle_temp,
            "curr_hotbed_temp": printer.curr_hotbed_temp,
            "has_parameter": printer.parameter is not None,
            "ai_settings": printer.ai_settings,
        })

    return capabilities


def _build_endpoints(
    coordinator: AnycubicCloudDataUpdateCoordinator,
    entry: ConfigEntry,
) -> dict[str, Any]:
    """Which service this entry chose, and what that resolved to.

    The most valuable few lines in a China report. Nobody maintaining this has
    a China account or printer, so those reports are debugged entirely from
    the dump -- and "which cloud did it even try" is the first question.
    api/base.py re-raises every request failure as
    api_error_server_maintenance, so a misresolved endpoint arrives described
    as an Anycubic outage unless the dump says otherwise.

    Both the stored choice and the resolved addresses, because the interesting
    bug is the two disagreeing.

    Hostnames only: no token, no account id, nothing identifying a user.
    """
    region = region_from_entry_data(entry.data)
    endpoints = getattr(coordinator.anycubic_api, "endpoints", None)

    # Checked by type, not truthiness. A duck-typed object answers every
    # getattr with something plausible, so `is None` would sail past and emit
    # values that are not strings -- which then fails at JSON encoding, taking
    # the whole diagnostics download with it rather than just this block.
    if not isinstance(endpoints, AnycubicEndpoints):
        return {
            "region": region.value,
            "detail": "api object carries no endpoints record",
        }

    return {
        "region": region.value,
        "base_url": endpoints.base_url,
        "public_api_root": endpoints.public_api_root,
        "auth_domain": endpoints.auth_domain,
        "mqtt_host": endpoints.mqtt_host,
        "mqtt_port": endpoints.mqtt_port,
    }


async def async_get_config_entry_diagnostics(
    hass: HomeAssistant, entry: ConfigEntry
) -> dict[str, Any]:
    """Return diagnostics for a config entry."""
    coordinator: AnycubicCloudDataUpdateCoordinator = entry.runtime_data

    tRedacter = TaggedRedacter()

    assert coordinator.anycubic_api

    # Tagged like everywhere else, so the printer id reads the same in every block.
    capabilities = tRedacter.redact_data(_build_capabilities(coordinator), TO_TAGGED_REDACT)

    # A printer in LAN Mode is dropped by the cloud, so every call below fails.
    # The capability block above is the useful part in that case, and returning
    # it beats failing the whole download.
    empty: dict[str, Any] = {"data": []}

    try:
        user_info: dict[str, Any] = await coordinator.anycubic_api.get_user_info(raw_data=True)
        printer_info: dict[str, Any] = await coordinator.anycubic_api.list_my_printers(raw_data=True)
        projects_info: dict[str, Any] = await coordinator.anycubic_api.list_all_projects(raw_data=True)
    except Exception as err:
        return {
            "capabilities": capabilities,
            "endpoints": _build_endpoints(coordinator, entry),
            "cloud_unavailable": str(err),
        }

    latest_project_info = {}

    projects_info = projects_info or empty

    if projects_info['data'] and len(projects_info['data']) > 0:
        latest_project_info = await coordinator.anycubic_api.project_info_for_id(
            project_id=projects_info['data'][0]['id'],
        )

    detailed_printer_info = list()
    if printer_info.get('data') is not None:
        for printer in printer_info['data']:
            printer_id = printer['id']
            detailed_printer_info.append(
                await coordinator.anycubic_api.printer_info_for_id(
                    printer_id,
                    raw_data=True,
                )
            )
    redacted: dict[str, Any] = redact_secrets({
        "capabilities": capabilities,
        "endpoints": _build_endpoints(coordinator, entry),
        "user_info": tRedacter.redact_data(
            async_redact_data(
                parse_all_json_data(user_info),
                USER_TO_REDACT,
            ),
            TO_TAGGED_REDACT
        ),
        "printer_info": {
            **printer_info,
            'data': tRedacter.redact_data(
                async_redact_data(
                    parse_all_json_data(printer_info['data']),
                    PRINTER_TO_REDACT,
                ),
                TO_TAGGED_REDACT
            ),
        },
        "projects_info": {
            **projects_info,
            'data': [
                tRedacter.redact_data(
                    async_redact_data(
                        parse_all_json_data(x),
                        PROJECT_TO_REDACT,
                    ),
                    TO_TAGGED_REDACT
                ) for x in projects_info['data']
            ],
        },
        "detailed_printer_info": tRedacter.redact_data(
            async_redact_data(
                parse_all_json_data(detailed_printer_info),
                PRINTER_TO_REDACT,
            ),
            TO_TAGGED_REDACT
        ),
        "latest_project_info": tRedacter.redact_data(
            async_redact_data(
                parse_all_json_data(latest_project_info),
                PROJECT_TO_REDACT,
            ),
            TO_TAGGED_REDACT
        ),
    })
    return redacted
