"""Regression tests for two things the printer only ever volunteers.

Both were reported against the 2.0.0 beta and both had the same shape: state
that exists only because the printer mentioned it over MQTT, which nothing
ever asked for.

* The light entity sat unavailable until some unrelated action happened to
  make the printer speak up. The poll that should have asked was built with a
  ``project_id`` and an integer order id, which the cloud accepts, answers
  "Operation successful" to, and drops -- and it also refused to send at all
  unless a project existed, so it could never fire on an idle printer, which
  is exactly when someone reaches for the light.
* The model fan read a confident 0%, because it was reading the sliced job's
  setting rather than the printer's own reading, and that value is 0 whenever
  nothing is printing.
"""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock

import pytest
from anycubic_cloud_api.const.enums import AnycubicOrderID
from anycubic_cloud_api.data_models.orders import AnycubicPrinterQueryOrderRequest
from helpers import setup_entry as _setup
from homeassistant.core import CoreState, HomeAssistant

from custom_components.anycubic_cloud.const import MAX_CAPABILITY_POLLS


@pytest.fixture
def loaded(hass: HomeAssistant, mock_entry, mock_api):
    """A loaded coordinator whose printer has said nothing about itself."""

    async def _build(mqtt_started: bool = True):
        await _setup(hass, mock_entry)
        coordinator = mock_entry.runtime_data
        api, _ = mock_api
        api.mqtt_is_started = mqtt_started
        api.send_order_query_peripherals = AsyncMock(return_value="msg-1")
        api.send_order_get_light_status = AsyncMock(return_value="msg-2")
        hass.set_state(CoreState.running)

        printer = MagicMock()
        printer.has_peripheral_camera = None
        printer.has_controllable_light = False
        printer.printer_online = True
        coordinator._anycubic_printers = {1: printer}
        coordinator._capability_polls = {}
        coordinator._printer_was_online = {}

        return coordinator, api, printer

    return _build


class TestTheWireShape:
    """Both polls are printer-level, and the cloud is fussy about that."""

    def test_the_order_id_is_a_string_and_nothing_else_is_sent(self) -> None:
        request = AnycubicPrinterQueryOrderRequest(
            order_id=AnycubicOrderID.QUERY_PERIPHERALS,
            printer_id=291342,
        )

        assert request.order_request_data == {
            "order_id": "1231",
            "printer_id": 291342,
        }

    def test_no_project_id_is_included(self) -> None:
        """A project_id is what silently drops a printer-level order."""
        request = AnycubicPrinterQueryOrderRequest(
            order_id=AnycubicOrderID.GET_LIGHT_STATUS,
            printer_id=291342,
        )

        assert "project_id" not in request.order_request_data
        assert "data" not in request.order_request_data


class TestAskingWhatThePrinterHas:
    async def test_both_questions_are_asked_when_nothing_is_known(self, loaded) -> None:
        coordinator, api, printer = await loaded()

        await coordinator._async_poll_printer_capabilities()

        api.send_order_query_peripherals.assert_awaited_once_with(printer=printer)
        api.send_order_get_light_status.assert_awaited_once_with(printer=printer)

    async def test_nothing_is_asked_while_mqtt_is_down(self, loaded) -> None:
        """The answer arrives over MQTT, so asking would be shouting at a wall.

        It must also not bring MQTT up by itself: Anycubic allows one session
        per account, and someone on "only while printing" left it down on
        purpose so the slicer could have it.
        """
        coordinator, api, _ = await loaded(mqtt_started=False)

        await coordinator._async_poll_printer_capabilities()

        api.send_order_query_peripherals.assert_not_awaited()
        api.send_order_get_light_status.assert_not_awaited()
        assert coordinator._capability_polls == {}

    async def test_a_known_answer_is_not_asked_for_again(self, loaded) -> None:
        coordinator, api, printer = await loaded()
        printer.has_peripheral_camera = True
        printer.has_controllable_light = True

        await coordinator._async_poll_printer_capabilities()

        api.send_order_query_peripherals.assert_not_awaited()
        api.send_order_get_light_status.assert_not_awaited()

    async def test_only_the_unanswered_question_is_repeated(self, loaded) -> None:
        coordinator, api, printer = await loaded()
        printer.has_peripheral_camera = False

        await coordinator._async_poll_printer_capabilities()

        api.send_order_query_peripherals.assert_not_awaited()
        api.send_order_get_light_status.assert_awaited_once()

    async def test_a_printer_that_never_answers_is_eventually_left_alone(self, loaded) -> None:
        """Some printers have neither a light nor a camera, and say nothing."""
        coordinator, api, _ = await loaded()

        for _ in range(MAX_CAPABILITY_POLLS + 3):
            await coordinator._async_poll_printer_capabilities()

        assert api.send_order_get_light_status.await_count == MAX_CAPABILITY_POLLS

    async def test_a_failure_never_breaks_the_update(self, loaded) -> None:
        """This is optional; losing every entity over it would not be.

        It went the other way once already: an un-awaitable mock took the
        whole config entry down with it.
        """
        coordinator, api, _ = await loaded()
        api.send_order_query_peripherals = AsyncMock(side_effect=Exception("boom"))

        await coordinator._async_poll_printer_capabilities()


