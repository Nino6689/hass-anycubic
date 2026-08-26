"""Tests for how the frontend reaches a dashboard.

The panel is registered by Home Assistant, but the Lovelace card is not: nothing
loads a third-party card into dashboards on its own. If this registration stops
happening the card silently disappears from the card picker, which is exactly
the sort of failure nobody notices until someone tries to add it.
"""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch

import anycubic_cloud_frontend
import pytest

from custom_components.anycubic_cloud.panel import (
    PANEL_URL,
    async_register_card,
    async_register_panel,
)


class TestCardRegistration:
    """The card bundle has to be offered to dashboards explicitly."""

    def test_the_card_is_registered_with_the_frontend(self) -> None:
        with patch("custom_components.anycubic_cloud.panel.frontend.add_extra_js_url") as add_url:
            async_register_card(None)

        assert add_url.call_count == 1
        registered_url = add_url.call_args.args[1]
        assert registered_url.startswith(f"{PANEL_URL}/")
        assert anycubic_cloud_frontend.card_js in registered_url

    def test_the_card_url_changes_when_the_card_build_does(self) -> None:
        """Without this the browser keeps serving whichever card it saw first.

        Home Assistant serves the panel directory with no Cache-Control header,
        so the URL is the only thing telling a browser the file moved on. It has
        to track the card's own hash: a change confined to the card leaves the
        panel bundle -- and therefore FILE_HASH -- untouched.
        """
        with patch("custom_components.anycubic_cloud.panel.frontend.add_extra_js_url") as add_url:
            async_register_card(None)

        registered_url = add_url.call_args.args[1]
        assert anycubic_cloud_frontend.CARD_HASH in registered_url


class TestTheCardSurvivesASetupFailure:
    """A broken cloud must not take the dashboard card with it.

    Registration used to happen after the coordinator's first refresh, so
    anything that stopped setup -- an offline printer, an expired token, an
    Anycubic outage -- also meant the card's JavaScript was never handed to the
    browser. Every dashboard using the card then failed with "Custom element
    not found: anycubic-card" instead of showing an unavailable card, and the
    reported symptom looks like a missing card rather than a login problem.
    """

    async def test_the_card_is_registered_even_when_setup_fails(self, hass, mock_entry, mock_api) -> None:
        from homeassistant.config_entries import ConfigEntryState

        api, _printer = mock_api
        api.check_api_tokens = AsyncMock(return_value=False)

        with patch("custom_components.anycubic_cloud.panel.frontend.add_extra_js_url") as add_url:
            from helpers import setup_entry

            await setup_entry(hass, mock_entry)

        assert mock_entry.state is ConfigEntryState.SETUP_ERROR, mock_entry.state
        # The card is still offered to the browser, so the dashboard renders it
        # as unavailable rather than as a missing custom element.
        assert add_url.call_count == 1
        assert anycubic_cloud_frontend.card_js in add_url.call_args.args[1]


class TestMultiplePrintersShareOnePanel:
    """Multi-printer setups create one config entry per printer.

    HA sets the entries up concurrently, so two of them can get past the
    ``frontend_panels`` guard before either has actually registered the panel.
    The loser raises ``ValueError: Overwriting panel anycubic_cloud``, which used
    to abort that entry's whole setup. The panel is a singleton shared by every
    entry, so an already-registered panel must be treated as success.
    """

    def _hass_with_http(self) -> MagicMock:
        hass = MagicMock()
        http = MagicMock()
        http.async_register_static_paths = AsyncMock()
        hass.http = http
        hass.data = {"frontend_panels": {}}
        return hass

    async def test_a_second_registration_that_overwrites_is_not_an_error(
        self,
    ) -> None:
        hass = self._hass_with_http()
        with (
            patch("custom_components.anycubic_cloud.panel.frontend.add_extra_js_url") as add_url,
            patch("custom_components.anycubic_cloud.panel.panel_custom.async_register_panel") as register_panel,
        ):
            register_panel.side_effect = ValueError("Overwriting panel anycubic_cloud")
            # The second entry hits the overwrite. It must not tear down setup.
            await async_register_panel(hass, {})

        # The card is still offered to the browser for the second entry.
        assert add_url.call_count == 1

    async def test_unrelated_value_errors_still_propagate(self) -> None:
        hass = self._hass_with_http()
        with (
            patch("custom_components.anycubic_cloud.panel.async_register_card"),
            patch("custom_components.anycubic_cloud.panel.panel_custom.async_register_panel") as register_panel,
        ):
            register_panel.side_effect = ValueError("something else entirely")

            with pytest.raises(ValueError, match="something else entirely"):
                await async_register_panel(hass, {})
