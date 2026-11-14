"""A viewer on the printer's Kinesis Video WebRTC signalling channel (#49).

The second of Anycubic's two cloud camera transports. Some accounts get no
Agora block from the camera-open order, only temporary AWS credentials; the
slicer then joins the Kinesis Video Streams signalling channel named after the
printer's key, as a VIEWER, with the printer as MASTER.

That maps cleanly onto Home Assistant's WebRTC brokering: the browser is the
peer and makes the offer, exactly what a KVS viewer does. Home Assistant only
relays signalling -- the offer out, the answer and the printer's trickled ICE
candidates back, the browser's candidates out -- and the media goes straight
between the printer (or AWS's TURN relay) and the browser.

Flow, following the Kinesis Video WebRTC SDK:

1. ``DescribeSignalingChannel`` turns the channel name into its ARN.
2. ``GetSignalingChannelEndpoint`` (role VIEWER) gives the ``wss://`` endpoint.
3. Open the socket with a SigV4-presigned URL carrying the ARN and a client id.
4. Send ``SDP_OFFER``; the printer answers with ``SDP_ANSWER`` and then
   trickles ``ICE_CANDIDATE`` messages. Payloads are base64 JSON both ways.
"""

from __future__ import annotations

import asyncio
import base64
import contextlib
import json
import logging
import secrets
from collections.abc import Callable
from typing import TYPE_CHECKING, Any

import aiohttp
from webrtc_models import RTCIceCandidateInit

from .sigv4 import AwsCredentials, presigned_wss_url, signed_json_post

if TYPE_CHECKING:
    from anycubic_cloud_api import AnycubicKvsCredentials

HTTP_TIMEOUT = 10
WS_CONNECT_TIMEOUT = 10
WS_HEARTBEAT = 30
# The printer starts pushing a moment after the camera-open order. Its
# ``pushStarted`` report is the cue to send the offer; without one (no MQTT),
# the offer goes anyway after this long.
PUSH_READY_TIMEOUT = 8.0
PUSH_READY_POLL = 0.25
# An offer sent before the printer has joined the channel is simply lost, so
# it is sent again if no answer has come back. Only while no answer at all has
# arrived -- a second offer after an answer would make the printer start over.
OFFER_ATTEMPTS = 3
ANSWER_WAIT = 6.0

PUSH_STARTED = "pushStarted"
PUSH_FAILED_STATES = frozenset({"initFailed", "pushFailed"})


class KvsError(Exception):
    """Base class for every failure inside the Kinesis Video client."""


def _encode(payload: dict[str, Any]) -> str:
    return base64.b64encode(json.dumps(payload).encode()).decode()


def _decode(payload: str) -> dict[str, Any]:
    decoded = json.loads(base64.b64decode(payload))
    if not isinstance(decoded, dict):
        raise ValueError("payload is not an object")
    return decoded


