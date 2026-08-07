"""Building the browser's answer SDP from Agora's ORTC join response.

The gateway replies to `join_v3` with ORTC parameters, not SDP, so the answer
the browser needs has to be assembled here. Two rules drive the shape of it:

* The gateway is an **ICE-lite** agent, so the answer says so. That hands the
  ICE-controlling role to the browser, which is the full agent -- without it
  both ends would try to control and the role-conflict dance would add a
  round trip at best.
* The answer says `a=setup:active`, making the gateway the DTLS client. The
  browser offers `actpass` and becomes the DTLS server.

Adapted from `Jezza34000/homeassistant_petkit` (MIT), whose Agora client is in
turn based on the original reverse engineering by @mikey0000.
"""

from __future__ import annotations

import secrets
from dataclasses import dataclass
from typing import Any

from .errors import AgoraSdpError
from .sdp import OfferInfo


@dataclass(slots=True, frozen=True)
class RemoteVideoStream:
    """A video stream the gateway has announced on the channel."""

    uid: int
    ssrc: int
    rtx_ssrc: int | None = None
    cname: str | None = None


def _select_capabilities(ortc: dict[str, Any]) -> dict[str, Any]:
    """Pick the capability block describing what the gateway will send us.

    Which key the gateway actually populates has not been observed on a live
    join, so this keeps the reference implementation's preference order rather
    than reasoning about whose perspective `send` and `recv` are named from.
    """
    capabilities = ortc.get("rtpCapabilities", {})
    for key in ("sendrecv", "recv", "send"):
        block = capabilities.get(key)
        if block:
            selected: dict[str, Any] = block
            return selected
    fallback: dict[str, Any] = capabilities
    return fallback


def _fingerprint_line(dtls_parameters: dict[str, Any]) -> str:
    """Return the `a=fingerprint:` value advertised by the gateway."""
    for entry in dtls_parameters.get("fingerprints", []):
        value = entry.get("fingerprint")
        if not value:
            continue
        algorithm = entry.get("hashFunction") or entry.get("algorithm") or "sha-256"
        return f"{algorithm} {value}"

    raise AgoraSdpError("Gateway response carries no DTLS fingerprint")


def _candidate_lines(candidates: list[dict[str, Any]]) -> list[str]:
    """Translate the gateway's ORTC candidates into `a=candidate:` lines."""
    lines: list[str] = []
    for index, candidate in enumerate(candidates):
        address = candidate.get("ip") or candidate.get("address")
        port = candidate.get("port")
        if not address or not port:
            continue

        lines.append(
            "a=candidate:"
            f"{candidate.get('foundation', f'agora{index}')} 1 "
            f"{candidate.get('protocol', 'udp')} "
            f"{candidate.get('priority', 2103266323)} "
            f"{address} {port} typ {candidate.get('type', 'host')}"
        )
    return lines


def _answer_direction(offer_direction: str) -> str:
    """Mirror the offered direction back at the offerer."""
    return {
        "sendonly": "recvonly",
        "recvonly": "sendonly",
        "sendrecv": "sendrecv",
    }.get(offer_direction, "inactive")


def _codec_lines(codecs: list[dict[str, Any]]) -> list[str]:
    """Emit rtpmap / rtcp-fb / fmtp for one media section."""
    lines: list[str] = []
    for codec in codecs:
        payload_type = codec.get("payloadType")
        rtp_map = codec.get("rtpMap", {})
        name = rtp_map.get("encodingName", "")
        clock_rate = rtp_map.get("clockRate", 90000)
        encoding = rtp_map.get("encodingParameters")

        suffix = f"/{encoding}" if encoding else ""
        lines.append(f"a=rtpmap:{payload_type} {name}/{clock_rate}{suffix}")

        for feedback in codec.get("rtcpFeedbacks", []):
            parameter = feedback.get("parameter")
            tail = f" {parameter}" if parameter else ""
            lines.append(f"a=rtcp-fb:{payload_type} {feedback.get('type')}{tail}")

        parameters = (codec.get("fmtp") or {}).get("parameters") or {}
        if parameters:
            config = ";".join(f"{key}={value}" for key, value in parameters.items())
            lines.append(f"a=fmtp:{payload_type} {config}")

    return lines


def _extension_lines(
    offered: list[dict[str, Any]],
    accepted: list[dict[str, Any]],
) -> list[str]:
    """Emit extmap lines for extensions both sides agreed on.

    The IDs must be the browser's, not the gateway's -- the offerer owns the
    extension numbering and the answer has to reuse it.
    """
    offered_ids = {
        extension.get("extensionName"): extension.get("entry") for extension in offered
    }
    return [
        f"a=extmap:{offered_ids[name]} {name}"
        for extension in accepted
        if (name := extension.get("extensionName")) in offered_ids
    ]


