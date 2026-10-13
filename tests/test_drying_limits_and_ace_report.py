"""2.9.5: dry within what the ACE accepts, and ask for the full ACE report.

From a Kobra S1 with two ACE Pro units (#42): the 65 C PETG profile was
refused by an ACE Pro with code 11505, and after every restart the second
unit stayed unavailable until Refresh ACE Spools was pressed. Plus the
Kobra 4's camera, which misreports 206 like the Kobra X (discussion #37).
"""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, PropertyMock, patch

import pytest
from helpers import PRINTER_ID, setup_entry
from homeassistant.core import HomeAssistant

from custom_components.anycubic_cloud.camera import AnycubicCamera
from custom_components.anycubic_cloud.filament import clamp_drying_temperature

PETG = PropertyMock(return_value=[{"material_type": "PETG", "edit_status": 0}])


class TestDryingLimit:
    @pytest.mark.parametrize(
        ("temperature", "model_id", "expected"),
        [
            (65, 40001, 55),
            (55, 40001, 55),
            (45, 40001, 45),
            (65, 40002, 65),
            (65, None, 65),
            (70, 0, 70),
        ],
    )
    def test_only_a_known_limit_is_applied(self, temperature, model_id, expected) -> None:
        assert clamp_drying_temperature(temperature, model_id) == expected

    async def test_a_stored_setting_is_capped_when_drying_starts(self, hass: HomeAssistant, mock_entry, mock_api) -> None:
        """Someone who set 65 C on an ACE Pro gets a cycle, not a silent refusal."""
        await setup_entry(hass, mock_entry)
        coordinator = mock_entry.runtime_data
        await coordinator.async_set_drying_setting(PRINTER_ID, "temperature", 65)
        _, printer = mock_api
        start = AsyncMock()

        with patch.object(type(printer), "multi_color_box_drying_start", start):
            await coordinator.async_start_drying(PRINTER_ID)

        assert start.await_args.kwargs["target_temp"] == 55

    async def test_the_second_ace_pro_is_capped_too(self, hass: HomeAssistant, mock_entry, mock_api_two_ace) -> None:
        await setup_entry(hass, mock_entry)
        _, printer = mock_api_two_ace
        start = AsyncMock()

        with (
            patch.object(type(printer), "secondary_multi_color_box_spool_info_object", PETG),
            patch.object(type(printer), "secondary_multi_color_box_loaded_slot", PropertyMock(return_value=None)),
            patch.object(type(printer), "multi_color_box_drying_start", start),
        ):
            await mock_entry.runtime_data.async_start_drying(PRINTER_ID, box_id=1)

        assert start.await_args.kwargs == {"duration": 360, "target_temp": 55, "box_id": 1}

    async def test_a_preset_is_capped_as_well(self, hass: HomeAssistant, mock_entry, mock_api) -> None:
        await setup_entry(hass, mock_entry)
        coordinator = mock_entry.runtime_data
        _, printer = mock_api
        start = AsyncMock()

        with (
            patch(
                "custom_components.anycubic_cloud.coordinator.get_drying_preset_from_entry_options",
                return_value=(240, 65),
            ),
            patch.object(coordinator, "_connect_mqtt_for_action_response", AsyncMock()),
            patch.object(type(printer), "multi_color_box_drying_start", start),
        ):
            await coordinator.button_press_event(PRINTER_ID, "drying_start_preset_1")

        assert start.await_args.kwargs == {"duration": 240, "target_temp": 55, "box_id": 0}

    async def test_no_printer_leaves_the_temperature_alone(self, hass: HomeAssistant, mock_entry, mock_api) -> None:
        await setup_entry(hass, mock_entry)

        assert mock_entry.runtime_data._drying_temperature_for_box(12345, 0, 65) == 65


class TestAceReportOnConnect:
    async def _coordinator(self, hass, mock_entry):
        await setup_entry(hass, mock_entry)
        coordinator = mock_entry.runtime_data
        coordinator._ace_info_requested.clear()
        coordinator._ace_info_connected_since = None
        return coordinator

    async def test_asked_once_a_refresh_after_mqtt_comes_up(self, hass: HomeAssistant, mock_entry, mock_api) -> None:
        api, printer = mock_api
        coordinator = await self._coordinator(hass, mock_entry)
        ask = AsyncMock()
        api.mqtt_is_started = True

        with patch.object(type(printer), "multi_color_box_get_info", ask):
            coordinator._request_ace_info_once()
            await hass.async_block_till_done()
            assert ask.await_count == 0, "the first refresh only notes the connection"

            coordinator._request_ace_info_once()
            await hass.async_block_till_done()
            coordinator._request_ace_info_once()
            await hass.async_block_till_done()

        assert ask.await_count == 1

    async def test_never_opens_a_connection_itself(self, hass: HomeAssistant, mock_entry, mock_api) -> None:
        api, printer = mock_api
        coordinator = await self._coordinator(hass, mock_entry)
        ask = AsyncMock()
        api.mqtt_is_started = False

        with patch.object(type(printer), "multi_color_box_get_info", ask):
            for _ in range(3):
                coordinator._request_ace_info_once()
            await hass.async_block_till_done()

        assert ask.await_count == 0
        assert coordinator._mqtt_last_action is None

    async def test_asked_again_after_a_reconnect(self, hass: HomeAssistant, mock_entry, mock_api) -> None:
        api, printer = mock_api
        coordinator = await self._coordinator(hass, mock_entry)
        ask = AsyncMock()

        with patch.object(type(printer), "multi_color_box_get_info", ask):
            for started in (True, True, False, True, True):
                api.mqtt_is_started = started
                coordinator._request_ace_info_once()
                await hass.async_block_till_done()

        assert ask.await_count == 2

    async def test_a_printer_without_an_ace_is_not_asked(self, hass: HomeAssistant, mock_entry, mock_api) -> None:
        api, printer = mock_api
        coordinator = await self._coordinator(hass, mock_entry)
        ask = AsyncMock()
        api.mqtt_is_started = True

        with (
            patch.object(type(printer), "supports_function_multi_color_box", PropertyMock(return_value=False)),
            patch.object(type(printer), "multi_color_box_get_info", ask),
        ):
            coordinator._request_ace_info_once()
            coordinator._request_ace_info_once()
            await hass.async_block_till_done()

        assert ask.await_count == 0

    async def test_a_failed_ask_is_only_logged(self, hass: HomeAssistant, mock_entry, mock_api, caplog) -> None:
        api, printer = mock_api
        coordinator = await self._coordinator(hass, mock_entry)
        api.mqtt_is_started = True

        with patch.object(type(printer), "multi_color_box_get_info", AsyncMock(side_effect=RuntimeError("offline"))):
            coordinator._request_ace_info_once()
            coordinator._request_ace_info_once()
            await hass.async_block_till_done()

        assert "Could not ask printer" in caplog.text


class TestKobra4Camera:
    @pytest.mark.parametrize(("machine_type", "proxied"), [(20028, True), (20030, True), (20025, False)])
    def test_the_206_proxy_covers_the_kobra_4(self, machine_type, proxied) -> None:
        coordinator = MagicMock()
        coordinator.get_printer_for_id = MagicMock(return_value=MagicMock(machine_type=machine_type))

        with patch.object(AnycubicCamera, "__init__", lambda self, *a, **k: None):
            camera = AnycubicCamera()

        camera.coordinator = coordinator
        camera._printer_id = 1

        assert camera._needs_stream_proxy("http://10.0.66.28:18088/flv") is proxied
