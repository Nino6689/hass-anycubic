"""The Agora Access Point hop -- "choose_server".

Before a channel can be joined, one HTTPS POST asks Agora which SD-RTN edge to
talk to. There is no signature and no nonce anywhere in this request: `opid` is
a plain random integer, `sid` is 32 random hex characters, and the only
credential is the `rtc_token` passed through verbatim as `key`.

Adapted from `Jezza34000/homeassistant_petkit` (MIT), whose Agora client is in
turn based on the original reverse engineering by @mikey0000.
"""

from __future__ import annotations

import asyncio
import json
import secrets
import time
from dataclasses import dataclass, field
from typing import Any

import aiohttp

from .const import (
    AP_AREA_CODE,
    AP_BACKUP_DELAY,
    AP_DETAIL_AREA,
    AP_DETAIL_AREA_ALT,
    AP_DETAIL_ROLE,
    AP_DOMAINS,
    AP_DOMAINS_BACKUP,
    AP_PATH,
    AP_REGION_DOMAIN,
    AP_REGION_DOMAIN_BACKUP,
    AP_REQUEST_TIMEOUT,
    AP_ROLE_HOST,
    AP_SERVICE_IDS,
    AP_URI_CHOOSE_SERVER,
    DETAIL_FINGERPRINTS,
    DETAIL_REGION,
    LOGGER,
    RESPONSE_FLAG_CHOOSE_SERVER,
)
from .errors import AgoraAccessPointError


@dataclass(slots=True, frozen=True)
class EdgeAddress:
    """One candidate SD-RTN edge server."""

    ip: str
    port: int
    ticket: str = ""
    fingerprint: str | None = None

    @property
    def websocket_url(self) -> str:
        """The gateway websocket URL for this edge."""
        # Dots become dashes so the host matches Agora's *.edge.agora.io
        # wildcard certificate; connecting to the bare IP would fail TLS
        # verification, and disabling verification is not an acceptable fix.
        return f"wss://{self.ip.replace('.', '-')}.edge.agora.io:{self.port}"


@dataclass(slots=True)
class AgoraResponse:
    """A parsed choose-server response."""

    code: int
    uid: int
    cid: int
    cname: str
    ticket: str
    flag: int
    opid: int
    server_ts: int
    detail: dict[str, Any] = field(default_factory=dict)
    addresses: list[EdgeAddress] = field(default_factory=list)

    @property
    def region(self) -> str | None:
        """The region Agora wants subsequent lookups sent to, if any.

        `detail[23]` is a redirect hint, not an instruction about this
        response -- the addresses returned alongside it are still usable.
        """
        region = self.detail.get(DETAIL_REGION)
        return region.lower() if isinstance(region, str) and region else None

    def as_join_payload(self) -> dict[str, Any]:
        """Render the `ap_response` block echoed back inside `join_v3`."""
        return {
            "code": self.code,
            "server_ts": self.server_ts,
            "uid": self.uid,
            "cid": self.cid,
            "cname": self.cname,
            "detail": self.detail,
            "flag": self.flag,
            "opid": self.opid,
            "cert": self.ticket,
            "ticket": self.ticket,
        }


def _parse_response(payload: dict[str, Any]) -> AgoraResponse:
    """Turn the raw AP JSON into an `AgoraResponse`, or raise."""
    response_bodies = payload.get("response_body") or []
    if not response_bodies:
        raise AgoraAccessPointError("Access Point returned no response body")

    base_detail = payload.get("detail") or {}
    blocks: dict[int, AgoraResponse] = {}

    for item in response_bodies:
        buffer = item.get("buffer") or {}
        code = int(buffer.get("code", -1))
        if code != 0:
            LOGGER.debug(
                "Access Point block flag=%s rejected with code=%s",
                buffer.get("flag"),
                code,
            )
            continue

        detail = {**base_detail, **(buffer.get("detail") or {})}

        # detail[19] is a ';'-separated list of DTLS fingerprints, positionally
        # matched to the edge list -- the Nth fingerprint belongs to the Nth
        # address, so they cannot be sorted or deduplicated.
        fingerprints = [
            fingerprint.strip()
            for fingerprint in str(detail.get(DETAIL_FINGERPRINTS, "")).split(";")
            if fingerprint.strip()
        ]

        addresses = [
            EdgeAddress(
                ip=str(edge["ip"]),
                port=int(edge["port"]),
                ticket=str(buffer.get("cert", "")),
                fingerprint=fingerprints[index] if index < len(fingerprints) else None,
            )
            for index, edge in enumerate(buffer.get("edges_services") or [])
            if edge.get("ip") and edge.get("port")
        ]

        flag = int(buffer.get("flag", 0))
        blocks[flag] = AgoraResponse(
            code=code,
            uid=int(buffer.get("uid", 0)),
            cid=int(buffer.get("cid", 0)),
            cname=str(buffer.get("cname", "")),
            ticket=str(buffer.get("cert", "")),
            flag=flag,
            opid=int(payload.get("opid", 0)),
            server_ts=int(payload.get("enter_ts", int(time.time() * 1000))),
            detail=detail,
            addresses=addresses,
        )

    if not blocks:
        raise AgoraAccessPointError(
            "Access Point accepted the request but every service block failed"
        )

    chosen = blocks.get(RESPONSE_FLAG_CHOOSE_SERVER) or next(iter(blocks.values()))
    if not chosen.addresses:
        raise AgoraAccessPointError("Access Point returned no gateway addresses")

    return chosen


