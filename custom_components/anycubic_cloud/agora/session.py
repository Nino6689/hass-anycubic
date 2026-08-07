"""A subscriber-only Agora channel session.

Home Assistant hands us the browser's offer and expects one answer back. We
never publish: the printer is the only broadcaster on the channel, and this
client exists to relay its video to whatever browser asked for it.

Two constraints from the Home Assistant side shape the whole flow:

* The offer arrives first and ICE candidates trickle in *afterwards*, so at the
  moment `join_v3` has to go out there may be no candidates at all. That is
  fine -- the gateway is an ICE-lite agent, so it never initiates connectivity
  checks and does not need ours. Any candidates we happen to hold are passed
  along as advisory.
* There is no renegotiation verb on Home Assistant's signalling channel, so
  everything the browser will ever know must be in the first answer -- most
  importantly the remote video SSRC.

Adapted from `Jezza34000/homeassistant_petkit` (MIT), whose Agora client is in
turn based on the original reverse engineering by @mikey0000.
"""

from __future__ import annotations

import asyncio
import contextlib
import json
import logging
import secrets
import time
from typing import TYPE_CHECKING, Any

import aiohttp

from .answer import RemoteVideoStream, build_answer_sdp
from .ap import AgoraAccessPoint, AgoraResponse, EdgeAddress
from .const import (
    BROWSER_USER_AGENT,
    CHANNEL_CODEC,
    CHANNEL_MODE,
    ERR_ILLEGAL_AES_PASSWORD,
    EVENT_ADD_VIDEO_STREAM,
    EVENT_CRYPT_ERROR,
    EVENT_ERROR,
    EVENT_P2P_LOST,
    EVENT_REMOVE_VIDEO_STREAM,
    EVENT_TOKEN_DID_EXPIRE,
    EVENT_TOKEN_WILL_EXPIRE,
    EVENT_USER_OFFLINE,
    EVENT_USER_ONLINE,
    JOIN_ROLE_HOST,
    JOIN_TIMEOUT,
    PING_INTERVAL,
    SDK_VERSION,
    STREAM_ANNOUNCE_TIMEOUT,
    WS_CLOSE_TIMEOUT,
    WS_CONNECT_TIMEOUT,
)
from .encryption import validate_kdf_salt, wrap_channel_key
from .errors import AgoraError, AgoraSignallingError
from .sdp import OfferInfo, offer_to_ortc, parse_offer, parse_sdp

if TYPE_CHECKING:
    from anycubic_cloud_api import AnycubicShengwangCredentials
    from webrtc_models import RTCIceCandidateInit

# How long `async_start` will wait for a first trickled candidate before
# joining without one. Belt and braces: the join does not need candidates, but
# if the browser is quick there is no reason not to carry them.
_CANDIDATE_GRACE = 0.3


