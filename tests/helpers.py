"""Shared building blocks for the test suite.

Kept out of conftest.py so test modules can import them directly. tests/ is
deliberately not a package -- adding __init__.py makes pytest load the Home
Assistant plugin twice and its caplog fixture then recurses.
"""

from __future__ import annotations

import json
import pathlib
from unittest.mock import MagicMock

from anycubic_cloud_api import AnycubicPrinter
from homeassistant.core import HomeAssistant
from pytest_homeassistant_custom_component.common import MockConfigEntry

FIXTURE = pathlib.Path(__file__).parent / "fixtures" / "printer_kobra_s1.json"
PRINTER_ID = 12345678
# Valid JWT shape with a far-future exp, so token-expiry repairs stay quiet.
TEST_TOKEN = "eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjQ4ODM5NjgwMDB9.sig"


def build_printer() -> AnycubicPrinter:
    """Build a real printer object from the captured cloud payload."""
    data = json.loads(FIXTURE.read_text())
    return AnycubicPrinter(
        api_parent=MagicMock(),
        machine_type=data["machine_type"],
        machine_name=data["name"],
        id=data["id"],
        name=data["name"],
        device_status=data["device_status"],
        is_printing=data["is_printing"],
        machine_mac=data["base"]["machine_mac"],
        fw_version=data["version"],
        machine_data=data["machine_data"],
        type_function_ids=data["type_function_ids"],
        parameter=data["parameter"],
        tools=data["tools"],
        multi_color_box=data["multi_color_box"],
        external_shelves=data.get("external_shelves"),
        # The fixture has always carried this; not passing it left every
        # FDM-only entity filtered out of every test, silently.
        material_type=data["base"]["material_type"],
        material_used=data["base"]["material_used"],
        print_totaltime=data["base"]["print_totaltime"],
        print_count=data["base"]["print_count"],
        ignore_init_errors=True,
    )


async def setup_entry(hass: HomeAssistant, entry: MockConfigEntry) -> None:
    """Run setup for an entry and settle the event loop."""
    await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
