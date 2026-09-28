"""Orders to the printer, shared by buttons, numbers, switches and actions.

An order with a LAN form goes over LAN while the LAN link is up, decided at
send time every time (BEHAVIOUR §5.3, B38); otherwise it goes to the cloud,
which cannot reach a printer in LAN Mode. Orders whose result arrives over
the cloud MQTT first "wake" it (§2.12). Failures surface as Home Assistant
errors carrying the printer's or the cloud's message. Controls end with an
immediate refresh unless the specification says otherwise.
"""

from __future__ import annotations

import asyncio
from collections.abc import Awaitable, Callable
from dataclasses import asdict
import logging
from typing import TYPE_CHECKING, Any, Protocol

from anycubic_cloud_client import (
    AnycubicCloudClient,
    AnycubicCloudError,
    Axis,
    FileSource,
    MoveType,
    OrderRefusedError,
)
from anycubic_lan import AnycubicLanError, NotConnectedError, ReportKind
from homeassistant.exceptions import HomeAssistantError, ServiceValidationError

from .const import (
    AXIS_XY,
    AXIS_Z,
    CLOUD_DELETE_RELIST_DELAY,
    DELETE_RELIST_DELAYS,
    DOMAIN,
    FEED_TYPE_FEED,
    FEED_TYPE_FINISH,
    FEED_TYPE_RETRACT,
    FILE_LIST_CLOUD,
    FILE_LIST_LOCAL,
    FILE_LIST_RETRY_DELAY,
    FILE_LIST_RETRY_SETTLE,
    HOME_ALL_POLL,
    HOME_ALL_TIMEOUT,
    MOVE_HOME,
)
from .filament import drying_profile
from .model import WORK_BUSY

_LOGGER = logging.getLogger(__name__)

if TYPE_CHECKING:
    from .cloud import CloudAccount
    from .coordinator import AnycubicCoordinator
    from .model import Printer


class Transport(Protocol):
    """The orders both connections offer (BEHAVIOUR §5.3 table)."""

    async def async_pause(self) -> Any: ...
    async def async_resume(self) -> Any: ...
    async def async_stop(self) -> Any: ...
    async def async_set_light(self, on: bool, light_type: int) -> Any: ...
    async def async_set_temperatures(
        self, *, nozzle: int | None = None, bed: int | None = None
    ) -> Any: ...
    async def async_set_fan(self, key: str, value: int) -> Any: ...
    async def async_move_axis(
        self, axis: int, move_type: int, distance: int
    ) -> Any: ...
    async def async_motors_off(self) -> Any: ...
    async def async_query(self, kind: ReportKind) -> Any: ...
    async def async_ace_dry(
        self, box_id: int, status: int, temperature: int, duration: int
    ) -> Any: ...
    async def async_ace_feed(
        self, box_id: int, slot_index: int, feed_type: int
    ) -> Any: ...
    async def async_ace_set_slot(
        self, box_id: int, slot_index: int, material: str, color: list[int]
    ) -> Any: ...
    async def async_ace_auto_feed(self, box_id: int, enabled: bool) -> Any: ...


