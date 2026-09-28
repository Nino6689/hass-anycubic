"""Constants for the Anycubic Cloud & LAN integration.

Identifiers here are compatibility facts from docs/COMPAT.md: they key the
entity registry, the device registry and stored data, so they never change.
"""

from __future__ import annotations

from datetime import timedelta
from typing import Final

DOMAIN: Final = "anycubic_cloud"
MANUFACTURER: Final = "Anycubic"

# Config entry data keys (COMPAT §1).
CONF_USER_TOKEN: Final = "user_token"  # noqa: S105 - a key name
CONF_USER_AUTH_MODE: Final = "user_auth_mode"
CONF_USER_DEVICE_ID: Final = "user_device_id"
CONF_REGION: Final = "region"
CONF_PRINTER_IDS: Final = "printer_ids"
CONF_LAN_HOST: Final = "lan_host"

# Config entry option keys (COMPAT §1).
CONF_MQTT_CONNECT_MODE: Final = "mqtt_connect_mode"
CONF_LAN_MODE_ENABLED: Final = "lan_mode_enabled"
CONF_CARD_CONFIG: Final = "card_config"
CONF_DEBUG_MQTT_MSG: Final = "debug_mqtt_msg"
CONF_DEBUG_API_CALLS: Final = "debug_api_calls"
CONF_DEBUG_DEPRECATED: Final = "debug"
CONF_DRYING_PRESET_DURATION: Final = "drying_preset_duration_{}"
CONF_DRYING_PRESET_TEMPERATURE: Final = "drying_preset_temperature_{}"

DRYING_PRESETS: Final = (1, 2, 3, 4)
ACE_SLOTS: Final = (1, 2, 3, 4)

REGION_INTERNATIONAL: Final = "international"
REGION_CHINA: Final = "china"

# mqtt_connect_mode values (BEHAVIOUR §5.2). Stored for cloud entries only.
MQTT_CONNECT_MODES: Final = (1, 2, 3, 4, 5)
DEFAULT_MQTT_CONNECT_MODE: Final = 1

# Device identifier prefix of an entry without an Anycubic account: the
# literal text "None" (COMPAT §2).
LAN_ONLY_USER_ID: Final = "None"

# Refresh cadence (BEHAVIOUR §5.1).
UPDATE_INTERVAL: Final = timedelta(seconds=15)
# How long to wait for the first `info` report when building a printer from
# LAN (BEHAVIOUR §5.3).
LAN_INFO_TIMEOUT: Final = 20.0

# Store keys (COMPAT §6). The entry id is appended.
STORE_FILAMENT: Final = "anycubic_cloud.filament"
STORE_CAPABILITIES: Final = "anycubic_cloud.capabilities"
STORE_VERSION: Final = 1
# The cloud session (token store): per entry, and the un-suffixed legacy key
# older versions wrote (COMPAT §6; PROTOCOL A §5.3 rule 2).
STORE_TOKENS: Final = "anycubic_cloud"
STORE_TOKENS_LEGACY: Final = "anycubic_cloud"

# Cloud poll cadence and back-off (BEHAVIOUR §5.1).
CLOUD_POLL_INTERVAL: Final = 60.0
CLOUD_POLL_AFTER_CONTROL: Final = 10.0
CLOUD_POLL_FAILURES_BEFORE_PAUSE: Final = 3
CLOUD_POLL_PAUSE: Final = 240.0
# Setup retries on a transient cloud answer (BEHAVIOUR §5.7).
CLOUD_SETUP_ATTEMPTS: Final = 4
CLOUD_SETUP_RETRY_DELAY: Final = 10.0
# A forced refresh after a printer went from free to busy (BEHAVIOUR §5.1).
PRINT_STARTED_REFRESH_DELAY: Final = 5.0

