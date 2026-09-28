"""Sensors (BEHAVIOUR §2.1-§2.11)."""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import TYPE_CHECKING, Any

from homeassistant.components.sensor import (
    SensorDeviceClass,
    SensorEntity,
    SensorEntityDescription,
    SensorStateClass,
)
from homeassistant.const import (
    PERCENTAGE,
    EntityCategory,
    UnitOfLength,
    UnitOfMass,
    UnitOfTemperature,
    UnitOfTime,
)
from homeassistant.util import dt as dt_util

from .const import ACE_SLOTS
from .entity import (
    AnycubicEntity,
    AnycubicEntityDescription,
    Device,
    Kind,
    async_add_when_ready,
)
from .filament import rgb_to_hex
from .spool_image import spool_picture

if TYPE_CHECKING:
    from homeassistant.core import HomeAssistant
    from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

    from .coordinator import AnycubicConfigEntry, AnycubicCoordinator

# The unit text 2.x reported, capital L included (COMPAT §3 "State formats").
UNIT_LAYERS = "Layers"
UNIT_FILES = "files"

type ValueFn = Callable[[AnycubicCoordinator], Any]
type AttrsFn = Callable[[AnycubicCoordinator], dict[str, Any] | None]


@dataclass(frozen=True, kw_only=True)
class AnycubicSensorDescription(AnycubicEntityDescription, SensorEntityDescription):
    """A sensor reading one value of the printer."""

    value_fn: ValueFn
    attrs_fn: AttrsFn | None = None
    monetary: bool = False


def _whole(value: float | None) -> int | None:
    return round(value) if value is not None else None


def _minutes_dhm(minutes: int | None) -> str | None:
    if minutes is None:
        return None
    days, rest = divmod(minutes, 1440)
    hours, mins = divmod(rest, 60)
    return f"{days}:{hours}:{mins}"


def _job_eta(c: AnycubicCoordinator) -> datetime | None:
    """The job's finish time when it carries one, else now + remaining
    minutes, to the minute; no value at 0 minutes (BEHAVIOUR §1.6, G22)."""
    printer = c.printer
    if printer.job is None:
        return None
    if (end := printer.job_end_time) is not None:
        return dt_util.utc_from_timestamp(end)
    remaining = printer.job_remaining_minutes
    if not remaining:
        return None
    eta = dt_util.utcnow() + timedelta(minutes=remaining)
    return eta.replace(second=0, microsecond=0)


def _current_status_attrs(c: AnycubicCoordinator) -> dict[str, Any]:
    p = c.printer
    minutes = p.print_time_total_minutes
    return {
        "model": p.identity.model_name,
        "machine_type": p.identity.model_id,
        "supported_functions": p.supported_functions,
        "material_type": p.identity.material_type,
        "device_status_code": p.device_status,
        "is_printing_code": p.work_status,
        "print_status_code": p.job_status_code,
        "peripherals": p.peripherals,
        # Lifetime figures come from the cloud only (BEHAVIOUR §2.4).
        "total_material_used": p.material_used_text,
        "total_print_time_hrs": minutes // 60 if minutes is not None else None,
        "total_print_time_dhm": _minutes_dhm(minutes),
        "job_download_progress": p.download_progress,
    }


def _slicer_value(value: Any) -> Any:
    """Slicer values of -1 or empty are "not set" (PROTOCOL B §3.1.2)."""
    if value in (-1, "-1", "", None):
        return None
    return value


def _cloud_job_attrs(c: AnycubicCoordinator) -> dict[str, Any]:
    """The slicer details of a cloud job; only keys with a value (§2.3)."""
    job = c.printer.cloud_job
    if job is None:
        return {}
    slice_param = job.slice_param.raw if job.slice_param is not None else {}
    slice_result = job.slice_result or {}
    types = _slicer_value(slice_param.get("filament_type"))
    size = [slice_result.get(key) for key in ("size_x", "size_y", "size_z")]
    candidates: dict[str, Any] = {
        "source": job.source,
        "slicer": job.settings.slicer if job.settings is not None else None,
        "printer_profile": slice_param.get("printer_settings_id"),
        "layer_height": slice_param.get("layer_height"),
        "filament_types": (
            [part.strip() for part in str(types).split(";") if part.strip()]
            if types is not None
            else None
        ),
        "nozzle_temperature": slice_param.get("temperature"),
        "bed_temperature": slice_param.get("bed_temperature"),
        "fill_density": slice_param.get("fill_density"),
        "travel_speed": slice_param.get("travel_speed"),
        "brim_type": slice_param.get("brim_type"),
        "model_size_mm": size if all(v is not None for v in size) else None,
        "estimated_filament": slice_result.get("used_filament"),
    }
    return {
        key: value
        for key, value in candidates.items()
        if _slicer_value(value) is not None
    }


