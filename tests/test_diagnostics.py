"""Tests for the diagnostics download.

Diagnostics get pasted into public issue reports, so the important property
is not that it produces output -- it's that nothing identifying survives.
"""

from __future__ import annotations

import json
from unittest.mock import AsyncMock

import pytest
from helpers import PRINTER_ID
from helpers import setup_entry as _setup
from homeassistant.core import HomeAssistant

from custom_components.anycubic_cloud.diagnostics import (
    TaggedRedacter,
    async_get_config_entry_diagnostics,
    json_dict_or_value,
    parse_all_json_data,
    redact_secrets,
)

SECRET = "super-secret-value"


class TestTaggedRedacter:
    """Ids are replaced consistently so a report is still readable."""

    def test_same_value_gets_the_same_tag(self) -> None:
        redacter = TaggedRedacter()
        out = redacter.redact_data({"id": SECRET, "nested": {"user_id": SECRET}}, {"id", "user_id"})

        assert out["id"] == out["nested"]["user_id"], "one value should map to one tag, so relationships stay traceable"
        assert SECRET not in json.dumps(out)

    def test_different_values_get_different_tags(self) -> None:
        redacter = TaggedRedacter()
        out = redacter.redact_data({"id": "one", "user_id": "two"}, {"id", "user_id"})

        assert out["id"] != out["user_id"]

    def test_redacts_inside_lists(self) -> None:
        redacter = TaggedRedacter()
        out = redacter.redact_data({"printers": [{"id": SECRET}]}, {"id"})

        assert SECRET not in json.dumps(out)

    def test_leaves_untargeted_keys_alone(self) -> None:
        redacter = TaggedRedacter()
        out = redacter.redact_data({"id": SECRET, "name": "Kobra S1"}, {"id"})

        assert out["name"] == "Kobra S1"

    @pytest.mark.parametrize("empty", [None, ""])
    def test_empty_values_are_not_tagged(self, empty) -> None:
        """Tagging an absent id would imply data that isn't there."""
        redacter = TaggedRedacter()
        out = redacter.redact_data({"id": empty}, {"id"})

        assert out["id"] == empty

    def test_scalars_pass_through(self) -> None:
        assert TaggedRedacter().redact_data("plain", {"id"}) == "plain"


class TestJsonUnpacking:
    """The cloud returns JSON inside JSON; unpacking makes reports readable."""

    def test_json_string_is_expanded_and_marked(self) -> None:
        out = json_dict_or_value('{"a": 1}')

        assert out["a"] == 1
        assert out["__JSON_STRING_PARSED__"] is True

    @pytest.mark.parametrize("value", ["not json", "[1, 2]", "12"])
    def test_non_object_strings_are_left_as_is(self, value: str) -> None:
        assert json_dict_or_value(value) == value

    def test_nested_structures_are_walked(self) -> None:
        out = parse_all_json_data({"outer": [{"inner": '{"b": 2}'}]})

        assert out["outer"][0]["inner"]["b"] == 2

    @pytest.mark.parametrize("value", [1, None, True])
    def test_non_strings_pass_through(self, value) -> None:
        assert parse_all_json_data(value) == value


class TestDiagnosticsOutput:
    """The real download, against the fixture printer."""

    @pytest.fixture
    def api_with_raw_data(self, mock_api):
        api, printer = mock_api
        api.get_user_info = AsyncMock(return_value={"data": {"id": 999, "user_email": "nino@example.com"}})
        api.list_my_printers = AsyncMock(return_value={"data": [{"id": PRINTER_ID, "machine_mac": "AA:BB:CC:DD:EE:FF"}]})
        api.list_all_projects = AsyncMock(return_value={"data": []})
        api.printer_info_for_id = AsyncMock(return_value={"data": {"id": PRINTER_ID, "key": "printer-key"}})
        return api, printer

    async def test_identifying_data_is_removed(self, hass: HomeAssistant, mock_entry, api_with_raw_data) -> None:
        api, printer = api_with_raw_data
        # Setup needs the printer object; diagnostics needs the raw dict.
        api.printer_info_for_id = AsyncMock(return_value=printer)
        await _setup(hass, mock_entry)
        api.printer_info_for_id = AsyncMock(return_value={"data": {"id": PRINTER_ID, "key": "printer-key"}})

        result = await async_get_config_entry_diagnostics(hass, mock_entry)
        dumped = json.dumps(result)

        assert "nino@example.com" not in dumped
        assert "AA:BB:CC:DD:EE:FF" not in dumped
        assert "printer-key" not in dumped

    async def test_token_never_appears(self, hass: HomeAssistant, mock_entry, api_with_raw_data) -> None:
        """The token is account access; it must not reach a bug report."""
        api, printer = api_with_raw_data
        api.printer_info_for_id = AsyncMock(return_value=printer)
        await _setup(hass, mock_entry)
        api.printer_info_for_id = AsyncMock(return_value={"data": {}})

        result = await async_get_config_entry_diagnostics(hass, mock_entry)

        assert mock_entry.data["user_token"] not in json.dumps(result)


