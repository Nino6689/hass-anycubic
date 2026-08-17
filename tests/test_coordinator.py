"""Tests for coordinator behaviour that users feel when things go wrong.

Covers the outage-logging contract, late-arriving printers, stale device
cleanup and the token-expiry repair — all things that are hard to notice
by hand because they only happen on the unhappy path.
"""

from __future__ import annotations

import asyncio
import base64
import json
import ssl
import time
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from homeassistant.core import HomeAssistant

from custom_components.anycubic_cloud.const import (
    CONF_PRINTER_ID_LIST,
    CONF_USER_TOKEN,
    DOMAIN,
    TOKEN_EXPIRY_WARN_DAYS,
)
from custom_components.anycubic_cloud.coordinator import (
    AnycubicCloudDataUpdateCoordinator,
)


def _jwt_expiring_in(days: float) -> str:
    """A structurally valid JWT whose exp claim is `days` from now."""
    payload = base64.urlsafe_b64encode(json.dumps({"exp": int(time.time() + days * 86400)}).encode()).decode().rstrip("=")
    return f"eyJhbGciOiJSUzI1NiJ9.{payload}.signature"


def _coordinator(hass: HomeAssistant, token: str | None = None) -> AnycubicCloudDataUpdateCoordinator:
    """Build a coordinator without running Home Assistant's setup."""
    entry = MagicMock()
    entry.entry_id = "test_entry"
    entry.title = "Anycubic"
    entry.options = {}
    entry.data = {
        CONF_USER_TOKEN: token or _jwt_expiring_in(90),
        CONF_PRINTER_ID_LIST: [1],
    }
    return AnycubicCloudDataUpdateCoordinator(hass, entry)


class TestOutageLogging:
    """The rule is: log the transition, not every failed poll."""

    def test_logs_once_then_stays_quiet(self, hass: HomeAssistant, caplog) -> None:
        coordinator = _coordinator(hass)

        for _ in range(5):
            coordinator._note_connection_lost(Exception("cloud down"))

        warnings = [r for r in caplog.records if r.levelname == "WARNING" and "Lost connection" in r.message]
        assert len(warnings) == 1, "an outage should be logged once, not on every poll"
        assert coordinator._failed_updates == 5, "failures must still be counted"

    def test_logs_recovery_after_an_outage(self, hass: HomeAssistant) -> None:
        coordinator = _coordinator(hass)
        coordinator._note_connection_lost(Exception("cloud down"))
        assert coordinator._connection_lost_logged is True

        # A later success resets the flag so the next outage is logged again.
        coordinator._connection_lost_logged = False
        coordinator._note_connection_lost(Exception("cloud down again"))
        assert coordinator._connection_lost_logged is True


class TestTokenExpiryRepair:
    """Tokens are 90-day JWTs and cannot be refreshed, so warn in advance."""

    @pytest.mark.parametrize(
        ("days_left", "expect_issue"),
        [(90, False), (TOKEN_EXPIRY_WARN_DAYS + 1, False), (TOKEN_EXPIRY_WARN_DAYS - 1, True), (-1, True)],
    )
    def test_issue_raised_only_near_expiry(self, hass: HomeAssistant, days_left: float, expect_issue: bool) -> None:
        coordinator = _coordinator(hass, token=_jwt_expiring_in(days_left))

        with (
            patch("custom_components.anycubic_cloud.coordinator.ir.async_create_issue") as create,
            patch("custom_components.anycubic_cloud.coordinator.ir.async_delete_issue") as delete,
        ):
            coordinator._check_token_expiry()

        assert create.called is expect_issue
        assert delete.called is not expect_issue

    def test_opaque_token_is_ignored(self, hass: HomeAssistant) -> None:
        """Web tokens carry no expiry, so there is nothing to warn about."""
        coordinator = _coordinator(hass, token="a" * 238)

        with (
            patch("custom_components.anycubic_cloud.coordinator.ir.async_create_issue") as create,
            patch("custom_components.anycubic_cloud.coordinator.ir.async_delete_issue") as delete,
        ):
            coordinator._check_token_expiry()

        assert not create.called
        assert not delete.called