def _job_name_attrs(c: AnycubicCoordinator) -> dict[str, Any]:
    p = c.printer
    job = p.job
    elapsed = p.job_elapsed_minutes
    remaining = p.job_remaining_minutes
    cloud_job = p.cloud_job
    total: int | None = None
    total_text: str | None = None
    if cloud_job is not None and cloud_job.total_time_minutes is not None:
        total = int(cloud_job.total_time_minutes)
        raw = cloud_job.raw.get("total_time")
        total_text = str(raw) if raw is not None else None
    elif elapsed is not None and remaining is not None:
        total = elapsed + remaining
    attrs: dict[str, Any] = {}
    if job is not None and job.filename:
        attrs["file_name"] = job.filename
    attrs |= _cloud_job_attrs(c)
    cloud = p.cloud if p.via_cloud else None
    # Always present (BEHAVIOUR §2.3); the slicer details are cloud only.
    attrs |= {
        "created_timestamp": cloud_job.create_time if cloud_job else None,
        "finished_timestamp": p.job_end_time,
        "print_total_time": total_text,
        "print_total_time_minutes": total,
        "print_total_time_dhm": _minutes_dhm(total),
        "print_supplies_usage": p.job_filament_used,
        "print_status_message": cloud.failure_reason if cloud is not None else None,
    }
    return attrs


def _speed_mode_attrs(c: AnycubicCoordinator) -> dict[str, Any]:
    p = c.printer
    return {
        "available_modes": p.speed_modes,
        "print_speed_mode_code": p.speed_mode_code,
    }


def _target_attrs(which: str) -> AttrsFn:
    def attrs(c: AnycubicCoordinator) -> dict[str, Any]:
        # The allowed range comes from the cloud job detail: null on LAN.
        limits = c.printer.target_limits(which)
        if limits is None:
            return {"limit_min": None, "limit_max": None}
        return {"limit_min": limits[0], "limit_max": limits[1]}

    return attrs


def _external_attrs(c: AnycubicCoordinator) -> dict[str, Any]:
    spool = c.printer.external_spool
    if spool is None:
        return {}
    return {
        "material": spool.material,
        "color": spool.color,
        "color_hex": rgb_to_hex(spool.color),
        "loaded": spool.loaded,
    }


def _external_material(c: AnycubicCoordinator) -> str | None:
    spool = c.printer.external_spool
    if spool is None or not spool.loaded:
        return None
    return spool.material


def _axis_position(axis: str) -> ValueFn:
    return lambda c: c.printer.axis_position(axis)


def _slot_remaining(number: int) -> ValueFn:
    return lambda c: c.ledger.slot_remaining(c.printer, number)


def _slot_remaining_percent(number: int) -> ValueFn:
    return lambda c: c.ledger.slot_remaining_percent(c.printer, number)


def _forecast(name: str) -> ValueFn:
    return lambda c: getattr(c.forecast, name) if c.forecast is not None else None


def _forecast_source(c: AnycubicCoordinator) -> dict[str, Any]:
    return {"source": c.forecast.source if c.forecast is not None else "unknown"}


def _ledger(name: str) -> ValueFn:
    return lambda c: getattr(c.ledger, name)(c.printer.printer_id)


