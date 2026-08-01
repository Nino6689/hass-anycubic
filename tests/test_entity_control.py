"""Tests for controlling the printer through its entities.

Everything here goes in via Home Assistant's own service calls, the same way a
dashboard button or an automation would, so the wiring between an entity and
the printer method behind it is what's under test -- not the coordinator API
in isolation.
"""

from __future__ import annotations

from unittest.mock import AsyncMock, patch

import pytest
from helpers import PRINTER_ID
from helpers import setup_entry as _setup
from homeassistant.const import (
    ATTR_ENTITY_ID,
    SERVICE_TURN_OFF,
    SERVICE_TURN_ON,
    STATE_UNAVAILABLE,
    Platform,
)
from homeassistant.core import HomeAssistant

from custom_components.anycubic_cloud.const import (
    CONF_DRYING_PRESET_DURATION_,
    CONF_DRYING_PRESET_TEMPERATURE_,
)

MQTT_SWITCH = "switch.anycubic_kobra_s1_manual_mqtt_connection_enabled"
REFILL_SWITCH = "switch.anycubic_kobra_s1_ace_pro_ace_run_out_refill"


@pytest.fixture
def no_mqtt_wait(mock_api):
    """Skip the MQTT connect the control paths do before acting."""
    from custom_components.anycubic_cloud.coordinator import (
        AnycubicCloudDataUpdateCoordinator as Coordinator,
    )

    with patch.object(Coordinator, "_connect_mqtt_for_action_response", AsyncMock()):
        yield


class TestSwitches:
    """Switches are the most-used control surface on the card."""

    async def test_mqtt_switch_turns_the_connection_on(self, hass: HomeAssistant, mock_entry, mock_api, no_mqtt_wait) -> None:
        await _setup(hass, mock_entry)

        await hass.services.async_call(Platform.SWITCH, SERVICE_TURN_ON, {ATTR_ENTITY_ID: MQTT_SWITCH}, blocking=True)

        assert mock_entry.runtime_data._mqtt_manually_connected is True

    async def test_mqtt_switch_turns_the_connection_off(self, hass: HomeAssistant, mock_entry, mock_api, no_mqtt_wait) -> None:
        await _setup(hass, mock_entry)
        coordinator = mock_entry.runtime_data
        coordinator._mqtt_manually_connected = True

        await hass.services.async_call(
            Platform.SWITCH,
            SERVICE_TURN_OFF,
            {ATTR_ENTITY_ID: MQTT_SWITCH},
            blocking=True,
        )

        assert coordinator._mqtt_manually_connected is False

    @pytest.mark.parametrize(
        ("service", "printer_method"),
        [
            (SERVICE_TURN_ON, "multi_color_box_switch_on_auto_feed"),
            (SERVICE_TURN_OFF, "multi_color_box_switch_off_auto_feed"),
        ],
    )
    async def test_runout_refill_reaches_the_ace(
        self,
        hass: HomeAssistant,
        mock_entry,
        mock_api,
        no_mqtt_wait,
        service,
        printer_method,
    ) -> None:
        _, printer = mock_api
        await _setup(hass, mock_entry)

        with patch.object(type(printer), printer_method, AsyncMock()) as called:
            await hass.services.async_call(
                Platform.SWITCH,
                service,
                {ATTR_ENTITY_ID: REFILL_SWITCH},
                blocking=True,
            )

        called.assert_awaited_once()

    async def test_unknown_switch_key_does_nothing(self, hass: HomeAssistant, mock_entry, mock_api, no_mqtt_wait) -> None:
        """An unrecognised key must not fall through to a state refresh."""
        await _setup(hass, mock_entry)
        coordinator = mock_entry.runtime_data

        with patch.object(type(coordinator), "force_state_update", AsyncMock()) as refresh:
            await coordinator.switch_on_event(PRINTER_ID, "not_a_real_switch")

        refresh.assert_not_awaited()


