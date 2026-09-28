"""Coordinators: one per printer, under one runtime per config entry.

:class:`AnycubicRuntime` is the entry's ``runtime_data``: the printers'
coordinators, the filament ledger and capability memory they share, and the
Anycubic account (:class:`~.cloud.CloudAccount`) when the entry has one.

Each :class:`AnycubicCoordinator` keeps one printer's readings. A printer is
read over LAN when LAN Mode reaches it, and over the cloud otherwise
(BEHAVIOUR §5.4). Push first: every report is applied at once (§5.1). The
15 s refresh sends the LAN query set while connected and runs the full
handshake again while not (G2); over the cloud it polls at most every 60 s.
Availability follows §5.5: when the source is lost every entity becomes
unavailable once and stays so until it answers again - never alternating
with stale values.
"""

from __future__ import annotations

import asyncio
import logging
from typing import TYPE_CHECKING, Any

from anycubic_lan import (
    AnycubicLanError,
    LanModeDisabledError,
    PrinterState,
    Report,
    ReportKind,
    UnsupportedPrinterError,
)
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import callback
from homeassistant.exceptions import ConfigEntryNotReady
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.helpers.device_registry import format_mac
from homeassistant.helpers.event import async_call_later
from homeassistant.helpers.storage import Store
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator, UpdateFailed

from . import cloud_state
from .const import (
    CONF_DEBUG_DEPRECATED,
    CONF_DEBUG_MQTT_MSG,
    CONF_DRYING_PRESET_DURATION,
    CONF_DRYING_PRESET_TEMPERATURE,
    CONF_PRINTER_IDS,
    DOMAIN,
    DRYING_PRESETS,
    FILE_LIST_CLOUD,
    FILE_LIST_LOCAL,
    FILE_LIST_UDISK,
    LAN_INFO_TIMEOUT,
    PRINT_STARTED_REFRESH_DELAY,
    STORE_CAPABILITIES,
    STORE_VERSION,
    UPDATE_INTERVAL,
)
from .identity import NO_MAC, lan_printer_id, unique_id_mac
from .lan import LanLink, WrongPrinterError
from .ledger import FilamentLedger, Forecast
from .model import (
    CloudData,
    Printer,
    PrinterIdentity,
    material_type_from_device_type,
    print_speed_pct,
)

if TYPE_CHECKING:
    from anycubic_cloud_client import (
        CloudMessage,
        Job as CloudJob,
        JobDetail,
        PrinterDetail,
    )
    from anycubic_lan import PrinterConnectionInfo
    from homeassistant.core import HomeAssistant

    from .cloud import CloudAccount

_LOGGER = logging.getLogger(__name__)

# Pushed reports arrive in bursts (one per kind after each query set); the
# entities are told once per burst.
PUSH_COOLDOWN = 1.0

type AnycubicConfigEntry = ConfigEntry[AnycubicRuntime]


class AnycubicRuntime:
    """Everything one config entry runs."""

    def __init__(self, hass: HomeAssistant, entry: AnycubicConfigEntry) -> None:
        self.hass = hass
        self.entry = entry
        self.ledger = FilamentLedger(hass, entry.entry_id)
        self._capabilities: Store[dict[str, Any]] = Store(
            hass, STORE_VERSION, f"{STORE_CAPABILITIES}.{entry.entry_id}"
        )
        self.capability_data: dict[str, Any] = {"printers": {}}
        self.coordinators: dict[int, AnycubicCoordinator] = {}
        self.cloud: CloudAccount | None = None
        self._loaded = False

    async def async_load(self) -> None:
        await self.ledger.async_load()
        stored = await self._capabilities.async_load()
        if isinstance(stored, dict) and isinstance(stored.get("printers"), dict):
            self.capability_data = stored
        self._loaded = True

    async def async_shutdown(self) -> None:
        """Close the links and write the stores (BEHAVIOUR §5.7)."""
        if self.cloud is not None:
            await self.cloud.async_shutdown()
        for coordinator in list(self.coordinators.values()):
            await coordinator.async_close()
        await self.ledger.async_flush()
        if self._loaded and self.coordinators:
            # The capability memory was read at setup; write it back now.
            await self._capabilities.async_save(self.capability_data)

    # -- coordinators --------------------------------------------------------------

    @property
    def primary(self) -> AnycubicCoordinator:
        """The first printer's coordinator (LAN-only entries have one)."""
        return next(iter(self.coordinators.values()))

    def cloud_coordinators(self) -> list[AnycubicCoordinator]:
        """Printers read over the cloud now (not reached over LAN)."""
        return [c for c in self.coordinators.values() if c.uses_cloud]

    @callback
    def add(self, coordinator: AnycubicCoordinator) -> None:
        self.coordinators[coordinator.printer_id] = coordinator

    # -- capability memory (BEHAVIOUR §3.13) -----------------------------------

    def remembered_light_types(self, printer_id: int) -> list[int]:
        printers = self.capability_data.get("printers", {})
        entry = printers.get(str(printer_id)) if isinstance(printers, dict) else None
        types = entry.get("light_types") if isinstance(entry, dict) else None
        return [t for t in types or [] if isinstance(t, int)]

    def remember_light_types(self, printer: Printer) -> None:
        live = {light.type for light in printer.state.lights if light.type is not None}
        remembered = self.remembered_light_types(printer.printer_id)
        new = sorted(live - set(remembered))
        if not new:
            return
        printers = self.capability_data.setdefault("printers", {})
        printers.setdefault(str(printer.printer_id), {})["light_types"] = [
            *remembered,
            *new,
        ]
        printer.remembered_light_types = frozenset([*remembered, *new])
        self._capabilities.async_delay_save(lambda: self.capability_data, 5.0)