# Cloud MQTT lifecycle (BEHAVIOUR §5.2, PROTOCOL C §6.17).
MQTT_ACTION_HOLD: Final = 300.0
MQTT_IDLE_RELEASE: Final = 900.0
MQTT_WAKE_TIMEOUT: Final = 10.0
MQTT_WAKE_SETTLE: Final = 2.0
MQTT_REFRESH_MIN_INTERVAL: Final = 300.0
MQTT_REFRESH_PAUSE: Final = 2.0
MQTT_CAPABILITY_DELAY: Final = 10.0
CAPABILITY_POLL_BUDGET: Final = 3
MQTT_MODE_PRINTING: Final = 1
MQTT_MODE_PRINTING_DRYING: Final = 2
MQTT_MODE_ONLINE: Final = 3
MQTT_MODE_ALWAYS: Final = 4
MQTT_MODE_NEVER: Final = 5

# File lists (BEHAVIOUR §2.12, §4.5).
FILE_LIST_LOCAL: Final = "local"
FILE_LIST_UDISK: Final = "udisk"
FILE_LIST_CLOUD: Final = "cloud"
FILE_LIST_RETRY_DELAY: Final = 5.0
FILE_LIST_RETRY_SETTLE: Final = 2.0
DELETE_RELIST_DELAYS: Final = (2.0, 7.0)
CLOUD_DELETE_RELIST_DELAY: Final = 5.0
# Upload read retries of the print actions (BEHAVIOUR §4.4).
UPLOAD_READ_ATTEMPTS: Final = 3
UPLOAD_READ_DELAY: Final = 1.0

# Expiry repair (BEHAVIOUR §5.6).
TOKEN_EXPIRY_WARNING_DAYS: Final = 14

# ACE model ids (COMPAT §2; anycubic-lan PROTOCOL §6.7 as corrected).
# DECISIONS round 2, Q2.3: only 40001 is named; others are the generic "ACE".
ACE_MODEL_NAMES: Final[dict[int, str]] = {40001: "ACE Pro"}
ACE_MODEL_DEFAULT: Final = "ACE"

# Kobra X answers its camera stream with HTTP 206 (BEHAVIOUR §2.18).
MODEL_ID_KOBRA_X: Final = 20030
CAMERA_PORT: Final = 18088

# Cloud function id that means "supports an ACE" (BEHAVIOUR §1.7).
FUNCTION_ID_MULTI_COLOR_BOX: Final = 2006

# Filament density in g/cm³ (BEHAVIOUR §3.2).
FILAMENT_DENSITY: Final[dict[str, float]] = {
    "PLA": 1.24,
    "PLA+": 1.24,
    "PLA-SE": 1.24,
    "PETG": 1.27,
    "ABS": 1.04,
    "ASA": 1.07,
    "PC": 1.20,
    "PA": 1.14,
    "PAHT-CF": 1.30,
    "PACF": 1.30,
    "HIPS": 1.04,
    "TPU": 1.21,
}
DEFAULT_FILAMENT_DENSITY: Final = 1.24
FILAMENT_RADIUS_CM: Final = 0.0875

# Recommended drying profile per material: (°C, minutes) (BEHAVIOUR §3.11).
DRYING_PROFILES: Final[dict[str, tuple[int, int]]] = {
    "PLA": (45, 360),
    "PLA+": (45, 360),
    "PLA-SE": (45, 360),
    "PETG": (65, 360),
    "ABS": (70, 240),
    "ASA": (70, 240),
    "PC": (70, 360),
    "PA": (70, 720),
    "PAHT-CF": (70, 720),
    "PACF": (70, 720),
    "HIPS": (65, 240),
    "TPU": (50, 480),
}
DEFAULT_DRYING_PROFILE: Final = (45, 360)

# Substrings that make a material abrasive for nozzle wear (BEHAVIOUR §3.9).
ABRASIVE_MARKERS: Final = (
    "CF",
    "GF",
    "CARBON",
    "GLASS",
    "GLOW",
    "GLITTER",
    "WOOD",
    "METAL",
)
NOZZLE_GUIDE_LIFE_G: Final = 1000.0

# Reel defaults (BEHAVIOUR §3.3, §3.4).
DEFAULT_SPOOL_WEIGHT_G: Final = 1000.0
FULL_REEL_G: Final = 1000.0

