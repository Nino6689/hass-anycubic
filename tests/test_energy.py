"""Electricity per print, from the user's own energy meter (discussion #46).

Many printers sit on a metering smart plug. Pointing the integration at that
plug's energy sensor makes each print carry what its electricity cost, priced
at the rate in force at each reading, next to its filament cost.
"""

from __future__ import annotations

from types import SimpleNamespace
from unittest.mock import PropertyMock, patch

import pytest
from anycubic_cloud_api.data_models.printer import AnycubicPrinter
from helpers import PRINTER_ID
from helpers import setup_entry as _setup
from homeassistant.core import HomeAssistant
from homeassistant.data_entry_flow import FlowResultType

from custom_components.anycubic_cloud.const import (
    CONF_ELECTRICITY_PRICE,
    CONF_ELECTRICITY_PRICE_ENTITY,
    CONF_ENERGY_SENSOR,
)
from custom_components.anycubic_cloud.energy import (
    add_costs,
    energy_kwh,
    energy_step_kwh,
    price_per_kwh,
)

METER = "sensor.printer_plug_energy"
PRICE = "sensor.electricity_price"


def _state(value: str, unit: str | None = "kWh") -> SimpleNamespace:
    attributes = {} if unit is None else {"unit_of_measurement": unit}
    return SimpleNamespace(state=value, attributes=attributes)


class TestReadingTheMeter:
    @pytest.mark.parametrize(
        ("value", "unit", "kwh"),
        [("1.5", "kWh", 1.5), ("1500", "Wh", 1.5), ("0.0015", "MWh", 1.5), ("2", None, 2.0)],
    )
    def test_units_are_converted(self, value, unit, kwh) -> None:
        assert energy_kwh(_state(value, unit)) == pytest.approx(kwh)

    @pytest.mark.parametrize("state", [None, _state("unknown"), _state("unavailable"), _state("x"), _state("1", "W")])
    def test_unusable_readings(self, state) -> None:
        assert energy_kwh(state) is None

    def test_a_forward_step_is_measured(self) -> None:
        assert energy_step_kwh(_state("10.0"), _state("10.25")) == pytest.approx(0.25)

    @pytest.mark.parametrize(
        ("old", "new"),
        [
            (_state("10"), _state("10")),  # no change
            (_state("10"), _state("0")),  # meter reset
            (_state("10"), _state("16")),  # implausible jump
            (None, _state("10")),
            (_state("10"), _state("unavailable")),
        ],
    )
    def test_steps_that_are_not_a_print(self, old, new) -> None:
        assert energy_step_kwh(old, new) is None


class TestThePrice:
    def test_a_price_entity_wins(self) -> None:
        assert price_per_kwh(_state("0.12"), 0.30) == pytest.approx(0.12)

    def test_the_fixed_price_is_the_fallback(self) -> None:
        assert price_per_kwh(_state("unavailable"), 0.30) == pytest.approx(0.30)
        assert price_per_kwh(None, "0.30") == pytest.approx(0.30)

    @pytest.mark.parametrize("fixed", [0, None, "x", -1])
    def test_no_price_is_not_free(self, fixed) -> None:
        assert price_per_kwh(None, fixed) is None

    def test_costs_add_up_only_what_is_known(self) -> None:
        assert add_costs(1.2, None, 0.3) == pytest.approx(1.5)
        assert add_costs(None, None) is None


@pytest.fixture
def printing():
    """Whether the (only) printer is mid-job; patched on the class, so refreshes keep it."""
    with patch.object(AnycubicPrinter, "latest_project_print_in_progress", new_callable=PropertyMock) as in_progress:
        in_progress.return_value = False
        yield in_progress


def _states(entry) -> dict:
    return entry.runtime_data.data["printers"][PRINTER_ID]["states"]


async def _refresh(coordinator) -> None:
    """A full refresh; the coordinator otherwise skips the fetch within its scan interval."""
    coordinator._last_state_update = 0
    await coordinator.async_refresh()


