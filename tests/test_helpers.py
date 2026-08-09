"""Tests for the helper functions that shape what the user sees.

Most of these are small transforms, but they sit on the path between the cloud
payload and the dashboard, so a wrong one shows up as a mislabelled device or a
spool icon in the wrong colour.
"""

from __future__ import annotations

import base64
import json

import pytest
from helpers import PRINTER_ID

from custom_components.anycubic_cloud.helpers import (
    TOKEN_TYPE_EXPECTED,
    async_repair_access_token,
    build_ace_device_info,
    build_color_swatch_data_uri,
    describe_token,
    extract_panel_card_config,
    get_value_from_dict_if_type,
    remove_quotes_from_string,
    token_type_looks_wrong,
    update_dict_and_validate,
    validate_value_is_type,
)


def _svg(data_uri: str) -> str:
    """The SVG behind a base64 data URI."""
    return base64.b64decode(data_uri.split(",", 1)[1]).decode("utf-8")


class TestSpoolSwatch:
    """Slot icons are drawn as an inline SVG in the filament's own colour."""

    def test_a_single_colour_produces_a_swatch(self) -> None:
        uri = build_color_swatch_data_uri(["#FF0000"])

        assert uri is not None
        assert uri.startswith("data:image/svg+xml")

    def test_multi_colour_filament_shows_every_band(self) -> None:
        uri = build_color_swatch_data_uri(["#FF0000", "#00FF00", "#0000FF"])

        assert uri is not None
        for colour in ("FF0000", "00FF00", "0000FF"):
            assert colour in _svg(uri).upper()

    @pytest.mark.parametrize("bad", [None, [], ["not-a-colour"], ["#FFF"], ["#GGGGGG"]])
    def test_unusable_colours_produce_no_icon(self, bad) -> None:
        """A malformed colour should fall back to the default icon, not a broken one."""
        assert build_color_swatch_data_uri(bad) is None

    def test_valid_colours_survive_alongside_invalid_ones(self) -> None:
        uri = build_color_swatch_data_uri(["#FF0000", "garbage"])

        assert uri is not None
        assert "FF0000" in _svg(uri).upper()


class TestAceDeviceNaming:
    """A printer can have two ACE units, so they need distinguishable names."""

    def _data(self, model_id: int | None = 40001) -> dict:
        box_info = {} if model_id is None else {"model_id": model_id}
        return {
            "user_info": {"id": 999},
            "printers": {
                PRINTER_ID: {
                    "states": {"name": "Kobra S1", "id": PRINTER_ID},
                    "attributes": {"ace_spools": {"box_info": box_info}},
                }
            },
        }

    def test_primary_ace_is_named_after_its_printer(self) -> None:
        info = build_ace_device_info(self._data(), PRINTER_ID)

        assert "Kobra S1" in info["name"]

    def test_the_second_ace_is_distinguishable(self) -> None:
        first = build_ace_device_info(self._data(), PRINTER_ID)
        second = build_ace_device_info(self._data(), PRINTER_ID, secondary=True)

        assert first["name"] != second["name"]
        assert second["name"].endswith("2")

    def test_an_unknown_model_still_gets_a_name(self) -> None:
        """A new ACE model shouldn't produce a nameless device."""
        info = build_ace_device_info(self._data(model_id=99999), PRINTER_ID)

        assert info["name"]

    def test_a_missing_model_id_still_gets_a_name(self) -> None:
        info = build_ace_device_info(self._data(model_id=None), PRINTER_ID)

        assert info["name"]


class TestQuoteStripping:
    """Pasted values often arrive wrapped in quotes."""

    @pytest.mark.parametrize(
        ("raw", "expected"),
        [('"abc"', "abc"), ("'abc'", "abc"), ("abc", "abc")],
    )
    def test_quotes_are_removed(self, raw: str, expected: str) -> None:
        assert remove_quotes_from_string(raw) == expected

    def test_an_ambiguous_string_is_rejected(self) -> None:
        """Two quoted runs mean we'd be guessing which one is the token."""
        with pytest.raises(TypeError):
            remove_quotes_from_string('"abc" "def"')