PRINTER_SENSORS: tuple[AnycubicSensorDescription, ...] = (
    AnycubicSensorDescription(
        key="current_status",
        value_fn=lambda c: c.printer.current_status,
        attrs_fn=_current_status_attrs,
    ),
    AnycubicSensorDescription(
        key="last_error_code",
        value_fn=lambda c: c.printer.last_error_code,
    ),
    AnycubicSensorDescription(
        key="last_error",
        value_fn=lambda c: c.printer.last_error,
    ),
    AnycubicSensorDescription(
        key="job_name",
        value_fn=lambda c: c.printer.job_name,
        attrs_fn=_job_name_attrs,
    ),
    AnycubicSensorDescription(
        key="job_progress",
        native_unit_of_measurement=PERCENTAGE,
        state_class=SensorStateClass.MEASUREMENT,
        value_fn=lambda c: c.printer.job_progress,
    ),
    AnycubicSensorDescription(
        key="job_time_elapsed",
        native_unit_of_measurement=UnitOfTime.MINUTES,
        device_class=SensorDeviceClass.DURATION,
        state_class=SensorStateClass.MEASUREMENT,
        value_fn=lambda c: c.printer.job_elapsed_minutes,
    ),
    AnycubicSensorDescription(
        key="job_time_remaining",
        native_unit_of_measurement=UnitOfTime.MINUTES,
        device_class=SensorDeviceClass.DURATION,
        state_class=SensorStateClass.MEASUREMENT,
        value_fn=lambda c: c.printer.job_remaining_minutes,
    ),
    AnycubicSensorDescription(
        key="job_state",
        value_fn=lambda c: c.printer.job_state,
    ),
    AnycubicSensorDescription(
        key="job_eta",
        device_class=SensorDeviceClass.TIMESTAMP,
        value_fn=_job_eta,
    ),
    AnycubicSensorDescription(
        key="job_current_layer",
        native_unit_of_measurement=UNIT_LAYERS,
        state_class=SensorStateClass.MEASUREMENT,
        value_fn=lambda c: c.printer.job.current_layer if c.printer.job else None,
    ),
    AnycubicSensorDescription(
        key="job_total_layers",
        native_unit_of_measurement=UNIT_LAYERS,
        state_class=SensorStateClass.MEASUREMENT,
        value_fn=lambda c: c.printer.job.total_layers if c.printer.job else None,
    ),
    AnycubicSensorDescription(
        key="job_filament_used",
        native_unit_of_measurement=UnitOfLength.MILLIMETERS,
        state_class=SensorStateClass.MEASUREMENT,
        # A whole number of millimetres, as 2.x reports it (COMPAT §3).
        value_fn=lambda c: _whole(c.printer.job_filament_used),
    ),
    *(
        AnycubicSensorDescription(
            key=f"axis_position_{axis}",
            native_unit_of_measurement=UnitOfLength.MILLIMETERS,
            device_class=SensorDeviceClass.DISTANCE,
            state_class=SensorStateClass.MEASUREMENT,
            suggested_display_precision=1,
            entity_registry_enabled_default=False,
            value_fn=_axis_position(axis),
        )
        for axis in ("x", "y", "z")
    ),
    AnycubicSensorDescription(
        key="external_spool_material",
        entity_registry_enabled_default=False,
        value_fn=_external_material,
        attrs_fn=_external_attrs,
    ),
)

