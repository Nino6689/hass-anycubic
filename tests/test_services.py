"""Tests for the action (service) layer.

Actions are the write path -- they change a physical printer -- so the things
worth pinning down are that they resolve the right printer, reject bad input
with a translated message rather than a traceback, and don't silently no-op.
"""

from __future__ import annotations

from contextlib import ExitStack
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from helpers import PRINTER_ID
from helpers import setup_entry as _setup
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ServiceValidationError

from custom_components.anycubic_cloud.const import ATTR_ANYCUBIC_EVENT, DOMAIN
from custom_components.anycubic_cloud.services import SERVICES

SERVICE_NAMES = [name for name, _ in SERVICES]


class RecordingPrinter(MagicMock):
    """A printer stand-in where every method is awaitable and recorded.

    Actions reach for a wide spread of printer methods, so rather than listing
    them, any attribute resolves to an AsyncMock and the names actually awaited
    are collected.
    """

    def _get_child_mock(self, /, **kwargs):
        # Magic methods must stay synchronous -- an async __bool__ makes even
        # `if printer:` blow up.
        name = kwargs.get("_new_name", "")
        if name.startswith("__") and name.endswith("__"):
            return MagicMock(**kwargs)
        return AsyncMock(**kwargs)

    @property
    def awaited(self) -> list[str]:
        return [name for name, _, _ in self.mock_calls if name]


class FailingPrinter(RecordingPrinter):
    """A printer where every call fails, for exercising the error paths."""

    def _get_child_mock(self, /, **kwargs):
        name = kwargs.get("_new_name", "")
        if name.startswith("__") and name.endswith("__"):
            return MagicMock(**kwargs)
        return AsyncMock(side_effect=Exception("cloud unreachable"), **kwargs)


class TestRegistration:
    """Quality scale (action-setup): actions exist without a loaded entry."""

    async def test_all_actions_are_registered_before_setup(self, hass: HomeAssistant) -> None:
        from custom_components.anycubic_cloud import async_setup

        await async_setup(hass, {})

        missing = [n for n in SERVICE_NAMES if not hass.services.has_service(DOMAIN, n)]
        assert not missing, f"unregistered actions: {missing}"

    async def test_every_action_has_a_schema(self) -> None:
        """Without one, bad input reaches the printer instead of being rejected."""
        for name, service in SERVICES:
            assert getattr(service, "schema", None) is not None, f"{name} has no schema"


class TestPrinterResolution:
    """An action must act on exactly the printer the user named."""

    async def test_resolves_by_printer_id(self, hass: HomeAssistant, mock_entry, mock_api) -> None:
        await _setup(hass, mock_entry)
        _, printer = mock_api

        assert mock_entry.runtime_data.get_printer_for_id(PRINTER_ID) is printer

    async def test_unknown_printer_id_returns_nothing(self, hass: HomeAssistant, mock_entry, mock_api) -> None:
        await _setup(hass, mock_entry)

        assert mock_entry.runtime_data.get_printer_for_id(999999) is None

    @pytest.mark.parametrize("empty", [None, ""])
    async def test_empty_printer_id_returns_nothing(self, hass: HomeAssistant, mock_entry, mock_api, empty) -> None:
        await _setup(hass, mock_entry)

        assert mock_entry.runtime_data.get_printer_for_id(empty) is None

    async def test_resolves_by_device_id(self, hass: HomeAssistant, mock_entry, mock_api) -> None:
        """Most users pick a device in the UI, not a numeric printer id."""
        from homeassistant.helpers import device_registry as dr

        await _setup(hass, mock_entry)
        _, printer = mock_api

        devices = dr.async_entries_for_config_entry(dr.async_get(hass), mock_entry.entry_id)
        printer_device = next(d for d in devices if d.via_device_id is None)

        assert mock_entry.runtime_data.get_printer_for_device_id(printer_device.id) is printer

    async def test_unknown_device_id_returns_nothing(self, hass: HomeAssistant, mock_entry, mock_api) -> None:
        await _setup(hass, mock_entry)

        assert mock_entry.runtime_data.get_printer_for_device_id("not-a-device") is None


