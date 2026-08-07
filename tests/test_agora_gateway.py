"""The Agora session state machine, driven through a fake gateway.

`AgoraStreamSession` is the part of the Agora client with real state: it looks
up edges, races them, joins, subscribes, and has to hand the browser an answer
whether or not anything else went to plan. None of that can be exercised
without a gateway to talk to, so this module builds one -- an aiohttp
`ClientSession` stand-in whose `post` answers the Access Point lookup and whose
`ws_connect` hands back a scripted socket. Every frame the session sends is
captured, and replies are pushed back through the same async-iterator protocol
aiohttp uses, so the session runs its real code path throughout.

What is pinned down here is the wire format. It was recovered by reading
Agora's own Web SDK and confirmed against live hardware, and a regression in it
is *silent*: the gateway still answers "success" and the video simply never
arrives.
"""

from __future__ import annotations

import asyncio
import base64
import json
import logging
import time
from collections.abc import Callable, Coroutine
from dataclasses import dataclass, field
from typing import Any

import aiohttp
import pytest
from anycubic_cloud_api import AnycubicShengwangCredentials
from test_agora import CHROME_OFFER, GATEWAY_FINGERPRINT, _gateway_ortc

from custom_components.anycubic_cloud.agora import (
    AgoraAccessPoint,
    AgoraAccessPointError,
    AgoraError,
    AgoraResponse,
    AgoraSignallingError,
    AgoraStreamSession,
    EdgeAddress,
)
from custom_components.anycubic_cloud.agora import ap as ap_module
from custom_components.anycubic_cloud.agora import session as session_module

LOGGER = logging.getLogger(__name__)

# Captured from live hardware. The token is not a real one; everything else is
# the shape the Anycubic cloud hands out for a Kobra S1's camera order.
APP_ID = "6fc7f83702e44c67a0e1104933b01d4f"
CHANNEL = "311f171de29b3b8c0f059b1ddd223215"
RTC_TOKEN = "007eJxTYGA-not-a-real-token"
CLIENT_UID = 139781340
DEVICE_UID = 71431
ENCRYPTION_KEY = "a1b2c3d4e5f60718293a4b5c6d7e8f90"
ENCRYPTION_SALT = base64.b64encode(bytes(range(32))).decode("ascii")

PRIMARY_DOMAINS = {"webrtc2-ap-web-1.agora.io", "webrtc2-2.ap.sd-rtn.com"}
BACKUP_DOMAINS = {"webrtc2-ap-web-3.agora.io", "webrtc2-4.ap.sd-rtn.com"}

DEFAULT_EDGES = (("98.98.143.194", 4701), ("98.98.143.198", 4715))
SECOND_FINGERPRINT = "0A:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99"
DEFAULT_EDGE_FINGERPRINTS = (f"sha-256 {GATEWAY_FINGERPRINT}", f"sha-256 {SECOND_FINGERPRINT}")

# A browser candidate of the shape Home Assistant trickles in after the offer.
BROWSER_CANDIDATE = "candidate:842163049 1 udp 1677729535 81.2.69.142 51234 typ srflx raddr 0.0.0.0 rport 0"


def credentials(*, encrypted: bool = True, device_uid: int | None = DEVICE_UID) -> AnycubicShengwangCredentials:
    """The real credentials object, not a mock, so its derived properties run."""
    return AnycubicShengwangCredentials(
        appid=APP_ID,
        channel=CHANNEL,
        rtc_token=RTC_TOKEN,
        client_uid=CLIENT_UID,
        device_uid=device_uid,
        encryption_key=ENCRYPTION_KEY if encrypted else None,
        encryption_kdf_salt=ENCRYPTION_SALT if encrypted else None,
        encryption_mode="AES_256_GCM2" if encrypted else None,
    )


def video_announce(uid: int = DEVICE_UID, ssrc: int = 40000) -> dict[str, Any]:
    """An `on_add_video_stream` body as the gateway sends it."""
    return {
        "uid": uid,
        "ssrcId": ssrc,
        "rtxSsrcId": ssrc + 1,
        "cname": "o/i14u9pJrxRKAsu",
        "video": True,
        "audio": False,
    }


class FakeIceCandidate:
    """A stand-in for `webrtc_models.RTCIceCandidateInit`.

    Only the `candidate` attribute is ever read, and the real class is an
    optional Home Assistant import, so this keeps the test honest about how
    much of it the session actually touches.
    """

    def __init__(self, candidate: str = BROWSER_CANDIDATE) -> None:
        self.candidate = candidate
        self.sdp_m_line_index = 0


async def wait_until(predicate: Callable[[], bool], *, timeout: float = 2.0) -> None:
    """Let the reader task work through pushed frames before asserting."""
    async with asyncio.timeout(timeout):
        while not predicate():
            await asyncio.sleep(0.001)


class FakeGatewaySocket:
    """One scripted edge socket, quacking like `ClientWebSocketResponse`."""

    def __init__(self, gateway: FakeAgora) -> None:
        self._gateway = gateway
        self._inbox: asyncio.Queue[aiohttp.WSMessage | Exception | None] = asyncio.Queue()
        self._exception: Exception | None = None
        self.sent: list[dict[str, Any]] = []
        self.sent_raw: list[str] = []
        self.closed = False
        self.send_error: Exception | None = None
        self.close_error: BaseException | None = None

    # --- the surface AgoraStreamSession actually uses ----------------------

    async def send_str(self, data: str) -> None:
        """Record a client frame and let the gateway react to it."""
        if self.send_error is not None:
            raise self.send_error
        self.sent_raw.append(data)
        message = json.loads(data)
        self.sent.append(message)
        await self._gateway.on_client_frame(self, message)

    async def close(self) -> None:
        if self.close_error is not None:
            raise self.close_error
        self.hang_up()

    def exception(self) -> Exception | None:
        return self._exception

    def __aiter__(self) -> FakeGatewaySocket:
        return self

    async def __anext__(self) -> aiohttp.WSMessage:
        item = await self._inbox.get()
        if item is None:
            raise StopAsyncIteration
        if isinstance(item, Exception):
            raise item
        return item

    # --- the gateway's side of the socket ----------------------------------

    def push(self, payload: dict[str, Any]) -> None:
        """Send one JSON frame down to the client."""
        self.push_text(json.dumps(payload))

    def push_text(self, text: str) -> None:
        self._inbox.put_nowait(aiohttp.WSMessage(aiohttp.WSMsgType.TEXT, text, ""))

    def push_frame(self, frame: aiohttp.WSMessage, *, exception: Exception | None = None) -> None:
        self._exception = exception
        self._inbox.put_nowait(frame)

    def fail_read(self, error: Exception) -> None:
        """The socket blows up on the next read."""
        self._inbox.put_nowait(error)

    def hang_up(self) -> None:
        """The far end goes away cleanly."""
        self.closed = True
        self._inbox.put_nowait(None)

    def frames_of_type(self, verb: str) -> list[dict[str, Any]]:
        return [frame for frame in self.sent if frame.get("_type") == verb]