FDM_SENSORS: tuple[AnycubicSensorDescription, ...] = (
    *(
        AnycubicSensorDescription(
            key=key,
            kind=Kind.FDM,
            native_unit_of_measurement=UnitOfTemperature.CELSIUS,
            device_class=SensorDeviceClass.TEMPERATURE,
            state_class=SensorStateClass.MEASUREMENT,
            value_fn=fn,
            attrs_fn=attrs,
        )
        for key, fn, attrs in (
            ("curr_nozzle_temp", lambda c: c.printer.nozzle_temperature, None),
            ("curr_hotbed_temp", lambda c: c.printer.hotbed_temperature, None),
            (
                "target_nozzle_temp",
                lambda c: c.printer.target_nozzle_temperature,
                _target_attrs("nozzle"),
            ),
            (
                "target_hotbed_temp",
                lambda c: c.printer.target_hotbed_temperature,
                _target_attrs("hotbed"),
            ),
        )
    ),
    AnycubicSensorDescription(
        key="fan_speed_pct",
        kind=Kind.FDM,
        state_class=SensorStateClass.MEASUREMENT,
        value_fn=lambda c: c.printer.fan_speed,
    ),
    AnycubicSensorDescription(
        key="aux_fan_speed_pct",
        kind=Kind.FDM,
        native_unit_of_measurement=PERCENTAGE,
        state_class=SensorStateClass.MEASUREMENT,
        value_fn=lambda c: c.printer.aux_fan_speed,
    ),
    AnycubicSensorDescription(
        key="print_speed_pct",
        kind=Kind.FDM,
        state_class=SensorStateClass.MEASUREMENT,
        # The printer's own reading, else the cloud job's (B14; Q2.2).
        value_fn=lambda c: c.printer.print_speed,
    ),
    AnycubicSensorDescription(
        key="job_speed_mode",
        kind=Kind.FDM,
        value_fn=lambda c: c.printer.job_speed_mode,
        attrs_fn=_speed_mode_attrs,
    ),
    # Computed from the ledger (BEHAVIOUR §2.10).
    AnycubicSensorDescription(
        key="job_filament_required",
        kind=Kind.FDM,
        native_unit_of_measurement=UnitOfMass.GRAMS,
        device_class=SensorDeviceClass.WEIGHT,
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=1,
        value_fn=_forecast("required"),
        attrs_fn=_forecast_source,
    ),
    AnycubicSensorDescription(
        key="job_filament_shortfall",
        kind=Kind.FDM,
        native_unit_of_measurement=UnitOfMass.GRAMS,
        device_class=SensorDeviceClass.WEIGHT,
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=1,
        value_fn=_forecast("shortfall"),
    ),
    AnycubicSensorDescription(
        key="job_filament_runs_out_at",
        kind=Kind.FDM,
        native_unit_of_measurement=PERCENTAGE,
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=1,
        entity_registry_enabled_default=False,
        value_fn=_forecast("runs_out_at"),
    ),
    AnycubicSensorDescription(
        key="job_cost",
        kind=Kind.FDM,
        device_class=SensorDeviceClass.MONETARY,
        suggested_display_precision=2,
        monetary=True,
        value_fn=_forecast("cost"),
    ),
    AnycubicSensorDescription(
        key="last_job_cost",
        kind=Kind.FDM,
        device_class=SensorDeviceClass.MONETARY,
        suggested_display_precision=2,
        monetary=True,
        value_fn=_ledger("last_job_cost"),
    ),
    AnycubicSensorDescription(
        key="last_job_filament",
        kind=Kind.FDM,
        native_unit_of_measurement=UnitOfMass.GRAMS,
        device_class=SensorDeviceClass.WEIGHT,
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=1,
        entity_registry_enabled_default=False,
        value_fn=_ledger("last_job_filament"),
    ),
    AnycubicSensorDescription(
        key="filament_cost_total",
        kind=Kind.FDM,
        device_class=SensorDeviceClass.MONETARY,
        # G20: total for the lifetime spend.
        state_class=SensorStateClass.TOTAL,
        suggested_display_precision=2,
        monetary=True,
        value_fn=_ledger("cost_total"),
        attrs_fn=lambda c: {
            "by_material_g": c.ledger.material_totals(c.printer.printer_id)
        },
    ),
    AnycubicSensorDescription(
        key="nozzle_filament_total",
        kind=Kind.FDM,
        native_unit_of_measurement=UnitOfMass.GRAMS,
        device_class=SensorDeviceClass.WEIGHT,
        state_class=SensorStateClass.TOTAL_INCREASING,
        entity_category=EntityCategory.DIAGNOSTIC,
        suggested_display_precision=1,
        entity_registry_enabled_default=False,
        value_fn=_ledger("nozzle_total"),
    ),
    AnycubicSensorDescription(
        key="nozzle_abrasive_filament",
        kind=Kind.FDM,
        native_unit_of_measurement=UnitOfMass.GRAMS,
        device_class=SensorDeviceClass.WEIGHT,
        state_class=SensorStateClass.TOTAL_INCREASING,
        entity_category=EntityCategory.DIAGNOSTIC,
        suggested_display_precision=1,
        value_fn=_ledger("nozzle_abrasive"),
    ),
    AnycubicSensorDescription(
        key="nozzle_wear_percent",
        kind=Kind.FDM,
        native_unit_of_measurement=PERCENTAGE,
        state_class=SensorStateClass.MEASUREMENT,
        entity_category=EntityCategory.DIAGNOSTIC,
        suggested_display_precision=1,
        value_fn=_ledger("nozzle_wear"),
    ),
    AnycubicSensorDescription(
        key="spool_inventory_remaining",
        kind=Kind.FDM,
        native_unit_of_measurement=UnitOfMass.GRAMS,
        device_class=SensorDeviceClass.WEIGHT,
        state_class=SensorStateClass.MEASUREMENT,
        suggested_display_precision=1,
        value_fn=lambda c: c.ledger.spool_inventory_remaining(),
        attrs_fn=lambda c: {
            "spools": [entry.as_dict() for entry in c.ledger.spool_inventory()]
        },
    ),
    AnycubicSensorDescription(
        key="spool_inventory_count",
        kind=Kind.FDM,
        state_class=SensorStateClass.MEASUREMENT,
        entity_registry_enabled_default=False,
        value_fn=lambda c: c.ledger.spool_inventory_count(),
    ),
)