def _build_request(
    *,
    app_id: str,
    channel: str,
    rtc_token: str,
    uid: int,
) -> dict[str, Any]:
    """Build the choose-server request body.

    `detail[6]` (the string uid) is deliberately absent: the SDK only sets it
    when the caller joined with a string uid, and sending it alongside a
    numeric uid tells Agora to expect a string-uid join.
    """
    return {
        "appid": app_id,
        "client_ts": int(time.time() * 1000),
        "opid": secrets.randbelow(10**12),
        "sid": secrets.token_hex(16).upper(),
        "request_bodies": [
            {
                "uri": AP_URI_CHOOSE_SERVER,
                "buffer": {
                    "cname": channel,
                    "detail": {
                        AP_DETAIL_AREA: AP_AREA_CODE,
                        AP_DETAIL_ROLE: AP_ROLE_HOST,
                        AP_DETAIL_AREA_ALT: AP_AREA_CODE,
                    },
                    "key": rtc_token,
                    "service_ids": list(AP_SERVICE_IDS),
                    "uid": uid,
                },
            }
        ],
    }


class AgoraAccessPoint:
    """Resolves a channel to a list of SD-RTN edge servers."""

    def __init__(self, session: aiohttp.ClientSession) -> None:
        """Store the shared HTTP session."""
        self._session = session

    async def async_choose_server(
        self,
        *,
        app_id: str,
        channel: str,
        rtc_token: str,
        uid: int,
        region: str | None = None,
    ) -> AgoraResponse:
        """Return the edges serving `channel`.

        The two primary domains are raced; the backups only start if neither
        primary has answered within `AP_BACKUP_DELAY`, so the common case
        costs one request pair.
        """
        request = _build_request(
            app_id=app_id,
            channel=channel,
            rtc_token=rtc_token,
            uid=uid,
        )
        body = json.dumps(request)

        primaries: tuple[str, ...]
        backups: tuple[str, ...]
        if region:
            primaries = (AP_REGION_DOMAIN.format(region=region),)
            backups = (AP_REGION_DOMAIN_BACKUP.format(region=region),)
        else:
            primaries, backups = AP_DOMAINS, AP_DOMAINS_BACKUP

        LOGGER.debug(
            "Agora AP lookup: channel=%s uid=%s region=%s token_len=%d",
            channel,
            uid,
            region or "default",
            len(rtc_token),
        )

        payload = await self._async_race(body, primaries, backups)
        response = _parse_response(payload)

        LOGGER.debug(
            "Agora AP lookup returned %d edge(s) for cid=%s (region hint %s)",
            len(response.addresses),
            response.cid,
            response.region or "none",
        )
        return response

    async def _async_race(
        self,
        body: str,
        primaries: tuple[str, ...],
        backups: tuple[str, ...],
    ) -> dict[str, Any]:
        """Post to several domains at once and take the first success."""
        tasks = {
            asyncio.ensure_future(self._async_post(domain, body, delay=0.0)): domain
            for domain in primaries
        }
        tasks |= {
            asyncio.ensure_future(
                self._async_post(domain, body, delay=AP_BACKUP_DELAY)
            ): domain
            for domain in backups
        }

        errors: list[str] = []
        try:
            pending = set(tasks)
            while pending:
                done, pending = await asyncio.wait(
                    pending, return_when=asyncio.FIRST_COMPLETED
                )
                for task in done:
                    try:
                        return task.result()
                    except (
                        TimeoutError,
                        aiohttp.ClientError,
                        ValueError,
                    ) as err:
                        errors.append(f"{tasks[task]}: {err}")
        finally:
            for task in tasks:
                if not task.done():
                    task.cancel()
            await asyncio.gather(*tasks, return_exceptions=True)

        raise AgoraAccessPointError(
            "Every Agora Access Point endpoint failed: " + "; ".join(errors)
        )

    async def _async_post(
        self,
        domain: str,
        body: str,
        *,
        delay: float,
    ) -> dict[str, Any]:
        """Post the request blob to one AP domain."""
        if delay:
            await asyncio.sleep(delay)

        # A single multipart field literally named `request`. Not a JSON body,
        # not form-urlencoded -- the AP rejects both.
        form = aiohttp.FormData()
        form.add_field("request", body, content_type="application/json")

        async with self._session.post(
            f"https://{domain}{AP_PATH}",
            data=form,
            timeout=aiohttp.ClientTimeout(total=AP_REQUEST_TIMEOUT),
        ) as response:
            if response.status != 200:
                raise ValueError(f"HTTP {response.status}")
            # The AP answers with `text/plain`, so let aiohttp skip the
            # content-type check rather than refusing to decode valid JSON.
            payload: dict[str, Any] = await response.json(content_type=None)
            return payload