class TestValidationErrors:
    """Quality scale (exception-translations): failures are translated."""

    def _call(self, hass: HomeAssistant, data: dict):
        from homeassistant.core import ServiceCall

        from custom_components.anycubic_cloud.services import MultiColorBoxSetSlotPla

        return MultiColorBoxSetSlotPla(hass), ServiceCall(hass, DOMAIN, "test", data)

    async def test_missing_config_entry_is_a_translated_error(self, hass: HomeAssistant) -> None:
        service, call = self._call(hass, {"config_entry": "does-not-exist"})

        with pytest.raises(ServiceValidationError) as err:
            service._get_coordinator(call)

        assert err.value.translation_key == "config_entry_not_found"
        assert err.value.translation_domain == DOMAIN

    async def test_unloaded_entry_is_a_translated_error(self, hass: HomeAssistant, mock_entry) -> None:
        """The entry exists but never loaded, so there is no coordinator."""
        service, call = self._call(hass, {"config_entry": mock_entry.entry_id})

        with pytest.raises(ServiceValidationError) as err:
            service._get_coordinator(call)

        assert err.value.translation_key == "config_entry_not_loaded"

    async def test_targeting_two_printers_at_once_is_rejected(self, hass: HomeAssistant, mock_entry, mock_api) -> None:
        """A single call can't sensibly drive two machines."""
        await _setup(hass, mock_entry)
        service, call = self._call(
            hass,
            {"config_entry": mock_entry.entry_id, "device_id": ["dev_a", "dev_b"]},
        )

        with pytest.raises(ServiceValidationError) as err:
            service._get_printer(call)

        assert err.value.translation_key == "one_printer_at_a_time"

    async def test_unknown_printer_is_a_translated_error(self, hass: HomeAssistant, mock_entry, mock_api) -> None:
        await _setup(hass, mock_entry)
        service, call = self._call(hass, {"config_entry": mock_entry.entry_id, "printer_id": 999999})

        with pytest.raises(ServiceValidationError) as err:
            service._get_printer(call)

        assert err.value.translation_key == "printer_not_found"

    async def test_a_single_device_id_in_a_list_is_accepted(self, hass: HomeAssistant, mock_entry, mock_api) -> None:
        """The UI passes device_id as a list; one entry is unambiguous."""
        from homeassistant.helpers import device_registry as dr

        await _setup(hass, mock_entry)
        _, printer = mock_api
        devices = dr.async_entries_for_config_entry(dr.async_get(hass), mock_entry.entry_id)
        printer_device = next(d for d in devices if d.via_device_id is None)

        service, call = self._call(
            hass,
            {"config_entry": mock_entry.entry_id, "device_id": [printer_device.id]},
        )

        assert service._get_printer(call) is printer


class TestSlotNumbering:
    """Users count slots from 1; the printer counts from 0."""

    def _service(self, hass: HomeAssistant):
        from custom_components.anycubic_cloud.services import MultiColorBoxSetSlotPla

        return MultiColorBoxSetSlotPla(hass)

    def _call(self, hass: HomeAssistant, data: dict):
        from homeassistant.core import ServiceCall

        return ServiceCall(hass, DOMAIN, "test", data)

    async def test_slot_numbers_are_converted_to_indexes(self, hass: HomeAssistant) -> None:
        service = self._service(hass)
        call = self._call(hass, {"slot_number": [1, 2, 3, 4]})

        assert service._get_slot_num_list(call) == [0, 1, 2, 3]

    async def test_no_slots_given_stays_none(self, hass: HomeAssistant) -> None:
        """None means "all slots"; an empty list would mean "no slots"."""
        service = self._service(hass)

        assert service._get_slot_num_list(self._call(hass, {})) is None

    async def test_box_defaults_to_the_first_ace(self, hass: HomeAssistant) -> None:
        service = self._service(hass)

        assert service._get_box_id(self._call(hass, {})) == 0

    async def test_explicit_box_is_kept(self, hass: HomeAssistant) -> None:
        """A second ACE is box 1."""
        service = self._service(hass)

        assert service._get_box_id(self._call(hass, {"box_id": 1})) == 1