def _ssrc_lines(stream: RemoteVideoStream | None) -> list[str]:
    """Declare the remote video SSRC in the answer.

    This has to be in the FIRST answer. Home Assistant's WebRTC signalling
    channel carries an offer, an answer, and candidates -- there is no
    renegotiation verb -- so an SSRC learned later can never be delivered, and
    a browser that never sees one may never render the track.
    """
    if stream is None:
        return []

    cname = stream.cname or "agora"
    lines = [
        "a=msid:agora agora-video",
        f"a=ssrc:{stream.ssrc} cname:{cname}",
        f"a=ssrc:{stream.ssrc} msid:agora agora-video",
        f"a=ssrc:{stream.ssrc} mslabel:agora",
        f"a=ssrc:{stream.ssrc} label:agora-video",
    ]
    if stream.rtx_ssrc is not None:
        lines.append(f"a=ssrc-group:FID {stream.ssrc} {stream.rtx_ssrc}")
        lines.append(f"a=ssrc:{stream.rtx_ssrc} cname:{cname}")
    return lines


def _media_section(
    media: dict[str, Any],
    index: int,
    *,
    capabilities: dict[str, Any],
    offer_info: OfferInfo,
    ice_ufrag: str,
    ice_pwd: str,
    fingerprint: str,
    candidate_lines: list[str],
    video_stream: RemoteVideoStream | None,
) -> list[str]:
    """Build the answer lines for one `m=` section."""
    media_type = str(media.get("type", "video"))
    codecs: list[dict[str, Any]] = capabilities.get(f"{media_type}Codecs") or []
    accepted_extensions: list[dict[str, Any]] = (
        capabilities.get(f"{media_type}Extensions") or []
    )
    offered_extensions = (
        offer_info.audio_extensions
        if media_type == "audio"
        else offer_info.video_extensions
    )

    direction = _answer_direction(str(media.get("direction", "sendrecv")))
    payload_types = [str(codec.get("payloadType")) for codec in codecs]
    if not payload_types:
        # The gateway offered nothing for this media type. Reject the section
        # by echoing the offered payloads and marking it inactive: an m-line
        # with an empty payload list is not valid SDP and would be discarded
        # wholesale, taking the sections after it with it.
        payload_types = str(media.get("payloads", "")).split()
        direction = "inactive"

    mid = str(media.get("mid", index))

    lines = [
        f"m={media_type} 9 UDP/TLS/RTP/SAVPF {' '.join(payload_types)}",
        "c=IN IP4 127.0.0.1",
        "a=rtcp:9 IN IP4 0.0.0.0",
        f"a=ice-ufrag:{ice_ufrag}",
        f"a=ice-pwd:{ice_pwd}",
        "a=ice-options:trickle",
        f"a=fingerprint:{fingerprint}",
        "a=setup:active",
        f"a=mid:{mid}",
    ]
    lines.extend(candidate_lines)
    lines.extend(_extension_lines(offered_extensions, accepted_extensions))
    lines.extend([f"a={direction}", "a=rtcp-mux", "a=rtcp-rsize"])
    lines.extend(_codec_lines(codecs))

    if media_type == "video" and direction != "inactive":
        lines.extend(_ssrc_lines(video_stream))

    return lines


def build_answer_sdp(
    ortc: dict[str, Any],
    offer_info: OfferInfo,
    video_stream: RemoteVideoStream | None = None,
) -> str:
    """Assemble the answer SDP for the browser.

    Raises `AgoraSdpError` if the gateway's response is missing anything the
    answer cannot be built without.
    """
    ice_parameters = ortc.get("iceParameters", {})
    capabilities = _select_capabilities(ortc)
    fingerprint = _fingerprint_line(ortc.get("dtlsParameters", {}))

    # An ICE-lite agent still needs credentials for the browser's connectivity
    # checks; inventing them beats emitting an unusable answer.
    ice_ufrag = ice_parameters.get("iceUfrag") or secrets.token_hex(4)
    ice_pwd = ice_parameters.get("icePwd") or secrets.token_hex(16)

    media_sections = offer_info.media
    if not media_sections:
        raise AgoraSdpError("Offer contains no media sections to answer")

    # Session-level lines, in the order the SDK's own answer template emits
    # them (`updateRemoteRTPCapabilities`). Attribute order is not significant
    # to a parser, but matching the reference implementation byte for byte
    # removes it as a variable if a browser ever refuses the answer.
    lines = [
        "v=0",
        "o=- 0 0 IN IP4 127.0.0.1",
        "s=AgoraGateway",
        "t=0 0",
        f"a=group:BUNDLE {offer_info.bundle_mids}",
        "a=msid-semantic: WMS",
        "a=ice-lite",
    ]
    if offer_info.extmap_allow_mixed:
        lines.append("a=extmap-allow-mixed")

    candidate_lines = _candidate_lines(ice_parameters.get("candidates") or [])

    for index, media in enumerate(media_sections):
        lines.extend(
            _media_section(
                media,
                index,
                capabilities=capabilities,
                offer_info=offer_info,
                ice_ufrag=ice_ufrag,
                ice_pwd=ice_pwd,
                fingerprint=fingerprint,
                candidate_lines=candidate_lines,
                video_stream=video_stream,
            )
        )

    return "\r\n".join(lines) + "\r\n"