class TestLight:
    """The printer's chamber light."""

    async def test_turning_the_light_on(self, hass: HomeAssistant, mock_entry, mock_api, no_mqtt_wait) -> None:
        _, printer = mock_api
        await _setup(hass, mock_entry)
        coordinator = mock_entry.runtime_data

        with patch.object(type(printer), "set_light", AsyncMock()) as set_light:
            await coordinator.set_printer_light(PRINTER_ID, light_on=True)

        set_light.assert_awaited_once_with(light_on=True, brightness=None)

    async def test_brightness_is_passed_through(self, hass: HomeAssistant, mock_entry, mock_api, no_mqtt_wait) -> None:
        _, printer = mock_api
        await _setup(hass, mock_entry)
        coordinator = mock_entry.runtime_data

        with patch.object(type(printer), "set_light", AsyncMock()) as set_light:
            await coordinator.set_printer_light(PRINTER_ID, light_on=True, brightness=128)

        assert set_light.await_args.kwargs["brightness"] == 128

    async def test_unknown_printer_is_a_no_op(self, hass: HomeAssistant, mock_entry, mock_api, no_mqtt_wait) -> None:
        """Better a silent no-op than a traceback from a stale entity."""
        await _setup(hass, mock_entry)
        coordinator = mock_entry.runtime_data

        with patch.object(type(coordinator), "force_state_update", AsyncMock()) as refresh:
            await coordinator.set_printer_light(999999, light_on=True)

        refresh.assert_not_awaited()


class TestDryingPresets:
    """Drying presets come from the options flow, not from the printer."""

    async def test_preset_button_uses_the_configured_values(
        self, hass: HomeAssistant, mock_entry, mock_api, no_mqtt_wait
    ) -> None:
        hass.config_entries.async_update_entry(
            mock_entry,
            options={
                f"{CONF_DRYING_PRESET_DURATION_}1": 120,
                f"{CONF_DRYING_PRESET_TEMPERATURE_}1": 55,
            },
        )
        _, printer = mock_api
        await _setup(hass, mock_entry)
        coordinator = mock_entry.runtime_data

        with patch.object(type(printer), "multi_color_box_drying_start", AsyncMock()) as start:
            await coordinator.button_press_event(PRINTER_ID, "drying_start_preset_1")

        start.assert_awaited_once()
        assert start.await_args.kwargs["duration"] == 120
        assert start.await_args.kwargs["target_temp"] == 55

    async def test_unconfigured_preset_does_nothing(self, hass: HomeAssistant, mock_entry, mock_api, no_mqtt_wait) -> None:
        """Starting a dry at an unset temperature would be a bad guess."""
        await _setup(hass, mock_entry)
        coordinator = mock_entry.runtime_data
        _, printer = mock_api

        with patch.object(type(printer), "multi_color_box_drying_start", AsyncMock()) as start:
            await coordinator.button_press_event(PRINTER_ID, "drying_start_preset_1")

        start.assert_not_awaited()

    async def test_secondary_ace_preset_targets_box_one(self, hass: HomeAssistant, mock_entry, mock_api, no_mqtt_wait) -> None:
        """A second ACE is box 1; sending it to box 0 would dry the wrong unit."""
        hass.config_entries.async_update_entry(
            mock_entry,
            options={
                f"{CONF_DRYING_PRESET_DURATION_}1": 120,
                f"{CONF_DRYING_PRESET_TEMPERATURE_}1": 55,
            },
        )
        _, printer = mock_api
        await _setup(hass, mock_entry)
        coordinator = mock_entry.runtime_data

        with patch.object(type(printer), "multi_color_box_drying_start", AsyncMock()) as start:
            await coordinator.button_press_event(PRINTER_ID, "secondary_drying_start_preset_1")

        assert start.await_args.kwargs["box_id"] == 1


class TestEntityAvailability:
    """Quality scale (entity-unavailable)."""

    async def test_entities_report_a_state_after_setup(self, hass: HomeAssistant, mock_entry, mock_api) -> None:
        await _setup(hass, mock_entry)

        state = hass.states.get(MQTT_SWITCH)

        assert state is not None
        assert state.state != STATE_UNAVAILABLE


