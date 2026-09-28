"""The ``ace_slot_N`` entity picture: a spool face in the reel's colours.

BEHAVIOUR §2.8: a ring coloured with vertical bands (one per colour, in the
order reported), a hollow hub, neutral grey rims so white filament shows on a
white page. Only ``#RRGGBB`` colours are drawn; none valid means no picture.
"""

from __future__ import annotations

import base64
import re

_HEX = re.compile(r"^#[0-9A-Fa-f]{6}$")
_SIZE = 64
_CENTRE = _SIZE / 2
_RIM = "#9E9E9E"


def spool_picture(colors: list[str]) -> str | None:
    """An SVG data URL for the given colours, or ``None``."""
    valid = [c.upper() for c in colors if isinstance(c, str) and _HEX.match(c)]
    if not valid:
        return None
    band = _SIZE / len(valid)
    bands = "".join(
        f'<rect x="{i * band:.2f}" y="0" width="{band + 0.5:.2f}" '
        f'height="{_SIZE}" fill="{color}"/>'
        for i, color in enumerate(valid)
    )
    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {_SIZE} {_SIZE}">'
        '<defs><clipPath id="ring">'
        f'<circle cx="{_CENTRE}" cy="{_CENTRE}" r="28"/></clipPath></defs>'
        f'<g clip-path="url(#ring)">{bands}</g>'
        f'<circle cx="{_CENTRE}" cy="{_CENTRE}" r="29" fill="none" '
        f'stroke="{_RIM}" stroke-width="3"/>'
        f'<circle cx="{_CENTRE}" cy="{_CENTRE}" r="11" fill="#FFFFFF" '
        f'stroke="{_RIM}" stroke-width="3"/>'
        f'<circle cx="{_CENTRE}" cy="{_CENTRE}" r="4" fill="{_RIM}"/>'
        "</svg>"
    )
    encoded = base64.b64encode(svg.encode("ascii")).decode("ascii")
    return f"data:image/svg+xml;base64,{encoded}"