@dataclass
class AccessPointRequest:
    """One captured choose-server POST."""

    url: str
    form: aiohttp.FormData
    timeout: Any

    @property
    def domain(self) -> str:
        return self.url.removeprefix("https://").split("/", 1)[0]

    @property
    def path(self) -> str:
        return "/" + self.url.removeprefix("https://").split("/", 1)[1]

    @property
    def fields(self) -> list[tuple[str, str, str]]:
        """`(name, content type, value)` per multipart field.

        `FormData` exposes no public accessor, and the exact field layout is
        the thing under test -- the AP rejects a JSON or urlencoded body.
        """
        return [
            (str(options["name"]), str(headers.get("Content-Type", "")), str(value))
            for options, headers, value in self.form._fields
        ]

    @property
    def body(self) -> dict[str, Any]:
        parsed: dict[str, Any] = json.loads(self.fields[0][2])
        return parsed


class _FakeResponse:
    def __init__(self, gateway: FakeAgora, domain: str) -> None:
        self._gateway = gateway
        self.status = gateway.ap_statuses.get(domain, 200)

    async def json(self, content_type: str | None = "application/json") -> dict[str, Any]:
        if self._gateway.before_ap_result is not None:
            await self._gateway.before_ap_result()
        return self._gateway.ap_payload()


class _FakePostContext:
    def __init__(self, gateway: FakeAgora, domain: str) -> None:
        self._gateway = gateway
        self._domain = domain

    async def __aenter__(self) -> _FakeResponse:
        error = self._gateway.ap_failures.get(self._domain)
        if error is not None:
            raise error
        return _FakeResponse(self._gateway, self._domain)

    async def __aexit__(self, *exc_info: object) -> None:
        return None


class _FakeHttp:
    """The two `aiohttp.ClientSession` methods the Agora client ever calls.

    Both are looked up on the gateway per call, so a test can swap one out
    after the session has already been handed this object.
    """

    def __init__(self, gateway: FakeAgora) -> None:
        self._gateway = gateway

    def post(self, url: str, **kwargs: Any) -> _FakePostContext:
        return self._gateway.post(url, **kwargs)

    async def ws_connect(self, url: str) -> FakeGatewaySocket:
        return await self._gateway.ws_connect(url)


@dataclass
class FakeAgora:
    """Agora's side of the conversation: the AP lookup and the edge sockets."""

    edges: list[tuple[str, int]] = field(default_factory=lambda: list(DEFAULT_EDGES))
    edge_fingerprints: list[str] = field(default_factory=lambda: list(DEFAULT_EDGE_FINGERPRINTS))

    # Access Point behaviour.
    ap_requests: list[AccessPointRequest] = field(default_factory=list)
    ap_failures: dict[str, Exception] = field(default_factory=dict)
    ap_statuses: dict[str, int] = field(default_factory=dict)
    ap_override: dict[str, Any] | None = None
    before_ap_result: Callable[[], Coroutine[Any, Any, None]] | None = None

    # Gateway behaviour.
    ws_urls: list[str] = field(default_factory=list)
    sockets: list[FakeGatewaySocket] = field(default_factory=list)
    connect_errors: list[Exception | None] = field(default_factory=list)
    joins: list[dict[str, Any]] = field(default_factory=list)
    answer_join: bool = True
    join_result: str = "success"
    join_failure: Any = None
    join_ortc: dict[str, Any] | None = None
    join_extra: dict[str, Any] = field(default_factory=dict)
    announce: dict[str, Any] | None = None

    def __post_init__(self) -> None:
        if self.join_ortc is None:
            self.join_ortc = _gateway_ortc()
        if self.announce is None:
            self.announce = video_announce()
        self.http = _FakeHttp(self)

    @property
    def socket(self) -> FakeGatewaySocket:
        """The socket for the edge currently being talked to."""
        return self.sockets[-1]

    # --- Access Point -------------------------------------------------------

    def ap_payload(self) -> dict[str, Any]:
        if self.ap_override is not None:
            return self.ap_override
        return {
            "opid": 887766,
            "enter_ts": 1754500000000,
            "detail": {"23": "EU"},
            "response_body": [
                {
                    "buffer": {
                        "code": 0,
                        "flag": 4096,
                        "uid": CLIENT_UID,
                        "cid": 3747140790,
                        "cname": CHANNEL,
                        "cert": "flag-ticket",
                        "detail": {"19": "; ".join(self.edge_fingerprints)},
                        "edges_services": [{"ip": ip, "port": port} for ip, port in self.edges],
                    }
                }
            ],
        }

    def post(self, url: str, *, data: aiohttp.FormData, timeout: Any = None) -> _FakePostContext:
        domain = url.removeprefix("https://").split("/", 1)[0]
        self.ap_requests.append(AccessPointRequest(url=url, form=data, timeout=timeout))
        return _FakePostContext(self, domain)

    # --- gateway ------------------------------------------------------------

    async def ws_connect(self, url: str) -> FakeGatewaySocket:
        self.ws_urls.append(url)
        if self.connect_errors:
            error = self.connect_errors.pop(0)
            if error is not None:
                raise error
        socket = FakeGatewaySocket(self)
        self.sockets.append(socket)
        return socket

    async def on_client_frame(self, socket: FakeGatewaySocket, message: dict[str, Any]) -> None:
        """React to one client frame, the way the edge gateway would."""
        if message.get("_type") != "join_v3":
            return

        self.joins.append(message)
        if not self.answer_join:
            return

        if self.join_result != "success":
            socket.push({"_id": message["_id"], "_result": self.join_result, "_message": self.join_failure})
            return

        reply: dict[str, Any] = {"ortc": self.join_ortc, **self.join_extra}
        socket.push({"_id": message["_id"], "_result": "success", "_message": reply})
        if self.announce is not None:
            socket.push({"_type": "on_add_video_stream", "_message": self.announce})


def make_session(gateway: FakeAgora, **kwargs: Any) -> AgoraStreamSession:
    return AgoraStreamSession(gateway.http, credentials(**kwargs), LOGGER)


async def join(gateway: FakeAgora, session: AgoraStreamSession, *, offer: str = CHROME_OFFER) -> str:
    """Start a session, trickling one candidate in first.

    That is the ordinary path rather than a shortcut -- Home Assistant really
    does deliver candidates while the offer is being handled -- and it means
    the tests do not sit through the grace wait for one that never comes.
    """
    await session.async_add_candidate(FakeIceCandidate())
    return await session.async_start(offer, "session-1")


@pytest.fixture
def gateway() -> FakeAgora:
    return FakeAgora()


@pytest.fixture
async def session(gateway: FakeAgora):
    """A session that is always torn down, however the test ends."""
    live = make_session(gateway)
    yield live
    await live.async_close()


