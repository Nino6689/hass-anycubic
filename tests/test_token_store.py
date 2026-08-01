"""Tests for how saved tokens are persisted and reloaded.

The token a user pastes is only a starting point: the cloud refreshes it, and
the refreshed value is the one that keeps working. Before this, the coordinator
re-authenticated from the original token on every restart, so once that aged
out it demanded re-auth even though working credentials were already saved.
"""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch

from helpers import setup_entry as _setup
from homeassistant.core import HomeAssistant

from custom_components.anycubic_cloud.const import STORAGE_KEY, STORAGE_VERSION
from custom_components.anycubic_cloud.helpers import (
    async_load_saved_tokens,
    async_token_store,
)

SAVED = {"auth_token": "saved-token", "auth_access_token": "saved-access-token"}


class TestPerEntryStorage:
    """Two accounts must not overwrite each other's credentials."""

    async def test_key_includes_the_entry_id(self, hass: HomeAssistant) -> None:
        a = async_token_store(hass, "entry_a")
        b = async_token_store(hass, "entry_b")

        assert a.key != b.key
        assert "entry_a" in a.key

    async def test_each_entry_keeps_its_own_tokens(self, hass: HomeAssistant) -> None:
        await async_token_store(hass, "entry_a").async_save({"auth_token": "aaa"})
        await async_token_store(hass, "entry_b").async_save({"auth_token": "bbb"})

        assert (await async_token_store(hass, "entry_a").async_load())["auth_token"] == "aaa"
        assert (await async_token_store(hass, "entry_b").async_load())["auth_token"] == "bbb"


class TestLoadingSavedTokens:
    """The refreshed tokens have to reach the API client."""

    async def test_saved_tokens_are_applied(self, hass: HomeAssistant) -> None:
        await async_token_store(hass, "e1").async_save(SAVED)
        api = MagicMock()

        await async_load_saved_tokens(hass, "e1", api)

        api.load_auth_config_from_dict.assert_called_once()
        assert api.load_auth_config_from_dict.call_args.args[0] == SAVED

    async def test_nothing_saved_is_not_an_error(self, hass: HomeAssistant) -> None:
        """A brand new entry has no saved tokens; that's normal."""
        api = MagicMock()

        await async_load_saved_tokens(hass, "never_seen", api)

        api.load_auth_config_from_dict.assert_not_called()


class TestLegacyMigration:
    """Existing installs keep working across the storage change."""

    async def test_legacy_shared_store_is_still_read(self, hass: HomeAssistant) -> None:
        from homeassistant.helpers.storage import Store

        await Store(hass, STORAGE_VERSION, STORAGE_KEY).async_save(SAVED)
        api = MagicMock()

        await async_load_saved_tokens(hass, "e1", api)

        assert api.load_auth_config_from_dict.call_args.args[0] == SAVED

    async def test_legacy_tokens_are_migrated_to_the_entry(self, hass: HomeAssistant) -> None:
        """So the shared store is only ever needed once."""
        from homeassistant.helpers.storage import Store

        await Store(hass, STORAGE_VERSION, STORAGE_KEY).async_save(SAVED)

        await async_load_saved_tokens(hass, "e1", MagicMock())

        assert await async_token_store(hass, "e1").async_load() == SAVED

    async def test_entry_tokens_win_over_legacy(self, hass: HomeAssistant) -> None:
        """Once migrated, a stale shared copy must not come back."""
        from homeassistant.helpers.storage import Store

        await Store(hass, STORAGE_VERSION, STORAGE_KEY).async_save({"auth_token": "old"})
        await async_token_store(hass, "e1").async_save({"auth_token": "current"})
        api = MagicMock()

        await async_load_saved_tokens(hass, "e1", api)

        assert api.load_auth_config_from_dict.call_args.args[0]["auth_token"] == "current"


class TestCoordinatorUsesSavedTokens:
    """The regression this whole change exists to prevent."""

    async def test_setup_loads_saved_tokens_before_authenticating(self, hass: HomeAssistant, mock_entry, mock_api) -> None:
        api, _ = mock_api
        order: list[str] = []
        api.check_api_tokens = AsyncMock(side_effect=lambda: (order.append("check"), True)[1])

        with patch(
            "custom_components.anycubic_cloud.coordinator.async_load_saved_tokens",
            AsyncMock(side_effect=lambda *a, **k: order.append("load")),
        ) as load:
            await _setup(hass, mock_entry)

        load.assert_awaited()
        assert order.index("load") < order.index("check"), "saved tokens must be applied before the credentials are checked"

    async def test_refreshed_tokens_are_saved_per_entry(self, hass: HomeAssistant, mock_entry, mock_api) -> None:
        await _setup(hass, mock_entry)

        saved = await async_token_store(hass, mock_entry.entry_id).async_load()

        assert saved is not None, "setup should persist the tokens for this entry"
