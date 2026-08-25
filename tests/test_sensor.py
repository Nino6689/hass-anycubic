class TestTheErrorSensorsExist:
    """The entities issue #21 asked for, wired end to end.

    A state in the coordinator that no descriptor picks up produces no entity
    at all, and nothing else in the suite would notice.
    """

    def test_both_error_sensors_are_declared(self) -> None:
        """Checked against every list setup concatenates, not one of them.

        Which list a descriptor sits in changes nothing at runtime -- they are
        all added together and `printer_entity_type` decides where the entity
        lands -- so pinning one list would pass while the entity was missing.
        """
        from custom_components.anycubic_cloud import sensor as sensor_module

        keys = {
            description.key
            for name in dir(sensor_module)
            if name.endswith("SENSOR_TYPES")
            for description in getattr(sensor_module, name)
        }

        assert "last_error_code" in keys
        assert "last_error" in keys

    def test_they_are_named_in_every_language_shipped(self) -> None:
        """A missing translation shows a raw key as the entity name."""
        import json
        from pathlib import Path

        root = Path("custom_components/anycubic_cloud")
        files = [root / "strings.json", *sorted((root / "translations").glob("*.json"))]

        for path in files:
            sensors = json.loads(path.read_text())["entity"]["sensor"]
            for key in ("last_error_code", "last_error"):
                assert key in sensors, f"{path.name} is missing {key}"
                assert sensors[key]["name"].strip(), f"{path.name}: {key} is blank"