def _ace_sensors(box: int) -> tuple[AnycubicSensorDescription, ...]:
    """Sensors shared by both ACE units (BEHAVIOUR §2.8, §2.9)."""
    prefix = "" if box == 0 else "secondary_"
    kind = Kind.ACE1 if box == 0 else Kind.ACE2
    device = Device.ACE1 if box == 0 else Device.ACE2

    def loaded(c: AnycubicCoordinator) -> int | None:
        index = c.printer.ace_loaded_slot_index(box)
        return index + 1 if index is not None else None

    return (
        AnycubicSensorDescription(
            key=f"{prefix}ace_spools",
            kind=kind,
            device=device,
            value_fn=lambda c: "active" if c.printer.spool_info(box) else "inactive",
            attrs_fn=lambda c: {
                "spool_info": c.printer.spool_info(box),
                "box_info": c.printer.box_info(box),
            },
        ),
        AnycubicSensorDescription(
            key=f"{prefix}ace_loaded_slot",
            kind=kind,
            device=device,
            value_fn=loaded,
        ),
        AnycubicSensorDescription(
            key=f"{prefix}ace_current_temperature",
            kind=kind,
            device=device,
            native_unit_of_measurement=UnitOfTemperature.CELSIUS,
            device_class=SensorDeviceClass.TEMPERATURE,
            state_class=SensorStateClass.MEASUREMENT,
            value_fn=lambda c: float(c.printer.ace_temperature(box)),
        ),
        AnycubicSensorDescription(
            key=f"{prefix}dry_status_target_temperature",
            kind=kind,
            device=device,
            native_unit_of_measurement=UnitOfTemperature.CELSIUS,
            device_class=SensorDeviceClass.TEMPERATURE,
            state_class=SensorStateClass.MEASUREMENT,
            value_fn=lambda c: float(c.printer.drying_value(box, "target_temp")),
        ),
        # Minutes, deliberately without a declared unit (BEHAVIOUR §8).
        AnycubicSensorDescription(
            key=f"{prefix}dry_status_total_duration",
            kind=kind,
            device=device,
            state_class=SensorStateClass.MEASUREMENT,
            value_fn=lambda c: round(c.printer.drying_value(box, "duration")),
        ),
        AnycubicSensorDescription(
            key=f"{prefix}dry_status_remaining_time",
            kind=kind,
            device=device,
            state_class=SensorStateClass.MEASUREMENT,
            value_fn=lambda c: round(c.printer.drying_value(box, "remain_time")),
        ),
    )


def _slot_value(box: int, number: int) -> ValueFn:
    def value(c: AnycubicCoordinator) -> str | None:
        slot = c.printer.ace_slot(box, number)
        if c.printer.slot_is_empty(slot):
            return None  # B16
        return slot.material if slot is not None else None

    return value