class CloudOrders:
    """The cloud forms of the orders (PROTOCOL B §5), for one printer."""

    def __init__(self, account: CloudAccount, printer: Printer) -> None:
        assert account.client is not None
        self.account = account
        self.client = account.client
        self.printer = printer
        self.printer_id = printer.printer_id

    def _job_id(self) -> int:
        job_id = self.printer.job_task_id
        assert job_id is not None  # callers check for a job first
        return job_id

    async def async_pause(self) -> Any:
        return await self.client.pause_print(self.printer_id, self._job_id())

    async def async_resume(self) -> Any:
        return await self.client.resume_print(self.printer_id, self._job_id())

    async def async_stop(self) -> Any:
        return await self.client.cancel_print(self.printer_id, self._job_id())

    async def async_set_light(self, on: bool, light_type: int) -> Any:
        # With the latest job's id when a job exists, the form proven on the
        # cloud (BEHAVIOUR §2.16).
        return await self.client.set_light(
            self.printer_id,
            on,
            100 if on else 0,
            light_type=light_type,
            job_id=self.printer.job_task_id,
        )

    async def async_set_temperatures(
        self, *, nozzle: int | None = None, bed: int | None = None
    ) -> Any:
        return await self.client.set_temperature(
            self.printer_id, nozzle=nozzle, bed=bed
        )

    async def async_set_fan(self, key: str, value: int) -> Any:
        return await self.client.set_fan_speed(self.printer_id, **{key: value})

    async def async_move_axis(self, axis: int, move_type: int, distance: int) -> Any:
        return await self.client.move_axis(
            self.printer_id, Axis(axis), MoveType(move_type), distance
        )

    async def async_motors_off(self) -> Any:
        return await self.client.motors_off(self.printer_id)

    async def async_query(self, kind: ReportKind) -> Any:
        if kind == ReportKind.AXIS:
            return await self.client.query_axis_position(self.printer_id)
        return await self.client.ace_get_info(self.printer_id)

    async def async_ace_dry(
        self, box_id: int, status: int, temperature: int, duration: int
    ) -> Any:
        if status:
            return await self.client.ace_start_drying(
                self.printer_id, box_id, target_temp=temperature, duration=duration
            )
        return await self.client.ace_stop_drying(self.printer_id, [box_id])

    async def async_ace_feed(self, box_id: int, slot_index: int, feed_type: int) -> Any:
        if feed_type == FEED_TYPE_RETRACT:
            return await self.client.ace_retract(self.printer_id, box_id=box_id)
        if feed_type == FEED_TYPE_FINISH:
            return await self.client.ace_finish_feed(
                self.printer_id, slot_index, box_id=box_id
            )
        return await self.client.ace_feed(self.printer_id, slot_index, box_id=box_id)

    async def async_ace_set_slot(
        self, box_id: int, slot_index: int, material: str, color: list[int]
    ) -> Any:
        return await self.client.ace_set_slot(
            self.printer_id, box_id, slot_index, color, material
        )

    async def async_ace_auto_feed(self, box_id: int, enabled: bool) -> Any:
        return await self.client.ace_set_auto_refill(self.printer_id, box_id, enabled)


def _printer(coordinator: AnycubicCoordinator) -> Printer:
    return coordinator.printer


def cloud_account(coordinator: AnycubicCoordinator) -> CloudAccount:
    """The entry's account, for orders that exist only over the cloud."""
    account = coordinator.runtime.cloud
    if account is None or account.client is None or coordinator.lan_connected:
        raise ServiceValidationError(
            translation_domain=DOMAIN, translation_key="cloud_only_control"
        )
    return account


def transport(coordinator: AnycubicCoordinator) -> Transport:
    """LAN while its link is up, else the cloud (decided per send, B38)."""
    link = coordinator.link
    if link is not None and link.connected:
        return link
    account = coordinator.runtime.cloud
    if account is not None and account.client is not None and coordinator.uses_cloud:
        return CloudOrders(account, coordinator.printer)
    if link is not None:
        return link  # raises "not connected" when used
    raise HomeAssistantError(
        translation_domain=DOMAIN, translation_key="printer_not_connected"
    )


async def async_wake(coordinator: AnycubicCoordinator) -> None:
    """Wake the cloud MQTT before an order whose answer arrives over it."""
    if coordinator.lan_connected or not coordinator.uses_cloud:
        return
    account = coordinator.runtime.cloud
    if account is not None:
        await account.mqtt.async_wake()


async def _send(order: Awaitable[object]) -> None:
    try:
        await order
    except NotConnectedError as err:
        raise HomeAssistantError(
            translation_domain=DOMAIN, translation_key="printer_not_connected"
        ) from err
    except AnycubicLanError as err:
        raise HomeAssistantError(
            translation_domain=DOMAIN,
            translation_key="printer_error",
            translation_placeholders={"message": str(err)},
        ) from err
    except OrderRefusedError as err:
        raise HomeAssistantError(
            translation_domain=DOMAIN,
            translation_key="printer_error",
            translation_placeholders={"message": err.server_message or str(err)},
        ) from err
    except AnycubicCloudError as err:
        raise HomeAssistantError(
            translation_domain=DOMAIN,
            translation_key="cloud_error",
            translation_placeholders={"message": str(err)},
        ) from err


async def _send_and_refresh(
    coordinator: AnycubicCoordinator, order: Awaitable[object]
) -> None:
    await _send(order)
    await coordinator.async_request_refresh()


