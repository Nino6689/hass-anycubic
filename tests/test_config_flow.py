"""Tests for the Anycubic Cloud config flow.

The flow's job is to be forgiving: the user pastes whatever they have, and the
integration works out the rest. These tests pin that behaviour, including the
fallback when the inferred auth mode turns out to be wrong.
"""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from anycubic_cloud_api.models.auth import (
    AnycubicAuthMode,
)
from homeassistant import config_entries
from homeassistant.core import HomeAssistant
from homeassistant.data_entry_flow import FlowResultType

from custom_components.anycubic_cloud.const import DOMAIN

JWT = "eyJhbGciOiJSUzI1NiIsImtpZCI6Ing0In0.eyJzdWIiOiIxMjM0NSIsIm5hbWUiOiJUZXN0In0.abcDEF-_123"

API_PATH = "custom_components.anycubic_cloud.config_flow.async_create_anycubic_api"


def _mock_api(*, tokens_ok: bool = True) -> MagicMock:
    """An API stub that authenticates and reports one printer."""
    printer = MagicMock()
    printer.id = 4242
    printer.name = "Kobra S1"

    api = MagicMock()
    api.check_api_tokens = AsyncMock(return_value=tokens_ok)
    api.list_my_printers = AsyncMock(return_value=[printer])
    api.printer_info_for_id = AsyncMock(return_value=printer)
    api.anycubic_auth.api_user_id = 99
    api.anycubic_auth.api_user_identifier = "tester@example.com"
    return api


async def test_form_shown_with_single_paste_step(hass: HomeAssistant) -> None:
    """Setup opens straight on one step -- no auth-mode menu to wade through."""
    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": config_entries.SOURCE_USER})

    assert result["type"] is FlowResultType.FORM
    assert result["step_id"] == "user"


async def test_messy_paste_is_accepted(hass: HomeAssistant) -> None:
    """A quoted, whitespace-padded token still gets through."""
    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": config_entries.SOURCE_USER})

    with (
        patch(API_PATH, return_value=_mock_api()),
        patch(
            "custom_components.anycubic_cloud.config_flow.async_load_tokens_from_store",
            AsyncMock(),
        ),
    ):
        result = await hass.config_entries.flow.async_configure(result["flow_id"], {"user_token": f'  "{JWT}"  \n'})

    # Straight on to picking a printer -- no mode question in between.
    assert result["type"] is FlowResultType.FORM
    assert result["step_id"] == "printer"
    assert not result.get("errors")


async def test_nonsense_paste_gives_helpful_error(hass: HomeAssistant) -> None:
    """Prose must produce a specific error, not a generic auth failure."""
    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": config_entries.SOURCE_USER})

    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], {"user_token": "I don't know where my token is"}
    )

    assert result["type"] is FlowResultType.FORM
    assert result["errors"] == {"user_token": "invalid_token_format"}


async def test_falls_back_to_other_auth_mode(hass: HomeAssistant) -> None:
    """If the inferred mode is rejected, the alternative is tried silently.

    A JWT normally means Slicer, but if the server rejects it we should try Web
    before bothering the user -- a wrong guess shouldn't surface as a failure.
    """
    attempted: list[AnycubicAuthMode] = []

    def _api_factory(hass_arg, token, auth_mode=None, device_id=None):  # noqa: ANN001
        attempted.append(auth_mode)
        # Reject the first mode tried, accept the second.
        return _mock_api(tokens_ok=len(attempted) > 1)

    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": config_entries.SOURCE_USER})

    with (
        patch(API_PATH, side_effect=_api_factory),
        patch(
            "custom_components.anycubic_cloud.config_flow.async_load_tokens_from_store",
            AsyncMock(),
        ),
    ):
        result = await hass.config_entries.flow.async_configure(result["flow_id"], {"user_token": JWT})

    assert result["step_id"] == "printer"
    assert len(attempted) == 2, "should have retried with a different auth mode"
    assert attempted[0] is AnycubicAuthMode.SLICER, "JWT should be tried as Slicer first"


async def test_device_id_selects_android(hass: HomeAssistant) -> None:
    """Supplying a device id pins the flow to the Android mode."""
    attempted: list[AnycubicAuthMode] = []

    def _api_factory(hass_arg, token, auth_mode=None, device_id=None):  # noqa: ANN001
        attempted.append(auth_mode)
        return _mock_api()

    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": config_entries.SOURCE_USER})

    with (
        patch(API_PATH, side_effect=_api_factory),
        patch(
            "custom_components.anycubic_cloud.config_flow.async_load_tokens_from_store",
            AsyncMock(),
        ),
    ):
        result = await hass.config_entries.flow.async_configure(
            result["flow_id"], {"user_token": JWT, "user_device_id": "device-123"}
        )

    assert attempted == [AnycubicAuthMode.ANDROID]


async def test_all_modes_rejected_reports_invalid_auth(hass: HomeAssistant) -> None:
    """When nothing works, the user gets a real error rather than a loop."""
    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": config_entries.SOURCE_USER})

    with (
        patch(API_PATH, return_value=_mock_api(tokens_ok=False)),
        patch(
            "custom_components.anycubic_cloud.config_flow.async_load_tokens_from_store",
            AsyncMock(),
        ),
    ):
        result = await hass.config_entries.flow.async_configure(result["flow_id"], {"user_token": JWT})

    assert result["type"] is FlowResultType.FORM
    assert result["errors"] == {"base": "invalid_auth"}


@pytest.mark.parametrize("token", ["", "   "])
async def test_empty_token_rejected(hass: HomeAssistant, token: str) -> None:
    """An empty paste shouldn't reach the API at all."""
    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": config_entries.SOURCE_USER})

    result = await hass.config_entries.flow.async_configure(result["flow_id"], {"user_token": token})

    assert result["errors"] == {"user_token": "invalid_token_format"}
