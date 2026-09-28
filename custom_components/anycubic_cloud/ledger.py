"""The filament ledger (COMPAT §6, BEHAVIOUR §3).

The stored document keeps the 2.x shape exactly, so a ledger written by 2.x
loads and keeps working, and one written here can be read by 2.x:

    {printers: {"<printer id>": {slots: {"0".."3": {...}}, last_job_id,
     totals: {...}, nozzle: {...}, axis_step, drying_settings?,
     feeding_slot?}},
     spools: {"<signature>": {...}},
     jobs: {"<job name>": [grams, ...]}}

Only the first ACE's slots are tracked (BEHAVIOUR §3.1).
"""

from __future__ import annotations

from dataclasses import dataclass, field
import logging
from typing import TYPE_CHECKING, Any

from homeassistant.helpers.storage import Store

from .const import (
    ACE_SLOTS,
    AXIS_STEPS,
    DEFAULT_AXIS_STEP,
    DEFAULT_SPOOL_WEIGHT_G,
    FORECAST_ANCHOR_MIN_PROGRESS,
    FORECAST_MIN_SPAN,
    JOB_HISTORY_SAMPLES,
    STORE_FILAMENT,
    STORE_VERSION,
)
from .filament import (
    cost,
    grams_from_length,
    history_key,
    is_abrasive,
    nozzle_wear_percent,
    remaining_grams,
    remaining_percent,
    rgb_to_hex,
    split_signature,
    spool_signature,
)

if TYPE_CHECKING:
    from homeassistant.core import HomeAssistant

    from .model import Printer

_LOGGER = logging.getLogger(__name__)

# Delay before a changed ledger is written to disk.
_SAVE_DELAY = 5.0

type Json = dict[str, Any]


def _float(value: object, default: float = 0.0) -> float:
    if isinstance(value, bool) or not isinstance(value, int | float):
        return default
    return float(value)


def _float_or_none(value: object) -> float | None:
    if isinstance(value, bool) or not isinstance(value, int | float):
        return None
    return float(value)


def _dict(parent: Json, key: str) -> Json:
    """``parent[key]`` as a dict, created (or replaced if malformed) on demand."""
    value = parent.get(key)
    if not isinstance(value, dict):
        value = parent[key] = {}
    return value


@dataclass(frozen=True, slots=True)
class Forecast:
    """Run-out forecast for the running job (BEHAVIOUR §3.6)."""

    required: float
    source: str
    shortfall: float
    runs_out_at: float
    insufficient: bool
    cost: float | None


@dataclass(slots=True)
class _Anchor:
    job_id: int | None
    length: float | None = None
    progress: float | None = None


@dataclass(slots=True)
class _RunningJob:
    """What was last seen of a job while it ran (G1)."""

    task_id: int | None
    name: str | None
    length: float | None
    shares: dict[int, float] = field(default_factory=dict)
    """The cloud job's split between colours, when it has several."""


@dataclass(frozen=True, slots=True)
class SpoolEntry:
    """One remembered reel, for the inventory sensors (BEHAVIOUR §3.10)."""

    material: str | None
    color_hex: str | None
    sku: str | None
    remaining_g: float
    remaining_percent: float
    spool_price_per_kg: float | None

    def as_dict(self) -> dict[str, Any]:
        return {
            "material": self.material,
            "color_hex": self.color_hex,
            "sku": self.sku,
            "remaining_g": self.remaining_g,
            "remaining_percent": self.remaining_percent,
            "spool_price_per_kg": self.spool_price_per_kg,
        }