# Job history (BEHAVIOUR §3.7).
JOB_HISTORY_SAMPLES: Final = 5

# Run-out forecast thresholds, in percentage points (BEHAVIOUR §3.6).
FORECAST_ANCHOR_MIN_PROGRESS: Final = 3.0
FORECAST_MIN_SPAN: Final = 5.0

# Jog steps in mm (BEHAVIOUR §3.12).
AXIS_STEPS: Final = (1, 15, 50)
DEFAULT_AXIS_STEP: Final = 1

# Axis numbers and move types of the axis order (BEHAVIOUR §2.12).
AXIS_X: Final = 1
AXIS_Y: Final = 2
AXIS_Z: Final = 3
AXIS_XY: Final = 4
MOVE_MINUS: Final = 0
MOVE_PLUS: Final = 1
MOVE_HOME: Final = 2

# How long "Home all" waits for X/Y homing to finish (BEHAVIOUR §2.12).
HOME_ALL_TIMEOUT: Final = 45.0
HOME_ALL_POLL: Final = 2.0

# ACE feed types (BEHAVIOUR §2.12, §4.3).
FEED_TYPE_FEED: Final = 1
FEED_TYPE_RETRACT: Final = 2
FEED_TYPE_FINISH: Final = 3

# Materials sent by the set-slot actions (BEHAVIOUR §4.2).
SET_SLOT_MATERIALS: Final[dict[str, str]] = {
    "pla": "PLA",
    "petg": "PETG",
    "abs": "ABS",
    "pacf": "PACF",
    "pc": "PC",
    "asa": "ASA",
    "hips": "HIPS",
    "pa": "PA",
    "pla_se": "PLA SE",
}

# Cloud function id -> name, used by current_status.supported_functions
# (BEHAVIOUR §2.14). Empty on LAN.
FUNCTION_NAMES: Final[dict[int, str]] = {
    1: "AXLE_MOVEMENT",
    2: "FILE_MANAGER",
    3: "EXPOSURE_TEST",
    7: "LCD_PEER_VIDEO",
    13: "FDM_AXIS_MOVE",
    22: "FDM_PEER_VIDEO",
    26: "DEVICE_STARTUP_SELF_TEST",
    27: "PRINT_STARTUP_SELF_TEST",
    28: "AUTOMATIC_OPERATION",
    29: "RESIDUE_CLEAN",
    30: "NOVICE_GUIDE",
    31: "RELEASE_FILM",
    32: "TASK_MODE",
    33: "LCD_INTELLIGENT_MATERIALS_BOX",
    34: "LCD_AUTO_OUT_IN_MATERIALS",
    35: "M7PRO_AUTOMATIC_OPERATION",
    36: "AI_DETECTION",
    37: "AUTO_LEVELER",
    38: "VIBRATION_COMPENSATION",
    39: "TIME_LAPSE",
    40: "VIDEO_LIGHT",
    41: "BOX_LIGHT",
    2006: "MULTI_COLOR_BOX",
}

# card_config keys and the type each must have (BEHAVIOUR §5.9, FRONTEND
# §2.2 and DECISIONS frontend 3: every card key passes through, and false, 0
# and empty values are honoured).
CARD_CONFIG_BOOL_KEYS: Final = (
    "vertical",
    "round",
    "use_24hr",
    "showSettingsButton",
    "alwaysShow",
    "showControls",
    "showMoveButtons",
    "noCamera",
)
CARD_CONFIG_STR_KEYS: Final = (
    "temperatureUnit",
    "lightEntityId",
    "powerEntityId",
    "cameraEntityId",
    "mediaView",
    "printerArt",
)
CARD_CONFIG_LIST_KEYS: Final = ("monitoredStats", "slotColors", "sections")
CARD_CONFIG_NUMBER_KEYS: Final = ("scaleFactor",)

EVENT_TYPE: Final = DOMAIN
EVENT_PRINT_CLOUD_START: Final = "print_cloud_start"