async def async_cloud_order(
    coordinator: AnycubicCoordinator,
    order: Callable[[CloudAccount], Awaitable[object]],
    *,
    wake: bool = False,
    refresh: bool = True,
) -> None:
    """An order that exists only over the cloud."""
    account = cloud_account(coordinator)
    if wake:
        await account.mqtt.async_wake()
    if refresh:
        await _send_and_refresh(coordinator, order(account))
    else:
        await _send(order(account))


# -- job ----------------------------------------------------------------------


async def async_job_command(coordinator: AnycubicCoordinator, action: str) -> None:
    """Pause, resume or stop the job; nothing is sent without one (§2.12)."""
    printer = _printer(coordinator)
    if printer.job is None or printer.job_task_id is None:
        return
    await async_wake(coordinator)
    link = transport(coordinator)
    orders: dict[str, Callable[[], Awaitable[Any]]] = {
        "pause": link.async_pause,
        "resume": link.async_resume,
        "stop": link.async_stop,
    }
    await _send_and_refresh(coordinator, orders[action]())


# -- axes (BEHAVIOUR §2.12) ----------------------------------------------------


def _refuse_while_printing(printer: Printer) -> None:
    if printer.job_in_progress:
        raise ServiceValidationError(
            translation_domain=DOMAIN, translation_key="printer_printing"
        )


async def async_move_axis(
    coordinator: AnycubicCoordinator, axis: int, move_type: int
) -> None:
    printer = _printer(coordinator)
    _refuse_while_printing(printer)
    distance = (
        0
        if move_type == MOVE_HOME
        else coordinator.ledger.axis_step(printer.printer_id)
    )
    await _send_and_refresh(
        coordinator, transport(coordinator).async_move_axis(axis, move_type, distance)
    )


async def async_home_all(coordinator: AnycubicCoordinator) -> None:
    """Home X/Y, wait until neither moving nor busy (at most 45 s), home Z.

    The wait reads the pushed axis/move state (G8).
    """
    printer = _printer(coordinator)
    _refuse_while_printing(printer)
    await _send(transport(coordinator).async_move_axis(AXIS_XY, MOVE_HOME, 0))
    # Forget the previous move's state: only a report for this homing ("done"
    # or "failed") ends the wait, not a "done" left over from an earlier jog.
    printer.axis_move_state = "sent"
    loop = asyncio.get_running_loop()
    deadline = loop.time() + HOME_ALL_TIMEOUT
    while loop.time() < deadline:
        await asyncio.sleep(HOME_ALL_POLL)
        if not printer.is_moving and printer.work_status != WORK_BUSY:
            break
    if printer.axis_move_state == "sent":
        printer.axis_move_state = None  # the printer never reported the move
    await _send_and_refresh(
        coordinator, transport(coordinator).async_move_axis(AXIS_Z, MOVE_HOME, 0)
    )


async def async_motors_off(coordinator: AnycubicCoordinator) -> None:
    _refuse_while_printing(_printer(coordinator))
    await _send_and_refresh(coordinator, transport(coordinator).async_motors_off())


async def async_request_position(coordinator: AnycubicCoordinator) -> None:
    await async_wake(coordinator)
    await _send_and_refresh(
        coordinator, transport(coordinator).async_query(ReportKind.AXIS)
    )


# -- temperatures and fans (BEHAVIOUR §2.13; B22: idle or printing) ----------


_TEMPERATURE_TARGETS = {"target_nozzle_temp": "nozzle", "target_hotbed_temp": "bed"}


async def async_set_temperature(
    coordinator: AnycubicCoordinator, key: str, value: int
) -> None:
    """Set one target; the other heater is left alone (PROTOCOL §7.2)."""
    target = {_TEMPERATURE_TARGETS[key]: value}
    await _send_and_refresh(
        coordinator, transport(coordinator).async_set_temperatures(**target)
    )


async def async_set_fan(coordinator: AnycubicCoordinator, key: str, value: int) -> None:
    await _send_and_refresh(
        coordinator, transport(coordinator).async_set_fan(key, value)
    )


# -- light (BEHAVIOUR §2.16) ---------------------------------------------------


async def async_set_light(coordinator: AnycubicCoordinator, on: bool) -> None:
    light_type = _printer(coordinator).light_type
    if light_type is None:  # pragma: no cover - the entity is unavailable then
        return
    await async_wake(coordinator)
    await _send_and_refresh(
        coordinator, transport(coordinator).async_set_light(on, light_type)
    )


