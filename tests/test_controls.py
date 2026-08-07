"""Tests for the live print controls and drying.

Every one of these calls has existed as an action since before this fork.
None were reachable from the device page, which is where people look -- the
complaint that prompted them was "I can pause, stop and turn on the light".
So the thing worth pinning is that they exist as entities, are enabled, and
refuse politely when the printer would refuse.
"""

from __future__ import annotations

from unittest.mock import AsyncMock, PropertyMock, patch

import pytest
from helpers import PRINTER_ID, setup_entry
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import HomeAssistantError


def _set_printing(entry, hass, printing: bool) -> None:
    """Mark a job as running in coordinator state.

    The live controls report unavailable when idle, so without this a service
    call never reaches the code under test.
    """
    entry.runtime_data.data["printers"][PRINTER_ID]["states"]["job_in_progress"] = printing
    entry.runtime_data.async_update_listeners()


class TestControlsAreVisible:
    """Disabled-by-default would leave the device page exactly as bare."""

    @pytest.mark.parametrize(
        "entity_id",
        [
            "number.anycubic_kobra_s1_set_nozzle_temperature",
            "number.anycubic_kobra_s1_set_bed_temperature",
            "number.anycubic_kobra_s1_set_fan_speed",
            "number.anycubic_kobra_s1_set_auxiliary_fan_speed",
            "select.anycubic_kobra_s1_print_speed_mode",
        ],
    )
    async def test_control_exists_without_being_enabled_by_hand(
        self, hass: HomeAssistant, mock_entry, mock_api, entity_id
    ) -> None:
        await setup_entry(hass, mock_entry)

        assert hass.states.get(entity_id) is not None, f"{entity_id} was not created"

    async def test_drying_can_be_started_from_the_ace_device(self, hass: HomeAssistant, mock_entry, mock_api) -> None:
        """Previously the ACE page offered stop and no way to start."""
        await setup_entry(hass, mock_entry)

        assert hass.states.get("button.anycubic_kobra_s1_ace_pro_start_drying") is not None
        assert hass.states.get("number.anycubic_kobra_s1_ace_pro_drying_temperature") is not None
        assert hass.states.get("number.anycubic_kobra_s1_ace_pro_drying_duration") is not None


class TestControlsReachThePrinter:
    async def test_setting_a_temperature_calls_the_printer(self, hass: HomeAssistant, mock_entry, mock_api) -> None:
        await setup_entry(hass, mock_entry)
        _, printer = mock_api
        called = AsyncMock()
        _set_printing(mock_entry, hass, True)
        await hass.async_block_till_done()

        with (
            patch.object(
                type(printer),
                "latest_project_print_in_progress",
                PropertyMock(return_value=True),
            ),
            patch.object(type(printer), "change_print_setting_target_nozzle_temp", called),
        ):
            await hass.services.async_call(
                "number",
                "set_value",
                {
                    "entity_id": "number.anycubic_kobra_s1_set_nozzle_temperature",
                    "value": 215,
                },
                blocking=True,
            )

        called.assert_awaited_once_with(215)

    async def test_an_idle_printer_refuses_rather_than_dropping_it(self, hass: HomeAssistant, mock_entry, mock_api) -> None:
        """The printer ignores these when nothing is printing.

        Accepting the value and silently discarding it would look like it
        worked, which is worse than an error.
        """
        await setup_entry(hass, mock_entry)
        _, printer = mock_api
        # Available (so the call gets through) but the printer says no.
        _set_printing(mock_entry, hass, True)
        await hass.async_block_till_done()

        with (
            patch.object(
                type(printer),
                "latest_project_print_in_progress",
                PropertyMock(return_value=False),
            ),
            pytest.raises(HomeAssistantError, match="while a job is running"),
        ):
            await hass.services.async_call(
                "number",
                "set_value",
                {
                    "entity_id": "number.anycubic_kobra_s1_set_nozzle_temperature",
                    "value": 215,
                },
                blocking=True,
            )


class TestSpeedMode:
    """Options come from the printer, not from a list hardcoded here."""

    async def test_options_are_whatever_the_printer_reports(self, hass: HomeAssistant, mock_entry, mock_api) -> None:
        await setup_entry(hass, mock_entry)
        coordinator = mock_entry.runtime_data
        _set_printing(mock_entry, hass, True)
        coordinator.data["printers"][PRINTER_ID]["attributes"]["job_speed_mode"] = {
            "available_modes": [
                {"description": "Quiet", "mode": 1},
                {"description": "Standard", "mode": 2},
                {"description": "Sport", "mode": 3},
            ],
        }
        coordinator.async_update_listeners()
        await hass.async_block_till_done()

        state = hass.states.get("select.anycubic_kobra_s1_print_speed_mode")

        assert state is not None
        assert state.attributes["options"] == ["Quiet", "Standard", "Sport"]

    async def test_choosing_a_mode_sends_the_printer_its_own_code(self, hass: HomeAssistant, mock_entry, mock_api) -> None:
        """The printer wants the numeric code, not the name shown."""
        await setup_entry(hass, mock_entry)
        coordinator = mock_entry.runtime_data
        _set_printing(mock_entry, hass, True)
        coordinator.data["printers"][PRINTER_ID]["attributes"]["job_speed_mode"] = {
            "available_modes": [
                {"description": "Quiet", "mode": 1},
                {"description": "Sport", "mode": 3},
            ],
        }
        coordinator.async_update_listeners()
        await hass.async_block_till_done()

        sent = AsyncMock()
        _, printer = mock_api

        with (
            patch.object(
                type(printer),
                "latest_project_print_in_progress",
                PropertyMock(return_value=True),
            ),
            patch.object(type(printer), "change_print_setting_speed_mode", sent),
        ):
            await hass.services.async_call(
                "select",
                "select_option",
                {
                    "entity_id": "select.anycubic_kobra_s1_print_speed_mode",
                    "option": "Sport",
                },
                blocking=True,
            )

        sent.assert_awaited_once_with(3)


class TestDrying:
    async def test_start_uses_the_temperature_and_duration_set_alongside(
        self, hass: HomeAssistant, mock_entry, mock_api
    ) -> None:
        """No preset configuration required -- that was the gap."""
        await setup_entry(hass, mock_entry)
        coordinator = mock_entry.runtime_data
        _, printer = mock_api

        await hass.services.async_call(
            "number",
            "set_value",
            {
                "entity_id": "number.anycubic_kobra_s1_ace_pro_drying_temperature",
                "value": 55,
            },
            blocking=True,
        )
        await hass.services.async_call(
            "number",
            "set_value",
            {
                "entity_id": "number.anycubic_kobra_s1_ace_pro_drying_duration",
                "value": 240,
            },
            blocking=True,
        )

        started = AsyncMock()
        with patch.object(type(printer), "multi_color_box_drying_start", started):
            await hass.services.async_call(
                "button",
                "press",
                {"entity_id": "button.anycubic_kobra_s1_ace_pro_start_drying"},
                blocking=True,
            )

        started.assert_awaited_once_with(duration=240, target_temp=55)
        assert coordinator is not None

    async def test_sensible_defaults_before_anything_is_set(self, hass: HomeAssistant, mock_entry, mock_api) -> None:
        await setup_entry(hass, mock_entry)

        temp = hass.states.get("number.anycubic_kobra_s1_ace_pro_drying_temperature")
        duration = hass.states.get("number.anycubic_kobra_s1_ace_pro_drying_duration")

        assert temp is not None and float(temp.state) == 45.0
        assert duration is not None and float(duration.state) == 120.0
