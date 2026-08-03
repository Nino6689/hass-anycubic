"""Tests for the filament-remaining estimate.

The numbers in TestAgainstRealJobs are taken from real prints on a Kobra S1 +
ACE Pro, so they pin the conversion against hardware rather than against my own
arithmetic.
"""

from __future__ import annotations

import pytest

from custom_components.anycubic_cloud.filament import (
    DEFAULT_DENSITY_G_CM3,
    DEFAULT_SPOOL_WEIGHT_G,
    attribute_job_to_slots,
    density_for_material,
    mm_to_grams,
    remaining_grams,
    remaining_percent,
    slot_shares,
    spool_signature,
)


class TestDensity:
    @pytest.mark.parametrize(
        ("material", "expected"),
        [("PLA", 1.24), ("PETG", 1.27), ("petg", 1.27), ("  ABS ", 1.04)],
    )
    def test_known_materials(self, material, expected) -> None:
        assert density_for_material(material) == expected

    @pytest.mark.parametrize("unknown", [None, "", "UNOBTAINIUM"])
    def test_unknown_material_falls_back(self, unknown) -> None:
        """An unfamiliar filament should still give a usable figure."""
        assert density_for_material(unknown) == DEFAULT_DENSITY_G_CM3


class TestAgainstRealJobs:
    """Real prints: the printer's reported length vs the slicer's grams."""

    # (length in metres, grams the slicer reported, material)
    REAL_JOBS = [
        (20.51, 61.16, "PLA"),
        (31.69, 94.51, "PLA"),
        (47.68, 145.64, "PETG"),
        (27.86, 85.11, "PETG"),
        (1.86, 5.68, "PETG"),
    ]

    @pytest.mark.parametrize(("metres", "grams", "material"), REAL_JOBS)
    def test_conversion_matches_the_printer(self, metres, grams, material) -> None:
        computed = mm_to_grams(metres * 1000, material)

        assert computed == pytest.approx(grams, rel=0.005), (
            f"{material}: {metres} m should weigh ~{grams} g, got {computed:.2f} g"
        )

    def test_a_real_completed_job_end_to_end(self) -> None:
        """31.69 m sliced, 31783 mm actually extruded -- 0.3% purge overhead."""
        grams = attribute_job_to_slots(
            supplies_usage_mm=31783,
            paint_infos=[{"paint_index": 1, "filament_used": 94.51, "material_type": "PLA"}],
            slot_materials={1: "PLA"},
        )

        assert set(grams) == {1}
        # Slightly above the slice figure, because purge is included.
        assert grams[1] == pytest.approx(94.51, rel=0.02)
        assert grams[1] > 94.51

    def test_a_cancelled_job_charges_only_what_it_used(self) -> None:
        """Stopped at 13%: 2468 mm extruded against a 20.51 m estimate."""
        grams = attribute_job_to_slots(
            supplies_usage_mm=2468,
            paint_infos=[{"paint_index": 1, "filament_used": 61.16, "material_type": "PLA"}],
            slot_materials={1: "PLA"},
        )

        assert grams[1] == pytest.approx(61.16 * 0.12, rel=0.1), "a cancelled print must not be charged the full estimate"


class TestConversion:
    @pytest.mark.parametrize("nothing", [None, 0, -5])
    def test_no_length_is_no_weight(self, nothing) -> None:
        assert mm_to_grams(nothing, "PLA") == 0.0

    def test_denser_filament_weighs_more(self) -> None:
        assert mm_to_grams(1000, "PETG") > mm_to_grams(1000, "PLA")


