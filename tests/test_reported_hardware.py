"""Hardware only some printers have, and a fan that was on the wrong device.

Issue #44: a Kobra S1 Max owner asked for the chamber temperature and the ACE
humidity, and could not find the enclosure fan. The chamber reading was already
parsed (the S1 Max's diagnostics carried a real 32 °C) but never became an
entity, because the maintainer's Kobra S1 has no chamber sensor and sends zero.
The enclosure fan was there, filed under the ACE: on the Kobra S1 it ran at
60-80 % through a print while the ACE never dried, so it is the printer's.
"""

from __future__ import annotations

import json
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, PropertyMock, patch

from anycubic_cloud_api.const.enums import AnycubicPrinterMaterialType

from custom_components.anycubic_cloud import sensor as sensor_module
from custom_components.anycubic_cloud.const import (
    CONF_PRINTER_ID_LIST,
    PrinterEntityType,
)
from custom_components.anycubic_cloud.coordinator import (
    AnycubicCloudDataUpdateCoordinator,
)

REPORTED_ONLY = {
    "box_fan_level": PrinterEntityType.FDM,
    "chamber_temperature": PrinterEntityType.FDM,
    "ace_humidity": PrinterEntityType.ACE_PRIMARY,
    "secondary_ace_humidity": PrinterEntityType.ACE_SECONDARY,
}


def _descriptions() -> dict[str, sensor_module.AnycubicSensorEntityDescription]:
    return {
        description.key: description
        for name in dir(sensor_module)
        if name.endswith("SENSOR_TYPES")
        for description in getattr(sensor_module, name)
    }


class TestTheDescriptors:
    def test_each_lands_on_the_device_it_belongs_to(self) -> None:
        descriptions = _descriptions()

        for key, entity_type in REPORTED_ONLY.items():
            assert key in descriptions, f"{key} is not declared"
            assert descriptions[key].printer_entity_type == entity_type, key
            assert descriptions[key].requires_reported_value, key

    def test_the_fan_is_declared_once(self) -> None:
        """Moving it must not leave a copy behind on the ACE."""
        keys = [
            description.key
            for name in dir(sensor_module)
            if name.endswith("SENSOR_TYPES")
            for description in getattr(sensor_module, name)
        ]

        assert keys.count("box_fan_level") == 1

    def test_they_are_named_in_every_language_shipped(self) -> None:
        root = Path("custom_components/anycubic_cloud")
        files = [root / "strings.json", *sorted((root / "translations").glob("*.json"))]

        for path in files:
            entities = json.loads(path.read_text())["entity"]
            for key in REPORTED_ONLY:
                assert entities["sensor"][key]["name"].strip(), f"{path.name}: {key}"
            assert entities["number"]["set_box_fan_level"]["name"].strip(), path.name
            # The fan is no longer described as part of the ACE.
            assert "ACE" not in entities["sensor"]["box_fan_level"]["name"], path.name


class TestZeroMeansNoSensor:
    """The states the entities read, built from the captured Kobra S1."""

    async def test_a_printer_without_the_sensors_reports_nothing(self, hass, mock_entry, mock_api) -> None:
        from helpers import setup_entry

        await setup_entry(hass, mock_entry)
        coordinator = mock_entry.runtime_data
        _api, printer = mock_api

        with (
            patch.object(type(printer), "chamber_temperature", PropertyMock(return_value=0)),
            patch.object(coordinator, "_poll_printer_capabilities", AsyncMock()),
        ):
            states = coordinator._build_printer_dict(printer)["states"]

        # The capture's ACE Pro sends humidity 0, like the S1 sends a chamber 0.
        assert states["chamber_temperature"] is None
        assert states["ace_humidity"] is None

    async def test_real_readings_come_through(self, hass, mock_entry, mock_api) -> None:
        from helpers import setup_entry

        await setup_entry(hass, mock_entry)
        coordinator = mock_entry.runtime_data
        _api, printer = mock_api
        box = printer.primary_multi_color_box

        with (
            patch.object(type(printer), "chamber_temperature", PropertyMock(return_value=32)),
            patch.object(type(box), "humidity", PropertyMock(return_value=58.0)),
            patch.object(coordinator, "_poll_printer_capabilities", AsyncMock()),
        ):
            states = coordinator._build_printer_dict(printer)["states"]

        assert states["chamber_temperature"] == 32
        assert states["ace_humidity"] == 58.0
        # One box: the second has nothing to report.
        assert states["secondary_ace_humidity"] is None


class TestCreatedOnTheFirstReading:
    """Not up front, where every printer without the sensor gets a dead entity."""

    def _coordinator(self, states: dict) -> SimpleNamespace:
        listeners: list = []
        stub = SimpleNamespace(
            entry=MagicMock(data={CONF_PRINTER_ID_LIST: [1]}, options={}),
            _unregistered_descriptors={},
            data={
                "printers": {
                    1: {
                        "states": {
                            "connected_ace_units": 1,
                            "supports_function_multi_color_box": True,
                            **states,
                        },
                        "attributes": {
                            "current_status": {
                                "material_type": AnycubicPrinterMaterialType.FILAMENT,
                            },
                        },
                    },
                },
            },
            hass=MagicMock(),
            listeners=listeners,
        )
        stub.async_add_listener = lambda update: (listeners.append(update), lambda: None)[1]
        return stub

    def test_the_entity_waits_for_a_value_then_appears(self) -> None:
        descriptions = _descriptions()
        chamber = descriptions["chamber_temperature"]
        nozzle = descriptions["curr_nozzle_temp"]
        stub = self._coordinator({"chamber_temperature": None, "curr_nozzle_temp": 210})
        added: list[str] = []

        AnycubicCloudDataUpdateCoordinator.add_entities_for_seen_printers(
            stub,
            async_add_entities=lambda entities: added.extend(entities),
            entity_constructor=lambda _hass, _coordinator, _printer_id, description: description.key,
            platform="sensor",
            available_descriptors=[chamber, nozzle],
        )

        assert added == ["curr_nozzle_temp"]

        stub.data["printers"][1]["states"]["chamber_temperature"] = 32
        stub.listeners[0]()

        assert added == ["curr_nozzle_temp", "chamber_temperature"]
        assert stub._unregistered_descriptors == {}
