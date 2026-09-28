"""The integration's view of one printer.

Over LAN everything is a reading of anycubic-lan's merged ``PrinterState``
plus the few facts it does not keep (the axis move state, whether an ``info``
report has arrived). Over the cloud the same ``PrinterState`` holds what the
cloud MQTT reports share with LAN (anycubic-cloud-client parses those bodies
with anycubic-lan), and :class:`CloudData` holds what only the cloud knows:
the HTTP printer record, the job list and job detail, file lists, firmware
and lifetime totals. The rules are BEHAVIOUR §1 and §2.
"""

from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass, field, replace
from typing import TYPE_CHECKING, Any, Literal

from anycubic_cloud_client import FirmwareProgress
from anycubic_lan import (
    AceBox,
    AceDrying,
    AceSlot,
    Job,
    PrinterState,
    PrintStatus,
    ReportCode,
)

from .const import (
    ACE_MODEL_DEFAULT,
    ACE_MODEL_NAMES,
    CAMERA_PORT,
    FUNCTION_ID_MULTI_COLOR_BOX,
    FUNCTION_NAMES,
)
from .error_codes import describe_error
from .filament import rgb_to_hex

if TYPE_CHECKING:
    from anycubic_cloud_client import (
        AceSlotInfo,
        AceUnit,
        Job as CloudJob,
        JobDetail,
        PrinterDetail,
        PrinterFile,
    )

type Source = Literal["lan", "cloud"]

MATERIAL_FILAMENT = "Filament"
MATERIAL_RESIN = "Resin"

# Device status (BEHAVIOUR §1.1).
DEVICE_ONLINE = 1
DEVICE_OFFLINE = 2
# Work status (BEHAVIOUR §1.1).
WORK_FREE = 1
WORK_BUSY = 2

# Job status codes that mean "in progress" (BEHAVIOUR §1.3).
_IN_PROGRESS = frozenset({1, 4, 5, 6})
_OVER = frozenset({2, 3})
# Text phases that mean a job with an unlisted code is over (BEHAVIOUR §1.3).
_OVER_PHASES = frozenset(
    {
        "cancelled",
        "canceled",
        "complete",
        "completed",
        "failed",
        "finished",
        "free",
        "idle",
        "stopped",
    }
)
_JOB_STATE_TEXT: Mapping[int, str] = {
    1: "printing",
    2: "finished",
    3: "failed",
    4: "downloading",
    5: "checking",
    6: "preheating",
    7: "slicing",
    9: "levelling",
}

# ACE slot facts (BEHAVIOUR §1.9).
SLOT_EDIT_EMPTY = 2
SLOT_STATUS_LOADED = 5

# Axis move states (BEHAVIOUR §1.8).
AXIS_DONE = "done"
AXIS_FAILED = "failed"


def material_type_from_device_type(device_type: str | None) -> str | None:
    """``fdm`` → Filament; ``lcd``/``dlp``/``resin`` → Resin (BEHAVIOUR §1.7)."""
    if not device_type:
        return None
    lowered = device_type.lower()
    if lowered == "fdm":
        return MATERIAL_FILAMENT
    if lowered in ("lcd", "dlp", "resin"):
        return MATERIAL_RESIN
    return device_type


def ace_model_name(model_id: int | None) -> str:
    """Device model of an ACE unit (COMPAT §2; DECISIONS round 2, Q2.3).

    ``40001`` is the ACE Pro; any other or unknown id is the generic ACE.
    """
    if model_id is None:
        return ACE_MODEL_DEFAULT
    return ACE_MODEL_NAMES.get(model_id, ACE_MODEL_DEFAULT)


def print_speed_pct(action: str | None, state: str | None, data: object) -> int | None:
    """The speed % a ``print`` report carries, if any (round 2, Q2.2).

    Only ``start``/``update`` reports in state ``updated`` carry it, under
    ``data.settings.print_speed_pct``.
    """
    if action not in ("start", "update") or state != "updated":
        return None
    if not isinstance(data, Mapping):
        return None
    settings = data.get("settings")
    if not isinstance(settings, Mapping):
        return None
    value = settings.get("print_speed_pct")
    if isinstance(value, bool) or not isinstance(value, int | float):
        return None
    return round(value)


