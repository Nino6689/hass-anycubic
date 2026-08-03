"""Diagnostics support for Anycubic Cloud."""
from __future__ import annotations

import json
from typing import TYPE_CHECKING, Any

from homeassistant.components.diagnostics import async_redact_data
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant

if TYPE_CHECKING:
    from .coordinator import AnycubicCloudDataUpdateCoordinator

USER_TO_REDACT = {
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
}
PROJECT_TO_REDACT = {
    "model",
}

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
            "has_camera": printer.camera_stream_url is not None,
            "chamber_temperature": printer.chamber_temperature,
            "curr_nozzle_temp": printer.curr_nozzle_temp,
            "curr_hotbed_temp": printer.curr_hotbed_temp,
            "has_parameter": printer.parameter is not None,
            "ai_settings": printer.ai_settings,
        })

    return capabilities


async def async_get_config_entry_diagnostics(
    hass: HomeAssistant, entry: ConfigEntry
) -> dict[str, Any]:
    """Return diagnostics for a config entry."""
    coordinator: AnycubicCloudDataUpdateCoordinator = entry.runtime_data

    tRedacter = TaggedRedacter()

    assert coordinator.anycubic_api

    capabilities = _build_capabilities(coordinator)

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
    return {
        "capabilities": capabilities,
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
    }
