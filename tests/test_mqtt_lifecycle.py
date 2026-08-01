"""Tests for when the MQTT connection is held open.

Anycubic's broker is the only source of live updates, but holding it open
permanently is what generated most of this integration's log noise and cloud
traffic. The rules that decide when to connect are therefore the part worth
pinning down: connect when something is happening, let go when it isn't, and
never drop a connection the user asked for by hand.
"""

from __future__ import annotations

import time
from unittest.mock import AsyncMock, patch

import pytest
from helpers import setup_entry as _setup
from homeassistant.core import CoreState, HomeAssistant

from custom_components.anycubic_cloud.const import (
    CONF_MQTT_CONNECT_MODE,
    MQTT_IDLE_DISCONNECT_SECONDS,
)
from custom_components.anycubic_cloud.helpers import AnycubicMQTTConnectMode


@pytest.fixture
def coordinator_factory(hass: HomeAssistant, mock_entry, mock_api):
    """Build a loaded coordinator with a configurable connect mode."""

    async def _build(mode: int | None = None, mqtt_started: bool = False):
        if mode is not None:
            hass.config_entries.async_update_entry(mock_entry, options={CONF_MQTT_CONNECT_MODE: mode})
        await _setup(hass, mock_entry)

        coordinator = mock_entry.runtime_data
        api, _ = mock_api
        api.mqtt_is_started = mqtt_started
        api.anycubic_auth.supports_mqtt_login = True
        # Awaited during teardown when a connection is considered open.
        api.mqtt_wait_for_disconnect = AsyncMock()
        hass.set_state(CoreState.running)
        return coordinator, api

    return _build


class TestWhenToConnect:
    """Connecting at the wrong time is what makes this integration chatty."""

    async def test_never_connect_mode_stays_disconnected(self, coordinator_factory) -> None:
        coordinator, _ = await coordinator_factory(mode=AnycubicMQTTConnectMode.Never_Connect)

        assert coordinator._anycubic_mqtt_connection_should_start() is False

    async def test_no_connection_without_mqtt_login_support(self, coordinator_factory) -> None:
        """Web tokens can't log in to the broker, so there's nothing to try."""
        coordinator, api = await coordinator_factory(mode=AnycubicMQTTConnectMode.Always)
        api.anycubic_auth.supports_mqtt_login = False

        assert coordinator._anycubic_mqtt_connection_should_start() is False

    async def test_no_second_connection_when_already_started(self, coordinator_factory) -> None:
        coordinator, _ = await coordinator_factory(mode=AnycubicMQTTConnectMode.Always, mqtt_started=True)

        assert coordinator._anycubic_mqtt_connection_should_start() is False

    async def test_manual_switch_forces_a_connection(self, coordinator_factory) -> None:
        """Turning the switch on should connect even in printing-only mode."""
        coordinator, _ = await coordinator_factory(mode=AnycubicMQTTConnectMode.Printing_Only)
        coordinator._mqtt_manually_connected = True

        assert coordinator._anycubic_mqtt_connection_should_start() is True

    async def test_no_connection_while_home_assistant_is_stopping(self, hass: HomeAssistant, coordinator_factory) -> None:
        coordinator, _ = await coordinator_factory(mode=AnycubicMQTTConnectMode.Always)
        hass.set_state(CoreState.stopping)

        assert coordinator._anycubic_mqtt_connection_should_start() is False


class TestWhenToDisconnect:
    """Letting go matters as much as connecting."""

    async def test_shutdown_closes_the_connection(self, hass: HomeAssistant, coordinator_factory) -> None:
        coordinator, _ = await coordinator_factory(mode=AnycubicMQTTConnectMode.Always, mqtt_started=True)
        hass.set_state(CoreState.stopping)

        assert coordinator._anycubic_mqtt_connection_should_stop() is True

    async def test_a_manual_connection_is_never_dropped_for_idling(self, coordinator_factory) -> None:
        """The user asked for it; idleness shouldn't override that."""
        coordinator, _ = await coordinator_factory(mode=AnycubicMQTTConnectMode.Printing_Only, mqtt_started=True)
        coordinator._mqtt_manually_connected = True
        coordinator._mqtt_idle_since = int(time.time()) - MQTT_IDLE_DISCONNECT_SECONDS - 10

        assert coordinator._anycubic_mqtt_connection_should_stop() is False

    async def test_idling_starts_a_grace_period_rather_than_dropping(self, coordinator_factory) -> None:
        """Disconnecting the moment a print ends would thrash the connection."""
        coordinator, _ = await coordinator_factory(mode=AnycubicMQTTConnectMode.Printing_Only, mqtt_started=True)
        coordinator._mqtt_idle_since = None

        assert coordinator._anycubic_mqtt_connection_is_idle() is False
        assert coordinator._mqtt_idle_since is not None, "the grace period should start"

    async def test_idle_for_long_enough_disconnects(self, coordinator_factory) -> None:
        coordinator, _ = await coordinator_factory(mode=AnycubicMQTTConnectMode.Printing_Only, mqtt_started=True)
        coordinator._mqtt_idle_since = int(time.time()) - MQTT_IDLE_DISCONNECT_SECONDS - 10

        assert coordinator._anycubic_mqtt_connection_is_idle() is True
        assert coordinator._mqtt_idle_since is None, "the timer should reset"

    async def test_activity_clears_the_idle_timer(self, coordinator_factory) -> None:
        """A new print mid-countdown should cancel the pending disconnect."""
        coordinator, _ = await coordinator_factory(mode=AnycubicMQTTConnectMode.Always, mqtt_started=True)
        coordinator._mqtt_idle_since = int(time.time()) - 5

        assert coordinator._anycubic_mqtt_connection_is_idle() is False
        assert coordinator._mqtt_idle_since is None


