"""The cloud camera's still: a plain placeholder picture (BEHAVIOUR §2.18).

No frame of the cloud camera ever reaches Home Assistant, so its still is a
fixed image: a dark grey 16:9 PNG with a lighter camera-like mark, drawn here
so no picture file has to be shipped.
"""

from __future__ import annotations

from functools import cache
import struct
import zlib

_WIDTH = 320
_HEIGHT = 180
_BACKGROUND = (48, 48, 52)
_MARK = (120, 120, 128)


def _chunk(kind: bytes, data: bytes) -> bytes:
    crc = zlib.crc32(kind + data) & 0xFFFFFFFF
    return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", crc)


def _pixel(x: int, y: int) -> tuple[int, int, int]:
    """A rounded body and a lens in the middle of the picture."""
    cx, cy = _WIDTH // 2, _HEIGHT // 2
    in_body = abs(x - cx) <= 40 and abs(y - cy) <= 26
    lens = (x - cx) ** 2 + (y - cy) ** 2
    if in_body and not 100 <= lens <= 196:
        return _MARK
    return _BACKGROUND


@cache
def placeholder_png() -> bytes:
    """The PNG bytes, built once."""
    rows = bytearray()
    for y in range(_HEIGHT):
        rows.append(0)  # filter: none
        for x in range(_WIDTH):
            rows.extend(_pixel(x, y))
    header = struct.pack(">IIBBBBB", _WIDTH, _HEIGHT, 8, 2, 0, 0, 0)
    return (
        b"\x89PNG\r\n\x1a\n"
        + _chunk(b"IHDR", header)
        + _chunk(b"IDAT", zlib.compress(bytes(rows), 9))
        + _chunk(b"IEND", b"")
    )
