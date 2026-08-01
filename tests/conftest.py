"""Shared pytest fixtures for the Anycubic Cloud test suite.

The printer fixture is a redacted capture from a real Kobra S1 + ACE Pro, and
is fed to the actual API client rather than mocked. Tests therefore run against
the genuine attribute surface: if a payload shape or property name changes,
they fail instead of passing against an agreeable mock.
"""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from anycubic_cloud_api import AnycubicPrinter
from helpers import PRINTER_ID, TEST_TOKEN, build_printer
from homeassistant.core import HomeAssistant
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.anycubic_cloud.const import (
    CONF_PRINTER_ID_LIST,
    CONF_USER_TOKEN,
    DOMAIN,
)

# pytest_homeassistant_custom_component registers itself through its pytest11
# entry point, which is what provides the `hass` fixture. Do NOT also list it in
# pytest_plugins: that loads it a second time under a different name, and its
# caplog wrapper then wraps itself into infinite recursion.


@pytest.fixture(autouse=True)
def auto_enable_custom_integrations(enable_custom_integrations):
    """Load this custom integration in every test without opting in each time."""
    yield


@pytest.fixture
def mock_entry(hass: HomeAssistant) -> MockConfigEntry:
    """A config entry pointing at the fixture printer."""
    entry = MockConfigEntry(
        domain=DOMAIN,
        title="Anycubic Cloud",
        unique_id="999",
        data={
            CONF_USER_TOKEN: TEST_TOKEN,
            CONF_PRINTER_ID_LIST: [PRINTER_ID],
        },
    )
    entry.add_to_hass(hass)
    return entry


@pytest.fixture
def mock_api():
    """Patch the cloud API, leaving the printer object real."""
    printer = build_printer()
    api = MagicMock()
    api.check_api_tokens = AsyncMock(return_value=True)
    api.printer_info_for_id = AsyncMock(return_value=printer)
    api.get_auth_config_dict = MagicMock(return_value={})
    api.anycubic_auth.api_user_id = 999
    api.mqtt_is_started = False
    api.tokens_changed = MagicMock(return_value=False)

    # AnycubicPrinter uses __slots__, so the per-poll refresh is patched on the
    # class. Everything else about the printer stays real.
    with (
        patch("custom_components.anycubic_cloud.coordinator.AnycubicAPI", return_value=api),
        patch.object(AnycubicPrinter, "update_info_from_api", AsyncMock()),
    ):
        yield api, printer
