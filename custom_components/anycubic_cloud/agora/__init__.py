"""A self-contained signalling client for Agora ("shengwang", 声网) SD-RTN.

The Anycubic cloud publishes a printer's camera into an Agora channel and
hands out short-lived join credentials. Agora's client-to-SD-RTN signalling is
proprietary, but it is JSON over a websocket and it is fully described by the
Web SDK the Anycubic slicer ships, so it can be reimplemented here without any
SDK, native library, or extra dependency.

This package speaks only the signalling. It never touches media: the browser is
the WebRTC peer, and Home Assistant just brokers the offer and answer between
it and Agora. That is what keeps the media path off the Home Assistant host --
and it is also why nothing here decodes video.

Usage::

    session = AgoraStreamSession(aiohttp_session, credentials, LOGGER)
    try:
        answer = await session.async_start(offer_sdp, session_id)
    except AgoraError:
        await session.async_close()

Adapted from `Jezza34000/homeassistant_petkit` (MIT), whose Agora client is in
turn based on the original reverse engineering by @mikey0000.
"""

from __future__ import annotations

from .answer import RemoteVideoStream
from .ap import AgoraAccessPoint, AgoraResponse, EdgeAddress
from .errors import (
    AgoraAccessPointError,
    AgoraEncryptionError,
    AgoraError,
    AgoraSdpError,
    AgoraSignallingError,
)
from .session import AgoraStreamSession

__all__ = [
    "AgoraAccessPoint",
    "AgoraAccessPointError",
    "AgoraEncryptionError",
    "AgoraError",
    "AgoraResponse",
    "AgoraSdpError",
    "AgoraSignallingError",
    "AgoraStreamSession",
    "EdgeAddress",
    "RemoteVideoStream",
]