class TestAPrintIsCharged:
    async def _start(self, hass: HomeAssistant, entry, options: dict) -> None:
        hass.states.async_set(METER, "10.0", {"unit_of_measurement": "kWh"})
        hass.config_entries.async_update_entry(entry, options=options)
        await _setup(hass, entry)

    async def test_a_job_records_its_energy_and_cost(self, hass: HomeAssistant, mock_entry, mock_api, printing) -> None:
        await self._start(hass, mock_entry, {CONF_ENERGY_SENSOR: METER, CONF_ELECTRICITY_PRICE: 0.30})
        coordinator = mock_entry.runtime_data

        # Not printing: the meter moving is nothing to do with a job.
        hass.states.async_set(METER, "10.2", {"unit_of_measurement": "kWh"})
        await hass.async_block_till_done()

        printing.return_value = True
        await _refresh(coordinator)
        assert _states(mock_entry)["job_energy"] == 0.0
        assert _states(mock_entry)["job_electricity_cost"] == 0.0

        hass.states.async_set(METER, "10.6", {"unit_of_measurement": "kWh"})
        hass.states.async_set(METER, "10.7", {"unit_of_measurement": "kWh"})
        await hass.async_block_till_done()
        await _refresh(coordinator)

        assert _states(mock_entry)["job_energy"] == pytest.approx(0.5)
        assert _states(mock_entry)["job_electricity_cost"] == pytest.approx(0.15)

        printing.return_value = False
        await _refresh(coordinator)
        states = _states(mock_entry)

        assert states["job_energy"] is None
        assert states["last_job_energy"] == pytest.approx(0.5)
        assert states["last_job_electricity_cost"] == pytest.approx(0.15)
        # No filament price on the reel, so the total is the electricity alone.
        assert states["last_job_total_cost"] == pytest.approx(0.15)

    async def test_each_reading_is_priced_at_the_rate_then(self, hass: HomeAssistant, mock_entry, mock_api, printing) -> None:
        hass.states.async_set(PRICE, "0.10")
        await self._start(
            hass,
            mock_entry,
            {CONF_ENERGY_SENSOR: METER, CONF_ELECTRICITY_PRICE: 0.30, CONF_ELECTRICITY_PRICE_ENTITY: PRICE},
        )
        printing.return_value = True

        hass.states.async_set(METER, "11.0", {"unit_of_measurement": "kWh"})
        await hass.async_block_till_done()
        hass.states.async_set(PRICE, "0.50")
        hass.states.async_set(METER, "12.0", {"unit_of_measurement": "kWh"})
        await hass.async_block_till_done()
        await _refresh(mock_entry.runtime_data)

        # 1 kWh at 0.10, then 1 kWh at 0.50.
        assert _states(mock_entry)["job_electricity_cost"] == pytest.approx(0.60)

    async def test_without_a_price_energy_is_still_recorded(self, hass: HomeAssistant, mock_entry, mock_api, printing) -> None:
        await self._start(hass, mock_entry, {CONF_ENERGY_SENSOR: METER})
        printing.return_value = True

        hass.states.async_set(METER, "10.4", {"unit_of_measurement": "kWh"})
        await hass.async_block_till_done()
        await _refresh(mock_entry.runtime_data)

        assert _states(mock_entry)["job_energy"] == pytest.approx(0.4)
        assert _states(mock_entry)["job_electricity_cost"] is None

        printing.return_value = False
        await _refresh(mock_entry.runtime_data)
        assert _states(mock_entry)["last_job_electricity_cost"] is None
        assert _states(mock_entry)["last_job_total_cost"] is None

    async def test_two_printers_at_once_charge_nothing(self, hass: HomeAssistant, mock_entry, mock_api, printing) -> None:
        await self._start(hass, mock_entry, {CONF_ENERGY_SENSOR: METER, CONF_ELECTRICITY_PRICE: 0.30})
        coordinator = mock_entry.runtime_data
        printing.return_value = True
        coordinator._anycubic_printers[PRINTER_ID + 1] = coordinator._anycubic_printers[PRINTER_ID]

        hass.states.async_set(METER, "11.0", {"unit_of_measurement": "kWh"})
        await hass.async_block_till_done()

        assert "energy" not in coordinator._printer_filament_state(PRINTER_ID)
        coordinator._anycubic_printers.pop(PRINTER_ID + 1)

    async def test_without_a_meter_nothing_is_offered(self, hass: HomeAssistant, mock_entry, mock_api, printing) -> None:
        await _setup(hass, mock_entry)
        printing.return_value = True
        await _refresh(mock_entry.runtime_data)

        assert mock_entry.runtime_data.async_start_energy_tracking() is None
        for key in ("job_energy", "job_electricity_cost", "last_job_energy", "last_job_total_cost"):
            assert _states(mock_entry)[key] is None

    async def test_a_finished_job_without_energy_changes_nothing(
        self, hass: HomeAssistant, mock_entry, mock_api, printing
    ) -> None:
        await self._start(hass, mock_entry, {CONF_ENERGY_SENSOR: METER})
        coordinator = mock_entry.runtime_data
        printer = coordinator.printers[PRINTER_ID]

        assert coordinator._finish_job_energy(printer) is False
        printing.return_value = True
        assert coordinator._finish_job_energy(printer) is False


class TestTheOptionsStep:
    async def test_the_meter_and_price_are_saved_and_can_be_cleared(self, hass: HomeAssistant, mock_entry, mock_api) -> None:
        await _setup(hass, mock_entry)

        result = await hass.config_entries.options.async_init(mock_entry.entry_id)
        assert "energy" in result["menu_options"]
        result = await hass.config_entries.options.async_configure(result["flow_id"], {"next_step_id": "energy"})
        assert result["type"] is FlowResultType.FORM
        assert result["step_id"] == "energy"

        result = await hass.config_entries.options.async_configure(
            result["flow_id"], {CONF_ENERGY_SENSOR: METER, CONF_ELECTRICITY_PRICE: 0.28}
        )
        await hass.async_block_till_done()
        assert result["type"] is FlowResultType.CREATE_ENTRY
        assert result["data"][CONF_ENERGY_SENSOR] == METER
        assert result["data"][CONF_ELECTRICITY_PRICE] == pytest.approx(0.28)
        assert result["data"][CONF_ELECTRICITY_PRICE_ENTITY] is None

        result = await hass.config_entries.options.async_init(mock_entry.entry_id)
        result = await hass.config_entries.options.async_configure(result["flow_id"], {"next_step_id": "energy"})
        result = await hass.config_entries.options.async_configure(result["flow_id"], {})
        await hass.async_block_till_done()
        assert result["data"][CONF_ENERGY_SENSOR] is None


def test_the_entity_descriptions_exist() -> None:
    from custom_components.anycubic_cloud.sensor import SENSOR_TYPES

    keys = {description.key for description in SENSOR_TYPES}
    assert {
        "job_energy",
        "job_electricity_cost",
        "last_job_energy",
        "last_job_electricity_cost",
        "last_job_total_cost",
    } <= keys