class TestActionExecution:
    """A call should reach the printer and then refresh what the user sees."""

    async def test_setting_a_slot_calls_the_printer_and_refreshes(self, hass: HomeAssistant, mock_entry, mock_api) -> None:
        from homeassistant.core import ServiceCall

        from custom_components.anycubic_cloud.services import MultiColorBoxSetSlotPla

        await _setup(hass, mock_entry)
        _, printer = mock_api

        service = MultiColorBoxSetSlotPla(hass)
        call = ServiceCall(
            hass,
            DOMAIN,
            "multi_color_box_set_slot_pla",
            {
                "config_entry": mock_entry.entry_id,
                "printer_id": PRINTER_ID,
                "slot_number": 2,
                "slot_color_red": 255,
                "slot_color_green": 0,
                "slot_color_blue": 0,
            },
        )

        with (
            patch.object(type(printer), "multi_color_box_set_pla_slot", AsyncMock()) as set_slot,
            patch.object(type(mock_entry.runtime_data), "force_state_update", AsyncMock()) as refresh,
        ):
            await service.async_call_service(call)

        set_slot.assert_awaited_once()
        # Slot 2 in the UI is index 1 on the printer.
        assert set_slot.await_args.kwargs["slot_index"] == 1
        # The UI should update immediately, not on the next poll.
        refresh.assert_awaited_once()


class TestEveryActionReachesThePrinter:
    """A sweep over all registered actions.

    Each action is a thin wrapper around one printer call, and the failure mode
    they share is wiring: a wrapper that validates its input and then calls the
    wrong method, or nothing at all, looks fine until someone tries it on real
    hardware. Driving every one against a recording printer catches that.
    """

    # A superset of the fields the actions read, using the names taken from
    # their own schemas. Individual actions ignore what they don't need, and
    # schema validation itself is covered above.
    def _payload(self, entry_id: str) -> dict:
        return {
            "config_entry": entry_id,
            "printer_id": PRINTER_ID,
            "box_id": 0,
            "slot_number": 1,
            "slot_color_red": 255,
            "slot_color_green": 128,
            "slot_color_blue": 0,
            "speed": 100,
            "speed_mode": 1,
            "temperature": 220,
            "layers": 5,
            "time": 30,
            "filename": "test.gcode",
            "file_id": 1,
            "finished": False,
        }

    @pytest.mark.parametrize("name,service_cls", SERVICES, ids=SERVICE_NAMES)
    async def test_action_calls_the_printer(self, hass: HomeAssistant, mock_entry, mock_api, name, service_cls) -> None:
        from homeassistant.core import ServiceCall

        from custom_components.anycubic_cloud.services import BasePrintWithFile

        await _setup(hass, mock_entry)
        coordinator = mock_entry.runtime_data

        recorder = RecordingPrinter()
        # Cloud-file actions go through the API rather than a printer, since
        # cloud files aren't tied to one machine.
        api_recorder = RecordingPrinter()

        payload = self._payload(mock_entry.entry_id)
        if issubclass(service_cls, BasePrintWithFile):
            # Printing accepts several slots; setting a slot takes exactly one.
            payload["slot_number"] = [1, 2]

        service = service_cls(hass)
        call = ServiceCall(hass, DOMAIN, name, payload)

        with ExitStack() as stack:
            stack.enter_context(patch.object(coordinator, "get_printer_for_id", return_value=recorder))
            stack.enter_context(patch.object(type(coordinator), "force_state_update", AsyncMock()))
            stack.enter_context(patch.object(coordinator, "_anycubic_api", api_recorder))
            # Only the print actions read a file; reading one is covered
            # separately rather than faked for every action here.
            if hasattr(service_cls, "_get_gcode_data"):
                stack.enter_context(
                    patch.object(
                        service_cls,
                        "_get_gcode_data",
                        AsyncMock(return_value=("f.gcode", b"x")),
                    )
                )
            # Some actions wait for the printer to catch up before re-reading;
            # the delays are real but not what's under test here.
            stack.enter_context(patch("asyncio.sleep", AsyncMock()))
            await service.async_call_service(call)

        assert recorder.awaited or api_recorder.awaited, (
            f"{name} validated its input but never called the printer or the cloud"
        )


