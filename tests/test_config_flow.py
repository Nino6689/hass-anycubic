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


async def _choose_cloud(hass: HomeAssistant, result):
    """Pick the cloud branch of the opening menu.

    Setup now asks how to reach the printer first, because LAN Mode needs no
    token at all -- leading with the token sent people hunting for a
    credential they may not need.
    """
    if result["type"] is FlowResultType.MENU:
        return await hass.config_entries.flow.async_configure(result["flow_id"], {"next_step_id": "cloud"})
    return result


async def test_setup_asks_how_to_reach_the_printer_first(hass: HomeAssistant) -> None:
    """LAN Mode needs no token, so the token must not be the first thing asked.

    Reported on #8: someone spent a day recovering a credential for a printer
    they could have reached directly.
    """
    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": config_entries.SOURCE_USER})

    assert result["type"] is FlowResultType.MENU
    assert set(result["menu_options"]) == {"cloud", "local"}


async def test_the_cloud_branch_is_a_single_paste(hass: HomeAssistant) -> None:
    """Once cloud is chosen there is still no auth-mode menu to wade through."""
    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": config_entries.SOURCE_USER})
    result = await _choose_cloud(hass, result)

    assert result["type"] is FlowResultType.FORM
    assert result["step_id"] == "cloud"


async def test_messy_paste_is_accepted(hass: HomeAssistant) -> None:
    """A quoted, whitespace-padded token still gets through."""
    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": config_entries.SOURCE_USER})
    result = await _choose_cloud(hass, result)

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
    result = await _choose_cloud(hass, result)

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

    def _api_factory(hass_arg, token, auth_mode=None, device_id=None, region=None):  # noqa: ANN001
        attempted.append(auth_mode)
        # Reject the first mode tried, accept the second.
        return _mock_api(tokens_ok=len(attempted) > 1)

    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": config_entries.SOURCE_USER})
    result = await _choose_cloud(hass, result)

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

    def _api_factory(hass_arg, token, auth_mode=None, device_id=None, region=None):  # noqa: ANN001
        attempted.append(auth_mode)
        return _mock_api()

    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": config_entries.SOURCE_USER})
    result = await _choose_cloud(hass, result)

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
    result = await _choose_cloud(hass, result)

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
    result = await _choose_cloud(hass, result)

    result = await hass.config_entries.flow.async_configure(result["flow_id"], {"user_token": token})

    assert result["errors"] == {"user_token": "invalid_token_format"}


async def test_successful_setup_creates_the_entry(hass: HomeAssistant) -> None:
    """The happy path all the way through to a config entry."""
    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": config_entries.SOURCE_USER})
    result = await _choose_cloud(hass, result)

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
    result = await _choose_cloud(hass, result)

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
    result = await _choose_cloud(hass, result)

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
    result = await _choose_cloud(hass, result)

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
    result = await _choose_cloud(hass, result)

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
    result = await _choose_cloud(hass, result)
    flow = hass.config_entries.flow._progress[result["flow_id"]]

    result = await getattr(flow, f"async_step_{step}")()

    assert result["type"] is FlowResultType.FORM
    assert result["step_id"] == step