class TestTypeValidation:
    """Card config comes from user-entered YAML, so types can't be assumed."""

    @pytest.mark.parametrize(
        ("value", "value_type", "expected"),
        [(True, bool, True), ("x", str, "x"), (1, str, None), (None, bool, None)],
    )
    def test_only_matching_types_pass(self, value, value_type, expected) -> None:
        assert validate_value_is_type(value, value_type) == expected

    def test_lists_are_rejected_unless_allowed(self) -> None:
        assert validate_value_is_type(["a"], str) is None

    def test_a_uniform_list_passes_when_allowed(self) -> None:
        assert validate_value_is_type(["a", "b"], str, allow_lists=True) == ["a", "b"]

    def test_a_mixed_list_is_rejected(self) -> None:
        assert validate_value_is_type(["a", 1], str, allow_lists=True) is None

    def test_a_missing_key_yields_nothing(self) -> None:
        assert get_value_from_dict_if_type({}, "absent", str) is None

    def test_a_wrongly_typed_key_is_not_copied(self) -> None:
        out: dict = {}
        update_dict_and_validate(out, {"vertical": "yes"}, "vertical", bool)

        assert out == {}

    def test_a_correctly_typed_key_is_copied(self) -> None:
        out: dict = {}
        update_dict_and_validate(out, {"vertical": True}, "vertical", bool)

        assert out == {"vertical": True}


class TestPanelCardConfig:
    """The card config is stored on the entry and replayed into the panel."""

    def test_an_empty_config_stays_empty(self) -> None:
        assert extract_panel_card_config({}) == {}

    def test_known_keys_are_kept(self) -> None:
        assert extract_panel_card_config({"vertical": True}) == {"vertical": True}

    def test_unknown_keys_are_dropped(self) -> None:
        """Only the card's own options should reach the panel."""
        result = extract_panel_card_config({"vertical": True, "not_a_card_option": 1})

        assert "not_a_card_option" not in result


class TestExternalShelves:
    """AnycubicPrinter uses __slots__, and a printer built with
    ignore_init_errors can leave _external_shelves unassigned entirely -- so the
    attribute raises AttributeError rather than returning None. The shelves
    object itself also exposes no public properties, only private slots.
    Reading either naively crashes every refresh.
    """

    def test_a_real_shelves_object_is_normalised(self) -> None:
        """Built by the actual library class, not a mock, so it fails if the
        upstream shape changes."""
        from anycubic_cloud_api.data_models.printer_properties import (
            AnycubicMachineExternalShelves,
        )

        from custom_components.anycubic_cloud.helpers import safe_external_shelves

        shelves = AnycubicMachineExternalShelves.from_json(
            {"id": 1, "type": "PLA", "color": [233, 157, 67], "loaded": 1, "status_type": -1, "current_status": -1}
        )
        printer = type("P", (), {"external_shelves": shelves})()

        assert safe_external_shelves(printer) == {
            "material": "PLA",
            "color": [233, 157, 67],
            "color_hex": "#E99D43",
            "loaded": True,
        }

    def test_an_unset_slot_is_not_an_error(self) -> None:
        """The failure mode that took the config entry down."""
        from custom_components.anycubic_cloud.helpers import safe_external_shelves

        class Unset:
            __slots__ = ("_external_shelves",)

            @property
            def external_shelves(self):
                return self._external_shelves  # never assigned -> AttributeError

        assert safe_external_shelves(Unset()) is None

    def test_a_printer_without_shelves_returns_none(self) -> None:
        from custom_components.anycubic_cloud.helpers import safe_external_shelves

        printer = type("P", (), {"external_shelves": None})()

        assert safe_external_shelves(printer) is None

    def test_an_empty_holder_reports_not_loaded(self) -> None:
        from anycubic_cloud_api.data_models.printer_properties import (
            AnycubicMachineExternalShelves,
        )

        from custom_components.anycubic_cloud.helpers import safe_external_shelves

        shelves = AnycubicMachineExternalShelves.from_json(
            {"id": 1, "type": "", "color": [], "loaded": 0, "status_type": -1, "current_status": -1}
        )
        printer = type("P", (), {"external_shelves": shelves})()
        result = safe_external_shelves(printer)

        assert result["loaded"] is False
        assert result["material"] is None
        assert result["color_hex"] is None


