"""Tests for the Agora signalling client.

The two things worth pinning down here are the pieces that fail silently in
production: the RSA-OAEP key wrap (a wrong one is only ever reported as an
opaque gateway error code) and the SDP -> ORTC conversion (a dropped codec
feature just means the video never starts).
"""

from __future__ import annotations

import base64
import logging
from typing import Any
from unittest.mock import MagicMock

import pytest
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import padding, rsa

from custom_components.anycubic_cloud.agora import (
    AgoraError,
    AgoraResponse,
    AgoraStreamSession,
    EdgeAddress,
    RemoteVideoStream,
)
from custom_components.anycubic_cloud.agora.answer import build_answer_sdp
from custom_components.anycubic_cloud.agora.encryption import (
    _agora_public_key,
    validate_kdf_salt,
    wrap_channel_key,
)
from custom_components.anycubic_cloud.agora.sdp import offer_to_ortc, parse_offer, parse_sdp

LOGGER = logging.getLogger(__name__)

# A Chrome offer of the shape Home Assistant's WebRTC camera sends: recvonly
# video with H.264 plus its RTX, recvonly Opus audio, BUNDLE across both.
CHROME_OFFER = "\r\n".join(
    [
        "v=0",
        "o=- 4611731400430051336 2 IN IP4 127.0.0.1",
        "s=-",
        "t=0 0",
        "a=group:BUNDLE 0 1",
        "a=extmap-allow-mixed",
        "a=msid-semantic: WMS",
        "m=video 9 UDP/TLS/RTP/SAVPF 96 97 102 103",
        "c=IN IP4 0.0.0.0",
        "a=rtcp:9 IN IP4 0.0.0.0",
        "a=ice-ufrag:F7gI",
        "a=ice-pwd:x+xNhQ8Q9k1Cp0kFqPXpMlSw",
        "a=ice-options:trickle",
        "a=fingerprint:sha-256 D2:FA:0E:C3:22:59:5E:14:95:69:92:3D:13:B4:84:24"
        ":2C:C2:A2:C0:3E:FD:34:8E:5F:C2:BE:B9:36:97:B0:B4",
        "a=setup:actpass",
        "a=mid:0",
        "a=extmap:1 urn:ietf:params:rtp-hdrext:toffset",
        "a=extmap:2 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time",
        "a=extmap:3 urn:3gpp:video-orientation",
        "a=extmap:4 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01",
        "a=recvonly",
        "a=rtcp-mux",
        "a=rtcp-rsize",
        "a=rtpmap:96 H264/90000",
        "a=rtcp-fb:96 goog-remb",
        "a=rtcp-fb:96 transport-cc",
        "a=rtcp-fb:96 ccm fir",
        "a=rtcp-fb:96 nack",
        "a=rtcp-fb:96 nack pli",
        "a=fmtp:96 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f",
        "a=rtpmap:97 rtx/90000",
        "a=fmtp:97 apt=96",
        "a=rtpmap:102 H264/90000",
        "a=fmtp:102 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42e01f",
        "a=rtpmap:103 rtx/90000",
        "a=fmtp:103 apt=102",
        "m=audio 9 UDP/TLS/RTP/SAVPF 111",
        "c=IN IP4 0.0.0.0",
        "a=rtcp:9 IN IP4 0.0.0.0",
        "a=ice-ufrag:F7gI",
        "a=ice-pwd:x+xNhQ8Q9k1Cp0kFqPXpMlSw",
        "a=ice-options:trickle",
        "a=fingerprint:sha-256 D2:FA:0E:C3:22:59:5E:14:95:69:92:3D:13:B4:84:24"
        ":2C:C2:A2:C0:3E:FD:34:8E:5F:C2:BE:B9:36:97:B0:B4",
        "a=setup:actpass",
        "a=mid:1",
        "a=extmap:14 urn:ietf:params:rtp-hdrext:ssrc-audio-level",
        "a=recvonly",
        "a=rtcp-mux",
        "a=rtpmap:111 opus/48000/2",
        "a=rtcp-fb:111 transport-cc",
        "a=fmtp:111 minptime=10;useinbandfec=1",
        "",
    ]
)

GATEWAY_FINGERPRINT = "35:28:40:20:80:F6:E0:11:E4:40:42:E8:7C:55:D4:34:18:F4:35:04:F3:3F:1A:EB:66:7A:13:85:6A:33:D2:6B"


