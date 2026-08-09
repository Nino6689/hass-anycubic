"""Region selection, from the perspective of everyone who did not ask for it.

Nobody maintaining this integration can test the China path -- no account, no
printer. So these tests are almost entirely about the other direction: that an
existing international entry, and a LAN-only entry that will never carry a
region at all, behave exactly as they did before the field existed.
"""

from unittest.mock import MagicMock

import pytest
from anycubic_cloud_api.const.regions import AnycubicRegion

from custom_components.anycubic_cloud.config_flow import region_from_entry_data
from custom_components.anycubic_cloud.const import (
    CONF_LAN_HOST,
    CONF_REGION,
    CONF_USER_TOKEN,
)


class TestEntriesThatNameNoRegion:
    """The regression that guards every install that already exists."""

    def test_an_entry_predating_the_field_is_international(self):
        """No migration handler exists, so absence has to be the default."""
        data = {CONF_USER_TOKEN: "token"}

        assert region_from_entry_data(data) is AnycubicRegion.INTERNATIONAL

    def test_a_lan_only_entry_is_international(self):
        """LAN entries never acquire a region -- there is no account to have one."""
        data = {CONF_LAN_HOST: "10.0.0.42"}

        assert region_from_entry_data(data) is AnycubicRegion.INTERNATIONAL

    def test_an_empty_entry_does_not_raise(self):
        assert region_from_entry_data({}) is AnycubicRegion.INTERNATIONAL

    @pytest.mark.parametrize("stored", [None, "", "garbage", 0, [], {}])
    def test_no_stored_value_can_take_an_entry_offline(self, stored):
        """This runs during setup: raising here is worse than being wrong."""
        result = region_from_entry_data({CONF_REGION: stored})

        assert result is AnycubicRegion.INTERNATIONAL

    def test_the_none_comparison_trap(self):
        """The mistake this helper exists to prevent, asserted directly.

        Comparing the raw stored value to the enum looks correct and is
        False for every entry that has no region -- which is all of them,
        today. Anything branching on that would treat the entire existing
        install base as the non-default case.
        """
        data: dict = {CONF_USER_TOKEN: "token"}

        assert data.get(CONF_REGION) != AnycubicRegion.INTERNATIONAL
        assert region_from_entry_data(data) is AnycubicRegion.INTERNATIONAL


class TestAStoredRegionIsHonoured:
    def test_china_round_trips(self):
        assert region_from_entry_data({CONF_REGION: "china"}) is AnycubicRegion.CHINA

    def test_international_round_trips(self):
        assert region_from_entry_data({CONF_REGION: "international"}) is AnycubicRegion.INTERNATIONAL


class TestTokenRoutingFollowsRegion:
    """auto_pick_token is the whole of the China token fix.

    Slicer mode normally reclassifies a pasted token into _auth_access_token.
    Only a token left in _auth_token can log in to MQTT, so for China the
    reclassification has to be suppressed -- otherwise setup succeeds, no MQTT
    is established, and nothing reports a problem.
    """

    @staticmethod
    def _api(monkeypatch, region: str | None) -> dict:
        """Build an API through the real factory, capturing what it asked for.

        Async only because aiohttp's CookieJar wants a running loop; nothing
        here awaits anything.
        """
        from custom_components.anycubic_cloud import config_flow

        captured: dict = {}

        class _FakeAPI:
            def __init__(self, **kwargs):
                captured["region"] = kwargs.get("region")

            def set_authentication(self, **kwargs):
                captured["auto_pick_token"] = kwargs.get("auto_pick_token")

        monkeypatch.setattr(config_flow, "AnycubicAPI", _FakeAPI)
        monkeypatch.setattr(config_flow, "CookieJar", lambda **kw: MagicMock())
        monkeypatch.setattr(config_flow, "async_create_clientsession", lambda *a, **k: MagicMock())

        config_flow.async_create_anycubic_api(MagicMock(), "token", None, None, region)
        return captured

    async def test_international_keeps_todays_behaviour(self, monkeypatch):
        assert self._api(monkeypatch, "international")["auto_pick_token"] is True

    async def test_no_region_keeps_todays_behaviour(self, monkeypatch):
        assert self._api(monkeypatch, None)["auto_pick_token"] is True

    async def test_an_unrecognised_region_keeps_todays_behaviour(self, monkeypatch):
        """Fail towards the behaviour that is known to work."""
        assert self._api(monkeypatch, "garbage")["auto_pick_token"] is True

    async def test_china_suppresses_the_reclassification(self, monkeypatch):
        assert self._api(monkeypatch, "china")["auto_pick_token"] is False

    async def test_the_region_reaches_the_api_object(self, monkeypatch):
        assert self._api(monkeypatch, "china")["region"] is AnycubicRegion.CHINA