class TestSlotShares:
    def test_single_colour_is_all_one_slot(self) -> None:
        shares = slot_shares([{"paint_index": 2, "filament_used": 50.0}])

        assert shares == {2: 1.0}

    def test_multi_colour_splits_proportionally(self) -> None:
        shares = slot_shares(
            [
                {"paint_index": 0, "filament_used": 75.0},
                {"paint_index": 1, "filament_used": 25.0},
            ]
        )

        assert shares == {0: 0.75, 1: 0.25}
        assert sum(shares.values()) == pytest.approx(1.0)

    def test_repeated_slots_are_combined(self) -> None:
        shares = slot_shares(
            [
                {"paint_index": 0, "filament_used": 30.0},
                {"paint_index": 0, "filament_used": 10.0},
                {"paint_index": 1, "filament_used": 60.0},
            ]
        )

        assert shares[0] == pytest.approx(0.4)

    @pytest.mark.parametrize(
        "junk",
        [None, [], [{}], [{"paint_index": "x", "filament_used": 5}], [{"paint_index": 0, "filament_used": 0}]],
    )
    def test_unusable_input_yields_nothing(self, junk) -> None:
        assert slot_shares(junk) == {}


class TestAttribution:
    def test_purge_waste_is_shared_across_slots(self) -> None:
        """Actual extrusion exceeds the slice figure; the excess is spread."""
        grams = attribute_job_to_slots(
            supplies_usage_mm=10000,
            paint_infos=[
                {"paint_index": 0, "filament_used": 50.0},
                {"paint_index": 1, "filament_used": 50.0},
            ],
            slot_materials={0: "PLA", 1: "PLA"},
        )

        assert grams[0] == pytest.approx(grams[1])
        assert sum(grams.values()) == pytest.approx(mm_to_grams(10000, "PLA"))

    def test_each_slot_uses_its_own_material_density(self) -> None:
        grams = attribute_job_to_slots(
            supplies_usage_mm=10000,
            paint_infos=[
                {"paint_index": 0, "filament_used": 50.0},
                {"paint_index": 1, "filament_used": 50.0},
            ],
            slot_materials={0: "PLA", 1: "PETG"},
        )

        assert grams[1] > grams[0], "PETG is denser, so the same length weighs more"

    def test_a_job_with_no_breakdown_charges_the_loaded_slot(self) -> None:
        """Prints sliced outside the cloud carry no per-slot information."""
        grams = attribute_job_to_slots(
            supplies_usage_mm=10000,
            paint_infos=None,
            slot_materials={3: "PLA"},
            loaded_slot=3,
        )

        assert set(grams) == {3}

    def test_nothing_is_charged_when_the_slot_is_unknown(self) -> None:
        """Guessing would quietly corrupt somebody's spool figure."""
        assert attribute_job_to_slots(10000, None, {}, loaded_slot=None) == {}
        assert attribute_job_to_slots(10000, None, {}, loaded_slot=-1) == {}

    @pytest.mark.parametrize("nothing", [None, 0])
    def test_a_job_that_used_nothing_is_ignored(self, nothing) -> None:
        assert attribute_job_to_slots(nothing, [{"paint_index": 0, "filament_used": 5}]) == {}


class TestSpoolSignature:
    def test_same_spool_gives_the_same_signature(self) -> None:
        slot = {"material_type": "PLA", "color_hex": "#212721", "sku": ""}

        assert spool_signature(slot) == spool_signature(dict(slot))

    @pytest.mark.parametrize(
        "change",
        [{"color_hex": "#FF0000"}, {"material_type": "PETG"}, {"sku": "AHPEBW-102"}],
    )
    def test_a_swapped_spool_is_detected(self, change) -> None:
        before = {"material_type": "PLA", "color_hex": "#212721", "sku": ""}
        after = {**before, **change}

        assert spool_signature(before) != spool_signature(after)

    @pytest.mark.parametrize("empty", [None, {}, {"material_type": "", "color_hex": "", "sku": ""}])
    def test_an_empty_slot_has_no_signature(self, empty) -> None:
        assert spool_signature(empty) is None


class TestRemaining:
    def test_typical_case(self) -> None:
        assert remaining_grams(1000, 250) == 750.0
        assert remaining_percent(1000, 250) == 75.0

    def test_never_reports_below_empty(self) -> None:
        """Over-running the estimate shouldn't show a negative spool."""
        assert remaining_grams(1000, 1200) == 0.0
        assert remaining_percent(1000, 1200) == 0.0

    def test_a_full_spool(self) -> None:
        assert remaining_grams(DEFAULT_SPOOL_WEIGHT_G, 0) == DEFAULT_SPOOL_WEIGHT_G
        assert remaining_percent(DEFAULT_SPOOL_WEIGHT_G, 0) == 100.0

    def test_an_unset_spool_weight_has_no_percentage(self) -> None:
        assert remaining_percent(0, 100) is None


