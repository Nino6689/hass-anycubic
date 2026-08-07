"""Tests for the Agora signalling client.

The two things worth pinning down here are the pieces that fail silently in
production: the RSA-OAEP key wrap (a wrong one is only ever reported as an
opaque gateway error code) and the SDP -> ORTC conversion (a dropped codec
feature just means the video never starts).
"""

from __future__ import annotations

import base64
import logging
from collections.abc import Iterator
from typing import Any
from unittest.mock import MagicMock

import pytest
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import ed25519, padding, rsa

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
from custom_components.anycubic_cloud.agora.sdp import OfferInfo, offer_to_ortc, parse_offer, parse_sdp

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


@pytest.fixture
def uncached_agora_key() -> Iterator[None]:
    """`_agora_public_key` is lru_cached, so a stubbed load must not persist."""
    _agora_public_key.cache_clear()
    yield
    _agora_public_key.cache_clear()


def test_a_bundled_key_that_will_not_load_is_reported(
    monkeypatch: pytest.MonkeyPatch,
    uncached_agora_key: None,
) -> None:
    """The key is a literal from the SDK; a bad edit to it must be obvious."""
    monkeypatch.setattr(
        "custom_components.anycubic_cloud.agora.encryption.serialization.load_der_public_key",
        MagicMock(side_effect=ValueError("not a DER document")),
    )

    with pytest.raises(AgoraError, match="bundled public key could not be loaded"):
        wrap_channel_key("a1b2c3d4e5f60718293a4b5c6d7e8f90")


def test_a_bundled_key_that_is_not_rsa_is_rejected(
    monkeypatch: pytest.MonkeyPatch,
    uncached_agora_key: None,
) -> None:
    """The wrap is RSA-OAEP, so no other key type could perform it."""
    monkeypatch.setattr(
        "custom_components.anycubic_cloud.agora.encryption.serialization.load_der_public_key",
        MagicMock(return_value=ed25519.Ed25519PrivateKey.generate().public_key()),
    )

    with pytest.raises(AgoraError, match="not an RSA key"):
        wrap_channel_key("a1b2c3d4e5f60718293a4b5c6d7e8f90")


def test_a_wrap_that_fails_is_reported_as_an_agora_error(monkeypatch: pytest.MonkeyPatch) -> None:
    """Whatever cryptography objects to, the caller only handles AgoraError."""
    key = MagicMock()
    key.key_size = 1024
    key.encrypt.side_effect = ValueError("data too large for key size")
    monkeypatch.setattr(
        "custom_components.anycubic_cloud.agora.encryption._agora_public_key",
        lambda: key,
    )

    with pytest.raises(AgoraError, match="Failed to wrap the channel key"):
        wrap_channel_key("a1b2c3d4e5f60718293a4b5c6d7e8f90")


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


def _video_offer(*extra_lines: str) -> str:
    """A minimal offer with a usable transport, plus whatever a test adds."""
    return "\r\n".join(
        [
            "v=0",
            "o=- 1 2 IN IP4 127.0.0.1",
            "s=-",
            "t=0 0",
            "m=video 9 UDP/TLS/RTP/SAVPF 96",
            "a=ice-ufrag:abcd",
            "a=ice-pwd:efghefghefghefghefgh",
            "a=fingerprint:sha-256 " + GATEWAY_FINGERPRINT,
            "a=recvonly",
            "a=rtpmap:96 H264/90000",
            *extra_lines,
            "",
        ]
    )


def test_lines_that_are_not_sdp_are_ignored() -> None:
    """Browsers add lines freely; an unreadable one is never a reason to fail."""
    parsed = parse_sdp(_video_offer("", "a", "not an sdp line at all", "b=AS:2000"))

    assert len(parsed["media"]) == 1
    assert parsed["media"][0]["rtp"][0]["payload"] == 96