async def test_auth_mode_menu_lists_every_mode(hass: HomeAssistant) -> None:
    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": config_entries.SOURCE_USER})
    result = await _choose_cloud(hass, result)
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
    result = await _choose_cloud(hass, result)

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
    result = await _choose_cloud(hass, result)

    with (
        patch(
            "custom_components.anycubic_cloud.config_flow.async_repair_access_token",
            AsyncMock(return_value=(JWT, True)),
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
    result = await _choose_cloud(hass, result)

    with (
        patch(
            "custom_components.anycubic_cloud.config_flow.async_repair_access_token",
            AsyncMock(return_value=(JWT, False)),
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


async def test_a_repaired_token_is_the_one_stored(hass: HomeAssistant) -> None:
    """A token trimmed of stray bytes must be what gets saved and used.

    Storing the original would leave the entry holding a token the server
    refuses, so it would work once and fail on every restart.
    """
    trimmed = f"{JWT}-trimmed"
    seen: list[str] = []

    def _api_factory(hass_arg, token, auth_mode=None, device_id=None, region=None):  # noqa: ANN001
        seen.append(token)
        return _mock_api()

    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": config_entries.SOURCE_USER})
    result = await _choose_cloud(hass, result)

    with (
        patch(
            "custom_components.anycubic_cloud.config_flow.async_repair_access_token",
            AsyncMock(return_value=(trimmed, False)),
        ),
        patch(API_PATH, side_effect=_api_factory),
        patch(
            "custom_components.anycubic_cloud.config_flow.async_load_tokens_from_store",
            AsyncMock(),
        ),
    ):
        result = await hass.config_entries.flow.async_configure(result["flow_id"], {"user_token": JWT})

    assert result["step_id"] == "printer"
    assert seen and all(token == trimmed for token in seen)


class TestLocalSetupNeedsNoAccount:
    """LAN Mode needs no token, so setup must not insist on one.

    Issue #8 is the whole argument: someone spent a day recovering a
    credential for a printer they could have talked to directly.
    """

    def _broker(self):
        broker = MagicMock()
        broker.device_id = "778899"
        broker.mac = "a4:e8:8d:80:54:c8"
        broker.model_name = "Kobra S1"
        return broker

    async def test_a_local_printer_is_set_up_without_a_token(self, hass: HomeAssistant) -> None:
        result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": config_entries.SOURCE_USER})
        result = await hass.config_entries.flow.async_configure(result["flow_id"], {"next_step_id": "local"})

        assert result["step_id"] == "local"

        with patch(
            "custom_components.anycubic_cloud.config_flow.async_lan_handshake",
            AsyncMock(return_value=({}, self._broker())),
        ):
            result = await hass.config_entries.flow.async_configure(result["flow_id"], {"lan_host": "10.0.0.5"})

        assert result["type"] is FlowResultType.CREATE_ENTRY
        assert "user_token" not in result["data"], "a local setup must not need a token"
        assert result["data"]["lan_host"] == "10.0.0.5"
        assert result["options"]["lan_mode_enabled"] is True

    async def test_the_printer_id_comes_from_the_handshake(self, hass: HomeAssistant) -> None:
        """There is no cloud account to enumerate printers from.

        Without this the entry has no printer id list and every platform
        raises KeyError on setup.
        """
        result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": config_entries.SOURCE_USER})
        result = await hass.config_entries.flow.async_configure(result["flow_id"], {"next_step_id": "local"})

        with patch(
            "custom_components.anycubic_cloud.config_flow.async_lan_handshake",
            AsyncMock(return_value=({}, self._broker())),
        ):
            result = await hass.config_entries.flow.async_configure(result["flow_id"], {"lan_host": "10.0.0.5"})

        assert result["data"]["printer_ids"] == [778899]

    async def test_a_printer_still_on_the_cloud_says_so(self, hass: HomeAssistant) -> None:
        """Better than creating an entry that could never work."""
        result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": config_entries.SOURCE_USER})
        result = await hass.config_entries.flow.async_configure(result["flow_id"], {"next_step_id": "local"})

        with patch(
            "custom_components.anycubic_cloud.config_flow.async_lan_handshake",
            AsyncMock(return_value=({"base": "lan_printer_in_cloud_mode"}, None)),
        ):
            result = await hass.config_entries.flow.async_configure(result["flow_id"], {"lan_host": "10.0.0.5"})

        assert result["type"] is FlowResultType.FORM
        assert result["errors"] == {"base": "lan_printer_in_cloud_mode"}

    async def test_a_blank_address_is_rejected(self, hass: HomeAssistant) -> None:
        result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": config_entries.SOURCE_USER})
        result = await hass.config_entries.flow.async_configure(result["flow_id"], {"next_step_id": "local"})
        result = await hass.config_entries.flow.async_configure(result["flow_id"], {"lan_host": "   "})

        assert result["errors"] == {"lan_host": "lan_host_required"}


class TestDiscovery:
    """A printer on the network should offer itself, not wait to be typed in."""

    async def _discover(self, hass: HomeAssistant):
        from homeassistant.helpers.service_info.dhcp import DhcpServiceInfo

        return await hass.config_entries.flow.async_init(
            DOMAIN,
            context={"source": config_entries.SOURCE_DHCP},
            data=DhcpServiceInfo(
                ip="10.0.66.28",
                hostname="kobra-s1",
                macaddress="a4e88d8054c8",
            ),
        )

    async def test_a_cloud_configured_printer_is_not_rediscovered(self, hass: HomeAssistant) -> None:
        """The exact screenshot: a printer set up through the cloud for months,
        loaded and healthy, offered again as "Discovered" every lease renewal.

        The cloud entry is keyed by the account's user id, not the MAC, so
        the unique_id check alone never matches. The device registry knows the
        MAC as a connection on the printer's device -- that is the identity to
        ask.
        """
        from homeassistant.helpers import device_registry as dr
        from pytest_homeassistant_custom_component.common import MockConfigEntry

        entry = MockConfigEntry(
            domain=DOMAIN,
            unique_id="410236",
            data={"user_token": JWT, "printer_ids": [291342]},
        )
        entry.add_to_hass(hass)
        dr.async_get(hass).async_get_or_create(
            config_entry_id=entry.entry_id,
            connections={(dr.CONNECTION_NETWORK_MAC, "a4:e8:8d:80:54:c8")},
            identifiers={(DOMAIN, "410236-291342")},
        )

        result = await self._discover(hass)

        assert result["type"] is FlowResultType.ABORT
        assert result["reason"] == "already_configured"

    async def test_a_discovered_printer_offers_setup(self, hass: HomeAssistant) -> None:
        result = await self._discover(hass)

        assert result["type"] is FlowResultType.FORM
        assert result["step_id"] == "confirm_discovery"
        assert result["description_placeholders"]["host"] == "10.0.66.28"

    async def test_the_discovered_address_is_offered_as_the_default(self, hass: HomeAssistant) -> None:
        """Nobody should have to type in an address that was just found."""
        result = await self._discover(hass)
        result = await hass.config_entries.flow.async_configure(result["flow_id"], {})
        result = await hass.config_entries.flow.async_configure(result["flow_id"], {"next_step_id": "local"})

        assert result["step_id"] == "local"
        assert result["data_schema"]({})["lan_host"] == "10.0.66.28"


class TestReauthRetiresTheOldTokens:
    """A successful re-auth has to actually take effect.

    Setup loads the saved tokens on top of the entry's own, so a paste that the
    server just accepted was being overwritten by the revoked pair still sitting
    in storage -- re-auth reported success and the entry stayed red. And nothing
    reloaded the entry afterwards, so even a good paste left it on its old
    error until the next restart.
    """

    async def test_a_successful_paste_clears_the_store_and_reloads(self, hass: HomeAssistant, hass_storage) -> None:
        from pytest_homeassistant_custom_component.common import MockConfigEntry

        from custom_components.anycubic_cloud.const import STORAGE_KEY, STORAGE_VERSION

        entry = MockConfigEntry(
            domain=DOMAIN,
            unique_id="410236",
            data={"user_token": "old-and-revoked", "printer_ids": [291342]},
        )
        entry.add_to_hass(hass)
        store_key = f"{STORAGE_KEY}.{entry.entry_id}"
        hass_storage[store_key] = {
            "version": STORAGE_VERSION,
            "data": {"auth_token": "revoked", "auth_access_token": "revoked-too"},
        }

        with (
            patch(API_PATH, return_value=_mock_api()),
            patch.object(hass.config_entries, "async_schedule_reload") as reload,
        ):
            result = await hass.config_entries.flow.async_init(
                DOMAIN,
                context={"source": config_entries.SOURCE_REAUTH, "entry_id": entry.entry_id},
                data=entry.data,
            )
            result = await hass.config_entries.flow.async_configure(
                result["flow_id"],
                {"user_token": JWT},
            )
            await hass.async_block_till_done()

        assert result["type"] is FlowResultType.ABORT
        assert result["reason"] == "reauth_successful"
        assert entry.data["user_token"] == JWT
        # The dead pair is gone, so setup starts from the token just proved good.
        assert hass_storage.get(store_key, {}).get("data") in (None, {})
        # And the entry comes back up without waiting for a restart.
        reload.assert_called_once_with(entry.entry_id)
