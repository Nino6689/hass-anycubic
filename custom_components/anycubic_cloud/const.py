"""Anycubic Cloud integration constants."""
import logging
from enum import IntEnum

from homeassistant.const import Platform

DEFAULT_NAME = "Anycubic Cloud Printer"

MANUFACTURER = "Anycubic"
MODEL = "main"

DOMAIN = "anycubic_cloud"
COORDINATOR = "coordinator"

CUSTOM_COMPONENTS = "custom_components"
INTEGRATION_FOLDER = DOMAIN
PANEL_FOLDER = "frontend_panel"
PANEL_FILENAME = "dist/anycubic-cloud-panel.js"
PANEL_NAME = "anycubic-cloud-panel"
PANEL_TITLE = "Anycubic Cloud & LAN"
PANEL_ICON = "mdi:printer-3d"

ATTR_CONFIG_ENTRY = "config_entry"
ATTR_ANYCUBIC_EVENT = "anycubic_cloud"

ENTITY_ID_DRYING_START_PRESET_ = "drying_start_preset_"

CONF_USER_AUTH_MODE = "user_auth_mode"
CONF_USER_DEVICE_ID = "user_device_id"
CONF_USER_TOKEN = "user_token"
CONF_PRINTER_ID = "printer_id"
CONF_PRINTER_ID_LIST = "printer_ids"
CONF_PRINTER_NAME = "printer_name"
CONF_DRYING_PRESET_DURATION_ = "drying_preset_duration_"
CONF_DRYING_PRESET_TEMPERATURE_ = "drying_preset_temperature_"
CONF_SLOT_NUMBER = "slot_number"
CONF_SLOT_COLOR_RED = "slot_color_red"
CONF_SLOT_COLOR_GREEN = "slot_color_green"
CONF_SLOT_COLOR_BLUE = "slot_color_blue"
CONF_BOX_ID = "box_id"
CONF_FINISHED = "finished"
CONF_MQTT_CONNECT_MODE = "mqtt_connect_mode"
CONF_LAN_MODE_ENABLED = "lan_mode_enabled"
CONF_LAN_HOST = "lan_host"
CONF_CARD_CONFIG = "card_config"
CONF_DEBUG_DEPRECATED = "debug"
CONF_DEBUG_MQTT_MSG = "debug_mqtt_msg"
CONF_DEBUG_API_CALLS = "debug_api_calls"
CONF_UPLOADED_GCODE_FILE = "uploaded_gcode_file"
CONF_FILE_ID = "file_id"
CONF_SPEED_MODE = "speed_mode"
CONF_SPEED = "speed"
CONF_TEMPERATURE = "temperature"
CONF_LAYERS = "layers"
CONF_TIME = "time"

AC_EVENT_PRINT_CLOUD_START = "print_cloud_start"

UNIT_LAYERS = "Layers"

# Slots in an ACE / ACE Pro unit.
ACE_SLOT_COUNT = 4

# ACE model ids as reported in the multiColorBox payload. 40001 is confirmed
# on an ACE Pro; others are unknown until someone reports one.
ACE_MODEL_NAMES = {
    40001: "ACE Pro",
}
ACE_MODEL_FALLBACK = "ACE"

ENTITY_ID_ACE_SLOT_ = "ace_slot_"

# Anycubic tokens are 90-day JWTs and cannot be auto-refreshed, so warn
# while there is still comfortable time to fetch a new one.
TOKEN_EXPIRY_WARN_DAYS = 14

# Passed into translated strings as a placeholder: hassfest forbids URLs
# living inside translation files themselves.
TOOLS_URL = "https://github.com/Nino6689/hass-anycubic/tree/main/tools"

# Direct links for the token-expiry repair. hassfest rejects URLs inside
# translation strings, so they are passed in as placeholders instead.
TOOL_URL_MACOS = f"{TOOLS_URL}/get-anycubic-token-macos.command"
TOOL_URL_WINDOWS = f"{TOOLS_URL}/Get-AnycubicToken-Windows.ps1"
TOOL_URL_BOOKMARKLET = f"{TOOLS_URL}/web-token-bookmarklet.txt"