class TestTheJoinEnvelope:
    """`join_v3` is the whole protocol in one frame; nothing else can be retried."""

    async def test_requests_are_an_id_type_message_envelope(self, gateway: FakeAgora, session: AgoraStreamSession) -> None:
        await join(gateway, session)
        frame = gateway.joins[0]

        assert set(frame) == {"_id", "_type", "_message"}
        assert frame["_type"] == "join_v3"
        # The reply is matched on this id, and it is matched as a string.
        assert isinstance(frame["_id"], str)
        assert frame["_id"]

    async def test_the_join_names_the_channel_and_carries_the_token(
        self, gateway: FakeAgora, session: AgoraStreamSession
    ) -> None:
        await join(gateway, session)
        body = gateway.joins[0]["_message"]

        assert body["app_id"] == APP_ID
        assert body["channel_name"] == CHANNEL
        # The rtc_token travels as `channel_key`; there is no other credential.
        assert body["channel_key"] == RTC_TOKEN
        assert body["session_id"] == "session-1"
        assert body["sdk_version"] == "4.24.0"
        assert body["mode"] == "live"
        assert body["codec"] == "h264"
        assert body["role"] == "host"

    async def test_the_join_carries_the_ortc_blob_describing_the_browser(
        self, gateway: FakeAgora, session: AgoraStreamSession
    ) -> None:
        """The gateway is told what the browser can receive, in ORTC not SDP."""
        await join(gateway, session)
        ortc = gateway.joins[0]["_message"]["ortc"]

        assert ortc["version"] == "2"
        assert ortc["iceParameters"]["iceUfrag"] == "F7gI"
        assert ortc["dtlsParameters"]["role"] == "client"
        recv = ortc["rtpCapabilities"]["recv"]
        assert [codec["payloadType"] for codec in recv["videoCodecs"]] == [96, 97, 102, 103]

    async def test_the_join_echoes_the_ap_response_with_this_edges_ticket(
        self, gateway: FakeAgora, session: AgoraStreamSession
    ) -> None:
        """The gateway checks the ticket it issued, not some other edge's."""
        await join(gateway, session)
        ap_response = gateway.joins[0]["_message"]["ap_response"]

        assert ap_response["cname"] == CHANNEL
        assert ap_response["uid"] == CLIENT_UID
        assert ap_response["cid"] == 3747140790
        assert ap_response["ticket"] == "flag-ticket"
        assert ap_response["opid"] == 887766
        assert ap_response["server_ts"] == 1754500000000
        # The edge list is not echoed back, only the block describing it.
        assert "addresses" not in ap_response

    async def test_the_edge_is_dialled_by_hostname_not_by_ip(self, gateway: FakeAgora, session: AgoraStreamSession) -> None:
        """The wildcard cert covers *.edge.agora.io; an IP literal fails TLS."""
        await join(gateway, session)

        assert gateway.ws_urls == ["wss://98-98-143-194.edge.agora.io:4701"]

    async def test_the_client_role_is_claimed_after_the_join(self, gateway: FakeAgora, session: AgoraStreamSession) -> None:
        await join(gateway, session)
        role = gateway.socket.frames_of_type("set_client_role")[0]

        assert role["_message"]["role"] == "host"
        assert role["_message"]["level"] == 0
        assert role["_message"]["client_ts"] > 1_700_000_000_000


class TestChannelEncryption:
    """Four fields, and every one of them fails silently if it is wrong."""

    async def test_the_join_carries_the_four_encryption_fields(self, gateway: FakeAgora, session: AgoraStreamSession) -> None:
        await join(gateway, session)
        body = gateway.joins[0]["_message"]

        assert body["aes_mode"] == "aes-256-gcm2"
        assert body["aes_encrypt"] is True
        # OAEP is randomised, so only the shape can be asserted: a wrap under
        # Agora's 1024-bit key is always exactly 128 bytes.
        assert len(base64.b64decode(body["aes_secret"], validate=True)) == 128
        # The salt is a passthrough -- byte for byte what the cloud gave us.
        assert body["aes_salt"] == ENCRYPTION_SALT

    async def test_the_sdks_internal_field_names_never_reach_the_wire(
        self, gateway: FakeAgora, session: AgoraStreamSession
    ) -> None:
        """`aesmode` / `aespassword` / `aessalt` live on the SDK's `joinInfo`.

        Send those spellings instead and the gateway treats the channel as
        unencrypted: the join still succeeds and the media never decodes.
        """
        await join(gateway, session)
        raw = gateway.socket.sent_raw[0]

        for internal_name in ("aesmode", "aespassword", "aessalt"):
            assert internal_name not in raw

    async def test_the_channel_key_itself_is_never_sent(self, gateway: FakeAgora, session: AgoraStreamSession) -> None:
        """Only the RSA wrap goes out; the plaintext key must not appear."""
        await join(gateway, session)
        raw = gateway.socket.sent_raw[0]

        assert ENCRYPTION_KEY not in raw
        assert base64.b64encode(ENCRYPTION_KEY.encode()).decode() not in raw

    async def test_a_plain_channel_sends_no_aes_fields_at_all(self, gateway: FakeAgora) -> None:
        session = make_session(gateway, encrypted=False)
        try:
            await join(gateway, session)
        finally:
            await session.async_close()

        assert not [key for key in gateway.joins[0]["_message"] if key.startswith("aes")]

    async def test_a_rejected_key_is_reported_by_name(self, gateway: FakeAgora, session: AgoraStreamSession) -> None:
        """2028 is what a bad wrap comes back as, and nothing else explains it."""
        gateway.join_result = "failure"
        gateway.join_failure = {"code": 2028}

        with pytest.raises(AgoraError, match="ILLEGAL_AES_PASSWORD"):
            await join(gateway, session)

    async def test_a_crypt_error_notification_fails_the_join(self, gateway: FakeAgora, session: AgoraStreamSession) -> None:
        """The edge decrypts this channel, so its complaint is about our key."""
        gateway.announce = None
        original = gateway.on_client_frame

        async def announce_a_crypt_error(socket: FakeGatewaySocket, message: dict[str, Any]) -> None:
            await original(socket, message)
            if message.get("_type") == "join_v3":
                socket.push({"_type": "on_crypt_error", "_message": {"code": 2028}})

        gateway.on_client_frame = announce_a_crypt_error  # type: ignore[method-assign]

        with pytest.raises(AgoraError, match="rejected the channel encryption"):
            await join(gateway, session)