# -- ACE (BEHAVIOUR §2.12, §3.11, §4.2, §4.3) ----------------------------------


async def async_ace_refresh(coordinator: AnycubicCoordinator) -> None:
    await async_wake(coordinator)
    await _send_and_refresh(
        coordinator, transport(coordinator).async_query(ReportKind.MULTI_COLOR_BOX)
    )


async def async_ace_feed(
    coordinator: AnycubicCoordinator,
    box: int,
    slot_index: int,
    *,
    finished: bool = False,
    refresh: bool = True,
) -> None:
    """Feed a slot (or end a feed); nothing is sent without an ACE."""
    printer = _printer(coordinator)
    if not printer.supports_ace or slot_index < 0:
        return
    order = transport(coordinator).async_ace_feed(
        box, slot_index, FEED_TYPE_FINISH if finished else FEED_TYPE_FEED
    )
    if refresh:
        await _send_and_refresh(coordinator, order)
    else:
        await _send(order)


async def async_ace_retract(
    coordinator: AnycubicCoordinator, box: int, *, refresh: bool = True
) -> None:
    """Retract what the ACE is feeding (feed type 2, slot -1)."""
    if not _printer(coordinator).supports_ace:
        return
    order = transport(coordinator).async_ace_feed(box, -1, FEED_TYPE_RETRACT)
    if refresh:
        await _send_and_refresh(coordinator, order)
    else:
        await _send(order)


def drying_defaults(coordinator: AnycubicCoordinator, box: int) -> tuple[int, int]:
    """(°C, minutes): stored settings, else the profile of the material in
    the ACE being dried (§3.11, B11)."""
    printer = _printer(coordinator)
    ledger = coordinator.ledger
    feeding = ledger.feeding_slot(printer.printer_id) if box == 0 else None
    profile_temp, profile_minutes = drying_profile(printer.ace_material(box, feeding))
    temperature = ledger.drying_setting(printer.printer_id, "temperature")
    duration = ledger.drying_setting(printer.printer_id, "duration")
    return (
        int(temperature) if temperature is not None else profile_temp,
        int(duration) if duration is not None else profile_minutes,
    )


async def async_drying_start(
    coordinator: AnycubicCoordinator, box: int, preset: int | None = None
) -> None:
    printer = _printer(coordinator)
    if printer.ace_box(box) is None:
        return
    if preset is not None:
        values = coordinator.drying_preset(preset)
        if values is None:
            return  # pressing with the preset missing does nothing
        duration, temperature = values
        await async_wake(coordinator)  # the preset buttons wake (§2.12)
    else:
        temperature, duration = drying_defaults(coordinator, box)
    await _send_and_refresh(
        coordinator,
        transport(coordinator).async_ace_dry(box, 1, temperature, duration),
    )


async def async_drying_stop(coordinator: AnycubicCoordinator, box: int) -> None:
    """Stop drying on this ACE only (DECISIONS V11)."""
    if _printer(coordinator).ace_box(box) is None:
        return
    await async_wake(coordinator)
    await _send_and_refresh(
        coordinator, transport(coordinator).async_ace_dry(box, 0, 0, 0)
    )


async def async_set_auto_feed(
    coordinator: AnycubicCoordinator, box: int, enabled: bool
) -> None:
    """Run-out refill; nothing is sent when the state already matches."""
    printer = _printer(coordinator)
    if printer.ace_auto_feed(box) == enabled:
        return
    await async_wake(coordinator)
    await _send_and_refresh(
        coordinator, transport(coordinator).async_ace_auto_feed(box, enabled)
    )


async def async_set_slot(
    coordinator: AnycubicCoordinator,
    box: int,
    slot_index: int,
    material: str,
    color: list[int],
) -> None:
    """Tell the ACE what is in a slot (§4.2); no ACE or job precondition.

    Slot 0 would become index -1: nothing is sent, as for a feed (§4.3).
    Over the cloud the reply arrives over MQTT, so it wakes it (G16).
    """
    if slot_index < 0:
        return
    await async_wake(coordinator)
    await _send_and_refresh(
        coordinator,
        transport(coordinator).async_ace_set_slot(box, slot_index, material, color),
    )


# -- cloud-only controls ---------------------------------------------------------


