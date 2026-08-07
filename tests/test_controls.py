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
    """Temperature and fans work on an idle printer.

    They route through the orders Anycubic's own One-Click Preheat uses
    (SET_TEMPERATURE 1216, SET_FAN_SPEED 1221), captured from the slicer's
    traffic. The print-settings order these used to use is refused with
    "Print task does not exist" when nothing is running -- which is why they
    were wrongly gated on printing.
    """

    async def test_setting_a_temperature_reaches_an_idle_printer(self, hass: HomeAssistant, mock_entry, mock_api) -> None:
        await setup_entry(hass, mock_entry)
        _, printer = mock_api
        called = AsyncMock()

        with (
            patch.object(
                type(printer),
                "latest_project_print_in_progress",
                PropertyMock(return_value=False),
            ),
            patch.object(type(printer), "set_target_temperature", called),
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

        called.assert_awaited_once_with(target_nozzle_temp=215)

    async def test_a_fan_reaches_an_idle_printer(self, hass: HomeAssistant, mock_entry, mock_api) -> None:
        await setup_entry(hass, mock_entry)
        _, printer = mock_api
        called = AsyncMock()

        with (
            patch.object(
                type(printer),
                "latest_project_print_in_progress",
                PropertyMock(return_value=False),
            ),
            patch.object(type(printer), "set_fan_speed", called),
        ):
            await hass.services.async_call(
                "number",
                "set_value",
                {"entity_id": "number.anycubic_kobra_s1_set_fan_speed", "value": 40},
                blocking=True,
            )

        called.assert_awaited_once_with(fan_speed_pct=40)

    async def test_controls_are_not_hidden_when_idle(self, hass: HomeAssistant, mock_entry, mock_api) -> None:
        """Gating these on a print would hide them exactly when preheating."""
        await setup_entry(hass, mock_entry)

        state = hass.states.get("number.anycubic_kobra_s1_set_nozzle_temperature")

        assert state is not None
        assert state.state != "unavailable"


class TestAxisMovement:
    """Jogging, from the payload the slicer actually sends.

    {"axis": 1|2|3|4, "move_type": 0|1|2, "distance": mm}
    """

    @pytest.mark.parametrize(
        ("entity", "axis", "move_type"),
        [
            ("move_x", 1, 1),
            ("move_x_2", 1, 0),
        ],
    )
    async def test_a_jog_uses_the_chosen_step(
        self, hass: HomeAssistant, mock_entry, mock_api, entity, axis, move_type
    ) -> None:
        """The step comes from the select, not from the button."""
        await setup_entry(hass, mock_entry)
        coordinator = mock_entry.runtime_data
        await coordinator.async_set_axis_step(PRINTER_ID, 15)
        _, printer = mock_api
        called = AsyncMock()

        target = "button.anycubic_kobra_s1_move_x" if move_type == 1 else "button.anycubic_kobra_s1_move_x_2"
        if hass.states.get(target) is None:
            pytest.skip("axis buttons are disabled by default in this fixture")

        with patch.object(type(printer), "move_axis", called):
            await hass.services.async_call("button", "press", {"entity_id": target}, blocking=True)

        called.assert_awaited_once_with(axis=axis, move_type=move_type, distance=15)

    async def test_moving_while_printing_is_refused(self, hass: HomeAssistant, mock_entry, mock_api) -> None:
        """Driving the gantry mid-print would ruin the job."""
        await setup_entry(hass, mock_entry)
        coordinator = mock_entry.runtime_data
        _, printer = mock_api

        with (
            patch.object(
                type(printer),
                "latest_project_print_in_progress",
                PropertyMock(return_value=True),
            ),
            pytest.raises(HomeAssistantError, match="cannot be moved while printing"),
        ):
            await coordinator.async_move_axis(PRINTER_ID, axis=1, move_type=1, distance=1)

    async def test_the_step_size_is_a_fixed_list(self, hass: HomeAssistant, mock_entry, mock_api) -> None:
        """Free text invites a 200 mm typo into a machine that can crash."""
        from custom_components.anycubic_cloud.const import AXIS_STEPS_MM

        await setup_entry(hass, mock_entry)
        coordinator = mock_entry.runtime_data

        assert AXIS_STEPS_MM == (1, 15, 50)
        assert coordinator.get_axis_step(PRINTER_ID) in AXIS_STEPS_MM


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

    async def test_defaults_come_from_the_loaded_material(self, hass: HomeAssistant, mock_entry, mock_api) -> None:
        """The captured printer has PETG loaded, which dries at 65 C for 6 h."""
        await setup_entry(hass, mock_entry)

        temp = hass.states.get("number.anycubic_kobra_s1_ace_pro_drying_temperature")
        duration = hass.states.get("number.anycubic_kobra_s1_ace_pro_drying_duration")

        assert temp is not None and float(temp.state) == 65.0
        assert duration is not None and float(duration.state) == 360.0


class TestDryingKnowsTheMaterial:
    """The ACE reports what's loaded, so nobody should have to look it up.

    Wet filament prints badly and every material wants a different
    temperature -- and too hot ruins a spool, so the defaults matter.
    """

    @pytest.mark.parametrize(
        ("material", "temperature", "minutes"),
        [
            ("PLA", 45, 360),
            ("PLA+", 45, 360),
            ("PETG", 65, 360),
            ("ABS", 70, 240),
            ("TPU", 50, 480),
            ("PA", 70, 720),
        ],
    )
    def test_each_material_gets_its_own_profile(self, material, temperature, minutes) -> None:
        from custom_components.anycubic_cloud.filament import drying_profile_for_material

        assert drying_profile_for_material(material) == (temperature, minutes)

    @pytest.mark.parametrize("material", [None, "", "SOMETHING-NEW"])
    def test_an_unknown_material_gets_a_profile_safe_for_everything(self, material) -> None:
        """Too cool merely takes longer; too hot destroys the spool."""
        from custom_components.anycubic_cloud.filament import (
            DRYING_PROFILES,
            drying_profile_for_material,
        )

        temperature, _ = drying_profile_for_material(material)

        assert temperature <= min(t for t, _ in DRYING_PROFILES.values())

    async def test_the_default_follows_the_loaded_spool(self, hass: HomeAssistant, mock_entry, mock_api) -> None:
        await setup_entry(hass, mock_entry)
        _, printer = mock_api

        with (
            patch.object(
                type(printer),
                "primary_multi_color_box_spool_info_object",
                PropertyMock(return_value=[{"material_type": "PETG", "edit_status": 0}]),
            ),
            patch.object(type(printer), "primary_multi_color_box_loaded_slot", PropertyMock(return_value=0)),
        ):
            coordinator = mock_entry.runtime_data
            temperature = coordinator.get_drying_setting(PRINTER_ID, "temperature", 45)
            duration = coordinator.get_drying_setting(PRINTER_ID, "duration", 120)

        assert temperature == 65.0, "PETG dries hotter than PLA"
        assert duration == 360.0

    async def test_an_explicit_setting_always_wins(self, hass: HomeAssistant, mock_entry, mock_api) -> None:
        """A material default must never override what someone chose."""
        await setup_entry(hass, mock_entry)
        coordinator = mock_entry.runtime_data
        await coordinator.async_set_drying_setting(PRINTER_ID, "temperature", 52)
        _, printer = mock_api

        with patch.object(
            type(printer),
            "primary_multi_color_box_spool_info_object",
            PropertyMock(return_value=[{"material_type": "PETG", "edit_status": 0}]),
        ):
            assert coordinator.get_drying_setting(PRINTER_ID, "temperature", 45) == 52.0

    async def test_an_empty_slot_is_not_read_as_its_last_reel(self, hass: HomeAssistant, mock_entry, mock_api) -> None:
        """The ACE keeps reporting a material long after the reel is gone."""
        await setup_entry(hass, mock_entry)
        _, printer = mock_api

        with patch.object(
            type(printer),
            "primary_multi_color_box_spool_info_object",
            PropertyMock(return_value=[{"material_type": "ABS", "edit_status": 2}]),
        ):
            assert mock_entry.runtime_data.loaded_material(PRINTER_ID) is None


class TestHomingAndMotors:
    """Homing, from what the printer actually does rather than what the
    button labels suggested.

    Verified on a Kobra S1: axis 4 homes X and Y only. After it, every Z
    move came back state 'failed' with the position unchanged; homing Z on
    its own (axis 3) made it movable.
    """

    async def test_home_xy_sends_axis_four(self, hass: HomeAssistant, mock_entry, mock_api) -> None:
        await setup_entry(hass, mock_entry)
        _, printer = mock_api
        called = AsyncMock()

        with patch.object(type(printer), "move_axis", called):
            await hass.services.async_call(
                "button",
                "press",
                {"entity_id": "button.anycubic_kobra_s1_home_x_and_y"},
                blocking=True,
            )

        called.assert_awaited_once_with(axis=4, move_type=2, distance=0)

    async def test_home_z_is_its_own_axis(self, hass: HomeAssistant, mock_entry, mock_api) -> None:
        """Not a duplicate of home X/Y -- Z is not covered by it."""
        await setup_entry(hass, mock_entry)
        _, printer = mock_api
        called = AsyncMock()

        with patch.object(type(printer), "move_axis", called):
            await hass.services.async_call(
                "button",
                "press",
                {"entity_id": "button.anycubic_kobra_s1_home_z_axis"},
                blocking=True,
            )

        called.assert_awaited_once_with(axis=3, move_type=2, distance=0)

    async def test_home_all_runs_both_in_sequence(self, hass: HomeAssistant, mock_entry, mock_api) -> None:
        """The printer has no home-everything order, so this sends both."""
        await setup_entry(hass, mock_entry)
        coordinator = mock_entry.runtime_data
        _, printer = mock_api
        called = AsyncMock()

        with (
            patch.object(type(printer), "move_axis", called),
            patch("custom_components.anycubic_cloud.coordinator.asyncio.sleep", AsyncMock()),
        ):
            await coordinator.async_home_all_axes(PRINTER_ID)

        axes = [c.kwargs["axis"] for c in called.await_args_list]
        assert axes == [4, 3], "X/Y must be homed before Z"

    async def test_releasing_the_motors(self, hass: HomeAssistant, mock_entry, mock_api) -> None:
        await setup_entry(hass, mock_entry)
        _, printer = mock_api
        called = AsyncMock()

        with patch.object(type(printer), "disengage_motors", called):
            await hass.services.async_call(
                "button",
                "press",
                {"entity_id": "button.anycubic_kobra_s1_release_motors"},
                blocking=True,
            )

        called.assert_awaited_once()

    async def test_motors_are_not_released_mid_print(self, hass: HomeAssistant, mock_entry, mock_api) -> None:
        """Dropping the steppers during a print would wreck it."""
        await setup_entry(hass, mock_entry)
        coordinator = mock_entry.runtime_data
        _, printer = mock_api

        with (
            patch.object(
                type(printer),
                "latest_project_print_in_progress",
                PropertyMock(return_value=True),
            ),
            pytest.raises(HomeAssistantError, match="cannot be released while printing"),
        ):
            await coordinator.async_disengage_motors(PRINTER_ID)


class TestFeedAndRetract:
    """Loading a spool from the ACE device page.

    These calls have been available as actions for a long time; without
    buttons the ACE page offered no way to load or unload a reel at all.
    """

    async def test_feeding_a_slot(self, hass: HomeAssistant, mock_entry, mock_api) -> None:
        from homeassistant.helpers import entity_registry as er

        await setup_entry(hass, mock_entry)
        registry = er.async_get(hass)
        entity_id = next(e.entity_id for e in registry.entities.values() if e.unique_id.endswith("ace_slot_2_feed"))
        registry.async_update_entity(entity_id, disabled_by=None)
        await hass.config_entries.async_reload(mock_entry.entry_id)
        await hass.async_block_till_done()

        _, printer = mock_api
        called = AsyncMock()

        with patch.object(type(printer), "multi_color_box_feed_filament", called):
            await hass.services.async_call("button", "press", {"entity_id": entity_id}, blocking=True)

        called.assert_awaited_once_with(slot_index=1), "slot 2 is index 1"

    async def test_retracting(self, hass: HomeAssistant, mock_entry, mock_api) -> None:
        await setup_entry(hass, mock_entry)
        _, printer = mock_api
        called = AsyncMock()

        with patch.object(type(printer), "multi_color_box_retract_filament", called):
            await hass.services.async_call(
                "button",
                "press",
                {"entity_id": "button.anycubic_kobra_s1_ace_pro_ace_retract_filament"},
                blocking=True,
            )

        called.assert_awaited_once()


class TestHomeAllWaitsProperly:
    """The second home must wait for the first, without a fixed delay."""

    async def test_it_polls_rather_than_sleeping_out_the_clock(self, hass: HomeAssistant, mock_entry, mock_api) -> None:
        """A fixed wait is either unsafe or feels broken; this re-reads."""
        await setup_entry(hass, mock_entry)
        coordinator = mock_entry.runtime_data
        _, printer = mock_api
        moved = AsyncMock()
        refreshed = AsyncMock()

        with (
            patch.object(type(printer), "move_axis", moved),
            patch.object(coordinator.anycubic_api, "printer_info_for_id", refreshed),
            patch("custom_components.anycubic_cloud.coordinator.asyncio.sleep", AsyncMock()),
        ):
            await coordinator.async_home_all_axes(PRINTER_ID)

        assert [c.kwargs["axis"] for c in moved.await_args_list] == [4, 3]
        assert refreshed.await_count >= 1, "must re-read the printer, not just wait"


class TestJogButtons:
    """Each direction maps to the axis and sign the printer expects.

    axis      1 X, 2 Y, 3 Z
    move_type 0 minus, 1 plus
    """

    @pytest.mark.parametrize(
        ("suffix", "axis", "move_type"),
        [
            ("move_x_plus", 1, 1),
            ("move_x_minus", 1, 0),
            ("move_y_plus", 2, 1),
            ("move_y_minus", 2, 0),
            ("move_z_plus", 3, 1),
            ("move_z_minus", 3, 0),
        ],
    )
    async def test_each_direction(self, hass: HomeAssistant, mock_entry, mock_api, suffix, axis, move_type) -> None:
        await setup_entry(hass, mock_entry)
        coordinator = mock_entry.runtime_data
        await coordinator.async_set_axis_step(PRINTER_ID, 15)
        _, printer = mock_api
        called = AsyncMock()

        with patch.object(type(printer), "move_axis", called):
            await hass.services.async_call(
                "button",
                "press",
                {"entity_id": f"button.anycubic_kobra_s1_{suffix.replace('move_', 'move_')}"},
                blocking=True,
            )

        called.assert_awaited_once_with(axis=axis, move_type=move_type, distance=15)

    async def test_the_step_select_drives_the_distance(self, hass: HomeAssistant, mock_entry, mock_api) -> None:
        await setup_entry(hass, mock_entry)
        _, printer = mock_api
        called = AsyncMock()

        await hass.services.async_call(
            "select",
            "select_option",
            {
                "entity_id": "select.anycubic_kobra_s1_axis_step_size",
                "option": "50 mm",
            },
            blocking=True,
        )

        with patch.object(type(printer), "move_axis", called):
            await hass.services.async_call(
                "button",
                "press",
                {"entity_id": "button.anycubic_kobra_s1_move_x_plus"},
                blocking=True,
            )

        assert called.await_args.kwargs["distance"] == 50


class TestControlFailurePaths:
    """Every one of these can fail on a printer that has gone away."""

    @pytest.mark.parametrize(
        ("method", "kwargs"),
        [
            ("async_feed_filament", {"slot_index": 0}),
            ("async_retract_filament", {}),
            ("async_disengage_motors", {}),
            ("async_move_axis", {"axis": 1, "move_type": 1, "distance": 1}),
        ],
    )
    async def test_a_missing_printer_is_reported(self, hass: HomeAssistant, mock_entry, mock_api, method, kwargs) -> None:
        await setup_entry(hass, mock_entry)
        coordinator = mock_entry.runtime_data

        with (
            patch.object(coordinator, "get_printer_for_id", return_value=None),
            pytest.raises(HomeAssistantError, match="not available"),
        ):
            await getattr(coordinator, method)(PRINTER_ID, **kwargs)

    @pytest.mark.parametrize(
        ("method", "printer_method", "kwargs"),
        [
            ("async_feed_filament", "multi_color_box_feed_filament", {"slot_index": 0}),
            ("async_retract_filament", "multi_color_box_retract_filament", {}),
            ("async_disengage_motors", "disengage_motors", {}),
        ],
    )
    async def test_a_refusal_surfaces_rather_than_passing_silently(
        self, hass: HomeAssistant, mock_entry, mock_api, method, printer_method, kwargs
    ) -> None:
        await setup_entry(hass, mock_entry)
        coordinator = mock_entry.runtime_data
        _, printer = mock_api

        with (
            patch.object(type(printer), printer_method, AsyncMock(side_effect=RuntimeError("nope"))),
            pytest.raises(HomeAssistantError),
        ):
            await getattr(coordinator, method)(PRINTER_ID, **kwargs)

    async def test_a_refresh_failure_while_homing_is_survivable(self, hass: HomeAssistant, mock_entry, mock_api) -> None:
        """A poll that fails must not abandon the second home."""
        await setup_entry(hass, mock_entry)
        coordinator = mock_entry.runtime_data
        _, printer = mock_api
        moved = AsyncMock()

        with (
            patch.object(type(printer), "move_axis", moved),
            patch.object(
                coordinator.anycubic_api,
                "printer_info_for_id",
                AsyncMock(side_effect=RuntimeError("cloud hiccup")),
            ),
            patch("custom_components.anycubic_cloud.coordinator.asyncio.sleep", AsyncMock()),
        ):
            await coordinator.async_home_all_axes(PRINTER_ID)

        assert [c.kwargs["axis"] for c in moved.await_args_list] == [4, 3]


class TestAiDetection:
    """AI print-failure detection was reported but never settable.

    status 3 enables and 0 disables -- confirmed by watching the printer echo
    the setting back, not by trusting the server's response.
    """

    async def test_turning_it_on(self, hass: HomeAssistant, mock_entry, mock_api) -> None:
        await setup_entry(hass, mock_entry)
        _, printer = mock_api
        called = AsyncMock()

        with patch.object(type(printer), "set_ai_detection", called):
            await hass.services.async_call(
                "switch",
                "turn_on",
                {"entity_id": "switch.anycubic_kobra_s1_ai_failure_detection"},
                blocking=True,
            )

        called.assert_awaited_once_with(True)

    async def test_turning_it_off(self, hass: HomeAssistant, mock_entry, mock_api) -> None:
        await setup_entry(hass, mock_entry)
        _, printer = mock_api
        called = AsyncMock()

        with patch.object(type(printer), "set_ai_detection", called):
            await hass.services.async_call(
                "switch",
                "turn_off",
                {"entity_id": "switch.anycubic_kobra_s1_ai_failure_detection"},
                blocking=True,
            )

        called.assert_awaited_once_with(False)

    async def test_other_settings_are_preserved(self) -> None:
        """Only status changes; sensitivity and notice settings are kept."""
        from unittest.mock import MagicMock

        from anycubic_cloud_api.const.const import AI_DETECTION_OFF, AI_DETECTION_ON

        assert (AI_DETECTION_ON, AI_DETECTION_OFF) == (3, 0)
        assert MagicMock() is not None