def _number(value: float | None) -> float | None:
    return float(value) if value is not None else None


def _whole(value: float | None) -> int | None:
    return round(value) if value is not None else None


@dataclass(slots=True)
class PrinterIdentity:
    """Who the printer is. Fixed for the life of a config entry's setup."""

    printer_id: int
    mac: str
    """Upper-case, hyphen-separated, as used in unique ids (COMPAT §3)."""
    name: str
    model_name: str
    model_id: int
    material_type: str | None
    host: str
    serial: str | None = None
    connection_mac: str | None = None
    """``aa:bb:cc:dd:ee:ff`` for the device registry connection, if known."""
    key: str | None = field(default=None, repr=False)
    """The cloud's printer key (cloud MQTT topics); never logged."""


def lan_job_from_cloud(job: CloudJob, detail: JobDetail | None) -> Job:
    """The cloud job-list record in the job shape the rest of the model reads.

    The job id is the task id pushed reports carry (PROTOCOL B §3.1); the
    layer counters, extruded length and text phase live in its ``settings``.
    """
    settings = job.settings
    return Job(
        task_id=job.id,
        filename=job.gcode_name,
        progress=job.progress,
        current_layer=settings.curr_layer if settings else None,
        total_layers=settings.total_layers if settings else None,
        print_time=job.print_time,
        remain_time=job.remain_time,
        supplies_usage=settings.supplies_usage if settings else None,
        pause=bool(job.pause) if job.pause is not None else None,
        state=settings.state if settings else None,
        print_status=PrintStatus.from_raw(job.print_status),
        print_status_raw=job.print_status,
        speed_mode_raw=detail.print_speed_mode if detail is not None else None,
    )


_TERMINAL = (PrintStatus.COMPLETE, PrintStatus.CANCELLED)


def merge_cloud_job(previous: Job | None, new: Job, *, polled: bool) -> Job:
    """Merge a job from the cloud into the known one (BEHAVIOUR §1.3).

    A new task id replaces the job; the same one is updated field by field,
    so a status of 0 keeps the previous status. Once the job has reached
    complete or cancelled, a later poll of the same job does not move it
    back (``polled``); a pushed report can.
    """
    if previous is None or (
        new.task_id is not None
        and previous.task_id is not None
        and new.task_id != previous.task_id
    ):
        return new
    changes = {
        name: value
        for name in Job.__dataclass_fields__
        if (value := getattr(new, name)) is not None
    }
    if polled and previous.print_status in _TERMINAL:
        changes.pop("print_status", None)
        changes.pop("print_status_raw", None)
    return replace(previous, **changes)


def ace_box_from_cloud(unit: AceUnit) -> AceBox:
    """A cloud ACE unit in the box shape the rest of the model reads."""
    drying = unit.drying
    return AceBox(
        id=unit.id,
        status=unit.status,
        model_id=unit.model_id,
        auto_feed=unit.auto_feed,
        loaded_slot_raw=unit.loaded_slot_raw,
        temp=unit.temp,
        drying=AceDrying(
            status=drying.status,
            target_temp=drying.target_temp,
            duration=drying.duration,
            remain_time=drying.remain_time,
        ),
        slots=tuple(
            AceSlot(
                index=slot.index,
                material=slot.material,
                color=slot.color,
                sku=slot.sku,
                status=slot.status,
                edit_status=slot.edit_status,
            )
            for slot in unit.slots
        ),
    )


