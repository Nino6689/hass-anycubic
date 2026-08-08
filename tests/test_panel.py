"""Tests for how the frontend reaches a dashboard.

The panel is registered by Home Assistant, but the Lovelace card is not: nothing
loads a third-party card into dashboards on its own. If this registration stops
happening the card silently disappears from the card picker, which is exactly
the sort of failure nobody notices until someone tries to add it.
"""

from __future__ import annotations

from unittest.mock import patch

import anycubic_cloud_frontend

from custom_components.anycubic_cloud.panel import PANEL_URL, async_register_card


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
