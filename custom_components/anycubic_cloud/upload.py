"""The two print-and-upload actions (BEHAVIOUR §4.4, §4.8; PROTOCOL D §2.5).

Cloud only: the file goes through Anycubic's storage and the print order has
no LAN form.
"""

from __future__ import annotations

import asyncio
from typing import TYPE_CHECKING, Any

from anycubic_cloud_client import (
    AnycubicCloudError,
    GcodeMetadataError,
    OrderRefusedError,
    PrintStartResult,
    SlotMappingError,
    StorageFullError,
    UploadError,
)
from homeassistant.components.file_upload import process_uploaded_file
from homeassistant.exceptions import HomeAssistantError, ServiceValidationError
from homeassistant.helpers import device_registry as dr

from .const import (
    DOMAIN,
    EVENT_PRINT_CLOUD_START,
    EVENT_TYPE,
    UPLOAD_READ_ATTEMPTS,
    UPLOAD_READ_DELAY,
)
from .control import cloud_account
from .identity import printer_identifier

if TYPE_CHECKING:
    from homeassistant.core import HomeAssistant, ServiceCall

    from .coordinator import AnycubicCoordinator

ATTR_SLOT_NUMBER = "slot_number"
ATTR_UPLOADED_FILE = "uploaded_gcode_file"


def _read_upload(hass: HomeAssistant, file_id: str) -> tuple[str, bytes]:
    """The uploaded file's name and bytes. Blocking."""
    with process_uploaded_file(hass, file_id) as path:
        return path.name, path.read_bytes()


async def async_read_upload(hass: HomeAssistant, file_id: str) -> tuple[str, bytes]:
    """Read up to 3 times, 1 s apart, while it is not yet available (§4.4)."""
    for attempt in range(UPLOAD_READ_ATTEMPTS):
        try:
            return await hass.async_add_executor_job(_read_upload, hass, file_id)
        except (ValueError, OSError) as err:
            if attempt == UPLOAD_READ_ATTEMPTS - 1:
                raise ServiceValidationError(
                    translation_domain=DOMAIN, translation_key="gcode_read_failed"
                ) from err
            await asyncio.sleep(UPLOAD_READ_DELAY)
    raise AssertionError("unreachable")  # pragma: no cover


def _slots(
    coordinator: AnycubicCoordinator, slots: list[int] | None
) -> list[int] | None:
    """1-based slots across boxes (1-4 first ACE, 5-8 second) to 0-based.

    A printer with an ACE needs one slot per colour, one without must get
    none, and the highest slot must lie on a connected ACE (§4.4).
    """
    has_ace = coordinator.printer.ace_count > 0
    if has_ace and not slots:
        raise ServiceValidationError(
            translation_domain=DOMAIN, translation_key="slots_required"
        )
    if not has_ace and slots:
        raise ServiceValidationError(
            translation_domain=DOMAIN, translation_key="slots_not_allowed"
        )
    if not slots:
        return None
    if min(slots) < 1 or (max(slots) - 1) // 4 + 1 > coordinator.printer.ace_count:
        raise ServiceValidationError(
            translation_domain=DOMAIN, translation_key="slot_not_on_ace"
        )
    return [slot - 1 for slot in slots]


async def async_print_and_upload(
    coordinator: AnycubicCoordinator, call: ServiceCall, *, save_in_cloud: bool
) -> None:
    """Upload a sliced file and start printing it; fire the event (§4.8)."""
    account = cloud_account(coordinator)
    client = account.client
    assert client is not None
    hass = coordinator.hass
    slots = _slots(coordinator, call.data.get(ATTR_SLOT_NUMBER))
    filename, content = await async_read_upload(hass, call.data[ATTR_UPLOADED_FILE])
    printer = coordinator.printer
    units = printer.cloud.ace_units if printer.cloud is not None else ()
    try:
        result = await client.upload_and_print(
            printer.printer_id,
            filename,
            content,
            save_in_cloud=save_in_cloud,
            slots=slots,
            ace_units=units,
        )
    except (SlotMappingError, GcodeMetadataError) as err:
        raise ServiceValidationError(
            translation_domain=DOMAIN,
            translation_key="slot_mapping_failed",
            translation_placeholders={"message": str(err)},
        ) from err
    except StorageFullError as err:
        raise HomeAssistantError(
            translation_domain=DOMAIN, translation_key="cloud_storage_full"
        ) from err
    except (UploadError, OrderRefusedError, AnycubicCloudError) as err:
        raise HomeAssistantError(
            translation_domain=DOMAIN,
            translation_key="cloud_error",
            translation_placeholders={"message": str(err)},
        ) from err
    hass.bus.async_fire(EVENT_TYPE, _event_data(hass, coordinator, result))
    await coordinator.async_request_refresh()


def _event_data(
    hass: HomeAssistant, coordinator: AnycubicCoordinator, result: PrintStartResult
) -> dict[str, Any]:
    """The event of a started cloud print (§4.8). ``device_id`` is the device
    of the printer this call targeted (G17)."""
    printer = coordinator.printer
    identifier = printer_identifier(coordinator.config_entry, printer.printer_id)
    device = next(
        (
            device
            for device in dr.async_entries_for_config_entry(
                dr.async_get(hass), coordinator.config_entry.entry_id
            )
            if identifier in device.identifiers
        ),
        None,
    )
    return {
        "printer_id": printer.printer_id,
        "printer_name": printer.identity.name,
        "device_id": device.id if device is not None else None,
        "type": EVENT_PRINT_CLOUD_START,
        "event_data": {
            "order_msg_id": result.msgid,
            "printer_id": result.printer_id,
            "saved_in_cloud": result.saved_in_cloud,
            "file_name": result.file_name,
            "cloud_file_id": result.cloud_file_id,
            "gcode_id": result.gcode_id,
            "material_list": [dict(color.raw) for color in result.colors],
            "ams_box_mapping": (
                [entry.to_data() for entry in result.mapping]
                if result.mapping
                else None
            ),
        },
    }
