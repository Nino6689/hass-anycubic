"""Applying what the cloud says to a printer (BEHAVIOUR §1-§2, PROTOCOL C §6.13).

Pure functions over :class:`~.model.Printer`: the HTTP printer record and job
of each cloud poll, and each pushed cloud MQTT message. Both write the same
printer; the last writer wins. No I/O happens here.
"""

from __future__ import annotations

from dataclasses import dataclass, replace
from typing import TYPE_CHECKING

from anycubic_cloud_client import (
    AxisMoveUpdate,
    FileListUpdate,
    FirmwareReport,
    OnlineUpdate,
    PrintUpdate,
    WorkStatusUpdate,
)
from anycubic_lan import Job, PrintStatus

from .model import (
    DEVICE_OFFLINE,
    DEVICE_ONLINE,
    WORK_BUSY,
    WORK_FREE,
    CloudData,
    ace_box_from_cloud,
    lan_job_from_cloud,
    merge_cloud_job,
)

if TYPE_CHECKING:
    from anycubic_cloud_client import (
        CloudMessage,
        Job as CloudJob,
        JobDetail,
        PrinterDetail,
    )

    from .model import Printer


@dataclass(slots=True)
class MessageOutcome:
    """What a pushed message changed that the coordinator acts on."""

    print_started: bool = False
    """The printer went from free to busy: refresh 5 s later (§5.1)."""


def ensure_cloud(printer: Printer) -> CloudData:
    if printer.cloud is None:
        printer.cloud = CloudData()
    return printer.cloud


def apply_detail(printer: Printer, detail: PrinterDetail) -> None:
    """One poll's printer record (E6): online/busy, temperatures, the ACE list
    (wholesale), the external holder and firmware (PROTOCOL C §6.13)."""
    cloud = ensure_cloud(printer)
    cloud.detail = detail
    cloud.removed = False
    cloud.device_status = detail.device_status
    cloud.work_status = detail.is_printing
    identity = printer.identity
    if detail.name:
        identity.name = detail.name
    if detail.model:
        identity.model_name = detail.model
    if detail.machine_type is not None:
        identity.model_id = detail.machine_type
    if detail.base.material_type:
        identity.material_type = detail.base.material_type
    if detail.key:
        identity.key = detail.key
    state = printer.state
    temperatures = state.temperatures
    if detail.nozzle_temp is not None:
        temperatures = replace(temperatures, nozzle=detail.nozzle_temp)
    if detail.hotbed_temp is not None:
        temperatures = replace(temperatures, bed=detail.hotbed_temp)
    changes: dict[str, object] = {"temperatures": temperatures}
    if detail.raw.get("multi_color_box") is not None:
        cloud.ace_units = detail.ace_units
        changes["ace_boxes"] = tuple(ace_box_from_cloud(u) for u in detail.ace_units)
    if "external_shelves" in detail.raw:
        holder = detail.raw.get("external_shelves")
        changes["external_filament_box"] = (
            dict(holder) if isinstance(holder, dict) else None
        )
    printer.state = replace(state, **changes)  # type: ignore[arg-type]
    cloud.firmware.apply_cloud_record(detail.firmware)
    for index, info in enumerate(detail.ace_firmware):
        box = info.box_id if info.box_id is not None else index
        cloud.ace_progress(box).apply_cloud_record(info)


def apply_job(printer: Printer, job: CloudJob | None, detail: JobDetail | None) -> None:
    """The printer's latest job from the job list, with its detail (§1.3).

    Over the cloud the job stays after the print ends; a printer with no job
    in the list has none.
    """
    cloud = ensure_cloud(printer)
    cloud.job = job
    if job is None:
        cloud.job_detail = None
        cloud.target_nozzle = cloud.target_hotbed = None
        printer.state = replace(printer.state, job=None)
        return
    if detail is not None:
        cloud.job_detail = detail
        cloud.target_nozzle = _float(detail.target_nozzle_temp)
        cloud.target_hotbed = _float(detail.target_hotbed_temp)
        if detail.speed_modes:
            cloud.speed_modes = tuple(
                {"description": option.title, "mode": option.mode}
                for option in detail.speed_modes
            )
    cloud.failure_reason = job.reason
    new = lan_job_from_cloud(job, detail)
    printer.state = replace(
        printer.state, job=merge_cloud_job(printer.state.job, new, polled=True)
    )