def _gateway_ortc() -> dict[str, Any]:
    """A join reply shaped like the gateway's, offering H.264 back to us."""
    return {
        "iceParameters": {
            "iceUfrag": "agoraUF",
            "icePwd": "agoraPWDagoraPWDagoraPWD",
            "candidates": [
                {
                    "foundation": "1",
                    "protocol": "udp",
                    "priority": 2130706431,
                    "ip": "98.98.143.194",
                    "port": 4701,
                    "type": "host",
                }
            ],
        },
        "dtlsParameters": {
            "fingerprints": [{"hashFunction": "sha-256", "fingerprint": GATEWAY_FINGERPRINT}],
            "role": "server",
        },
        "rtpCapabilities": {
            "sendrecv": {
                "videoCodecs": [
                    {
                        "payloadType": 96,
                        "rtpMap": {
                            "encodingName": "H264",
                            "clockRate": 90000,
                            "encodingParameters": None,
                        },
                        "rtcpFeedbacks": [
                            {"type": "nack", "parameter": None},
                            {"type": "nack", "parameter": "pli"},
                            {"type": "goog-remb", "parameter": None},
                        ],
                        "fmtp": {
                            "parameters": {
                                "packetization-mode": "1",
                                "profile-level-id": "42e01f",
                            }
                        },
                    },
                    {
                        "payloadType": 97,
                        "rtpMap": {
                            "encodingName": "rtx",
                            "clockRate": 90000,
                            "encodingParameters": None,
                        },
                        "rtcpFeedbacks": [],
                        "fmtp": {"parameters": {"apt": "96"}},
                    },
                ],
                "videoExtensions": [
                    {
                        "entry": 2,
                        "extensionName": ("http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time"),
                    },
                    {"entry": 9, "extensionName": "urn:not:offered:by:the:browser"},
                ],
                "audioCodecs": [],
                "audioExtensions": [],
            }
        },
    }


# --- RSA-OAEP key wrapping --------------------------------------------------


def test_wrap_channel_key_uses_the_real_agora_key() -> None:
    """The bundled key is loadable and produces a full-width block."""
    wrapped = wrap_channel_key("a1b2c3d4e5f60718293a4b5c6d7e8f90")
    raw = base64.b64decode(wrapped, validate=True)

    # 1024-bit key, so RSA output is exactly 128 bytes every time.
    assert _agora_public_key().key_size == 1024
    assert len(raw) == 128


def test_wrap_channel_key_is_randomised() -> None:
    """OAEP is randomised, so the same key never wraps to the same bytes."""
    key = "a1b2c3d4e5f60718293a4b5c6d7e8f90"
    assert wrap_channel_key(key) != wrap_channel_key(key)