class TestTrackingThroughTheCoordinator:
    """The estimate as a user experiences it: entities, persistence, resets."""

    async def test_slots_start_at_a_full_spool(self, hass, mock_entry, mock_api) -> None:
        from helpers import PRINTER_ID, setup_entry

        await setup_entry(hass, mock_entry)
        states = mock_entry.runtime_data.data["printers"][PRINTER_ID]["states"]

        assert states["ace_slot_1_filament_remaining"] == DEFAULT_SPOOL_WEIGHT_G
        assert states["ace_slot_1_filament_remaining_percent"] == 100.0

    async def test_a_finished_job_is_charged_to_the_spool(self, hass, mock_entry, mock_api) -> None:
        """31783 mm of PLA is about 94 g off the reel."""
        from unittest.mock import MagicMock, PropertyMock, patch

        from helpers import PRINTER_ID, setup_entry

        await setup_entry(hass, mock_entry)
        coordinator = mock_entry.runtime_data
        _, printer = mock_api

        project = MagicMock()
        project.id = 555
        project.slice_material_info_list = [{"paint_index": 0, "filament_used": 94.51, "material_type": "PETG"}]

        with (
            patch.object(type(printer), "latest_project", PropertyMock(return_value=project)),
            patch.object(type(printer), "latest_project_print_in_progress", PropertyMock(return_value=False)),
            patch.object(type(printer), "latest_project_supplies_usage", PropertyMock(return_value=31783)),
        ):
            await coordinator._async_update_filament()

        used = coordinator._filament_slot_state(PRINTER_ID, 0)["filament_used_g"]

        assert used == pytest.approx(96.9, rel=0.05), f"expected ~97 g of PETG, got {used}"

    async def test_the_same_job_is_not_counted_twice(self, hass, mock_entry, mock_api) -> None:
        """Polling repeatedly must not keep draining the spool."""
        from unittest.mock import MagicMock, PropertyMock, patch

        from helpers import PRINTER_ID, setup_entry

        await setup_entry(hass, mock_entry)
        coordinator = mock_entry.runtime_data
        _, printer = mock_api

        project = MagicMock()
        project.id = 777
        project.slice_material_info_list = [{"paint_index": 0, "filament_used": 50.0}]

        with (
            patch.object(type(printer), "latest_project", PropertyMock(return_value=project)),
            patch.object(type(printer), "latest_project_print_in_progress", PropertyMock(return_value=False)),
            patch.object(type(printer), "latest_project_supplies_usage", PropertyMock(return_value=10000)),
        ):
            await coordinator._async_update_filament()
            first = coordinator._filament_slot_state(PRINTER_ID, 0)["filament_used_g"]
            await coordinator._async_update_filament()
            await coordinator._async_update_filament()
            second = coordinator._filament_slot_state(PRINTER_ID, 0)["filament_used_g"]

        assert first == second > 0

    async def test_a_job_still_running_is_not_charged(self, hass, mock_entry, mock_api) -> None:
        from unittest.mock import MagicMock, PropertyMock, patch

        from helpers import PRINTER_ID, setup_entry

        await setup_entry(hass, mock_entry)
        coordinator = mock_entry.runtime_data
        _, printer = mock_api

        project = MagicMock()
        project.id = 888
        project.slice_material_info_list = [{"paint_index": 0, "filament_used": 50.0}]

        with (
            patch.object(type(printer), "latest_project", PropertyMock(return_value=project)),
            patch.object(type(printer), "latest_project_print_in_progress", PropertyMock(return_value=True)),
            patch.object(type(printer), "latest_project_supplies_usage", PropertyMock(return_value=10000)),
        ):
            await coordinator._async_update_filament()

        assert coordinator._filament_slot_state(PRINTER_ID, 0)["filament_used_g"] == 0.0

    async def test_a_swapped_spool_resets_the_count(self, hass, mock_entry, mock_api) -> None:
        from helpers import PRINTER_ID, setup_entry

        await setup_entry(hass, mock_entry)
        coordinator = mock_entry.runtime_data
        _, printer = mock_api

        state = coordinator._filament_slot_state(PRINTER_ID, 0)
        state["filament_used_g"] = 400.0

        # Pretend a different reel went into slot 1.
        state["spool_signature"] = "PLA|#000000|"
        coordinator._check_spool_changes(printer)

        assert state["filament_used_g"] == 0.0

    async def test_an_unchanged_spool_keeps_its_count(self, hass, mock_entry, mock_api) -> None:
        from helpers import PRINTER_ID, setup_entry

        await setup_entry(hass, mock_entry)
        coordinator = mock_entry.runtime_data
        _, printer = mock_api

        coordinator._check_spool_changes(printer)  # records signatures
        coordinator._filament_slot_state(PRINTER_ID, 0)["filament_used_g"] = 250.0
        coordinator._check_spool_changes(printer)  # same spools

        assert coordinator._filament_slot_state(PRINTER_ID, 0)["filament_used_g"] == 250.0

    async def test_setting_a_spool_weight_changes_what_is_left(self, hass, mock_entry, mock_api) -> None:
        from helpers import PRINTER_ID, setup_entry

        await setup_entry(hass, mock_entry)
        coordinator = mock_entry.runtime_data
        coordinator._filament_slot_state(PRINTER_ID, 0)["filament_used_g"] = 100.0

        await coordinator.async_set_spool_weight(PRINTER_ID, 0, 750)

        assert coordinator.get_spool_weight(PRINTER_ID, 0) == 750
        states = coordinator.data["printers"][PRINTER_ID]["states"]
        assert states["ace_slot_1_filament_remaining"] == 650.0

    async def test_resetting_a_spool_refills_it(self, hass, mock_entry, mock_api) -> None:
        from helpers import PRINTER_ID, setup_entry

        await setup_entry(hass, mock_entry)
        coordinator = mock_entry.runtime_data
        coordinator._filament_slot_state(PRINTER_ID, 0)["filament_used_g"] = 300.0

        await coordinator.async_reset_spool(PRINTER_ID, 0)

        states = coordinator.data["printers"][PRINTER_ID]["states"]
        assert states["ace_slot_1_filament_remaining"] == DEFAULT_SPOOL_WEIGHT_G

    async def test_the_estimate_survives_a_restart(self, hass, mock_entry, mock_api) -> None:
        """Consumption is persisted, not held only in memory."""
        from helpers import PRINTER_ID, setup_entry

        from custom_components.anycubic_cloud.helpers import async_filament_store

        await setup_entry(hass, mock_entry)
        coordinator = mock_entry.runtime_data
        coordinator._filament_slot_state(PRINTER_ID, 0)["filament_used_g"] = 123.0
        await coordinator._async_save_filament()

        stored = await async_filament_store(hass, mock_entry.entry_id).async_load()

        assert stored["printers"][str(PRINTER_ID)]["slots"]["0"]["filament_used_g"] == 123.0

    async def test_a_broken_job_record_never_breaks_the_refresh(self, hass, mock_entry, mock_api) -> None:
        """An estimate is not worth losing printer status over."""
        from unittest.mock import PropertyMock, patch

        from helpers import setup_entry

        await setup_entry(hass, mock_entry)
        coordinator = mock_entry.runtime_data
        _, printer = mock_api

        with patch.object(
            type(printer),
            "latest_project",
            PropertyMock(side_effect=Exception("malformed project")),
        ):
            await coordinator._async_update_filament()  # must not raise


