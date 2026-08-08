"""Setting up against a printer alone, with no Anycubic account.

Both failures covered here were reported by a user with a Kobra 3 V2 and could
not happen on the maintainer's Kobra S1, which is why the feature shipped
looking like it worked: that printer reports a numeric device id, and the
entry that was being tested had a token on it, so it never took the
account-less path at all.
"""

from __future__ import annotations

from unittest.mock import MagicMock, patch

from homeassistant.core import HomeAssistant

from custom_components.anycubic_cloud.config_flow import lan_printer_id


class TestAPrinterIdFromTheNetwork:
    """Printers do not agree on what a device id looks like."""

    def test_a_numeric_device_id_is_kept_as_it_is(self) -> None:
        """So a printer whose local id matches its cloud id keeps its history."""
        assert lan_printer_id("291342") == 291342

    def test_a_hex_device_id_is_accepted(self) -> None:
        """A Kobra 3 V2 reports 32 characters of hex, and int() threw on it."""
        assert lan_printer_id("f7f7c5c57d3ba6ff815c34c35d21d879") > 0

    def test_the_same_printer_always_gets_the_same_id(self) -> None:
        """Otherwise every restart mints a new device and orphans the old one."""
        first = lan_printer_id("f7f7c5c57d3ba6ff815c34c35d21d879")
        second = lan_printer_id("f7f7c5c57d3ba6ff815c34c35d21d879")

        assert first == second

    def test_different_printers_get_different_ids(self) -> None:
        assert lan_printer_id("f7f7c5c57d3ba6ff815c34c35d21d879") != lan_printer_id("a1a1c5c57d3ba6ff815c34c35d21d879")

    def test_the_id_is_small_enough_for_home_assistant_to_store(self) -> None:
        """Home Assistant's JSON encoder refuses anything wider than 64 bits.

        It does not refuse it loudly: the store discards the payload first and
        logs the failure afterwards, so the entry silently never persists and
        it takes the whole batched write down with it. int(device_id, 16) --
        the obvious fix -- produces a 128-bit number and does exactly that.
        """
        biggest = lan_printer_id("f" * 32)

        assert biggest < 2**53

    def test_a_digested_id_cannot_be_mistaken_for_a_cloud_id(self) -> None:
        """Cloud ids are six or seven digits; a digest must sit well clear."""
        assert lan_printer_id("f7f7c5c57d3ba6ff815c34c35d21d879") > 10**8


class TestSettingUpWithNoAccount:
    """The entry has no token, so nothing may reach for one."""

    async def test_an_account_less_entry_still_builds_an_api(self, hass: HomeAssistant) -> None:
        """Orders are sent through the API object even when they go locally.

        Without one, a LAN-only entry can send nothing at all, and the data
        builder raises before a single entity is created.
        """
        from custom_components.anycubic_cloud.coordinator import (
            AnycubicCloudDataUpdateCoordinator,
        )

        coordinator = AnycubicCloudDataUpdateCoordinator.__new__(AnycubicCloudDataUpdateCoordinator)
        coordinator.hass = hass
        coordinator._anycubic_api = None
        coordinator._lan_client = None
        coordinator.entry = MagicMock()
        coordinator.entry.options = {}
        coordinator._mqtt_callback_data_updated = lambda *a, **k: None
        coordinator._mqtt_callback_print_job_started = lambda *a, **k: None
        coordinator._mqtt_callback_subscribed = lambda *a, **k: None

        coordinator._setup_anycubic_api_offline()

        assert coordinator._anycubic_api is not None, "a local-only entry needs an API object to send orders through"

    async def test_the_user_id_is_absent_rather_than_raising(self, hass: HomeAssistant) -> None:
        """Asking an unauthenticated API for its account raises, and that
        exception reached the data builder on every refresh."""
        from custom_components.anycubic_cloud.coordinator import (
            AnycubicCloudDataUpdateCoordinator,
        )

        coordinator = AnycubicCloudDataUpdateCoordinator.__new__(AnycubicCloudDataUpdateCoordinator)
        with patch.object(AnycubicCloudDataUpdateCoordinator, "lan_only", property(lambda self: True)):
            assert coordinator._api_user_id() is None

    async def test_the_cloud_broker_is_not_offered_without_an_account(self, hass: HomeAssistant) -> None:
        """Whether the cloud broker would take us lives on the auth object.

        Asking an unauthenticated API raises rather than answering no, and
        that exception reached the printer dict on every single refresh --
        which is what still broke a local-only entry after it could be
        created at all.
        """
        from custom_components.anycubic_cloud.coordinator import (
            AnycubicCloudDataUpdateCoordinator,
        )

        coordinator = AnycubicCloudDataUpdateCoordinator.__new__(AnycubicCloudDataUpdateCoordinator)
        with patch.object(AnycubicCloudDataUpdateCoordinator, "lan_only", property(lambda self: True)):
            assert coordinator._supports_mqtt_login() is False
