"""Dependency-free SDP parsing and the SDP -> ORTC conversion Agora wants.

Agora's join message does not carry SDP. It carries an "ORTC" object: ICE
parameters, DTLS parameters, and RTP capabilities split into send and recv
halves. This module turns a browser offer into that shape without pulling in
`sdp_transform`, which is not available in the Home Assistant container.

Adapted from `Jezza34000/homeassistant_petkit` (MIT), whose Agora client is in
turn based on the original reverse engineering by @mikey0000. Their
`agora_sdp.py` never parses `a=rtcp-fb`, so every codec it reports to the
gateway claims to support no feedback at all -- no NACK, no PLI, no REMB. That
is fixed here: feedback is parsed and attached, including the `*` wildcard
form, so the gateway knows it can be asked for a keyframe.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from .errors import AgoraSdpError

# Attributes that are a bare direction with no value.
_DIRECTIONS = frozenset({"sendrecv", "sendonly", "recvonly", "inactive"})

# Attributes copied straight onto the current scope under a camelCase name.
_SCALAR_ATTRIBUTES = {
    "ice-ufrag": "iceUfrag",
    "ice-pwd": "icePwd",
    "ice-options": "iceOptions",
    "setup": "setup",
    "mid": "mid",
}


@dataclass(slots=True)
class OfferInfo:
    """The parts of the browser offer needed to build a matching answer."""

    parsed: dict[str, Any]
    ice_ufrag: str
    ice_pwd: str
    bundle_mids: str
    extmap_allow_mixed: bool
    audio_extensions: list[dict[str, Any]] = field(default_factory=list)
    video_extensions: list[dict[str, Any]] = field(default_factory=list)

    @property
    def media(self) -> list[dict[str, Any]]:
        """Media sections, in offer order -- the answer must match it."""
        media: list[dict[str, Any]] = self.parsed.get("media", [])
        return media


def parse_sdp(sdp: str) -> dict[str, Any]:
    """Parse an SDP blob into a nested dict.

    Only the subset WebRTC actually uses is understood; unknown lines are
    ignored rather than rejected, because browsers add new ones freely and an
    unrecognised attribute is never a reason to fail a negotiation.
    """
    session: dict[str, Any] = {"media": []}
    scope: dict[str, Any] = session

    for raw_line in sdp.splitlines():
        line = raw_line.strip()
        if len(line) < 2 or line[1] != "=":
            continue

        kind, value = line[0], line[2:]

        if kind == "m":
            scope = _new_media_section(session, value)
        elif kind == "a":
            _parse_attribute(scope, session, value)
        elif kind == "v":
            session["version"] = value
        elif kind == "s":
            session["name"] = value
        elif kind == "o":
            _parse_origin(session, value)

    return session


def _parse_origin(session: dict[str, Any], value: str) -> None:
    """Parse the `o=` line."""
    parts = value.split()
    if len(parts) >= 6:
        session["origin"] = {
            "username": parts[0],
            "sessionId": parts[1],
            "sessionVersion": parts[2],
            "netType": parts[3],
            "ipVer": parts[4],
            "address": parts[5],
        }


def _new_media_section(session: dict[str, Any], value: str) -> dict[str, Any]:
    """Start a new `m=` section and make it the current scope."""
    parts = value.split()
    if len(parts) < 3:
        raise AgoraSdpError(f"Malformed media line: m={value}")

    try:
        port = int(parts[1])
    except ValueError as err:
        raise AgoraSdpError(f"Malformed media port: m={value}") from err

    media: dict[str, Any] = {
        "type": parts[0],
        "port": port,
        "protocol": parts[2],
        "payloads": " ".join(parts[3:]),
        "rtp": [],
        "fmtp": [],
        "rtcpFb": [],
        "ext": [],
        "fingerprints": [],
    }
    session["media"].append(media)
    return media


def _parse_attribute(
    scope: dict[str, Any],
    session: dict[str, Any],
    value: str,
) -> None:
    """Parse one `a=` line into the current scope."""
    name, _, rest = value.partition(":")
    payload = rest if _ else None

    if name in _DIRECTIONS:
        scope["direction"] = name
        return

    if name == "extmap-allow-mixed":
        session["extmapAllowMixed"] = True
        return

    if name == "rtcp-mux":
        scope["rtcpMux"] = True
        return

    if name in _SCALAR_ATTRIBUTES and payload is not None:
        scope[_SCALAR_ATTRIBUTES[name]] = payload
        return

    if payload is None:
        return

    if name == "fingerprint":
        _parse_fingerprint(scope, payload)
    elif name == "rtpmap":
        _parse_rtpmap(scope, payload)
    elif name == "fmtp":
        _parse_fmtp(scope, payload)
    elif name == "rtcp-fb":
        _parse_rtcp_fb(scope, payload)
    elif name == "extmap":
        _parse_extmap(scope, payload)
    elif name == "group":
        parts = payload.split()
        if parts:
            session.setdefault("groups", []).append(
                {"type": parts[0], "mids": " ".join(parts[1:])}
            )
    elif name == "msid-semantic":
        parts = payload.split()
        if parts:
            session["msidSemantic"] = {
                "semantic": parts[0],
                "token": parts[1] if len(parts) > 1 else "",
            }


def _parse_fingerprint(scope: dict[str, Any], payload: str) -> None:
    """Parse `a=fingerprint:<hash> <value>`."""
    parts = payload.split()
    if len(parts) >= 2:
        fingerprint = {"hash": parts[0], "fingerprint": parts[1]}
        scope.setdefault("fingerprints", []).append(fingerprint)
        scope["fingerprint"] = fingerprint


def _parse_rtpmap(scope: dict[str, Any], payload: str) -> None:
    """Parse `a=rtpmap:<pt> <codec>/<rate>[/<encoding>]`."""
    parts = payload.split(None, 1)
    if len(parts) < 2:
        return

    try:
        payload_type = int(parts[0])
    except ValueError:
        return

    fields = parts[1].split("/")
    scope.setdefault("rtp", []).append(
        {
            "payload": payload_type,
            "codec": fields[0],
            "rate": int(fields[1]) if len(fields) > 1 and fields[1].isdigit() else 90000,
            "encoding": fields[2] if len(fields) > 2 else None,
        }
    )


def _parse_fmtp(scope: dict[str, Any], payload: str) -> None:
    """Parse `a=fmtp:<pt> <config>`."""
    parts = payload.split(None, 1)
    if not parts:
        return

    try:
        payload_type = int(parts[0])
    except ValueError:
        return

    scope.setdefault("fmtp", []).append(
        {"payload": payload_type, "config": parts[1] if len(parts) > 1 else ""}
    )


def _parse_rtcp_fb(scope: dict[str, Any], payload: str) -> None:
    """Parse `a=rtcp-fb:<pt|*> <type> [subtype]`.

    The wildcard payload type is kept as the literal `"*"` so the ORTC
    conversion can fan it out across every codec in the section, which is what
    it means.
    """
    parts = payload.split()
    if len(parts) < 2:
        return

    payload_type: int | str
    if parts[0] == "*":
        payload_type = "*"
    else:
        try:
            payload_type = int(parts[0])
        except ValueError:
            return

    scope.setdefault("rtcpFb", []).append(
        {
            "payload": payload_type,
            "type": parts[1],
            "subtype": " ".join(parts[2:]) if len(parts) > 2 else None,
        }
    )


def _parse_extmap(scope: dict[str, Any], payload: str) -> None:
    """Parse `a=extmap:<id>[/<direction>] <uri>`."""
    parts = payload.split()
    if len(parts) < 2:
        return

    try:
        entry = int(parts[0].split("/", 1)[0])
    except ValueError:
        return

    scope.setdefault("ext", []).append({"value": entry, "uri": parts[1]})


def _empty_capabilities() -> dict[str, list[dict[str, Any]]]:
    """Return an empty ORTC capability block."""
    return {
        "audioCodecs": [],
        "audioExtensions": [],
        "videoCodecs": [],
        "videoExtensions": [],
    }


def _codec_from_rtpmap(
    rtp: dict[str, Any],
    media: dict[str, Any],
) -> dict[str, Any]:
    """Build one ORTC codec entry, with its feedback and fmtp attached."""
    payload_type = rtp["payload"]

    feedbacks = [
        {"type": feedback["type"], "parameter": feedback["subtype"]}
        for feedback in media.get("rtcpFb", [])
        if feedback["payload"] in (payload_type, "*")
    ]

    parameters: dict[str, str] = {}
    for fmtp in media.get("fmtp", []):
        if fmtp["payload"] != payload_type:
            continue
        for part in str(fmtp.get("config", "")).split(";"):
            key, sep, value = part.partition("=")
            if sep:
                parameters[key.strip()] = value.strip()

    return {
        "payloadType": payload_type,
        "rtpMap": {
            "encodingName": rtp["codec"],
            "clockRate": rtp["rate"],
            "encodingParameters": rtp["encoding"],
        },
        "rtcpFeedbacks": feedbacks,
        "fmtp": {"parameters": parameters},
    }


def _transport_parameters(session: dict[str, Any]) -> tuple[dict[str, Any], dict[str, Any]]:
    """Pull ICE and DTLS parameters from wherever the browser put them."""
    ice: dict[str, Any] = {}
    dtls: dict[str, Any] = {}

    # With BUNDLE these live on the first media section, but the session level
    # is legal too, so check both rather than assuming.
    for scope in [*session.get("media", []), session]:
        if not ice and scope.get("iceUfrag"):
            ice = {"iceUfrag": scope.get("iceUfrag"), "icePwd": scope.get("icePwd")}
        if not dtls and scope.get("fingerprints"):
            dtls = {
                "fingerprints": [
                    {
                        "hashFunction": fingerprint["hash"],
                        "fingerprint": fingerprint["fingerprint"],
                    }
                    for fingerprint in scope["fingerprints"]
                ]
            }

    # We always answer `a=setup:active` on the gateway's behalf, so our own
    # DTLS role is the client.
    dtls["role"] = "client"
    return ice, dtls


def offer_to_ortc(session: dict[str, Any]) -> dict[str, Any]:
    """Convert a parsed offer into the ORTC object the join message carries."""
    ice, dtls = _transport_parameters(session)
    if not ice.get("iceUfrag") or not ice.get("icePwd"):
        raise AgoraSdpError("Offer carries no ICE credentials")
    if not dtls.get("fingerprints"):
        raise AgoraSdpError("Offer carries no DTLS fingerprint")

    send = _empty_capabilities()
    recv = _empty_capabilities()

    for media in session.get("media", []):
        media_type = media.get("type")
        if media_type not in ("audio", "video"):
            continue

        codecs = [_codec_from_rtpmap(rtp, media) for rtp in media.get("rtp", [])]
        extensions = [
            {"entry": extension["value"], "extensionName": extension["uri"]}
            for extension in media.get("ext", [])
        ]

        direction = media.get("direction", "sendrecv")
        if direction == "sendonly":
            targets = [send]
        elif direction == "recvonly":
            targets = [recv]
        elif direction == "inactive":
            targets = []
        else:
            targets = [send, recv]

        for target in targets:
            target[f"{media_type}Codecs"].extend(codecs)
            target[f"{media_type}Extensions"].extend(extensions)

    return {
        "iceParameters": ice,
        "dtlsParameters": dtls,
        "rtpCapabilities": {"send": send, "recv": recv},
        "version": "2",
    }


def parse_offer(offer_sdp: str) -> OfferInfo:
    """Parse a browser offer into the curated view the answer builder needs."""
    session = parse_sdp(offer_sdp)

    media_sections = session.get("media", [])
    if not media_sections:
        raise AgoraSdpError("Offer contains no media sections")

    ice, _ = _transport_parameters(session)
    ice_ufrag = ice.get("iceUfrag") or ""
    ice_pwd = ice.get("icePwd") or ""

    audio_extensions: list[dict[str, Any]] = []
    video_extensions: list[dict[str, Any]] = []
    for media in media_sections:
        target = (
            audio_extensions
            if media.get("type") == "audio"
            else video_extensions
            if media.get("type") == "video"
            else None
        )
        if target is None:
            continue
        target.extend(
            {"entry": extension["value"], "extensionName": extension["uri"]}
            for extension in media.get("ext", [])
        )

    groups = session.get("groups", [])
    bundle_mids = next(
        (group["mids"] for group in groups if group.get("type") == "BUNDLE"),
        " ".join(str(media.get("mid", index)) for index, media in enumerate(media_sections)),
    )

    return OfferInfo(
        parsed=session,
        ice_ufrag=ice_ufrag,
        ice_pwd=ice_pwd,
        bundle_mids=bundle_mids,
        extmap_allow_mixed=bool(session.get("extmapAllowMixed")),
        audio_extensions=audio_extensions,
        video_extensions=video_extensions,
    )
