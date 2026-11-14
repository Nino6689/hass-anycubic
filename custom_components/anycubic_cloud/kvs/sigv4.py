"""AWS Signature Version 4, just enough for Kinesis Video signalling.

Two shapes are needed and nothing else: a signed JSON POST for the control
plane (find the channel, find its endpoint), and a presigned ``wss://`` URL
for the signalling socket. Written against the published SigV4 algorithm, with
the standard library only -- pulling in botocore for three requests would add
megabytes to every install.

The presigned URL follows what the Kinesis Video WebRTC SDK does: only
``host`` is signed, the session token goes in the query *before* signing, and
the URL is valid for 299 seconds (the socket only has to open within that).
"""

from __future__ import annotations

import hashlib
import hmac
import json
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any
from urllib.parse import quote, urlsplit

ALGORITHM = "AWS4-HMAC-SHA256"
SERVICE = "kinesisvideo"
PRESIGN_EXPIRES = 299


@dataclass(frozen=True, slots=True)
class AwsCredentials:
    """Temporary STS credentials. Never logged."""

    access_key_id: str
    secret_access_key: str
    session_token: str | None = None

    def __repr__(self) -> str:
        return "AwsCredentials(<redacted>)"


def _hmac(key: bytes, message: str) -> bytes:
    return hmac.new(key, message.encode(), hashlib.sha256).digest()


def _sha256_hex(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def _uri_encode(value: str) -> str:
    """RFC 3986 encoding, as SigV4 requires: only unreserved characters stay."""
    return quote(value, safe="-_.~")


def _signing_key(secret: str, date: str, region: str, service: str) -> bytes:
    key = _hmac(f"AWS4{secret}".encode(), date)
    key = _hmac(key, region)
    key = _hmac(key, service)
    return _hmac(key, "aws4_request")


def _timestamps(now: datetime | None) -> tuple[str, str]:
    moment = (now or datetime.now(UTC)).astimezone(UTC)
    amz_date = moment.strftime("%Y%m%dT%H%M%SZ")
    return amz_date, amz_date[:8]


def _signature(
    credentials: AwsCredentials,
    region: str,
    service: str,
    amz_date: str,
    date: str,
    canonical_request: str,
) -> tuple[str, str]:
    """Return (credential scope, hex signature) for a canonical request."""
    scope = f"{date}/{region}/{service}/aws4_request"
    string_to_sign = "\n".join(
        (ALGORITHM, amz_date, scope, _sha256_hex(canonical_request.encode()))
    )
    key = _signing_key(credentials.secret_access_key, date, region, service)
    return scope, hmac.new(key, string_to_sign.encode(), hashlib.sha256).hexdigest()


def signed_json_post(
    url: str,
    payload: dict[str, Any],
    credentials: AwsCredentials,
    region: str,
    *,
    service: str = SERVICE,
    now: datetime | None = None,
) -> tuple[bytes, dict[str, str]]:
    """Body and headers for a signed ``POST`` of ``payload`` as JSON."""
    parts = urlsplit(url)
    host = parts.netloc
    path = quote(parts.path or "/", safe="/-_.~")
    body = json.dumps(payload, separators=(",", ":")).encode()
    amz_date, date = _timestamps(now)

    headers = {
        "content-type": "application/json",
        "host": host,
        "x-amz-date": amz_date,
    }
    if credentials.session_token:
        headers["x-amz-security-token"] = credentials.session_token

    names = sorted(headers)
    canonical_headers = "".join(f"{name}:{headers[name].strip()}\n" for name in names)
    signed_headers = ";".join(names)

    canonical_request = "\n".join(
        ("POST", path, "", canonical_headers, signed_headers, _sha256_hex(body))
    )
    scope, signature = _signature(
        credentials, region, service, amz_date, date, canonical_request
    )

    headers["authorization"] = (
        f"{ALGORITHM} Credential={credentials.access_key_id}/{scope}, "
        f"SignedHeaders={signed_headers}, Signature={signature}"
    )
    # aiohttp sets Host itself from the URL; sending it twice is an error.
    del headers["host"]
    return body, headers


def presigned_wss_url(
    endpoint: str,
    query: dict[str, str],
    credentials: AwsCredentials,
    region: str,
    *,
    service: str = SERVICE,
    expires: int = PRESIGN_EXPIRES,
    now: datetime | None = None,
) -> str:
    """A ``wss://`` URL carrying its own signature in the query string."""
    parts = urlsplit(endpoint)
    host = parts.netloc
    path = parts.path or "/"
    amz_date, date = _timestamps(now)
    scope = f"{date}/{region}/{service}/aws4_request"

    params = {
        **query,
        "X-Amz-Algorithm": ALGORITHM,
        "X-Amz-Credential": f"{credentials.access_key_id}/{scope}",
        "X-Amz-Date": amz_date,
        "X-Amz-Expires": str(expires),
        "X-Amz-SignedHeaders": "host",
    }
    if credentials.session_token:
        params["X-Amz-Security-Token"] = credentials.session_token

    canonical_query = "&".join(
        f"{_uri_encode(key)}={_uri_encode(params[key])}" for key in sorted(params)
    )
    canonical_request = "\n".join(
        ("GET", path, canonical_query, f"host:{host}\n", "host", _sha256_hex(b""))
    )
    _, signature = _signature(credentials, region, service, amz_date, date, canonical_request)

    return f"wss://{host}{path}?{canonical_query}&X-Amz-Signature={signature}"