STORAGE_KEY = DOMAIN
STORAGE_VERSION = 1

API_SETUP_RETRIES = 3
API_SETUP_RETRY_INTERVAL_SECONDS = 10
DEFAULT_SCAN_INTERVAL = 60
MQTT_SCAN_INTERVAL = 15
FAILED_UPDATE_DELAY = DEFAULT_SCAN_INTERVAL * 4
MAX_FAILED_UPDATES = 3
MQTT_IDLE_DISCONNECT_SECONDS = 60 * 15
MQTT_ACTION_RESPONSE_ALIVE_SECONDS = 60 * 5
MQTT_REFRESH_INTERVAL = 60 * 5
MAX_FILE_UPLOAD_RETRIES = 3
PRINT_JOB_STARTED_UPDATE_DELAY = 5

MAX_DRYING_PRESETS = 4

# The printer serves its own camera here. Named by the printer over a local
# connection; on a cloud connection nothing reports it, but the port is the
# same and the video always comes from the printer directly.
CAMERA_STREAM_PORT = 18088
# How long to wait for the cloud broker when opening the camera. Long
# enough for a normal connect, short enough not to hang the UI.
CAMERA_MQTT_CONNECT_TIMEOUT = 12


class PrinterEntityType(IntEnum):
    GLOBAL = 1
    PRINTER = 2
    FDM = 3
    LCD = 4
    ACE_PRIMARY = 5
    ACE_SECONDARY = 6
    DRY_PRESET_PRIMARY = 7
    DRY_PRESET_SECONDARY = 8


LOGGER = logging.getLogger(__package__)

PLATFORMS = [
    Platform.BINARY_SENSOR,
    Platform.CAMERA,
    Platform.BUTTON,
    Platform.IMAGE,
    Platform.LIGHT,
    Platform.NUMBER,
    Platform.SELECT,
    Platform.SENSOR,
    Platform.SWITCH,
    Platform.UPDATE,
]

# Filament-remaining estimate
ATTR_FEEDING_SLOT = "feeding_slot"
ATTR_FILAMENT_USED_G = "filament_used_g"
ATTR_SPOOL_WEIGHT_G = "spool_weight_g"
ATTR_SPOOL_SIGNATURE = "spool_signature"
ATTR_LAST_JOB_ID = "last_job_id"
MAX_ACE_SLOTS = 4

# What a reel cost, per kilogram, so a job can be priced. Travels with the
# spool signature like the weight does, so a reel put back in a different slot
# keeps its price.
ATTR_SPOOL_PRICE_PER_KG = "spool_price_per_kg"
ATTR_SPOOL_MATERIAL = "material"

# Drying temperature and duration, stored per printer so the ACE device
# page can start a cycle without a preset being configured first.
# Jog distance for the axis buttons, in millimetres. The slicer offers
# 1/15/50 and so do we -- a free-text field invites a 200 mm typo into a
# machine that can crash its own nozzle.
ATTR_AXIS_STEP = "axis_step"
AXIS_STEPS_MM = (1, 15, 50)

ATTR_DRYING_SETTINGS = "drying_settings"
ATTR_DRYING_TEMPERATURE = "temperature"
ATTR_DRYING_DURATION = "duration"

# Lifetime totals, kept per printer alongside the per-slot figures.
ATTR_TOTALS = "totals"
ATTR_COST_TOTAL = "cost_total"
ATTR_LAST_JOB_COST = "last_job_cost"
ATTR_LAST_JOB_GRAMS = "last_job_grams"
ATTR_MATERIAL_TOTALS = "material_totals"

# Nozzle wear, measured in filament pushed through rather than hours run --
# abrasive fill is what actually wears it, and grams per material is already
# tracked for the spool estimate.
ATTR_NOZZLE = "nozzle"
ATTR_NOZZLE_TOTAL_G = "nozzle_total_g"
ATTR_NOZZLE_ABRASIVE_G = "nozzle_abrasive_g"
# A brass nozzle is generally considered due for replacement somewhere around
# here on abrasive filament. Deliberately a soft guide, surfaced as a
# percentage rather than a hard alert.
NOZZLE_ABRASIVE_LIFE_G = 1000.0