@dataclass(slots=True)
class CloudData:
    """What only the cloud knows about a printer (BEHAVIOUR §2, PROTOCOL C §6.13).

    HTTP polls rewrite the record, the job and the ACE list; pushed reports
    update them between polls. The last writer wins.
    """

    detail: PrinterDetail | None = None
    device_status: int | None = None
    work_status: int | None = None
    job: CloudJob | None = None
    job_detail: JobDetail | None = None
    speed_modes: tuple[dict[str, Any], ...] = ()
    """``{description, mode}`` pairs; the list survives the job (§2.14)."""
    target_nozzle: float | None = None
    """The job's targets: job detail, updated by pushed reports (§2.2)."""
    target_hotbed: float | None = None
    download_progress: int | None = None
    failure_reason: str | None = None
    removed: bool = False
    """The cloud reports the printer deleted (code 1007; LAN Mode, B8)."""
    ace_units: tuple[AceUnit, ...] = ()
    file_lists: dict[str, tuple[PrinterFile, ...]] = field(default_factory=dict)
    firmware: FirmwareProgress = field(default_factory=FirmwareProgress)
    ace_firmware: dict[int, FirmwareProgress] = field(default_factory=dict)
    faults: dict[str, ReportCode] = field(default_factory=dict)
    """Open fault codes per report kind, oldest first (DECISIONS V10)."""

    def record_code(self, kind: str, code: int | None, message: str | None) -> None:
        """A non-OK code opens a fault; the next OK code of that kind clears it."""
        if code is None:
            return
        self.faults.pop(kind, None)
        if code not in (0, 200):
            self.faults[kind] = ReportCode(kind, code, message)

    def ace_slot_info(self, box: int, index: int) -> AceSlotInfo | None:
        for unit in self.ace_units:
            if unit.id == box:
                return unit.slot(index)
        return None

    def ace_unit(self, box: int) -> AceUnit | None:
        for unit in self.ace_units:
            if unit.id == box:
                return unit
        return None

    def ace_progress(self, box: int) -> FirmwareProgress:
        progress = self.ace_firmware.get(box)
        if progress is None:
            progress = self.ace_firmware[box] = FirmwareProgress()
        return progress


@dataclass(slots=True)
class ExternalSpool:
    """The external filament holder (BEHAVIOUR §2.7)."""

    material: str | None
    color: list[int] | None
    loaded: bool