def _slot_attrs(box: int, number: int) -> AttrsFn:
    def attrs(c: AnycubicCoordinator) -> dict[str, Any] | None:
        slot = c.printer.ace_slot(box, number)
        if slot is None:
            return None
        full = c.printer.slot_attributes(box, slot, number - 1)
        full.pop("color_group")
        full.pop("icon_type")
        return full

    return attrs


FIRST_ACE_SENSORS: tuple[AnycubicSensorDescription, ...] = (
    *_ace_sensors(0),
    AnycubicSensorDescription(
        key="box_fan_level",
        kind=Kind.ACE1,
        device=Device.ACE1,
        state_class=SensorStateClass.MEASUREMENT,
        value_fn=lambda c: c.printer.box_fan_level,
    ),
    *(
        description
        for number in ACE_SLOTS
        for description in (
            AnycubicSensorDescription(
                key=f"ace_slot_{number}",
                kind=Kind.ACE1,
                device=Device.ACE1,
                value_fn=_slot_value(0, number),
                attrs_fn=_slot_attrs(0, number),
            ),
            AnycubicSensorDescription(
                key=f"ace_slot_{number}_filament_remaining",
                kind=Kind.ACE1,
                device=Device.ACE1,
                native_unit_of_measurement=UnitOfMass.GRAMS,
                device_class=SensorDeviceClass.WEIGHT,
                state_class=SensorStateClass.MEASUREMENT,
                suggested_display_precision=0,
                entity_registry_enabled_default=False,
                value_fn=_slot_remaining(number),
            ),
            AnycubicSensorDescription(
                key=f"ace_slot_{number}_filament_remaining_percent",
                kind=Kind.ACE1,
                device=Device.ACE1,
                native_unit_of_measurement=PERCENTAGE,
                state_class=SensorStateClass.MEASUREMENT,
                suggested_display_precision=0,
                entity_registry_enabled_default=False,
                value_fn=_slot_remaining_percent(number),
            ),
        )
    ),
)

SECOND_ACE_SENSORS = _ace_sensors(1)


def _file_list(source: str) -> ValueFn:
    def value(c: AnycubicCoordinator) -> int | None:
        files = c.file_list(source)
        return len(files) if files is not None else None  # 0 when empty (G12)

    return value


def _file_list_attrs(source: str) -> AttrsFn:
    def attrs(c: AnycubicCoordinator) -> dict[str, Any] | None:
        files = c.file_list(source)
        return {"file_info": files} if files is not None else None

    return attrs


def _hours(c: AnycubicCoordinator) -> int | None:
    """Whole hours, rounded down; no value when the text is absent (G11)."""
    minutes = c.printer.print_time_total_minutes
    return minutes // 60 if minutes is not None else None


def _resin(name: str) -> ValueFn:
    return lambda c: c.printer.resin_setting(name)


# The cloud-only sensors (BEHAVIOUR §2.3-§2.5, §2.11). Not created on
# LAN-only entries (DECISIONS round 2, Q8).
CLOUD_SENSORS: tuple[AnycubicSensorDescription, ...] = (
    *(
        AnycubicSensorDescription(
            key=f"file_list_{source}",
            cloud_only=True,
            native_unit_of_measurement=UNIT_FILES,
            value_fn=_file_list(source),
            attrs_fn=_file_list_attrs(source),
        )
        for source in ("local", "udisk", "cloud")
    ),
    AnycubicSensorDescription(
        key="job_z_thick",
        cloud_only=True,
        # Millimetres, deliberately without a declared unit (BEHAVIOUR §8).
        state_class=SensorStateClass.MEASUREMENT,
        value_fn=lambda c: c.printer.job_z_thick,
    ),
    AnycubicSensorDescription(
        key="material_used_total",
        cloud_only=True,
        native_unit_of_measurement=UnitOfMass.KILOGRAMS,
        state_class=SensorStateClass.TOTAL_INCREASING,
        entity_category=EntityCategory.DIAGNOSTIC,
        value_fn=lambda c: c.printer.material_used_kg,
    ),
    AnycubicSensorDescription(
        key="print_time_total_hrs",
        cloud_only=True,
        native_unit_of_measurement=UnitOfTime.HOURS,
        state_class=SensorStateClass.TOTAL_INCREASING,
        entity_category=EntityCategory.DIAGNOSTIC,
        value_fn=_hours,
    ),
    AnycubicSensorDescription(
        key="print_count_total",
        cloud_only=True,
        state_class=SensorStateClass.TOTAL_INCREASING,
        entity_category=EntityCategory.DIAGNOSTIC,
        value_fn=lambda c: c.printer.print_count_total,
    ),
)