class TestRemeberingReels:
    """Taking a part-used reel out and putting it back should not lose count.

    A reel is identified by colour, material and SKU -- Anycubic's own tagged
    filament carries a SKU, and third-party reels are still distinguishable by
    colour and material.
    """

    def _slot(self, material="PLA", colour="#212721", sku=""):
        return {"material_type": material, "color_hex": colour, "sku": sku}

    def _printer_with(self, mock_api, slots):
        from unittest.mock import PropertyMock, patch

        _, printer = mock_api
        return patch.object(
            type(printer),
            "primary_multi_color_box_spool_info_object",
            PropertyMock(return_value=slots),
        )

    async def test_a_reinserted_reel_keeps_its_history(self, hass, mock_entry, mock_api) -> None:
        from helpers import PRINTER_ID, setup_entry

        await setup_entry(hass, mock_entry)
        c = mock_entry.runtime_data
        original = self._slot(sku="AHPEBW-102")
        replacement = self._slot(material="PETG", colour="#FFFFFF", sku="OTHER-1")

        with self._printer_with(mock_api, [original]):
            c._check_spool_changes(mock_api[1])
            c._filament_slot_state(PRINTER_ID, 0)["filament_used_g"] = 400.0
            c._check_spool_changes(mock_api[1])  # bank it

        with self._printer_with(mock_api, [replacement]):
            c._check_spool_changes(mock_api[1])
            assert c._filament_slot_state(PRINTER_ID, 0)["filament_used_g"] == 0.0

        with self._printer_with(mock_api, [original]):
            c._check_spool_changes(mock_api[1])

        assert c._filament_slot_state(PRINTER_ID, 0)["filament_used_g"] == 400.0, (
            "putting the original reel back should restore what it had used"
        )

    async def test_a_reel_moved_to_another_slot_takes_its_history(self, hass, mock_entry, mock_api) -> None:
        from helpers import PRINTER_ID, setup_entry

        await setup_entry(hass, mock_entry)
        c = mock_entry.runtime_data
        reel = self._slot(sku="AHPEBW-102")
        other = self._slot(material="PETG", colour="#AFAFAF")

        with self._printer_with(mock_api, [reel, other]):
            c._check_spool_changes(mock_api[1])
            c._filament_slot_state(PRINTER_ID, 0)["filament_used_g"] = 250.0
            c._check_spool_changes(mock_api[1])

        # Same reel, now in slot 2.
        with self._printer_with(mock_api, [other, reel]):
            c._check_spool_changes(mock_api[1])

        assert c._filament_slot_state(PRINTER_ID, 1)["filament_used_g"] == 250.0

    async def test_a_reels_own_weight_travels_with_it(self, hass, mock_entry, mock_api) -> None:
        """A 750 g reel should stay a 750 g reel when it comes back."""
        from helpers import PRINTER_ID, setup_entry

        await setup_entry(hass, mock_entry)
        c = mock_entry.runtime_data
        reel = self._slot(sku="SMALL-750")
        other = self._slot(material="PETG", colour="#AFAFAF")

        with self._printer_with(mock_api, [reel]):
            c._check_spool_changes(mock_api[1])
            await c.async_set_spool_weight(PRINTER_ID, 0, 750)

        with self._printer_with(mock_api, [other]):
            c._check_spool_changes(mock_api[1])

        with self._printer_with(mock_api, [reel]):
            c._check_spool_changes(mock_api[1])

        assert c.get_spool_weight(PRINTER_ID, 0) == 750

    async def test_a_genuinely_new_reel_starts_full(self, hass, mock_entry, mock_api) -> None:
        from helpers import PRINTER_ID, setup_entry

        await setup_entry(hass, mock_entry)
        c = mock_entry.runtime_data

        with self._printer_with(mock_api, [self._slot()]):
            c._check_spool_changes(mock_api[1])
            c._filament_slot_state(PRINTER_ID, 0)["filament_used_g"] = 300.0
            c._check_spool_changes(mock_api[1])

        with self._printer_with(mock_api, [self._slot(colour="#FF0000")]):
            c._check_spool_changes(mock_api[1])

        assert c._filament_slot_state(PRINTER_ID, 0)["filament_used_g"] == 0.0

    async def test_reset_forgets_the_reel_too(self, hass, mock_entry, mock_api) -> None:
        """Otherwise reinserting it would drag the old figure back in."""
        from helpers import PRINTER_ID, setup_entry

        await setup_entry(hass, mock_entry)
        c = mock_entry.runtime_data
        reel = self._slot(sku="AHPEBW-102")
        other = self._slot(material="PETG", colour="#AFAFAF")

        with self._printer_with(mock_api, [reel]):
            c._check_spool_changes(mock_api[1])
            c._filament_slot_state(PRINTER_ID, 0)["filament_used_g"] = 500.0
            c._check_spool_changes(mock_api[1])
            await c.async_reset_spool(PRINTER_ID, 0)

        with self._printer_with(mock_api, [other]):
            c._check_spool_changes(mock_api[1])
        with self._printer_with(mock_api, [reel]):
            c._check_spool_changes(mock_api[1])

        assert c._filament_slot_state(PRINTER_ID, 0)["filament_used_g"] == 0.0

    async def test_two_reels_swapping_slots_both_keep_their_history(self, hass, mock_entry, mock_api) -> None:
        """Order of slots must not decide whose history survives."""
        from helpers import PRINTER_ID, setup_entry

        await setup_entry(hass, mock_entry)
        c = mock_entry.runtime_data
        a = self._slot(material="PLA", colour="#AAAAAA")
        b = self._slot(material="PETG", colour="#BBBBBB")

        with self._printer_with(mock_api, [a, b]):
            c._check_spool_changes(mock_api[1])
            c._filament_slot_state(PRINTER_ID, 0)["filament_used_g"] = 100.0
            c._filament_slot_state(PRINTER_ID, 1)["filament_used_g"] = 700.0

        # The two reels change places.
        with self._printer_with(mock_api, [b, a]):
            c._check_spool_changes(mock_api[1])

        assert c._filament_slot_state(PRINTER_ID, 0)["filament_used_g"] == 700.0
        assert c._filament_slot_state(PRINTER_ID, 1)["filament_used_g"] == 100.0


