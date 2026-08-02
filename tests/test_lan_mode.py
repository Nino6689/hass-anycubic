"""Tests for the local (LAN Mode) connection.

The printer runs its own broker only when LAN Mode is switched on at its
panel, and it drops the cloud connection when it is. So the cases that matter
here are the ones a user actually hits: turning it on too early, typing the
wrong address, and the local connection going away again -- none of which may
leave Home Assistant worse off than before.
"""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from anycubic_cloud_api.exceptions.exceptions import (
    AnycubicLANCloudModeError,
    AnycubicLANError,
    AnycubicLANUnsupportedError,
)
from anycubic_cloud_api.lan import AnycubicLANBroker
from homeassistant.core import HomeAssistant
from homeassistant.data_entry_flow import FlowResultType
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.anycubic_cloud.const import (
    CONF_LAN_HOST,
    CONF_LAN_MODE_ENABLED,
    CONF_PRINTER_ID_LIST,
    CONF_USER_TOKEN,
    DOMAIN,
)
from custom_components.anycubic_cloud.coordinator import (
    AnycubicCloudDataUpdateCoordinator,
)

BROKER = AnycubicLANBroker(
    host="10.0.66.28",
    port=9883,
    username="user",
    password="pass",
    device_id="DEVICE1234",
    model_id="20025",
    model_name="Anycubic Kobra S1",
)

HANDSHAKE = "custom_components.anycubic_cloud.config_flow.AnycubicLANHandshake"
CO_HANDSHAKE = "custom_components.anycubic_cloud.coordinator.AnycubicLANHandshake"
CO_CLIENT = "custom_components.anycubic_cloud.coordinator.AnycubicLANClient"


def _coordinator(hass: HomeAssistant, options: dict | None = None):
    entry = MagicMock()
    entry.entry_id = "test_entry"
    entry.title = "Anycubic"
    entry.options = options or {}
    entry.data = {CONF_USER_TOKEN: "token", CONF_PRINTER_ID_LIST: [1]}

    return AnycubicCloudDataUpdateCoordinator(hass, entry)


def _printer(machine_type: int = 20025):
    printer = MagicMock()
    printer.machine_type = machine_type

    return printer


def _handshake_raising(error):
    handshake = MagicMock()
    handshake.async_authenticate = AsyncMock(side_effect=error)

    return MagicMock(return_value=handshake)


def _handshake_returning(broker=BROKER):
    handshake = MagicMock()
    handshake.async_authenticate = AsyncMock(return_value=broker)

    return MagicMock(return_value=handshake)


class TestOptionsFlow:
    """The toggle checks the printer before it will save."""

    async def _open(self, hass: HomeAssistant):
        entry = MockConfigEntry(
            domain=DOMAIN,
            title="Anycubic Cloud",
            unique_id="999",
            data={CONF_USER_TOKEN: "token", CONF_PRINTER_ID_LIST: [1]},
        )
        entry.add_to_hass(hass)

        from custom_components.anycubic_cloud.config_flow import (
            AnycubicCloudOptionsFlowHandler,
        )

        flow = AnycubicCloudOptionsFlowHandler(entry)
        flow.hass = hass

        return flow

    async def test_the_form_is_offered(self, hass: HomeAssistant) -> None:
        flow = await self._open(hass)

        result = await flow.async_step_local()

        assert result["type"] == FlowResultType.FORM
        assert result["step_id"] == "local"

    async def test_turning_it_on_without_an_address_is_refused(self, hass: HomeAssistant) -> None:
        flow = await self._open(hass)

        result = await flow.async_step_local({CONF_LAN_MODE_ENABLED: True, CONF_LAN_HOST: "   "})

        assert result["errors"] == {CONF_LAN_HOST: "lan_host_required"}

    @pytest.mark.parametrize(
        ("error", "expected"),
        [
            (AnycubicLANCloudModeError("cloud"), "lan_printer_in_cloud_mode"),
            (AnycubicLANUnsupportedError("old"), "lan_unsupported_printer"),
            (AnycubicLANError("unreachable"), "lan_unreachable"),
            (RuntimeError("something else"), "lan_unreachable"),
        ],
    )
    async def test_a_printer_that_cannot_be_reached_is_explained(self, hass: HomeAssistant, error, expected) -> None:
        flow = await self._open(hass)

        with patch(HANDSHAKE, _handshake_raising(error)):
            result = await flow.async_step_local({CONF_LAN_MODE_ENABLED: True, CONF_LAN_HOST: "10.0.66.28"})

        assert result["errors"] == {"base": expected}

    async def test_a_reachable_printer_saves_the_setting(self, hass: HomeAssistant) -> None:
        flow = await self._open(hass)

        with patch(HANDSHAKE, _handshake_returning()):
            result = await flow.async_step_local({CONF_LAN_MODE_ENABLED: True, CONF_LAN_HOST: " 10.0.66.28 "})

        assert result["type"] == FlowResultType.CREATE_ENTRY
        assert result["data"][CONF_LAN_MODE_ENABLED] is True
        assert result["data"][CONF_LAN_HOST] == "10.0.66.28"

    async def test_turning_it_off_needs_no_printer(self, hass: HomeAssistant) -> None:
        """Switching back to cloud must work with the printer already gone."""
        flow = await self._open(hass)

        result = await flow.async_step_local({CONF_LAN_MODE_ENABLED: False, CONF_LAN_HOST: "10.0.66.28"})

        assert result["type"] == FlowResultType.CREATE_ENTRY
        assert result["data"][CONF_LAN_MODE_ENABLED] is False


