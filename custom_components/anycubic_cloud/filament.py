"""Estimating how much filament is left on each ACE spool.

The ACE has no sensor for this -- Anycubic's own `consumables_percent` field
reads zero on every slot -- so the figure is derived from what the printer
reports it has actually extruded.

The authoritative number is `settings.supplies_usage`: millimetres of filament
the printer really pushed through, which the cloud records per print job. It is
better than the slicer's estimate in three ways that matter here:

* it includes purge and priming waste, which the slice figure omits;
* it reflects what a cancelled print actually used, not what it would have;
* it is present even for jobs sliced outside the cloud.

Millimetres are converted to grams using the filament's density, and split
between slots using the slicer's per-slot breakdown when a job used more than
one colour.

The result is an estimate and is labelled as one. It cannot see filament used
outside Home Assistant's view of the printer, and it assumes 1.75 mm filament.
"""

from __future__ import annotations

import math
import re
from typing import Any

# Grams per cubic centimetre. Values are the usual published figures for
# printing filament; a spool that differs slightly moves the estimate by about
# as much as the density differs, which is well inside the error of guessing a
# spool's starting weight.
FILAMENT_DENSITY_G_CM3: dict[str, float] = {
    "PLA": 1.24,
    "PLA+": 1.24,
    "PLA-SE": 1.24,
    "PETG": 1.27,
    "ABS": 1.04,
    "ASA": 1.07,
    "PC": 1.20,
    "PA": 1.14,
    "PAHT-CF": 1.30,
    "PACF": 1.30,
    "HIPS": 1.04,
    "TPU": 1.21,
}
# Used when the material is unknown. PLA and PETG are the common cases and sit
# either side of this, so the worst case is a couple of percent out.
DEFAULT_DENSITY_G_CM3 = 1.24

# Anycubic printers take 1.75 mm filament.
FILAMENT_DIAMETER_MM = 1.75

# A full spool, when the user hasn't said otherwise.
DEFAULT_SPOOL_WEIGHT_G = 1000.0

# Where the baseline for the rate is taken. Before this there is barely any
# printing to measure a rate from.
MIN_PROGRESS_FOR_FORECAST_PCT = 3.0

# How much progress must pass after the baseline before a rate is trusted.
# Measured on a real print: too small a window and normal variation between
# layers swamps the rate.
MIN_PROGRESS_SPAN_PCT = 5.0

# Filaments loaded with abrasive fill. These chew through a brass nozzle in
# tens of hours where PLA would barely mark it, so the wear that matters is
# how much of THIS went through -- not how long the printer has been running.
ABRASIVE_MARKERS = ("CF", "GF", "CARBON", "GLASS", "GLOW", "GLITTER", "WOOD", "METAL")


def density_for_material(material: str | None) -> float:
    """Density for a material name as the printer reports it."""
    if not material:
        return DEFAULT_DENSITY_G_CM3

    return FILAMENT_DENSITY_G_CM3.get(
        str(material).strip().upper(), DEFAULT_DENSITY_G_CM3
    )


def mm_to_grams(length_mm: float | None, material: str | None = None) -> float:
    """Convert a length of filament to its weight."""
    if not length_mm or length_mm <= 0:
        return 0.0

    radius_cm = (FILAMENT_DIAMETER_MM / 10) / 2
    volume_cm3 = math.pi * radius_cm**2 * (length_mm / 10)

    return volume_cm3 * density_for_material(material)


def slot_shares(paint_infos: list[dict[str, Any]] | None) -> dict[int, float]:
    """How a job's filament divided between ACE slots, as fractions summing to 1.

    The slicer reports grams per colour along with the slot it came from, which
    is the only per-slot breakdown available. The proportions are applied to the
    printer's actual total, so purge waste is shared out rather than lost.
    """
    if not paint_infos:
        return {}

    weights: dict[int, float] = {}

    for entry in paint_infos:
        if not isinstance(entry, dict):
            continue
        index = entry.get("paint_index")
        used = entry.get("filament_used")
        if not isinstance(index, int) or not isinstance(used, (int, float)):
            continue
        if used > 0:
            weights[index] = weights.get(index, 0.0) + float(used)

    total = sum(weights.values())

    if total <= 0:
        return {}

    return {index: value / total for index, value in weights.items()}


def attribute_job_to_slots(
    supplies_usage_mm: float | None,
    paint_infos: list[dict[str, Any]] | None,
    slot_materials: dict[int, str | None] | None = None,
    loaded_slot: int | None = None,
) -> dict[int, float]:
    """Split one job's real filament use between the slots that supplied it.

    Returns grams per slot index. An empty result means the job could not be
    attributed -- better to record nothing than to charge it to the wrong spool.
    """
    if not supplies_usage_mm or supplies_usage_mm <= 0:
        return {}

    materials = slot_materials or {}
    shares = slot_shares(paint_infos)

    # `paint_index` numbers the materials within the slicer's list for a job,
    # not the ACE slots they were drawn from. On a single-material print it is
    # therefore always 0 -- which is not a statement that slot 1 fed the job,
    # and reading it as one charged every such print to the wrong spool.
    # With one material there is nothing to apportion anyway, so the slot the
    # printer reports as feeding is both simpler and correct.
    if len(shares) <= 1 and loaded_slot is not None and loaded_slot >= 0:
        shares = {loaded_slot: 1.0}

    if not shares:
        # Nothing to go on: no breakdown, and no idea which slot was loaded.
        if loaded_slot is None or loaded_slot < 0:
            return {}
        shares = {loaded_slot: 1.0}

    return {
        index: mm_to_grams(supplies_usage_mm * share, materials.get(index))
        for index, share in shares.items()
    }