def test_wrap_channel_key_sends_the_raw_string_not_decoded_hex(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """The plaintext is the 32 ASCII characters, not the 16 bytes they spell.

    This is the single easiest thing to get wrong: the key looks like hex and
    decoding it produces a wrap the gateway rejects as ILLEGAL_AES_PASSWORD.
    """
    private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    monkeypatch.setattr(
        "custom_components.anycubic_cloud.agora.encryption._agora_public_key",
        lambda: private_key.public_key(),
    )

    key = "a1b2c3d4e5f60718293a4b5c6d7e8f90"
    plaintext = private_key.decrypt(
        base64.b64decode(wrap_channel_key(key)),
        padding.OAEP(
            mgf=padding.MGF1(algorithm=hashes.SHA256()),
            algorithm=hashes.SHA256(),
            label=None,
        ),
    )

    assert plaintext == key.encode("utf-8")
    assert len(plaintext) == 32
    assert plaintext != bytes.fromhex(key)


def test_wrap_channel_key_rejects_empty_and_oversized() -> None:
    """A key we cannot wrap fails here, not as a mystery gateway error."""
    with pytest.raises(AgoraError):
        wrap_channel_key("")
    with pytest.raises(AgoraError):
        wrap_channel_key("x" * 200)


def test_validate_kdf_salt_passes_the_base64_through_unchanged() -> None:
    """The salt is a passthrough; re-encoding it would be a chance to break it."""
    salt = base64.b64encode(bytes(range(32))).decode("ascii")
    assert validate_kdf_salt(salt) is salt


@pytest.mark.parametrize(
    "salt",
    [
        base64.b64encode(b"too short").decode("ascii"),
        base64.b64encode(bytes(64)).decode("ascii"),
        "not base64 at all!!",
    ],
)
def test_validate_kdf_salt_rejects_wrong_shapes(salt: str) -> None:
    """Only exactly 32 decoded bytes are acceptable."""
    with pytest.raises(AgoraError):
        validate_kdf_salt(salt)


# --- SDP parsing and the ORTC conversion ------------------------------------


def test_parse_sdp_reads_media_and_transport() -> None:
    """The parser understands the offer's structure."""
    parsed = parse_sdp(CHROME_OFFER)

    assert [media["type"] for media in parsed["media"]] == ["video", "audio"]
    assert parsed["extmapAllowMixed"] is True
    assert parsed["groups"] == [{"type": "BUNDLE", "mids": "0 1"}]

    video = parsed["media"][0]
    assert video["mid"] == "0"
    assert video["direction"] == "recvonly"
    assert video["setup"] == "actpass"
    assert video["iceUfrag"] == "F7gI"
    assert video["rtcpMux"] is True
    assert video["fingerprints"][0]["hash"] == "sha-256"


def test_parse_sdp_reads_rtcp_feedback() -> None:
    """`a=rtcp-fb` is parsed -- the reference implementation never did."""
    video = parse_sdp(CHROME_OFFER)["media"][0]

    assert {(feedback["type"], feedback["subtype"]) for feedback in video["rtcpFb"]} == {
        ("goog-remb", None),
        ("transport-cc", None),
        ("ccm", "fir"),
        ("nack", None),
        ("nack", "pli"),
    }
    assert all(feedback["payload"] == 96 for feedback in video["rtcpFb"])


def test_parse_sdp_reads_opus_encoding_parameters() -> None:
    """`opus/48000/2` keeps its channel count."""
    audio = parse_sdp(CHROME_OFFER)["media"][1]
    opus = next(rtp for rtp in audio["rtp"] if rtp["payload"] == 111)

    assert opus["codec"] == "opus"
    assert opus["rate"] == 48000
    assert opus["encoding"] == "2"


def test_offer_to_ortc_puts_recvonly_media_in_the_recv_half() -> None:
    """A recvonly offer describes what we can receive, not send."""
    ortc = offer_to_ortc(parse_sdp(CHROME_OFFER))

    assert ortc["version"] == "2"
    assert ortc["iceParameters"] == {
        "iceUfrag": "F7gI",
        "icePwd": "x+xNhQ8Q9k1Cp0kFqPXpMlSw",
    }
    assert ortc["dtlsParameters"]["role"] == "client"
    assert ortc["dtlsParameters"]["fingerprints"][0]["hashFunction"] == "sha-256"

    recv = ortc["rtpCapabilities"]["recv"]
    send = ortc["rtpCapabilities"]["send"]
    assert [codec["payloadType"] for codec in recv["videoCodecs"]] == [96, 97, 102, 103]
    assert [codec["payloadType"] for codec in recv["audioCodecs"]] == [111]
    assert send["videoCodecs"] == []
    assert send["audioCodecs"] == []


def test_offer_to_ortc_carries_rtcp_feedback_onto_codecs() -> None:
    """The fix that matters: codecs reach Agora with their feedback attached.

    Without NACK and PLI the gateway has no way to be asked for a keyframe,
    so a stream that loses a packet never recovers.
    """
    ortc = offer_to_ortc(parse_sdp(CHROME_OFFER))
    h264 = next(codec for codec in ortc["rtpCapabilities"]["recv"]["videoCodecs"] if codec["payloadType"] == 96)

    assert {(feedback["type"], feedback["parameter"]) for feedback in h264["rtcpFeedbacks"]} == {
        ("goog-remb", None),
        ("transport-cc", None),
        ("ccm", "fir"),
        ("nack", None),
        ("nack", "pli"),
    }

    # And the rtx codec, which was offered no feedback, still has none.
    rtx = next(codec for codec in ortc["rtpCapabilities"]["recv"]["videoCodecs"] if codec["payloadType"] == 97)
    assert rtx["rtcpFeedbacks"] == []


def test_offer_to_ortc_parses_fmtp_and_extensions() -> None:
    """H.264's profile survives the conversion, as do header extensions."""
    ortc = offer_to_ortc(parse_sdp(CHROME_OFFER))
    recv = ortc["rtpCapabilities"]["recv"]
    h264 = next(codec for codec in recv["videoCodecs"] if codec["payloadType"] == 96)

    assert h264["fmtp"]["parameters"] == {
        "level-asymmetry-allowed": "1",
        "packetization-mode": "1",
        "profile-level-id": "42e01f",
    }
    assert h264["rtpMap"] == {
        "encodingName": "H264",
        "clockRate": 90000,
        "encodingParameters": None,
    }
    assert {extension["extensionName"] for extension in recv["videoExtensions"]} == {
        "urn:ietf:params:rtp-hdrext:toffset",
        "http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time",
        "urn:3gpp:video-orientation",
        "http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01",
    }


def test_rtcp_feedback_wildcard_applies_to_every_codec() -> None:
    """`a=rtcp-fb:* nack` means all payload types in the section."""
    sdp = "\r\n".join(
        [
            "v=0",
            "o=- 1 2 IN IP4 127.0.0.1",
            "s=-",
            "t=0 0",
            "m=video 9 UDP/TLS/RTP/SAVPF 96 98",
            "a=ice-ufrag:abcd",
            "a=ice-pwd:efghefghefghefghefgh",
            "a=fingerprint:sha-256 " + GATEWAY_FINGERPRINT,
            "a=recvonly",
            "a=rtpmap:96 H264/90000",
            "a=rtpmap:98 VP8/90000",
            "a=rtcp-fb:* nack",
            "",
        ]
    )
    codecs = offer_to_ortc(parse_sdp(sdp))["rtpCapabilities"]["recv"]["videoCodecs"]

    assert [codec["payloadType"] for codec in codecs] == [96, 98]
    assert all(codec["rtcpFeedbacks"] == [{"type": "nack", "parameter": None}] for codec in codecs)


def test_offer_without_ice_credentials_is_rejected() -> None:
    """A malformed offer fails loudly rather than producing a dead answer."""
    sdp = "\r\n".join(["v=0", "o=- 1 2 IN IP4 127.0.0.1", "s=-", "t=0 0", "m=video 9 RTP/AVP 96", ""])
    with pytest.raises(AgoraError):
        offer_to_ortc(parse_sdp(sdp))


# --- answer generation ------------------------------------------------------


def test_answer_declares_the_ssrc_in_the_first_answer() -> None:
    """The SSRC must be present immediately; there is no renegotiation."""
    answer = build_answer_sdp(
        _gateway_ortc(),
        parse_offer(CHROME_OFFER),
        RemoteVideoStream(uid=71431, ssrc=1234567, rtx_ssrc=7654321, cname="agora-cn"),
    )

    assert "a=ssrc:1234567 cname:agora-cn" in answer
    assert "a=ssrc:1234567 msid:agora agora-video" in answer
    assert "a=ssrc-group:FID 1234567 7654321" in answer
    assert "a=ssrc:7654321 cname:agora-cn" in answer


def test_answer_is_ice_lite_and_dtls_active() -> None:
    """ICE-lite hands the controlling role to the browser; active = DTLS client."""
    answer = build_answer_sdp(_gateway_ortc(), parse_offer(CHROME_OFFER))

    assert "\r\na=ice-lite\r\n" in answer
    assert answer.startswith("v=0\r\n")
    assert answer.endswith("\r\n")
    assert answer.count("a=setup:active") == 2
    assert "a=group:BUNDLE 0 1" in answer
    assert "a=extmap-allow-mixed" in answer
    assert f"a=fingerprint:sha-256 {GATEWAY_FINGERPRINT}" in answer
    assert "a=candidate:1 1 udp 2130706431 98.98.143.194 4701 typ host" in answer


def test_answer_mirrors_direction_and_mids() -> None:
    """A recvonly offer is answered sendonly, section for section."""
    answer = build_answer_sdp(
        _gateway_ortc(),
        parse_offer(CHROME_OFFER),
        RemoteVideoStream(uid=71431, ssrc=42),
    )
    video, audio = answer.split("m=audio")[0], "m=audio" + answer.split("m=audio")[1]

    assert "a=mid:0" in video
    assert "a=sendonly" in video
    assert "a=rtpmap:96 H264/90000" in video
    assert "a=rtcp-fb:96 nack pli" in video
    assert "a=fmtp:96 packetization-mode=1;profile-level-id=42e01f" in video

    # The gateway offered no audio, so that section is answered inactive
    # rather than emitted with an empty payload list, which is invalid SDP.
    assert "a=mid:1" in audio
    assert "a=inactive" in audio
    assert audio.startswith("m=audio 9 UDP/TLS/RTP/SAVPF 111")


def test_answer_only_advertises_extensions_the_browser_offered() -> None:
    """Extension IDs come from the offer; unoffered ones are dropped."""
    answer = build_answer_sdp(_gateway_ortc(), parse_offer(CHROME_OFFER))

    assert "a=extmap:2 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time" in answer
    assert "urn:not:offered:by:the:browser" not in answer


def test_answer_without_a_known_stream_omits_ssrc_lines() -> None:
    """No stream yet still yields valid SDP, just without an SSRC."""
    answer = build_answer_sdp(_gateway_ortc(), parse_offer(CHROME_OFFER))

    assert "a=ssrc:" not in answer
    assert "m=video" in answer


def test_answer_requires_a_gateway_fingerprint() -> None:
    """No DTLS fingerprint means no usable answer; say so."""
    ortc = _gateway_ortc()
    ortc["dtlsParameters"]["fingerprints"] = []

    with pytest.raises(AgoraError):
        build_answer_sdp(ortc, parse_offer(CHROME_OFFER))


# --- the join message -------------------------------------------------------


def _credentials(encrypted: bool = True) -> MagicMock:
    """Credentials shaped like the ones the Anycubic cloud issues."""
    credentials = MagicMock()
    credentials.appid = "6fc7f83702e44c67a0e1104933b01d4f"
    credentials.channel = "311f171de29b3b8c0f059b1ddd223215"
    credentials.rtc_token = "007eJxTYGA-not-a-real-token"
    credentials.client_uid = 139781340
    credentials.device_uid = 71431
    credentials.is_encrypted = encrypted
    credentials.encryption_key = "a1b2c3d4e5f60718293a4b5c6d7e8f90"
    credentials.encryption_kdf_salt = base64.b64encode(bytes(range(32))).decode("ascii")
    credentials.encryption_mode = "AES_256_GCM2"
    credentials.web_encryption_mode = "aes-256-gcm2"
    return credentials


def _join_body(encrypted: bool = True) -> dict[str, Any]:
    """Build a join_v3 body without touching the network."""
    session = AgoraStreamSession(MagicMock(), _credentials(encrypted), LOGGER)
    edge = EdgeAddress(ip="98.98.143.194", port=4701, ticket="edge-ticket")
    ap_response = AgoraResponse(
        code=0,
        uid=139781340,
        cid=3747140790,
        cname="311f171de29b3b8c0f059b1ddd223215",
        ticket="flag-ticket",
        flag=4096,
        opid=12345,
        server_ts=1,
        addresses=[edge],
    )
    message = session._build_join_message(
        session_id="session-1",
        ortc={"version": "2"},
        ap_response=ap_response,
        edge=edge,
    )

    assert message["_type"] == "join_v3"
    body: dict[str, Any] = message["_message"]
    return body


def test_join_message_carries_the_encryption_fields_under_their_wire_names() -> None:
    """`aes_mode` / `aes_secret` / `aes_encrypt` / `aes_salt`, not the SDK's own names.

    Internally the SDK holds these as `aesmode`, `aespassword` and `aessalt`;
    only the underscored spellings ever go on the wire. Sending the internal
    names means the gateway silently treats the channel as unencrypted and
    the media never decodes.
    """
    body = _join_body()

    assert body["aes_mode"] == "aes-256-gcm2"
    assert body["aes_encrypt"] is True
    assert len(base64.b64decode(body["aes_secret"], validate=True)) == 128
    assert body["aes_salt"] == base64.b64encode(bytes(range(32))).decode("ascii")

    for internal_name in ("aesmode", "aespassword", "aessalt"):
        assert internal_name not in body


def test_join_message_omits_encryption_when_the_channel_is_plain() -> None:
    """An unencrypted channel sends none of the aes fields at all."""
    body = _join_body(encrypted=False)

    assert not [key for key in body if key.startswith("aes")]


def test_join_message_shape() -> None:
    """The rest of join_v3, including the per-edge ticket substitution."""
    body = _join_body()

    assert body["app_id"] == "6fc7f83702e44c67a0e1104933b01d4f"
    assert body["channel_name"] == "311f171de29b3b8c0f059b1ddd223215"
    assert body["session_id"] == "session-1"
    assert body["sdk_version"] == "4.24.0"
    assert body["mode"] == "live"
    assert body["codec"] == "h264"
    assert body["role"] == "host"

    # The ticket comes from the edge being dialled, not the flag-level one.
    assert body["ap_response"]["ticket"] == "edge-ticket"
    assert body["ap_response"]["cert"] == "flag-ticket"
    assert "addresses" not in body["ap_response"]