class KvsStreamSession:
    """One viewer connection, for the lifetime of one browser stream."""

    def __init__(
        self,
        session: aiohttp.ClientSession,
        credentials: AnycubicKvsCredentials,
        logger: logging.Logger,
        on_candidate: Callable[[RTCIceCandidateInit], None],
        push_state: Callable[[], str | None] | None = None,
    ) -> None:
        """Prepare a session; nothing is contacted until `async_start`."""
        self._http = session
        self._region = credentials.region
        self._channel_name = credentials.channel_name
        self._aws = AwsCredentials(
            access_key_id=credentials.access_key_id,
            secret_access_key=credentials.secret_access_key,
            session_token=credentials.session_token,
        )
        self._logger = logger
        self._on_candidate = on_candidate
        self._push_state = push_state

        # Client ids are 1-256 of [a-zA-Z0-9_.-]; unique per viewer.
        self._client_id = f"ha-{secrets.token_hex(8)}"
        self._ws: aiohttp.ClientWebSocketResponse | None = None
        self._reader_task: asyncio.Task[None] | None = None
        self._answer: asyncio.Future[str] | None = None
        self._pending_candidates: list[RTCIceCandidateInit] = []
        self._offer_sent = False
        self._started = False
        self._closed = False

    # --- public interface ---------------------------------------------------

    @property
    def is_connected(self) -> bool:
        """Whether the signalling socket is open."""
        return not self._closed and self._ws is not None and not self._ws.closed

    async def async_start(self, offer_sdp: str, session_id: str) -> str:
        """Connect as a viewer and return the printer's answer SDP."""
        if self._started:
            raise KvsError("This Kinesis Video session has already been started")
        if self._closed:
            raise KvsError("This Kinesis Video session has already been closed")
        self._started = True

        try:
            return await self._async_start(offer_sdp, session_id)
        except (KvsError, asyncio.CancelledError):
            await self.async_close()
            raise
        except (aiohttp.ClientError, TimeoutError) as err:
            await self.async_close()
            raise KvsError(f"Could not reach Kinesis Video: {err}") from err
        except Exception as err:
            await self.async_close()
            raise KvsError(f"Unexpected failure starting the Kinesis Video session: {err}") from err

    async def async_add_candidate(self, candidate: RTCIceCandidateInit) -> None:
        """Send a browser ICE candidate to the printer, or hold it until the offer is out."""
        if self._closed:
            return
        if not self._offer_sent or not self.is_connected:
            self._pending_candidates.append(candidate)
            return
        await self._async_send_candidate(candidate)

    async def async_close(self) -> None:
        """Close the socket. Safe to call more than once."""
        if self._closed:
            return
        self._closed = True

        if self._answer is not None and not self._answer.done():
            self._answer.cancel()

        task, self._reader_task = self._reader_task, None
        if task is not None and task is not asyncio.current_task():
            task.cancel()
            with contextlib.suppress(asyncio.CancelledError, Exception):
                await task

        ws, self._ws = self._ws, None
        if ws is not None and not ws.closed:
            with contextlib.suppress(Exception):
                await ws.close()

    # --- the flow -----------------------------------------------------------

    async def _async_start(self, offer_sdp: str, session_id: str) -> str:
        channel_arn = await self._async_describe_channel()
        endpoint = await self._async_viewer_endpoint(channel_arn)

        url = presigned_wss_url(
            endpoint,
            {"X-Amz-ChannelARN": channel_arn, "X-Amz-ClientId": self._client_id},
            self._aws,
            self._region,
        )
        async with asyncio.timeout(WS_CONNECT_TIMEOUT):
            self._ws = await self._http.ws_connect(url, heartbeat=WS_HEARTBEAT)
        self._answer = asyncio.get_running_loop().create_future()
        self._reader_task = asyncio.create_task(
            self._async_reader(self._ws),
            name=f"anycubic kvs reader {session_id}",
        )

        await self._async_wait_for_push()

        offer = {"type": "offer", "sdp": offer_sdp}
        for attempt in range(1, OFFER_ATTEMPTS + 1):
            await self._async_send("SDP_OFFER", offer)
            if not self._offer_sent:
                self._offer_sent = True
                await self._async_flush_candidates()
            try:
                return await asyncio.wait_for(asyncio.shield(self._answer), ANSWER_WAIT)
            except TimeoutError:
                self._logger.debug(
                    "No answer from the printer on Kinesis Video (attempt %s of %s)",
                    attempt,
                    OFFER_ATTEMPTS,
                )

        raise KvsError(
            "The printer never answered on Kinesis Video. It may not have "
            "started its camera push -- check that it is on and online."
        )

    async def _async_describe_channel(self) -> str:
        info = await self._async_post(
            f"https://kinesisvideo.{self._region}.amazonaws.com/describeSignalingChannel",
            {"ChannelName": self._channel_name},
        )
        arn = (info.get("ChannelInfo") or {}).get("ChannelARN")
        if not isinstance(arn, str) or not arn:
            raise KvsError("Kinesis Video did not return the camera channel")
        return arn

    async def _async_viewer_endpoint(self, channel_arn: str) -> str:
        info = await self._async_post(
            f"https://kinesisvideo.{self._region}.amazonaws.com/getSignalingChannelEndpoint",
            {
                "ChannelARN": channel_arn,
                "SingleMasterChannelEndpointConfiguration": {
                    "Protocols": ["WSS", "HTTPS"],
                    "Role": "VIEWER",
                },
            },
        )
        for endpoint in info.get("ResourceEndpointList") or []:
            if isinstance(endpoint, dict) and endpoint.get("Protocol") == "WSS":
                address = endpoint.get("ResourceEndpoint")
                if isinstance(address, str) and address:
                    return address
        raise KvsError("Kinesis Video did not return a signalling endpoint")

    async def _async_post(self, url: str, payload: dict[str, Any]) -> dict[str, Any]:
        body, headers = signed_json_post(url, payload, self._aws, self._region)
        async with self._http.post(
            url,
            data=body,
            headers=headers,
            timeout=aiohttp.ClientTimeout(total=HTTP_TIMEOUT),
        ) as response:
            text = await response.text()
            if response.status >= 400:
                # AWS errors are JSON with a message; never echo the request.
                message = text[:200]
                with contextlib.suppress(ValueError, AttributeError):
                    parsed = json.loads(text)
                    message = parsed.get("message") or parsed.get("Message") or message
                raise KvsError(f"Kinesis Video refused the request ({response.status}): {message}")
            try:
                result = json.loads(text)
            except ValueError as err:
                raise KvsError("Kinesis Video sent an unreadable reply") from err
            if not isinstance(result, dict):
                raise KvsError("Kinesis Video sent an unreadable reply")
            return result

    async def _async_wait_for_push(self) -> None:
        """Hold the offer until the printer says it is pushing, for a while."""
        if self._push_state is None:
            return

        loop = asyncio.get_running_loop()
        deadline = loop.time() + PUSH_READY_TIMEOUT

        while loop.time() < deadline:
            state = self._push_state()
            if state == PUSH_STARTED:
                return
            if state in PUSH_FAILED_STATES:
                raise KvsError(f"The printer could not start its camera ({state})")
            await asyncio.sleep(PUSH_READY_POLL)

        self._logger.debug("No pushStarted from the printer; sending the offer anyway")

    # --- the socket ---------------------------------------------------------

    async def _async_send(self, action: str, payload: dict[str, Any]) -> None:
        if self._ws is None or self._ws.closed:
            raise KvsError("The Kinesis Video signalling socket is closed")
        await self._ws.send_str(json.dumps({"action": action, "messagePayload": _encode(payload)}))

    async def _async_send_candidate(self, candidate: RTCIceCandidateInit) -> None:
        payload: dict[str, Any] = {"candidate": candidate.candidate}
        if candidate.sdp_mid is not None:
            payload["sdpMid"] = candidate.sdp_mid
        if candidate.sdp_m_line_index is not None:
            payload["sdpMLineIndex"] = candidate.sdp_m_line_index
        await self._async_send("ICE_CANDIDATE", payload)

    async def _async_flush_candidates(self) -> None:
        pending, self._pending_candidates = self._pending_candidates, []
        for candidate in pending:
            await self._async_send_candidate(candidate)

    async def _async_reader(self, ws: aiohttp.ClientWebSocketResponse) -> None:
        try:
            async for message in ws:
                if message.type is aiohttp.WSMsgType.TEXT:
                    self._handle(message.data)
                elif message.type in (aiohttp.WSMsgType.CLOSED, aiohttp.WSMsgType.ERROR):
                    break
        finally:
            if self._answer is not None and not self._answer.done():
                self._answer.set_exception(
                    KvsError("Kinesis Video closed the signalling socket")
                )

    def _handle(self, raw: str) -> None:
        if not raw.strip():
            # KVS sends empty frames as keep-alives.
            return
        try:
            message = json.loads(raw)
        except ValueError:
            self._logger.debug("Ignoring unreadable Kinesis Video message")
            return
        if not isinstance(message, dict):
            return

        kind = message.get("messageType")

        if kind == "SDP_ANSWER":
            if self._answer is None or self._answer.done():
                return
            try:
                answer = _decode(message.get("messagePayload") or "")
                sdp = answer["sdp"]
            except (ValueError, KeyError, TypeError):
                self._answer.set_exception(KvsError("The printer sent an unreadable answer"))
                return
            self._answer.set_result(str(sdp))

        elif kind == "ICE_CANDIDATE":
            try:
                candidate = _decode(message.get("messagePayload") or "")
                text = candidate["candidate"]
            except (ValueError, KeyError, TypeError):
                self._logger.debug("Ignoring an unreadable ICE candidate from the printer")
                return
            index = candidate.get("sdpMLineIndex")
            self._on_candidate(
                RTCIceCandidateInit(
                    str(text),
                    sdp_mid=candidate.get("sdpMid"),
                    sdp_m_line_index=int(index) if isinstance(index, int) else None,
                )
            )

        elif kind == "STATUS_RESPONSE":
            status = message.get("statusResponse") or {}
            failed = bool(status.get("errorType")) or str(status.get("statusCode", "200")) != "200"
            if failed and self._answer is not None and not self._answer.done():
                self._answer.set_exception(
                    KvsError(
                        "Kinesis Video signalling error: "
                        + " ".join(
                            str(part)
                            for part in (
                                status.get("errorType"),
                                status.get("statusCode"),
                                status.get("description"),
                            )
                            if part
                        )
                    )
                )

        elif kind == "GO_AWAY":
            self._logger.debug("Kinesis Video asked the viewer to reconnect")
