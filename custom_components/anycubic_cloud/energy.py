"""Electricity per print (Beta 6, D31; hass-anycubic discussion #46).

An energy meter (a smart plug's energy sensor) is followed for the whole
entry. Each rise of its reading while exactly one printer of the entry is
printing is booked to that printer's job, priced at the price in force at
that reading: the price entity whenever it reads a number, else the fixed
price per kWh (0 = not set). A drop, a non-number or a jump of more than
5 kWh is not booked. When the job is no longer in progress its totals
become the last job's.

Stored apart from the filament ledger (whose 2.x shape is fixed, COMPAT §6)
in its own store, so a restart mid-print keeps the job's totals:

    {printers: {"<printer id>": {job: {task, name, energy_kwh, cost, priced}
                                      | null,
                                 last: {energy_kwh, cost} | null}},
     meter: <the meter's entity id>, meter_kwh: <its last reading> | null}
"""

from __future__ import annotations

from dataclasses import dataclass
import logging
import math
from typing import TYPE_CHECKING, Any

from homeassistant.const import (
    ATTR_UNIT_OF_MEASUREMENT,
    STATE_UNAVAILABLE,
    STATE_UNKNOWN,
    UnitOfEnergy,
)
from homeassistant.core import Event, EventStateChangedData, State, callback
from homeassistant.helpers.event import async_track_state_change_event
from homeassistant.helpers.storage import Store

from .const import (
    CONF_ENERGY_PRICE,
    CONF_ENERGY_PRICE_ENTITY,
    CONF_ENERGY_SENSOR,
    ENERGY_MAX_STEP_KWH,
    STORE_ENERGY,
    STORE_VERSION,
)

if TYPE_CHECKING:
    from collections.abc import Callable, Mapping

    from homeassistant.core import HomeAssistant

    from .model import Printer

_LOGGER = logging.getLogger(__name__)

_SAVE_DELAY = 5.0

#: kWh per unit of the meter's reading.
_TO_KWH: dict[str, float] = {
    UnitOfEnergy.WATT_HOUR: 0.001,
    UnitOfEnergy.KILO_WATT_HOUR: 1.0,
    UnitOfEnergy.MEGA_WATT_HOUR: 1000.0,
}


def _number(state: State | None) -> float | None:
    if state is None or state.state in (STATE_UNKNOWN, STATE_UNAVAILABLE, ""):
        return None
    try:
        value = float(state.state)
    except ValueError:
        return None
    return value if math.isfinite(value) else None


def reading_kwh(state: State | None) -> float | None:
    """The meter's reading in kWh; ``None`` for a non-number or a unit that
    is not Wh, kWh or MWh."""
    value = _number(state)
    if value is None or state is None:
        return None
    factor = _TO_KWH.get(str(state.attributes.get(ATTR_UNIT_OF_MEASUREMENT) or ""))
    return value * factor if factor is not None else None


def job_identity(printer: Printer) -> tuple[int | None, str | None]:
    """What tells one job from the next: its number (when it has one above
    0) and its file name."""
    task = printer.job_task_id
    return (task if task is not None and task > 0 else None, printer.job_name or None)


def same_job(job: Mapping[str, Any], task: int | None, name: str | None) -> bool:
    """Two numbers decide; else two names; with neither on one side the job
    goes on (a number or name that arrives later belongs to it)."""
    stored_task, stored_name = job.get("task"), job.get("name")
    if stored_task is not None and task is not None:
        return bool(stored_task == task)
    if stored_name and name:
        return bool(stored_name == name)
    return True


@dataclass(frozen=True, slots=True)
class EnergySettings:
    sensor: str | None
    price: float
    price_entity: str | None

    @classmethod
    def from_options(cls, options: Mapping[str, Any]) -> EnergySettings:
        sensor = options.get(CONF_ENERGY_SENSOR)
        entity = options.get(CONF_ENERGY_PRICE_ENTITY)
        try:
            price = float(options.get(CONF_ENERGY_PRICE) or 0.0)
        except (TypeError, ValueError):
            price = 0.0
        return cls(
            sensor=sensor if isinstance(sensor, str) and sensor else None,
            price=max(price, 0.0),
            price_entity=entity if isinstance(entity, str) and entity else None,
        )


def _float(value: object) -> float | None:
    if isinstance(value, bool) or not isinstance(value, int | float):
        return None
    return float(value)