class TestGcodeUpload:
    """Reading the uploaded file before sending it to the printer."""

    def _service(self, hass: HomeAssistant):
        from custom_components.anycubic_cloud.services import PrintAndUploadSaveInCloud

        return PrintAndUploadSaveInCloud(hass)

    def _call(self, hass: HomeAssistant):
        from homeassistant.core import ServiceCall

        return ServiceCall(hass, DOMAIN, "print_and_upload_save_in_cloud", {"uploaded_gcode_file": "id"})

    async def test_file_contents_are_read(self, hass: HomeAssistant) -> None:
        service = self._service(hass)

        with patch.object(
            type(service),
            "_read_uploaded_file_bytes",
            return_value=("model.gcode", b"G28"),
        ):
            name, data = await service._get_gcode_data(self._call(hass))

        assert name == "model.gcode"
        assert data == b"G28"

    async def test_a_slow_upload_is_retried(self, hass: HomeAssistant) -> None:
        """The file can still be landing when the action fires."""
        service = self._service(hass)
        attempts = {"n": 0}

        def _flaky(_self, _uploaded_file_id):
            attempts["n"] += 1
            if attempts["n"] < 2:
                raise ValueError("not ready yet")
            return ("model.gcode", b"G28")

        with (
            patch.object(type(service), "_read_uploaded_file_bytes", _flaky),
            patch("asyncio.sleep", AsyncMock()),
        ):
            name, _ = await service._get_gcode_data(self._call(hass))

        assert attempts["n"] == 2
        assert name == "model.gcode"

    async def test_an_unreadable_file_is_a_translated_error(self, hass: HomeAssistant) -> None:
        """Quality scale (exception-translations)."""
        service = self._service(hass)

        with (
            patch.object(
                type(service),
                "_read_uploaded_file_bytes",
                side_effect=ValueError("gone"),
            ),
            patch("asyncio.sleep", AsyncMock()),
        ):
            with pytest.raises(ServiceValidationError) as err:
                await service._get_gcode_data(self._call(hass))

        assert err.value.translation_key == "gcode_read_failed"


class TestPrintEvent:
    """Starting a print fires an event so automations can react."""

    async def test_event_is_fired_with_the_job_details(self, hass: HomeAssistant, mock_entry, mock_api) -> None:
        from homeassistant.core import ServiceCall

        from custom_components.anycubic_cloud.services import PrintAndUploadSaveInCloud

        await _setup(hass, mock_entry)
        _, printer = mock_api

        events = []
        hass.bus.async_listen(ATTR_ANYCUBIC_EVENT, events.append)

        service = PrintAndUploadSaveInCloud(hass)
        call = ServiceCall(
            hass,
            DOMAIN,
            "print_and_upload_save_in_cloud",
            {
                "config_entry": mock_entry.entry_id,
                "printer_id": PRINTER_ID,
                "uploaded_gcode_file": "id",
            },
        )

        with (
            patch.object(
                type(service),
                "_get_gcode_data",
                AsyncMock(return_value=("model.gcode", b"G28")),
            ),
            patch.object(
                type(printer),
                "print_and_upload_save_in_cloud",
                AsyncMock(return_value=MagicMock(task_id=7)),
            ),
        ):
            await service.async_call_service(call)
            await hass.async_block_till_done()

        assert events, "an automation should be able to hook the print starting"


class TestActionFailuresSurface:
    """Quality scale (action-exceptions).

    Every action wraps its printer call in a try/except. An action that
    swallowed a cloud failure would report success while the printer did
    nothing, so each one is driven into a failure and checked for a raised
    Home Assistant error.
    """

    @pytest.mark.parametrize("name,service_cls", SERVICES, ids=SERVICE_NAMES)
    async def test_a_cloud_failure_is_not_swallowed(
        self, hass: HomeAssistant, mock_entry, mock_api, name, service_cls
    ) -> None:
        from homeassistant.core import ServiceCall
        from homeassistant.exceptions import HomeAssistantError

        from custom_components.anycubic_cloud.services import BasePrintWithFile

        await _setup(hass, mock_entry)
        coordinator = mock_entry.runtime_data

        # Every printer/API call this action might make raises, so the test
        # doesn't depend on knowing which method each action reaches for.
        failing = FailingPrinter()

        payload = TestEveryActionReachesThePrinter()._payload(mock_entry.entry_id)
        if issubclass(service_cls, BasePrintWithFile):
            payload["slot_number"] = [1, 2]

        service = service_cls(hass)
        call = ServiceCall(hass, DOMAIN, name, payload)

        with ExitStack() as stack:
            stack.enter_context(patch.object(coordinator, "get_printer_for_id", return_value=failing))
            stack.enter_context(patch.object(coordinator, "_anycubic_api", failing))
            stack.enter_context(patch.object(type(coordinator), "force_state_update", AsyncMock()))
            stack.enter_context(patch("asyncio.sleep", AsyncMock()))
            if hasattr(service_cls, "_get_gcode_data"):
                stack.enter_context(
                    patch.object(
                        service_cls,
                        "_get_gcode_data",
                        AsyncMock(return_value=("f.gcode", b"x")),
                    )
                )

            with pytest.raises(HomeAssistantError):
                await service.async_call_service(call)