class TestTokenDiagnostics:
    """Anycubic issues several JWTs; only one is accepted.

    Reported on #8: a valid-looking 1234-char token from a memory dump was
    refused with "User does not exist" — the server's answer to a real token
    of the wrong kind, which reads like an account problem and isn't one.
    """

    def _token(self, claims):
        import base64
        import json

        body = base64.urlsafe_b64encode(json.dumps(claims).encode()).decode().rstrip("=")
        return f"eyJhbGciOiJSUzI1NiJ9.{body}.signature"

    GOOD = {
        "tokenType": "access-token",
        "scope": "read",
        "iss": "https://uc.makeronline.com",
        "aud": ["b269a3136d26ac6488bb"],
        "email": "someone@example.com",
        "sub": "abc",
        "id": "abc",
        "phone": "123",
    }

    def test_the_expected_type_matches_a_real_working_token(self):
        assert TOKEN_TYPE_EXPECTED == "access-token"

    def test_a_good_token_is_not_flagged(self):
        assert token_type_looks_wrong(self._token(self.GOOD)) is None

    @pytest.mark.parametrize("kind", ["refresh-token", "id-token", "something-else"])
    def test_the_wrong_type_is_named(self, kind):
        token = self._token({**self.GOOD, "tokenType": kind})

        assert token_type_looks_wrong(token) == kind

    @pytest.mark.parametrize("token", [None, "", "not-a-jwt", "eyJ-but-not-really", "eyJhbGci.only-two"])
    def test_unreadable_tokens_are_not_flagged(self, token):
        """Only a positive, contradictory answer is worth telling the user."""
        assert token_type_looks_wrong(token) is None

    def test_a_token_that_does_not_say_is_not_flagged(self):
        claims = {k: v for k, v in self.GOOD.items() if k != "tokenType"}

        assert token_type_looks_wrong(self._token(claims)) is None

    def test_the_description_excludes_identifying_claims(self):
        """This goes into debug logs that get pasted into issue reports."""
        described = describe_token(self._token(self.GOOD))

        assert set(described) == {"tokenType", "scope", "iss", "aud"}
        for leaked in ("email", "sub", "id", "phone"):
            assert leaked not in described