JWT = "eyJhbGciOiJSUzI1NiJ9.eyJlbWFpbCI6Im5pbm9AZXhhbXBsZS5jb20ifQ.c2lnbmF0dXJl"


class TestRedactSecrets:
    """The last pass catches credentials whatever key they turn up under."""

    @pytest.mark.parametrize("key", ["casdoor_user_token", "some_new_Token", "app_secret", "password", "user_activation_key"])
    def test_secret_keys_are_redacted(self, key: str) -> None:
        assert redact_secrets({"a": [{key: SECRET}]}) == {"a": [{key: "**REDACTED**"}]}

    def test_a_jwt_is_redacted_under_any_key(self) -> None:
        assert redact_secrets({"note": JWT, "list": [JWT]}) == {"note": "**REDACTED**", "list": ["**REDACTED**"]}

    @pytest.mark.parametrize("value", ["eyJ-not-a-jwt", "a.b.c", "1.2.3.4", None, 7])
    def test_ordinary_values_pass_through(self, value) -> None:
        assert redact_secrets({"v": value}) == {"v": value}

    def test_empty_secret_fields_stay_empty(self) -> None:
        """An absent token is useful to see; it is not a leak."""
        assert redact_secrets({"user_token": "", "auth_token": None}) == {"user_token": "", "auth_token": None}


class TestReportedLeaks:
    """Everything #33 found in a real download."""

    @pytest.fixture
    def api_with_leaky_data(self, mock_api):
        api, printer = mock_api
        api.get_user_info = AsyncMock(
            return_value={
                "data": {
                    "id": 999,
                    "casdoor_user_token": JWT,
                    "user_activation_key": "activation-secret",
                    "tourist_device_id": "tourist-device",
                    "user_url": "https://avatar.example/nino.png",
                }
            }
        )
        api.list_my_printers = AsyncMock(return_value={"data": [{"id": PRINTER_ID, "description": "4b4f42524158534e"}]})
        api.list_all_projects = AsyncMock(
            return_value={
                "data": [
                    {
                        "id": 77,
                        "name": "Secret prototype",
                        "gcode_name": "secret_prototype.gcode",
                        "display_filename": "Secret prototype.3mf",
                        "img": "https://images.example/secret.png",
                        "print_status": 2,
                    }
                ]
            }
        )
        api.project_info_for_id = AsyncMock(return_value={"data": {"id": 77, "filename": "secret_prototype.gcode"}})
        return api, printer

    async def test_nothing_from_the_report_survives(self, hass: HomeAssistant, mock_entry, api_with_leaky_data) -> None:
        api, printer = api_with_leaky_data
        api.printer_info_for_id = AsyncMock(return_value=printer)
        await _setup(hass, mock_entry)
        api.printer_info_for_id = AsyncMock(return_value={"data": {"base": {"description": "4b4f42524158534e"}}})

        result = await async_get_config_entry_diagnostics(hass, mock_entry)
        dumped = json.dumps(result)

        for leaked in (
            JWT,
            "activation-secret",
            "tourist-device",
            "avatar.example",
            "4b4f42524158534e",
            "Secret prototype",
            "secret_prototype",
            "images.example",
            str(PRINTER_ID),
        ):
            assert leaked not in dumped, leaked
        # The history itself stays: its status is what status bugs are debugged from.
        assert result["projects_info"]["data"][0]["print_status"] == 2

    async def test_capabilities_tag_the_printer_like_every_other_block(
        self, hass: HomeAssistant, mock_entry, api_with_leaky_data
    ) -> None:
        api, printer = api_with_leaky_data
        api.printer_info_for_id = AsyncMock(return_value=printer)
        await _setup(hass, mock_entry)
        api.printer_info_for_id = AsyncMock(return_value={"data": {"id": PRINTER_ID}})

        result = await async_get_config_entry_diagnostics(hass, mock_entry)

        tag = result["capabilities"][0]["printer_id"]
        assert tag.startswith("**REDACTED_")
        assert result["printer_info"]["data"][0]["id"] == tag