class TestTheModelFanReadsThePrinter:
    """Reported as "the slider works but always shows 0%"."""

    async def test_the_printers_own_reading_is_used(self, loaded) -> None:
        coordinator, _, printer = await loaded()
        printer.fan_speed_pct = 65
        printer.latest_project_fan_speed_pct = 0

        state = coordinator._build_printer_dict(printer)["states"]

        assert state["fan_speed_pct"] == 65

    async def test_an_unreported_fan_is_unknown_rather_than_zero(self, loaded) -> None:
        """0% and "never said" are different, and only one of them is a fact."""
        coordinator, _, printer = await loaded()
        printer.fan_speed_pct = None

        state = coordinator._build_printer_dict(printer)["states"]

        assert state["fan_speed_pct"] is None


class TestAPrinterThatWasSwitchedOff:
    """Reported against 2.1.1 on a Kobra S1 Max, discussion #18.

    The chamber light entity never became available, on a printer that plainly
    has one. The budget that stops a lightless printer being asked forever was
    being spent on a printer that was merely switched off -- three updates of
    orders into the void, and then the light entity was unavailable for the
    life of the coordinator however long the printer ran afterwards.
    """

    async def test_an_offline_printer_is_not_asked(self, loaded) -> None:
        coordinator, api, printer = await loaded()
        printer.printer_online = False

        await coordinator._async_poll_printer_capabilities()

        api.send_order_query_peripherals.assert_not_awaited()
        api.send_order_get_light_status.assert_not_awaited()

    async def test_being_offline_costs_nothing(self, loaded) -> None:
        """The budget is for silence, not for absence."""
        coordinator, _, printer = await loaded()
        printer.printer_online = False

        for _ in range(MAX_CAPABILITY_POLLS + 3):
            await coordinator._async_poll_printer_capabilities()

        assert coordinator._capability_polls.get(1, 0) == 0

    async def test_the_budget_comes_back_when_the_printer_does(self, loaded) -> None:
        """Coming on is the one moment there is something new to ask."""
        coordinator, api, printer = await loaded()

        for _ in range(MAX_CAPABILITY_POLLS + 1):
            await coordinator._async_poll_printer_capabilities()

        assert api.send_order_get_light_status.await_count == MAX_CAPABILITY_POLLS

        printer.printer_online = False
        await coordinator._async_poll_printer_capabilities()

        printer.printer_online = True
        await coordinator._async_poll_printer_capabilities()

        assert api.send_order_get_light_status.await_count == MAX_CAPABILITY_POLLS + 1

    async def test_staying_on_does_not_restart_the_budget(self, loaded) -> None:
        """Otherwise a lightless printer is asked forever after all."""
        coordinator, api, _ = await loaded()

        for _ in range(MAX_CAPABILITY_POLLS + 5):
            await coordinator._async_poll_printer_capabilities()

        assert api.send_order_get_light_status.await_count == MAX_CAPABILITY_POLLS


class TestTheSpeedEntitiesReadThePrinter:
    """Reported as discussion #19: a Kobra X in LAN Mode, printing, with
    Print speed mode and Print Speed % both unavailable.

    Same shape as the model fan above. Both values were parsed out of the
    printer's own reports and never exposed, so the entities read the sliced
    job instead -- and a printer reached over its own network has no cloud
    project to read.
    """

    async def test_the_cloud_names_the_mode_the_printer_is_in(self, loaded) -> None:
        coordinator, _, printer = await loaded()
        printer.print_speed_mode = 2
        printer.latest_project_available_print_speed_modes_data_object = [
            {"mode": 1, "description": "Standard"},
            {"mode": 2, "description": "Sport"},
        ]

        state = coordinator._build_printer_dict(printer)["states"]

        assert state["job_speed_mode"] == "Sport"

    async def test_without_the_cloud_the_number_stands_alone(self, loaded) -> None:
        """The names only ever come from the cloud, and a local printer has
        none -- but the number it reports is still enough to automate on."""
        coordinator, _, printer = await loaded()
        printer.print_speed_mode = 2
        printer.latest_project_available_print_speed_modes_data_object = None

        state = coordinator._build_printer_dict(printer)["states"]

        assert state["job_speed_mode"] == "2"

    async def test_a_printer_that_has_not_said_falls_back_to_the_job(self, loaded) -> None:
        coordinator, _, printer = await loaded()
        printer.print_speed_mode = None
        printer.latest_project_print_speed_mode_string = "Silent"

        state = coordinator._build_printer_dict(printer)["states"]

        assert state["job_speed_mode"] == "Silent"

    async def test_the_printers_own_speed_percentage_wins(self, loaded) -> None:
        coordinator, _, printer = await loaded()
        printer.print_speed_pct = 76
        printer.latest_project_print_speed_pct = 100

        state = coordinator._build_printer_dict(printer)["states"]

        assert state["print_speed_pct"] == 76

    async def test_an_unreported_speed_falls_back_to_the_job(self, loaded) -> None:
        coordinator, _, printer = await loaded()
        printer.print_speed_pct = None
        printer.latest_project_print_speed_pct = 100

        state = coordinator._build_printer_dict(printer)["states"]

        assert state["print_speed_pct"] == 100

    async def test_the_mode_code_is_published_for_automations(self, loaded) -> None:
        """The select stays unavailable without the cloud's list of names, so
        the raw code is the only way to act on the mode locally."""
        coordinator, _, printer = await loaded()
        printer.print_speed_mode = 3

        attributes = coordinator._build_printer_dict(printer)["attributes"]

        assert attributes["job_speed_mode"]["print_speed_mode_code"] == 3