class TestCoordinatorSetup:
    def test_it_is_off_unless_asked_for(self, hass: HomeAssistant) -> None:
        assert _coordinator(hass).lan_mode_enabled is False
        assert _coordinator(hass).lan_is_connected is False

    async def test_nothing_happens_when_it_is_off(self, hass: HomeAssistant) -> None:
        coordinator = _coordinator(hass)

        with patch(CO_HANDSHAKE) as handshake:
            await coordinator._async_setup_lan_connection()

        handshake.assert_not_called()

    async def test_an_enabled_toggle_with_no_address_does_nothing(self, hass: HomeAssistant) -> None:
        coordinator = _coordinator(hass, {CONF_LAN_MODE_ENABLED: True})

        with patch(CO_HANDSHAKE) as handshake:
            await coordinator._async_setup_lan_connection()

        handshake.assert_not_called()

    @pytest.mark.parametrize("error", [AnycubicLANError("unreachable"), RuntimeError("unexpected")])
    async def test_a_printer_back_in_cloud_mode_is_not_fatal(self, hass: HomeAssistant, error) -> None:
        """Cloud is still the right connection to be using -- carry on."""
        coordinator = _coordinator(hass, {CONF_LAN_MODE_ENABLED: True, CONF_LAN_HOST: "10.0.66.28"})

        with patch(CO_HANDSHAKE, _handshake_raising(error)):
            await coordinator._async_setup_lan_connection()

        assert coordinator.lan_is_connected is False

    async def test_a_successful_connection_asks_for_state(self, hass: HomeAssistant) -> None:
        coordinator = _coordinator(hass, {CONF_LAN_MODE_ENABLED: True, CONF_LAN_HOST: "10.0.66.28"})
        client = MagicMock()
        client.async_connect = AsyncMock()

        with (
            patch(CO_HANDSHAKE, _handshake_returning()),
            patch(CO_CLIENT, return_value=client),
        ):
            await coordinator._async_setup_lan_connection()

        client.query_all.assert_called_once()

    async def test_it_only_connects_once(self, hass: HomeAssistant) -> None:
        coordinator = _coordinator(hass, {CONF_LAN_MODE_ENABLED: True, CONF_LAN_HOST: "10.0.66.28"})
        client = MagicMock()
        client.async_connect = AsyncMock()

        with (
            patch(CO_HANDSHAKE, _handshake_returning()) as handshake,
            patch(CO_CLIENT, return_value=client),
        ):
            await coordinator._async_setup_lan_connection()
            await coordinator._async_setup_lan_connection()

        assert handshake.call_count == 1

    async def test_stopping_is_safe_when_never_started(self, hass: HomeAssistant) -> None:
        await _coordinator(hass).async_stop_lan_connection()

    async def test_stopping_disconnects_and_forgets(self, hass: HomeAssistant) -> None:
        coordinator = _coordinator(hass)
        client = MagicMock()
        client.async_disconnect = AsyncMock()
        coordinator._lan_client = client

        await coordinator.async_stop_lan_connection()

        client.async_disconnect.assert_awaited_once()
        assert coordinator._lan_client is None


class TestTargetPrinter:
    """A local report must never be applied to the wrong printer."""

    def test_a_single_printer_is_always_the_target(self, hass: HomeAssistant) -> None:
        coordinator = _coordinator(hass)
        printer = _printer(machine_type=99999)
        coordinator._anycubic_printers = {1: printer}

        assert coordinator._lan_target_printer("20025") is printer

    def test_with_several_printers_the_model_must_match(self, hass: HomeAssistant) -> None:
        coordinator = _coordinator(hass)
        wanted = _printer(machine_type=20025)
        coordinator._anycubic_printers = {1: _printer(20024), 2: wanted}

        assert coordinator._lan_target_printer("20025") is wanted

    def test_a_report_matching_nothing_is_dropped_and_logged_once(self, hass: HomeAssistant, caplog) -> None:
        coordinator = _coordinator(hass)
        coordinator._anycubic_printers = {1: _printer(20024), 2: _printer(20026)}

        for _ in range(3):
            assert coordinator._lan_target_printer("20025") is None

        warnings = [
            record for record in caplog.records if record.levelname == "WARNING" and "does not match" in record.message
        ]
        assert len(warnings) == 1

    def test_no_printers_at_all_is_handled(self, hass: HomeAssistant) -> None:
        coordinator = _coordinator(hass)
        coordinator._anycubic_printers = {}

        assert coordinator._lan_target_printer("20025") is None


