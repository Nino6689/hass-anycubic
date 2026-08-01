"""Tests for pasted-token handling and auth-mode detection.

These cover the setup path users actually struggle with: what they paste is
often not a bare token, and they can't be expected to know which auth mode it
belongs to. Both are pure functions, so they're cheap to pin down thoroughly.
"""

from __future__ import annotations

import base64
import json
import time

import pytest
from anycubic_cloud_api.models.auth import (
    AnycubicAuthMode,
)

from custom_components.anycubic_cloud.helpers import (
    detect_auth_mode,
    extract_pasted_token,
    token_expiry_timestamp,
)

# A structurally valid JWT (header.payload.signature). Not a real credential.
JWT = "eyJhbGciOiJSUzI1NiIsImtpZCI6Ing0In0.eyJzdWIiOiIxMjM0NSIsIm5hbWUiOiJUZXN0In0.abcDEF-_123"
# Web tokens are opaque and roughly 238 characters.
WEB_TOKEN = "a1b2c3d4e5" * 24


def _jwt_expiring_in(days: float) -> str:
    """Build a JWT whose exp claim is `days` from now."""
    payload = base64.urlsafe_b64encode(json.dumps({"exp": int(time.time() + days * 86400)}).encode()).decode().rstrip("=")
    return f"eyJhbGciOiJSUzI1NiJ9.{payload}.signature"


class TestExtractPastedToken:
    """What users actually paste, rather than what we wish they'd paste."""

    @pytest.mark.parametrize(
        ("label", "pasted"),
        [
            ("bare", JWT),
            ("double quoted", f'"{JWT}"'),
            ("single quoted", f"'{JWT}'"),
            ("padded with whitespace", f"   {JWT}\n"),
            ("console copy() wrapper", f'copy("{JWT}")'),
            ("json fragment from a config", f'"access_token": "{JWT}",'),
            (
                "the whole slicer config",
                json.dumps({"anycubic_cloud": {"access_token": JWT, "autoLogin": True}}),
            ),
        ],
    )
    def test_recovers_jwt(self, label: str, pasted: str) -> None:
        assert extract_pasted_token(pasted) == JWT, label

    @pytest.mark.parametrize(
        ("label", "pasted"),
        [
            ("bare", WEB_TOKEN),
            ("quoted", f"'{WEB_TOKEN}'"),
            ("localStorage dump", json.dumps({"XX-Token": WEB_TOKEN})),
        ],
    )
    def test_recovers_opaque_web_token(self, label: str, pasted: str) -> None:
        assert extract_pasted_token(pasted) == WEB_TOKEN, label

    @pytest.mark.parametrize(
        "pasted",
        [None, "", "   ", "I don't know where my token is"],
    )
    def test_rejects_non_tokens(self, pasted: str | None) -> None:
        """Prose must be rejected so the user gets a helpful error, not a 401."""
        assert extract_pasted_token(pasted) is None


class TestDetectAuthMode:
    """The user shouldn't have to know which mode their token belongs to."""

    def test_jwt_is_slicer(self) -> None:
        assert detect_auth_mode(JWT) is AnycubicAuthMode.SLICER

    def test_opaque_is_web(self) -> None:
        assert detect_auth_mode(WEB_TOKEN) is AnycubicAuthMode.WEB

    def test_device_id_forces_android(self) -> None:
        """A device id is only ever supplied for the Android flow."""
        assert detect_auth_mode(JWT, "device-123") is AnycubicAuthMode.ANDROID
        assert detect_auth_mode(WEB_TOKEN, "device-123") is AnycubicAuthMode.ANDROID

    def test_missing_token_defaults_to_web(self) -> None:
        assert detect_auth_mode(None) is AnycubicAuthMode.WEB


class TestTokenExpiry:
    """Tokens are 90-day JWTs that can't be refreshed, so expiry matters."""

    def test_reads_exp_claim(self) -> None:
        expiry = token_expiry_timestamp(_jwt_expiring_in(30))
        assert expiry is not None
        # Allow a second of slack for test execution time.
        assert abs(expiry - (time.time() + 30 * 86400)) < 5

    def test_handles_expired_token(self) -> None:
        expiry = token_expiry_timestamp(_jwt_expiring_in(-1))
        assert expiry is not None
        assert expiry < time.time()

    @pytest.mark.parametrize(
        "token",
        [None, "", WEB_TOKEN, "not.a.jwt", "eyJbroken"],
    )
    def test_returns_none_when_no_expiry_available(self, token: str | None) -> None:
        """Web tokens carry no expiry; a malformed one must not raise."""
        assert token_expiry_timestamp(token) is None
