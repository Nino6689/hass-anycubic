"""Tests for the options, reauth and reconfigure flows.

These are the paths a user hits after the integration is already working --
changing a setting, or recovering when the 90-day token lapses -- so the thing
that matters is that they don't lose the settings already in place.
"""

from __future__ import annotations

from unittest.mock import AsyncMock, patch

import pytest
from helpers import setup_entry as _setup
from homeassistant.config_entries import SOURCE_REAUTH, SOURCE_RECONFIGURE
from homeassistant.core import HomeAssistant
from homeassistant.data_entry_flow import FlowResultType

from custom_components.anycubic_cloud.const import (
    CONF_CARD_CONFIG,
    CONF_DEBUG_API_CALLS,
    CONF_DEBUG_MQTT_MSG,
    CONF_MQTT_CONNECT_MODE,
    DOMAIN,
)


@pytest.fixture
def options_api(mock_api):
    """Patch the API the options flow builds for itself.

    The options flow does its own cloud round-trip rather than reusing the
    coordinator's client, so patching the coordinator alone isn't enough.
    """
    api, printer = mock_api
    api.list_my_printers = AsyncMock(return_value=[printer])

    with (
        patch(
            "custom_components.anycubic_cloud.config_flow.async_create_anycubic_api",
            return_value=api,
        ),
        patch(
            "custom_components.anycubic_cloud.config_flow.async_load_tokens_from_store",
            AsyncMock(),
        ),
    ):
        yield api, printer


async def _open_options(hass: HomeAssistant, entry):
    """Open the options flow and return its menu result."""
    result = await hass.config_entries.options.async_init(entry.entry_id)
    return result


class TestOptionsMenu:
    """The menu is the entry point to every setting."""

    async def test_menu_is_shown(self, hass: HomeAssistant, mock_entry, mock_api) -> None:
        await _setup(hass, mock_entry)
        result = await _open_options(hass, mock_entry)

        assert result["type"] is FlowResultType.MENU
        assert result["step_id"] == "options_menu"

    async def test_core_options_are_always_offered(self, hass: HomeAssistant, mock_entry, mock_api) -> None:
        await _setup(hass, mock_entry)
        result = await _open_options(hass, mock_entry)

        assert {"mqtt", "card_config", "debug"} <= set(result["menu_options"])

    async def test_drying_is_offered_for_a_printer_that_can_dry(
        self, hass: HomeAssistant, mock_entry, mock_api, options_api
    ) -> None:
        """The fixture is a Kobra S1 with an ACE Pro, which dries filament."""
        await _setup(hass, mock_entry)
        result = await _open_options(hass, mock_entry)

        assert "drying" in result["menu_options"]


