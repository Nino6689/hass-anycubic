"""DataUpdateCoordinator for the Anycubic Cloud integration."""
from __future__ import annotations

import asyncio
import time
import traceback
from datetime import timedelta
from typing import TYPE_CHECKING, Any

from aiohttp import CookieJar
from anycubic_cloud_api.anycubic_api import AnycubicMQTTAPI as AnycubicAPI
from anycubic_cloud_api.data_models.consumable import AnycubicConsumableData
from anycubic_cloud_api.data_models.printer import AnycubicPrinter
from anycubic_cloud_api.data_models.printer_properties import (
    SPOOL_EDIT_STATUS_EMPTY,
)
from anycubic_cloud_api.exceptions.exceptions import (
    AnycubicAPIError,
    AnycubicAPIParsingError,
    AnycubicDataParsingError,
    AnycubicLANError,
)
from anycubic_cloud_api.lan import AnycubicLANClient, AnycubicLANHandshake
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import Platform
from homeassistant.core import (
    CoreState,
    HomeAssistant,
    callback,
)
from homeassistant.exceptions import (
    ConfigEntryAuthFailed,
    ConfigEntryError,
    ConfigEntryNotReady,
    HomeAssistantError,
)
from homeassistant.helpers import device_registry as dr
from homeassistant.helpers import issue_registry as ir
from homeassistant.helpers.aiohttp_client import async_create_clientsession
from homeassistant.helpers.device_registry import DeviceInfo, DeviceRegistry
from homeassistant.helpers.device_registry import async_get as async_get_device_registry
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator, UpdateFailed

from .const import (
    ACE_SLOT_COUNT,
    API_SETUP_RETRIES,
    API_SETUP_RETRY_INTERVAL_SECONDS,
    ATTR_COST_TOTAL,
    ATTR_DRYING_DURATION,
    ATTR_DRYING_SETTINGS,
    ATTR_DRYING_TEMPERATURE,
    ATTR_FEEDING_SLOT,
    ATTR_FILAMENT_USED_G,
    ATTR_LAST_JOB_COST,
    ATTR_LAST_JOB_GRAMS,
    ATTR_LAST_JOB_ID,
    ATTR_MATERIAL_TOTALS,
    ATTR_NOZZLE,
    ATTR_NOZZLE_ABRASIVE_G,
    ATTR_NOZZLE_TOTAL_G,
    ATTR_SPOOL_MATERIAL,
    ATTR_SPOOL_PRICE_PER_KG,
    ATTR_SPOOL_SIGNATURE,
    ATTR_SPOOL_WEIGHT_G,
    ATTR_TOTALS,
    CONF_DEBUG_API_CALLS,
    CONF_DEBUG_DEPRECATED,
    CONF_DEBUG_MQTT_MSG,
    CONF_LAN_HOST,
    CONF_LAN_MODE_ENABLED,
    CONF_MQTT_CONNECT_MODE,
    CONF_PRINTER_ID_LIST,
    CONF_USER_AUTH_MODE,
    CONF_USER_DEVICE_ID,
    CONF_USER_TOKEN,
    DEFAULT_SCAN_INTERVAL,
    DOMAIN,
    ENTITY_ID_DRYING_START_PRESET_,
    FAILED_UPDATE_DELAY,
    LOGGER,
    MAX_DRYING_PRESETS,
    MAX_FAILED_UPDATES,
    MQTT_ACTION_RESPONSE_ALIVE_SECONDS,
    MQTT_IDLE_DISCONNECT_SECONDS,
    MQTT_REFRESH_INTERVAL,
    MQTT_SCAN_INTERVAL,
    NOZZLE_ABRASIVE_LIFE_G,
    PRINT_JOB_STARTED_UPDATE_DELAY,
    TOKEN_EXPIRY_WARN_DAYS,
    TOOL_URL_BOOKMARKLET,
    TOOL_URL_MACOS,
    TOOL_URL_WINDOWS,
    TOOLS_URL,
)
from .filament import (
    DEFAULT_SPOOL_WEIGHT_G,
    JOB_HISTORY_SAMPLES,
    MIN_PROGRESS_FOR_FORECAST_PCT,
    attribute_job_to_slots,
    cost_of,
    history_estimate,
    is_abrasive,
    job_grams_required,
    normalise_job_name,
    remaining_grams,
    remaining_percent,
    runout_forecast,
    spool_signature,
)
from .helpers import (
    AnycubicMQTTConnectMode,
    async_filament_store,
    async_load_saved_tokens,
    async_token_store,
    build_printer_device_info,
    check_descriptor_state_ace_not_supported,
    check_descriptor_state_ace_primary_unavailable,
    check_descriptor_state_ace_secondary_unavailable,
    check_descriptor_state_drying_unavailable,
    check_descriptor_status_not_fdm,
    check_descriptor_status_not_lcd,
    file_count,
    get_drying_preset_from_entry_options,
    printer_attributes_for_key,
    printer_state_connected_ace_units,
    printer_state_supports_ace,
    safe_external_shelves,
    state_string_active,
    token_expiry_timestamp,
)

if TYPE_CHECKING:

    from .entity import AnycubicCloudEntity, AnycubicCloudEntityDescription


LAN_FIRST_REPORT_TIMEOUT = 20

PRINTER_NOT_IN_CLOUD = (
    "The Anycubic cloud does not have this printer. If it is in LAN Mode, that "
    "is expected -- enable the local connection in this integration's options. "
    "Note that LAN Mode removes the printer from your Anycubic account, and "
    "neither switching LAN Mode off nor a power cycle brings it back: it has to "
    "be added again in the Anycubic app. ({})"
)


def _as_slot_index(value: Any) -> int | None:
    """A usable ACE slot index, or None.

    The printer reports -1 for "nothing loaded", and a printer object built
    with ignore_init_errors can hand back something that isn't a number at
    all -- both have to mean "don't know" rather than raise.
    """
    if isinstance(value, bool) or not isinstance(value, int):
        return None

    return value if value >= 0 else None


