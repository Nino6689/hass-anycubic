"""Pure filament arithmetic (BEHAVIOUR §3.2-§3.11). No Home Assistant imports."""

from __future__ import annotations

import math
import re

from .const import (
    ABRASIVE_MARKERS,
    DEFAULT_DRYING_PROFILE,
    DEFAULT_FILAMENT_DENSITY,
    DEFAULT_SPOOL_WEIGHT_G,
    DRYING_PROFILES,
    FILAMENT_DENSITY,
    FILAMENT_RADIUS_CM,
    FULL_REEL_G,
    NOZZLE_GUIDE_LIFE_G,
)

# A slicer timestamp at the start of a job name, e.g. "0622-1002-" (§3.7).
_SLICER_PREFIX = re.compile(r"^\d{4}-\d{4}-")


def _material_key(material: str | None) -> str:
    return (material or "").strip().upper()


def density(material: str | None) -> float:
    """Density in g/cm³; unknown materials use the default (§3.2)."""
    return FILAMENT_DENSITY.get(_material_key(material), DEFAULT_FILAMENT_DENSITY)


def grams_from_length(length_mm: float | None, material: str | None) -> float:
    """Grams in ``length_mm`` of 1.75 mm filament (§3.2).

    A missing, zero or negative length is 0 g. ``supplies_usage`` is a
    length in millimetres (DECISIONS V1).
    """
    if length_mm is None or length_mm <= 0:
        return 0.0
    volume_cm3 = math.pi * FILAMENT_RADIUS_CM**2 * (length_mm / 10)
    return volume_cm3 * density(material)


def rgb_to_hex(color: tuple[int, int, int] | list[int] | None) -> str | None:
    """``[r, g, b]`` as ``#RRGGBB``; ``None`` when not a valid triple."""
    if color is None or len(color) != 3:
        return None
    if not all(isinstance(c, int) and 0 <= c <= 255 for c in color):
        return None
    return "#{:02X}{:02X}{:02X}".format(*color)


def spool_signature(
    material: str | None, color_hex: str | None, sku: str | None
) -> str | None:
    """``material|#RRGGBB|sku``; ``None`` when all three are empty (§3.3)."""
    parts = [(material or "").strip(), (color_hex or "").strip(), (sku or "").strip()]
    if not any(parts):
        return None
    return "|".join(parts)


def split_signature(signature: str) -> tuple[str | None, str | None, str | None]:
    """Material, colour and SKU back out of a signature; blanks are ``None``."""
    parts = [*signature.split("|", 2), "", ""][:3]
    material, color, sku = (part or None for part in parts)
    return material, color, sku


def remaining_grams(weight: float | None, used: float | None) -> float:
    """Grams left on a reel: max(0, W - U), 0.1 g (§3.4)."""
    w = DEFAULT_SPOOL_WEIGHT_G if weight is None else weight
    return round(max(0.0, w - (used or 0.0)), 1)


def remaining_percent(weight: float | None, used: float | None) -> float:
    """Share of a *full reel* left (§3.4).

    The denominator is max(W, 1000 g): a reel entered at 334 g that now holds
    283 g shows 28 %, not 85 %.
    """
    w = DEFAULT_SPOOL_WEIGHT_G if weight is None else weight
    percent = (w - (used or 0.0)) / max(w, FULL_REEL_G) * 100
    return round(min(100.0, max(0.0, percent)), 1)


def cost(grams: float | None, price_per_kg: float | None) -> float | None:
    """Cost of ``grams`` at ``price_per_kg``, 0.01; ``None`` if either is ≤ 0 (§3.8).

    An unpriced job is never reported as free.
    """
    if grams is None or price_per_kg is None or grams <= 0 or price_per_kg <= 0:
        return None
    return round(grams / 1000 * price_per_kg, 2)


def is_abrasive(material: str | None) -> bool:
    """Broad match on the material name (§3.9)."""
    key = _material_key(material)
    return bool(key) and any(marker in key for marker in ABRASIVE_MARKERS)


def nozzle_wear_percent(abrasive_grams: float) -> float:
    """Abrasive grams against a 1000 g guide life, capped at 100 % (§3.9)."""
    return round(min(100.0, abrasive_grams / NOZZLE_GUIDE_LIFE_G * 100), 1)


def drying_profile(material: str | None) -> tuple[int, int]:
    """Recommended (°C, minutes) for ``material`` (§3.11)."""
    return DRYING_PROFILES.get(_material_key(material), DEFAULT_DRYING_PROFILE)


def history_key(job_name: str | None) -> str | None:
    """Job-history key: trimmed name without a leading slicer timestamp (§3.7)."""
    if not job_name:
        return None
    key = _SLICER_PREFIX.sub("", job_name.strip()).strip()
    return key or None
