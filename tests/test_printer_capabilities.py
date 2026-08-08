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
        coordinator._anycubic_printers = {1: printer}
        coordinator._capability_polls = {}

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