class TestReportHandling:
    def _ready(self, hass: HomeAssistant):
        coordinator = _coordinator(hass)
        client = MagicMock()
        client.broker = BROKER
        coordinator._lan_client = client
        printer = _printer()
        coordinator._anycubic_printers = {1: printer}
        # A successful report schedules the coordinator's refresh, which reads
        # the cloud API for the account id.
        coordinator._anycubic_api = MagicMock()

        return coordinator, printer

    def test_a_report_reaches_the_printer(self, hass: HomeAssistant) -> None:
        coordinator, printer = self._ready(hass)

        coordinator._lan_on_message(
            "anycubic/anycubicCloud/v1/printer/public/20025/DEVICE1234/info",
            "info",
            {"type": "info", "data": {}},
        )

        printer.process_mqtt_update.assert_called_once()

    def test_a_report_with_no_connection_is_ignored(self, hass: HomeAssistant) -> None:
        coordinator = _coordinator(hass)

        coordinator._lan_on_message("topic", "info", {"type": "info"})

    def test_a_report_for_an_unknown_printer_is_ignored(self, hass: HomeAssistant) -> None:
        coordinator, _ = self._ready(hass)
        coordinator._anycubic_printers = {1: _printer(20024), 2: _printer(20026)}

        coordinator._lan_on_message("topic", "info", {"type": "info"})

    @pytest.mark.parametrize(
        "error",
        [
            __import__("anycubic_cloud_api.exceptions.exceptions", fromlist=["x"]).AnycubicDataParsingError("unparsed"),
            RuntimeError("unexpected"),
        ],
    )
    def test_a_report_that_will_not_parse_does_not_escape(self, hass: HomeAssistant, error) -> None:
        """paho would stop delivering if this propagated."""
        coordinator, printer = self._ready(hass)
        printer.process_mqtt_update.side_effect = error

        coordinator._lan_on_message("topic", "info", {"type": "info"})


class TestPolling:
    def test_nothing_is_asked_for_without_a_connection(self, hass: HomeAssistant) -> None:
        _coordinator(hass)._lan_poll()

    def test_a_disconnected_client_is_not_polled(self, hass: HomeAssistant) -> None:
        coordinator = _coordinator(hass)
        client = MagicMock()
        client.is_connected = False
        coordinator._lan_client = client

        coordinator._lan_poll()

        client.query_all.assert_not_called()

    def test_a_connected_client_is_asked_for_everything(self, hass: HomeAssistant) -> None:
        coordinator = _coordinator(hass)
        client = MagicMock()
        client.is_connected = True
        coordinator._lan_client = client

        coordinator._lan_poll()

        client.query_all.assert_called_once()

    def test_a_failed_poll_is_swallowed(self, hass: HomeAssistant) -> None:
        """The printer may have just been switched back to cloud mode."""
        coordinator = _coordinator(hass)
        client = MagicMock()
        client.is_connected = True
        client.query_all.side_effect = AnycubicLANError("gone")
        coordinator._lan_client = client

        coordinator._lan_poll()


class TestPrinterMissingFromCloud:
    """Switching to LAN Mode makes the cloud report the printer as deleted.

    That is not an authentication problem, and calling it one sent users to a
    re-auth prompt that could not help -- and left the entry in a state where
    the LAN Mode option itself could not be reached.
    """

    async def _setup(self, hass: HomeAssistant, printer_info):
        from homeassistant.exceptions import ConfigEntryAuthFailed, ConfigEntryNotReady

        coordinator = _coordinator(hass, {})
        api = MagicMock()
        api.check_api_tokens = AsyncMock(return_value=True)
        api.get_auth_config_dict = MagicMock(return_value={})
        api.printer_info_for_id = printer_info
        api.set_authentication = MagicMock()
        api.set_mqtt_log_all_messages = MagicMock()
        api.set_log_api_call_info = MagicMock()

        with (
            patch("custom_components.anycubic_cloud.coordinator.AnycubicAPI", return_value=api),
            patch("custom_components.anycubic_cloud.coordinator.async_load_saved_tokens", AsyncMock()),
            patch(
                "custom_components.anycubic_cloud.coordinator.async_token_store",
                return_value=MagicMock(async_save=AsyncMock()),
            ),
        ):
            try:
                await coordinator._setup_anycubic_api_connection()
            except (ConfigEntryNotReady, ConfigEntryAuthFailed) as err:
                return err

        return None

    async def test_a_deleted_printer_is_not_an_auth_failure(self, hass: HomeAssistant) -> None:
        from homeassistant.exceptions import ConfigEntryNotReady

        error = await self._setup(hass, AsyncMock(side_effect=AttributeError("'NoneType' object has no attribute 'get'")))

        assert isinstance(error, ConfigEntryNotReady)
        assert "LAN Mode" in str(error)

    async def test_no_printer_returned_says_the_same(self, hass: HomeAssistant) -> None:
        from homeassistant.exceptions import ConfigEntryNotReady

        error = await self._setup(hass, AsyncMock(return_value=None))

        assert isinstance(error, ConfigEntryNotReady)
        assert "LAN Mode" in str(error)
