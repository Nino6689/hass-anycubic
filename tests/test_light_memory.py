"""The chamber light has to survive the config entry being rebuilt.

Reported on issue #8 as "the light entity is often displayed as not
available ... as soon as I press another entity the switch is available
after a few seconds", and half of it was fixed in 2.0.0-beta.5 by asking the
printer whether it had a light at all. This is the other half.

A printer mentions its light over MQTT once and then never again, and
``has_controllable_light`` is true only while that report is still held on
the printer object. Home Assistant rebuilds a config entry for entirely
ordinary reasons -- an options change, a user reload, and (observed on the
live printer three times in one morning) core reloading the entry itself
thirty seconds after any of its entities is enabled in the entity registry.
Every rebuild constructs fresh printer objects with no reports in them, so
the light went back to unavailable and stayed there until the printer
happened to speak up again. And because Home Assistant refuses service calls
to unavailable entities, pressing the light -- the very thing that would
bring MQTT up and settle the question -- was not possible.

A light is a fact about the hardware rather than a reading, so once seen it
is written down and remembered.
"""

from __future__ import annotations

import json
from unittest.mock import AsyncMock

import pytest
from anycubic_cloud_api.data_models.consumable import AnycubicConsumableData
from helpers import PRINTER_ID, build_printer
from helpers import setup_entry as _setup
from homeassistant.core import HomeAssistant

from custom_components.anycubic_cloud.const import ATTR_LIGHT_TYPES

LIGHT_ENTITY = "light.anycubic_kobra_s1_printer_light"

# What a Kobra S1 actually answers a light-status query with. Its lights are
# type 2, not 1, which is why the type is remembered rather than assumed.
LIGHT_REPORT = {
    "type": "light",
    "action": "query",
    "state": "done",
    "data": {"lights": [{"type": 2, "status": 1, "brightness": 100}]},
}


def _report_a_light(printer, status: int = 1) -> None:
    """Let the printer volunteer its light, exactly as it does over MQTT."""
    payload = json.loads(json.dumps(LIGHT_REPORT))
    payload["data"]["lights"][0]["status"] = status
    printer.process_mqtt_update("anycubic/printer/light", AnycubicConsumableData(payload))


@pytest.fixture
def fresh_printer_each_fetch(mock_api):
    """Make the cloud hand back a new printer object per fetch, as it does.

    The default fixture returns one long-lived printer, which would hide this
    bug completely: the whole point is that a rebuild starts from a printer
    that has never heard of the light.
    """
    api, printer = mock_api
    api.printer_info_for_id = AsyncMock(side_effect=lambda *a, **k: build_printer())
    return api, printer


class TestALightSurvivesARebuild:
    async def test_it_stays_available_across_a_reload(self, hass: HomeAssistant, mock_entry, fresh_printer_each_fetch) -> None:
        """The live reproduction, in miniature.

        Without the fix the reload builds a printer with no light report in
        it, ``has_controllable_light`` is false, and the entity goes
        unavailable for the rest of the session.
        """
        api, _ = fresh_printer_each_fetch
        await _setup(hass, mock_entry)

        coordinator = mock_entry.runtime_data
        _report_a_light(coordinator.get_printer_for_id(PRINTER_ID))
        await coordinator._async_force_data_refresh()
        await hass.async_block_till_done()

        assert hass.states.get(LIGHT_ENTITY).state == "on"

        await hass.config_entries.async_reload(mock_entry.entry_id)
        await hass.async_block_till_done()

        assert hass.states.get(LIGHT_ENTITY).state != "unavailable"

    async def test_the_type_is_written_down_when_first_reported(self, hass: HomeAssistant, mock_entry, mock_api) -> None:
        await _setup(hass, mock_entry)
        coordinator = mock_entry.runtime_data

        assert coordinator._remembered_light_types(PRINTER_ID) == []

        _report_a_light(coordinator.get_printer_for_id(PRINTER_ID))
        await coordinator._async_force_data_refresh()

        assert coordinator._remembered_light_types(PRINTER_ID) == [2]

    async def test_it_is_only_written_once(self, hass: HomeAssistant, mock_entry, mock_api) -> None:
        """Reports arrive constantly; storage writes should not."""
        await _setup(hass, mock_entry)
        coordinator = mock_entry.runtime_data
        printer = coordinator.get_printer_for_id(PRINTER_ID)

        with pytest.MonkeyPatch.context() as patched:
            saves: list[dict] = []
            patched.setattr(
                "custom_components.anycubic_cloud.coordinator.async_capability_store",
                lambda hass, entry_id: _RecordingStore(saves),
            )
            for _ in range(3):
                _report_a_light(printer)
                await coordinator._async_remember_capabilities()

        assert len(saves) == 1