class TestPrintsStartedAtThePrinter:
    """Jobs started at the printer's own screen carry no per-slot breakdown,
    and loaded_slot reverts to -1 the moment the job ends. Without capturing it
    mid-print, those jobs are unattributable and silently charge nothing —
    which is most real printing.
    """

    def _project(self, job_id, paint_infos=None):
        from unittest.mock import MagicMock

        project = MagicMock()
        project.id = job_id
        project.slice_material_info_list = paint_infos
        return project

    async def test_a_screen_started_job_is_charged_via_the_feeding_slot(self, hass, mock_entry, mock_api) -> None:
        from unittest.mock import PropertyMock, patch

        from helpers import PRINTER_ID, setup_entry

        await setup_entry(hass, mock_entry)
        c = mock_entry.runtime_data
        _, printer = mock_api

        # Mid-print: slot 3 is feeding, and there is no breakdown to rely on.
        with (
            patch.object(type(printer), "latest_project_print_in_progress", PropertyMock(return_value=True)),
            patch.object(type(printer), "primary_multi_color_box_loaded_slot", PropertyMock(return_value=2)),
        ):
            await c._async_update_filament()

        # Job finished: loaded_slot has already reverted to -1.
        with (
            patch.object(type(printer), "latest_project", PropertyMock(return_value=self._project(999))),
            patch.object(type(printer), "latest_project_print_in_progress", PropertyMock(return_value=False)),
            patch.object(type(printer), "latest_project_supplies_usage", PropertyMock(return_value=10000)),
            patch.object(type(printer), "primary_multi_color_box_loaded_slot", PropertyMock(return_value=-1)),
        ):
            await c._async_update_filament()

        used = c._filament_slot_state(PRINTER_ID, 2)["filament_used_g"]
        assert used > 0, "a screen-started job must still come off the spool"

    async def test_the_remembered_slot_does_not_leak_into_the_next_job(self, hass, mock_entry, mock_api) -> None:
        """Otherwise every later job would be charged to that same spool."""
        from unittest.mock import PropertyMock, patch

        from helpers import PRINTER_ID, setup_entry

        await setup_entry(hass, mock_entry)
        c = mock_entry.runtime_data
        _, printer = mock_api

        with (
            patch.object(type(printer), "latest_project_print_in_progress", PropertyMock(return_value=True)),
            patch.object(type(printer), "primary_multi_color_box_loaded_slot", PropertyMock(return_value=2)),
        ):
            await c._async_update_filament()

        with (
            patch.object(type(printer), "latest_project", PropertyMock(return_value=self._project(1001))),
            patch.object(type(printer), "latest_project_print_in_progress", PropertyMock(return_value=False)),
            patch.object(type(printer), "latest_project_supplies_usage", PropertyMock(return_value=10000)),
            patch.object(type(printer), "primary_multi_color_box_loaded_slot", PropertyMock(return_value=-1)),
        ):
            await c._async_update_filament()
            first = c._filament_slot_state(PRINTER_ID, 2)["filament_used_g"]

            # A second, unrelated job with nothing to attribute it to.
            with patch.object(type(printer), "latest_project", PropertyMock(return_value=self._project(1002))):
                await c._async_update_filament()

        assert c._filament_slot_state(PRINTER_ID, 2)["filament_used_g"] == first

    async def test_an_in_progress_job_is_not_charged_early(self, hass, mock_entry, mock_api) -> None:
        from unittest.mock import PropertyMock, patch

        from helpers import PRINTER_ID, setup_entry

        await setup_entry(hass, mock_entry)
        c = mock_entry.runtime_data
        _, printer = mock_api

        with (
            patch.object(type(printer), "latest_project", PropertyMock(return_value=self._project(2000))),
            patch.object(type(printer), "latest_project_print_in_progress", PropertyMock(return_value=True)),
            patch.object(type(printer), "latest_project_supplies_usage", PropertyMock(return_value=10000)),
            patch.object(type(printer), "primary_multi_color_box_loaded_slot", PropertyMock(return_value=2)),
        ):
            await c._async_update_filament()

        assert c._filament_slot_state(PRINTER_ID, 2)["filament_used_g"] == 0.0