class TestDynamicDevices:
    """A printer that wasn't loadable at startup should appear later."""

    async def test_new_printer_is_picked_up(self, hass: HomeAssistant) -> None:
        coordinator = _coordinator(hass)
        printer = MagicMock()
        printer.name = "Kobra S1"

        api = MagicMock()
        api.printer_info_for_id = AsyncMock(return_value=printer)
        coordinator._anycubic_api = api
        coordinator._printer_device_map = {"existing": 1}

        await coordinator._async_add_new_printers()

        assert 1 in coordinator._anycubic_printers
        # Cleared so devices and entities are registered on the next refresh.
        assert coordinator._printer_device_map is None

    async def test_already_loaded_printer_is_not_refetched(self, hass: HomeAssistant) -> None:
        coordinator = _coordinator(hass)
        coordinator._anycubic_printers = {1: MagicMock()}

        api = MagicMock()
        api.printer_info_for_id = AsyncMock()
        coordinator._anycubic_api = api

        await coordinator._async_add_new_printers()

        api.printer_info_for_id.assert_not_called()

    async def test_failure_to_load_is_retried_not_fatal(self, hass: HomeAssistant) -> None:
        """An offline printer must not break the refresh; it retries later."""
        coordinator = _coordinator(hass)

        api = MagicMock()
        api.printer_info_for_id = AsyncMock(side_effect=Exception("printer offline"))
        coordinator._anycubic_api = api

        await coordinator._async_add_new_printers()

        assert coordinator._anycubic_printers == {}


class TestStaleDevices:
    """Deselected printers shouldn't leave orphaned devices behind."""

    def test_removes_only_devices_that_are_gone(self, hass: HomeAssistant) -> None:
        coordinator = _coordinator(hass)
        coordinator._printer_device_map = {"printer_dev": 1}

        current = MagicMock(id="printer_dev", via_device_id=None, name="Kobra S1")
        accessory = MagicMock(id="ace_dev", via_device_id="printer_dev", name="ACE Pro")
        orphan = MagicMock(id="old_dev", via_device_id=None, name="Old Printer")

        dev_reg = MagicMock()
        with patch(
            "custom_components.anycubic_cloud.coordinator.dr.async_entries_for_config_entry",
            return_value=[current, accessory, orphan],
        ):
            coordinator._remove_stale_devices(dev_reg)

        removed = [call.args[0] for call in dev_reg.async_update_device.call_args_list]
        assert removed == ["old_dev"], "only the orphaned printer should be removed"

    def test_accessory_of_a_removed_printer_is_dropped(self, hass: HomeAssistant) -> None:
        coordinator = _coordinator(hass)
        coordinator._printer_device_map = {}

        accessory = MagicMock(id="ace_dev", via_device_id="gone_printer", name="ACE Pro")

        dev_reg = MagicMock()
        with patch(
            "custom_components.anycubic_cloud.coordinator.dr.async_entries_for_config_entry",
            return_value=[accessory],
        ):
            coordinator._remove_stale_devices(dev_reg)

        assert dev_reg.async_update_device.called


async def test_domain_constant_is_stable() -> None:
    """Entity ids and storage keys hang off this; changing it would migrate badly."""
    assert DOMAIN == "anycubic_cloud"


class TestUpdateFailures:
    """What a poll does when the cloud misbehaves."""

    @pytest.fixture
    def loaded(self, hass: HomeAssistant, mock_entry, mock_api):
        async def _build():
            from helpers import setup_entry

            await setup_entry(hass, mock_entry)
            return mock_entry.runtime_data, mock_api[0], mock_api[1]

        return _build

    async def test_a_cloud_error_marks_the_update_failed(self, loaded) -> None:
        from anycubic_cloud_api import AnycubicAPIError
        from homeassistant.helpers.update_coordinator import UpdateFailed

        coordinator, api, _ = await loaded()
        api.check_api_tokens = AsyncMock(side_effect=AnycubicAPIError("cloud down"))
        coordinator._last_state_update = None

        with pytest.raises(UpdateFailed):
            await coordinator.get_anycubic_updates()

        assert coordinator._failed_updates == 1

    async def test_a_parsing_error_marks_the_update_failed(self, loaded) -> None:
        from anycubic_cloud_api import AnycubicAPIParsingError
        from homeassistant.helpers.update_coordinator import UpdateFailed

        coordinator, api, _ = await loaded()
        api.check_api_tokens = AsyncMock(side_effect=AnycubicAPIParsingError("bad payload"))

        with pytest.raises(UpdateFailed):
            await coordinator.get_anycubic_updates()

    async def test_an_unexpected_error_marks_the_update_failed(self, loaded) -> None:
        from homeassistant.helpers.update_coordinator import UpdateFailed

        coordinator, api, _ = await loaded()
        api.check_api_tokens = AsyncMock(side_effect=Exception("something odd"))

        with pytest.raises(UpdateFailed):
            await coordinator.get_anycubic_updates()

    async def test_a_rejected_token_asks_for_reauth_rather_than_retrying(self, loaded) -> None:
        """Retrying a dead token forever would never surface the real problem."""
        from homeassistant.exceptions import ConfigEntryAuthFailed

        coordinator, api, _ = await loaded()
        api.check_api_tokens = AsyncMock(return_value=False)

        with pytest.raises(ConfigEntryAuthFailed):
            await coordinator.get_anycubic_updates()

    async def test_repeated_failures_back_off(self, loaded) -> None:
        """Hammering a cloud that's already failing helps nobody."""
        from custom_components.anycubic_cloud.const import MAX_FAILED_UPDATES

        coordinator, _, _ = await loaded()
        coordinator._failed_updates = MAX_FAILED_UPDATES

        assert await coordinator.get_anycubic_updates() is False
        assert coordinator._failed_updates == 0, "the counter resets after backing off"

    async def test_a_successful_poll_clears_the_failure_count(self, loaded) -> None:
        coordinator, _, _ = await loaded()
        coordinator._failed_updates = 2

        assert await coordinator.get_anycubic_updates() is True
        assert coordinator._failed_updates == 0

    async def test_recovery_is_logged_once(self, loaded, caplog) -> None:
        coordinator, _, _ = await loaded()
        coordinator._connection_lost_logged = True

        await coordinator.get_anycubic_updates()

        assert "Reconnected" in caplog.text
        assert coordinator._connection_lost_logged is False


