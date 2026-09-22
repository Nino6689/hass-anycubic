"""Compatibility helpers for aiofiles versions supported by Home Assistant."""
from __future__ import annotations

from asyncio import AbstractEventLoop, get_running_loop
from collections.abc import Callable, Coroutine
from concurrent.futures import Executor
from functools import partial, wraps
from typing import Any


def ensure_aiofiles_wrap(base_module: Any = None) -> None:
    """Restore ``aiofiles.base.wrap`` when a mixed aiofiles layout lacks it.

    ``anycubic-cloud-api`` permits aiofiles 24.1+, while aiofiles 25 moved the
    public ``wrap`` helper from ``aiofiles.ospath`` to ``aiofiles.base``.
    Supplying the small upstream helper keeps both layouts compatible and is a
    no-op when aiofiles already provides it.
    """
    if base_module is None:
        import aiofiles.base as aiofiles_base

        base_module = aiofiles_base

    if hasattr(base_module, "wrap"):
        return

    def wrap(func: Callable[..., Any]) -> Callable[..., Coroutine[Any, Any, Any]]:
        @wraps(func)
        async def run(
            *args: Any,
            loop: AbstractEventLoop | None = None,
            executor: Executor | None = None,
            **kwargs: Any,
        ) -> Any:
            if loop is None:
                loop = get_running_loop()
            pfunc = partial(func, *args, **kwargs)
            return await loop.run_in_executor(executor, pfunc)

        return run

    base_module.wrap = wrap


ensure_aiofiles_wrap()