class TestButtonActions:
    """A sweep over the buttons on the card.

    Each is a one-line dispatch to a printer method, so the failure they share
    is a mis-wired key -- pressing "pause" and getting nothing, or the wrong
    ACE unit. Driving every key catches that in one pass.
    """

    @pytest.mark.parametrize(
        ("event_key", "printer_method", "expected_kwargs"),
        [
            ("pause_print", "pause_print", {}),
            ("resume_print", "resume_print", {}),
            ("cancel_print", "cancel_print", {}),
            ("ace_refresh_spools", "multi_color_box_get_info", {}),
            ("drying_stop", "multi_color_box_drying_stop", {}),
            ("secondary_drying_stop", "multi_color_box_drying_stop", {"box_id": 1}),
            ("request_file_list_udisk", "request_udisk_file_list", {}),
        ],
    )
    async def test_button_reaches_the_printer(
        self,
        hass: HomeAssistant,
        mock_entry,
        mock_api,
        no_mqtt_wait,
        event_key,
        printer_method,
        expected_kwargs,
    ) -> None:
        _, printer = mock_api
        await _setup(hass, mock_entry)
        coordinator = mock_entry.runtime_data

        with patch.object(type(printer), printer_method, AsyncMock()) as called:
            await coordinator.button_press_event(PRINTER_ID, event_key)

        called.assert_awaited_once()
        for key, value in expected_kwargs.items():
            assert called.await_args.kwargs[key] == value

    async def test_unknown_button_key_does_nothing(self, hass: HomeAssistant, mock_entry, mock_api, no_mqtt_wait) -> None:
        await _setup(hass, mock_entry)
        coordinator = mock_entry.runtime_data

        with patch.object(type(coordinator), "force_state_update", AsyncMock()) as refresh:
            await coordinator.button_press_event(PRINTER_ID, "not_a_real_button")

        refresh.assert_not_awaited()

    async def test_cloud_file_refresh_reloads_the_list(self, hass: HomeAssistant, mock_entry, mock_api, no_mqtt_wait) -> None:
        await _setup(hass, mock_entry)
        coordinator = mock_entry.runtime_data

        with patch.object(type(coordinator), "refresh_cloud_files", AsyncMock()) as refresh:
            await coordinator.button_press_event(PRINTER_ID, "request_file_list_cloud")

        refresh.assert_awaited_once()

    async def test_mqtt_refresh_button(self, hass: HomeAssistant, mock_entry, mock_api, no_mqtt_wait) -> None:
        await _setup(hass, mock_entry)
        coordinator = mock_entry.runtime_data

        with patch.object(type(coordinator), "refresh_anycubic_mqtt_connection", AsyncMock()) as refresh:
            await coordinator.button_press_event(PRINTER_ID, "refresh_mqtt_connection")

        refresh.assert_awaited_once()

    async def test_a_cloud_error_surfaces_to_the_user(self, hass: HomeAssistant, mock_entry, mock_api, no_mqtt_wait) -> None:
        """Quality scale (action-exceptions): a failed press must not pass silently."""
        from anycubic_cloud_api import AnycubicAPIError
        from homeassistant.exceptions import HomeAssistantError

        _, printer = mock_api
        await _setup(hass, mock_entry)
        coordinator = mock_entry.runtime_data

        with patch.object(type(printer), "pause_print", AsyncMock(side_effect=AnycubicAPIError("nope"))):
            with pytest.raises(HomeAssistantError):
                await coordinator.button_press_event(PRINTER_ID, "pause_print")


class TestFirmwareUpdate:
    """Update entities for the printer and each ACE."""

    @pytest.mark.parametrize(
        ("event_key", "printer_method", "expected_kwargs"),
        [
            ("fw_version", "update_printer_firmware", {}),
            (
                "multi_color_box_fw_version",
                "update_printer_multi_color_box_firmware",
                {},
            ),
            (
                "secondary_multi_color_box_fw_version",
                "update_printer_multi_color_box_firmware",
                {"box_id": 1},
            ),
        ],
    )
    async def test_update_targets_the_right_hardware(
        self,
        hass: HomeAssistant,
        mock_entry,
        mock_api,
        no_mqtt_wait,
        event_key,
        printer_method,
        expected_kwargs,
    ) -> None:
        _, printer = mock_api
        await _setup(hass, mock_entry)
        coordinator = mock_entry.runtime_data

        with patch.object(type(printer), printer_method, AsyncMock()) as called:
            await coordinator.fw_update_event(PRINTER_ID, event_key)

        called.assert_awaited_once()
        for key, value in expected_kwargs.items():
            assert called.await_args.kwargs[key] == value

    async def test_unknown_update_key_does_nothing(self, hass: HomeAssistant, mock_entry, mock_api, no_mqtt_wait) -> None:
        await _setup(hass, mock_entry)
        coordinator = mock_entry.runtime_data

        with patch.object(type(coordinator), "force_state_update", AsyncMock()) as refresh:
            await coordinator.fw_update_event(PRINTER_ID, "not_a_real_update")

        refresh.assert_not_awaited()