@dataclass(slots=True)
class Printer:
    """Live readings of one printer."""

    identity: PrinterIdentity
    state: PrinterState = field(default_factory=PrinterState)
    info_seen: bool = False
    axis_move_state: str | None = None
    print_speed_pct: int | None = None
    """From ``print`` reports' ``data.settings`` (PROTOCOL §7.2, round 2 Q2.2)."""
    remembered_light_types: frozenset[int] = frozenset()
    source: Source = "lan"
    """Which connection the readings come from now (BEHAVIOUR §5.4)."""
    cloud: CloudData | None = None
    """Present on printers of an entry with an Anycubic account."""

    # -- identity ----------------------------------------------------------

    @property
    def printer_id(self) -> int:
        return self.identity.printer_id

    @property
    def is_filament(self) -> bool:
        return self.identity.material_type == MATERIAL_FILAMENT

    @property
    def via_cloud(self) -> bool:
        return self.source == "cloud" and self.cloud is not None

    def _cloud(self) -> CloudData | None:
        return self.cloud if self.source == "cloud" else None

    # -- online / busy (BEHAVIOUR §1.1, §1.2) -------------------------------

    @property
    def device_status(self) -> int | None:
        """Cloud: the record, updated by pushed reports. LAN: 1 once any
        ``info`` report arrived; LAN never reports offline."""
        if (cloud := self._cloud()) is not None:
            return cloud.device_status
        return DEVICE_ONLINE if self.info_seen else None

    @property
    def is_online(self) -> bool:
        return self.device_status == DEVICE_ONLINE

    @property
    def work_status(self) -> int:
        """``free`` → 1, ``busy`` → 2; free when nothing has been said."""
        if (cloud := self._cloud()) is not None:
            return WORK_BUSY if cloud.work_status == WORK_BUSY else WORK_FREE
        raw = self.state.printer_state
        if raw == "busy":
            return WORK_BUSY
        if raw is None or raw == "free":
            return WORK_FREE
        # An unknown word: busy while a job runs, else free.
        return WORK_BUSY if self.job_in_progress else WORK_FREE

    @property
    def is_moving(self) -> bool:
        state = self.axis_move_state
        return state is not None and state not in (AXIS_DONE, AXIS_FAILED)

    @property
    def axis_move_failed(self) -> bool:
        return self.axis_move_state == AXIS_FAILED

    @property
    def current_status(self) -> str:
        if self.is_moving:
            return "moving"
        if self.work_status == WORK_BUSY:
            return "busy"
        if self.work_status == WORK_FREE:
            return "available"
        return "unknown"  # pragma: no cover - work_status is always 1 or 2

    # -- the job (BEHAVIOUR §1.3) ------------------------------------------

    @property
    def job(self) -> Job | None:
        return self.state.job

    @property
    def job_status_code(self) -> int | None:
        """The job's status number; 0 and unknown values keep the previous one."""
        job = self.job
        if job is None or job.print_status is None:
            return None
        return int(job.print_status)

    @property
    def job_in_progress(self) -> bool:
        job = self.job
        if job is None:
            return False
        code = self.job_status_code
        if code in _IN_PROGRESS:
            return True
        if code in _OVER:
            return False
        phase = (job.state or "").strip().lower()
        if not phase:
            return False
        return phase not in _OVER_PHASES

    @property
    def job_is_paused(self) -> bool:
        job = self.job
        return job is not None and bool(job.pause) and self.job_in_progress

    @property
    def job_complete(self) -> bool:
        return self.job_status_code == PrintStatus.COMPLETE

    @property
    def job_failed(self) -> bool:
        return self.job_status_code == PrintStatus.CANCELLED

    @property
    def job_state(self) -> str | None:
        job = self.job
        if job is None:
            # B9: an online printer with no job is idle, not unavailable.
            return "idle" if self.is_online else None
        if self.job_is_paused:
            return "paused"
        code = self.job_status_code
        if code is not None and code in _JOB_STATE_TEXT:
            return _JOB_STATE_TEXT[code]
        return job.state or "unknown"

    @property
    def job_name(self) -> str | None:
        """LAN: file name without folders and extension (G13). Cloud: the
        job's file name without a trailing ``.gcode`` (BEHAVIOUR §2.3)."""
        job = self.job
        if job is None:
            return None
        if self._cloud() is not None:
            return job.filename.removesuffix(".gcode") if job.filename else None
        return job.name

    @property
    def job_filament_used(self) -> float | None:
        """Millimetres extruded so far by this job (DECISIONS V1)."""
        job = self.job
        return _number(job.supplies_usage) if job is not None else None

    @property
    def job_task_id(self) -> int | None:
        job = self.job
        return job.task_id if job is not None else None

    @property
    def job_progress(self) -> int | None:
        job = self.job
        return _whole(job.progress) if job is not None else None

    @property
    def job_remaining_minutes(self) -> int | None:
        job = self.job
        return _whole(job.remain_time) if job is not None else None

    @property
    def job_elapsed_minutes(self) -> int | None:
        job = self.job
        return _whole(job.print_time) if job is not None else None

    # -- temperatures, fans, speed (BEHAVIOUR §2.2) --------------------------

    @property
    def nozzle_temperature(self) -> float | None:
        return _number(self.state.temperatures.nozzle)

    @property
    def hotbed_temperature(self) -> float | None:
        return _number(self.state.temperatures.bed)

    @property
    def target_nozzle_temperature(self) -> float | None:
        """The job's target when it carries one, else the printer's own."""
        cloud = self._cloud()
        if cloud is not None and cloud.target_nozzle is not None:
            return _number(cloud.target_nozzle)
        return _number(self.state.temperatures.nozzle_target)

    @property
    def target_hotbed_temperature(self) -> float | None:
        cloud = self._cloud()
        if cloud is not None and cloud.target_hotbed is not None:
            return _number(cloud.target_hotbed)
        return _number(self.state.temperatures.bed_target)

    def target_limits(self, which: str) -> tuple[float, float] | None:
        """``[min, max]`` from the cloud job detail (null on LAN)."""
        cloud = self._cloud()
        detail = cloud.job_detail if cloud is not None else None
        if detail is None:
            return None
        pair = detail.limits.nozzle if which == "nozzle" else detail.limits.hotbed
        return (float(pair[0]), float(pair[1])) if pair is not None else None

    @property
    def print_speed(self) -> int | None:
        """The printer's own reading, falling back to the job's (B14)."""
        if self.print_speed_pct is not None:
            return self.print_speed_pct
        cloud = self._cloud()
        detail = cloud.job_detail if cloud is not None else None
        if detail is not None and detail.print_speed_pct is not None:
            return round(detail.print_speed_pct)
        return None

    @property
    def fan_speed(self) -> int | None:
        return _whole(self.state.fans.fan_speed_pct)

    @property
    def aux_fan_speed(self) -> int | None:
        return _whole(self.state.fans.aux_fan_speed_pct)

    @property
    def box_fan_level(self) -> int | None:
        return self.state.fans.box_fan_level

    @property
    def speed_mode_code(self) -> int | None:
        """The printer's reported mode, else the job's (BEHAVIOUR §1.5)."""
        if self.state.speed_mode_raw is not None:
            return self.state.speed_mode_raw
        job = self.job
        return job.speed_mode_raw if job is not None else None

    @property
    def speed_modes(self) -> list[dict[str, Any]]:
        """``{description, mode}`` pairs. Cloud only: always empty on LAN."""
        cloud = self._cloud()
        return [dict(mode) for mode in cloud.speed_modes] if cloud is not None else []

    @property
    def job_speed_mode(self) -> str | None:
        code = self.speed_mode_code
        if code is None:
            return None
        for mode in self.speed_modes:
            if mode["mode"] == code:
                return str(mode["description"])
        return str(code)

    # -- errors (BEHAVIOUR §1.4, DECISIONS V10) -----------------------------

    @property
    def last_error_code(self) -> int | None:
        # A kind's code clears on its next OK code, on both transports (V10).
        if (cloud := self._cloud()) is not None:
            faults = list(cloud.faults.values())
            return faults[-1].code if faults else None
        return self.state.last_error_code

    @property
    def last_error(self) -> str | None:
        code = self.last_error_code
        return describe_error(code) if code is not None else None

    # -- head position (BEHAVIOUR §2.6) -------------------------------------

    def axis_position(self, axis: str) -> float | None:
        position = self.state.position
        if position is None:
            return None
        return _number(getattr(position, axis))

    # -- light (BEHAVIOUR §2.16, §3.13) -------------------------------------

    @property
    def light_types(self) -> set[int]:
        live = {light.type for light in self.state.lights if light.type is not None}
        return live | set(self.remembered_light_types)

    @property
    def has_light(self) -> bool:
        return bool(self.light_types)

    @property
    def light_type(self) -> int | None:
        """The lowest light type reported now or remembered (G6)."""
        types = self.light_types
        return min(types) if types else None

    @property
    def light_on(self) -> bool | None:
        light_type = self.light_type
        for light in self.state.lights:
            if light.type == light_type:
                return light.on
        return None

    # -- AI detection (BEHAVIOUR §2.15) --------------------------------------

    @property
    def ai_detection_enabled(self) -> bool | None:
        settings = self.state.ai_settings
        if settings is None or settings.status is None:
            return None
        return settings.status != 0

    # -- firmware (BEHAVIOUR §2.17, G10) --------------------------------------

    @property
    def firmware_version(self) -> str | None:
        if (cloud := self._cloud()) is not None:
            return cloud.firmware.installed_version
        return self.state.firmware_version

    # -- lifetime totals (BEHAVIOUR §2.4, cloud only) --------------------------

    @property
    def _base(self) -> Any:
        cloud = self.cloud
        detail = cloud.detail if cloud is not None else None
        return detail.base if detail is not None else None

    @property
    def material_used_kg(self) -> float | None:
        base = self._base
        return base.material_used_kg if base is not None else None

    @property
    def material_used_text(self) -> str | None:
        cloud = self.cloud
        detail = cloud.detail if cloud is not None else None
        if detail is None:
            return None
        raw = detail.raw.get("base")
        value = raw.get("material_used") if isinstance(raw, Mapping) else None
        return value if isinstance(value, str) else None

    @property
    def print_time_total_minutes(self) -> int | None:
        base = self._base
        minutes = base.print_totaltime_minutes if base is not None else None
        return int(minutes) if minutes is not None else None

    @property
    def print_count_total(self) -> int | None:
        base = self._base
        return base.print_count if base is not None else None

    # -- the cloud job's extras (BEHAVIOUR §2.3, §2.11) ------------------------

    @property
    def cloud_job(self) -> CloudJob | None:
        cloud = self._cloud()
        if cloud is None or cloud.job is None or self.job is None:
            return None
        return cloud.job if cloud.job.id == self.job_task_id else None

    @property
    def job_paint_shares(self) -> dict[int, float]:
        """The cloud job's split between colours (BEHAVIOUR §3.5 step 3).

        ``filament_used`` summed per ``paint_index`` from the slice data,
        non-positive entries ignored, as shares summing to 1. LAN jobs carry
        no breakdown.
        """
        job = self.cloud_job
        infos = job.slice_param.paint_infos if job and job.slice_param else ()
        grams: dict[int, float] = {}
        for info in infos:
            used = info.filament_used
            if used is None or used <= 0 or info.paint_index < 0:
                continue
            grams[info.paint_index] = grams.get(info.paint_index, 0.0) + float(used)
        total = sum(grams.values())
        return {index: value / total for index, value in grams.items()} if total else {}

    @property
    def job_image_url(self) -> str | None:
        job = self.cloud_job
        return job.image_url if job is not None else None

    @property
    def job_z_thick(self) -> float | None:
        cloud = self._cloud()
        detail = cloud.job_detail if cloud is not None else None
        if detail is None or self.cloud_job is None:
            return None
        return _number(detail.z_thick)

    @property
    def job_end_time(self) -> int | None:
        job = self.cloud_job
        if job is None or not job.end_time or job.end_time <= 0:
            return None
        return job.end_time

    def resin_setting(self, name: str) -> Any:
        """A resin job value: ``model_hight``/``anti_count`` sit in the job's
        settings, the exposure values in its nested ``settings`` (B §3.1.1)."""
        job = self.cloud_job
        settings = job.settings if job is not None else None
        if settings is None:
            return None
        raw = settings.raw
        if name in ("model_hight", "anti_count"):
            return raw.get(name)
        nested = raw.get("settings")
        return nested.get(name) if isinstance(nested, Mapping) else None

    @property
    def download_progress(self) -> int | None:
        cloud = self._cloud()
        return cloud.download_progress if cloud is not None else None

    # -- camera (BEHAVIOUR §2.18) -------------------------------------------

    @property
    def camera_url(self) -> str:
        """The URL the printer named, else the default on the configured host."""
        return self.state.camera_url or f"http://{self.identity.host}:{CAMERA_PORT}/flv"

    @property
    def peripherals(self) -> dict[str, bool | None]:
        peripherals = self.state.peripherals
        if peripherals is None:
            return {"camera": None, "ace": None, "usb_disk": None}
        return {
            "camera": peripherals.camera,
            "ace": peripherals.ace,
            "usb_disk": peripherals.usb_disk,
        }

    # -- external holder (BEHAVIOUR §2.7) -----------------------------------

    @property
    def external_spool(self) -> ExternalSpool | None:
        """The holder, or ``None`` when absent.

        Keys as confirmed in DECISIONS round 2, Q3 (``id``, ``type``,
        ``color``, ``loaded``; PROTOCOL §7.2); ``material`` and
        ``external_shelves`` are also accepted.
        """
        raw = self.state.external_filament_box
        if raw is None:
            return None
        block: Mapping[str, Any] = raw
        nested = raw.get("external_shelves")
        if isinstance(nested, Mapping):
            block = nested
        box_id = block.get("id")
        material = block.get("type")
        if not isinstance(material, str) or not material.strip():
            material = block.get("material")
        material = material.strip() if isinstance(material, str) else None
        loaded_raw = block.get("loaded")
        if box_id is None and not material and loaded_raw is None:
            return None  # B34: an all-null block means no holder
        color = block.get("color")
        color_list = (
            list(color)
            if isinstance(color, list) and rgb_to_hex(color) is not None
            else None
        )
        return ExternalSpool(
            material=material or None,
            color=color_list,
            loaded=bool(loaded_raw) and not isinstance(loaded_raw, str),
        )

    # -- ACE (BEHAVIOUR §1.9, §2.8, §2.9) -----------------------------------

    @property
    def ace_count(self) -> int:
        return len(self.state.ace_boxes)

    @property
    def function_ids(self) -> tuple[int, ...]:
        cloud = self.cloud
        detail = cloud.detail if cloud is not None else None
        return detail.type_function_ids if detail is not None else ()

    @property
    def supported_functions(self) -> list[str]:
        """Names of the cloud's function ids; unknown ids left out (§2.14)."""
        return [FUNCTION_NAMES[i] for i in self.function_ids if i in FUNCTION_NAMES]

    @property
    def supports_ace(self) -> bool:
        """Function 2006 in the cloud's list, or an ACE has reported (§1.7)."""
        return FUNCTION_ID_MULTI_COLOR_BOX in self.function_ids or self.ace_count > 0

    def ace_box(self, index: int) -> AceBox | None:
        """The ACE with ``id`` == ``index``, else the one in that position."""
        boxes = self.state.ace_boxes
        for box in boxes:
            if box.id == index:
                return box
        if 0 <= index < len(boxes) and boxes[index].id is None:
            return boxes[index]
        return None

    def ace_loaded_slot_index(self, index: int) -> int | None:
        """0-based slot feeding the printer.

        First ACE only: when ``loaded_slot`` reads -1, the slot whose own
        status is 5 is taken instead (B15). The second ACE has no fallback.
        """
        box = self.ace_box(index)
        if box is None:
            return None
        if index == 0:
            return box.loaded_slot
        raw = box.loaded_slot_raw
        return raw if raw is not None and raw >= 0 else None

    def ace_slot(self, index: int, slot_number: int) -> AceSlot | None:
        """Slot ``slot_number`` (1-based) of ACE ``index``."""
        box = self.ace_box(index)
        if box is None:
            return None
        for position, slot in enumerate(box.slots):
            slot_index = slot.index if slot.index is not None else position
            if slot_index == slot_number - 1:
                return slot
        return None

    @staticmethod
    def slot_is_empty(slot: AceSlot | None) -> bool:
        return slot is None or slot.edit_status == SLOT_EDIT_EMPTY

    def ace_temperature(self, index: int) -> int:
        box = self.ace_box(index)
        if box is None or box.temp is None:
            return 0
        return round(box.temp)

    def ace_model(self, index: int) -> str:
        box = self.ace_box(index)
        return ace_model_name(box.model_id if box is not None else None)

    def drying_value(self, index: int, name: str) -> float:
        """Drying figure; 0 when not drying or unreported (BEHAVIOUR §1.9)."""
        box = self.ace_box(index)
        drying = box.drying if box is not None else None
        if drying is None or not drying.is_drying:
            return 0
        value = getattr(drying, name)
        return value if value is not None else 0

    def drying_status_code(self, index: int) -> int | None:
        box = self.ace_box(index)
        drying = box.drying if box is not None else None
        return drying.status if drying is not None else None

    def is_drying(self, index: int) -> bool:
        return self.drying_status_code(index) == 1

    def ace_auto_feed(self, index: int) -> bool:
        box = self.ace_box(index)
        return bool(box.auto_feed) if box is not None else False

    def cloud_slot(
        self, index: int, slot: AceSlot, position: int
    ) -> AceSlotInfo | None:
        """The cloud's fuller record of a slot (colour group, icon, remaining)."""
        cloud = self._cloud()
        if cloud is None:
            return None
        slot_index = slot.index if slot.index is not None else position
        return cloud.ace_slot_info(index, slot_index)

    def slot_attributes(
        self, index: int, slot: AceSlot, position: int
    ) -> dict[str, Any]:
        return slot_attributes(slot, position, self.cloud_slot(index, slot, position))

    def spool_info(self, index: int) -> list[dict[str, Any]]:
        box = self.ace_box(index)
        if box is None:
            return []
        return [
            self.slot_attributes(index, slot, position)
            | {"material_type": slot.material}
            for position, slot in enumerate(box.slots)
        ]

    def box_info(self, index: int) -> dict[str, Any] | None:
        box = self.ace_box(index)
        if box is None:
            return None
        loaded = self.ace_loaded_slot_index(index)
        cloud = self._cloud()
        unit = cloud.ace_unit(index) if cloud is not None else None
        feed_status: Any = box.feed_status
        humidity: Any = 0
        if unit is not None:
            feed = unit.feed_status
            feed_status = {
                "code": feed.code,
                "type": feed.type,
                "current_status": feed.current_status,
                "slot": feed.slot_index + 1 if feed.slot_index >= 0 else None,
            }
            humidity = unit.humidity if unit.humidity is not None else 0
        return {
            "box_id": box.id,
            "model_id": box.model_id,
            "status": box.status,
            "temperature": box.temp,
            "humidity": humidity,
            "auto_feed": bool(box.auto_feed),
            "loaded_slot": loaded + 1 if loaded is not None else None,
            "feed_status": feed_status,
        }

    def ace_material(self, index: int, feeding_slot: int | None) -> str | None:
        """Material "in the ACE" for drying defaults (BEHAVIOUR §3.11, B11)."""
        loaded = self.ace_loaded_slot_index(index)
        if loaded is None and index == 0:
            loaded = feeding_slot
        if loaded is not None:
            slot = self.ace_slot(index, loaded + 1)
            if slot is not None and slot.material:
                return slot.material
        box = self.ace_box(index)
        for slot in box.slots if box is not None else ():
            if not self.slot_is_empty(slot) and slot.material:
                return slot.material
        return None