class TestSingleMaterialAttribution:
    """`paint_index` numbers materials within a job, not ACE slots.

    Caught by watching a real print rather than by reading the code: a
    single-material job fed from slot 3 reported `paint_index: 0`, and the
    whole 51 g was charged to slot 1. Every single-material print was affected,
    for every user, whenever the feeding slot wasn't the first one.
    """

    # Captured verbatim from job 110832999 on a Kobra S1.
    JOB = [{"filament_used": 49.76, "material_type": "PLA", "paint_index": 0}]
    USAGE_MM = 16727

    def test_it_charges_the_slot_that_actually_fed_the_print(self):
        per_slot = attribute_job_to_slots(
            supplies_usage_mm=self.USAGE_MM,
            paint_infos=self.JOB,
            slot_materials={2: "PLA+"},
            loaded_slot=2,
        )

        assert list(per_slot) == [2]

    def test_it_no_longer_charges_slot_zero(self):
        """The exact regression: paint_index 0 read as ACE slot 1."""
        per_slot = attribute_job_to_slots(
            self.USAGE_MM, self.JOB, {2: "PLA+"}, loaded_slot=2
        )

        assert 0 not in per_slot

    def test_the_amount_matches_what_the_printer_reported(self):
        """16727 mm of PLA is ~50 g, and the slicer independently said 49.76."""
        per_slot = attribute_job_to_slots(
            self.USAGE_MM, self.JOB, {2: "PLA+"}, loaded_slot=2
        )

        assert per_slot[2] == pytest.approx(49.76, abs=1.5)

    def test_without_a_known_slot_it_still_falls_back_to_paint_index(self):
        """A guess beats losing the usage entirely."""
        per_slot = attribute_job_to_slots(self.USAGE_MM, self.JOB, {}, loaded_slot=None)

        assert list(per_slot) == [0]

    def test_multi_material_still_apportions_by_paint_index(self):
        """With several materials the proportions are the useful part."""
        infos = [
            {"filament_used": 30.0, "paint_index": 0},
            {"filament_used": 10.0, "paint_index": 2},
        ]

        per_slot = attribute_job_to_slots(10000, infos, {}, loaded_slot=1)

        assert set(per_slot) == {0, 2}
        assert per_slot[0] == pytest.approx(per_slot[2] * 3, rel=0.01)