@pytest.mark.parametrize(
    "media_line",
    ["m=video 9", "m=video not-a-port UDP/TLS/RTP/SAVPF 96"],
)
def test_a_media_line_that_cannot_be_read_is_fatal(media_line: str) -> None:
    """Unlike an attribute, a broken m= line means the offer is unusable."""
    sdp = "\r\n".join(["v=0", "o=- 1 2 IN IP4 127.0.0.1", "s=-", "t=0 0", media_line, ""])

    with pytest.raises(AgoraError, match="Malformed media"):
        parse_sdp(sdp)


def test_attributes_that_cannot_be_read_are_skipped_not_fatal() -> None:
    """One unparseable attribute must not cost us the whole negotiation."""
    parsed = parse_sdp(
        _video_offer(
            "a=rtpmap:97",
            "a=rtpmap:not-a-payload-type rtx/90000",
            "a=fmtp:",
            "a=fmtp:not-a-payload-type apt=96",
            "a=rtcp-fb:96",
            "a=rtcp-fb:not-a-payload-type nack",
            "a=extmap:3",
            "a=extmap:not-an-id urn:ietf:params:rtp-hdrext:toffset",
        )
    )
    video = parsed["media"][0]

    assert [rtp["payload"] for rtp in video["rtp"]] == [96]
    assert video["fmtp"] == []
    assert video["rtcpFb"] == []
    assert video["ext"] == []


def test_transport_parameters_may_live_at_the_session_level() -> None:
    """BUNDLE puts them on the first m= section, but session level is legal too."""
    sdp = "\r\n".join(
        [
            "v=0",
            "o=- 1 2 IN IP4 127.0.0.1",
            "s=-",
            "t=0 0",
            "a=ice-ufrag:sess",
            "a=ice-pwd:sessionwidepassword12",
            "a=fingerprint:sha-256 " + GATEWAY_FINGERPRINT,
            "m=video 9 UDP/TLS/RTP/SAVPF 96",
            "a=recvonly",
            "a=rtpmap:96 H264/90000",
            "",
        ]
    )

    ortc = offer_to_ortc(parse_sdp(sdp))

    assert ortc["iceParameters"] == {"iceUfrag": "sess", "icePwd": "sessionwidepassword12"}
    assert ortc["dtlsParameters"]["fingerprints"][0]["fingerprint"] == GATEWAY_FINGERPRINT


def test_offer_without_a_dtls_fingerprint_is_rejected() -> None:
    """No fingerprint means the gateway could not verify us, so do not join."""
    sdp = "\r\n".join(
        [
            "v=0",
            "o=- 1 2 IN IP4 127.0.0.1",
            "s=-",
            "t=0 0",
            "m=video 9 UDP/TLS/RTP/SAVPF 96",
            "a=ice-ufrag:abcd",
            "a=ice-pwd:efghefghefghefghefgh",
            "a=recvonly",
            "",
        ]
    )

    with pytest.raises(AgoraError, match="no DTLS fingerprint"):
        offer_to_ortc(parse_sdp(sdp))


MIXED_DIRECTION_OFFER = "\r\n".join(
    [
        "v=0",
        "o=- 1 2 IN IP4 127.0.0.1",
        "s=-",
        "t=0 0",
        "m=video 9 UDP/TLS/RTP/SAVPF 96",
        "a=ice-ufrag:abcd",
        "a=ice-pwd:efghefghefghefghefgh",
        "a=fingerprint:sha-256 " + GATEWAY_FINGERPRINT,
        "a=sendonly",
        "a=rtpmap:96 H264/90000",
        "m=video 9 UDP/TLS/RTP/SAVPF 98",
        "a=inactive",
        "a=rtpmap:98 VP8/90000",
        "m=audio 9 UDP/TLS/RTP/SAVPF 111",
        "a=rtpmap:111 opus/48000/2",
        "m=application 9 UDP/DTLS/SCTP webrtc-datachannel",
        "a=sctp-port:5000",
        "",
    ]
)