def slot_attributes(
    slot: AceSlot, position: int, cloud: AceSlotInfo | None = None
) -> dict[str, Any]:
    """Attributes of an ACE slot (BEHAVIOUR §2.8).

    The cloud's record adds the colour group of a multi-colour reel, the
    icon type and Anycubic's remaining figure; LAN reports carry none of them.
    """
    color = list(slot.color) if slot.color is not None else None
    color_hex = rgb_to_hex(slot.color)
    slot_index = slot.index if slot.index is not None else position
    group: list[list[int]] = [[*color, 255]] if color is not None else []
    colors_hex = [color_hex] if color_hex else []
    icon_type: int | None = None
    consumables: Any = None
    if cloud is not None:
        if cloud.color_group:
            group = [list(entry) for entry in cloud.color_group]
            colors_hex = [
                hex_value
                for entry in cloud.color_group
                if (hex_value := rgb_to_hex(list(entry[:3]))) is not None
            ]
        icon_type = cloud.icon_type
        consumables = cloud.consumables_percent
    return {
        "slot": slot_index + 1,
        "color": color,
        "color_hex": color_hex,
        "colors_hex": colors_hex,
        "color_group": group,
        "is_multi_color": len(colors_hex) > 1,
        "sku": slot.sku or None,
        "status": slot.status,
        "spool_loaded": slot.status == SLOT_STATUS_LOADED,
        "edit_status": slot.edit_status,
        "icon_type": icon_type,
        "consumables_percent": consumables,
    }