class EnergyMeter:
    """Follows one entry's energy meter and books it to the printing job."""

    def __init__(
        self,
        hass: HomeAssistant,
        entry_id: str,
        options: Mapping[str, Any],
        printers: Callable[[], list[Printer]],
        on_change: Callable[[], None],
    ) -> None:
        self.hass = hass
        self.settings = EnergySettings.from_options(options)
        self._printers = printers
        self._on_change = on_change
        self._store: Store[dict[str, Any]] = Store(
            hass, STORE_VERSION, f"{STORE_ENERGY}.{entry_id}"
        )
        self._data: dict[str, Any] = {"printers": {}, "meter_kwh": None}
        self._seen: set[int] = set()
        self._unsubscribe: Callable[[], None] | None = None

    @property
    def enabled(self) -> bool:
        return self.settings.sensor is not None

    # -- lifecycle ------------------------------------------------------------

    async def async_load(self) -> None:
        if not self.enabled:
            return
        stored = await self._store.async_load()
        if isinstance(stored, dict) and isinstance(stored.get("printers"), dict):
            self._data = stored
        sensor = self.settings.sensor
        assert sensor is not None
        if self._data.get("meter") != sensor or self._data.get("meter_kwh") is None:
            # Another meter (or none read yet): a fresh base, never the last
            # meter's reading.
            self._data["meter"] = sensor
            self._data["meter_kwh"] = reading_kwh(self.hass.states.get(sensor))
        self._unsubscribe = async_track_state_change_event(
            self.hass, sensor, self._handle_meter
        )

    async def async_shutdown(self) -> None:
        if self._unsubscribe is not None:
            self._unsubscribe()
            self._unsubscribe = None
        if self.enabled:
            await self._store.async_save(self._data)

    def _save(self) -> None:
        self._store.async_delay_save(lambda: self._data, _SAVE_DELAY)

    # -- price ------------------------------------------------------------------

    def price(self) -> float | None:
        """The price per kWh in force now: the entity when it reads a
        number, else the fixed price; ``None`` when neither is set."""
        if self.settings.price_entity is not None:
            value = _number(self.hass.states.get(self.settings.price_entity))
            if value is not None:  # a negative tariff is a credit
                return value
        return self.settings.price if self.settings.price > 0 else None

    # -- jobs -------------------------------------------------------------------

    def _record(self, printer_id: int) -> dict[str, Any]:
        printers: dict[str, Any] = self._data["printers"]
        record: object = printers.get(str(printer_id))
        if not isinstance(record, dict):
            record = printers[str(printer_id)] = {"job": None, "last": None}
        return record

    def _peek(self, printer_id: int) -> dict[str, Any]:
        record: object = self._data["printers"].get(str(printer_id))
        return record if isinstance(record, dict) else {}

    def update(self, printer: Printer) -> None:
        """A printer's state is known: start, carry on or end its job."""
        if not self.enabled:
            return
        self._seen.add(printer.printer_id)
        record = self._record(printer.printer_id)
        job = record.get("job")
        task, name = job_identity(printer)
        changed = False
        if not printer.job_in_progress:
            if isinstance(job, dict):
                self._finish(record, job)
                changed = True
        elif not isinstance(job, dict):
            self._start(record, task, name)
            changed = True
        elif not same_job(job, task, name):
            # Another job runs now: the one stored ended unseen.
            self._finish(record, job)
            self._start(record, task, name)
            changed = True
        else:
            for field, value in (("task", task), ("name", name)):
                if value is not None and job.get(field) is None:
                    job[field] = value
                    changed = True
        if changed:
            self._save()

    def _start(
        self, record: dict[str, Any], task: int | None, name: str | None
    ) -> None:
        price = self.price()
        record["job"] = {
            "task": task,
            "name": name,
            "energy_kwh": 0.0,
            "cost": 0.0 if price is not None else None,
            "priced": price is not None,
        }

    @staticmethod
    def _finish(record: dict[str, Any], job: dict[str, Any]) -> None:
        record["last"] = {
            "energy_kwh": round(_float(job.get("energy_kwh")) or 0.0, 4),
            "cost": _cost(job),
        }
        record["job"] = None

    @callback
    def _handle_meter(self, event: Event[EventStateChangedData]) -> None:
        reading = reading_kwh(event.data["new_state"])
        if reading is None:
            return  # a non-number: ignored, the last reading stays
        previous = _float(self._data.get("meter_kwh"))
        self._data["meter_kwh"] = reading
        if previous is None:
            self._save()
            return
        rise = reading - previous
        if rise <= 0 or rise > ENERGY_MAX_STEP_KWH:
            if rise:
                _LOGGER.debug("Ignoring an energy meter step of %.3f kWh", rise)
            self._save()
            return
        printing = [
            p
            for p in self._printers()
            if p.printer_id in self._seen and p.job_in_progress
        ]
        if len(printing) == 1:
            record = self._record(printing[0].printer_id)
            job = record.get("job")
            if not isinstance(job, dict):
                self._start(record, *job_identity(printing[0]))
                job = record["job"]
            job["energy_kwh"] = (_float(job.get("energy_kwh")) or 0.0) + rise
            price = self.price()
            if price is None:
                job["priced"] = False
                job["cost"] = None
            elif job.get("priced"):
                job["cost"] = (_float(job.get("cost")) or 0.0) + rise * price
            self._on_change()
        self._save()

    # -- readings ---------------------------------------------------------------

    def _job(self, printer_id: int) -> dict[str, Any] | None:
        job = self._peek(printer_id).get("job")
        return job if isinstance(job, dict) else None

    def _last(self, printer_id: int) -> dict[str, Any] | None:
        last = self._peek(printer_id).get("last")
        return last if isinstance(last, dict) else None

    def job_energy(self, printer_id: int) -> float | None:
        job = self._job(printer_id) if self.enabled else None
        value = _float(job.get("energy_kwh")) if job is not None else None
        return round(value, 4) if value is not None else None

    def job_cost(self, printer_id: int) -> float | None:
        job = self._job(printer_id) if self.enabled else None
        return _cost(job) if job is not None else None

    def last_job_energy(self, printer_id: int) -> float | None:
        last = self._last(printer_id) if self.enabled else None
        return _float(last.get("energy_kwh")) if last is not None else None

    def last_job_cost(self, printer_id: int) -> float | None:
        last = self._last(printer_id) if self.enabled else None
        return _float(last.get("cost")) if last is not None else None


def _cost(job: Mapping[str, Any]) -> float | None:
    if not job.get("priced"):
        return None
    cost = _float(job.get("cost"))
    return round(cost, 4) if cost is not None else None