def test_each_direction_lands_in_the_right_half_of_the_capabilities() -> None:
    """`send` and `recv` describe what we offered to do, direction by direction.

    An inactive section contributes to neither, and a section with no
    direction at all defaults to sendrecv, so it contributes to both.
    """
    ortc = offer_to_ortc(parse_sdp(MIXED_DIRECTION_OFFER))
    send = ortc["rtpCapabilities"]["send"]
    recv = ortc["rtpCapabilities"]["recv"]

    assert [codec["payloadType"] for codec in send["videoCodecs"]] == [96]
    assert recv["videoCodecs"] == []
    assert [codec["payloadType"] for codec in send["audioCodecs"]] == [111]
    assert [codec["payloadType"] for codec in recv["audioCodecs"]] == [111]


def test_a_data_channel_section_is_carried_but_not_described() -> None:
    """It has no codecs to negotiate, and it still has to be answered in order."""
    offer_info = parse_offer(MIXED_DIRECTION_OFFER)

    assert [media["type"] for media in offer_info.media] == ["video", "video", "audio", "application"]
    assert offer_info.audio_extensions == []
    assert offer_info.video_extensions == []
    # No a=group:BUNDLE in this offer, so the mids fall back to section order.
    assert offer_info.bundle_mids == "0 1 2 3"


def test_an_offer_with_no_media_at_all_is_rejected() -> None:
    sdp = "\r\n".join(["v=0", "o=- 1 2 IN IP4 127.0.0.1", "s=-", "t=0 0", ""])

    with pytest.raises(AgoraError, match="no media sections"):
        parse_offer(sdp)


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


def test_answer_skips_a_fingerprint_entry_with_no_value() -> None:
    """A placeholder entry must not become `a=fingerprint:sha-256 None`.

    The algorithm is also spelled `algorithm` in some replies, not
    `hashFunction`, so both are accepted.
    """
    ortc = _gateway_ortc()
    ortc["dtlsParameters"]["fingerprints"] = [
        {"hashFunction": "sha-256"},
        {"algorithm": "sha-512", "fingerprint": "AB:CD:EF"},
    ]

    answer = build_answer_sdp(ortc, parse_offer(CHROME_OFFER))

    assert "a=fingerprint:sha-512 AB:CD:EF" in answer
    assert "None" not in answer


def test_answer_understands_an_unwrapped_capability_block() -> None:
    """Not every reply nests its codecs under send / recv / sendrecv."""
    ortc = _gateway_ortc()
    ortc["rtpCapabilities"] = ortc["rtpCapabilities"]["sendrecv"]

    answer = build_answer_sdp(ortc, parse_offer(CHROME_OFFER))

    assert "a=rtpmap:96 H264/90000" in answer


def test_answer_drops_a_candidate_with_no_address() -> None:
    """A half-described candidate would be an unparseable a=candidate line."""
    ortc = _gateway_ortc()
    ortc["iceParameters"]["candidates"] = [
        {"protocol": "udp", "port": 4701},
        {"ip": "98.98.143.194"},
        {"ip": "98.98.143.198", "port": 4715},
    ]

    answer = build_answer_sdp(ortc, parse_offer(CHROME_OFFER))

    # One usable candidate, repeated once per media section.
    assert answer.count("a=candidate:") == 2
    # Everything the gateway left out is defaulted, including the foundation,
    # which keeps its position in the list so the two stay distinguishable.
    assert "a=candidate:agora2 1 udp 2103266323 98.98.143.198 4715 typ host" in answer


def test_answer_needs_at_least_one_media_section() -> None:
    """Defensive: an offer that parsed but describes nothing cannot be answered."""
    empty = OfferInfo(
        parsed={"media": []},
        ice_ufrag="F7gI",
        ice_pwd="x+xNhQ8Q9k1Cp0kFqPXpMlSw",
        bundle_mids="",
        extmap_allow_mixed=False,
    )

    with pytest.raises(AgoraError, match="no media sections to answer"):
        build_answer_sdp(_gateway_ortc(), empty)


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
