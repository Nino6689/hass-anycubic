"""Electricity used by a print, from an energy meter the user already has.

Many printers sit on a smart plug that meters energy, and the integration can
already switch one. Pointing the integration at that plug's energy sensor lets
each print carry what its electricity cost alongside its filament (discussion
#46). Each rise in the meter while exactly one printer is printing is charged
to that printer's job, at the price in force at that moment -- so a dynamic
tariff prices a long print correctly rather than at whatever the rate was when
it finished.
"""

from __future__ import annotations

from typing import Any

from homeassistant.const import STATE_UNAVAILABLE, STATE_UNKNOWN

_TO_KWH = {"Wh": 0.001, "kWh": 1.0, "MWh": 1000.0}

# A smart plug won't put five kilowatt-hours through a printer between two
# readings. A bigger jump is a meter that was reset, replaced or misread, and
# charging it to a print would be wrong.
MAX_STEP_KWH = 5.0


def _number(state: Any) -> float | None:
    if state is None or state.state in (STATE_UNKNOWN, STATE_UNAVAILABLE, None, ""):
        return None
    try:
        return float(state.state)
    except (TypeError, ValueError):
        return None


def energy_kwh(state: Any) -> float | None:
    """A meter reading in kWh, or None if it isn't a usable energy reading."""
    value = _number(state)
    if value is None:
        return None
    unit = state.attributes.get("unit_of_measurement", "kWh")
    factor = _TO_KWH.get(unit)
    return None if factor is None else value * factor


def energy_step_kwh(old_state: Any, new_state: Any) -> float | None:
    """How much the meter moved between two readings, if it moved forwards sensibly."""
    before = energy_kwh(old_state)
    after = energy_kwh(new_state)
    if before is None or after is None:
        return None
    step = after - before
    if step <= 0 or step > MAX_STEP_KWH:
        return None
    return step


def price_per_kwh(state: Any, fixed: Any) -> float | None:
    """The price now: a price entity wins when it reads a number, else the fixed price.

    A fixed price of zero means "not set" rather than free electricity, so an
    unpriced setup reports energy without inventing a cost.
    """
    from_entity = _number(state)
    if from_entity is not None and from_entity >= 0:
        return from_entity
    try:
        value = float(fixed)
    except (TypeError, ValueError):
        return None
    return value if value > 0 else None


def add_costs(*costs: float | None) -> float | None:
    """Sum the costs that are known; None only if none of them is."""
    known = [cost for cost in costs if cost is not None]
    return round(sum(known), 2) if known else None