class TestIceCandidates:
    """Home Assistant trickles candidates after the offer, so the join races them."""

    async def test_a_join_happens_with_no_candidates_at_all(self, gateway: FakeAgora, session: AgoraStreamSession) -> None:
        """The gateway is ice-lite: it never sends checks, so it needs none of ours.

        Waiting for one would mean never joining, because Home Assistant calls
        the offer handler before the browser has gathered anything.
        """
        started = time.monotonic()
        answer = await session.async_start(CHROME_OFFER, "session-1")
        elapsed = time.monotonic() - started

        assert answer.startswith("v=0\r\n")
        assert "candidates" not in gateway.joins[0]["_message"]["ortc"]["iceParameters"]
        # The grace wait is bounded; a regression to "wait for a candidate"
        # would hang here rather than fail fast.
        assert elapsed < 1.0

    async def test_a_candidate_arriving_during_the_grace_wait_is_carried(
        self, gateway: FakeAgora, session: AgoraStreamSession, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """The wait ends the moment a candidate lands, not when it times out."""
        monkeypatch.setattr(session_module, "_CANDIDATE_GRACE", 30.0)

        starting = asyncio.create_task(session.async_start(CHROME_OFFER, "session-1"))
        await asyncio.sleep(0)
        await session.async_add_candidate(FakeIceCandidate())

        async with asyncio.timeout(2.0):
            await starting

        assert gateway.joins[0]["_message"]["ortc"]["iceParameters"]["candidates"]

    async def test_candidates_are_converted_into_ortc_form(self, gateway: FakeAgora, session: AgoraStreamSession) -> None:
        await join(gateway, session)
        candidates = gateway.joins[0]["_message"]["ortc"]["iceParameters"]["candidates"]

        assert candidates == [
            {
                "foundation": "842163049",
                "protocol": "udp",
                "priority": 1677729535,
                "ip": "81.2.69.142",
                "port": 51234,
                "type": "srflx",
            }
        ]

    @pytest.mark.parametrize(
        "candidate",
        [
            "",
            "candidate:1 1 udp 2130706431",
            "candidate:1 1 udp not-a-number 10.0.0.1 4711 typ host",
        ],
    )
    async def test_an_unusable_candidate_is_dropped_rather_than_sent(
        self, gateway: FakeAgora, session: AgoraStreamSession, candidate: str
    ) -> None:
        """A candidate we cannot parse must not become a malformed ORTC entry.

        The empty string is the browser's end-of-candidates signal, so this is
        an ordinary event rather than a corrupt one.
        """
        await session.async_add_candidate(FakeIceCandidate(candidate))
        await session.async_start(CHROME_OFFER, "session-1")

        assert "candidates" not in gateway.joins[0]["_message"]["ortc"]["iceParameters"]

    async def test_a_candidate_after_the_join_is_dropped(self, gateway: FakeAgora, session: AgoraStreamSession) -> None:
        """There is no post-join candidate verb; the only ICE verb is restart_ice.

        Inventing a frame here would be rejected by the gateway, and it is not
        needed: an ice-lite agent answers checks from wherever they arrive.
        """
        await join(gateway, session)
        before = len(gateway.socket.sent)

        await session.async_add_candidate(FakeIceCandidate())

        assert len(gateway.socket.sent) == before
        assert {frame.get("_type") for frame in gateway.socket.sent} <= {
            "join_v3",
            "set_client_role",
            "subscribe",
            "ping",
        }

    async def test_a_candidate_after_close_is_ignored(self, gateway: FakeAgora, session: AgoraStreamSession) -> None:
        """Home Assistant keeps trickling for a moment after a stream is closed."""
        await join(gateway, session)
        await session.async_close()

        await session.async_add_candidate(FakeIceCandidate())

        assert session.is_connected is False


class TestSubscribing:
    """A publisher is either announced to us, or already there when we arrive."""

    async def test_an_announced_stream_is_subscribed_to(self, gateway: FakeAgora, session: AgoraStreamSession) -> None:
        await join(gateway, session)
        subscribe = gateway.socket.frames_of_type("subscribe")[0]["_message"]

        assert subscribe["stream_id"] == DEVICE_UID
        assert subscribe["ssrcId"] == 40000
        assert subscribe["stream_type"] == "video"
        assert subscribe["mode"] == "live"
        assert subscribe["codec"] == "h264"
        assert subscribe["rtx"] is True

    async def test_a_stream_already_live_at_join_time_is_subscribed_to(
        self, gateway: FakeAgora, session: AgoraStreamSession
    ) -> None:
        """A printer publishing before we arrive is described in the join reply.

        The nesting varies between replies, hence the walk rather than a path.
        """
        gateway.announce = None
        gateway.join_extra = {"peers": [{"uid": 4242, "streams": [{"uid": 4242, "ssrcId": 50000, "stream_type": "video"}]}]}

        answer = await join(gateway, session)

        assert [frame["_message"]["stream_id"] for frame in gateway.socket.frames_of_type("subscribe")] == [4242]
        assert "a=ssrc:50000 cname:agora" in answer

    async def test_a_stream_is_subscribed_to_only_once(self, gateway: FakeAgora, session: AgoraStreamSession) -> None:
        """The gateway re-announces on rebalance; subscribing twice is an error."""
        await join(gateway, session)

        gateway.socket.push({"_type": "on_add_video_stream", "_message": video_announce()})
        await asyncio.sleep(0.01)

        assert len(gateway.socket.frames_of_type("subscribe")) == 1

    async def test_the_printers_own_stream_is_the_one_answered(self, gateway: FakeAgora, session: AgoraStreamSession) -> None:
        """`device_uid` names the printer; anything else on the channel is not it."""
        gateway.announce = None
        gateway.join_extra = {
            "streams": [
                {"uid": 999, "ssrcId": 11111, "video": True},
                {"uid": DEVICE_UID, "ssrcId": 22222, "video": True},
            ]
        }

        answer = await join(gateway, session)

        assert "a=ssrc:22222 " in answer
        assert "a=ssrc:11111 " not in answer

    async def test_the_first_stream_is_answered_when_the_printer_uid_is_unknown(self, gateway: FakeAgora) -> None:
        """Some accounts get no `shengwang_device` block, so device_uid is None."""
        gateway.announce = video_announce(uid=999, ssrc=33333)
        session = make_session(gateway, device_uid=None)
        try:
            answer = await join(gateway, session)
        finally:
            await session.async_close()

        assert "a=ssrc:33333 " in answer

    async def test_a_stream_announced_after_the_answer_is_still_subscribed_to(
        self, gateway: FakeAgora, session: AgoraStreamSession, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """The browser gets no SSRC for it, but the media still has to be asked for."""
        monkeypatch.setattr(session_module, "STREAM_ANNOUNCE_TIMEOUT", 0.05)
        gateway.announce = None

        await join(gateway, session)
        gateway.socket.push({"_type": "on_add_video_stream", "_message": video_announce()})

        await wait_until(lambda: bool(gateway.socket.frames_of_type("subscribe")))


class TestTheAnswer:
    """Everything the browser will ever learn has to be in the first answer."""

    async def test_the_answer_describes_the_gateway_not_the_offer(
        self, gateway: FakeAgora, session: AgoraStreamSession
    ) -> None:
        answer = await join(gateway, session)

        assert "\r\na=ice-lite\r\n" in answer
        assert f"a=fingerprint:sha-256 {GATEWAY_FINGERPRINT}" in answer
        assert "a=setup:active" in answer
        assert "a=ssrc:40000 cname:o/i14u9pJrxRKAsu" in answer
        assert "a=ssrc-group:FID 40000 40001" in answer

    async def test_the_edge_fingerprints_from_the_ap_are_merged_in(
        self, gateway: FakeAgora, session: AgoraStreamSession
    ) -> None:
        """A join reply without fingerprints still yields a usable answer.

        The AP hands out one fingerprint per edge in detail[19]; without them
        the browser has nothing to verify the DTLS handshake against.
        """
        assert gateway.join_ortc is not None
        gateway.join_ortc["dtlsParameters"] = {"role": "server"}

        answer = await join(gateway, session)

        assert f"a=fingerprint:sha-256 {GATEWAY_FINGERPRINT}" in answer

    async def test_a_channel_with_no_publisher_still_answers(
        self,
        gateway: FakeAgora,
        session: AgoraStreamSession,
        monkeypatch: pytest.MonkeyPatch,
        caplog: pytest.LogCaptureFixture,
    ) -> None:
        """A printer that is not streaming yet must not fail the whole offer."""
        monkeypatch.setattr(session_module, "STREAM_ANNOUNCE_TIMEOUT", 0.05)
        gateway.announce = None

        with caplog.at_level(logging.WARNING):
            answer = await join(gateway, session)

        assert "a=ssrc:" not in answer
        assert "m=video" in answer
        assert "No video stream announced" in caplog.text


class TestMergingEdgeFingerprints:
    """detail[19] fills the gap when a join reply omits its DTLS fingerprints."""

    @staticmethod
    def merge(ortc: dict[str, Any], fingerprints: list[str | None]) -> list[dict[str, Any]]:
        response = AgoraResponse(
            code=0,
            uid=CLIENT_UID,
            cid=1,
            cname=CHANNEL,
            ticket="t",
            flag=4096,
            opid=1,
            server_ts=1,
            addresses=[
                EdgeAddress(ip=ip, port=port, fingerprint=fingerprint)
                for (ip, port), fingerprint in zip(DEFAULT_EDGES, fingerprints, strict=True)
            ],
        )
        AgoraStreamSession._merge_edge_fingerprints(ortc, response)
        merged: list[dict[str, Any]] = ortc["dtlsParameters"]["fingerprints"]
        return merged

    def test_each_edges_fingerprint_is_added_with_its_algorithm(self) -> None:
        merged = self.merge({}, list(DEFAULT_EDGE_FINGERPRINTS))

        assert merged == [
            {"hashFunction": "sha-256", "fingerprint": GATEWAY_FINGERPRINT},
            {"hashFunction": "sha-256", "fingerprint": SECOND_FINGERPRINT},
        ]

    def test_a_bare_fingerprint_is_assumed_to_be_sha256(self) -> None:
        """detail[19] is not guaranteed to name the hash it used."""
        merged = self.merge({}, [GATEWAY_FINGERPRINT, None])

        assert merged == [{"hashFunction": "sha-256", "fingerprint": GATEWAY_FINGERPRINT}]

    def test_a_fingerprint_the_gateway_already_gave_is_not_repeated(self) -> None:
        """Hex case differs between the two sources, and it is the same edge."""
        ortc = {
            "dtlsParameters": {
                "fingerprints": [
                    {"hashFunction": "sha-256", "fingerprint": GATEWAY_FINGERPRINT.lower()},
                    {"hashFunction": "sha-256"},
                ]
            }
        }

        merged = self.merge(ortc, list(DEFAULT_EDGE_FINGERPRINTS))

        assert [entry.get("fingerprint") for entry in merged] == [
            GATEWAY_FINGERPRINT.lower(),
            None,
            SECOND_FINGERPRINT,
        ]


class TestFailures:
    """Nothing from aiohttp should ever reach the camera entity."""

    async def test_a_rejected_join_raises_agora_error(self, gateway: FakeAgora, session: AgoraStreamSession) -> None:
        gateway.join_result = "failure"
        gateway.join_failure = {"error_code": 2024, "error_str": "invalid token"}

        with pytest.raises(AgoraSignallingError, match="invalid token"):
            await join(gateway, session)

    @pytest.mark.parametrize(
        ("failure", "expected"),
        [
            ({"code": 7, "reason": "channel full"}, "code 7: channel full"),
            ({"error_code": 9, "error": "nope"}, "code 9: nope"),
            ({}, "result=failure"),
            ("a bare string", "result=failure"),
        ],
    )
    async def test_a_gateway_failure_is_described_without_quoting_the_payload(
        self, gateway: FakeAgora, session: AgoraStreamSession, failure: Any, expected: str
    ) -> None:
        """The reply may hold credentials, so only known fields are rendered."""
        gateway.join_result = "failure"
        gateway.join_failure = failure

        with pytest.raises(AgoraSignallingError, match=expected):
            await join(gateway, session)

    async def test_a_join_with_no_ortc_is_refused(self, gateway: FakeAgora, session: AgoraStreamSession) -> None:
        """A success with no ORTC leaves nothing to build an answer from."""
        gateway.join_ortc = {}

        with pytest.raises(AgoraSignallingError, match="no ORTC"):
            await join(gateway, session)

    async def test_a_gateway_that_never_answers_times_out(
        self, gateway: FakeAgora, session: AgoraStreamSession, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        monkeypatch.setattr(session_module, "JOIN_TIMEOUT", 0.05)
        gateway.answer_join = False

        with pytest.raises(AgoraSignallingError, match="join_v3"):
            await join(gateway, session)

    async def test_a_socket_that_dies_before_the_reply_fails_the_join(
        self, gateway: FakeAgora, session: AgoraStreamSession
    ) -> None:
        gateway.answer_join = False
        original = gateway.on_client_frame

        async def hang_up_instead_of_replying(socket: FakeGatewaySocket, message: dict[str, Any]) -> None:
            await original(socket, message)
            socket.hang_up()

        gateway.on_client_frame = hang_up_instead_of_replying  # type: ignore[method-assign]

        with pytest.raises(AgoraSignallingError, match="closed before a reply"):
            await join(gateway, session)

    async def test_a_read_error_is_not_leaked_as_an_aiohttp_error(
        self, gateway: FakeAgora, session: AgoraStreamSession
    ) -> None:
        gateway.answer_join = False
        original = gateway.on_client_frame

        async def blow_up_the_socket(socket: FakeGatewaySocket, message: dict[str, Any]) -> None:
            await original(socket, message)
            socket.fail_read(aiohttp.ClientError("connection reset"))

        gateway.on_client_frame = blow_up_the_socket  # type: ignore[method-assign]

        with pytest.raises(AgoraSignallingError):
            await join(gateway, session)

    @pytest.mark.parametrize(
        "frame",
        [
            aiohttp.WSMessage(aiohttp.WSMsgType.BINARY, b"\x00\x01", ""),
            aiohttp.WSMessage(aiohttp.WSMsgType.ERROR, None, ""),
        ],
    )
    async def test_a_frame_the_reader_cannot_use_ends_the_session(
        self, gateway: FakeAgora, session: AgoraStreamSession, frame: aiohttp.WSMessage
    ) -> None:
        """Agora only ever sends text; anything else means the socket is finished."""
        gateway.answer_join = False
        original = gateway.on_client_frame

        async def send_a_useless_frame(socket: FakeGatewaySocket, message: dict[str, Any]) -> None:
            await original(socket, message)
            socket.push_frame(frame, exception=aiohttp.ClientError("boom"))

        gateway.on_client_frame = send_a_useless_frame  # type: ignore[method-assign]

        with pytest.raises(AgoraSignallingError, match="closed before a reply"):
            await join(gateway, session)

    async def test_malformed_frames_are_dropped_and_the_join_continues(
        self, gateway: FakeAgora, session: AgoraStreamSession
    ) -> None:
        """Junk on the socket must not take the session down with it."""
        original = gateway.on_client_frame

        async def prepend_junk(socket: FakeGatewaySocket, message: dict[str, Any]) -> None:
            if message.get("_type") == "join_v3":
                socket.push_text("this is not json")
                socket.push_text("[1, 2, 3]")
            await original(socket, message)

        gateway.on_client_frame = prepend_junk  # type: ignore[method-assign]

        answer = await join(gateway, session)

        assert answer.startswith("v=0\r\n")

    async def test_a_dead_edge_falls_through_to_the_next_one(self, gateway: FakeAgora, session: AgoraStreamSession) -> None:
        """The AP returns several edges precisely because any one may be down."""
        gateway.connect_errors = [aiohttp.ClientError("connection refused")]

        answer = await join(gateway, session)

        assert gateway.ws_urls == [
            "wss://98-98-143-194.edge.agora.io:4701",
            "wss://98-98-143-198.edge.agora.io:4715",
        ]
        assert answer.startswith("v=0\r\n")

    async def test_an_edge_that_rejects_the_join_is_abandoned_for_the_next(
        self, gateway: FakeAgora, session: AgoraStreamSession
    ) -> None:
        """The first socket is torn down before the second is dialled."""
        gateway.join_result = "failure"
        gateway.join_failure = {"code": 7, "reason": "server busy"}

        with pytest.raises(AgoraSignallingError) as failure:
            await join(gateway, session)

        assert len(gateway.sockets) == 2
        assert all(socket.closed for socket in gateway.sockets)
        assert "98.98.143.194:4701" in str(failure.value)
        assert "98.98.143.198:4715" in str(failure.value)

    async def test_a_socket_that_refuses_to_close_does_not_stop_the_failover(
        self, gateway: FakeAgora, session: AgoraStreamSession
    ) -> None:
        """Teardown between edges is best-effort; a stuck close must not mask it."""
        gateway.join_result = "failure"
        gateway.join_failure = {"code": 7, "reason": "server busy"}
        original = gateway.ws_connect

        async def refuse_to_close(url: str) -> FakeGatewaySocket:
            socket = await original(url)
            socket.close_error = aiohttp.ClientError("close failed")
            return socket

        gateway.ws_connect = refuse_to_close  # type: ignore[method-assign]

        with pytest.raises(AgoraSignallingError):
            await join(gateway, session)

        assert len(gateway.sockets) == 2

    async def test_an_edge_that_drops_the_socket_as_it_accepts_is_abandoned(
        self, gateway: FakeAgora, session: AgoraStreamSession, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """The join was accepted, but the socket is gone before the role is claimed.

        Every send after the join has to cope with that, because "the gateway
        said yes" is not the same as "the gateway is still there".
        """
        monkeypatch.setattr(session_module, "STREAM_ANNOUNCE_TIMEOUT", 0.05)
        gateway.announce = None
        original = gateway.on_client_frame

        async def accept_then_vanish(socket: FakeGatewaySocket, message: dict[str, Any]) -> None:
            await original(socket, message)
            if message.get("_type") == "join_v3" and len(gateway.sockets) == 1:
                socket.hang_up()

        gateway.on_client_frame = accept_then_vanish  # type: ignore[method-assign]

        answer = await join(gateway, session)

        assert len(gateway.ws_urls) == 2
        assert answer.startswith("v=0\r\n")

    async def test_closing_while_a_request_is_in_flight_releases_the_caller(
        self, gateway: FakeAgora, session: AgoraStreamSession
    ) -> None:
        """A browser that gives up mid-join must not leave us waiting on a reply.

        Without this the caller would sit there until the join timeout, long
        after the stream it was answering for had gone.
        """
        gateway.answer_join = False

        starting = asyncio.create_task(join(gateway, session))
        await wait_until(lambda: bool(gateway.joins))

        await session.async_close()

        # Far sooner than JOIN_TIMEOUT, which is what a leak here would cost.
        async with asyncio.timeout(1.0):
            with pytest.raises(asyncio.CancelledError):
                await starting

    async def test_an_access_point_with_no_usable_edges_fails_the_start(
        self, gateway: FakeAgora, session: AgoraStreamSession
    ) -> None:
        gateway.edges = []

        with pytest.raises(AgoraAccessPointError, match="no gateway addresses"):
            await join(gateway, session)
        assert gateway.ws_urls == []

    async def test_an_unexpected_error_is_wrapped_rather_than_escaping(
        self, gateway: FakeAgora, session: AgoraStreamSession
    ) -> None:
        """The camera entity only knows how to handle AgoraError."""
        gateway.connect_errors = [RuntimeError("something else entirely")]

        with pytest.raises(AgoraError, match="Unexpected failure starting"):
            await join(gateway, session)

    async def test_a_failed_start_leaves_the_session_closed(self, gateway: FakeAgora, session: AgoraStreamSession) -> None:
        gateway.join_ortc = {}

        with pytest.raises(AgoraError):
            await join(gateway, session)

        assert session.is_connected is False
        # Closing again after that partial start is still safe.
        await session.async_close()

    async def test_starting_twice_is_refused(self, gateway: FakeAgora, session: AgoraStreamSession) -> None:
        """One session is one browser stream; reusing it would join twice."""
        await join(gateway, session)

        with pytest.raises(AgoraError, match="already been started"):
            await session.async_start(CHROME_OFFER, "session-2")

    async def test_starting_after_close_is_refused(self, gateway: FakeAgora, session: AgoraStreamSession) -> None:
        await session.async_close()

        with pytest.raises(AgoraError, match="already been closed"):
            await session.async_start(CHROME_OFFER, "session-1")

    async def test_closing_during_the_start_aborts_it(self, gateway: FakeAgora, session: AgoraStreamSession) -> None:
        """A browser that gives up mid-lookup must not leave us joined."""

        async def close_the_session() -> None:
            await session.async_close()

        gateway.before_ap_result = close_the_session

        with pytest.raises(AgoraError, match="closed while starting"):
            await join(gateway, session)
        assert gateway.ws_urls == []

    async def test_cancelling_the_start_closes_the_session(self, gateway: FakeAgora, session: AgoraStreamSession) -> None:
        never = asyncio.Event()

        async def never_connect(url: str) -> FakeGatewaySocket:
            await never.wait()
            raise AssertionError("unreachable")

        gateway.ws_connect = never_connect  # type: ignore[method-assign]

        starting = asyncio.create_task(join(gateway, session))
        await asyncio.sleep(0.01)
        starting.cancel()

        with pytest.raises(asyncio.CancelledError):
            await starting
        assert session.is_connected is False


class TestClosing:
    """Teardown runs on the failure path, so it is not allowed to raise."""

    async def test_closing_is_idempotent(self, gateway: FakeAgora, session: AgoraStreamSession) -> None:
        await join(gateway, session)

        await session.async_close()
        await session.async_close()

        assert session.is_connected is False

    async def test_closing_before_starting_is_harmless(self, session: AgoraStreamSession) -> None:
        await session.async_close()

        assert session.is_connected is False

    @pytest.mark.parametrize(
        "error",
        [
            aiohttp.ClientError("socket already gone"),
            TimeoutError(),
            OSError("bad file descriptor"),
            asyncio.CancelledError(),
        ],
    )
    async def test_closing_swallows_whatever_the_socket_does(
        self, gateway: FakeAgora, session: AgoraStreamSession, error: BaseException
    ) -> None:
        """Cancellation included: the caller is often unwinding a failed start."""
        await join(gateway, session)
        gateway.socket.close_error = error

        await session.async_close()

        assert session.is_connected is False

    async def test_closing_stops_the_background_tasks(self, gateway: FakeAgora, session: AgoraStreamSession) -> None:
        await join(gateway, session)
        reader, ping = session._reader_task, session._ping_task
        assert reader is not None
        assert ping is not None

        await session.async_close()

        assert reader.done()
        assert ping.done()


class TestKeepingTheSocketAlive:
    """The gateway drops an idle socket well inside a minute."""

    async def test_the_session_pings(
        self, gateway: FakeAgora, session: AgoraStreamSession, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        monkeypatch.setattr(session_module, "PING_INTERVAL", 0.01)
        await join(gateway, session)

        await wait_until(lambda: bool(gateway.socket.frames_of_type("ping")))

        assert set(gateway.socket.frames_of_type("ping")[0]) == {"_id", "_type"}

    async def test_pinging_stops_when_the_socket_goes_away(
        self, gateway: FakeAgora, session: AgoraStreamSession, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """The socket dies mid-interval, so the loop has to re-check on waking."""
        monkeypatch.setattr(session_module, "PING_INTERVAL", 0.05)
        await join(gateway, session)
        ping = session._ping_task
        assert ping is not None

        # Let the loop reach its sleep before the far end disappears.
        await asyncio.sleep(0.01)
        gateway.socket.hang_up()
        await wait_until(ping.done)

        assert session.is_connected is False
        assert gateway.socket.frames_of_type("ping") == []

    async def test_a_ping_that_fails_does_not_escape(
        self, gateway: FakeAgora, session: AgoraStreamSession, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """A dying socket is the reader's to report, not the ping loop's to raise."""
        monkeypatch.setattr(session_module, "PING_INTERVAL", 0.01)
        await join(gateway, session)
        ping = session._ping_task
        assert ping is not None
        gateway.socket.send_error = aiohttp.ClientError("broken pipe")

        await wait_until(ping.done)

        assert ping.exception() is None


class TestServerNotifications:
    """Everything the gateway pushes at us once the join is done."""

    async def test_losing_the_media_path_marks_the_session_disconnected(
        self, gateway: FakeAgora, session: AgoraStreamSession
    ) -> None:
        await join(gateway, session)
        assert session.is_connected is True

        gateway.socket.push({"_type": "on_p2p_lost", "_message": {"reason": "timeout"}})

        await wait_until(lambda: not session.is_connected)

    async def test_an_expired_token_ends_the_stream(self, gateway: FakeAgora, session: AgoraStreamSession) -> None:
        """The token is minted by Anycubic's cloud and cannot be renewed here."""
        await join(gateway, session)

        gateway.socket.push({"_type": "on_token_privilege_did_expire", "_message": {}})

        await wait_until(lambda: not session.is_connected)

    @pytest.mark.parametrize(
        "notification",
        [
            {"_type": "on_token_privilege_will_expire", "_message": {}},
            {"_type": "error", "_message": {"code": 1}},
            {"_type": "on_user_online", "_message": {"uid": DEVICE_UID}},
            {"_type": "on_user_offline", "_message": {"uid": DEVICE_UID}},
            {"_type": "on_something_agora_added_later", "_message": {}},
            {"_message": {"uid": 1}},
            {"_id": "deadbe", "_result": "success", "_message": {}},
        ],
    )
    async def test_a_notification_we_only_log_leaves_the_session_alone(
        self, gateway: FakeAgora, session: AgoraStreamSession, notification: dict[str, Any]
    ) -> None:
        """Including a reply whose id nobody is waiting for any more."""
        await join(gateway, session)

        gateway.socket.push(notification)
        await asyncio.sleep(0.01)

        assert session.is_connected is True

    async def test_a_removed_stream_is_forgotten(self, gateway: FakeAgora, session: AgoraStreamSession) -> None:
        await join(gateway, session)
        assert session._video_streams

        gateway.socket.push({"_type": "on_remove_video_stream", "_message": {"uid": DEVICE_UID}})

        await wait_until(lambda: not session._video_streams)

    @pytest.mark.parametrize(
        "announcement",
        [
            {"uid": DEVICE_UID, "ssrcId": 40000, "video": False},
            {"uid": "not-an-int", "ssrcId": 40000},
            {"uid": DEVICE_UID},
        ],
    )
    async def test_an_announcement_that_is_not_a_video_stream_is_ignored(
        self,
        gateway: FakeAgora,
        session: AgoraStreamSession,
        monkeypatch: pytest.MonkeyPatch,
        announcement: dict[str, Any],
    ) -> None:
        """Audio-only and malformed announcements must not become a video track."""
        monkeypatch.setattr(session_module, "STREAM_ANNOUNCE_TIMEOUT", 0.05)
        gateway.announce = None
        await join(gateway, session)

        gateway.socket.push({"_type": "on_add_video_stream", "_message": announcement})
        await asyncio.sleep(0.01)

        assert session._video_streams == {}
        assert gateway.socket.frames_of_type("subscribe") == []


class TestTheAccessPointLookup:
    """One HTTPS POST, no signature, and the rtc_token as the only credential."""

    async def look_up(self, gateway: FakeAgora, **kwargs: Any) -> AgoraResponse:
        access_point = AgoraAccessPoint(gateway.http)
        return await access_point.async_choose_server(
            app_id=APP_ID,
            channel=CHANNEL,
            rtc_token=RTC_TOKEN,
            uid=CLIENT_UID,
            **kwargs,
        )

    async def test_the_request_is_one_multipart_field_called_request(self, gateway: FakeAgora) -> None:
        """Not a JSON body and not form-urlencoded -- the AP rejects both."""
        await self.look_up(gateway)
        request = gateway.ap_requests[0]

        assert request.path == "/api/v2/transpond/webrtc?v=2"
        assert len(request.fields) == 1
        name, content_type, _value = request.fields[0]
        assert name == "request"
        assert content_type == "application/json"
        assert isinstance(request.timeout, aiohttp.ClientTimeout)
        assert request.timeout.total == 10.0

    async def test_the_request_body_asks_for_a_gateway_and_a_turn_fallback(self, gateway: FakeAgora) -> None:
        await self.look_up(gateway)
        body = gateway.ap_requests[0].body

        assert set(body) == {"appid", "client_ts", "opid", "sid", "request_bodies"}
        assert body["appid"] == APP_ID
        assert len(body["sid"]) == 32
        assert body["sid"] == body["sid"].upper()

        (request_body,) = body["request_bodies"]
        assert request_body["uri"] == 22
        assert request_body["buffer"]["service_ids"] == [11, 26]
        assert request_body["buffer"]["cname"] == CHANNEL
        assert request_body["buffer"]["uid"] == CLIENT_UID
        # The only credential in the whole request.
        assert request_body["buffer"]["key"] == RTC_TOKEN

    async def test_the_request_detail_names_the_area_and_the_role(self, gateway: FakeAgora) -> None:
        """detail[6] is deliberately absent: it would ask for a string-uid join."""
        await self.look_up(gateway)
        detail = gateway.ap_requests[0].body["request_bodies"][0]["buffer"]["detail"]

        assert detail == {"11": "CN,GLOBAL", "17": "1", "22": "CN,GLOBAL"}

    async def test_nothing_in_the_request_is_signed(self, gateway: FakeAgora) -> None:
        """There is no HMAC, no nonce and no signature anywhere in this hop.

        Worth pinning down: a reader who assumes there must be one goes looking
        for a signing routine that does not exist.
        """
        await self.look_up(gateway)
        raw = gateway.ap_requests[0].fields[0][2].lower()

        for suspicious in ("sign", "hmac", "nonce", "digest", "secret"):
            assert suspicious not in raw

    async def test_both_primaries_are_raced_and_the_backups_never_start(self, gateway: FakeAgora) -> None:
        """The common case costs one request pair, not four."""
        await self.look_up(gateway)

        assert {request.domain for request in gateway.ap_requests} == PRIMARY_DOMAINS

    async def test_a_failing_primary_falls_through_to_the_other(self, gateway: FakeAgora) -> None:
        gateway.ap_failures["webrtc2-ap-web-1.agora.io"] = aiohttp.ClientError("DNS failure")

        response = await self.look_up(gateway)

        assert [address.ip for address in response.addresses] == ["98.98.143.194", "98.98.143.198"]

    async def test_the_backups_take_over_when_both_primaries_fail(
        self, gateway: FakeAgora, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        monkeypatch.setattr(ap_module, "AP_BACKUP_DELAY", 0.01)
        for domain in PRIMARY_DOMAINS:
            gateway.ap_failures[domain] = aiohttp.ClientError("unreachable")

        response = await self.look_up(gateway)

        assert response.addresses
        assert {request.domain for request in gateway.ap_requests} & BACKUP_DOMAINS

    async def test_a_non_200_is_reported_as_an_agora_error(self, gateway: FakeAgora, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.setattr(ap_module, "AP_BACKUP_DELAY", 0.01)
        for domain in PRIMARY_DOMAINS | BACKUP_DOMAINS:
            gateway.ap_statuses[domain] = 503

        with pytest.raises(AgoraAccessPointError, match="HTTP 503"):
            await self.look_up(gateway)

    async def test_every_endpoint_failing_names_them_all(self, gateway: FakeAgora, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.setattr(ap_module, "AP_BACKUP_DELAY", 0.01)
        for domain in PRIMARY_DOMAINS | BACKUP_DOMAINS:
            gateway.ap_failures[domain] = aiohttp.ClientError("unreachable")

        with pytest.raises(AgoraAccessPointError) as failure:
            await self.look_up(gateway)

        for domain in PRIMARY_DOMAINS | BACKUP_DOMAINS:
            assert domain in str(failure.value)

    async def test_a_region_hint_retargets_the_lookup(self, gateway: FakeAgora) -> None:
        """Agora answers detail[23] with the region it wants asked next time."""
        await self.look_up(gateway, region="eu")

        assert {request.domain for request in gateway.ap_requests} == {"ap-web-1-eu.agora.io"}

    async def test_the_edges_keep_their_ticket_and_their_own_fingerprint(self, gateway: FakeAgora) -> None:
        """detail[19] is positional: the Nth fingerprint belongs to the Nth edge."""
        response = await self.look_up(gateway)

        assert [(address.ip, address.port) for address in response.addresses] == list(DEFAULT_EDGES)
        assert [address.fingerprint for address in response.addresses] == list(DEFAULT_EDGE_FINGERPRINTS)
        assert {address.ticket for address in response.addresses} == {"flag-ticket"}
        assert response.region == "eu"

    async def test_an_edge_with_no_address_is_skipped(self, gateway: FakeAgora) -> None:
        payload = gateway.ap_payload()
        payload["response_body"][0]["buffer"]["edges_services"] = [
            {"ip": "", "port": 4701},
            {"ip": "1.2.3.4"},
            {"ip": "5.6.7.8", "port": 4711},
        ]
        gateway.ap_override = payload

        response = await self.look_up(gateway)

        assert [address.ip for address in response.addresses] == ["5.6.7.8"]

    async def test_the_choose_server_block_wins_over_the_turn_block(self, gateway: FakeAgora) -> None:
        """Both are asked for; only flag 4096 describes gateways to join."""
        payload = gateway.ap_payload()
        turn_block = json.loads(json.dumps(payload["response_body"][0]))
        turn_block["buffer"]["flag"] = 4194310
        turn_block["buffer"]["edges_services"] = [{"ip": "10.0.0.1", "port": 3478}]
        payload["response_body"].insert(0, turn_block)
        gateway.ap_override = payload

        response = await self.look_up(gateway)

        assert response.flag == 4096
        assert [address.ip for address in response.addresses] == ["98.98.143.194", "98.98.143.198"]

    async def test_a_lone_block_is_used_whatever_its_flag(self, gateway: FakeAgora) -> None:
        payload = gateway.ap_payload()
        payload["response_body"][0]["buffer"]["flag"] = 4194310
        gateway.ap_override = payload

        response = await self.look_up(gateway)

        assert response.flag == 4194310
        assert response.addresses

    async def test_a_rejected_service_block_is_skipped(self, gateway: FakeAgora) -> None:
        payload = gateway.ap_payload()
        payload["response_body"][0]["buffer"]["code"] = 7
        gateway.ap_override = payload

        with pytest.raises(AgoraAccessPointError, match="every service block failed"):
            await self.look_up(gateway)

    async def test_an_empty_response_is_an_error(self, gateway: FakeAgora) -> None:
        gateway.ap_override = {"opid": 1, "response_body": []}

        with pytest.raises(AgoraAccessPointError, match="no response body"):
            await self.look_up(gateway)

    async def test_a_response_without_a_timestamp_still_parses(self, gateway: FakeAgora) -> None:
        """`enter_ts` is echoed into the join, so it needs a sane fallback."""
        payload = gateway.ap_payload()
        del payload["enter_ts"]
        del payload["detail"]
        gateway.ap_override = payload

        response = await self.look_up(gateway)

        assert response.server_ts > 1_700_000_000_000
        assert response.region is None


class TestEdgeAddresses:
    def test_the_websocket_url_dodges_the_ip_certificate_problem(self) -> None:
        """Connecting to the bare IP fails TLS, and turning that off is no fix."""
        edge = EdgeAddress(ip="98.98.143.194", port=4701)

        assert edge.websocket_url == "wss://98-98-143-194.edge.agora.io:4701"