async def async_set_ai_detection(
    coordinator: AnycubicCoordinator, enabled: bool
) -> None:
    """Order 1243, cloud only; every other setting kept as last reported
    (BEHAVIOUR §2.15). Does not wake the cloud MQTT."""
    settings = _printer(coordinator).state.ai_settings
    current: dict[str, Any] | None = None
    if settings is not None:
        current = {
            key: list(value) if isinstance(value, tuple) else value
            for key, value in asdict(settings).items()
            if key != "status"
        }
    printer_id = coordinator.printer_id
    await async_cloud_order(
        coordinator,
        lambda account: _client(account).set_ai_detection(printer_id, enabled, current),
    )


def _client(account: CloudAccount) -> AnycubicCloudClient:
    assert account.client is not None
    return account.client


async def async_request_printer_files(
    coordinator: AnycubicCoordinator, source: FileSource, *, refresh: bool = True
) -> None:
    """Orders 103 / 101: the list arrives over the cloud MQTT (§2.12)."""
    printer_id = coordinator.printer_id
    await async_cloud_order(
        coordinator,
        lambda account: _client(account).request_file_list(printer_id, source),
        wake=True,
        refresh=refresh,
    )


async def async_request_file_list(
    coordinator: AnycubicCoordinator, source: str
) -> None:
    """The ``request_file_list_<source>`` buttons (BEHAVIOUR §2.12, D §3.6)."""
    if not coordinator.can_fetch_file_list(source):
        raise ServiceValidationError(
            translation_domain=DOMAIN,
            translation_key="file_list_unavailable",
            translation_placeholders={"source": source},
        )
    account = coordinator.runtime.cloud
    assert account is not None
    if source == FILE_LIST_CLOUD:
        # Wakes the cloud MQTT first, as 2.x did, although the list is HTTP.
        await account.mqtt.async_wake()
        await _send(account.async_fetch_cloud_files())
        return
    before = coordinator.file_list(source)
    await async_request_printer_files(coordinator, FileSource(source))
    if source == FILE_LIST_LOCAL and not coordinator.local_list_retry_pending:
        coordinator.local_list_retry_pending = True
        coordinator.config_entry.async_create_background_task(
            coordinator.hass,
            _async_local_list_retry(coordinator, before),
            "anycubic_cloud local file list retry",
        )


async def _async_local_list_retry(
    coordinator: AnycubicCoordinator, before: list[dict[str, Any]] | None
) -> None:
    """5 s later, if no list ever arrived, restart the cloud MQTT once and
    ask again (PROTOCOL C §6.11). Single-flight."""
    try:
        await asyncio.sleep(FILE_LIST_RETRY_DELAY)
        account = coordinator.runtime.cloud
        if (
            account is None
            or not coordinator.printer.is_online
            or before is not None
            or coordinator.file_list(FILE_LIST_LOCAL) is not None
        ):
            return
        await account.mqtt.async_refresh()
        await account.mqtt.async_wake()
        await asyncio.sleep(FILE_LIST_RETRY_SETTLE)
        await async_request_printer_files(coordinator, FileSource.LOCAL)
    except HomeAssistantError as err:
        _LOGGER.debug("Local file list retry failed: %s", err)
    finally:
        coordinator.local_list_retry_pending = False


async def async_delete_printer_file(
    coordinator: AnycubicCoordinator, source: FileSource, filename: str
) -> None:
    """Orders 104 / 102, then the list is asked for twice, 2 s and 7 s later
    (BEHAVIOUR §4.5). The answer arrives over the cloud MQTT: wakes it (G16)."""
    printer_id = coordinator.printer_id
    await async_cloud_order(
        coordinator,
        lambda account: _client(account).delete_printer_file(
            printer_id, source, filename
        ),
        wake=True,
        refresh=False,
    )
    coordinator.config_entry.async_create_background_task(
        coordinator.hass,
        _async_relist(coordinator, source),
        "anycubic_cloud file list after delete",
    )


async def _async_relist(coordinator: AnycubicCoordinator, source: FileSource) -> None:
    waited = 0.0
    for delay in DELETE_RELIST_DELAYS:
        await asyncio.sleep(delay - waited)
        waited = delay
        try:
            await async_request_printer_files(coordinator, source, refresh=False)
        except HomeAssistantError as err:
            _LOGGER.debug("File list after delete failed: %s", err)


