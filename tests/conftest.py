"""Shared pytest fixtures for the Anycubic Cloud test suite."""

from __future__ import annotations

import pytest

# Gives every test access to a real (in-memory) Home Assistant instance.
pytest_plugins = "pytest_homeassistant_custom_component"


@pytest.fixture(autouse=True)
def auto_enable_custom_integrations(enable_custom_integrations):
    """Load this custom integration in every test without opting in each time."""
    yield