class TestAccessTokenCorruption:
    """Local signature verification of pasted Casdoor access tokens.

    The server answers every invalid token -- corrupted, truncated, stale or
    nonsense -- with the same "User does not exist" (fingerprinted against the
    real endpoint, issue #8). Catching a damaged token locally is the only way
    to give its owner an honest error message.

    The keypair below was generated for these tests and signs nothing real.
    """

    JWK = {
        "kid": "test",
        "kty": "RSA",
        "alg": "RS256",
        "n": (
            "r6zHZNbeklIcc56V2yKLJkdYXTIRLxAAXGxVx3sCWCzrLX3fsaioqmko6kVfqDVQ"
            "MtmcUwWsUlN0BGm4dm64n5vGL48DudRJggUiZXA3vcHMrlZ6AA7hSqZbk0QE07o7"
            "no6fcShVGXtTYxp7neaSXeXji00eMIhCFeu9TxKHaH8"
        ),
        "e": "AQAB",
    }
    SIGNED = (
        "eyJhbGciOiAiUlMyNTYiLCAia2lkIjogInRlc3QiLCAidHlwIjogIkpXVCJ9."
        "eyJpc3MiOiAiaHR0cHM6Ly91Yy5tYWtlcm9ubGluZS5jb20iLCAidG9rZW5UeXBl"
        "IjogImFjY2Vzcy10b2tlbiIsICJleHAiOiA0MTAyNDQ0ODAwfQ."
        "FJ0IU0ssvEuA6aOz5q0mTeOegbi8NKeYa2fBu6Ffr3m08F2mWvLRiVAzXdgKBX79"
        "yqsUWx0RNC_2HiSbo8TMYcsi-3cMrZdPSdLyfIkAfdul-u9DYqqewejdcrUFWhMd"
        "Z3BkThxsws2CYUW0DshJq5VNrEMiziHBiNymuLqvVnU"
    )

    class _Session:
        """The two aiohttp behaviours the helper touches, nothing more."""

        def __init__(self, jwks=None, exc=None):
            self._jwks = jwks
            self._exc = exc
            self.requests = 0

        async def get(self, url, **kwargs):
            self.requests += 1
            if self._exc:
                raise self._exc
            return self

        def raise_for_status(self):
            pass

        async def json(self, content_type=None):
            return self._jwks

    def _session(self, **kwargs):
        return self._Session(jwks={"keys": [self.JWK]}, **kwargs)

    async def test_an_intact_token_passes_through_untouched(self):
        token, corrupt = await async_repair_access_token(self._session(), self.SIGNED)

        assert not corrupt
        assert token == self.SIGNED

    async def test_a_flipped_signature_character_is_caught(self):
        tail = "A" if not self.SIGNED.endswith("A") else "B"

        _token, corrupt = await async_repair_access_token(self._session(), self.SIGNED[:-1] + tail)

        assert corrupt

    async def test_a_tampered_payload_is_caught(self):
        head, payload, sig = self.SIGNED.split(".")
        # Re-encode the claims with one value changed; signature now lies.
        claims = json.loads(base64.urlsafe_b64decode(payload + "=" * (-len(payload) % 4)))
        claims["tokenType"] = "refresh-token"
        forged = base64.urlsafe_b64encode(json.dumps(claims).encode()).decode().rstrip("=")

        _token, corrupt = await async_repair_access_token(self._session(), f"{head}.{forged}.{sig}")

        assert corrupt

    async def test_a_missing_signature_segment_is_caught_without_network(self):
        """A truncated copy that lost the third segment is judged locally."""
        head, payload, _sig = self.SIGNED.split(".")
        session = self._session()

        _token, corrupt = await async_repair_access_token(session, f"{head}.{payload}")

        assert corrupt
        assert session.requests == 0

    async def test_other_issuers_are_never_judged(self):
        """Anycubic's own HS512 user tokens have no published key to check."""
        body = base64.urlsafe_b64encode(json.dumps({"user_id": 1, "mode": "web"}).encode()).decode().rstrip("=")
        token = f"eyJhbGciOiJIUzUxMiJ9.{body}.bogus-signature"
        session = self._session()

        checked, corrupt = await async_repair_access_token(session, token)

        assert not corrupt
        assert checked == token
        assert session.requests == 0

    async def test_an_unreachable_key_endpoint_never_blocks_login(self):
        """No network is no verdict -- the server stays the authority."""
        session = self._Session(exc=OSError("no route"))

        _token, corrupt = await async_repair_access_token(session, self.SIGNED)

        assert not corrupt

    async def test_an_empty_key_set_never_blocks_login(self):
        """Anycubic's China auth server publishes a JWKS with no keys in it.

        An empty list is not None, so the fail-open guard passed it straight
        through to a verification loop that then could not run even once --
        and a loop that never runs vindicates nothing, so every China token
        fell out of the far end labelled corrupt (issue #13). Having no key
        to check against is the same predicament as being unable to fetch
        one, and must reach the same answer.
        """
        session = self._Session(jwks={"keys": []})

        checked, corrupt = await async_repair_access_token(session, self.SIGNED)

        assert not corrupt
        assert checked == self.SIGNED

    @pytest.mark.parametrize("surplus", [1, 8, 40])
    async def test_trailing_bytes_are_trimmed_and_the_token_used(self, surplus):
        """The #8 resolution: a dump match that ran past the signature's end.

        The regex that finds a JWT in raw memory keeps matching base64 into
        whatever bytes follow it, so the token is too LONG rather than
        damaged. It decodes perfectly and the server still refuses it. The
        key's modulus says exactly where the signature ends, so the surplus
        can be cut and the token used as-is.
        """
        padded = self.SIGNED + "A" * surplus

        token, corrupt = await async_repair_access_token(self._session(), padded)

        assert not corrupt
        assert token == self.SIGNED

    async def test_a_short_signature_is_not_padded_into_working(self):
        """Only ever shorten. Missing bytes are real damage, not surplus."""
        _token, corrupt = await async_repair_access_token(self._session(), self.SIGNED[:-8])

        assert corrupt