# Resin printers (BEHAVIOUR §2.11): cloud only, from the job's settings.
RESIN_SENSORS: tuple[AnycubicSensorDescription, ...] = (
    *(
        AnycubicSensorDescription(
            key=key,
            kind=Kind.LCD,
            cloud_only=True,
            native_unit_of_measurement=UnitOfTime.SECONDS,
            device_class=SensorDeviceClass.DURATION,
            state_class=SensorStateClass.MEASUREMENT,
            value_fn=_resin(name),
        )
        for key, name in (
            ("job_on_time", "on_time"),
            ("job_off_time", "off_time"),
            ("job_bottom_time", "bottom_time"),
        )
    ),
    *(
        AnycubicSensorDescription(
            key=key,
            kind=Kind.LCD,
            cloud_only=True,
            native_unit_of_measurement=UnitOfLength.MILLIMETERS,
            state_class=SensorStateClass.MEASUREMENT,
            value_fn=_resin(name),
        )
        for key, name in (
            ("job_model_height", "model_hight"),
            ("job_z_up_height", "z_up_height"),
        )
    ),
    AnycubicSensorDescription(
        key="job_bottom_layers",
        kind=Kind.LCD,
        cloud_only=True,
        native_unit_of_measurement=UNIT_LAYERS,
        state_class=SensorStateClass.MEASUREMENT,
        value_fn=_resin("bottom_layers"),
    ),
    # No unit declared (BEHAVIOUR §9, V5).
    *(
        AnycubicSensorDescription(
            key=key,
            kind=Kind.LCD,
            cloud_only=True,
            state_class=SensorStateClass.MEASUREMENT,
            value_fn=_resin(name),
        )
        for key, name in (
            ("job_anti_alias_count", "anti_count"),
            ("job_z_up_speed", "z_up_speed"),
            ("job_z_down_speed", "z_down_speed"),
        )
    ),
)

SENSORS: tuple[AnycubicSensorDescription, ...] = (
    *PRINTER_SENSORS,
    *FDM_SENSORS,
    *FIRST_ACE_SENSORS,
    *SECOND_ACE_SENSORS,
    *CLOUD_SENSORS,
    *RESIN_SENSORS,
)


async def async_setup_entry(
    hass: HomeAssistant,
    entry: AnycubicConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Set up the sensors of a config entry."""
    async_add_when_ready(
        entry.runtime_data, SENSORS, AnycubicSensor, async_add_entities
    )


class AnycubicSensor(AnycubicEntity, SensorEntity):
    """A printer or ACE sensor."""

    entity_description: AnycubicSensorDescription

    @property
    def _value(self) -> Any:
        return self.entity_description.value_fn(self.coordinator)

    @property
    def available(self) -> bool:
        """A sensor with no value is unavailable, not unknown (§0.3)."""
        return super().available and self._value is not None

    @property
    def native_value(self) -> Any:
        return self._value

    @property
    def native_unit_of_measurement(self) -> str | None:
        if self.entity_description.monetary:
            return self.hass.config.currency
        return super().native_unit_of_measurement

    @property
    def extra_state_attributes(self) -> dict[str, Any] | None:
        if (attrs_fn := self.entity_description.attrs_fn) is None:
            return None
        return attrs_fn(self.coordinator)

    @property
    def entity_picture(self) -> str | None:
        key = self.entity_description.key
        if not key.startswith("ace_slot_") or not key[-1].isdigit():
            return None
        attrs = self.extra_state_attributes or {}
        if attrs.get("edit_status") == 2:
            return None
        return spool_picture(list(attrs.get("colors_hex") or []))
