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

from custom_components.anycubic_cloud.const import DOMAIN
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

        async def _sibling_got_there_first(*_args, **_kwargs):
            # What actually happens on the losing side of the race: the panel
            # is registered by then, which is precisely why this raises. A
            # stub that raises while leaving the registry empty describes a
            # situation that cannot occur, and would let a fix through that
            # swallows a genuine failure to register.
            hass.data["frontend_panels"][DOMAIN] = object()
            raise ValueError("Overwriting panel anycubic_cloud")

        with (
            patch("custom_components.anycubic_cloud.panel.frontend.add_extra_js_url") as add_url,
            patch("custom_components.anycubic_cloud.panel.panel_custom.async_register_panel") as register_panel,
        ):
            register_panel.side_effect = _sibling_got_there_first
            # The second entry hits the overwrite. It must not tear down setup.
            await async_register_panel(hass, {})

        # The card is still offered to the browser for the second entry.
        assert add_url.call_count == 1

    async def test_a_panel_that_really_failed_to_register_still_raises(
        self,
    ) -> None:
        """The other side of judging it by the registry.

        If the panel is genuinely absent afterwards then nothing registered it,
        whatever the message said, and swallowing that would hand the user a
        printer with no sidebar and no error to explain it.
        """
        hass = self._hass_with_http()
        with (
            patch("custom_components.anycubic_cloud.panel.async_register_card"),
            patch("custom_components.anycubic_cloud.panel.panel_custom.async_register_panel") as register_panel,
        ):
            register_panel.side_effect = ValueError("Overwriting panel anycubic_cloud")

            with pytest.raises(ValueError, match="Overwriting panel"):
                await async_register_panel(hass, {})

    async def test_unrelated_value_errors_still_propagate(self) -> None:
        hass = self._hass_with_http()
        with (
            patch("custom_components.anycubic_cloud.panel.async_register_card"),
            patch("custom_components.anycubic_cloud.panel.panel_custom.async_register_panel") as register_panel,
        ):
            register_panel.side_effect = ValueError("something else entirely")

            with pytest.raises(ValueError, match="something else entirely"):
                await async_register_panel(hass, {})

    @staticmethod
    def _route(served: str | None) -> MagicMock:
        """A stand-in for one aiohttp route, serving ``served`` when set."""
        route = MagicMock()
        route.resource.canonical = served
        return route

    async def test_a_static_path_a_sibling_already_serves_is_not_an_error(
        self,
    ) -> None:
        """The static path is the same singleton, judged by the router.

        Home Assistant registers the panel directory as a GET route, so a
        sibling entry that raced ahead makes the loser hit aiohttp's
        ``method GET is already registered`` RuntimeError. That reflects the
        race faithfully: the path IS present in the router -- the sibling's
        ``add_route`` ran before this one threw -- so standing aside and
        letting the entry continue is right, and the recent test above is
        consistent: the panel and its static path are registered together.
        """
        hass = self._hass_with_http()
        hass.http.app.router.routes.return_value = [
            self._route(PANEL_URL),
        ]
        hass.http.async_register_static_paths.side_effect = RuntimeError(
            "Added route will never be executed, method GET is already registered"
        )
        with (
            patch("custom_components.anycubic_cloud.panel.frontend.add_extra_js_url") as add_url,
            patch("custom_components.anycubic_cloud.panel.panel_custom.async_register_panel") as register_panel,
        ):
            register_panel.side_effect = AsyncMock()

            await async_register_panel(hass, {})

        # The entry still offers the card and reaches the panel handoff.
        assert add_url.call_count == 1

    async def test_a_static_path_nobody_is_serving_still_raises(
        self,
    ) -> None:
        """The other side of judging it by the router's state.

        If the exception did not come from a race, the path will not be found
        in the router, and swallowing that would hand the user a panel whose
        files are served by nothing and no error to explain it.
        """
        hass = self._hass_with_http()
        hass.http.app.router.routes.return_value = [self._route("/some-other-path")]

        hass.http.async_register_static_paths.side_effect = RuntimeError("boom")

        with (
            patch("custom_components.anycubic_cloud.panel.async_register_card"),
        ):
            with pytest.raises(RuntimeError):
                await async_register_panel(hass, {})


class TestTwoPrintersSetUpTogether:
    """The bug as a user meets it, rather than as the handler sees it.

    Reported in #24: with two printers configured, the second entry failed to
    set up at all -- its entities sat unavailable while the first printer
    worked. Home Assistant sets entries up concurrently, and the panel is a
    singleton, so the loser of the race hit an already-registered panel and
    took that as fatal.

    These drive both entries through real setup rather than injecting the
    error, so they fail if the race is reintroduced by any route -- not only
    the one route that was fixed.
    """

    def _second_entry(self, hass):
        from conftest import PRINTER_ID, TEST_TOKEN
        from pytest_homeassistant_custom_component.common import MockConfigEntry

        from custom_components.anycubic_cloud.const import (
            CONF_PRINTER_ID_LIST,
            CONF_USER_TOKEN,
        )

        entry = MockConfigEntry(
            domain=DOMAIN,
            title="Anycubic Cloud 2",
            unique_id="998",
            data={
                CONF_USER_TOKEN: TEST_TOKEN,
                CONF_PRINTER_ID_LIST: [PRINTER_ID],
            },
        )
        entry.add_to_hass(hass)
        return entry

    async def test_both_printers_load_when_set_up_at_once(self, hass, mock_entry, mock_api) -> None:
        """Concurrently, the way Home Assistant does it at boot."""
        import asyncio

        from homeassistant.config_entries import ConfigEntryState

        second = self._second_entry(hass)

        await asyncio.gather(
            hass.config_entries.async_setup(mock_entry.entry_id),
            hass.config_entries.async_setup(second.entry_id),
        )
        await hass.async_block_till_done()

        assert mock_entry.state is ConfigEntryState.LOADED, mock_entry.state
        assert second.state is ConfigEntryState.LOADED, second.state
        assert DOMAIN in hass.data.get("frontend_panels", {})

    async def test_unloading_one_printer_leaves_the_others_panel(self, hass, mock_entry, mock_api) -> None:
        """The same singleton, in the other direction.

        Removing the panel is an unconditional pop, so unloading one entry
        used to take the sidebar away from every printer still loaded.
        """
        import asyncio

        from homeassistant.config_entries import ConfigEntryState

        second = self._second_entry(hass)
        await asyncio.gather(
            hass.config_entries.async_setup(mock_entry.entry_id),
            hass.config_entries.async_setup(second.entry_id),
        )
        await hass.async_block_till_done()
        assert DOMAIN in hass.data.get("frontend_panels", {})

        await hass.config_entries.async_unload(second.entry_id)
        await hass.async_block_till_done()

        assert second.state is ConfigEntryState.NOT_LOADED
        assert mock_entry.state is ConfigEntryState.LOADED
        # The printer that is still here keeps its sidebar.
        assert DOMAIN in hass.data.get("frontend_panels", {})

    async def test_the_panel_goes_when_the_last_printer_does(self, hass, mock_entry, mock_api) -> None:
        """Not a licence to leak it -- the last one out still clears up."""
        from helpers import setup_entry

        await setup_entry(hass, mock_entry)
        assert DOMAIN in hass.data.get("frontend_panels", {})

        await hass.config_entries.async_unload(mock_entry.entry_id)
        await hass.async_block_till_done()

        assert DOMAIN not in hass.data.get("frontend_panels", {})