class TestConnectionHandling:
    """Starting and stopping the background task."""

    async def test_starting_subscribes_every_printer(self, coordinator_factory) -> None:
        coordinator, api = await coordinator_factory(mode=AnycubicMQTTConnectMode.Always)

        await coordinator._check_anycubic_mqtt_connection()

        api.mqtt_add_subscribed_printer.assert_called()
        assert coordinator._mqtt_task is not None

    async def test_stopping_unsubscribes_and_disconnects(self, coordinator_factory) -> None:
        coordinator, api = await coordinator_factory(mqtt_started=True)

        await coordinator._stop_anycubic_mqtt_connection()

        api.mqtt_unsubscribe_printer_status.assert_called()
        api.disconnect_mqtt.assert_called()
        assert coordinator._mqtt_task is None

    async def test_stop_if_started_is_a_no_op_when_not_started(self, coordinator_factory) -> None:
        coordinator, api = await coordinator_factory(mqtt_started=False)

        await coordinator.stop_anycubic_mqtt_connection_if_started()

        api.disconnect_mqtt.assert_not_called()

    async def test_refresh_is_rate_limited(self, coordinator_factory) -> None:
        """Reconnecting on every poll would be worse than not refreshing."""
        coordinator, api = await coordinator_factory(mqtt_started=True)
        coordinator._mqtt_last_refresh = int(time.time())

        await coordinator.refresh_anycubic_mqtt_connection()

        api.disconnect_mqtt.assert_not_called()

    async def test_refresh_reconnects_when_due(self, coordinator_factory) -> None:
        coordinator, api = await coordinator_factory(mode=AnycubicMQTTConnectMode.Always, mqtt_started=True)
        coordinator._mqtt_last_refresh = None

        with patch("asyncio.sleep", AsyncMock()):
            await coordinator.refresh_anycubic_mqtt_connection()

        api.disconnect_mqtt.assert_called()

    async def test_a_refresh_in_flight_blocks_the_routine_check(self, coordinator_factory) -> None:
        """Otherwise a poll mid-refresh would reconnect against the teardown."""
        coordinator, api = await coordinator_factory(mode=AnycubicMQTTConnectMode.Always)
        coordinator._mqtt_task = None

        async with coordinator._mqtt_refresh_lock:
            await coordinator._check_anycubic_mqtt_connection()

        assert coordinator._mqtt_task is None


class TestMqttCallbacks:
    """Messages arriving from the broker drive the entity states."""

    async def test_update_callback_refreshes_listeners(self, hass: HomeAssistant, mock_entry, mock_api) -> None:
        await _setup(hass, mock_entry)
        coordinator = mock_entry.runtime_data

        with patch.object(coordinator, "async_update_listeners") as notify:
            coordinator._mqtt_callback_data_updated()
            await hass.async_block_till_done()

        notify.assert_called()