class AnycubicCloudDataUpdateCoordinator(DataUpdateCoordinator[dict[str, Any]]):
    """AnycubicCloud Data Update Coordinator."""

    def __init__(
        self,
        hass: HomeAssistant,
        entry: ConfigEntry,
    ) -> None:
        """Initialize AnycubicCloud."""
        self.entry: ConfigEntry = entry
        self._anycubic_api: AnycubicAPI | None = None
        self._anycubic_printers: dict[int, AnycubicPrinter] = dict()
        self._filament: dict[str, Any] = {}
        # First (used_mm, progress) seen for the running job, per printer.
        # The forecast measures a rate between two points rather than from
        # zero, so the purge and prime at the start of a print don't inflate
        # it. Deliberately not persisted: a restart mid-print simply takes a
        # fresh baseline, which is correct rather than merely acceptable.
        self._job_baseline: dict[int, tuple[Any, float, float]] = {}
        self._forecast_source: str = "unknown"
        self._cloud_file_list: list[dict[str, Any]] | None = None
        self._last_state_update: int | None = None
        self._failed_updates: int = 0
        # Quality scale (log-when-unavailable): log the transition into and out
        # of an outage once, rather than on every poll, so a long cloud outage
        # does not fill the log.
        self._connection_lost_logged: bool = False
        self._mqtt_task: asyncio.Future[None] | None = None
        self._mqtt_manually_connected = False
        self._mqtt_idle_since: int | None = None
        self._mqtt_last_action: int | None = None
        self._lan_client: AnycubicLANClient | None = None
        self._lan_reports: dict[str, dict[str, Any]] = {}
        self._lan_report_seen: asyncio.Event | None = None
        self._lan_printer_id: int | None = None
        self._lan_unmatched_logged: bool = False
        self._mqtt_connect_check_lock = asyncio.Lock()
        self._mqtt_refresh_lock = asyncio.Lock()
        self._mqtt_file_list_check_lock = asyncio.Lock()
        self._mqtt_last_refresh: int | None = None
        self._printer_device_map: dict[str, int] | None = None
        mqtt_connect_mode = self.entry.options.get(CONF_MQTT_CONNECT_MODE)
        self._mqtt_connection_mode = (
            AnycubicMQTTConnectMode.Printing_Only
            if mqtt_connect_mode is None
            else mqtt_connect_mode
        )
        self._unregistered_descriptors: dict[int, dict[str, list[AnycubicCloudEntityDescription]]] = dict()
        super().__init__(
            hass,
            LOGGER,
            name=DOMAIN,
            update_interval=timedelta(seconds=MQTT_SCAN_INTERVAL),
            always_update=False,
        )

    @property
    def anycubic_api(self) -> AnycubicAPI:
        if not self._anycubic_api:
            raise ConfigEntryError("Anycubic API instance is missing.")
        return self._anycubic_api

    def _any_printers_are_printing(self) -> bool:
        return any([
            printer.is_busy for printer_id, printer in self._anycubic_printers.items()
        ])

    def _any_printers_are_drying(self) -> bool:
        return any([
            (
                printer.primary_drying_status_is_drying or
                printer.secondary_drying_status_is_drying
            ) for printer_id, printer in self._anycubic_printers.items()
        ])

    def _any_printers_are_online(self) -> bool:
        return any([
            (
                printer.printer_online or printer.is_busy
            ) for printer_id, printer in self._anycubic_printers.items()
        ])

    def _no_printers_are_printing(self) -> bool:
        return all([
            not printer.is_busy and
            (not printer.latest_project_print_in_progress)
            for printer_id, printer in self._anycubic_printers.items()
        ])

    def _check_mqtt_connection_last_action_waiting(self) -> bool:
        if (
            self._mqtt_last_action is not None and
            int(time.time()) < self._mqtt_last_action + MQTT_ACTION_RESPONSE_ALIVE_SECONDS
        ):
            return True

        return False

    def _check_mqtt_connection_modes_active(self) -> bool:
        if self._check_mqtt_connection_last_action_waiting():
            return True

        elif (
            self._mqtt_connection_mode == AnycubicMQTTConnectMode.Printing_Only and
            self._any_printers_are_printing()
        ):
            return True

        elif (
            self._mqtt_connection_mode == AnycubicMQTTConnectMode.Printing_Drying and
            (self._any_printers_are_printing() or self._any_printers_are_drying())
        ):
            return True

        elif (
            self._mqtt_connection_mode == AnycubicMQTTConnectMode.Device_Online and
            self._any_printers_are_online()
        ):
            return True

        elif (
            self._mqtt_connection_mode == AnycubicMQTTConnectMode.Always
        ):
            return True

        else:
            return False

    def _check_mqtt_connection_modes_inactive(self) -> bool:
        if self._check_mqtt_connection_last_action_waiting():
            return False

        elif (
            self._mqtt_connection_mode == AnycubicMQTTConnectMode.Printing_Only and
            self._no_printers_are_printing()
        ):
            return True

        elif (
            self._mqtt_connection_mode == AnycubicMQTTConnectMode.Printing_Drying and
            (self._no_printers_are_printing() and not self._any_printers_are_drying())
        ):
            return True

        elif (
            self._mqtt_connection_mode == AnycubicMQTTConnectMode.Device_Online and
            not self._any_printers_are_online()
        ):
            return True

        elif (
            self._mqtt_connection_mode == AnycubicMQTTConnectMode.Always
        ):
            return False

        else:
            return False

    def _build_printer_dict(self, printer: AnycubicPrinter) -> dict[str, Any]:
        primary_ace_spool_info = printer.primary_multi_color_box_spool_info_object
        secondary_ace_spool_info = printer.secondary_multi_color_box_spool_info_object

        file_list_local = printer.local_file_list_object
        file_list_udisk = printer.udisk_file_list_object
        file_list_cloud = self._cloud_file_list

        states = {
            "id": printer.id,
            "name": printer.name,
            # Reported only over the local connection.
            "camera_stream_url": printer.camera_stream_url,
            "ai_detection_enabled": printer.ai_detection_enabled,
            "chamber_temp": printer.chamber_temperature,
            "printer_online": printer.printer_online,
            "is_busy": printer.is_busy,
            "is_available": printer.is_available,
            "current_status": printer.current_status,
            "curr_nozzle_temp": printer.curr_nozzle_temp,
            "curr_hotbed_temp": printer.curr_hotbed_temp,
            "machine_mac": printer.machine_mac,
            "machine_name": printer.machine_name,
            "fw_version": printer.fw_version.firmware_version if printer.fw_version else None,
            # The count is the useful value: "loaded" told you nothing, and
            # everything actionable was buried in the attribute.
            "file_list_local": file_count(file_list_local),
            "file_list_udisk": file_count(file_list_udisk),
            "file_list_cloud": file_count(file_list_cloud),
            "supports_function_multi_color_box": printer.supports_function_multi_color_box,
            "connected_ace_units": printer.connected_ace_units,
            "multi_color_box_fw_version": printer.primary_multi_color_box_fw_firmware_version,
            "ace_spools": state_string_active(primary_ace_spool_info),
            "multi_color_box_runout_refill": printer.primary_multi_color_box_auto_feed,
            "ace_current_temperature": printer.primary_multi_color_box_current_temperature,
            "secondary_multi_color_box_fw_version": printer.secondary_multi_color_box_fw_firmware_version,
            "secondary_ace_spools": state_string_active(secondary_ace_spool_info),
            "secondary_multi_color_box_runout_refill": printer.secondary_multi_color_box_auto_feed,
            "secondary_ace_current_temperature": printer.secondary_multi_color_box_current_temperature,
            "dry_status_is_drying": printer.primary_drying_status_is_drying,
            "dry_status_target_temperature": printer.primary_drying_status_target_temperature,
            "dry_status_total_duration": printer.primary_drying_status_total_duration,
            "dry_status_remaining_time": printer.primary_drying_status_remaining_time,
            "secondary_dry_status_is_drying": printer.secondary_drying_status_is_drying,
            "secondary_dry_status_raw_status_code": printer.secondary_drying_status_raw_status_code,
            "secondary_dry_status_target_temperature": printer.secondary_drying_status_target_temperature,
            "secondary_dry_status_total_duration": printer.secondary_drying_status_total_duration,
            "secondary_dry_status_remaining_time": printer.secondary_drying_status_remaining_time,
            "job_name": printer.latest_project_name,
            "job_progress": printer.latest_project_progress_percentage,
            "job_time_elapsed": printer.latest_project_print_time_elapsed_minutes,
            "job_time_remaining": printer.latest_project_print_time_remaining_minutes,
            "job_in_progress": printer.latest_project_print_in_progress,
            "job_complete": printer.latest_project_print_complete,
            "job_failed": printer.latest_project_print_failed,
            "job_is_paused": printer.latest_project_print_is_paused,
            "job_image_url": printer.latest_project_image_url,
            "job_state": printer.latest_project_print_status,
            "job_eta": printer.latest_project_print_approximate_completion_time,
            "job_current_layer": printer.latest_project_print_current_layer,
            "job_total_layers": printer.latest_project_print_total_layers,
            "target_nozzle_temp": printer.latest_project_target_nozzle_temp,
            "target_hotbed_temp": printer.latest_project_target_hotbed_temp,
            "job_speed_mode": printer.latest_project_print_speed_mode_string,
            "print_speed_pct": printer.latest_project_print_speed_pct,
            "job_z_thick": printer.latest_project_z_thick,
            "fan_speed_pct": printer.latest_project_fan_speed_pct,
            "job_model_height": printer.latest_project_print_model_height,
            "job_anti_alias_count": printer.latest_project_print_anti_alias_count,
            "job_on_time": printer.latest_project_print_on_time,
            "job_off_time": printer.latest_project_print_off_time,
            "job_bottom_time": printer.latest_project_print_bottom_time,
            "job_bottom_layers": printer.latest_project_print_bottom_layers,
            "job_z_up_height": printer.latest_project_print_z_up_height,
            "job_z_up_speed": printer.latest_project_print_z_up_speed,
            "job_z_down_speed": printer.latest_project_print_z_down_speed,
            "manual_mqtt_connection_enabled": self._mqtt_manually_connected,
            "mqtt_connection_active": self.anycubic_api.mqtt_is_started,
            "printer_light": printer.light_is_on,
            "printer_light_brightness": printer.light_brightness_pct,
            "has_controllable_light": printer.has_controllable_light,
            "material_used_total": printer.material_used_kg,
            "print_time_total_hrs": printer.total_print_time_hrs,
            "print_count_total": printer.print_count,
            "job_filament_used": printer.latest_project_supplies_usage,
            "ace_loaded_slot": printer.primary_multi_color_box_loaded_slot,
            "aux_fan_speed_pct": printer.aux_fan_speed_pct,
            # The external filament holder, for printers fed from a single
            # external spool rather than (or alongside) the ACE. Already in the
            # cloud payload; nothing surfaced it until now.
            "axis_position_x": (pos.x if (pos := printer.axis_position) else None),
            "axis_position_y": (pos.y if (pos := printer.axis_position) else None),
            "axis_position_z": (pos.z if (pos := printer.axis_position) else None),
            "external_spool_material": (
                shelves["material"] if (shelves := safe_external_shelves(printer)) else None
            ),
            "external_spool_loaded": (
                shelves["loaded"] if (shelves := safe_external_shelves(printer)) else None
            ),
            "box_fan_level": printer.box_fan_level,
        }

        # Per-slot spool entities. The material type and colour already arrive
        # with every ACE report; previously they were only reachable by digging
        # through the `ace_spools` attribute blob.
        for slot_num in range(1, ACE_SLOT_COUNT + 1):
            spool = None

            if primary_ace_spool_info and len(primary_ace_spool_info) >= slot_num:
                spool = primary_ace_spool_info[slot_num - 1]

            # The ACE keeps reporting the last material, colour and SKU it saw
            # in a slot long after the reel has been taken out, so an empty
            # slot reads as still holding whatever was in it last. Only
            # `edit_status` says otherwise. Treating an empty slot as no slot
            # keeps the material, the grams and the percentage consistent --
            # the stored spool history is untouched, so putting the reel back
            # restores it.
            if spool and spool.get("edit_status") == SPOOL_EDIT_STATUS_EMPTY:
                spool = None

            states[f"ace_slot_{slot_num}"] = (
                spool.get("material_type") if spool else None
            )

            slot_state = self._filament_slot_state(printer.id, slot_num - 1)
            spool_weight = slot_state.get(ATTR_SPOOL_WEIGHT_G, DEFAULT_SPOOL_WEIGHT_G)
            used = slot_state.get(ATTR_FILAMENT_USED_G, 0.0)

            states[f"ace_slot_{slot_num}_filament_remaining"] = (
                remaining_grams(spool_weight, used) if spool else None
            )
            states[f"ace_slot_{slot_num}_filament_remaining_percent"] = (
                remaining_percent(spool_weight, used) if spool else None
            )

        states.update(self._forecast_states(printer, primary_ace_spool_info))
        states.update(self._totals_states(printer))

        external_shelves = safe_external_shelves(printer)

        attributes = {
            "external_spool_material": external_shelves or {},
            "ace_spools": {
                "spool_info": primary_ace_spool_info,
                "box_info": printer.primary_multi_color_box_info_object,
            },
            # The reels themselves hang off the inventory sensor, so a single
            # entity answers "what filament do I own and how much is left" --
            # including reels that aren't in the machine.
            "spool_inventory_remaining": {"spools": self.spool_inventory()},
            "job_filament_required": {"source": self._forecast_source},
            "filament_cost_total": {
                "by_material_g": (
                    self._printer_filament_state(printer.id)
                    .get(ATTR_TOTALS, {})
                    .get(ATTR_MATERIAL_TOTALS, {})
                ),
            },
            **{
                f"ace_slot_{slot_num}": {
                    "slot": slot_num,
                    "color": spool.get("color"),
                    "color_hex": spool.get("color_hex"),
                    "colors_hex": spool.get("colors_hex"),
                    "is_multi_color": spool.get("is_multi_color"),
                    "sku": spool.get("sku") or None,
                    "spool_loaded": spool.get("spool_loaded"),
                    "status": spool.get("status"),
                    "edit_status": spool.get("edit_status"),
                    "consumables_percent": spool.get("consumables_percent"),
                }
                for slot_num, spool in (
                    (n, primary_ace_spool_info[n - 1])
                    for n in range(1, ACE_SLOT_COUNT + 1)
                    if primary_ace_spool_info and len(primary_ace_spool_info) >= n
                )
            },
            "secondary_ace_spools": {
                "spool_info": secondary_ace_spool_info
            },
            "file_list_local": {
                "file_info": file_list_local,
            },
            "file_list_udisk": {
                "file_info": file_list_udisk,
            },
            "file_list_cloud": {
                "file_info": file_list_cloud,
            },
            "target_nozzle_temp": {
                "limit_min": printer.latest_project_temp_min_nozzle,
                "limit_max": printer.latest_project_temp_max_nozzle,
            },
            "target_hotbed_temp": {
                "limit_min": printer.latest_project_temp_min_hotbed,
                "limit_max": printer.latest_project_temp_max_hotbed,
            },
            "job_speed_mode": {
                "available_modes": printer.latest_project_available_print_speed_modes_data_object,
                "print_speed_mode_code": printer.latest_project_print_speed_mode,
            },
            "current_status": {
                "model": printer.model,
                "machine_type": printer.machine_type,
                "supported_functions": printer.supported_function_strings,
                "material_type": printer.material_type,
                "device_status_code": printer.device_status,
                "is_printing_code": printer.is_printing,
                "print_status_code": printer.latest_project_raw_print_status,
                "peripherals": printer.connected_peripherals,
                "total_material_used": printer.material_used,
                "total_print_time_hrs": printer.total_print_time_hrs,
                "total_print_time_dhm": printer.total_print_time_dhm_str,
                "job_download_progress": printer.latest_project_download_progress_percentage,
            },
            "dry_status_is_drying": {
                "dry_status_code": printer.primary_drying_status_raw_status_code,
            },
            "secondary_dry_status_is_drying": {
                "secondary_dry_status_code": printer.secondary_drying_status_raw_status_code,
            },
            "job_name": {
                **(printer.latest_project_job_details or {}),
                "created_timestamp": printer.latest_project_created_timestamp,
                "finished_timestamp": printer.latest_project_finished_timestamp,
                "print_total_time": printer.latest_project_print_total_time,
                "print_total_time_minutes": printer.latest_project_print_total_time_minutes,
                "print_total_time_dhm": printer.latest_project_print_total_time_dhm_str,
                "print_supplies_usage": printer.latest_project_print_supplies_usage,
                "print_status_message": printer.latest_project_print_status_message,
            },
            "fw_version": {
                "latest_version": printer.fw_version.available_version if printer.fw_version else None,
                "in_progress": printer.fw_version.total_progress if printer.fw_version else None,
            },
            "multi_color_box_fw_version": {
                "latest_version": printer.primary_multi_color_box_fw_available_version,
                "in_progress": printer.primary_multi_color_box_fw_total_progress,
            },
            "secondary_multi_color_box_fw_version": {
                "latest_version": printer.secondary_multi_color_box_fw_available_version,
                "in_progress": printer.secondary_multi_color_box_fw_total_progress,
            },
            "mqtt_connection_active": {
                "supports_mqtt_login": self.anycubic_api.anycubic_auth.supports_mqtt_login,
            },
        }

        for x in range(MAX_DRYING_PRESETS):
            preset_duration, preset_temperature = get_drying_preset_from_entry_options(
                self.entry.options,
                x + 1,
            )
            attributes[f"{ENTITY_ID_DRYING_START_PRESET_}{x + 1}"] = {
                "duration": preset_duration,
                "temperature": preset_temperature,
            }
            attributes[f"secondary_{ENTITY_ID_DRYING_START_PRESET_}{x + 1}"] = {
                "duration": preset_duration,
                "temperature": preset_temperature,
            }

        return {
            'states': states,
            'attributes': attributes,
        }

    def _build_coordinator_data(self) -> dict[str, Any]:
        data_dict: dict[str, Any] = dict()

        data_dict['user_info'] = {
            "id": self.anycubic_api.anycubic_auth.api_user_id
        }

        data_dict['printers'] = dict()

        for printer_id, printer in self._anycubic_printers.items():
            data_dict['printers'][printer_id] = self._build_printer_dict(printer)

        return data_dict


    @property
    def printers(self) -> dict[int, AnycubicPrinter]:
        """The loaded printers, by id."""
        return dict(self._anycubic_printers)

    @property
    def lan_mode_enabled(self) -> bool:
        """Whether the user has opted into talking to the printer directly."""
        return bool(self.entry.options.get(CONF_LAN_MODE_ENABLED))

    @property
    def lan_only(self) -> bool:
        """Set up against the printer alone, with no Anycubic account.

        LAN Mode needs no token, so requiring one to complete setup asked
        people for a memory dump they did not need. An entry with a local
        host and no token never touches the cloud.
        """
        return self.lan_mode_enabled and not self.entry.data.get(CONF_USER_TOKEN)

    @property
    def lan_is_connected(self) -> bool:
        return self._lan_client is not None and self._lan_client.is_connected

    async def _async_setup_lan_connection(self) -> None:
        """Bring up the local connection, if one is configured.

        A failure here is never fatal. The printer may simply have been put
        back into cloud mode, in which case the cloud connection is the right
        one to be using anyway.
        """
        if not self.lan_mode_enabled or self._lan_client is not None:
            return

        host = str(self.entry.options.get(CONF_LAN_HOST) or "").strip()

        if not host:
            return

        try:
            session = async_create_clientsession(self.hass)
            broker = await AnycubicLANHandshake(
                session, host, LOGGER
            ).async_authenticate()
        except AnycubicLANError as err:
            LOGGER.debug(f"Anycubic local handshake failed: {err} ({err.__cause__!r})")
            return
        except Exception:
            LOGGER.debug(
                f"Unexpected error in the Anycubic local handshake:\n"
                f"{traceback.format_exc()}"
            )
            return

        try:
            client = AnycubicLANClient(broker, self._lan_on_message, LOGGER)
            await client.async_connect()
        except AnycubicLANError as err:
            LOGGER.debug(
                f"Anycubic local broker refused the connection: {err} "
                f"({err.__cause__!r})"
            )
            return
        except Exception:
            LOGGER.debug(
                f"Unexpected error starting the Anycubic local connection:\n"
                f"{traceback.format_exc()}"
            )
            return

        self._lan_client = client
        LOGGER.info(
            f"Anycubic connected to {broker.model_name or 'printer'} "
            f"directly on the local network."
        )

        client.query_all()

    async def async_stop_lan_connection(self) -> None:
        client = self._lan_client

        if client is None:
            return

        self._lan_client = None
        self._lan_printer_id = None

        await client.async_disconnect()

    def _lan_target_printer(self, model_id: str) -> AnycubicPrinter | None:
        """Which configured printer a local report belongs to.

        The local handshake identifies the printer by model, which is enough
        whenever only one is set up -- the normal case, since LAN Mode is a
        per-printer switch. With several, the model has to match, and a report
        that matches nothing is dropped rather than applied to the wrong one.
        """
        printers = list(self._anycubic_printers.values())

        if not printers:
            # Reports start arriving while the printer object is still being
            # built from them, which is expected rather than a mismatch.
            return None

        if len(printers) == 1:
            return printers[0]

        for printer in printers:
            if str(printer.machine_type) == str(model_id):
                return printer

        if not self._lan_unmatched_logged:
            self._lan_unmatched_logged = True
            LOGGER.warning(
                "Anycubic received a local report that does not match any "
                "configured printer, and is ignoring it."
            )

        return None

    @callback
    def _lan_on_message(
        self, topic: str, message_type: str, payload: dict[str, Any]
    ) -> None:
        """Apply a local report to the printer.

        Local topics carry the model and device ids where cloud topics carry
        the machine type and printer key, so the existing parser reads them
        unchanged.
        """
        client = self._lan_client

        if client is None:
            return

        # Bare {"msgid": ""} acknowledgements carry no type and are not
        # reports; the parser requires one, so they are dropped here.
        if "type" not in payload:
            return

        self._lan_reports[message_type] = payload

        if self._lan_report_seen is not None:
            self.hass.loop.call_soon_threadsafe(self._lan_report_seen.set)

        printer = self._lan_target_printer(client.broker.model_id)

        if printer is None:
            return

        try:
            printer.process_mqtt_update(topic, AnycubicConsumableData(payload))
        except AnycubicDataParsingError as err:
            LOGGER.debug(f"Anycubic local report not understood: {err}")
            return
        except Exception:
            LOGGER.debug(
                f"Anycubic local report failed to parse:\n{traceback.format_exc()}"
            )
            return

        # Called on paho's thread, and create_task is not thread-safe.
        self.hass.loop.call_soon_threadsafe(self._mqtt_callback_data_updated)

    def _lan_poll(self) -> None:
        """Ask the printer for fresh state; it does not push unprompted."""
        if self._lan_client is None or not self._lan_client.is_connected:
            return

        try:
            self._lan_client.query_all()
        except AnycubicLANError as err:
            LOGGER.debug(f"Anycubic local poll failed: {err}")

    async def _async_update_data(self) -> dict[str, Any]:
        """Fetch data from AnycubicCloud."""

        if self.lan_mode_enabled:
            await self._async_setup_lan_connection()
            self._lan_poll()

        if not self._last_state_update or int(time.time()) > self._last_state_update + DEFAULT_SCAN_INTERVAL:
            await self.get_anycubic_updates()

        data_dict = self._build_coordinator_data()

        if self._printer_device_map is None:
            await self._register_printer_devices(data_dict)

        if not self.lan_only:
            self._check_token_expiry()

        return data_dict

    @callback
    def _check_token_expiry(self) -> None:
        """Warn before the token lapses, rather than after it breaks.

        Anycubic tokens are 90-day JWTs and cannot be refreshed automatically,
        so the only graceful option is to tell the user in advance -- otherwise
        the integration simply stops working one day with a re-auth prompt.
        """
        expiry = token_expiry_timestamp(self.entry.data.get(CONF_USER_TOKEN))

        if expiry is None:
            return

        days_left = (expiry - time.time()) / 86400

        if days_left <= TOKEN_EXPIRY_WARN_DAYS:
            ir.async_create_issue(
                self.hass,
                DOMAIN,
                f"token_expiring_{self.entry.entry_id}",
                is_fixable=False,
                severity=ir.IssueSeverity.WARNING,
                learn_more_url=TOOLS_URL,
                translation_key="token_expiring",
                translation_placeholders={
                    "days": str(max(0, int(days_left))),
                    "name": self.entry.title,
                    # hassfest rejects URLs inside translation strings, so the
                    # links are supplied here instead of being written inline.
                    "reauth_url": (
                        "https://my.home-assistant.io/redirect/integration"
                        f"/?domain={DOMAIN}"
                    ),
                    "tool_macos": TOOL_URL_MACOS,
                    "tool_windows": TOOL_URL_WINDOWS,
                    "tool_browser": TOOL_URL_BOOKMARKLET,
                },
            )
        else:
            ir.async_delete_issue(
                self.hass, DOMAIN, f"token_expiring_{self.entry.entry_id}"
            )

    async def _async_force_data_refresh(self) -> None:
        self.data = self._build_coordinator_data()
        self.last_update_success = True
        self.async_update_listeners()

    @callback
    def add_entities_for_seen_printers[AnycubicCloudEntityT: AnycubicCloudEntity](
        self,
        async_add_entities: AddEntitiesCallback,
        entity_constructor: type[AnycubicCloudEntityT],
        platform: Platform,
        available_descriptors: list[AnycubicCloudEntityDescription],
    ) -> None:
        """Add Anycubic Cloud entities.

        Called from a platforms `async_setup_entry`.
        """

        for printer_id in self.entry.data[CONF_PRINTER_ID_LIST]:
            if printer_id not in self._unregistered_descriptors:
                self._unregistered_descriptors[printer_id] = dict()

            self._unregistered_descriptors[printer_id][platform] = available_descriptors.copy()

        @callback
        def _add_entities_for_unregistered_descriptors() -> None:
            new_entities: list[AnycubicCloudEntityT] = []

            for printer_id in self.entry.data[CONF_PRINTER_ID_LIST]:
                if printer_id not in self._unregistered_descriptors:
                    continue
                if platform not in self._unregistered_descriptors[printer_id]:
                    continue

                status_attr: dict[str, Any] | None = printer_attributes_for_key(self, printer_id, 'current_status')
                if not status_attr:
                    # The printer is selected on the entry but hasn't loaded yet
                    # -- it may have been offline at startup, or only just been
                    # added. Its entities are created on a later refresh once
                    # _async_add_new_printers picks it up.
                    continue
                material_type = status_attr['material_type']
                connected_ace_units = printer_state_connected_ace_units(self, printer_id)
                supports_ace = printer_state_supports_ace(self, printer_id)

                remaining_unregistered_descriptors = list()

                for description in self._unregistered_descriptors[printer_id][platform]:
                    if (
                        check_descriptor_status_not_lcd(
                            description,
                            material_type,
                        )
                        or
                        check_descriptor_status_not_fdm(
                            description,
                            material_type,
                        )
                        or
                        check_descriptor_state_ace_not_supported(
                            description,
                            supports_ace,
                        )
                    ):
                        continue
                    elif (
                        check_descriptor_state_ace_primary_unavailable(
                            description,
                            supports_ace,
                            connected_ace_units,
                        )
                        or
                        check_descriptor_state_ace_secondary_unavailable(
                            description,
                            supports_ace,
                            connected_ace_units,
                        )
                        or
                        check_descriptor_state_drying_unavailable(
                            description,
                            supports_ace,
                            connected_ace_units,
                            self.entry.options,
                        )
                    ):
                        remaining_unregistered_descriptors.append(description)
                        continue
                    elif description.printer_entity_type is None:
                        raise ConfigEntryError(f"Descriptor {description.key} is missing printer_entity_type.")

                    new_entities.append(
                        entity_constructor(
                            self.hass,
                            self,
                            printer_id,
                            description
                        )
                    )

                if len(remaining_unregistered_descriptors) > 0:
                    self._unregistered_descriptors[printer_id][platform] = remaining_unregistered_descriptors
                else:
                    self._unregistered_descriptors[printer_id].pop(platform)

                if len(self._unregistered_descriptors[printer_id]) == 0:
                    self._unregistered_descriptors.pop(printer_id)

            async_add_entities(new_entities)

        _add_entities_for_unregistered_descriptors()
        self.entry.async_on_unload(
            self.async_add_listener(_add_entities_for_unregistered_descriptors)
        )

    async def _async_print_job_started(self) -> None:
        LOGGER.debug(
            f"Print job started, forcing state update in {PRINT_JOB_STARTED_UPDATE_DELAY} seconds."
        )
        await asyncio.sleep(PRINT_JOB_STARTED_UPDATE_DELAY)
        await self.force_state_update()

    async def _async_mqtt_callback_subscribed(self) -> None:
        await asyncio.sleep(10)
        for printer in self._anycubic_printers.values():
            try:
                if printer.printer_online:
                    await printer.query_printer_options()
            except Exception as error:
                tb = traceback.format_exc()
                LOGGER.warning(f"Anycubic MQTT on subscribe error: {error}\n{tb}")

    @callback
    def _mqtt_callback_data_updated(self) -> None:
        self.hass.create_task(
            self._async_force_data_refresh(),
            f"Anycubic coordinator {self.entry.entry_id} data refresh",
        )

    @callback
    def _mqtt_callback_print_job_started(
        self,
    ) -> None:
        self.hass.create_task(
            self._async_print_job_started(),
            f"Anycubic coordinator {self.entry.entry_id} print job started",
        )

    @callback
    def _mqtt_callback_subscribed(
        self,
    ) -> None:
        self.hass.create_task(
            self._async_mqtt_callback_subscribed(),
            f"Anycubic coordinator {self.entry.entry_id} MQTT subscribed",
        )

    def _anycubic_mqtt_connection_should_start(self) -> bool:

        if (
            self._mqtt_connection_mode == AnycubicMQTTConnectMode.Never_Connect
            or not self.anycubic_api.anycubic_auth.supports_mqtt_login
        ):
            return False

        return (
            not self.anycubic_api.mqtt_is_started and
            not self.hass.is_stopping and
            self.hass.state is CoreState.running and
            (
                self._check_mqtt_connection_modes_active() or
                self._mqtt_manually_connected
            )
        )

    def _anycubic_mqtt_connection_should_stop(self) -> bool:

        return (
            self.anycubic_api.mqtt_is_started and
            (
                self.hass.is_stopping or
                (
                    self._anycubic_mqtt_connection_is_idle() and
                    not self._mqtt_manually_connected
                )
            )
        )

    def _anycubic_mqtt_connection_is_idle(self) -> bool:
        if self._check_mqtt_connection_modes_inactive():
            if self._mqtt_idle_since is None:
                self._mqtt_idle_since = int(time.time())

            if int(time.time()) > self._mqtt_idle_since + MQTT_IDLE_DISCONNECT_SECONDS:
                self._mqtt_idle_since = None
                return True

        else:
            self._mqtt_idle_since = None

        return False

    async def _check_anycubic_mqtt_connection(self, refreshing: bool = False) -> None:
        if not refreshing and self._mqtt_refresh_lock.locked():
            return

        async with self._mqtt_connect_check_lock:
            if self._anycubic_mqtt_connection_should_start():

                for printer in self._anycubic_printers.values():
                    self.anycubic_api.mqtt_add_subscribed_printer(
                        printer
                    )

                if self._mqtt_task is None:
                    LOGGER.debug("Starting Anycubic MQTT Task.")
                    self._mqtt_task = self.hass.async_add_executor_job(
                        self.anycubic_api.connect_mqtt
                    )

            elif self._anycubic_mqtt_connection_should_stop():
                await self._stop_anycubic_mqtt_connection()

    async def _stop_anycubic_mqtt_connection(self) -> None:
        for printer in self._anycubic_printers.values():
            await self.hass.async_add_executor_job(
                self.anycubic_api.mqtt_unsubscribe_printer_status,
                printer,
            )
        await self.hass.async_add_executor_job(
            self.anycubic_api.disconnect_mqtt,
        )

        await self.anycubic_api.mqtt_wait_for_disconnect()

        if self._mqtt_task is not None and not self._mqtt_task.done():
            self._mqtt_task.cancel()

        self._mqtt_task = None

    async def stop_anycubic_mqtt_connection_if_started(self) -> None:
        if self._anycubic_api and self._anycubic_api.mqtt_is_started:
            await self._stop_anycubic_mqtt_connection()

    async def refresh_anycubic_mqtt_connection(self) -> None:
        if self._mqtt_last_refresh and int(time.time()) < self._mqtt_last_refresh + MQTT_REFRESH_INTERVAL:
            return

        if self._mqtt_connect_check_lock.locked():
            return

        if self._anycubic_api and self._anycubic_api.mqtt_is_started:
            async with self._mqtt_refresh_lock:
                self._mqtt_last_refresh = int(time.time())
                await self._stop_anycubic_mqtt_connection()
                await asyncio.sleep(2)
                await self._check_anycubic_mqtt_connection(True)

    async def _async_check_local_file_list_changed(
        self,
        prev_file_list: list[dict[str, str | float]] | None,
        printer: AnycubicPrinter,
    ) -> None:
        if self._mqtt_file_list_check_lock.locked():
            return

        async with self._mqtt_file_list_check_lock:
            if not printer.printer_online:
                return

            await asyncio.sleep(5)
            new_file_list = printer.local_file_list_object
            if prev_file_list is None and new_file_list is None:
                LOGGER.debug("Anycubic MQTT response for local file list appears to be empty, refreshing MQTT and retrying.")
                await self.refresh_anycubic_mqtt_connection()
                await self.anycubic_api.mqtt_wait_for_connect()
                await asyncio.sleep(2)
                await printer.request_local_file_list()

    async def _setup_anycubic_api_connection(self) -> None:
        LOGGER.debug("Coordinator setting up Anycubic Cloud API connection.")
        store = async_token_store(self.hass, self.entry.entry_id)

        if self.entry.data.get(CONF_USER_TOKEN) is None:
            raise ConfigEntryAuthFailed("Authentication Token not found.")

        try:
            cookie_jar = CookieJar(unsafe=True)
            websession = async_create_clientsession(
                self.hass,
                cookie_jar=cookie_jar,
            )
            self._anycubic_api = AnycubicAPI(
                session=websession,
                cookie_jar=cookie_jar,
                debug_logger=LOGGER,
                mqtt_callback_printer_update=self._mqtt_callback_data_updated,
                mqtt_callback_printer_busy=self._mqtt_callback_print_job_started,
                mqtt_callback_subscribed=self._mqtt_callback_subscribed,
            )
            self._anycubic_api.set_authentication(
                auth_token=self.entry.data[CONF_USER_TOKEN],
                auth_mode=self.entry.data.get(CONF_USER_AUTH_MODE),
                device_id=self.entry.data.get(CONF_USER_DEVICE_ID),
            )

            # The pasted token is only the starting point; the cloud refreshes it
            # and the refreshed value is what stays valid. Loading it back means a
            # restart doesn't fall back to a token that may have since aged out.
            await async_load_saved_tokens(
                self.hass, self.entry.entry_id, self._anycubic_api
            )

            debug_all: bool = bool(self.entry.options.get(CONF_DEBUG_DEPRECATED))
            debug_mqtt_msg: bool = bool(
                self.entry.options.get(CONF_DEBUG_MQTT_MSG, debug_all)
            )
            debug_api_calls: bool = bool(
                self.entry.options.get(CONF_DEBUG_API_CALLS, debug_all)
            )

            self._anycubic_api.set_mqtt_log_all_messages(debug_mqtt_msg)
            self._anycubic_api.set_log_api_call_info(debug_api_calls)

            success = await self._anycubic_api.check_api_tokens()
            if not success:
                raise ConfigEntryAuthFailed("Authentication failed. Check credentials.")

            # Create config
            await store.async_save(self._anycubic_api.get_auth_config_dict())

            first_printer_id = self.entry.data[CONF_PRINTER_ID_LIST][0]

            if self.lan_mode_enabled:
                # The cloud drops a printer that has gone local, so there is
                # nothing to check here -- the local connection is the one that
                # matters and it is proved when the printer object is built.
                return

            try:
                printer_status = await self._anycubic_api.printer_info_for_id(first_printer_id)
            except Exception as error:
                # The token has already been accepted, so whatever went wrong
                # here is not a credentials problem. Switching the printer into
                # LAN Mode makes the cloud report it as deleted (code 1007),
                # and calling that an auth failure sent the user to a re-auth
                # prompt that could never help -- and put the entry into a
                # state where the LAN Mode option could not be reached.
                raise ConfigEntryNotReady(PRINTER_NOT_IN_CLOUD.format(error)) from error

            if printer_status is None:
                raise ConfigEntryNotReady(PRINTER_NOT_IN_CLOUD.format("no printer returned"))

        except (ConfigEntryAuthFailed, ConfigEntryNotReady):
            raise

        except AnycubicAPIParsingError:
            raise

        except Exception as error:
            raise ConfigEntryAuthFailed(
                f"Coordinator authentication failed with unknown Error. Check credentials {error}"
            ) from error



    async def async_start_camera(self, printer_id: int) -> None:
        """Ask the printer to start sending video.

        The stream endpoint answers but sends nothing until this is published,
        so it goes out every time a stream is requested rather than being
        tracked -- the printer is happy to be told twice.
        """
        client = self._lan_client

        if client is None or not client.is_connected:
            return

        try:
            client.publish(
                "video", {"type": "video", "action": "startCapture", "data": {}}
            )
        except AnycubicLANError as err:
            LOGGER.debug(f"Anycubic could not start the camera: {err}")

    async def _async_printer_from_lan(self, printer_id: int) -> AnycubicPrinter | None:
        """Build a printer from what it reports locally.

        Used when the cloud cannot supply one -- which is the normal state for
        a printer in LAN Mode, since the cloud drops it the moment it goes
        local. The configured printer id is reused so entity ids survive
        switching between the two modes.
        """
        await self._async_setup_lan_connection()

        client = self._lan_client

        if client is None:
            return None

        self._lan_report_seen = asyncio.Event()
        client.query("info")

        try:
            async with asyncio.timeout(LAN_FIRST_REPORT_TIMEOUT):
                while "info" not in self._lan_reports:
                    self._lan_report_seen.clear()
                    await self._lan_report_seen.wait()
        except (TimeoutError, asyncio.CancelledError):
            LOGGER.debug("Anycubic printer did not report over the local connection.")
            return None
        finally:
            self._lan_report_seen = None

        report = self._lan_reports["info"]
        data = report.get("data") or {}
        broker = client.broker

        printer = AnycubicPrinter(
            api_parent=self.anycubic_api,
            machine_type=int(broker.model_id),
            machine_name=broker.model_name or str(data.get("model") or "Anycubic printer"),
            id=printer_id,
            name=str(data.get("printerName") or broker.model_name or "Anycubic printer"),
            key=broker.device_id,
            # The discovery document carries it in the URN, which is the only
            # place it appears when the cloud has never seen this printer.
            machine_mac=broker.mac,
            ignore_init_errors=True,
        )

        # Neither of these reaches a printer that has gone local: the cloud
        # states what a machine prints and lists what it can do, and there is
        # no cloud here. Without them every filament and ACE entity is
        # filtered out as belonging to some other kind of printer.
        printer.set_material_type_from_device_type(broker.device_type)

        # Replay everything already received so the printer starts populated
        # rather than blank until the next poll.
        for message_type, payload in self._lan_reports.items():
            try:
                printer.process_mqtt_update(
                    client.report_topic + "/" + message_type,
                    AnycubicConsumableData(payload),
                )
            except Exception:
                LOGGER.debug(f"Anycubic local {message_type} report not applied.")

        client.query_all()

        return printer

    async def _setup_anycubic_printer_objects(self) -> None:
        await self._async_load_filament()

        for printer_id in self.entry.data[CONF_PRINTER_ID_LIST]:
            printer = None

            try:
                printer = await self.anycubic_api.printer_info_for_id(printer_id)
            except Exception as error:
                if not self.lan_mode_enabled:
                    raise ConfigEntryError(error) from error
                LOGGER.debug(f"Cloud could not supply printer {printer_id}: {error}")

            if not printer and self.lan_mode_enabled:
                printer = await self._async_printer_from_lan(int(printer_id))

            if not printer:
                # Neither source could supply it. Most often this is the gap
                # after switching a printer out of LAN Mode, where the cloud
                # has not re-registered it yet -- so retry rather than fail
                # terminally, which left the entry dead until reloaded by hand.
                raise ConfigEntryNotReady(PRINTER_NOT_IN_CLOUD.format(
                    f"printer {printer_id} not available from the cloud or locally"
                ))

            self._anycubic_printers[int(printer_id)] = printer

        if not self._anycubic_printers:
            raise ConfigEntryError("No Anycubic printers could be loaded.")

    async def _async_add_new_printers(self) -> None:
        """Pick up printers selected on the entry that aren't loaded yet.

        Quality scale (dynamic-devices): a printer added to the entry (or one
        that failed to load at startup, e.g. it was offline) previously needed a
        Home Assistant restart to appear. Entities for it are registered on the
        next refresh instead.
        """
        selected = {int(x) for x in self.entry.data[CONF_PRINTER_ID_LIST]}
        missing = selected - set(self._anycubic_printers)

        if not missing:
            return

        added = False

        for printer_id in missing:
            try:
                printer = await self.anycubic_api.printer_info_for_id(printer_id)
            except Exception as error:  # noqa: BLE001 - retried on the next refresh
                LOGGER.debug("Could not load new printer %s yet: %s", printer_id, error)
                continue

            if printer is None:
                continue

            LOGGER.info("Found new Anycubic printer: %s", printer.name)
            self._anycubic_printers[int(printer_id)] = printer
            added = True

        if added:
            # Force device registration and entity creation to run again.
            self._printer_device_map = None

    async def _register_printer_devices(
        self,
        data_dict: dict[str, Any],
    ) -> None:
        self._printer_device_map = dict()
        dev_reg = async_get_device_registry(self.hass)
        for printer_id in self.entry.data[CONF_PRINTER_ID_LIST]:
            printer_device_info: DeviceInfo = build_printer_device_info(
                data_dict,
                printer_id,
            )
            printer_device = dev_reg.async_get_or_create(
                config_entry_id=self.entry.entry_id,
                **printer_device_info,
            )
            self._printer_device_map[printer_device.id] = printer_id

        self._remove_stale_devices(dev_reg)

    @callback
    def _remove_stale_devices(self, dev_reg: DeviceRegistry) -> None:
        """Drop devices for printers no longer selected on this entry.

        Quality scale (stale-devices): deselecting a printer, or removing one
        from the Anycubic account, used to leave an orphaned device behind for
        the user to clean up by hand. Accessories are removed with their
        printer, since a via_device is meaningless once its parent is gone.
        """
        current = set(self._printer_device_map or {})

        for device in dr.async_entries_for_config_entry(dev_reg, self.entry.entry_id):
            # Keep accessories whose printer is still present; they are removed
            # implicitly with their parent by the device registry.
            if device.via_device_id is not None:
                if device.via_device_id in current:
                    continue

            if device.id in current:
                continue

            LOGGER.debug("Removing stale Anycubic device: %s", device.name)
            dev_reg.async_update_device(
                device.id, remove_config_entry_id=self.entry.entry_id
            )

    async def _check_or_save_tokens(self) -> None:
        success = await self.anycubic_api.check_api_tokens()

        if not success:
            raise ConfigEntryAuthFailed("Authentication failed. Check credentials.")

        if self.anycubic_api.tokens_changed:
            store = async_token_store(self.hass, self.entry.entry_id)
            await store.async_save(self.anycubic_api.get_auth_config_dict())

    async def _connect_mqtt_for_action_response(self) -> None:
        self._mqtt_last_action = int(time.time())
        await self._check_anycubic_mqtt_connection()
        if not await self.anycubic_api.mqtt_wait_for_connect():
            raise HomeAssistantError(
                translation_domain=DOMAIN,
                translation_key="mqtt_connect_timeout",
            )

    async def _async_setup(self) -> None:
        setup_retries = 0
        while setup_retries < API_SETUP_RETRIES + 1:
            try:
                if not self.lan_only:
                    await self._setup_anycubic_api_connection()
                    await self._setup_anycubic_printer_objects()
                return
            except AnycubicAPIParsingError as error:
                if setup_retries >= API_SETUP_RETRIES:
                    raise ConfigEntryError(error) from error
                setup_retries += 1
                LOGGER.warning(
                    f"Error during Anycubic Cloud setup, retrying in {API_SETUP_RETRY_INTERVAL_SECONDS} seconds."
                )
                await asyncio.sleep(API_SETUP_RETRY_INTERVAL_SECONDS)

    @callback
    def _note_connection_lost(self, error: Exception) -> None:
        """Count the failure and log it only on the way into an outage."""
        self._failed_updates += 1

        if not self._connection_lost_logged:
            LOGGER.warning("Lost connection to the Anycubic cloud: %s", error)
            self._connection_lost_logged = True


    # ------------------------------------------------------------------ filament

    def _filament_slot_state(self, printer_id: int, slot_index: int) -> dict[str, Any]:
        """Stored estimate for one slot, defaulted if it has never been seen."""
        printers = self._filament.setdefault("printers", {})
        slots = printers.setdefault(str(printer_id), {}).setdefault("slots", {})

        state: dict[str, Any] = slots.setdefault(
            str(slot_index),
            {ATTR_SPOOL_WEIGHT_G: DEFAULT_SPOOL_WEIGHT_G, ATTR_FILAMENT_USED_G: 0.0},
        )

        return state

    def _printer_filament_state(self, printer_id: int) -> dict[str, Any]:
        """Per-printer filament bookkeeping: totals, nozzle, last job."""
        printers = self._filament.setdefault("printers", {})

        return printers.setdefault(str(printer_id), {})  # type: ignore[no-any-return]

    def get_spool_weight(self, printer_id: int, slot_index: int) -> float:
        """How much filament this slot's spool started with."""
        state = self._filament_slot_state(printer_id, slot_index)

        return float(state.get(ATTR_SPOOL_WEIGHT_G, DEFAULT_SPOOL_WEIGHT_G))

    def get_spool_price(self, printer_id: int, slot_index: int) -> float:
        """What this slot's reel cost per kilogram. Zero means "not said"."""
        state = self._filament_slot_state(printer_id, slot_index)

        return float(state.get(ATTR_SPOOL_PRICE_PER_KG, 0.0))

    async def async_set_spool_price(
        self, printer_id: int, slot_index: int, price_per_kg: float
    ) -> None:
        """Record what a reel cost, so its prints can be priced."""
        state = self._filament_slot_state(printer_id, slot_index)
        state[ATTR_SPOOL_PRICE_PER_KG] = float(price_per_kg)

        # Price belongs to the reel, not the slot -- same as the weight, so it
        # survives being moved or taken out and put back.
        signature = state.get(ATTR_SPOOL_SIGNATURE)
        if signature:
            known = self._filament.setdefault("spools", {}).setdefault(signature, {})
            known[ATTR_SPOOL_PRICE_PER_KG] = float(price_per_kg)

        await self._async_save_filament()
        await self.force_state_update()

    async def async_reset_nozzle(self, printer_id: int) -> None:
        """Start the nozzle wear counters again, after fitting a new one."""
        self._printer_filament_state(printer_id)[ATTR_NOZZLE] = {
            ATTR_NOZZLE_TOTAL_G: 0.0,
            ATTR_NOZZLE_ABRASIVE_G: 0.0,
        }
        await self._async_save_filament()
        await self.force_state_update()

    def _forecast_states(
        self,
        printer: AnycubicPrinter,
        spool_info: list[dict[str, Any]] | None,
    ) -> dict[str, Any]:
        """Will the loaded reel see this print out?

        The printer says how much it has extruded and how far through it is,
        which is enough to project the whole job -- no slicer estimate needed,
        so this works for prints started at the printer's own screen. And it
        answers within the first minute or two, while there is still something
        you can do about a shortfall.
        """
        blank: dict[str, Any] = {
            "job_filament_required": None,
            "job_filament_shortfall": None,
            "job_filament_runs_out_at": None,
            "job_filament_insufficient": None,
            "job_cost": None,
        }

        if not printer.latest_project_print_in_progress:
            return blank

        slot_index = _as_slot_index(printer.primary_multi_color_box_loaded_slot)

        if slot_index is None:
            slot_index = _as_slot_index(
                self._printer_filament_state(printer.id).get(ATTR_FEEDING_SLOT)
            )

        if slot_index is None:
            return blank

        spool = None
        if spool_info and len(spool_info) > slot_index:
            spool = spool_info[slot_index]

        material = spool.get("material_type") if spool else None
        used_mm = printer.latest_project_supplies_usage
        progress = printer.latest_project_progress_percentage

        # History first. It is available from the moment a job starts, and on
        # a model printed before it is far more accurate than extrapolating a
        # rate: measured against a real print, history was 0.2% out where the
        # rate was 17% out at 39% progress. Extrapolation is the fallback for
        # something never printed before.
        source = "history"
        required = self._job_history_estimate(printer.latest_project)

        if required is None:
            source = "extrapolated"
            required = job_grams_required(
                used_mm,
                progress,
                material,
                self._job_forecast_baseline(printer, used_mm, progress),
            )

        if required is None:
            return blank

        slot_state = self._filament_slot_state(printer.id, slot_index)
        forecast = runout_forecast(
            required,
            remaining_grams(
                slot_state.get(ATTR_SPOOL_WEIGHT_G, DEFAULT_SPOOL_WEIGHT_G),
                slot_state.get(ATTR_FILAMENT_USED_G, 0.0),
            ),
        )

        if forecast is None:
            return blank

        self._forecast_source = source

        return {
            "job_filament_required": forecast["required_g"],
            "job_filament_shortfall": forecast["shortfall_g"],
            "job_filament_runs_out_at": forecast["runs_out_at_pct"],
            "job_filament_insufficient": forecast["shortfall_g"] > 0,
            "job_cost": cost_of(
                required, slot_state.get(ATTR_SPOOL_PRICE_PER_KG, 0.0)
            ),
        }

    def _job_forecast_baseline(
        self,
        printer: AnycubicPrinter,
        used_mm: Any,
        progress: Any,
    ) -> tuple[float, float] | None:
        """The earliest usable (used_mm, progress) pair for the running job.

        Taken once, a few percent in -- early enough that the rest of the
        print is measured against it, late enough that the purge has finished.
        Reset when the job changes so one print's baseline can't leak into the
        next.
        """
        if not isinstance(used_mm, (int, float)) or not isinstance(progress, (int, float)):
            return None

        project = printer.latest_project
        job_id = project.id if project is not None else None

        if job_id is None:
            return None

        existing = self._job_baseline.get(printer.id)

        if existing is not None and existing[0] == job_id:
            return existing[1], existing[2]

        if progress < MIN_PROGRESS_FOR_FORECAST_PCT:
            # Too early even to anchor: the purge may still be running.
            return None

        self._job_baseline[printer.id] = (job_id, float(used_mm), float(progress))

        return None

    def _totals_states(self, printer: AnycubicPrinter) -> dict[str, Any]:
        """Lifetime spend, nozzle wear and what reels are known about."""
        printer_state = self._printer_filament_state(printer.id)
        totals = printer_state.get(ATTR_TOTALS) or {}
        nozzle = printer_state.get(ATTR_NOZZLE) or {}

        abrasive_g = float(nozzle.get(ATTR_NOZZLE_ABRASIVE_G, 0.0))
        known = self._filament.get("spools") or {}

        inventory_g = 0.0
        for entry in known.values():
            if not isinstance(entry, dict):
                continue
            inventory_g += remaining_grams(
                entry.get(ATTR_SPOOL_WEIGHT_G, DEFAULT_SPOOL_WEIGHT_G),
                entry.get(ATTR_FILAMENT_USED_G, 0.0),
            )

        return {
            "filament_cost_total": round(float(totals.get(ATTR_COST_TOTAL, 0.0)), 2),
            "last_job_cost": totals.get(ATTR_LAST_JOB_COST),
            "last_job_filament": totals.get(ATTR_LAST_JOB_GRAMS),
            "nozzle_filament_total": round(
                float(nozzle.get(ATTR_NOZZLE_TOTAL_G, 0.0)), 1
            ),
            "nozzle_abrasive_filament": round(abrasive_g, 1),
            "nozzle_wear_percent": round(
                min(100.0, abrasive_g / NOZZLE_ABRASIVE_LIFE_G * 100), 1
            ),
            "spool_inventory_count": len(known),
            "spool_inventory_remaining": round(inventory_g, 1),
        }

    def spool_inventory(self) -> list[dict[str, Any]]:
        """Every reel ever seen, with what is left of it.

        Spool history is already kept so a part-used reel recovers its figure
        when it comes back. That is a filament inventory nobody could see --
        including reels not currently in the machine.
        """
        known = self._filament.get("spools") or {}
        inventory: list[dict[str, Any]] = []

        for signature, entry in known.items():
            if not isinstance(entry, dict):
                continue

            material, _, rest = str(signature).partition("|")
            colour, _, sku = rest.partition("|")
            weight = entry.get(ATTR_SPOOL_WEIGHT_G, DEFAULT_SPOOL_WEIGHT_G)
            used = entry.get(ATTR_FILAMENT_USED_G, 0.0)

            inventory.append({
                ATTR_SPOOL_MATERIAL: material or None,
                "color_hex": colour or None,
                "sku": sku or None,
                "remaining_g": remaining_grams(weight, used),
                "remaining_percent": remaining_percent(weight, used),
                ATTR_SPOOL_PRICE_PER_KG: entry.get(ATTR_SPOOL_PRICE_PER_KG) or None,
            })

        return sorted(inventory, key=lambda item: item["remaining_g"])

    async def async_set_spool_weight(
        self, printer_id: int, slot_index: int, grams: float
    ) -> None:
        """Record how much filament a freshly loaded spool started with."""
        state = self._filament_slot_state(printer_id, slot_index)
        state[ATTR_SPOOL_WEIGHT_G] = float(grams)

        signature = state.get(ATTR_SPOOL_SIGNATURE)
        if signature:
            known = self._filament.setdefault("spools", {}).setdefault(signature, {})
            known[ATTR_SPOOL_WEIGHT_G] = float(grams)
            known[ATTR_FILAMENT_USED_G] = state.get(ATTR_FILAMENT_USED_G, 0.0)
        await self._async_save_filament()
        await self.force_state_update()

    async def async_reset_spool(self, printer_id: int, slot_index: int) -> None:
        """Treat the slot as holding a brand new spool."""
        state = self._filament_slot_state(printer_id, slot_index)
        state[ATTR_FILAMENT_USED_G] = 0.0

        # Forget the remembered figure as well, or reinserting this reel would
        # bring the old consumption straight back.
        signature = state.get(ATTR_SPOOL_SIGNATURE)
        if signature:
            self._filament.setdefault("spools", {}).pop(signature, None)
        await self._async_save_filament()
        await self.force_state_update()

    async def _async_save_filament(self) -> None:
        await async_filament_store(self.hass, self.entry.entry_id).async_save(
            self._filament
        )

    async def _async_load_filament(self) -> None:
        stored = await async_filament_store(self.hass, self.entry.entry_id).async_load()
        self._filament = stored or {}

    def _check_spool_changes(self, printer: AnycubicPrinter) -> bool:
        """Follow spools as they move between slots, or out and back again.

        A reel is identified by its colour, material and SKU -- the only things
        the ACE reports about it. Consumption is remembered against that
        identity, so taking a part-used reel out and putting it back later
        restores the figure instead of pretending it is full. Its starting
        weight travels with it too, so a 750 g reel stays a 750 g reel.

        Two reels that are genuinely identical are indistinguishable to the
        printer and so share one entry; the reset button covers that case.
        """
        spools = printer.primary_multi_color_box_spool_info_object or []
        known = self._filament.setdefault("spools", {})
        seen = [(i, spool_signature(spool)) for i, spool in enumerate(spools)]

        # Bank every slot before resolving any, so two reels swapping places
        # both find their own history rather than depending on slot order.
        for slot_index, signature in seen:
            if signature is None:
                continue
            state = self._filament_slot_state(printer.id, slot_index)
            previous = state.get(ATTR_SPOOL_SIGNATURE)
            if previous is not None:
                known[previous] = {
                    ATTR_FILAMENT_USED_G: state.get(ATTR_FILAMENT_USED_G, 0.0),
                    ATTR_SPOOL_WEIGHT_G: state.get(
                        ATTR_SPOOL_WEIGHT_G, DEFAULT_SPOOL_WEIGHT_G
                    ),
                    ATTR_SPOOL_PRICE_PER_KG: state.get(ATTR_SPOOL_PRICE_PER_KG, 0.0),
                }

        changed = False

        for slot_index, signature in seen:
            if signature is None:
                continue

            state = self._filament_slot_state(printer.id, slot_index)

            if state.get(ATTR_SPOOL_SIGNATURE) == signature:
                continue

            remembered = known.get(signature)

            if remembered is not None:
                state[ATTR_FILAMENT_USED_G] = remembered.get(ATTR_FILAMENT_USED_G, 0.0)
                state[ATTR_SPOOL_WEIGHT_G] = remembered.get(
                    ATTR_SPOOL_WEIGHT_G, DEFAULT_SPOOL_WEIGHT_G
                )
                state[ATTR_SPOOL_PRICE_PER_KG] = remembered.get(
                    ATTR_SPOOL_PRICE_PER_KG, 0.0
                )
                LOGGER.debug(
                    "Slot %s: recognised a reel used before, %.0f g already gone.",
                    slot_index + 1,
                    state[ATTR_FILAMENT_USED_G],
                )
            elif state.get(ATTR_SPOOL_SIGNATURE) is not None:
                LOGGER.debug(
                    "Slot %s: new reel, starting the count again.", slot_index + 1
                )
                state[ATTR_FILAMENT_USED_G] = 0.0
                state[ATTR_SPOOL_WEIGHT_G] = DEFAULT_SPOOL_WEIGHT_G
                state[ATTR_SPOOL_PRICE_PER_KG] = 0.0

            state[ATTR_SPOOL_SIGNATURE] = signature
            changed = True

        return changed

    def _record_finished_job(self, printer: AnycubicPrinter) -> bool:
        """Charge a finished print to the spools that supplied it.

        Uses `supplies_usage` -- what the printer says it actually extruded --
        rather than the slicer's estimate, so purge waste is counted and a
        cancelled print is only charged for the part that ran.
        """
        project = printer.latest_project

        if project is None or printer.latest_project_print_in_progress:
            return False

        job_id = project.id
        usage_mm = printer.latest_project_supplies_usage

        if not job_id or not usage_mm:
            return False

        printers = self._filament.setdefault("printers", {})
        printer_state = printers.setdefault(str(printer.id), {})

        if printer_state.get(ATTR_LAST_JOB_ID) == job_id:
            return False

        spools = printer.primary_multi_color_box_spool_info_object or []
        materials = {
            index: spool.get("material_type") for index, spool in enumerate(spools)
        }

        # The live value is already -1 by the time a job reports finished, so
        # fall back to whichever slot was seen feeding during it.
        loaded_slot = printer.primary_multi_color_box_loaded_slot

        if loaded_slot is None or loaded_slot < 0:
            loaded_slot = printer_state.get(ATTR_FEEDING_SLOT)

        per_slot = attribute_job_to_slots(
            supplies_usage_mm=usage_mm,
            paint_infos=project.slice_material_info_list,
            slot_materials=materials,
            loaded_slot=loaded_slot,
        )

        # Record the job either way, so an unattributable one isn't retried
        # forever, but only move the counters when we know which spool to charge.
        printer_state[ATTR_LAST_JOB_ID] = job_id

        if not per_slot:
            LOGGER.debug("Job %s could not be attributed to a slot.", job_id)
            return True

        for slot_index, grams in per_slot.items():
            state = self._filament_slot_state(printer.id, slot_index)
            state[ATTR_FILAMENT_USED_G] = round(
                state.get(ATTR_FILAMENT_USED_G, 0.0) + grams, 2
            )

        LOGGER.debug("Job %s used %s.", job_id, {k + 1: round(v, 1) for k, v in per_slot.items()})

        self._accrue_job_totals(printer, per_slot, materials)
        self._record_job_history(project, sum(per_slot.values()))

        printer_state.pop(ATTR_FEEDING_SLOT, None)

        return True

    def _record_job_history(self, project: Any, grams: float) -> None:
        """Remember what this model actually took.

        Printing the same thing twice is most of 3D printing, and a model's
        consumption barely varies between runs -- three runs of one model here
        took 50.34, 49.49 and 49.49 g. That makes history the best estimate
        available, and the only one that exists before the first layer.
        """
        name = normalise_job_name(getattr(project, "name", None))

        if not name or grams <= 0:
            return

        jobs = self._filament.setdefault("jobs", {})
        samples = jobs.setdefault(name, [])
        samples.append(round(grams, 1))
        # Keep the most recent few, so changing a model's settings is
        # reflected quickly rather than averaged away forever.
        jobs[name] = samples[-JOB_HISTORY_SAMPLES:]

    def _job_history_estimate(self, project: Any) -> float | None:
        """What this model has taken before, if it has been printed before."""
        name = normalise_job_name(getattr(project, "name", None))

        if not name:
            return None

        return history_estimate((self._filament.get("jobs") or {}).get(name))

    def _accrue_job_totals(
        self,
        printer: AnycubicPrinter,
        per_slot: dict[int, float],
        materials: dict[int, str | None],
    ) -> None:
        """Book a finished job against cost, nozzle wear and material totals.

        All three ride on the per-slot grams the estimate already works out, so
        they cost nothing extra to derive and stay consistent with it. Nozzle
        wear is counted in filament pushed through rather than hours run --
        abrasive fill is what actually wears a nozzle, and the material of each
        job is already known here.
        """
        printer_state = self._printer_filament_state(printer.id)
        totals = printer_state.setdefault(ATTR_TOTALS, {})
        nozzle = printer_state.setdefault(ATTR_NOZZLE, {})
        by_material = totals.setdefault(ATTR_MATERIAL_TOTALS, {})

        # Both counters exist from the first job, whatever it was made of. An
        # absent key and a zero mean the same thing to a reader but different
        # things to the code, and that gap is where bugs live.
        nozzle.setdefault(ATTR_NOZZLE_TOTAL_G, 0.0)
        nozzle.setdefault(ATTR_NOZZLE_ABRASIVE_G, 0.0)

        job_grams = 0.0
        job_cost = 0.0
        priced = False

        for slot_index, grams in per_slot.items():
            material = materials.get(slot_index)
            job_grams += grams

            nozzle[ATTR_NOZZLE_TOTAL_G] = round(
                float(nozzle.get(ATTR_NOZZLE_TOTAL_G, 0.0)) + grams, 2
            )
            if is_abrasive(material):
                nozzle[ATTR_NOZZLE_ABRASIVE_G] = round(
                    float(nozzle.get(ATTR_NOZZLE_ABRASIVE_G, 0.0)) + grams, 2
                )

            if material:
                by_material[material] = round(
                    float(by_material.get(material, 0.0)) + grams, 2
                )

            slot_state = self._filament_slot_state(printer.id, slot_index)
            cost = cost_of(grams, slot_state.get(ATTR_SPOOL_PRICE_PER_KG, 0.0))
            if cost is not None:
                job_cost += cost
                priced = True

        totals[ATTR_LAST_JOB_GRAMS] = round(job_grams, 1)
        # An unpriced job records None rather than 0 -- "free" and "you never
        # told me what this reel cost" are different answers.
        totals[ATTR_LAST_JOB_COST] = round(job_cost, 2) if priced else None

        if priced:
            totals[ATTR_COST_TOTAL] = round(
                float(totals.get(ATTR_COST_TOTAL, 0.0)) + job_cost, 2
            )

    def _remember_feeding_slot(self, printer: AnycubicPrinter) -> bool:
        """Note which slot is feeding while a job runs.

        Prints started at the printer's own screen carry no per-slot breakdown,
        and `loaded_slot` reverts to -1 the moment the job ends -- so by the time
        a job can be charged, the only evidence of which spool fed it is gone.
        Capturing it mid-print is what makes those jobs attributable at all.
        """
        if not printer.latest_project_print_in_progress:
            return False

        slot = printer.primary_multi_color_box_loaded_slot

        if slot is None or slot < 0:
            return False

        printers = self._filament.setdefault("printers", {})
        state = printers.setdefault(str(printer.id), {})

        if state.get(ATTR_FEEDING_SLOT) == slot:
            return False

        state[ATTR_FEEDING_SLOT] = slot

        return True

    async def _async_update_filament(self) -> None:
        """Keep the per-slot estimate current."""
        changed = False

        for printer in self._anycubic_printers.values():
            try:
                if self._check_spool_changes(printer):
                    changed = True
                if self._remember_feeding_slot(printer):
                    changed = True
                if self._record_finished_job(printer):
                    changed = True
            except Exception as error:  # noqa: BLE001 - an estimate must never break a refresh
                LOGGER.debug("Filament estimate skipped for this refresh: %s", error)

        if changed:
            await self._async_save_filament()

    async def get_anycubic_updates(self) -> bool:
        """Fetch data from AnycubicCloud."""

        if self.lan_is_connected:
            # The cloud drops a printer that has gone local, so asking it for
            # one fails every time -- and failing here aborted the refresh
            # before the local reports were ever built into coordinator data,
            # leaving every entity unavailable on a working connection.
            self._last_state_update = int(time.time())
            return True

        if self._failed_updates >= MAX_FAILED_UPDATES:
            self._last_state_update = int(time.time()) + FAILED_UPDATE_DELAY
            self._failed_updates = 0
            return False

        self._last_state_update = int(time.time())

        try:
            await self._check_or_save_tokens()

            for printer in self._anycubic_printers.values():
                await printer.update_info_from_api(True)

            self._failed_updates = 0

            if self._connection_lost_logged:
                LOGGER.info("Reconnected to the Anycubic cloud.")
                self._connection_lost_logged = False

            await self._check_anycubic_mqtt_connection()

            await self._async_add_new_printers()

            await self._async_update_filament()

        except ConfigEntryAuthFailed:
            raise

        except AnycubicAPIParsingError as error:
            self._note_connection_lost(error)
            raise UpdateFailed(error) from error

        except AnycubicAPIError as error:
            self._note_connection_lost(error)
            raise UpdateFailed(error) from error

        except Exception as error:
            tb = traceback.format_exc()
            LOGGER.debug(f"Anycubic update error: {error}\n{tb}")
            self._note_connection_lost(error)
            raise UpdateFailed(error) from error

        self._last_state_update = int(time.time())

        return True

    def get_printer_for_id(
        self,
        printer_id: int | None,
    ) -> AnycubicPrinter | None:
        if printer_id is None or len(str(printer_id)) == 0:
            return None

        return self._anycubic_printers.get(int(printer_id))

    def get_printer_for_device_id(
        self,
        device_id: str | None,
    ) -> AnycubicPrinter | None:
        if self._printer_device_map is None:
            return None

        if device_id is None or len(str(device_id)) == 0:
            return None

        printer_id = self._printer_device_map.get(device_id)

        if not printer_id:
            return None

        return self._anycubic_printers.get(int(printer_id))

    async def refresh_cloud_files(self) -> None:
        self._cloud_file_list = await self.anycubic_api.get_user_cloud_files_data_object()

    async def force_state_update(self) -> None:
        self._last_state_update = None
        await self.async_refresh()
        self._last_state_update = int(time.time()) - DEFAULT_SCAN_INTERVAL + 10

    async def async_set_print_setting(
        self,
        printer_id: int,
        method_name: str,
        value: float,
    ) -> None:
        """Change one live print setting.

        These have always been available as actions; the entities that call
        this only make them reachable from the device page. The printer
        rejects them when nothing is printing, so that is checked here rather
        than letting the call fail opaquely.
        """
        printer = self.get_printer_for_id(printer_id)

        if printer is None:
            raise HomeAssistantError("The printer is not available.")

        if not printer.latest_project_print_in_progress:
            raise HomeAssistantError(
                "The printer only accepts print settings while a job is running."
            )

        try:
            await getattr(printer, method_name)(int(value))
        except Exception as error:
            raise HomeAssistantError(error) from error

        await self.force_state_update()

    async def async_set_print_speed_mode(self, printer_id: int, mode: int) -> None:
        """Choose one of the speed modes the printer says it supports."""
        await self.async_set_print_setting(
            printer_id, "change_print_setting_speed_mode", mode
        )

    def get_drying_setting(self, printer_id: int, key: str, default: float) -> float:
        """A stored drying temperature or duration for this printer."""
        state = self._printer_filament_state(printer_id)

        return float((state.get(ATTR_DRYING_SETTINGS) or {}).get(key, default))

    async def async_set_drying_setting(
        self, printer_id: int, key: str, value: float
    ) -> None:
        """Remember a drying temperature or duration for the start button."""
        state = self._printer_filament_state(printer_id)
        state.setdefault(ATTR_DRYING_SETTINGS, {})[key] = float(value)
        await self._async_save_filament()
        await self.force_state_update()

    async def async_start_drying(self, printer_id: int) -> None:
        """Start a dry cycle at the temperature and duration set alongside.

        Drying could previously only be started from a preset configured in
        the options flow, which is why the ACE device page offered a stop
        button and no way to start.
        """
        printer = self.get_printer_for_id(printer_id)

        if printer is None:
            raise HomeAssistantError("The printer is not available.")

        duration = int(self.get_drying_setting(printer_id, ATTR_DRYING_DURATION, 120))
        temperature = int(self.get_drying_setting(printer_id, ATTR_DRYING_TEMPERATURE, 45))

        LOGGER.debug("Starting drying: %s min at %s C.", duration, temperature)

        try:
            await printer.multi_color_box_drying_start(
                duration=duration,
                target_temp=temperature,
            )
        except Exception as error:
            raise HomeAssistantError(error) from error

        await self.force_state_update()

    async def button_press_event(
        self,
        printer_id: int,
        event_key: str,
    ) -> None:
        printer = self.get_printer_for_id(printer_id)

        try:

            if printer and (
                event_key.startswith(ENTITY_ID_DRYING_START_PRESET_) or
                event_key.startswith(f"secondary_{ENTITY_ID_DRYING_START_PRESET_}")
            ):
                preset_duration, preset_temperature = get_drying_preset_from_entry_options(
                    self.entry.options,
                    event_key[-1],
                )
                if preset_duration is None or preset_temperature is None:
                    return

                if event_key.startswith(f"secondary_{ENTITY_ID_DRYING_START_PRESET_}"):
                    box_id = 1
                else:
                    box_id = 0

                await self._connect_mqtt_for_action_response()
                await printer.multi_color_box_drying_start(
                    duration=preset_duration,
                    target_temp=preset_temperature,
                    box_id=box_id,
                )

            elif printer and event_key == 'refresh_mqtt_connection':
                await self.refresh_anycubic_mqtt_connection()

            elif printer and event_key == 'request_file_list_cloud':
                await self._connect_mqtt_for_action_response()
                await self.refresh_cloud_files()

            elif printer and event_key == 'request_file_list_local':
                prev_file_list = printer.local_file_list_object
                await self._connect_mqtt_for_action_response()
                await printer.request_local_file_list()
                self.hass.create_task(
                    self._async_check_local_file_list_changed(prev_file_list, printer),
                    f"Anycubic coordinator {self.entry.entry_id} {printer.id} local file list check",
                )

            elif printer and event_key == 'request_file_list_udisk':
                await self._connect_mqtt_for_action_response()
                await printer.request_udisk_file_list()

            elif printer and event_key == 'request_axis_position':
                await self._connect_mqtt_for_action_response()
                await printer.request_axis_position()

            elif printer and event_key == 'ace_refresh_spools':
                await self._connect_mqtt_for_action_response()
                await printer.multi_color_box_get_info()

            elif printer and event_key == 'drying_stop':
                await self._connect_mqtt_for_action_response()
                await printer.multi_color_box_drying_stop()

            elif printer and event_key == 'secondary_drying_stop':
                await self._connect_mqtt_for_action_response()
                await printer.multi_color_box_drying_stop(box_id=1)

            elif printer and event_key == 'pause_print':
                await self._connect_mqtt_for_action_response()
                await printer.pause_print()

            elif printer and event_key == 'resume_print':
                await self._connect_mqtt_for_action_response()
                await printer.resume_print()

            elif printer and event_key == 'cancel_print':
                await self._connect_mqtt_for_action_response()
                await printer.cancel_print()

            # elif printer and event_key == 'toggle_auto_feed':
            #     await printer.multi_color_box_toggle_auto_feed()

            # elif event_key == 'toggle_mqtt_connection':
            #     self._mqtt_manually_connected = not self._mqtt_manually_connected

            else:
                return

            await self.force_state_update()

        except AnycubicAPIError as ex:
            raise HomeAssistantError(ex) from ex

    async def fw_update_event(
        self,
        printer_id: int,
        event_key: str,
    ) -> None:
        printer = self.get_printer_for_id(printer_id)

        try:

            if printer and event_key == 'fw_version':
                await self._connect_mqtt_for_action_response()
                await printer.update_printer_firmware()

            elif printer and event_key == 'multi_color_box_fw_version':
                await self._connect_mqtt_for_action_response()
                await printer.update_printer_multi_color_box_firmware()

            elif printer and event_key == 'secondary_multi_color_box_fw_version':
                await self._connect_mqtt_for_action_response()
                await printer.update_printer_multi_color_box_firmware(box_id=1)

            else:
                return

            await self.force_state_update()

        except AnycubicAPIError as ex:
            raise HomeAssistantError(ex) from ex

    async def set_printer_light(
        self,
        printer_id: int,
        light_on: bool,
        brightness: int | None = None,
    ) -> None:
        printer = self.get_printer_for_id(printer_id)

        if not printer:
            return

        await self._connect_mqtt_for_action_response()
        await printer.set_light(light_on=light_on, brightness=brightness)
        await self.force_state_update()

    async def switch_on_event(
        self,
        printer_id: int,
        event_key: str,
    ) -> None:
        printer = self.get_printer_for_id(printer_id)

        if event_key == 'manual_mqtt_connection_enabled':
            self._mqtt_manually_connected = True

        elif printer and event_key == 'multi_color_box_runout_refill':
            await self._connect_mqtt_for_action_response()
            await printer.multi_color_box_switch_on_auto_feed()

        elif printer and event_key == 'secondary_multi_color_box_runout_refill':
            await self._connect_mqtt_for_action_response()
            await printer.multi_color_box_switch_on_auto_feed(box_id=1)

        else:
            return

        await self.force_state_update()

    async def switch_off_event(
        self,
        printer_id: int,
        event_key: str,
    ) -> None:
        printer = self.get_printer_for_id(printer_id)

        if event_key == 'manual_mqtt_connection_enabled':
            self._mqtt_manually_connected = False

        elif printer and event_key == 'multi_color_box_runout_refill':
            await self._connect_mqtt_for_action_response()
            await printer.multi_color_box_switch_off_auto_feed()

        elif printer and event_key == 'secondary_multi_color_box_runout_refill':
            await self._connect_mqtt_for_action_response()
            await printer.multi_color_box_switch_off_auto_feed(box_id=1)

        else:
            return

        await self.force_state_update()