def spool_signature(slot: dict[str, Any] | None) -> str | None:
    """A short fingerprint of what is in a slot, for spotting spool changes.

    Colour, material and SKU together are the only things that distinguish one
    spool from another, so a change in any of them is treated as a new spool and
    the consumption counter starts again.
    """
    if not slot:
        return None

    material = slot.get("material_type") or ""
    colour = slot.get("color_hex") or ""
    sku = slot.get("sku") or ""

    if not (material or colour or sku):
        return None

    return f"{material}|{colour}|{sku}"


def remaining_grams(spool_weight_g: float, used_g: float) -> float:
    """Filament left, never reported as less than empty."""
    return max(0.0, round(spool_weight_g - used_g, 1))


def remaining_percent(spool_weight_g: float, used_g: float) -> float | None:
    """Filament left as a percentage of a full reel.

    Measured against a full reel rather than against however much happened to
    be on this one when it was set up. A part-used spool entered as 334 g and
    now down to 283 g is 28% of a reel, not 85% -- and 85% next to a genuinely
    full slot reading 100% invites exactly the wrong decision about which one
    to start a long print on.

    A reel larger than the standard kilo is measured against its own size, so
    a 5 kg spool still reads 100% when full.
    """
    nominal = max(spool_weight_g, DEFAULT_SPOOL_WEIGHT_G)

    if nominal <= 0:
        return None

    return round(max(0.0, min(100.0, (spool_weight_g - used_g) / nominal * 100)), 1)


def job_grams_required(
    used_mm: float | None,
    progress_pct: float | None,
    material: str | None = None,
    baseline: tuple[float, float] | None = None,
) -> float | None:
    """What a running job will need in total, from what it has used so far.

    The printer reports both the filament it has extruded and how far through
    it is, which is all this needs -- no slicer estimate, so it works for jobs
    started at the printer's own screen too.

    ⚠ Dividing total used by progress does NOT work. A print begins with a
    purge and a prime that are a fixed cost, not part of the rate, so early on
    that ratio is wildly high. Measured on a real Kobra S1 job: at 5% it
    projected 125 g for a print that actually took ~52 g -- a 2.4x
    over-estimate, and a run-out warning that over-projects like that is worse
    than none at all.

    So the rate is measured *between two observations*, which cancels the
    fixed startup cost exactly. `baseline` is an earlier (used_mm, progress)
    pair; without one, or before enough progress has passed since it, there is
    no answer yet.
    """
    if not used_mm or used_mm <= 0:
        return None

    if progress_pct is None or progress_pct <= 0 or progress_pct > 100:
        return None

    if baseline is None:
        return None

    base_mm, base_pct = baseline

    if progress_pct - base_pct < MIN_PROGRESS_SPAN_PCT:
        return None

    grams_since = mm_to_grams(used_mm - base_mm, material)

    if grams_since <= 0:
        return None

    per_pct = grams_since / (progress_pct - base_pct)
    total = mm_to_grams(used_mm, material) + per_pct * (100 - progress_pct)

    return round(total, 1)


def runout_forecast(
    required_g: float | None,
    remaining_g: float | None,
) -> dict[str, float] | None:
    """Whether the loaded spool holds enough, and where it would run dry.

    Returns None when there isn't enough to say. Otherwise `shortfall_g` is
    zero for a job that fits, and `runs_out_at_pct` is the progress the spool
    would empty at -- 100 when it lasts.
    """
    if required_g is None or remaining_g is None or required_g <= 0:
        return None

    shortfall = max(0.0, required_g - remaining_g)
    runs_out_at = 100.0 if shortfall <= 0 else remaining_g / required_g * 100

    return {
        "required_g": round(required_g, 1),
        "remaining_g": round(remaining_g, 1),
        "shortfall_g": round(shortfall, 1),
        "runs_out_at_pct": round(min(100.0, runs_out_at), 1),
    }


# Anycubic stamps each slice with the date and time it was made, so the same
# model sliced twice has two different names. Everything after that stamp is
# the model, the plate and the settings -- which is what makes two jobs the
# same job.
_JOB_NAME_TIMESTAMP = re.compile(r"^\d{4}-\d{4}-")

# How many past prints of a model to average. Enough to absorb one odd run,
# few enough that changing a model's settings is reflected quickly.
JOB_HISTORY_SAMPLES = 5


def normalise_job_name(name: str | None) -> str | None:
    """A job name that is the same for two prints of the same thing."""
    if not name:
        return None

    stripped = _JOB_NAME_TIMESTAMP.sub("", str(name).strip())

    return stripped or None


def history_estimate(samples: list[float] | None) -> float | None:
    """What this model has actually taken before, averaged.

    Measured on real prints: three runs of one model took 50.34, 49.49 and
    49.49 g -- a spread under 1%. That makes history far and away the best
    estimate available, and unlike anything derived from progress it is there
    before the first layer.
    """
    usable = [float(s) for s in (samples or []) if isinstance(s, (int, float)) and s > 0]

    if not usable:
        return None

    return round(sum(usable) / len(usable), 1)


def is_abrasive(material: str | None) -> bool:
    """Whether a filament wears the nozzle unusually fast.

    Matched on the name the printer reports, which is all there is to go on --
    generous by design, since under-reporting wear is the more expensive
    mistake and a false positive only inflates a maintenance counter.
    """
    if not material:
        return False

    name = str(material).strip().upper()

    return any(marker in name for marker in ABRASIVE_MARKERS)


def cost_of(grams: float | None, price_per_kg: float | None) -> float | None:
    """What a quantity of filament cost, or None if the price isn't known."""
    if not grams or grams <= 0 or not price_per_kg or price_per_kg <= 0:
        return None

    return round(grams / 1000 * price_per_kg, 2)