class TestConnectModes:
    """Each mode decides connect/disconnect from a different signal.

    Getting one wrong means either a permanently open connection (the log-noise
    problem) or missing live updates during a print, so every mode is checked
    against both a matching and a non-matching printer state.
    """

    @pytest.fixture
    def printer_state(self, mock_api):
        """Drive the predicates by faking what the printer reports."""

        def _set(printing=False, drying=False, online=True):
            _, printer = mock_api
            # These are the attributes the predicates actually read.
            patches = [
                patch.object(type(printer), "is_busy", property(lambda _s: printing)),
                patch.object(
                    type(printer),
                    "latest_project_print_in_progress",
                    property(lambda _s: printing),
                ),
                patch.object(
                    type(printer),
                    "primary_drying_status_is_drying",
                    property(lambda _s: drying),
                ),
                patch.object(
                    type(printer),
                    "secondary_drying_status_is_drying",
                    property(lambda _s: False),
                ),
                patch.object(type(printer), "printer_online", property(lambda _s: online)),
            ]
            for p in patches:
                p.start()
            return patches

        started: list = []
        yield lambda **kw: started.extend(_set(**kw))
        for p in started:
            p.stop()

    @pytest.mark.parametrize(
        ("mode", "state", "expect_active"),
        [
            (AnycubicMQTTConnectMode.Printing_Only, {"printing": True}, True),
            (AnycubicMQTTConnectMode.Printing_Only, {"printing": False}, False),
            (AnycubicMQTTConnectMode.Printing_Drying, {"printing": True}, True),
            (
                AnycubicMQTTConnectMode.Printing_Drying,
                {"printing": False, "drying": True},
                True,
            ),
            (
                AnycubicMQTTConnectMode.Printing_Drying,
                {"printing": False, "drying": False},
                False,
            ),
            (AnycubicMQTTConnectMode.Device_Online, {"online": True}, True),
            (AnycubicMQTTConnectMode.Device_Online, {"online": False}, False),
            (AnycubicMQTTConnectMode.Always, {"printing": False}, True),
            (AnycubicMQTTConnectMode.Never_Connect, {"printing": True}, False),
        ],
    )
    async def test_mode_decides_whether_to_hold_the_connection(
        self, coordinator_factory, printer_state, mode, state, expect_active
    ) -> None:
        printer_state(**state)
        coordinator, _ = await coordinator_factory(mode=mode)

        assert coordinator._check_mqtt_connection_modes_active() is expect_active

    async def test_a_recent_action_keeps_the_connection_regardless_of_mode(self, coordinator_factory, printer_state) -> None:
        """A command needs its reply, even if nothing is printing."""
        printer_state(printing=False)
        coordinator, _ = await coordinator_factory(mode=AnycubicMQTTConnectMode.Printing_Only)
        coordinator._mqtt_last_action = int(time.time())

        assert coordinator._check_mqtt_connection_modes_active() is True
        assert coordinator._check_mqtt_connection_modes_inactive() is False

    async def test_a_stale_action_no_longer_holds_it(self, coordinator_factory, printer_state) -> None:
        printer_state(printing=False)
        coordinator, _ = await coordinator_factory(mode=AnycubicMQTTConnectMode.Printing_Only)
        coordinator._mqtt_last_action = int(time.time()) - 3600

        assert coordinator._check_mqtt_connection_modes_active() is False

    @pytest.mark.parametrize(
        ("mode", "state", "expect_inactive"),
        [
            (AnycubicMQTTConnectMode.Printing_Only, {"printing": False}, True),
            (AnycubicMQTTConnectMode.Printing_Only, {"printing": True}, False),
            (
                AnycubicMQTTConnectMode.Printing_Drying,
                {"printing": False, "drying": False},
                True,
            ),
            (
                AnycubicMQTTConnectMode.Printing_Drying,
                {"printing": False, "drying": True},
                False,
            ),
            (AnycubicMQTTConnectMode.Device_Online, {"online": False}, True),
            (AnycubicMQTTConnectMode.Device_Online, {"online": True}, False),
            (AnycubicMQTTConnectMode.Always, {"printing": False}, False),
        ],
    )
    async def test_mode_decides_whether_to_let_go(
        self, coordinator_factory, printer_state, mode, state, expect_inactive
    ) -> None:
        printer_state(**state)
        coordinator, _ = await coordinator_factory(mode=mode)

        assert coordinator._check_mqtt_connection_modes_inactive() is expect_inactive


