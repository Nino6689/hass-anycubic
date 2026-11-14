"""End-to-end setup tests against a real captured printer payload.

The printer here is built by the actual API client from a redacted capture of
a real Kobra S1 + ACE Pro (see conftest), so these tests exercise the genuine
attribute surface rather than a mock that agrees with whatever we assert.
"""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock

from helpers import PRINTER_ID
from helpers import setup_entry as _setup
from homeassistant.config_entries import ConfigEntryState
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant
from homeassistant.helpers import device_registry as dr
from homeassistant.helpers import entity_registry as er

from custom_components.anycubic_cloud.const import DOMAIN, PLATFORMS


class TestSetup:
    """The entry loads, creates devices and unloads cleanly."""

    async def test_entry_loads(self, hass: HomeAssistant, mock_entry, mock_api) -> None:
        await _setup(hass, mock_entry)
        assert mock_entry.state is ConfigEntryState.LOADED

    async def test_coordinator_is_on_runtime_data(self, hass: HomeAssistant, mock_entry, mock_api) -> None:
        """Quality scale (runtime-data): state hangs off the entry, not hass.data."""
        await _setup(hass, mock_entry)

        assert mock_entry.runtime_data is not None
        assert DOMAIN not in hass.data or not hass.data.get(DOMAIN)

    async def test_ace_is_its_own_device_under_the_printer(self, hass: HomeAssistant, mock_entry, mock_api) -> None:
        """An ACE is separate hardware, and a printer can have two of them."""
        await _setup(hass, mock_entry)

        devices = dr.async_entries_for_config_entry(dr.async_get(hass), mock_entry.entry_id)
        printers = [d for d in devices if d.via_device_id is None]
        accessories = [d for d in devices if d.via_device_id is not None]

        assert len(printers) == 1
        assert len(accessories) == 1, "the ACE Pro should be its own device"
        assert accessories[0].via_device_id == printers[0].id

    async def test_entry_unloads(self, hass: HomeAssistant, mock_entry, mock_api) -> None:
        await _setup(hass, mock_entry)

        assert await hass.config_entries.async_unload(mock_entry.entry_id)
        await hass.async_block_till_done()
        assert mock_entry.state is ConfigEntryState.NOT_LOADED


class TestPlatforms:
    """Every declared platform should actually produce entities."""

    async def test_all_platforms_create_entities(self, hass: HomeAssistant, mock_entry, mock_api) -> None:
        await _setup(hass, mock_entry)

        entities = er.async_entries_for_config_entry(er.async_get(hass), mock_entry.entry_id)
        seen = {e.domain for e in entities}
        expected = {p.value for p in PLATFORMS if p is not Platform.IMAGE}

        assert expected <= seen, f"no entities for: {expected - seen}"

    async def test_entities_have_unique_ids(self, hass: HomeAssistant, mock_entry, mock_api) -> None:
        """Quality scale (entity-unique-id)."""
        await _setup(hass, mock_entry)

        entities = er.async_entries_for_config_entry(er.async_get(hass), mock_entry.entry_id)
        unique_ids = [e.unique_id for e in entities]

        assert all(unique_ids), "every entity needs a unique id"
        assert len(unique_ids) == len(set(unique_ids)), "unique ids must not collide"


class TestPrinterData:
    """Values users actually look at, read off the real payload."""

    async def test_temperatures_are_reported(self, hass: HomeAssistant, mock_entry, mock_api) -> None:
        await _setup(hass, mock_entry)
        data = mock_entry.runtime_data.data["printers"][PRINTER_ID]["states"]

        assert data["curr_nozzle_temp"] == 31
        assert data["curr_hotbed_temp"] == 28

    async def test_ace_slots_carry_colour_and_material(self, hass: HomeAssistant, mock_entry, mock_api) -> None:
        """The colour data is what the spool icons are drawn from."""
        _, printer = mock_api
        slots = printer.primary_multi_color_box_spool_info_object

        assert len(slots) == 4
        assert [s["material_type"] for s in slots] == ["PETG", "PLA", "PLA", "PETG"]
        assert [s["color_hex"] for s in slots] == [
            "#AFAFAF",
            "#212721",
            "#FFEC3D",
            "#EFF0F1",
        ]

    async def test_ace_unit_is_detected(self, hass: HomeAssistant, mock_entry, mock_api) -> None:
        _, printer = mock_api

        assert printer.supports_function_multi_color_box is True
        assert printer.connected_ace_units == 1


class TestFailureModes:
    """Setup should fail loudly and recoverably, not half-load."""

    async def test_bad_token_asks_for_reauth(self, hass: HomeAssistant, mock_entry, mock_api) -> None:
        api, _ = mock_api
        api.check_api_tokens = AsyncMock(return_value=False)

        await _setup(hass, mock_entry)

        assert mock_entry.state is ConfigEntryState.SETUP_ERROR

    async def test_missing_printer_does_not_load_the_entry(self, hass: HomeAssistant, mock_entry, mock_api) -> None:
        api, _ = mock_api
        api.printer_info_for_id = AsyncMock(return_value=None)

        await _setup(hass, mock_entry)

        assert mock_entry.state is not ConfigEntryState.LOADED


class TestRemovingStaleDevices:
    """A device nothing reports any more can be deleted from the UI (#33)."""

    def _entry(self, printers: dict) -> MagicMock:
        entry = MagicMock()
        entry.runtime_data.data = {"user_info": {"id": 999}}
        entry.runtime_data.printers = printers
        return entry

    def _device(self, identifier: str) -> MagicMock:
        return MagicMock(identifiers={("anycubic_cloud", identifier)})

    async def test_a_live_printer_and_its_aces_are_protected(self, hass: HomeAssistant) -> None:
        from custom_components.anycubic_cloud import async_remove_config_entry_device

        entry = self._entry({7: MagicMock(multi_color_box=[object(), object()])})

        for identifier in ("999-7", "999-7-ace0", "999-7-ace1"):
            assert await async_remove_config_entry_device(hass, entry, self._device(identifier)) is False

    async def test_a_stale_device_may_go(self, hass: HomeAssistant) -> None:
        from custom_components.anycubic_cloud import async_remove_config_entry_device

        entry = self._entry({7: MagicMock(multi_color_box=[object()])})

        for identifier in ("999-7-ace1", "999-8", "999-8-ace0"):
            assert await async_remove_config_entry_device(hass, entry, self._device(identifier)) is True

    async def test_an_entry_that_never_loaded_blocks_nothing(self, hass: HomeAssistant) -> None:
        from custom_components.anycubic_cloud import async_remove_config_entry_device

        entry = MagicMock()
        entry.runtime_data = None
        assert await async_remove_config_entry_device(hass, entry, self._device("999-7")) is True