class TestAPrinterWithNoLight:
    """Resin printers and older models have none, and must not grow one."""

    async def test_it_stays_unavailable(self, hass: HomeAssistant, mock_entry, mock_api) -> None:
        await _setup(hass, mock_entry)

        assert hass.states.get(LIGHT_ENTITY).state == "unavailable"

    async def test_a_reload_does_not_invent_one(self, hass: HomeAssistant, mock_entry, fresh_printer_each_fetch) -> None:
        await _setup(hass, mock_entry)
        await hass.config_entries.async_reload(mock_entry.entry_id)
        await hass.async_block_till_done()

        assert hass.states.get(LIGHT_ENTITY).state == "unavailable"


class TestAnUnknownStateIsNotOff:
    async def test_a_remembered_light_reads_unknown_until_the_printer_speaks(
        self, hass: HomeAssistant, mock_entry, fresh_printer_each_fetch
    ) -> None:
        """ "Off" would show a lit chamber as dark, which is worse than "unknown"."""
        await _setup(hass, mock_entry)
        coordinator = mock_entry.runtime_data
        _report_a_light(coordinator.get_printer_for_id(PRINTER_ID))
        await coordinator._async_force_data_refresh()

        await hass.config_entries.async_reload(mock_entry.entry_id)
        await hass.async_block_till_done()

        assert hass.states.get(LIGHT_ENTITY).state == "unknown"

    async def test_a_reported_off_is_still_off(self, hass: HomeAssistant, mock_entry, mock_api) -> None:
        """The unknown state must not swallow a genuine off."""
        await _setup(hass, mock_entry)
        coordinator = mock_entry.runtime_data
        _report_a_light(coordinator.get_printer_for_id(PRINTER_ID), status=0)
        await coordinator._async_force_data_refresh()
        await hass.async_block_till_done()

        assert hass.states.get(LIGHT_ENTITY).state == "off"


class TestWhatIsRemembered:
    async def test_a_stored_type_is_read_back(self, hass: HomeAssistant, mock_entry, mock_api) -> None:
        await _setup(hass, mock_entry)
        coordinator = mock_entry.runtime_data
        coordinator._capabilities = {"printers": {str(PRINTER_ID): {ATTR_LIGHT_TYPES: [2]}}}

        assert coordinator._remembered_light_types(PRINTER_ID) == [2]

    async def test_rubbish_in_storage_is_ignored_rather_than_raised(self, hass: HomeAssistant, mock_entry, mock_api) -> None:
        """A store written by a future version must not break the light."""
        await _setup(hass, mock_entry)
        coordinator = mock_entry.runtime_data
        coordinator._capabilities = {"printers": {str(PRINTER_ID): {ATTR_LIGHT_TYPES: "two"}}}

        assert coordinator._remembered_light_types(PRINTER_ID) == []

    async def test_an_empty_store_remembers_nothing(self, hass: HomeAssistant, mock_entry, mock_api) -> None:
        await _setup(hass, mock_entry)
        coordinator = mock_entry.runtime_data
        coordinator._capabilities = {}

        assert coordinator._remembered_light_types(PRINTER_ID) == []


class _RecordingStore:
    """Stands in for the capability Store, counting writes."""

    def __init__(self, saves: list[dict]) -> None:
        self._saves = saves

    async def async_load(self) -> dict | None:
        return None

    async def async_save(self, data: dict) -> None:
        self._saves.append(json.loads(json.dumps(data)))


def test_the_store_is_per_entry(hass: HomeAssistant) -> None:
    """Two printers set up separately must not overwrite each other."""
    from custom_components.anycubic_cloud.helpers import async_capability_store

    assert async_capability_store(hass, "entry-a").key != async_capability_store(hass, "entry-b").key