class TestBrokerCallbacks:
    """What happens when the broker pushes something."""

    async def test_a_started_print_forces_a_refresh(self, hass: HomeAssistant, mock_entry, mock_api) -> None:
        """The cloud lags the printer, hence the deliberate delay first."""
        await _setup(hass, mock_entry)
        coordinator = mock_entry.runtime_data

        with (
            patch("asyncio.sleep", AsyncMock()),
            patch.object(type(coordinator), "force_state_update", AsyncMock()) as refresh,
        ):
            await coordinator._async_print_job_started()

        refresh.assert_awaited_once()

    async def test_print_started_callback_schedules_the_work(self, hass: HomeAssistant, mock_entry, mock_api) -> None:
        await _setup(hass, mock_entry)
        coordinator = mock_entry.runtime_data

        with patch("asyncio.sleep", AsyncMock()):
            coordinator._mqtt_callback_print_job_started()
            await hass.async_block_till_done()

    async def test_subscribing_queries_online_printers(self, hass: HomeAssistant, mock_entry, mock_api) -> None:
        _, printer = mock_api
        await _setup(hass, mock_entry)
        coordinator = mock_entry.runtime_data

        with (
            patch("asyncio.sleep", AsyncMock()),
            patch.object(type(printer), "query_printer_options", AsyncMock()) as query,
        ):
            await coordinator._async_mqtt_callback_subscribed()

        query.assert_awaited_once()

    async def test_an_offline_printer_is_not_queried(self, hass: HomeAssistant, mock_entry, mock_api) -> None:
        _, printer = mock_api
        await _setup(hass, mock_entry)
        coordinator = mock_entry.runtime_data

        with (
            patch("asyncio.sleep", AsyncMock()),
            patch.object(type(printer), "printer_online", property(lambda _s: False)),
            patch.object(type(printer), "query_printer_options", AsyncMock()) as query,
        ):
            await coordinator._async_mqtt_callback_subscribed()

        query.assert_not_awaited()

    async def test_a_failed_query_does_not_break_the_subscription(self, hass: HomeAssistant, mock_entry, mock_api) -> None:
        """One unhappy printer shouldn't stop the others being set up."""
        _, printer = mock_api
        await _setup(hass, mock_entry)
        coordinator = mock_entry.runtime_data

        with (
            patch("asyncio.sleep", AsyncMock()),
            patch.object(
                type(printer),
                "query_printer_options",
                AsyncMock(side_effect=Exception("printer busy")),
            ),
        ):
            await coordinator._async_mqtt_callback_subscribed()

    async def test_subscribed_callback_schedules_the_work(self, hass: HomeAssistant, mock_entry, mock_api) -> None:
        await _setup(hass, mock_entry)
        coordinator = mock_entry.runtime_data

        with patch("asyncio.sleep", AsyncMock()):
            coordinator._mqtt_callback_subscribed()
            await hass.async_block_till_done()


class TestActionConnection:
    """Commands need a live connection to get their reply."""

    async def test_a_command_marks_the_connection_as_needed(self, coordinator_factory) -> None:
        coordinator, api = await coordinator_factory(mode=AnycubicMQTTConnectMode.Always, mqtt_started=True)
        api.mqtt_wait_for_connect = AsyncMock(return_value=True)

        await coordinator._connect_mqtt_for_action_response()

        assert coordinator._mqtt_last_action is not None

    async def test_a_connection_timeout_is_a_translated_error(self, coordinator_factory) -> None:
        """Quality scale (exception-translations)."""
        from homeassistant.exceptions import HomeAssistantError

        coordinator, api = await coordinator_factory(mode=AnycubicMQTTConnectMode.Always, mqtt_started=True)
        api.mqtt_wait_for_connect = AsyncMock(return_value=False)

        with pytest.raises(HomeAssistantError) as err:
            await coordinator._connect_mqtt_for_action_response()

        assert err.value.translation_key == "mqtt_connect_timeout"


class TestTokenPersistence:
    """Tokens can be rotated by the cloud mid-session."""

    async def test_a_rotated_token_is_saved(self, hass: HomeAssistant, mock_entry, mock_api) -> None:
        """Losing a refreshed token means an unnecessary re-auth later."""
        await _setup(hass, mock_entry)
        coordinator = mock_entry.runtime_data
        api, _ = mock_api
        api.tokens_changed = True

        with patch(
            "homeassistant.helpers.storage.Store.async_save",
            AsyncMock(),
        ) as save:
            await coordinator._check_or_save_tokens()

        save.assert_awaited_once()

    async def test_an_unchanged_token_is_not_rewritten(self, hass: HomeAssistant, mock_entry, mock_api) -> None:
        await _setup(hass, mock_entry)
        coordinator = mock_entry.runtime_data
        api, _ = mock_api
        api.tokens_changed = False

        with patch(
            "homeassistant.helpers.storage.Store.async_save",
            AsyncMock(),
        ) as save:
            await coordinator._check_or_save_tokens()

        save.assert_not_awaited()

    async def test_a_rejected_token_asks_for_reauth(self, hass: HomeAssistant, mock_entry, mock_api) -> None:
        from homeassistant.exceptions import ConfigEntryAuthFailed

        await _setup(hass, mock_entry)
        coordinator = mock_entry.runtime_data
        api, _ = mock_api
        api.check_api_tokens = AsyncMock(return_value=False)

        with pytest.raises(ConfigEntryAuthFailed):
            await coordinator._check_or_save_tokens()
