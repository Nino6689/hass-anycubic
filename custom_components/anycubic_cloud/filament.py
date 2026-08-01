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

    if not shares:
        # No per-slot breakdown: a single-material print, or one sliced outside
        # the cloud. Charge it to the slot that was loaded, if we know it.
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
    """Filament left as a percentage of the spool it started as."""
    if spool_weight_g <= 0:
        return None

    return round(
        max(0.0, min(100.0, (spool_weight_g - used_g) / spool_weight_g * 100)), 1
    )
