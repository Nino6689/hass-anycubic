"""Wire constants for Agora's ("shengwang", 声网) SD-RTN signalling protocol.

Every value here was read out of Agora's own Web SDK -- `agora-rtc-sdk-ng`
v4.24.0, the build the Anycubic slicer ships -- rather than guessed, because
the protocol has no published specification. Where a constant is non-obvious
the SDK symbol it came from is named next to it.

Adapted from `Jezza34000/homeassistant_petkit` (MIT), whose Agora client is in
turn based on the original reverse engineering by @mikey0000.
"""

from __future__ import annotations

import logging
from typing import Final

LOGGER: Final[logging.Logger] = logging.getLogger(__package__)

# --- Access Point (the "choose_server" hop) ---------------------------------

# The v2 transpond endpoint. Not /api/v1 -- that is a different service that
# answers with a completely different shape.
AP_PATH: Final = "/api/v2/transpond/webrtc?v=2"

# SDK config WEBCS_DOMAIN and WEBCS_DOMAIN_BACKUP_LIST. The two primaries are
# raced against each other; the backups are only started if neither has
# answered within AP_BACKUP_DELAY.
AP_DOMAINS: Final[tuple[str, ...]] = (
    "webrtc2-ap-web-1.agora.io",
    "webrtc2-2.ap.sd-rtn.com",
)
AP_DOMAINS_BACKUP: Final[tuple[str, ...]] = (
    "webrtc2-ap-web-3.agora.io",
    "webrtc2-4.ap.sd-rtn.com",
)

# When a response carries a region hint in detail[23], the SDK rebuilds its
# domain list from these templates for *subsequent* lookups (SDK function pF).
AP_REGION_DOMAIN: Final = "ap-web-1-{region}.agora.io"
AP_REGION_DOMAIN_BACKUP: Final = "ap-web-2-{region}.ap.sd-rtn.com"

# Sent verbatim as detail[11] and detail[22]. It is a literal string, not a
# list and not an enum ordinal.
AP_AREA_CODE: Final = "CN,GLOBAL"

# request_bodies[].uri for a choose-server lookup.
AP_URI_CHOOSE_SERVER: Final = 22

# buffer.service_ids -- gateway lookup plus the TURN fallback allocation.
SERVICE_ID_CHOOSE_SERVER: Final = 11
SERVICE_ID_CLOUD_PROXY_FALLBACK: Final = 26
AP_SERVICE_IDS: Final[tuple[int, ...]] = (
    SERVICE_ID_CHOOSE_SERVER,
    SERVICE_ID_CLOUD_PROXY_FALLBACK,
)

# response_body[].buffer.flag -- which service a response block answers for.
RESPONSE_FLAG_CHOOSE_SERVER: Final = 4096
RESPONSE_FLAG_CLOUD_PROXY_FALLBACK: Final = 4194310

# AP request detail keys. Numeric keys carried as JSON object keys, so strings.
AP_DETAIL_AREA: Final = "11"
AP_DETAIL_ROLE: Final = "17"
AP_DETAIL_AREA_ALT: Final = "22"

# AP response detail keys. The TURN credentials Agora also returns (detail[4]
# and detail[8], against RESPONSE_FLAG_CLOUD_PROXY_FALLBACK) are deliberately
# not used: the browser is the WebRTC peer here and reaches the edge directly,
# so there is no relay for this client to allocate.
DETAIL_FINGERPRINTS: Final = "19"
DETAIL_REGION: Final = "23"

# detail[17] in the AP request. Note this is "1"/"2", while the join message
# spells the same thing "host"/"audience".
AP_ROLE_HOST: Final = "1"
AP_ROLE_AUDIENCE: Final = "2"

# --- Gateway (edge websocket) ----------------------------------------------

# The edge is addressed by its IP with dots swapped for dashes, because the
# wildcard certificate covers *.edge.agora.io and an IP literal would not
# validate against it.
GATEWAY_URL: Final = "wss://{host}.edge.agora.io:{port}"

SDK_VERSION: Final = "4.24.0"
CHANNEL_MODE: Final = "live"
CHANNEL_CODEC: Final = "h264"
JOIN_ROLE_HOST: Final = "host"

# Agora gates some behaviour on the declared browser. Claiming a current
# desktop Chrome keeps us on the same code path as the slicer's own client.
BROWSER_USER_AGENT: Final = (
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36"
)

# Server-pushed notification verbs we act on (SDK enum of signalling events).
EVENT_ADD_VIDEO_STREAM: Final = "on_add_video_stream"
EVENT_REMOVE_VIDEO_STREAM: Final = "on_remove_video_stream"
EVENT_USER_ONLINE: Final = "on_user_online"
EVENT_USER_OFFLINE: Final = "on_user_offline"
EVENT_CRYPT_ERROR: Final = "on_crypt_error"
EVENT_P2P_LOST: Final = "on_p2p_lost"
EVENT_ERROR: Final = "error"
EVENT_TOKEN_WILL_EXPIRE: Final = "on_token_privilege_will_expire"
EVENT_TOKEN_DID_EXPIRE: Final = "on_token_privilege_did_expire"

# Gateway error codes worth naming, because they are the ones we can actually
# explain to a user.
ERR_ILLEGAL_AES_PASSWORD: Final = 2028
ERR_REJOIN_TOKEN_INVALID: Final = 2024

# --- Timeouts ---------------------------------------------------------------

AP_REQUEST_TIMEOUT: Final = 10.0
AP_BACKUP_DELAY: Final = 1.0
AP_TOTAL_TIMEOUT: Final = 20.0
WS_CONNECT_TIMEOUT: Final = 10.0
WS_CLOSE_TIMEOUT: Final = 5.0
JOIN_TIMEOUT: Final = 15.0

# How long to keep waiting for the publisher's stream announcement after the
# join itself has succeeded. See session.py for why this wait has to exist.
STREAM_ANNOUNCE_TIMEOUT: Final = 8.0

# The slicer's own client pings every 3s; the gateway drops idle sockets well
# inside a minute.
PING_INTERVAL: Final = 3.0