async def async_delete_cloud_file(
    coordinator: AnycubicCoordinator, file_id: int
) -> None:
    """Delete a cloud file; the list is fetched again 5 s later (§4.5).

    HTTP only, account-wide; the printer selector is required but unused.
    """
    account = coordinator.runtime.cloud
    if account is None or account.client is None:
        raise ServiceValidationError(
            translation_domain=DOMAIN, translation_key="cloud_only_control"
        )
    try:
        await account.client.delete_cloud_files([file_id])
    except OrderRefusedError as err:
        raise HomeAssistantError(
            translation_domain=DOMAIN, translation_key="cloud_file_delete_failed"
        ) from err
    except AnycubicCloudError as err:
        raise HomeAssistantError(
            translation_domain=DOMAIN,
            translation_key="cloud_error",
            translation_placeholders={"message": str(err)},
        ) from err

    async def _relist() -> None:
        await asyncio.sleep(CLOUD_DELETE_RELIST_DELAY)
        try:
            await account.async_fetch_cloud_files()
        except AnycubicCloudError as err:
            _LOGGER.debug("Cloud file list after delete failed: %s", err)

    coordinator.config_entry.async_create_background_task(
        coordinator.hass, _relist(), "anycubic_cloud cloud file list after delete"
    )


async def async_print_local_file(
    coordinator: AnycubicCoordinator, filename: str
) -> None:
    """Order 1 for a file in the printer's storage, cloud only (§4.4)."""
    printer = _printer(coordinator)
    if printer.work_status == WORK_BUSY or printer.job_in_progress:
        raise ServiceValidationError(
            translation_domain=DOMAIN, translation_key="printer_busy"
        )
    printer_id = coordinator.printer_id
    await async_cloud_order(
        coordinator,
        lambda account: _client(account).start_print_printer_file(
            printer_id, filename, FileSource.LOCAL
        ),
    )


def _running_job(coordinator: AnycubicCoordinator) -> int:
    """Checked in this order (BEHAVIOUR §4.6)."""
    printer = _printer(coordinator)
    if printer.work_status != WORK_BUSY:
        raise ServiceValidationError(
            translation_domain=DOMAIN, translation_key="printer_not_busy"
        )
    if printer.job is None or printer.job_task_id is None:
        raise ServiceValidationError(
            translation_domain=DOMAIN, translation_key="no_job"
        )
    if not printer.job_in_progress:
        raise ServiceValidationError(
            translation_domain=DOMAIN, translation_key="job_not_in_progress"
        )
    return printer.job_task_id


async def async_set_speed_mode(coordinator: AnycubicCoordinator, mode: int) -> None:
    """Order 6 with a mode code the cloud lists for the job (§1.5, §4.6).

    LAN publishes no list of modes, so this always refuses there.
    """
    job_id = _running_job(coordinator)
    printer = _printer(coordinator)
    if mode not in {option["mode"] for option in printer.speed_modes}:
        raise ServiceValidationError(
            translation_domain=DOMAIN, translation_key="speed_mode_unavailable"
        )
    printer_id = coordinator.printer_id
    await async_cloud_order(
        coordinator,
        lambda account: _client(account).set_print_settings(
            printer_id, job_id, {"print_speed_mode": mode}
        ),
        refresh=False,
    )


async def async_set_resin_setting(
    coordinator: AnycubicCoordinator, key: str, value: float
) -> None:
    """Order 6 for a resin job's setting, cloud only (§4.6). No refresh."""
    job_id = _running_job(coordinator)
    printer_id = coordinator.printer_id
    number: int | float = int(value) if key == "bottom_layers" else value
    await async_cloud_order(
        coordinator,
        lambda account: _client(account).set_print_settings(
            printer_id, job_id, {key: number}
        ),
        refresh=False,
    )


async def async_install_firmware(
    coordinator: AnycubicCoordinator, box: int | None
) -> None:
    """Ask the cloud to update the printer (``box`` None) or an ACE, only when
    it flags an update as available (§2.17). Wakes the cloud MQTT so the
    progress can arrive."""
    printer = _printer(coordinator)
    cloud = printer.cloud
    detail = cloud.detail if cloud is not None else None
    if detail is None:
        return
    if box is None:
        await async_cloud_order(
            coordinator,
            lambda account: _client(account).update_printer_firmware(detail),
            wake=True,
        )
        return
    await async_cloud_order(
        coordinator,
        lambda account: _client(account).update_ace_firmware(detail, box),
        wake=True,
    )
