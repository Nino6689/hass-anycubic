"""Tests for the helper functions that shape what the user sees.

Most of these are small transforms, but they sit on the path between the cloud
payload and the dashboard, so a wrong one shows up as a mislabelled device or a
spool icon in the wrong colour.
"""

from __future__ import annotations

import base64

import pytest
from helpers import PRINTER_ID

from custom_components.anycubic_cloud.helpers import (
    build_ace_device_info,
    build_color_swatch_data_uri,
    extract_panel_card_config,
    get_value_from_dict_if_type,
    remove_quotes_from_string,
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