class FilamentLedger:
    """Load, update and save one config entry's ledger."""

    def __init__(self, hass: HomeAssistant, entry_id: str) -> None:
        self._store: Store[Json] = Store(
            hass, STORE_VERSION, f"{STORE_FILAMENT}.{entry_id}"
        )
        self._data: Json = {"printers": {}, "spools": {}, "jobs": {}}
        # In memory only (BEHAVIOUR §3.6, G1).
        self._anchors: dict[int, _Anchor] = {}
        self._running: dict[int, _RunningJob] = {}
        self._loaded = False

    # -- persistence --------------------------------------------------------

    async def async_load(self) -> None:
        stored = await self._store.async_load()
        if isinstance(stored, dict):
            self._data = stored
        for key in ("printers", "spools", "jobs"):
            _dict(self._data, key)
        self._loaded = True

    def _save(self) -> None:
        # Never write before the stored ledger was read: that would replace
        # the user's history with an empty one.
        if self._loaded:
            self._store.async_delay_save(lambda: self._data, _SAVE_DELAY)

    async def async_flush(self) -> None:
        """Write any pending change now (on unload)."""
        if self._loaded:
            await self._store.async_save(self._data)

    @property
    def data(self) -> Json:
        """The stored document (diagnostics and tests)."""
        return self._data

    # -- structure helpers --------------------------------------------------

    def _printer(self, printer_id: int) -> Json:
        return _dict(_dict(self._data, "printers"), str(printer_id))

    def _peek_printer(self, printer_id: int) -> Json:
        printers = self._data.get("printers")
        if not isinstance(printers, dict):
            return {}
        value = printers.get(str(printer_id))
        return value if isinstance(value, dict) else {}

    def _slot(self, printer_id: int, index: int) -> Json:
        slot = _dict(_dict(self._printer(printer_id), "slots"), str(index))
        slot.setdefault("spool_weight_g", DEFAULT_SPOOL_WEIGHT_G)
        slot.setdefault("filament_used_g", 0.0)
        slot.setdefault("spool_signature", "")
        return slot

    def _peek_slot(self, printer_id: int, index: int) -> Json:
        slots = self._peek_printer(printer_id).get("slots")
        if not isinstance(slots, dict):
            return {}
        value = slots.get(str(index))
        return value if isinstance(value, dict) else {}

    @property
    def _spools(self) -> Json:
        return _dict(self._data, "spools")

    @property
    def _jobs(self) -> Json:
        return _dict(self._data, "jobs")

    # -- the update (BEHAVIOUR §3.1) ----------------------------------------

    def update(self, printer: Printer) -> None:
        """Run one ledger update. Never raises: a failure is only logged."""
        try:
            changed = self._track_reels(printer)
            changed |= self._capture_feeding_slot(printer)
            changed |= self._charge_finished_job(printer)
        except Exception:
            _LOGGER.exception("Filament ledger update failed")
            return
        if changed:
            self._save()

    @staticmethod
    def _slot_signature(printer: Printer, slot_number: int) -> str | None:
        slot = printer.ace_slot(0, slot_number)
        if slot is None:
            return None
        return spool_signature(slot.material, rgb_to_hex(slot.color), slot.sku)

    def _track_reels(self, printer: Printer) -> bool:
        """Bank every slot's figures, then resolve changed reels (§3.3)."""
        pid = printer.printer_id
        reported = {
            number: signature
            for number in ACE_SLOTS
            if (signature := self._slot_signature(printer, number)) is not None
        }
        if not reported:
            return False
        changed = False
        # 1. Bank first, under the signature each slot previously held, so two
        #    reels that swapped places each find their own history.
        for number in reported:
            stored = self._peek_slot(pid, number - 1)
            previous = stored.get("spool_signature")
            if not previous:
                continue
            reel = _dict(self._spools, previous)
            banked = {
                "filament_used_g": _float(stored.get("filament_used_g")),
                "spool_weight_g": _float(
                    stored.get("spool_weight_g"), DEFAULT_SPOOL_WEIGHT_G
                ),
            }
            if "spool_price_per_kg" in stored:
                banked["spool_price_per_kg"] = _float(stored["spool_price_per_kg"])
            for key, value in banked.items():
                if reel.get(key) != value:
                    reel[key] = value
                    changed = True
        # 2. Resolve slots whose reel changed.
        for number, signature in reported.items():
            slot = self._slot(pid, number - 1)
            previous = slot.get("spool_signature") or ""
            if signature == previous:
                continue
            known: object = self._spools.get(signature)
            if isinstance(known, dict):
                slot["filament_used_g"] = _float(known.get("filament_used_g"))
                slot["spool_weight_g"] = _float(
                    known.get("spool_weight_g"), DEFAULT_SPOOL_WEIGHT_G
                )
                slot["spool_price_per_kg"] = _float(known.get("spool_price_per_kg"))
            elif previous:
                slot["filament_used_g"] = 0.0
                slot["spool_weight_g"] = DEFAULT_SPOOL_WEIGHT_G
                slot["spool_price_per_kg"] = 0.0
            # else: first sighting of this slot, keep its figures.
            slot["spool_signature"] = signature
            changed = True
        return changed

    def _capture_feeding_slot(self, printer: Printer) -> bool:
        """Remember which slot feeds a running job (§3.1 step 2)."""
        if not printer.job_in_progress:
            return False
        loaded = printer.ace_loaded_slot_index(0)
        if loaded is None or loaded < 0:
            return False
        entry = self._printer(printer.printer_id)
        if entry.get("feeding_slot") == loaded:
            return False
        entry["feeding_slot"] = loaded
        return True

    def _charge_finished_job(self, printer: Printer) -> bool:
        """Charge a job when it ends (§3.5, G1).

        While a job runs its id, name and extruded length are remembered.
        When it stops being in progress - complete, cancelled, or its block
        gone (LAN clears the job when the printer goes idle) - it is charged
        once with the last length seen. Only jobs seen running are charged,
        so a job that finished before setup is never charged (DECISIONS V3).
        """
        pid = printer.printer_id
        if printer.job_in_progress:
            job_id = printer.job_task_id
            running = self._running.get(pid)
            length = printer.job_filament_used
            if running is None or running.task_id != job_id:
                running = self._running[pid] = _RunningJob(
                    job_id, printer.job_name, length
                )
            if shares := printer.job_paint_shares:
                running.shares = shares
            elif length is not None and (
                running.length is None or length >= running.length
            ):
                running.length = length
            running.name = printer.job_name or running.name
            return False
        running = self._running.pop(pid, None)
        if running is None:
            return False
        length = running.length
        if printer.job is not None and printer.job_task_id == running.task_id:
            final = printer.job_filament_used
            if final is not None and (length is None or final > length):
                length = final
        if not length or length <= 0 or running.task_id is None:
            return False
        return self._charge(
            printer, running.task_id, running.name, length, running.shares
        )

    def _charge(
        self,
        printer: Printer,
        job_id: int,
        job_name: str | None,
        length: float,
        shares: dict[int, float] | None = None,
    ) -> bool:
        entry = self._printer(printer.printer_id)
        # 1. Double-charge protection; the id is stored whatever happens next.
        if entry.get("last_job_id") == job_id:
            return False
        entry["last_job_id"] = job_id
        # 2. Which slot fed it: live loaded slot, else the remembered one.
        slot_index = printer.ace_loaded_slot_index(0)
        if slot_index is None or slot_index < 0:
            feeding = entry.get("feeding_slot")
            slot_index = feeding if isinstance(feeding, int) and feeding >= 0 else None
        entry.pop("feeding_slot", None)
        # 3. Several colours: each colour index is taken as the slot (§3.5,
        #    V2). One or none: all of it to the feeding slot - the slicer's
        #    index is not a slot number; without one it cannot be attributed.
        split: dict[int, float]
        if shares and len(shares) > 1:
            split = {index: share for index, share in shares.items() if 0 <= index < 4}
        elif slot_index is not None:
            split = {slot_index: 1.0}
        else:
            _LOGGER.debug("Job %s ended with no known feeding slot", job_id)
            return True
        totals = _dict(entry, "totals")
        materials = _dict(totals, "material_totals")
        nozzle = _dict(entry, "nozzle")
        job_grams = 0.0
        job_cost_sum = 0.0
        priced = False
        for index, share in split.items():
            slot_report = printer.ace_slot(0, index + 1)
            material = slot_report.material if slot_report is not None else None
            grams = grams_from_length(length * share, material)
            # 4-5. Book the grams on the slot.
            slot = self._slot(printer.printer_id, index)
            slot["filament_used_g"] = round(
                _float(slot.get("filament_used_g")) + grams, 2
            )
            # 6. Totals, cost and nozzle wear per slot.
            if material:
                materials[material] = round(_float(materials.get(material)) + grams, 2)
            slot_cost = cost(grams, _float(slot.get("spool_price_per_kg")))
            if slot_cost is not None:
                priced = True
                job_cost_sum += slot_cost
            nozzle["nozzle_total_g"] = round(
                _float(nozzle.get("nozzle_total_g")) + grams, 2
            )
            abrasive = _float(nozzle.get("nozzle_abrasive_g"))
            if is_abrasive(material):
                abrasive += grams
            nozzle["nozzle_abrasive_g"] = round(abrasive, 2)
            job_grams += grams
            _LOGGER.debug(
                "Charged job %s: %.1f g of %s to slot %s",
                job_id,
                grams,
                material,
                index,
            )
        job_cost = round(job_cost_sum, 2) if priced else None
        totals["last_job_grams"] = round(job_grams, 1)
        totals["last_job_cost"] = job_cost
        totals["cost_total"] = round(
            _float(totals.get("cost_total")) + (job_cost or 0.0), 2
        )
        if (key := history_key(job_name)) is not None:
            samples = [s for s in self._jobs.get(key, []) if isinstance(s, int | float)]
            samples.append(round(job_grams, 1))
            self._jobs[key] = samples[-JOB_HISTORY_SAMPLES:]
        return True

    # -- per-slot readings (BEHAVIOUR §2.8, §3.4) ----------------------------

    def _slot_figures(self, printer_id: int, index: int) -> tuple[float, float]:
        stored = self._peek_slot(printer_id, index)
        return (
            _float(stored.get("spool_weight_g"), DEFAULT_SPOOL_WEIGHT_G),
            _float(stored.get("filament_used_g")),
        )

    def slot_remaining(self, printer: Printer, slot_number: int) -> float | None:
        if printer.slot_is_empty(printer.ace_slot(0, slot_number)):
            return None
        return remaining_grams(*self._slot_figures(printer.printer_id, slot_number - 1))

    def slot_remaining_percent(
        self, printer: Printer, slot_number: int
    ) -> float | None:
        if printer.slot_is_empty(printer.ace_slot(0, slot_number)):
            return None
        return remaining_percent(
            *self._slot_figures(printer.printer_id, slot_number - 1)
        )

    def slot_weight(self, printer_id: int, slot_number: int) -> float:
        return self._slot_figures(printer_id, slot_number - 1)[0]

    def slot_price(self, printer_id: int, slot_number: int) -> float:
        return _float(
            self._peek_slot(printer_id, slot_number - 1).get("spool_price_per_kg")
        )

    def set_slot_weight(self, printer_id: int, slot_number: int, weight: float) -> None:
        """Record a reel's starting weight, also on the remembered reel (§3.3)."""
        slot = self._slot(printer_id, slot_number - 1)
        slot["spool_weight_g"] = float(weight)
        if signature := slot.get("spool_signature"):
            reel = _dict(self._spools, signature)
            reel["spool_weight_g"] = float(weight)
            reel["filament_used_g"] = _float(slot.get("filament_used_g"))
        self._save()

    def set_slot_price(self, printer_id: int, slot_number: int, price: float) -> None:
        slot = self._slot(printer_id, slot_number - 1)
        slot["spool_price_per_kg"] = float(price)
        if signature := slot.get("spool_signature"):
            _dict(self._spools, signature)["spool_price_per_kg"] = float(price)
        self._save()

    def reset_slot(self, printer_id: int, slot_number: int) -> None:
        """Treat the slot as a brand-new reel and forget its history (§3.3)."""
        slot = self._slot(printer_id, slot_number - 1)
        slot["filament_used_g"] = 0.0
        if signature := slot.get("spool_signature"):
            self._spools.pop(signature, None)
        self._save()

    # -- totals, nozzle (BEHAVIOUR §2.10, §3.8, §3.9) -----------------------

    def _totals(self, printer_id: int) -> Json:
        totals = self._peek_printer(printer_id).get("totals")
        return totals if isinstance(totals, dict) else {}

    def _nozzle(self, printer_id: int) -> Json:
        nozzle = self._peek_printer(printer_id).get("nozzle")
        return nozzle if isinstance(nozzle, dict) else {}

    def last_job_cost(self, printer_id: int) -> float | None:
        return _float_or_none(self._totals(printer_id).get("last_job_cost"))

    def last_job_filament(self, printer_id: int) -> float | None:
        return _float_or_none(self._totals(printer_id).get("last_job_grams"))

    def cost_total(self, printer_id: int) -> float:
        return round(_float(self._totals(printer_id).get("cost_total")), 2)

    def material_totals(self, printer_id: int) -> dict[str, float]:
        materials = self._totals(printer_id).get("material_totals")
        if not isinstance(materials, dict):
            return {}
        return {str(k): _float(v) for k, v in materials.items()}

    def nozzle_total(self, printer_id: int) -> float:
        return round(_float(self._nozzle(printer_id).get("nozzle_total_g")), 1)

    def nozzle_abrasive(self, printer_id: int) -> float:
        return round(_float(self._nozzle(printer_id).get("nozzle_abrasive_g")), 1)

    def nozzle_wear(self, printer_id: int) -> float:
        return nozzle_wear_percent(
            _float(self._nozzle(printer_id).get("nozzle_abrasive_g"))
        )

    def reset_nozzle(self, printer_id: int) -> None:
        nozzle = _dict(self._printer(printer_id), "nozzle")
        nozzle["nozzle_total_g"] = 0.0
        nozzle["nozzle_abrasive_g"] = 0.0
        self._save()

    # -- spool inventory (BEHAVIOUR §3.10) ----------------------------------

    def spool_inventory(self) -> list[SpoolEntry]:
        spools = self._data.get("spools")
        entries: list[SpoolEntry] = []
        for signature, reel in (spools if isinstance(spools, dict) else {}).items():
            if not isinstance(reel, dict):
                continue
            material, color, sku = split_signature(str(signature))
            weight = _float(reel.get("spool_weight_g"), DEFAULT_SPOOL_WEIGHT_G)
            used = _float(reel.get("filament_used_g"))
            price = _float(reel.get("spool_price_per_kg"))
            entries.append(
                SpoolEntry(
                    material=material,
                    color_hex=color,
                    sku=sku,
                    remaining_g=remaining_grams(weight, used),
                    remaining_percent=remaining_percent(weight, used),
                    spool_price_per_kg=price if price > 0 else None,
                )
            )
        return sorted(entries, key=lambda entry: entry.remaining_g)

    def spool_inventory_remaining(self) -> float:
        return round(sum(entry.remaining_g for entry in self.spool_inventory()), 1)

    def spool_inventory_count(self) -> int:
        spools = self._data.get("spools")
        return len(spools) if isinstance(spools, dict) else 0

    # -- run-out forecast (BEHAVIOUR §3.6, §3.7) ----------------------------

    def history_estimate(self, job_name: str | None) -> float | None:
        key = history_key(job_name)
        if key is None:
            return None
        samples = self._data.get("jobs", {}).get(key)
        if not isinstance(samples, list):
            return None
        positive = [float(s) for s in samples if isinstance(s, int | float) and s > 0]
        if not positive:
            return None
        return round(sum(positive) / len(positive), 1)

    def feeding_slot(self, printer_id: int) -> int | None:
        feeding = self._peek_printer(printer_id).get("feeding_slot")
        return feeding if isinstance(feeding, int) and feeding >= 0 else None

    def _extrapolate(self, printer: Printer, material: str | None) -> float | None:
        """Two-observation rate method; never total ÷ progress (B18)."""
        pid = printer.printer_id
        job_id = printer.job_task_id
        length = printer.job_filament_used
        job = printer.job
        progress = float(job.progress) if job and job.progress is not None else None
        anchor = self._anchors.get(pid)
        if anchor is None or anchor.job_id != job_id:
            anchor = self._anchors[pid] = _Anchor(job_id)
        if length is None or length <= 0 or progress is None:
            return None
        if progress <= 0 or progress > 100:
            return None
        if anchor.length is None or anchor.progress is None:
            if progress >= FORECAST_ANCHOR_MIN_PROGRESS:
                anchor.length, anchor.progress = length, progress
            return None  # the observation that sets the anchor gives no answer
        if progress - anchor.progress < FORECAST_MIN_SPAN:
            return None
        since = grams_from_length(length - anchor.length, material)
        if since <= 0:
            return None
        rate = since / (progress - anchor.progress)
        return round(grams_from_length(length, material) + rate * (100 - progress), 1)

    def forecast(self, printer: Printer) -> Forecast | None:
        """The forecast for the running job, or ``None`` (§3.6)."""
        if not printer.job_in_progress:
            return None
        pid = printer.printer_id
        slot_index = printer.ace_loaded_slot_index(0)
        if slot_index is None or slot_index < 0:
            slot_index = self.feeding_slot(pid)
        # Keep the anchor moving even when there is no slot to forecast for.
        slot_report = (
            printer.ace_slot(0, slot_index + 1) if slot_index is not None else None
        )
        material = slot_report.material if slot_report is not None else None
        extrapolated = self._extrapolate(printer, material)
        if slot_index is None:
            return None
        required = self.history_estimate(printer.job_name)
        source = "history"
        if required is None:
            required, source = extrapolated, "extrapolated"
        if required is None or required <= 0:
            return None
        remaining = remaining_grams(*self._slot_figures(pid, slot_index))
        shortfall = max(0.0, required - remaining)
        runs_out = 100.0 if shortfall <= 0 else min(100.0, remaining / required * 100)
        return Forecast(
            required=round(required, 1),
            source=source,
            shortfall=round(shortfall, 1),
            runs_out_at=round(runs_out, 1),
            insufficient=shortfall > 0,
            cost=cost(required, self.slot_price(pid, slot_index + 1)),
        )

    # -- settings kept in the ledger (BEHAVIOUR §3.11, §3.12) ---------------

    def axis_step(self, printer_id: int) -> int:
        step = self._peek_printer(printer_id).get("axis_step")
        return step if step in AXIS_STEPS else DEFAULT_AXIS_STEP

    def set_axis_step(self, printer_id: int, step: int) -> None:
        self._printer(printer_id)["axis_step"] = step
        self._save()

    def drying_setting(self, printer_id: int, name: str) -> float | None:
        settings = self._peek_printer(printer_id).get("drying_settings")
        if not isinstance(settings, dict):
            return None
        value = _float_or_none(settings.get(name))
        return value if value is not None and value > 0 else None

    def set_drying_setting(self, printer_id: int, name: str, value: float) -> None:
        _dict(self._printer(printer_id), "drying_settings")[name] = float(value)
        self._save()