class TestLocalFileList:
    """Requesting the printer's file list over MQTT."""

    @pytest.fixture
    def loaded(self, hass: HomeAssistant, mock_entry, mock_api):
        async def _build():
            from helpers import setup_entry

            await setup_entry(hass, mock_entry)
            return mock_entry.runtime_data, mock_api[0], mock_api[1]

        return _build

    async def test_an_empty_reply_triggers_a_retry(self, loaded) -> None:
        """An empty list usually means the MQTT reply was lost, not that
        the printer has no files."""
        coordinator, api, printer = await loaded()
        api.mqtt_wait_for_connect = AsyncMock(return_value=True)

        with (
            patch("asyncio.sleep", AsyncMock()),
            patch.object(type(printer), "local_file_list_object", property(lambda _s: None)),
            patch.object(type(coordinator), "refresh_anycubic_mqtt_connection", AsyncMock()) as refresh,
            patch.object(type(printer), "request_local_file_list", AsyncMock()) as request,
        ):
            await coordinator._async_check_local_file_list_changed(None, printer)

        refresh.assert_awaited_once()
        request.assert_awaited_once()

    async def test_an_offline_printer_is_not_retried(self, loaded) -> None:
        coordinator, _, printer = await loaded()

        with (
            patch("asyncio.sleep", AsyncMock()),
            patch.object(type(printer), "printer_online", property(lambda _s: False)),
            patch.object(type(coordinator), "refresh_anycubic_mqtt_connection", AsyncMock()) as refresh,
        ):
            await coordinator._async_check_local_file_list_changed(None, printer)

        refresh.assert_not_awaited()

    async def test_a_check_already_running_is_not_duplicated(self, loaded) -> None:
        coordinator, _, printer = await loaded()

        async with coordinator._mqtt_file_list_check_lock:
            with patch.object(type(coordinator), "refresh_anycubic_mqtt_connection", AsyncMock()) as refresh:
                await coordinator._async_check_local_file_list_changed(None, printer)

        refresh.assert_not_awaited()

    async def test_a_populated_reply_needs_no_retry(self, loaded) -> None:
        coordinator, _, printer = await loaded()

        with (
            patch("asyncio.sleep", AsyncMock()),
            patch.object(
                type(printer),
                "local_file_list_object",
                property(lambda _s: [{"name": "model.gcode"}]),
            ),
            patch.object(type(coordinator), "refresh_anycubic_mqtt_connection", AsyncMock()) as refresh,
        ):
            await coordinator._async_check_local_file_list_changed(None, printer)

        refresh.assert_not_awaited()