def mark_removed(printer: Printer) -> None:
    """The cloud reports the printer deleted (code 1007, B8)."""
    ensure_cloud(printer).removed = True


def apply_message(printer: Printer, message: CloudMessage) -> MessageOutcome:
    """One pushed message; a fault code is recorded even if nothing else is
    understood (B35)."""
    cloud = ensure_cloud(printer)
    outcome = MessageOutcome()
    was_busy = cloud.work_status == WORK_BUSY
    had_status = cloud.work_status is not None
    cloud.record_code(message.kind, message.code, message.msg)
    if message.report is not None:
        printer.state = printer.state.apply(message.report)
    update = message.update
    if isinstance(update, OnlineUpdate):
        cloud.device_status = DEVICE_ONLINE if update.online else DEVICE_OFFLINE
    elif isinstance(update, WorkStatusUpdate):
        cloud.work_status = int(update.work_status)
    elif isinstance(update, PrintUpdate):
        _apply_print(printer, cloud, update)
    elif isinstance(update, AxisMoveUpdate):
        printer.axis_move_state = update.state
    elif isinstance(update, FileListUpdate):
        if update.records is not None:  # no list in the reply: keep the last
            cloud.file_lists[update.source.value] = update.records
    elif isinstance(update, FirmwareReport):
        progress = (
            cloud.ace_progress(update.box_index) if update.is_ace else cloud.firmware
        )
        progress.apply_report(update)
    # A transition from "unknown" does not count (PROTOCOL C §6.12).
    outcome.print_started = (
        had_status and not was_busy and cloud.work_status == WORK_BUSY
    )
    return outcome


def _apply_print(printer: Printer, cloud: CloudData, update: PrintUpdate) -> None:
    """A ``print`` report (BEHAVIOUR §1.1 table, PROTOCOL C §4.4)."""
    if update.work_status is not None:
        cloud.work_status = int(update.work_status)
    if update.download_progress is not None:
        cloud.download_progress = update.download_progress
    state = printer.state
    job_id = printer.job_task_id
    # Job fields only for the known job; a report for another task waits for
    # the next poll to bring that job in (G9).
    if update.applies_to(job_id):
        changes = update.job or Job()
        changes = replace(changes, task_id=None)
        if update.job_status is not None:
            status = PrintStatus(int(update.job_status))
            changes = replace(changes, print_status=status, print_status_raw=status)
        if update.pause is not None:
            changes = replace(changes, pause=bool(update.pause))
        state = replace(state, job=merge_cloud_job(state.job, changes, polled=False))
        if update.failure_reason:
            cloud.failure_reason = update.failure_reason
        if update.target_nozzle_temp is not None:
            cloud.target_nozzle = _float(update.target_nozzle_temp)
        if update.target_hotbed_temp is not None:
            cloud.target_hotbed = _float(update.target_hotbed_temp)
    if update.nozzle_temp is not None and update.hotbed_temp is not None:
        state = replace(
            state,
            temperatures=replace(
                state.temperatures, nozzle=update.nozzle_temp, bed=update.hotbed_temp
            ),
        )
    if update.fan_speed_pct is not None:
        state = replace(
            state, fans=replace(state.fans, fan_speed_pct=update.fan_speed_pct)
        )
    if update.print_speed_mode is not None:
        state = replace(state, speed_mode_raw=update.print_speed_mode)
    if update.print_speed_pct is not None:
        printer.print_speed_pct = round(update.print_speed_pct)
    printer.state = state


def _float(value: float | None) -> float | None:
    return float(value) if value is not None else None


__all__ = [
    "WORK_FREE",
    "MessageOutcome",
    "apply_detail",
    "apply_job",
    "apply_message",
    "ensure_cloud",
    "mark_removed",
]