class AgoraStreamSession:
    """One join of one Agora channel, for the lifetime of one browser stream."""

    def __init__(
        self,
        session: aiohttp.ClientSession,
        credentials: AnycubicShengwangCredentials,
        logger: logging.Logger,
    ) -> None:
        """Prepare a session; nothing is contacted until `async_start`."""
        self._http = session
        self._credentials = credentials
        self._logger = logger

        self._ws: aiohttp.ClientWebSocketResponse | None = None
        self._reader_task: asyncio.Task[None] | None = None
        self._ping_task: asyncio.Task[None] | None = None

        self._started = False
        self._joined = False
        self._closed = False

        self._pending: dict[str, asyncio.Future[dict[str, Any]]] = {}
        self._candidates: list[RTCIceCandidateInit] = []
        self._candidate_seen = asyncio.Event()

        self._video_streams: dict[int, RemoteVideoStream] = {}
        self._subscribed: set[tuple[int, int]] = set()
        self._stream_announced = asyncio.Event()

        self._crypt_error: str | None = None

    # --- public interface ---------------------------------------------------

    @property
    def is_connected(self) -> bool:
        """Whether the gateway socket is open and the channel is joined."""
        return (
            not self._closed
            and self._joined
            and self._ws is not None
            and not self._ws.closed
        )

    async def async_start(self, offer_sdp: str, session_id: str) -> str:
        """Join the channel and return the answer SDP for the browser."""
        if self._started:
            raise AgoraError("This Agora session has already been started")
        if self._closed:
            raise AgoraError("This Agora session has already been closed")
        self._started = True

        try:
            return await self._async_start(offer_sdp, session_id)
        except AgoraError:
            await self.async_close()
            raise
        except asyncio.CancelledError:
            await self.async_close()
            raise
        except Exception as err:
            await self.async_close()
            raise AgoraError(f"Unexpected failure starting Agora session: {err}") from err

    async def async_add_candidate(self, candidate: RTCIceCandidateInit) -> None:
        """Accept a trickled ICE candidate from the browser.

        Before the join these are buffered into the ORTC blob. After it they
        are dropped, deliberately: the gateway's complete request vocabulary
        has no verb for adding a candidate -- the only ICE-adjacent verb is
        `restart_ice`, which would need a renegotiation we cannot deliver. It
        costs nothing, because an ICE-lite gateway answers connectivity checks
        from whatever address they arrive on and never sends its own.
        """
        if self._closed:
            return

        if self._joined:
            self._logger.debug(
                "Ignoring post-join ICE candidate; the gateway has no verb for it"
            )
            return

        self._candidates.append(candidate)
        self._candidate_seen.set()

    async def async_close(self) -> None:
        """Tear the session down. Safe to call twice, and never raises."""
        if self._closed:
            return
        self._closed = True
        self._joined = False

        for future in self._pending.values():
            if not future.done():
                future.cancel()
        self._pending.clear()

        await self._async_cancel(self._ping_task)
        self._ping_task = None
        await self._async_cancel(self._reader_task)
        self._reader_task = None

        if self._ws is not None and not self._ws.closed:
            try:
                async with asyncio.timeout(WS_CLOSE_TIMEOUT):
                    await self._ws.close()
            except (TimeoutError, aiohttp.ClientError, OSError) as err:
                self._logger.debug("Ignoring error closing Agora socket: %s", err)
            except asyncio.CancelledError:
                # Never let cancellation escape teardown; the caller may be
                # unwinding an already-failed start.
                self._logger.debug("Agora socket close was cancelled")
        self._ws = None

        self._video_streams.clear()
        self._subscribed.clear()

    # --- start sequence -----------------------------------------------------

    async def _async_start(self, offer_sdp: str, session_id: str) -> str:
        """Do the work of `async_start`, with errors normalised by the caller."""
        offer_info = parse_offer(offer_sdp)
        ortc = offer_to_ortc(parse_sdp(offer_sdp))

        # Cheap grace period: if the browser is about to trickle a candidate,
        # take it. Never wait longer, and never fail when none arrives.
        if not self._candidates:
            with contextlib.suppress(TimeoutError):
                async with asyncio.timeout(_CANDIDATE_GRACE):
                    await self._candidate_seen.wait()

        candidates = self._ortc_candidates()
        if candidates:
            ortc.setdefault("iceParameters", {})["candidates"] = candidates
        self._logger.debug(
            "Agora session %s joining with %d browser candidate(s)",
            session_id,
            len(candidates),
        )

        access_point = AgoraAccessPoint(self._http)
        ap_response = await access_point.async_choose_server(
            app_id=self._credentials.appid,
            channel=self._credentials.channel,
            rtc_token=self._credentials.rtc_token,
            uid=self._credentials.client_uid,
        )

        errors: list[str] = []
        for edge in ap_response.addresses:
            if self._closed:
                raise AgoraError("Agora session was closed while starting")

            try:
                return await self._async_join_edge(
                    edge=edge,
                    ap_response=ap_response,
                    ortc=ortc,
                    offer_info=offer_info,
                    session_id=session_id,
                )
            except (AgoraError, aiohttp.ClientError, OSError, TimeoutError) as err:
                self._logger.debug("Agora edge %s failed: %s", edge.ip, err)
                errors.append(f"{edge.ip}:{edge.port}: {err}")
                await self._async_reset_socket()

        raise AgoraSignallingError(
            "Could not join the Agora channel on any edge: " + "; ".join(errors)
        )

    async def _async_join_edge(
        self,
        *,
        edge: EdgeAddress,
        ap_response: AgoraResponse,
        ortc: dict[str, Any],
        offer_info: OfferInfo,
        session_id: str,
    ) -> str:
        """Connect to one edge, join, subscribe, and build the answer."""
        async with asyncio.timeout(WS_CONNECT_TIMEOUT):
            self._ws = await self._http.ws_connect(edge.websocket_url)

        self._logger.debug("Agora gateway connected: %s", edge.websocket_url)
        self._reader_task = asyncio.create_task(self._async_reader(self._ws))

        join_message = self._build_join_message(
            session_id=session_id,
            ortc=ortc,
            ap_response=ap_response,
            edge=edge,
        )
        result = await self._async_request(join_message, timeout=JOIN_TIMEOUT)

        message = result.get("_message") or {}
        gateway_ortc = message.get("ortc")
        if not gateway_ortc:
            raise AgoraSignallingError("Gateway accepted the join but sent no ORTC")

        self._joined = True
        self._merge_edge_fingerprints(gateway_ortc, ap_response)

        await self._async_send(
            {
                "_id": secrets.token_hex(3),
                "_type": "set_client_role",
                "_message": {
                    "role": JOIN_ROLE_HOST,
                    "level": 0,
                    "client_ts": int(time.time() * 1000),
                },
            }
        )
        await self._async_subscribe_known_streams(message)

        # The SSRC has to be in this answer or the browser will never get one,
        # so wait for the publisher to be announced before building it.
        if not self._stream_announced.is_set():
            try:
                async with asyncio.timeout(STREAM_ANNOUNCE_TIMEOUT):
                    await self._stream_announced.wait()
            except TimeoutError:
                self._logger.warning(
                    "No video stream announced within %.0fs; answering without an "
                    "SSRC. The printer is probably not publishing yet",
                    STREAM_ANNOUNCE_TIMEOUT,
                )

        if self._crypt_error is not None:
            raise AgoraError(f"Agora rejected the channel encryption: {self._crypt_error}")

        answer = build_answer_sdp(
            gateway_ortc,
            offer_info,
            self._primary_video_stream(),
        )
        self._ping_task = asyncio.create_task(self._async_ping_loop())
        return answer

    # --- messaging ----------------------------------------------------------

    async def _async_send(self, message: dict[str, Any]) -> None:
        """Send one JSON frame to the gateway."""
        if self._ws is None or self._ws.closed:
            raise AgoraSignallingError("Agora socket is not open")
        await self._ws.send_str(json.dumps(message))

    async def _async_request(
        self,
        message: dict[str, Any],
        *,
        timeout: float,
    ) -> dict[str, Any]:
        """Send a frame and wait for the reply carrying the same `_id`."""
        message_id = str(message["_id"])
        future: asyncio.Future[dict[str, Any]] = asyncio.get_running_loop().create_future()
        self._pending[message_id] = future

        try:
            await self._async_send(message)
            async with asyncio.timeout(timeout):
                response = await future
        except TimeoutError as err:
            raise AgoraSignallingError(
                f"Gateway did not answer '{message.get('_type')}' within {timeout:.0f}s"
            ) from err
        finally:
            self._pending.pop(message_id, None)

        result = response.get("_result")
        if result != "success":
            raise AgoraSignallingError(
                f"Gateway rejected '{message.get('_type')}': {self._describe(response)}"
            )
        return response

    @staticmethod
    def _describe(response: dict[str, Any]) -> str:
        """Render a gateway failure without leaking anything sensitive."""
        message = response.get("_message")
        if isinstance(message, dict):
            code = message.get("code") or message.get("error_code")
            reason = message.get("reason") or message.get("error_str") or message.get("error")
            if code == ERR_ILLEGAL_AES_PASSWORD:
                return (
                    f"code {code} (ILLEGAL_AES_PASSWORD) -- the wrapped channel "
                    "key was not accepted"
                )
            if code is not None or reason is not None:
                return f"code {code}: {reason}"
        return f"result={response.get('_result')}"

    async def _async_reader(self, ws: aiohttp.ClientWebSocketResponse) -> None:
        """Read gateway frames for the life of the socket."""
        try:
            async for frame in ws:
                if frame.type is not aiohttp.WSMsgType.TEXT:
                    if frame.type is aiohttp.WSMsgType.ERROR:
                        self._logger.debug("Agora socket error frame: %s", ws.exception())
                    break

                try:
                    payload = json.loads(frame.data)
                except json.JSONDecodeError:
                    self._logger.debug("Dropped a non-JSON gateway frame")
                    continue

                if isinstance(payload, dict):
                    await self._async_handle(payload)
        except asyncio.CancelledError:
            raise
        except (aiohttp.ClientError, OSError) as err:
            self._logger.debug("Agora reader stopped: %s", err)
        finally:
            self._joined = False
            for future in self._pending.values():
                if not future.done():
                    future.set_exception(
                        AgoraSignallingError("Agora socket closed before a reply arrived")
                    )
            self._pending.clear()
            # Unblock anyone waiting on a stream that can no longer arrive.
            self._stream_announced.set()

    async def _async_handle(self, payload: dict[str, Any]) -> None:
        """Route one decoded frame to whoever is waiting for it."""
        message_id = payload.get("_id")
        if isinstance(message_id, str):
            future = self._pending.get(message_id)
            if future is not None and not future.done():
                future.set_result(payload)
                return

        event = payload.get("_type")
        message = payload.get("_message") or {}

        if event == EVENT_ADD_VIDEO_STREAM:
            await self._async_on_video_stream(message)
        elif event == EVENT_REMOVE_VIDEO_STREAM:
            uid = message.get("uid")
            if isinstance(uid, int):
                self._video_streams.pop(uid, None)
        elif event == EVENT_CRYPT_ERROR:
            # The gateway, not the browser, decrypts this channel -- so a
            # crypto complaint means our wrapped key or salt is wrong.
            self._crypt_error = str(message)
            self._logger.error("Agora reported a channel encryption error: %s", message)
            self._stream_announced.set()
        elif event == EVENT_P2P_LOST:
            self._logger.warning("Agora dropped the media path: %s", message)
            self._joined = False
        elif event == EVENT_ERROR:
            self._logger.warning("Agora signalling error: %s", message)
        elif event == EVENT_TOKEN_WILL_EXPIRE:
            # The token is minted by Anycubic's cloud and cannot be renewed
            # from here; a fresh one needs a fresh camera order. Say so rather
            # than sending a renew_token the gateway will reject.
            self._logger.info(
                "Agora token expires soon; this stream will end and needs restarting"
            )
        elif event == EVENT_TOKEN_DID_EXPIRE:
            self._logger.warning("Agora token expired; the stream is over")
            self._joined = False
        elif event in (EVENT_USER_ONLINE, EVENT_USER_OFFLINE):
            self._logger.debug("Agora %s: uid=%s", event, message.get("uid"))

    async def _async_on_video_stream(self, message: dict[str, Any]) -> None:
        """Record and subscribe to a newly announced video stream."""
        uid = message.get("uid")
        ssrc = message.get("ssrcId")
        if not isinstance(uid, int) or not isinstance(ssrc, int):
            return
        if not message.get("video", True):
            return

        rtx_ssrc = message.get("rtxSsrcId")
        self._video_streams[uid] = RemoteVideoStream(
            uid=uid,
            ssrc=ssrc,
            rtx_ssrc=rtx_ssrc if isinstance(rtx_ssrc, int) else None,
            cname=message.get("cname"),
        )
        self._logger.debug("Agora announced video: uid=%s ssrc=%s", uid, ssrc)

        await self._async_subscribe(uid, ssrc)
        self._stream_announced.set()

    async def _async_subscribe(self, uid: int, ssrc: int) -> None:
        """Subscribe to one remote stream, at most once."""
        if (uid, ssrc) in self._subscribed:
            return
        self._subscribed.add((uid, ssrc))

        await self._async_send(
            {
                "_id": secrets.token_hex(3),
                "_type": "subscribe",
                "_message": {
                    "stream_id": uid,
                    "stream_type": "video",
                    "mode": CHANNEL_MODE,
                    "codec": CHANNEL_CODEC,
                    "p2p_id": 1,
                    "twcc": True,
                    "rtx": True,
                    "extend": "",
                    "ssrcId": ssrc,
                },
            }
        )

    async def _async_subscribe_known_streams(self, join_message: dict[str, Any]) -> None:
        """Subscribe to streams that were already live when we joined.

        A printer that started publishing before we arrived is described
        inside the join reply rather than announced afterwards, and the exact
        nesting varies, so walk the payload for `uid` + `ssrcId` pairs.
        """
        for uid, ssrc in _find_video_streams(join_message):
            self._video_streams.setdefault(uid, RemoteVideoStream(uid=uid, ssrc=ssrc))
            await self._async_subscribe(uid, ssrc)
            self._stream_announced.set()

    async def _async_ping_loop(self) -> None:
        """Keep the gateway socket alive."""
        try:
            while self.is_connected:
                await asyncio.sleep(PING_INTERVAL)
                if not self.is_connected:
                    return
                await self._async_send(
                    {"_id": secrets.token_hex(3), "_type": "ping"}
                )
        except asyncio.CancelledError:
            raise
        except (AgoraError, aiohttp.ClientError, OSError) as err:
            self._logger.debug("Agora ping loop ended: %s", err)

    # --- helpers ------------------------------------------------------------

    def _primary_video_stream(self) -> RemoteVideoStream | None:
        """The stream to advertise in the answer.

        When the credentials name the printer, prefer it; the channel should
        only ever have one publisher, but being explicit costs nothing.
        """
        if not self._video_streams:
            return None

        device_uid = self._credentials.device_uid
        if device_uid is not None and device_uid in self._video_streams:
            return self._video_streams[device_uid]
        return next(iter(self._video_streams.values()))

    def _ortc_candidates(self) -> list[dict[str, Any]]:
        """Convert buffered browser candidates into Agora's ORTC form."""
        converted: list[dict[str, Any]] = []
        for candidate in self._candidates:
            raw = getattr(candidate, "candidate", None)
            if not raw:
                continue

            parts = raw.removeprefix("candidate:").split()
            if len(parts) < 8:
                continue

            try:
                converted.append(
                    {
                        "foundation": parts[0],
                        "protocol": parts[2],
                        "priority": int(parts[3]),
                        "ip": parts[4],
                        "port": int(parts[5]),
                        "type": parts[7],
                    }
                )
            except (TypeError, ValueError):
                continue

        return converted

    @staticmethod
    def _merge_edge_fingerprints(
        ortc: dict[str, Any],
        ap_response: AgoraResponse,
    ) -> None:
        """Add the AP's per-edge DTLS fingerprints if the join reply omitted them."""
        dtls = ortc.setdefault("dtlsParameters", {})
        fingerprints = dtls.setdefault("fingerprints", [])
        seen = {
            str(entry.get("fingerprint", "")).lower()
            for entry in fingerprints
            if entry.get("fingerprint")
        }

        for address in ap_response.addresses:
            if not address.fingerprint:
                continue

            algorithm, _, value = address.fingerprint.partition(" ")
            if not value:
                algorithm, value = "sha-256", address.fingerprint

            if value.lower() in seen:
                continue
            fingerprints.append({"hashFunction": algorithm, "fingerprint": value})
            seen.add(value.lower())

    def _build_join_message(
        self,
        *,
        session_id: str,
        ortc: dict[str, Any],
        ap_response: AgoraResponse,
        edge: EdgeAddress,
    ) -> dict[str, Any]:
        """Build the `join_v3` frame, including the encryption fields."""
        credentials = self._credentials

        # The SDK overwrites ap_response.ticket with the ticket belonging to
        # the edge it is actually dialling, and strips the address list.
        ap_payload = ap_response.as_join_payload()
        if edge.ticket:
            ap_payload["ticket"] = edge.ticket

        body: dict[str, Any] = {
            "p2p_id": 1,
            "session_id": session_id,
            "app_id": credentials.appid,
            "channel_key": credentials.rtc_token,
            "channel_name": credentials.channel,
            "sdk_version": SDK_VERSION,
            "browser": BROWSER_USER_AGENT,
            "process_id": f"process-{secrets.token_hex(8)}",
            "mode": CHANNEL_MODE,
            "codec": CHANNEL_CODEC,
            "role": JOIN_ROLE_HOST,
            "has_changed_gateway": False,
            "ap_response": ap_payload,
            "extend": "",
            "details": {},
            "features": {"rejoin": True},
            "attributes": {
                "userAttributes": {
                    "enableAudioMetadata": False,
                    "enableAudioPts": False,
                    "enablePublishedUserList": True,
                    "maxSubscription": 50,
                    "enableUserLicenseCheck": True,
                    "enableRTX": True,
                    "enableInstantVideo": False,
                    "enableDataStream2": False,
                    "enableAutFeedback": True,
                    "enableUserAutoRebalanceCheck": True,
                    "enableXR": True,
                    "enableLossbasedBwe": True,
                    "enableAutCC": True,
                    "enablePreallocPC": False,
                    "enablePubTWCC": False,
                    "enableSubTWCC": True,
                    "enablePubRTX": True,
                    "enableSubRTX": True,
                }
            },
            "join_ts": int(time.time() * 1000),
            "ortc": ortc,
        }

        body.update(self._encryption_fields())

        return {
            "_id": secrets.token_hex(3),
            "_type": "join_v3",
            "_message": body,
        }

    def _encryption_fields(self) -> dict[str, Any]:
        """The three-and-a-bit fields that turn on channel encryption.

        The wire names are `aes_mode`, `aes_secret`, `aes_encrypt` and
        `aes_salt` -- note they are NOT the names the SDK uses internally,
        where the same values live on `joinInfo` as `aesmode`, `aespassword`
        and `aessalt`. `aes_encrypt` marks `aes_secret` as RSA-wrapped rather
        than plain, and the SDK's `ENCRYPT_AES` default is on.

        `aes_mode` takes the hyphenated web spelling (`aes-256-gcm2`), not the
        `AES_256_GCM2` the Anycubic cloud hands out.
        """
        credentials = self._credentials
        if not credentials.is_encrypted or not credentials.encryption_key:
            self._logger.debug("Agora channel is not encrypted")
            return {}

        fields: dict[str, Any] = {
            "aes_mode": credentials.web_encryption_mode,
            "aes_secret": wrap_channel_key(credentials.encryption_key),
            "aes_encrypt": True,
        }
        if credentials.encryption_kdf_salt:
            fields["aes_salt"] = validate_kdf_salt(credentials.encryption_kdf_salt)

        self._logger.debug(
            "Agora channel encryption on: mode=%s wrapped_key=%d base64 chars salt=%s",
            fields["aes_mode"],
            len(fields["aes_secret"]),
            "present" if "aes_salt" in fields else "absent",
        )
        return fields

    async def _async_reset_socket(self) -> None:
        """Drop the current socket so the next edge starts clean."""
        await self._async_cancel(self._ping_task)
        self._ping_task = None
        await self._async_cancel(self._reader_task)
        self._reader_task = None

        self._joined = False
        self._stream_announced.clear()
        self._video_streams.clear()
        self._subscribed.clear()
        self._pending.clear()

        if self._ws is not None and not self._ws.closed:
            with contextlib.suppress(aiohttp.ClientError, OSError, TimeoutError):
                async with asyncio.timeout(WS_CLOSE_TIMEOUT):
                    await self._ws.close()
        self._ws = None

    @staticmethod
    async def _async_cancel(task: asyncio.Task[None] | None) -> None:
        """Cancel a background task and wait for it to unwind."""
        if task is None or task.done():
            return
        task.cancel()
        with contextlib.suppress(asyncio.CancelledError):
            await task


def _find_video_streams(payload: Any) -> list[tuple[int, int]]:
    """Walk a join reply for `(uid, ssrcId)` pairs describing video."""
    found: list[tuple[int, int]] = []
    seen: set[tuple[int, int]] = set()

    def visit(node: Any) -> None:
        if isinstance(node, dict):
            uid = node.get("uid")
            ssrc = node.get("ssrcId")
            looks_like_video = (
                node.get("video") is True
                or node.get("stream_type") == "video"
                or node.get("type") == "video"
                or node.get("codec") in ("h264", "h265")
                or node.get("rtxSsrcId") is not None
            )
            if looks_like_video and isinstance(uid, int) and isinstance(ssrc, int):
                key = (uid, ssrc)
                if key not in seen:
                    seen.add(key)
                    found.append(key)
            for value in node.values():
                visit(value)
        elif isinstance(node, list):
            for item in node:
                visit(item)

    visit(payload)
    return found