class TestMqttFailureIsVisible:
    """A connect that raises must say so, and must not disable MQTT forever.

    The executor future was stored and never inspected, so a TLS handshake
    failure, a refused port or a cert the local OpenSSL declines to load all
    vanished without trace -- and because the failed future stayed non-None,
    the "start MQTT" guard never fired again. One failure disabled MQTT for
    the life of the entry, with the manual switch and the refresh button both
    silently doing nothing. That was reported from the field (issue #13) as
    "no MQTT-related messages appear in the logs at all".
    """

    @pytest.fixture
    def loaded(self, hass: HomeAssistant, mock_entry, mock_api):
        async def _build():
            from helpers import setup_entry

            await setup_entry(hass, mock_entry)
            return mock_entry.runtime_data, mock_api[0]

        return _build

    async def test_the_failure_is_logged_with_the_address(self, loaded, caplog) -> None:
        coordinator, api = await loaded()
        api.endpoints.mqtt_host = "mqtt.anycubicloud.com"
        api.endpoints.mqtt_port = 8883

        failed: asyncio.Future = asyncio.get_running_loop().create_future()
        failed.set_exception(ssl.SSLError("handshake failure"))
        coordinator._mqtt_task = failed
        coordinator._mqtt_task_finished(failed)

        assert coordinator._mqtt_last_error is not None
        # The address belongs in the message: a wrong host or port is
        # otherwise indistinguishable from the service being down.
        assert "mqtt.anycubicloud.com:8883" in coordinator._mqtt_last_error
        assert "SSLError" in coordinator._mqtt_last_error
        assert "Anycubic MQTT connection failed" in caplog.text

    async def test_a_failure_does_not_disable_mqtt_forever(self, loaded) -> None:
        coordinator, api = await loaded()
        failed: asyncio.Future = asyncio.get_running_loop().create_future()
        failed.set_exception(OSError("connection refused"))
        coordinator._mqtt_task = failed

        coordinator._mqtt_task_finished(failed)

        # Cleared, so the "start MQTT" guard can fire again. Left set, the
        # integration would never retry for the life of the entry.
        assert coordinator._mqtt_task is None

    async def test_the_error_reaches_diagnostics(self, loaded) -> None:
        coordinator, api = await loaded()
        failed: asyncio.Future = asyncio.get_running_loop().create_future()
        failed.set_exception(ssl.SSLError("bad handshake"))
        coordinator._mqtt_task = failed
        coordinator._mqtt_task_finished(failed)

        # Alongside mqtt_connection_active, which is coordinator-wide and
        # already lives in the per-printer dict.
        printer = next(iter(coordinator.printers.values()))
        built = coordinator._build_printer_dict(printer)
        assert "SSLError" in str(built["states"]["mqtt_last_error"])
        # And on the sensor itself, so "off" carries its own reason.
        assert "SSLError" in str(built["attributes"]["mqtt_connection_active"]["last_error"])

    async def test_refresh_works_when_mqtt_never_started(self, loaded) -> None:
        """The button is pressed precisely when MQTT is not running, and it
        used to return early in exactly that case."""
        coordinator, api = await loaded()
        api.mqtt_is_started = False
        coordinator._mqtt_last_refresh = None
        coordinator._mqtt_task = MagicMock()

        with patch.object(type(coordinator), "_check_anycubic_mqtt_connection", AsyncMock()) as check:
            await coordinator.refresh_anycubic_mqtt_connection()

        check.assert_awaited_once()
        assert coordinator._mqtt_task is None


class TestUnexpectedSetupErrorIsNotAnAuthFailure:
    """A healthy integration wearing a red "Reconfigure" badge.

    Any unclassified exception during setup -- a DNS blip, a timeout, a
    KeyError in a parser -- used to be re-raised as ConfigEntryAuthFailed.
    That opens a re-auth flow, and Home Assistant keeps showing it even after
    the very next retry succeeds and the entry loads: the entry reads
    `loaded`, the sensors update, and the Integrations page still nags for a
    token nobody needs. NotReady retries with backoff and clears itself.
    """

    async def test_an_unknown_error_becomes_not_ready(self, hass, mock_entry, mock_api) -> None:
        from homeassistant.config_entries import ConfigEntryState

        api, _printer = mock_api
        # Something the classifier has never heard of, thrown mid-setup from a
        # call with no handler of its own -- printer_info_for_id already maps
        # its failures to NotReady, so it would not reach the outer classifier.
        api.check_api_tokens = AsyncMock(side_effect=KeyError("machine_type"))

        from helpers import setup_entry

        await setup_entry(hass, mock_entry)

        assert mock_entry.state is ConfigEntryState.SETUP_RETRY, mock_entry.state
        # And crucially: no re-auth flow was opened for it.
        flows = [
            f for f in hass.config_entries.flow.async_progress()
            if f["handler"] == "anycubic_cloud" and f["context"].get("source") == "reauth"
        ]
        assert flows == []
