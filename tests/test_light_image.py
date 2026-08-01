"""Tests for the chamber light and the job-preview image.

Both translate between what Anycubic reports and what Home Assistant expects,
and a wrong conversion is the kind of thing that looks plausible on a
dashboard while being quietly off -- a light at 50% showing as 50/255, or a
preview that never refreshes between jobs.
"""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from helpers import PRINTER_ID
from helpers import setup_entry as _setup
from homeassistant.core import HomeAssistant


def _states(entry) -> dict:
    """The mutable state dict the entities read from."""
    return entry.runtime_data.data["printers"][PRINTER_ID]["states"]


def _light(hass: HomeAssistant, entry):
    """The light entity object, so properties can be read directly."""
    from custom_components.anycubic_cloud.light import AnycubicLight

    platform = hass.data["entity_components"]["light"]
    return next(e for e in platform.entities if isinstance(e, AnycubicLight))


class TestLightBrightness:
    """Anycubic reports 0-100; Home Assistant expects 0-255."""

    @pytest.mark.parametrize(
        ("reported_pct", "expected"),
        [(0, 0), (50, 128), (100, 255)],
    )
    async def test_brightness_is_scaled_for_home_assistant(
        self, hass: HomeAssistant, mock_entry, mock_api, reported_pct, expected
    ) -> None:
        await _setup(hass, mock_entry)
        _states(mock_entry)["printer_light_brightness"] = reported_pct

        assert _light(hass, mock_entry).brightness == expected

    async def test_unknown_brightness_stays_unknown(self, hass: HomeAssistant, mock_entry, mock_api) -> None:
        """Reporting 0 for "not reported" would look like a light that's off."""
        await _setup(hass, mock_entry)
        _states(mock_entry)["printer_light_brightness"] = None

        assert _light(hass, mock_entry).brightness is None

    @pytest.mark.parametrize(
        ("requested", "expected_pct"),
        [(255, 100), (128, 50), (1, 1)],
    )
    async def test_requested_brightness_is_scaled_back(
        self, hass: HomeAssistant, mock_entry, mock_api, requested, expected_pct
    ) -> None:
        from homeassistant.components.light import ATTR_BRIGHTNESS

        await _setup(hass, mock_entry)
        light = _light(hass, mock_entry)

        with patch.object(mock_entry.runtime_data, "set_printer_light", AsyncMock()) as set_light:
            await light.async_turn_on(**{ATTR_BRIGHTNESS: requested})

        assert set_light.await_args.kwargs["brightness"] == expected_pct

    async def test_the_dimmest_setting_never_rounds_to_off(self, hass: HomeAssistant, mock_entry, mock_api) -> None:
        """1/255 scales to 0.39%, and 0% would switch the light off instead."""
        from homeassistant.components.light import ATTR_BRIGHTNESS

        await _setup(hass, mock_entry)
        light = _light(hass, mock_entry)

        with patch.object(mock_entry.runtime_data, "set_printer_light", AsyncMock()) as set_light:
            await light.async_turn_on(**{ATTR_BRIGHTNESS: 1})

        assert set_light.await_args.kwargs["brightness"] >= 1


class TestLightSwitching:
    """On and off, without a brightness."""

    async def test_turn_on_without_brightness_leaves_it_alone(self, hass: HomeAssistant, mock_entry, mock_api) -> None:
        await _setup(hass, mock_entry)
        light = _light(hass, mock_entry)

        with patch.object(mock_entry.runtime_data, "set_printer_light", AsyncMock()) as set_light:
            await light.async_turn_on()

        assert set_light.await_args.kwargs["brightness"] is None
        assert set_light.await_args.kwargs["light_on"] is True

    async def test_turn_off(self, hass: HomeAssistant, mock_entry, mock_api) -> None:
        await _setup(hass, mock_entry)
        light = _light(hass, mock_entry)

        with patch.object(mock_entry.runtime_data, "set_printer_light", AsyncMock()) as set_light:
            await light.async_turn_off()

        assert set_light.await_args.kwargs["light_on"] is False

    async def test_is_on_reflects_the_printer(self, hass: HomeAssistant, mock_entry, mock_api) -> None:
        await _setup(hass, mock_entry)
        light = _light(hass, mock_entry)

        _states(mock_entry)["printer_light"] = True
        assert light.is_on is True

        _states(mock_entry)["printer_light"] = False
        assert light.is_on is False


class TestJobImage:
    """The preview thumbnail for the running job."""

    def _image(self, hass: HomeAssistant):
        from custom_components.anycubic_cloud.image import AnycubicCloudImage

        platform = hass.data["entity_components"]["image"]
        return next(e for e in platform.entities if isinstance(e, AnycubicCloudImage))

    async def test_a_new_job_url_invalidates_the_cached_image(self, hass: HomeAssistant, mock_entry, mock_api) -> None:
        """Otherwise the previous job's preview sticks around."""
        await _setup(hass, mock_entry)
        image = self._image(hass)

        _states(mock_entry)[image.entity_description.key] = "https://example/a.png"
        image._check_image_url()
        image._cached_image = MagicMock()
        first_stamp = image._attr_image_last_updated

        _states(mock_entry)[image.entity_description.key] = "https://example/b.png"
        image._check_image_url()

        assert image._cached_image is None
        assert image.image_url == "https://example/b.png"
        assert image._attr_image_last_updated != first_stamp

    async def test_an_unchanged_url_keeps_the_cache(self, hass: HomeAssistant, mock_entry, mock_api) -> None:
        """Re-fetching the same preview every poll is pure waste."""
        await _setup(hass, mock_entry)
        image = self._image(hass)

        _states(mock_entry)[image.entity_description.key] = "https://example/a.png"
        image._check_image_url()
        cached = MagicMock()
        image._cached_image = cached

        image._check_image_url()

        assert image._cached_image is cached

    async def test_image_is_fetched_as_png(self, hass: HomeAssistant, mock_entry, mock_api) -> None:
        await _setup(hass, mock_entry)
        image = self._image(hass)

        response = MagicMock()
        response.content = b"png-bytes"

        with patch.object(image, "_fetch_url", AsyncMock(return_value=response)):
            result = await image._async_load_image_from_url("https://example/a.png")

        assert result.content == b"png-bytes"
        assert result.content_type == "image/png"

    async def test_a_failed_fetch_returns_nothing(self, hass: HomeAssistant, mock_entry, mock_api) -> None:
        await _setup(hass, mock_entry)
        image = self._image(hass)

        with patch.object(image, "_fetch_url", AsyncMock(return_value=None)):
            result = await image._async_load_image_from_url("https://example/a.png")

        assert result is None