class AnycubicCoordinator(DataUpdateCoordinator[Printer]):
    """Keeps one printer's readings."""

    config_entry: AnycubicConfigEntry

    def __init__(
        self,
        hass: HomeAssistant,
        runtime: AnycubicRuntime,
        *,
        host: str | None = None,
        printer: Printer | None = None,
        lan_printer_id: int | None = None,
    ) -> None:
        entry = runtime.entry
        super().__init__(
            hass,
            _LOGGER,
            config_entry=entry,
            name=f"{DOMAIN} {host or entry.title}",
            update_interval=UPDATE_INTERVAL,
        )
        self.runtime = runtime
        options = entry.options
        self.link: LanLink | None = None
        if host:
            self.link = LanLink(
                async_get_clientsession(hass),
                host,
                on_state=self._handle_state,
                on_report=self._handle_report,
                on_connection=self._handle_connection,
                debug_messages=bool(
                    options.get(CONF_DEBUG_MQTT_MSG, options.get(CONF_DEBUG_DEPRECATED))
                ),
            )
        self._printer: Printer | None = printer
        self._lan_printer_id = lan_printer_id
        self.forecast: Forecast | None = None
        # The job is only trusted once the current connection sent `info`.
        self._info_seen = asyncio.Event()
        self._push_pending = False
        # The printer's device registry id, the parent of its ACE units.
        self.printer_device_id: str | None = None
        # The local file-list retry runs once at a time (PROTOCOL C §6.11).
        self.local_list_retry_pending = False

    @classmethod
    def from_cloud(
        cls,
        hass: HomeAssistant,
        runtime: AnycubicRuntime,
        detail: PrinterDetail,
        *,
        host: str | None = None,
    ) -> AnycubicCoordinator:
        """A printer built from its cloud record (BEHAVIOUR §5.4)."""
        assert detail.id is not None
        mac_text = detail.base.machine_mac or detail.raw.get("machine_mac")
        mac = unique_id_mac(str(mac_text)) if mac_text else NO_MAC
        identity = PrinterIdentity(
            printer_id=detail.id,
            mac=mac,
            name=detail.name or detail.model or str(detail.id),
            model_name=detail.model or "",
            model_id=detail.machine_type or 0,
            material_type=detail.base.material_type,
            host=host or "",
            connection_mac=_colon_mac(str(mac_text)) if mac_text else None,
            key=detail.key,
        )
        printer = Printer(identity=identity, source="cloud", cloud=CloudData())
        printer.remembered_light_types = frozenset(
            runtime.remembered_light_types(detail.id)
        )
        cloud_state.apply_detail(printer, detail)
        return cls(hass, runtime, host=host, printer=printer)

    # -- properties -------------------------------------------------------------

    @property
    def ledger(self) -> FilamentLedger:
        return self.runtime.ledger

    @property
    def cloud(self) -> CloudAccount | None:
        return self.runtime.cloud

    @property
    def capability_data(self) -> dict[str, Any]:
        return self.runtime.capability_data

    @property
    def has_printer(self) -> bool:
        return self._printer is not None

    @property
    def printer(self) -> Printer:
        """The printer; entities and actions exist only once it is built."""
        if self._printer is None:  # pragma: no cover - setup builds it first
            raise RuntimeError("Printer not set up")
        return self._printer

    @property
    def printer_id(self) -> int:
        return self.printer.printer_id

    @property
    def lan_connected(self) -> bool:
        return self.link is not None and self.link.connected

    @property
    def uses_cloud(self) -> bool:
        """Read over the cloud now: an account, and LAN not connected."""
        return (
            self.runtime.cloud is not None
            and self._printer is not None
            and self._printer.cloud is not None
            and not self.lan_connected
        )

    # -- LAN setup ----------------------------------------------------------------

    async def async_setup_lan(self) -> None:
        """Connect and build the printer over LAN (BEHAVIOUR §5.3).

        Not ready on failure when LAN is the only source; a hybrid printer
        built from the cloud only logs it (a LAN failure is never fatal).
        """
        assert self.link is not None
        try:
            info = await self._async_connect_and_wait()
        except WrongPrinterError:
            # Only a printer built from the cloud expects a MAC: the address
            # reaches another printer, whose reports must not be taken for
            # this one. The link stays, so a later address change recovers.
            _LOGGER.warning(
                "LAN Mode address %s is not printer %s; using the cloud",
                self.link.host,
                self.printer.printer_id,
            )
            return
        except LanModeDisabledError as err:
            if self._printer is not None:
                _LOGGER.debug("LAN Mode is off at the printer: %s", err)
                return
            raise ConfigEntryNotReady(
                translation_domain=DOMAIN, translation_key="lan_mode_disabled"
            ) from err
        except UnsupportedPrinterError as err:
            if self._printer is not None:
                _LOGGER.debug("LAN printer unsupported: %s", err)
                return
            raise ConfigEntryNotReady(
                translation_domain=DOMAIN, translation_key="lan_unsupported_printer"
            ) from err
        except (AnycubicLanError, TimeoutError) as err:
            if self._printer is not None:
                _LOGGER.debug("LAN printer not reachable: %s", err)
                return
            raise ConfigEntryNotReady(
                translation_domain=DOMAIN,
                translation_key="lan_unreachable",
                translation_placeholders={"host": self.link.host},
            ) from err
        if self._printer is None:
            printer = self._printer = Printer(identity=self._build_identity(info))
            printer.remembered_light_types = frozenset(
                self.runtime.remembered_light_types(printer.printer_id)
            )
        self._use_lan()
        if self.link.client is not None:
            self._handle_state(self.link.client.state)

    def _use_lan(self) -> None:
        printer = self.printer
        printer.source = "lan"
        printer.info_seen = True

    async def _async_connect_and_wait(self) -> PrinterConnectionInfo:
        """Handshake, connect, then wait up to 20 s for an ``info`` report."""
        assert self.link is not None
        self._info_seen.clear()
        info = await self.link.async_connect(self._expected_mac())
        try:
            async with asyncio.timeout(LAN_INFO_TIMEOUT):
                await self._info_seen.wait()
        except TimeoutError:
            await self.link.async_disconnect()
            raise
        return info

    def _expected_mac(self) -> str | None:
        """The MAC the cloud reports for this printer, if it was built from it."""
        printer = self._printer
        if printer is None or printer.cloud is None:
            return None
        mac = printer.identity.mac
        return None if mac == NO_MAC else mac

    def _build_identity(self, info: PrinterConnectionInfo) -> PrinterIdentity:
        assert self.link is not None
        entry = self.config_entry
        state = self.link.client.state if self.link.client else PrinterState()
        printer_ids = entry.data.get(CONF_PRINTER_IDS) or []
        if self._lan_printer_id is not None:
            # A hybrid entry: the printer the cloud could not supply.
            printer_id = self._lan_printer_id
        elif printer_ids:
            # The configured id (COMPAT §2). An entry covering several cloud
            # printers reaches one over LAN: the first when the cloud could
            # not tell which (DECISIONS round 2, Q5).
            printer_id = int(printer_ids[0])
            if len(printer_ids) > 1:
                _LOGGER.warning(
                    "Entry %s lists %d printers; LAN Mode reaches only printer %s",
                    entry.title,
                    len(printer_ids),
                    printer_id,
                )
        else:
            printer_id = lan_printer_id(info.device_id)
        model_name = info.discovery.model_name or state.model or info.model_name
        # Without a MAC, 2.x formatted the missing value as the text "None",
        # so unique ids are ``None-<key>`` (compatibility; round 2, Q4).
        mac = unique_id_mac(info.mac) if info.mac else NO_MAC
        return PrinterIdentity(
            printer_id=printer_id,
            mac=mac,
            name=state.printer_name or model_name,
            model_name=model_name,
            model_id=info.model_id,
            material_type=material_type_from_device_type(info.discovery.device_type),
            host=self.link.host,
            serial=info.serial,
            connection_mac=info.mac,
        )

    async def async_close(self) -> None:
        if self.link is not None:
            await self.link.async_disconnect()

    async def async_shutdown(self) -> None:
        await super().async_shutdown()
        await self.async_close()

    # -- refresh ---------------------------------------------------------------

    async def async_request_refresh(self) -> None:
        """After a control: an immediate refresh including a cloud poll."""
        if self.uses_cloud and self.runtime.cloud is not None:
            self.runtime.cloud.poll_soon()
        await super().async_request_refresh()

    async def _async_update_data(self) -> Printer:
        printer = self.printer
        link = self.link
        if link is not None:
            if link.connected:
                try:
                    await link.async_query_all()
                except AnycubicLanError as err:
                    raise UpdateFailed(
                        translation_domain=DOMAIN,
                        translation_key="lan_connection_lost",
                        translation_placeholders={"host": link.host},
                    ) from err
                return printer
            # Not connected: the whole handshake again (G2), then wait for info.
            try:
                await self._async_connect_and_wait()
            except (AnycubicLanError, TimeoutError) as err:
                if not self.uses_cloud:
                    raise UpdateFailed(
                        translation_domain=DOMAIN,
                        translation_key="lan_connection_lost",
                        translation_placeholders={"host": link.host},
                    ) from err
                _LOGGER.debug("LAN not reachable, reading the cloud: %s", err)
            else:
                self._use_lan()
                return printer
        cloud = self.runtime.cloud
        if cloud is None or printer.cloud is None:  # pragma: no cover - guarded
            raise UpdateFailed(
                translation_domain=DOMAIN, translation_key="cloud_not_available"
            )
        printer.source = "cloud"
        await cloud.async_poll(self)
        if printer.cloud.removed:
            raise UpdateFailed(
                translation_domain=DOMAIN, translation_key="printer_removed"
            )
        self._after_change()
        return printer

    # -- cloud data --------------------------------------------------------------

    @callback
    def apply_cloud_detail(self, detail: PrinterDetail) -> None:
        cloud_state.apply_detail(self.printer, detail)

    @callback
    def apply_cloud_job(self, job: CloudJob | None, detail: JobDetail | None) -> None:
        cloud_state.apply_job(self.printer, job, detail)

    @callback
    def cloud_printer_removed(self) -> None:
        cloud_state.mark_removed(self.printer)

    @callback
    def async_cloud_polled(self) -> None:
        """A poll by another printer's refresh brought this one's data."""
        printer = self.printer
        if printer.cloud is not None and printer.cloud.removed:
            self.async_set_update_error(
                UpdateFailed(
                    translation_domain=DOMAIN, translation_key="printer_removed"
                )
            )
            return
        self._after_change()
        self.async_set_updated_data(printer)

    @callback
    def apply_cloud_message(self, message: CloudMessage) -> None:
        """A pushed cloud MQTT message (PROTOCOL C §6.12)."""
        if not self.uses_cloud:
            return  # LAN is authoritative while connected
        outcome = cloud_state.apply_message(self.printer, message)
        self._after_change()
        if outcome.print_started:
            # The new job's id comes from the job list (G9).
            async_call_later(
                self.hass, PRINT_STARTED_REFRESH_DELAY, self._async_refresh_later
            )
        cloud = self.runtime.cloud
        if cloud is not None and cloud.last_poll_ok:
            # Never turn a failing cloud poll into success with pushed data.
            self.last_update_success = True
            self.last_exception = None
        self._schedule_push()

    async def _async_refresh_later(self, _now: Any) -> None:
        await self.async_request_refresh()

    def _after_change(self) -> None:
        printer = self.printer
        self.runtime.remember_light_types(printer)
        self.ledger.update(printer)
        self.forecast = self.ledger.forecast(printer)

    # -- pushed LAN reports --------------------------------------------------------

    def _handle_report(self, report: Report) -> None:
        """Facts anycubic-lan does not merge into its state."""
        envelope = report.envelope
        if envelope.kind == ReportKind.INFO:
            self._info_seen.set()
        elif (
            envelope.kind == ReportKind.AXIS
            and envelope.action == "move"
            and envelope.state
            and self._printer is not None
        ):
            self._printer.axis_move_state = envelope.state
        elif envelope.kind == ReportKind.PRINT and self._printer is not None:
            speed = print_speed_pct(envelope.action, envelope.state, envelope.data)
            if speed is not None:
                self._printer.print_speed_pct = speed

    def _handle_state(self, state: PrinterState) -> None:
        printer = self._printer
        if printer is None:
            return
        printer.state = state
        if not self._info_seen.is_set():
            # A fresh connection: the job is not known until `info` arrives,
            # so neither the ledger nor the entities may treat it as absent.
            return
        if self.link is not None and self.link.connected:
            printer.source = "lan"
        self._after_change()
        if self.link is not None and self.link.connected:
            self.last_update_success = True
            self.last_exception = None
        self._schedule_push()

    def _schedule_push(self) -> None:
        if not self._push_pending and self.hass.is_running:
            self._push_pending = True
            # A background task of the entry: cancelled on unload and when
            # Home Assistant stops, never waited for. None is started once
            # Home Assistant is stopping (U4).
            self.config_entry.async_create_background_task(
                self.hass, self._async_push_listeners(), "anycubic_cloud push"
            )

    async def _async_push_listeners(self) -> None:
        """Tell the entities once per burst of reports."""
        try:
            await asyncio.sleep(PUSH_COOLDOWN)
        finally:
            self._push_pending = False
        self.async_update_listeners()

    def _handle_connection(self, connected: bool) -> None:
        if connected:
            return  # the reports that follow bring it back
        # Unavailable at once, and until the printer answers again (§5.5);
        # a hybrid printer falls back to the cloud at the next refresh.
        self._info_seen.clear()
        if self.last_update_success:
            self.last_update_success = False
            self.async_update_listeners()

    # -- file lists (DECISIONS round 2, F3) ------------------------------------

    def can_fetch_file_list(self, source: str) -> bool:
        """Whether ``source``'s list can be fetched over the current connection.

        The printer's lists are replies to cloud orders that arrive over the
        cloud MQTT (no LAN form); the cloud list is an HTTP call of the account.
        """
        cloud = self.runtime.cloud
        if cloud is None or cloud.client is None:
            return False
        if source == FILE_LIST_CLOUD:
            return True  # account-wide HTTP, also for a printer on LAN (E2-Q9)
        if source in (FILE_LIST_LOCAL, FILE_LIST_UDISK):
            return self.uses_cloud and cloud.mqtt.possible
        return False

    def file_list(self, source: str) -> list[dict[str, Any]] | None:
        """The last list of ``source``; ``None`` until first fetched (G12)."""
        if source == FILE_LIST_CLOUD:
            cloud = self.runtime.cloud
            files = cloud.cloud_files if cloud is not None else None
            if files is None:
                return None
            return [
                {
                    "id": item.id,
                    "name": item.name,
                    "size_mb": item.size_mb,
                    "thumbnail": item.thumbnail,
                    "estimate_seconds": item.estimate,
                    "material": item.material,
                    "layer_height": item.layer_height,
                    "filament_mm": item.supplies_usage,
                    "dimensions": (
                        {
                            "x": item.dimensions.x,
                            "y": item.dimensions.y,
                            "z": item.dimensions.z,
                        }
                        if item.dimensions is not None
                        else None
                    ),
                }
                for item in files
            ]
        printer_cloud = self.printer.cloud
        records = (
            printer_cloud.file_lists.get(source) if printer_cloud is not None else None
        )
        if records is None:
            return None
        return [{"name": item.filename, "size_mb": item.size_mb} for item in records]

    # -- options ---------------------------------------------------------------

    def drying_preset(self, number: int) -> tuple[int, int] | None:
        """(minutes, °C) of preset ``number`` when both are > 0 (§3.11)."""
        options = self.config_entry.options
        duration = options.get(CONF_DRYING_PRESET_DURATION.format(number))
        temperature = options.get(CONF_DRYING_PRESET_TEMPERATURE.format(number))
        if not isinstance(duration, int | float) or not isinstance(
            temperature, int | float
        ):
            return None
        if duration <= 0 or temperature <= 0:
            return None
        return int(duration), int(temperature)

    @property
    def configured_presets(self) -> list[int]:
        return [n for n in DRYING_PRESETS if self.drying_preset(n) is not None]


def _colon_mac(mac: str) -> str | None:
    """``aa:bb:cc:dd:ee:ff`` for the device connection, when it is a MAC."""

    formatted = format_mac(mac)
    return formatted if formatted.count(":") == 5 else None