class TestOptionSteps:
    """Each step should save its own setting and leave the rest alone."""

    @pytest.mark.parametrize(
        ("step", "user_input", "key"),
        [
            ("mqtt", {CONF_MQTT_CONNECT_MODE: 2}, CONF_MQTT_CONNECT_MODE),
            (
                "debug",
                {CONF_DEBUG_API_CALLS: True, CONF_DEBUG_MQTT_MSG: False},
                CONF_DEBUG_API_CALLS,
            ),
        ],
    )
    async def test_step_saves_its_setting(self, hass: HomeAssistant, mock_entry, mock_api, step, user_input, key) -> None:
        await _setup(hass, mock_entry)
        result = await _open_options(hass, mock_entry)

        result = await hass.config_entries.options.async_configure(result["flow_id"], {"next_step_id": step})
        assert result["type"] is FlowResultType.FORM
        assert result["step_id"] == step

        result = await hass.config_entries.options.async_configure(result["flow_id"], user_input)
        # Saving options reloads the entry; let that finish before teardown.
        await hass.async_block_till_done()

        assert result["type"] is FlowResultType.CREATE_ENTRY
        assert result["data"][key] == user_input[key]

    async def test_existing_options_are_preserved(self, hass: HomeAssistant, mock_entry, mock_api) -> None:
        """Changing MQTT mode must not wipe an existing card config."""
        hass.config_entries.async_update_entry(mock_entry, options={CONF_CARD_CONFIG: {"kept": True}})
        await _setup(hass, mock_entry)

        result = await _open_options(hass, mock_entry)
        result = await hass.config_entries.options.async_configure(result["flow_id"], {"next_step_id": "mqtt"})
        result = await hass.config_entries.options.async_configure(result["flow_id"], {CONF_MQTT_CONNECT_MODE: 2})
        await hass.async_block_till_done()

        assert result["data"][CONF_CARD_CONFIG] == {"kept": True}
        assert result["data"][CONF_MQTT_CONNECT_MODE] == 2

    async def test_card_config_form_is_offered(self, hass: HomeAssistant, mock_entry, mock_api) -> None:
        await _setup(hass, mock_entry)
        result = await _open_options(hass, mock_entry)

        result = await hass.config_entries.options.async_configure(result["flow_id"], {"next_step_id": "card_config"})

        assert result["type"] is FlowResultType.FORM
        assert result["step_id"] == "card_config"

    async def test_drying_form_is_offered(self, hass: HomeAssistant, mock_entry, mock_api, options_api) -> None:
        await _setup(hass, mock_entry)
        result = await _open_options(hass, mock_entry)

        result = await hass.config_entries.options.async_configure(result["flow_id"], {"next_step_id": "drying"})

        assert result["type"] is FlowResultType.FORM
        assert result["step_id"] == "drying"


class TestReauth:
    """Tokens expire after 90 days, so this path gets used for real."""

    async def test_reauth_asks_for_a_new_token(self, hass: HomeAssistant, mock_entry, mock_api) -> None:
        await _setup(hass, mock_entry)

        result = await mock_entry.start_reauth_flow(hass)

        assert result["type"] is FlowResultType.FORM
        assert result["step_id"] == "user", "re-auth should reuse the same single-paste step as first-time setup"

    async def test_reauth_context_is_flagged(self, hass: HomeAssistant, mock_entry, mock_api) -> None:
        await _setup(hass, mock_entry)
        await mock_entry.start_reauth_flow(hass)

        flows = hass.config_entries.flow.async_progress_by_handler(DOMAIN)

        assert any(f["context"]["source"] == SOURCE_REAUTH for f in flows)


class TestReconfigure:
    """Reconfigure lets a user re-pick printers without starting over."""

    async def test_reconfigure_offers_a_choice(self, hass: HomeAssistant, mock_entry, mock_api) -> None:
        await _setup(hass, mock_entry)

        result = await mock_entry.start_reconfigure_flow(hass)

        assert result["type"] is FlowResultType.MENU
        assert set(result["menu_options"]) == {"reauth", "printer", "connection"}

    async def test_choosing_printers_lists_the_account_printers(self, hass: HomeAssistant, mock_entry, mock_api) -> None:
        api, printer = mock_api
        await _setup(hass, mock_entry)

        result = await mock_entry.start_reconfigure_flow(hass)

        with patch("custom_components.anycubic_cloud.config_flow.AnycubicAPI", return_value=api):
            api.list_my_printers = AsyncMock(return_value=[printer])
            result = await hass.config_entries.flow.async_configure(result["flow_id"], {"next_step_id": "printer"})

        assert result["type"] is FlowResultType.FORM
        assert result["step_id"] == "printer"

    async def test_reconfigure_context_is_flagged(self, hass: HomeAssistant, mock_entry, mock_api) -> None:
        await _setup(hass, mock_entry)
        await mock_entry.start_reconfigure_flow(hass)

        flows = hass.config_entries.flow.async_progress_by_handler(DOMAIN)

        assert any(f["context"]["source"] == SOURCE_RECONFIGURE for f in flows)
