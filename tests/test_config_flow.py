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


async def test_successful_setup_creates_the_entry(hass: HomeAssistant) -> None:
    """The happy path all the way through to a config entry."""
    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": config_entries.SOURCE_USER})

    with patch(API_PATH, return_value=_mock_api()):
        result = await hass.config_entries.flow.async_configure(result["flow_id"], {"user_token": JWT})

    assert result["type"] is FlowResultType.FORM
    assert result["step_id"] == "printer"

    with patch(API_PATH, return_value=_mock_api()):
        result = await hass.config_entries.flow.async_configure(result["flow_id"], {"printer_ids": ["4242"]})

    assert result["type"] is FlowResultType.CREATE_ENTRY
    assert result["data"]["printer_ids"] == [4242]
    assert result["data"]["user_token"] == JWT


async def test_account_with_no_printers_is_reported(hass: HomeAssistant) -> None:
    """Setting up an empty account should say so, not fail obscurely."""
    api = _mock_api()
    api.list_my_printers = AsyncMock(return_value=[])

    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": config_entries.SOURCE_USER})

    with patch(API_PATH, return_value=api):
        result = await hass.config_entries.flow.async_configure(result["flow_id"], {"user_token": JWT})

    assert result["type"] is FlowResultType.FORM
    assert result["errors"] == {"base": "no_printers"}


async def test_unreachable_printer_is_reported(hass: HomeAssistant) -> None:
    """A printer that lists but won't respond shouldn't be silently accepted."""
    # The flow keeps the client it built in the first step, so the failure has
    # to be introduced on that same instance rather than by re-patching.
    api = _mock_api()

    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": config_entries.SOURCE_USER})

    with patch(API_PATH, return_value=api):
        result = await hass.config_entries.flow.async_configure(result["flow_id"], {"user_token": JWT})

        api.printer_info_for_id = AsyncMock(return_value=None)
        result = await hass.config_entries.flow.async_configure(result["flow_id"], {"printer_ids": ["4242"]})

    assert result["type"] is FlowResultType.FORM
    assert result["errors"] == {"base": "invalid_printer"}


async def test_the_same_account_cannot_be_added_twice(hass: HomeAssistant) -> None:
    """Quality scale (unique-config-entry): the account id is the unique id."""
    from pytest_homeassistant_custom_component.common import MockConfigEntry

    MockConfigEntry(domain=DOMAIN, unique_id="99", data={"user_token": JWT, "printer_ids": [4242]}).add_to_hass(hass)

    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": config_entries.SOURCE_USER})

    with patch(API_PATH, return_value=_mock_api()):
        result = await hass.config_entries.flow.async_configure(result["flow_id"], {"user_token": JWT})
        result = await hass.config_entries.flow.async_configure(result["flow_id"], {"printer_ids": ["4242"]})

    assert result["type"] is FlowResultType.ABORT
    assert result["reason"] == "already_configured"


async def test_a_cloud_error_while_listing_printers_is_reported(
    hass: HomeAssistant,
) -> None:
    api = _mock_api()
    api.list_my_printers = AsyncMock(side_effect=Exception("cloud unreachable"))

    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": config_entries.SOURCE_USER})

    with patch(API_PATH, return_value=api):
        result = await hass.config_entries.flow.async_configure(result["flow_id"], {"user_token": JWT})

    assert result["type"] is FlowResultType.FORM
    assert result["errors"], "a cloud failure must surface as an error, not silence"


@pytest.mark.parametrize(
    "step",
    ["auth_mode_web", "auth_mode_slicer", "auth_mode_android"],
)
async def test_manual_auth_mode_steps_are_reachable(hass: HomeAssistant, step: str) -> None:
    """The per-mode forms remain available for anyone who needs them."""
    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": config_entries.SOURCE_USER})
    flow = hass.config_entries.flow._progress[result["flow_id"]]

    result = await getattr(flow, f"async_step_{step}")()

    assert result["type"] is FlowResultType.FORM
    assert result["step_id"] == step


async def test_auth_mode_menu_lists_every_mode(hass: HomeAssistant) -> None:
    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": config_entries.SOURCE_USER})
    flow = hass.config_entries.flow._progress[result["flow_id"]]

    result = await flow.async_step_auth_mode_pick()

    assert result["type"] is FlowResultType.MENU
    assert set(result["menu_options"]) == {
        "auth_mode_web",
        "auth_mode_slicer",
        "auth_mode_android",
    }


async def test_expired_token_is_named_as_expired(hass: HomeAssistant) -> None:
    """An expired paste must say "expired", not fail as generic bad auth.

    The server's own answer to an expired token is "User does not exist"
    (issue #8), which reads as an account problem. The expiry claim is right
    there in the token -- read it and say so before the server muddies things.
    """
    import base64
    import json
    import time

    body = base64.urlsafe_b64encode(json.dumps({"exp": int(time.time()) - 3600}).encode()).decode().rstrip("=")
    expired = f"eyJhbGciOiJSUzI1NiJ9.{body}.signature"

    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": config_entries.SOURCE_USER})

    with patch(API_PATH, return_value=_mock_api()) as api_factory:
        result = await hass.config_entries.flow.async_configure(result["flow_id"], {"user_token": expired})

    assert result["type"] is FlowResultType.FORM
    assert result["errors"] == {"user_token": "token_expired"}
    # The server was never asked -- the verdict is local.
    api_factory.assert_not_called()


async def test_corrupted_token_is_named_as_corrupted(hass: HomeAssistant) -> None:
    """A signature that fails local verification must be called corruption.

    This is the issue #8 case: a byte lost in a memory-dump extraction leaves
    perfect-looking claims over a broken signature, and the server answer for
    it sends people hunting for account problems they don't have.
    """
    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": config_entries.SOURCE_USER})

    with (
        patch(
            "custom_components.anycubic_cloud.config_flow.async_access_token_looks_corrupted",
            AsyncMock(return_value=True),
        ),
        patch(API_PATH, return_value=_mock_api()) as api_factory,
    ):
        result = await hass.config_entries.flow.async_configure(result["flow_id"], {"user_token": JWT})

    assert result["type"] is FlowResultType.FORM
    assert result["errors"] == {"user_token": "token_corrupted"}
    api_factory.assert_not_called()


async def test_precheck_lets_a_healthy_token_through(hass: HomeAssistant) -> None:
    """The precheck must be invisible when there is nothing to report."""
    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": config_entries.SOURCE_USER})

    with (
        patch(
            "custom_components.anycubic_cloud.config_flow.async_access_token_looks_corrupted",
            AsyncMock(return_value=False),
        ),
        patch(API_PATH, return_value=_mock_api()),
        patch(
            "custom_components.anycubic_cloud.config_flow.async_load_tokens_from_store",
            AsyncMock(),
        ),
    ):
        result = await hass.config_entries.flow.async_configure(result["flow_id"], {"user_token": JWT})

    assert result["type"] is FlowResultType.FORM
    assert result["step_id"] == "printer"
    assert not result.get("errors")
