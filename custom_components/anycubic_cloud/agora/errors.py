"""Errors raised by the Agora signalling client.

Adapted from `Jezza34000/homeassistant_petkit` (MIT), whose Agora client is in
turn based on the original reverse engineering by @mikey0000.
"""

from __future__ import annotations


class AgoraError(Exception):
    """Base class for every failure inside the Agora signalling client."""


class AgoraAccessPointError(AgoraError):
    """The choose-server lookup failed, so no gateway is known."""


class AgoraSignallingError(AgoraError):
    """The gateway websocket refused, dropped, or never completed the join."""


class AgoraEncryptionError(AgoraError):
    """The channel key could not be wrapped, or the gateway rejected it."""


class AgoraSdpError(AgoraError):
    """The browser offer could not be parsed, or no answer could be built."""
