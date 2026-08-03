<h1 align="center">Anycubic Cloud for Home Assistant</h1>

<p align="center">
  Monitor and control your <b>Anycubic Kobra</b> or <b>Photon</b> 3D printer from Home Assistant,<br>
  with sub-second live updates over MQTT.
</p>

<p align="center">
  <a href="https://github.com/Nino6689/hass-anycubic_cloud/releases/latest"><img src="https://img.shields.io/github/v/release/Nino6689/hass-anycubic_cloud?style=for-the-badge&color=41BDF5" alt="Release"></a>
  <a href="https://github.com/hacs/default/pull/7780"><img src="https://img.shields.io/badge/HACS-Default-41BDF5?style=for-the-badge&logo=home-assistant&logoColor=white" alt="In the HACS default catalog"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/licence-GPL_3.0-blue?style=for-the-badge" alt="Licence"></a>
  <a href="https://buymeacoffee.com/nino6689"><img src="https://img.shields.io/badge/buy_me_a_coffee-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black" alt="Buy Me A Coffee"></a>
</p>

---

## What you get

|  |  |
|---|---|
| 🌡️ **Live telemetry** | Nozzle, bed and ACE temperatures, fan speeds, print speed — updating every second while printing |
| 📊 **Job tracking** | Progress, current and total layers, elapsed and remaining time, and a real timestamp ETA |
| 🧵 **Per-slot filament** | Every ACE slot as its own entity, showing material **and colour**, with a spool-shaped icon |
| 💡 **Printer light** | A proper light entity — on, off and brightness |
| 🎮 **Controls** | Pause, resume, cancel, drying, run-out refill and file management |
| 🖼️ **Live preview** | The job preview image, as a camera-style entity |
| 📈 **Lifetime stats** | Total filament used, total print time and print count |
| 📷 **Camera** | The printer's own video stream, straight off the printer — [local connection](#5-optional-talk-to-the-printer-directly) only |
| 🔌 **Cloud or local** | Talk to the printer through Anycubic's cloud *or* directly on your network, switchable in one place |
| 🔐 **Verified connection** | TLS to Anycubic's cloud is properly verified — see [Security](#-security) |

Around **60 entities** per printer, across two devices: the printer, and the ACE as a child device.

---

## Project status

**This is the maintained continuation of Anycubic Cloud for Home Assistant**, listed in the
HACS default catalog since August 2026 — install it by searching HACS, no custom repository
needed.

It began as a fork of [WaresWichall/hass-anycubic_cloud](https://github.com/WaresWichall/hass-anycubic_cloud),
which did all the original work and deserves the credit for it. Upstream's last release was
December 2024 and the author
[stepped back from the project](https://github.com/WaresWichall/hass-anycubic_cloud/issues/33).

> ### Still on upstream v0.2.2?
>
> **It no longer works on current Home Assistant.** It fails at setup with
> `HTTP 500 "Server got itself in trouble"` — a strict `paho-mqtt==1.6.1` pin against the 2.x
> that Core now ships. Home Assistant's analytics still show most Anycubic Cloud installs on
> that version, quietly broken.
>
> Install this from HACS and set it up as normal. Your entity ids are preserved.

What maintenance means here:

- **Compatibility with current HA Core** — the paho-mqtt 2.x / Python 3.13+ breakage is fixed, and future Core breakage is the priority when it happens
- **Issue triage** — bugs get looked at, reproduced where possible, and answered
- **Security fixes** — see [Security](#-security)
- **Upstream first, still** — if @WaresWichall picks the project back up, everything here is theirs to take and this fork happily retires

Not every request becomes a feature. Things needing hardware I don't have, or that Anycubic's
API doesn't expose, are recorded honestly in the [roadmap](#-roadmap) rather than promised.

### Hardware and testing scope

> I own a **Kobra S1 with an ACE Pro**. That is the only hardware every change here is actually
> tested against — the TLS work, the MQTT connection, the entities, the panel.

Everything else in the [supported printers](#supported-printers) list works because upstream or
the community reported it working, not because I verified it. I'll take care not to break those
models, but I can't confirm their behaviour first-hand.

So **bug reports and test results for other models are genuinely useful** — you're my only
visibility into that hardware. And if Anycubic, or anyone with a spare machine, wants a model
properly supported rather than supported-by-inference, a donated printer means it gets tested
for real. Until then I'd rather be upfront about the gap than imply coverage I don't have.

---

## Contents

- [Quick start](#quick-start)
- [Supported printers](#supported-printers)
- [1. Install](#1-install)
- [2. Get an auth token](#2-get-an-auth-token) — [Slicer](#option-a--slicer-token-recommended) · [Web](#option-b--web-token-easiest) · [Android](#option-c--android-token-advanced)
- [3. Add it to Home Assistant](#3-add-it-to-home-assistant)
- [4. Choose a connect mode](#4-choose-a-connect-mode)
- [5. Talk to the printer directly *(LAN Mode)*](#5-optional-talk-to-the-printer-directly)
- [Entities](#entities)
- [🧵 Filament and the ACE](#-filament-and-the-ace)
- [Filament remaining *(estimated)*](#filament-remaining-estimated)
- [📱 ReSpool — write your own spool tags *(beta)*](#-respool--an-ios-app-for-writing-spool-tags-beta)
- [Automation examples](#automation-examples)
- [Troubleshooting](#troubleshooting)
- [🔐 Security](#-security)
- [📦 Changes from upstream](#-changes-from-upstream)
- [🧭 Roadmap](#-roadmap)
- [Credits](#credits)

---

## Quick start

Know your way around HACS? Here's the speed run:

[![Open this repository in HACS.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=Nino6689&repository=hass-anycubic_cloud&category=integration)

1. Click the button above (or search HACS for **Anycubic Cloud**) → **Download**
2. Restart Home Assistant
3. Grab a token — the [slicer method](#option-a--slicer-token-recommended) (recommended) or the [web console snippet](#option-b--web-token-easiest)
4. **Settings → Devices & services → Add integration** → **Anycubic Cloud** → paste the token
5. Select your printer

Otherwise the step-by-step below explains everything.

---

## Supported printers

**✅ Verified here** — the hardware I own and test against:

- **Kobra S1**, including the **ACE Pro**

**📣 Reported working** by upstream and the community — these should work, but I can't test them:

| | |
|---|---|
| Kobra 3 Combo | Kobra 2 / 2 Max / 2 Pro |
| Photon Mono M5s *(basic)* | M7 Pro *(basic)* |

Tried a model that isn't listed, or one of the "reported" ones and it misbehaved?
[Open an issue](https://github.com/Nino6689/hass-anycubic_cloud/issues) — including for the ones
that *do* work, so this list can rest on something firmer than inference.

---

## 1. Install

### Via HACS (recommended)

This integration is in the **HACS default catalog**, so no custom repository is needed:

[![Open this repository in HACS.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=Nino6689&repository=hass-anycubic_cloud&category=integration)

1. Click the button above, or open **HACS** and search for **Anycubic Cloud**
2. **Download**
3. **Restart Home Assistant**

<details>
<summary>Not showing up in HACS yet?</summary>

HACS reads a data feed that is rebuilt periodically, so a newly added repository can take up to
a day or so to become searchable. In the meantime, add it manually:

**HACS** → **⋮** (top right) → **Custom repositories** → add
`https://github.com/Nino6689/hass-anycubic_cloud` with category **Integration**.

You can remove the custom entry once it appears in the catalog on its own.
</details>

### Manually

Grab the latest [release zip](https://github.com/Nino6689/hass-anycubic_cloud/releases/latest),
extract `custom_components/anycubic_cloud/` into your HA `config/custom_components/` directory,
and restart.

---

## 2. Get an auth token

This integration **never asks for your Anycubic email or password** — Home Assistant can't
perform the Anycubic OAuth flow with its captchas and 2FA. Instead you take a **token** from
somewhere you're already signed in, and paste it in.

Pick **one** of the three options.

> 💡 **Want the one‑click way?** The [`tools/`](tools/README.md) folder has a no‑terminal
> browser bookmarklet and double‑click helpers for macOS and Windows that grab the token for
> you and explain, in plain language, exactly what they do. If terminals make you nervous,
> start there.

### Option A — Slicer token *(recommended)*

> ⚡ **Why this one?** Anycubic blocks MQTT for tokens taken from the website. Only slicer tokens
> give real-time status — temperatures, progress and layers updating every second instead of
> every minute — **plus the control buttons**.

You'll need [Anycubic Slicer Next](https://www.anycubic.com/pages/anycubic-slicer-next), signed
in once via **Settings → Account**.

<details>
<summary><b>A1. If your slicer config is plain text</b> — older builds</summary>

<br>

Sign in once, **quit the slicer**, then run:

**macOS** — copies the token straight to your clipboard, nothing to download:

```bash
plutil -extract anycubic_cloud.access_token raw -o - ~/Library/Application\ Support/AnycubicSlicerNext/AnycubicSlicerNext.conf | tr -d '\n' | pbcopy && echo "Token copied to clipboard"
```

`plutil` is part of macOS, so this works on a clean machine with nothing installed.

<details>
<summary>Prefer a double-click icon?</summary>

<br>

Run this once to put a working helper on your Desktop:

```bash
curl -fsSL https://raw.githubusercontent.com/Nino6689/hass-anycubic_cloud/main/tools/get-anycubic-token-macos.command -o ~/Desktop/AnycubicToken.command && chmod +x ~/Desktop/AnycubicToken.command && xattr -c ~/Desktop/AnycubicToken.command && echo "Saved to your Desktop"
```

Double-click `AnycubicToken.command` any time to refresh your token.

The `chmod` and `xattr` parts matter: GitHub does not preserve the executable
flag, and anything downloaded through a browser is quarantined by Gatekeeper.
Without them, double-clicking just opens the file in TextEdit — which is
exactly what happens if you download it by hand.

</details>

**Windows** *(PowerShell)*

```powershell
$conf = "$env:APPDATA\AnycubicSlicerNext\AnycubicSlicerNext.conf"
(Get-Content $conf | ConvertFrom-Json).anycubic_cloud.access_token
```

You'll get a long string (~1200 characters) starting with `eyJ…`. Copy the whole thing.

</details>

<details>
<summary><b>A2. If your slicer config is encrypted</b> — newer builds ⚠️</summary>

<br>

Newer Slicer Next builds **encrypt the `anycubic_cloud` section**. If the command above returns
nothing, or the file looks like this:

```json
"anycubic_cloud": {
    "AbC1dEf2GhI3jK4l5MnO6w==": true,
    "Zy9XwV8uTs7RqP6oNmL5kA==": "QWxhYmFzZTY0ZW5jcnlwdGVkdG9rZW4uLi4="
}
```

…then the key names and the token are AES-encrypted and base64-encoded. The key lives inside the
slicer's `common_encrypt.dll` and isn't exported, so **the file cannot be decrypted** — there is
nothing this integration can do to read it. Pasting the encrypted blob will correctly be
rejected as invalid authentication.

The slicer does decrypt the token into memory to sign in, so you can recover it from the running
process. This is a standard Windows feature and nothing leaves your machine. Credit to
[@simo26246 in upstream #67](https://github.com/WaresWichall/hass-anycubic_cloud/issues/67).

1. Open Slicer Next and make sure it's **signed in**
2. **Ctrl+Shift+Esc** → **Details** tab → right-click `AnycubicSlicerNext.exe` (the larger of the two) → **Create dump file**
3. Run this in PowerShell — **not as Administrator**, which fails with an out-of-memory error:

   ```powershell
   $dmp = Get-ChildItem "$env:TEMP\AnycubicSlicerNext*.DMP" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
   $b = [IO.File]::ReadAllBytes($dmp.FullName)
   $rx = [regex]'eyJhbGciOi[A-Za-z0-9_-]+.[A-Za-z0-9_-]+.[A-Za-z0-9_-]+'
   $set = @{}
   foreach($e in @([Text.Encoding]::GetEncoding(28591), [Text.Encoding]::Unicode)){
   foreach($m in $rx.Matches($e.GetString($b))){ $set[$m.Value] = 1 }
   }
   $tok = $set.Keys | Sort-Object Length -Descending | Select-Object -First 1
   Set-Clipboard $tok
   "Copied slicer token, length $($tok.Length). Paste into Home Assistant (Slicer mode)."
   ```

4. Paste into Home Assistant using auth mode **Slicer**

> 🔐 **Delete the `.DMP` file afterwards** — it contains all your live tokens in clear text. Only
> ever do this for your own account, on your own machine.

</details>

Tokens last **90 days** (verified from the token's own expiry claim) and may rotate. Home
Assistant warns you in a Repair notice a fortnight before yours lapses, so you get a chance to
replace it before anything breaks — just repeat the steps. Running the slicer and HA signed in at the same time works fine.

### Option B — Web token *(easiest)*

> ⚠️ **Trade-off:** web tokens are polling only — state updates every ~60 seconds instead of in
> real time, and the control buttons won't work. Fine for "is it printing?", not for watching the
> temperature curve.

1. Open <https://cloud-universe.anycubic.com/file> and sign in
2. Open **Developer Tools** (F12) → **Console**
3. Run:

   ```js
   window.localStorage["XX-Token"]
   ```

4. Copy the value **without the surrounding quotes** (~238 characters)

> Getting `undefined`? You're on a freshly-opened tab that redirected through OAuth. Read it from
> the tab you're **already signed in on**.

### Option C — Android token *(advanced)*

Requires extracting a token *and* a `device_id` from the Android app's network traffic, via
[mitmproxy](https://mitmproxy.org/) or [HTTP Toolkit](https://httptoolkit.com/). Considerably
more involved, and not recommended without a specific reason.

---

## 3. Add it to Home Assistant

1. **Settings → Devices & services → + Add integration**
2. Search **Anycubic Cloud**
3. Pick the **auth mode** matching your token (Slicer / Web / Android)
4. Paste the token — and **Device ID** too, for Android
5. Choose which printers to track

You'll get the printer device, the ACE as a child device, and a sidebar panel with a printer card.

---

## 4. Choose a connect mode

MQTT is what gives sub-second updates. Staying connected permanently puts a little extra load on
Anycubic's broker, so you choose when it's on:
**Settings → Devices & services → Anycubic Cloud → Configure**.

| Mode | MQTT connects |
|---|---|
| **Printing only** *(default)* | While a print is running |
| **Printing & drying** | …and while the ACE is drying filament |
| **Device online** | Whenever the printer is powered on |
| **Always** | All the time — best for watching an idle printer |
| **Never** | Polling only, like web auth |

**Need it on right now?** Turn on `switch.<printer>_manual_mqtt_connection_enabled`, press
`button.<printer>_refresh_mqtt_connection`, and `binary_sensor.<printer>_mqtt_connection_active`
should come on within 5–15 seconds.

---

## 5. Optional: talk to the printer directly

The printer can run its own MQTT broker on your network, so Home Assistant talks to it without
Anycubic's cloud in the middle. Turn it on under
**Settings → Devices & services → Anycubic Cloud → Configure → Local connection (LAN Mode)**.

> [!IMPORTANT]
> **The printer does one or the other, never both.** Switching LAN Mode on at the printer
> (*Settings → Network → LAN Mode*) drops its cloud connection, and switching it back off drops the
> local one. This isn't a choice the integration makes — it's how the firmware works.

**Switch LAN Mode on at the printer first**, then enable it here and give the printer's address. The
handshake runs before the setting is saved, so if the printer is still in cloud mode you're told so
rather than ending up with nothing connected. Give the printer a fixed address on your router while
you're there.

| | Cloud | Local |
|---|---|---|
| Works without internet | ✗ | ✓ |
| Survives Anycubic changing their API | ✗ | ✓ |
| Update latency | Sub-second while MQTT is connected | Polled every few seconds |
| **Filament tracking** | ✓ | ✓ — the printer reports the same figure locally |
| Cloud file library, uploads, print history | ✓ | ✗ |
| **Camera** | ✗ | ✓ |
| **AI / foreign-object detection state** | ✗ | ✓ |
| Capability map in diagnostics | ✗ | ✓ |

**Switching back and forth** is a single page: **Settings → Devices & services → Anycubic Cloud →
⋯ → Reconfigure → Connection**. Change it at the printer first, then match it here. Your entity IDs
are the same in both modes, so history and automations carry across.

### Where the local connection is up to

Confirmed end to end on a Kobra S1 running firmware 2.7.2.7. The handshake, the local broker, ACE
data, the capability map and the camera are all proved against real hardware.

**It is not yet a complete replacement for the cloud connection.** Being straight about which:

| Working on a local-only printer | Not yet |
|---|---|
| Setup with the cloud reporting the printer as deleted | Temperature, job and ACE **entities** — the data is read correctly and appears in diagnostics, but entity creation is still gated behind a cloud-only field |
| Camera, chamber light, online status | Cloud file library, uploads, print history *(cloud-only by nature)* |
| Diagnostics, including the capability map | |

So today the toggle is for **"cloud works and I want local as well"**, not yet for running local-only
and expecting every entity. That last gap is the next job, and it's tracked in the
[roadmap](#-roadmap).

> [!NOTE]
> Other models in the Kobra 3 / S1 family speak the same protocol but have not been tried —
> [a report either way](https://github.com/Nino6689/hass-anycubic_cloud/issues/new/choose) is genuinely
> useful.

**Want local only, with no Anycubic account at all?** That's a different shape of thing, and
[chrisfore/anycubic_ha_local](https://github.com/chrisfore/anycubic_ha_local) does it properly —
it's local-first by design, needs no cloud login, and documented the handshake this feature is built
on. Worth a look if the cloud side is of no interest to you.

---

## Entities

All names below are prefixed with your printer, e.g. `sensor.anycubic_kobra_s1_job_progress`.

<details open>
<summary><b>🖨️ Printer device</b></summary>

<br>

| Group | Entities |
|---|---|
| **Job** | `job_name`, `job_state`, `job_progress`, `job_current_layer`, `job_total_layers`, `job_time_elapsed`, `job_time_remaining`, `job_eta`, `job_filament_used`, `job_z_thickness`, `job_speed_mode` |
| **Status** | `current_status`, `printer_online`, `is_busy`, `is_available`, `job_in_progress`, `job_complete`, `job_failed`, `job_paused`, `mqtt_connection_active` |
| **Temperatures** | `nozzle_temperature`, `hotbed_temperature`, `target_nozzle_temperature`, `target_hotbed_temperature` |
| **Speeds & fans** | `print_speed`, `fan_speed`, `auxiliary_fan_speed` |
| **Lifetime** | `total_material_used` (kg), `total_print_time`, `total_print_count` |
| **Controls** | `printer_light`, `pause_print`, `resume_print`, `cancel_print`, `manual_mqtt_connection_enabled`, `refresh_mqtt_connection` |
| **Files** | `file_list_local`, `file_list_usb_disk`, `file_list_cloud` — each reports a **file count**, with the listing in its attributes — and their request buttons |
| **Position** | `head_position_x`, `head_position_y`, `head_position_z`, and a `request_head_position` button. The printer only reports when asked |
| **External spool** | `external_spool_material`, `external_spool_loaded` — for printers fed from a single external holder rather than the ACE |
| **Other** | `job_preview` image, `printer_firmware` update |

</details>

<details open>
<summary><b>🧵 ACE device</b></summary>

<br>

| Group | Entities |
|---|---|
| **Slots** | `ace_slot_1` – `ace_slot_4`, `ace_loaded_slot` |
| **Filament left** | `ace_slot_N_filament_remaining`, `ace_slot_N_filament_remaining_percent`, `ace_slot_N_spool_weight`, `ace_slot_N_reset_spool` — see [Filament remaining](#filament-remaining-estimated) |
| **Unit** | `ace_current_temperature`, `ace_box_fan_level`, `ace_spools`, `ace_run_out_refill`, `refresh_ace_spools`, `ace_firmware` update |
| **Drying** | `drying_active`, `drying_target_temperature`, `drying_remaining_time`, `drying_total_duration`, `drying_stop` |

</details>

Temperature and duration sensors carry the right device classes, so they graph properly and
follow your °C / °F preference. `job_eta` is a genuine **timestamp** entity, so it renders as
local time and works directly in automations.

Anything marked as reported only on request, along with filament-remaining and the external
holder, is **disabled by default** — enable what you want in **Settings → Entities**.

There are also [actions](custom_components/anycubic_cloud/services.yaml) for printing, drying and
file management, including **`print_local_file`** to start a file the printer already holds
without re-uploading it:

```yaml
action: anycubic_cloud.print_local_file
data:
  config_entry: <your entry>
  printer_id: <your printer>
  filename: my_model_plate(01)_PLA_0.2_1h52m.gcode.3mf
```

It refuses if a job is already running, rather than interrupting or queueing behind it.

> 💡 File listings are large — around 17 KB of attributes each — and have no historical value.
> Worth excluding from the recorder:
> ```yaml
> recorder:
>   exclude:
>     entity_globs:
>       - sensor.*_file_list_*
> ```

---

## 🧵 Filament and the ACE

The ACE appears as its **own device**, linked to the printer rather than buried inside it — so
its spools, drying and fan entities stay together, and a second unit has somewhere to live:

```
Anycubic Kobra S1
└── Anycubic Kobra S1 ACE Pro      ← own firmware version, own entities
```

The name comes from the model id the unit reports, so an ACE Pro says "ACE Pro" rather than a
generic label.

### Every slot, with its colour

Each slot is a sensor whose **state is the material type**, with the loaded filament colour drawn
as a **spool-shaped icon**. No custom card, no template — it just shows up:

| Entity | Icon | State |
|---|---|---|
| `ace_slot_1` | 🩶 grey spool | `PETG` |
| `ace_slot_2` | 🖤 black spool | `PLA` |
| `ace_slot_3` | 💛 yellow spool | `PLA` |
| `ace_slot_4` | 🤍 white spool | `PETG` |

Each slot carries the detail as attributes:

| Attribute | Example | Notes |
|---|---|---|
| `color_hex` | `#FFEC3D` | The primary colour |
| `colors_hex` | `['#FFEC3D']` | **Every** colour on the spool |
| `is_multi_color` | `false` | True for gradient / dual-colour filament |
| `sku` | `AHPEBW-102` | Anycubic product code, where the spool reports one |
| `spool_loaded` | `true` | Whether a spool is present |
| `edit_status` | `0` | Meaning not yet confirmed — see [roadmap](#-roadmap) |

> **Multi-colour spools are handled properly.** Anycubic reports the full colour list, but only
> the first entry was ever visible before. A silk or gradient spool now shows every colour, and
> the icon renders them as bands.

Press **Refresh ACE Spools** (`button.<printer>_refresh_ace_spools`) to re-request slot data from
the unit — the equivalent of the sync button in Anycubic Slicer Next.

### Unit telemetry

`ace_spools` carries a `box_info` attribute with the unit's humidity, feed status, temperature,
model and auto-feed state.

> ℹ️ On a Kobra S1's ACE Pro, `humidity` and per-slot `consumables_percent` both report `0`, so
> that hardware most likely doesn't have those sensors. They're exposed in case another unit
> populates them.

---

## Automation examples

**What's loaded in slot 3, and what colour**

```jinja
{{ states('sensor.anycubic_kobra_s1_ace_slot_3') }}
{{ state_attr('sensor.anycubic_kobra_s1_ace_slot_3', 'color_hex') }}
```

**Which spool is currently feeding** — reads `unavailable` when nothing is loaded

```jinja
{{ states('sensor.anycubic_kobra_s1_ace_loaded_slot') }}
```

**Print finished — turn the light off after 10 minutes**

```yaml
automation:
  - alias: Anycubic light off after print
    triggers:
      - trigger: state
        entity_id: binary_sensor.anycubic_kobra_s1_job_complete
        to: "on"
        for: "00:10:00"
    actions:
      - action: light.turn_off
        target:
          entity_id: light.anycubic_kobra_s1_printer_light
```

**Notify with the ETA when a print actually starts**

```yaml
automation:
  - alias: Anycubic print started
    triggers:
      - trigger: state
        entity_id: binary_sensor.anycubic_kobra_s1_job_in_progress
        to: "on"
    actions:
      - action: notify.mobile_app
        data:
          message: >
            {{ states('sensor.anycubic_kobra_s1_job_name') }} started —
            ETA {{ states('sensor.anycubic_kobra_s1_job_eta') | as_datetime | as_local }}
```

---

## Filament remaining *(estimated)*

The ACE has no sensor for how full a spool is — Anycubic's own `consumables_percent`
field reads zero on every slot. So this is **an estimate**, worked out from what the
printer says it actually extruded.

For each ACE slot you get, disabled by default:

| Entity | What it is |
|---|---|
| `sensor.*_ace_slot_N_filament_remaining` | Grams left on the reel |
| `sensor.*_ace_slot_N_filament_remaining_percent` | The same as a percentage |
| `number.*_ace_slot_N_spool_weight` | What the reel started at — change it for 750 g or 5 kg reels |
| `button.*_ace_slot_N_reset_spool` | Treat the slot as holding a fresh reel |

### Why it's reasonably accurate

It counts `supplies_usage` — the length of filament the printer reports it really
pushed through — rather than the slicer's estimate. That matters because it:

- **includes purge and priming waste**, which the slice figure leaves out (on a real
  print here, 31 783 mm actually extruded against a 31 690 mm estimate — 0.3% more);
- **charges a cancelled print only for the part that ran**, not the whole job;
- **still works for prints started at the printer's own screen**, which carry no
  per-slot breakdown at all.

Length is converted to grams using the filament's density, and split between slots
using the slicer's per-colour breakdown when a print used more than one.

Cloud-sliced jobs say which slot fed them. Jobs started at the printer don't, and the
printer forgets which slot was feeding the moment a job ends — so the integration notes
it *while the job runs* and uses that when the job completes. If it still can't tell
which spool a job came from, it charges **nothing** rather than guessing at the wrong
reel.

> ⏱️ **The figure drops in one step, when a job finishes** — not gradually while it
> prints. A job's usage keeps climbing until it ends, and charging it as it went would
> count the same filament many times over. On a long print, expect no movement for
> hours and then a single drop.

### Reels are remembered

A reel is identified by its colour, material and SKU. Take a part-used reel out, put
it back later — in any slot — and its consumption comes back with it, along with its
own spool weight. Anycubic's own filament carries a SKU; other reels are still told
apart by colour and material.

Two reels that are genuinely identical look the same to the printer and share one
entry. That is what the reset button is for.

### What it can't see

- Filament used while Home Assistant wasn't watching the printer
- The exact weight of the reel you loaded, unless you set it — put a part-used spool on
  kitchen scales and type the number in; it accepts any value in grams
- Manual extrusion and filament changes done at the panel
- Which spool a job used, if it was started at the printer *and* Home Assistant never saw
  it running

Treat it as "roughly how much is left", not a scale.

---

## 📱 ReSpool — an iOS app for writing spool tags *(beta)*

The ACE identifies filament from an NFC tag, and only Anycubic's own spools carry one.
**ReSpool** writes those tags, so any brand of filament is recognised — and gives each
reel an identity this integration can tell apart.

It is **in beta and testers are welcome**:

### 👉 [Join the TestFlight beta](https://testflight.apple.com/join/3sGsKNSM)

*iPhone 7 or newer. The link goes live once Apple finishes reviewing the first
build — if it says the beta isn't accepting testers, try again shortly.*

### What it does

- **Makes third-party filament work.** Pick the material and colour, hold a blank
  tag to your phone, stick it on the spool. The ACE recognises it like its own.
- **Gives every reel a unique identity.** The tag's SKU carries six characters
  derived from the tag's own serial, so two identical reels stop sharing one
  entry here — the case the section above describes as needing the reset button.
- **Reads any spool tag**, genuine or written, and shows the decoded fields down
  to the raw bytes.
- **A shared catalogue.** Scanning a genuine Anycubic spool adds that product to a
  public catalogue, so anyone can write that filament without owning a reel of it.
- **Part-used reels.** Weigh the spool, tell it what an empty one weighs, and it
  works out what is left.

### Confirmed on hardware

A written tag was loaded into a Kobra S1 + ACE Pro. The material and colour were
recognised, and the full SKU — `AHPLBW-103-A30001`, all 17 characters — reached
Home Assistant through Anycubic's cloud intact. Two identical reels are now
distinguishable by their serial suffix alone.

### Worth knowing before you start

- **You need blank NTAG213 stickers** (or larger). A few pence each online.
- **Anycubic's own tags cannot be reused.** They are password-protected by the
  manufacturer — `AUTH0` covers the whole payload, and the configuration is
  locked, so no app can rewrite them. The app detects this and says so rather
  than failing obscurely.
- **Filament weight does not reach Home Assistant.** The app writes it to the tag
  faithfully, but the printer does not forward it. Use the per-slot weight entity
  here instead; it is remembered with the reel.
- **Android** works in development but is not distributed yet.

Bug reports and findings are welcome — the tag format is documented in
[`docs/ios-tag-writer-brief.md`](docs/ios-tag-writer-brief.md), and several of its
details were corrected by testers scanning real spools.

---

## Troubleshooting

<details>
<summary><b>"Invalid authentication" right after submitting the token</b></summary>

<br>

- **Most common cause:** a trailing space or newline. Re-copy carefully — the browser console adds quotes, which must be stripped
- **Encrypted slicer config:** if your token doesn't start with `eyJ`, see [Option A2](#option-a--slicer-token-recommended)
- **Expired token:** they last 90 days. Home Assistant raises a Repair warning 14 days before, but if you've missed it, just get a fresh one

</details>

<details>
<summary><b>MQTT never connects (entity stays "off")</b></summary>

<br>

- Web tokens **don't support MQTT** — that's Anycubic's design, not a bug. Use a slicer token
- Check `binary_sensor.<printer>_printer_online` is on. If the printer is off or unreachable, MQTT has nothing to talk to
- The default connect mode is **printing only** — an idle printer won't connect until the next print. Set it to **Always** to watch an idle machine

</details>

<details>
<summary><b>Logs show "Anycubic MQTT Message unhandled data"</b></summary>

<br>

**Harmless, and rare.** These are fields in a message this version doesn't parse yet — everything
else still flows normally. They're logged once at WARNING, not repeatedly.

If you see one, it's genuinely useful to
[open an issue](https://github.com/Nino6689/hass-anycubic_cloud/issues) with the line. It's how
new printer features get found — the printer light, the ACE spool details and the auxiliary fan
were all arriving in messages that were being discarded.

</details>

<details>
<summary><b>"Reauthentication required" notification</b></summary>

<br>

Your token expired. Re-extract via [step 2](#2-get-an-auth-token), then **Settings → Devices &
services → Anycubic Cloud → Reconfigure → Re-Auth**. Entity IDs, history and automations are all
preserved.

</details>

<details>
<summary><b>Still stuck</b></summary>

<br>

[Open an issue](https://github.com/Nino6689/hass-anycubic_cloud/issues/new) with:

- Your **printer model** — especially if it isn't a Kobra S1, see [testing scope](#hardware-and-testing-scope)
- Home Assistant version
- Relevant log lines (**Settings → System → Logs**, search `anycubic`)
- Which auth mode you used

</details>

---

## 🔐 Security

Traffic to Anycubic's MQTT broker (`mqtt-universe.anycubic.com`) is **fully verified**: the
certificate chain is checked against Anycubic's pinned root CA and the hostname is verified, so
the connection can't be silently intercepted. Upstream disabled both checks (`CERT_NONE` plus
`tls_insecure_set(True)`).

Two relaxations remain, both forced by Anycubic's own certificates, and neither weakens chain or
hostname verification:

| Relaxation | Why it's unavoidable |
|---|---|
| `DEFAULT:@SECLEVEL=0` | Their client certificate is **SHA-1 signed**, which OpenSSL 3.x refuses to load at the default security level. Narrowed from upstream's `ALL:` so only the signature check is relaxed |
| `VERIFY_X509_STRICT` cleared | Their root CA **omits the `keyUsage` extension**, and Python 3.13+ rejects such a CA as a trust anchor outright |

Verified against the live broker: the handshake succeeds on TLSv1.3, while a mismatched hostname
and a system-trust-store-only context are both correctly rejected.

> **Known future risk:** the broker certificate has no Subject Alternative Name, so hostname
> matching relies on OpenSSL's deprecated fallback to Common Name. If that's ever removed, this
> will need revisiting — it's on the [roadmap](#-roadmap).

Found a security issue? See [SECURITY.md](SECURITY.md).

---

## 📦 Changes from upstream

Versioned independently of upstream, whose last release was **v0.2.2** in December 2024.
Everything below is on top of that. See the [releases](https://github.com/Nino6689/hass-anycubic_cloud/releases)
for what landed when.

### Filament tracking *(new)*

| Change | Why |
|---|---|
| **Filament remaining per slot** | The ACE cannot weigh a spool — `consumables_percent` reads zero on every slot, including Anycubic's own tagged reels. Estimated instead from what the printer reports it actually extruded. See [Filament remaining](#filament-remaining-estimated) |
| **Reels are remembered** | Take a part-used spool out and put it back, in any slot, and its consumption and weight come back with it |
| **Prints started at the printer count** | Those jobs carry no per-slot breakdown and the printer forgets which slot fed them the moment they end, so the feeding slot is noted while the job runs |

### Talking to the printer directly *(new)*

| Change | Why |
|---|---|
| **Local (LAN Mode) connection** | The printer runs its own MQTT broker speaking the same protocol as the cloud. Reached through a signed handshake and an AES-encrypted credential exchange. Nothing is stored on disk — the credentials are rotated by the printer and only mean anything on your own network |
| **Switch cloud ↔ local in one place** | Reconfigure → Connection, validated against the printer before it saves, and reachable even when the entry hasn't loaded — which is the state you're in right after flipping LAN Mode |
| **Camera** | The printer names its own stream endpoint and serves it once told to start capturing. Both facts are local-only; the cloud never mentions either |
| **AI / foreign-object detection** | The printer sends an `aiSettings` message nobody had captured. Now a sensor, with the full settings in diagnostics |
| **Capability map in diagnostics** | The printer lists what it physically supports — twelve flags. That, plus model id and firmware, is what makes a bug report about hardware I don't own actionable |
| **Diagnostics survive a dead cloud** | They called the cloud for everything and failed outright when it was unreachable — exactly when you most want them |

### Printing and files *(new)*

| Change | Why |
|---|---|
| **Print a file the printer already holds** | `print_local_file`. Previously the only way to print was to upload a file the printer already had. Refuses if a job is running |
| **File lists report counts** | They reported the string `loaded`, with everything useful buried in an attribute |
| **Cloud files carry their detail** | Thumbnail, print-time estimate, material, layer height, filament usage and dimensions — all sent by the cloud and previously discarded in favour of name and size |
| **Head position** | Live X/Y/Z, via a printer command absent from Anycubic's published list |
| **External filament holder** | Material and loaded state for printers fed from a single external spool |

### Fixes that lose data on hardware other than mine

| Change | Why |
|---|---|
| **A second ACE no longer vanishes** | A report naming one box replaced the whole list, so the second unit disappeared until the next full refresh |
| **Partial print updates are kept** | Six temperature and speed fields were read unguarded, and one missing key threw the entire update away. Open-frame printers and progress-only updates both hit this |
| **An ACE reporting fewer fields is detected** | Rather than silently vanishing |

### Quality *(new)*

| Change | Why |
|---|---|
| **Meets all 54 Home Assistant quality-scale rules** | Bronze through platinum, measured against Core's own published list. Recorded honestly in `quality_scale.yaml` — an official badge is core-only, so this is measurement rather than a claim |
| **298 tests at 95% coverage, `mypy --strict`** | Both enforced in CI. The printer fixture is a redacted capture from real hardware fed to the actual API client, so a change in what Anycubic sends fails the build |
| **API and panel extracted to PyPI** | [`anycubic-cloud-api`](https://pypi.org/project/anycubic-cloud-api/) and [`anycubic-cloud-frontend`](https://pypi.org/project/anycubic-cloud-frontend/), versioned and tested independently |

### Security

| Change | Why |
|---|---|
| **Verified TLS to the cloud broker** | Upstream used `CERT_NONE`, `check_hostname = False` and `tls_insecure_set(True)`, so the session could be intercepted. Now pins Anycubic's root CA with hostname checking on |
| **One account can't be added twice** | The unique id was set but never enforced, so adding the same account again created a duplicate entry and a second copy of every device and entity |
| **Actions report failures properly** | Eleven of the twenty-six surfaced cloud errors as raw tracebacks rather than a readable message |
| **Token expiry warns in advance** | Tokens are 90-day JWTs that cannot be refreshed; a Repair appears a fortnight before yours lapses |

### New features

| Change | Why |
|---|---|
| **Printer light control** | The API layer already supported it, but there was no `light` platform and the printer's replies were discarded as an unknown message type |
| **Per-slot ACE spool entities** | Material, colour and SKU per slot were only reachable by digging through an attribute blob |
| **ACE is its own device** | Spool, drying and fan entities lived on the printer, making the page long and leaving no room for a second ACE |
| **Filament colour swatches** | Slot icons are drawn as a spool in the loaded colour; multi-colour spools render as bands |
| **Full ACE data exposed** | `color_group` (multi-colour), `edit_status`, `icon_type`, `consumables_percent`, box `humidity` and `feed_status` were all received and discarded |
| **Filament and lifetime stats** | Filament used per job, plus lifetime material, print time and print count |
| **Job slicer + model detail** | Layer height, filament type per slot, model dimensions, temperatures, profile and job source, as attributes on `job_name` |
| **Auxiliary + ACE box fan** | Reported alongside the part fan and previously discarded |

### Fixes

| Change | Why |
|---|---|
| **Levelling no longer reads "unknown"** | A Kobra S1 reports print status `9` while levelling, which isn't in the status enum — so `job_state` read `unknown` and `job_in_progress` stayed **off for the first ~2.5 minutes of every print**. Fixes upstream [#55](https://github.com/WaresWichall/hass-anycubic_cloud/issues/55) |
| **ETA reports unknown when there's no estimate** | It was computed as *now + remaining*, and remaining is 0 until printing begins — so it silently tracked the wall clock. A missing value rendered as 1970 |
| **ETA shown in local time** | The panel formatted it as a UTC wall-clock time. Fixes upstream [#52](https://github.com/WaresWichall/hass-anycubic_cloud/issues/52) |
| **Bad tokens report "invalid auth"** | A rejected token could return data with no user id, hitting `int(None)` and surfacing as an unexplained crash. Upstream [#67](https://github.com/WaresWichall/hass-anycubic_cloud/issues/67) |
| **Sensor device classes** | Temperature and duration sensors had none, so no unit conversion and poor history graphs |
| **Quieter logging** | Unparsed message types logged a full traceback at ERROR; now a single debug line |

### Compatibility & housekeeping

| Change | Why |
|---|---|
| `paho-mqtt==1.6.1` → `>=1.6.1` | HA Core ships 2.1.0; the strict pin failed on Python 3.13/3.14 → config flow crashed with HTTP 500 |
| `Client(CallbackAPIVersion.VERSION1, …)` | paho-mqtt 2.x requires it; falls back gracefully on 1.x |
| `iot_class` → `cloud_push` | The integration receives live MQTT push, not just polling |
| Hassfest fixes, brand assets, repo URLs | File-selector `accept:`, no URLs in strings, HACS icon, codeowners |

---

## 🧭 Roadmap

Nothing here is promised by a date. 🔒 marks items needing hardware I don't have —
see [testing scope](#hardware-and-testing-scope).

| Item | Status |
|---|---|
| ~~Camera / print stream~~ ([#4](https://github.com/WaresWichall/hass-anycubic_cloud/issues/4)) | **Done, over the local connection.** The printer names its own stream endpoint and serves HTTP-FLV once `video/startCapture` is sent. There is no equivalent over the cloud, so the camera entity is unavailable on a cloud-only setup |
| 🔒 Second ACE unit ([#66](https://github.com/WaresWichall/hass-anycubic_cloud/issues/66)) | Entities and a second device are wired up, and a bug that made the second unit vanish whenever a report named only one box is fixed. Still needs someone with two units to confirm |
| ~~LAN / local mode~~ ([#47](https://github.com/WaresWichall/hass-anycubic_cloud/issues/47)) | **Done and proved on hardware** — see [local connection](#5-optional-talk-to-the-printer-directly). Handshake, local broker, ACE data and camera all confirmed on a Kobra S1 running 2.7.2.7 |
| 🔒 Resin printers ([#10](https://github.com/WaresWichall/hass-anycubic_cloud/issues/10)) | Photon support is minimal; needs a resin machine |
| Full entity set on a local-only printer | The last piece of LAN Mode. Entity creation is gated on `current_status`, which only the cloud builds, so temperature/job/ACE entities aren't created when there is no cloud record — even though the data is parsed and visible in diagnostics. Needs that status derived from the local reports |
| Translations ([#30](https://github.com/WaresWichall/hass-anycubic_cloud/issues/30)) | English only today. PRs very welcome |
| Units for ACE dry-status sensors | They ship with no unit; needs confirming against real dryer runs first, to avoid breaking existing history |
| ACE `edit_status` meaning | Settled across several spools: `0` = read from an RFID tag, `1` = entered by hand, `2` = slot empty. A tag written by [ReSpool](#-respool--an-ios-app-for-writing-spool-tags-beta) reports `0`, identically to Anycubic's own. Still exposed raw; could drive a "how much to trust this" indicator |
| ~~`aiSettings` message type~~ | **Captured and exposed.** `{status, type, count, notice_type, sensitivity_level}`. Surfaced as an `AI detection` binary sensor, with the rest in diagnostics. Local connection only |
| Chamber temperature | Confirmed again over the local connection: a Kobra S1 omits the fields entirely rather than sending zero, so it genuinely has no chamber sensor. Parsed and kept when a printer does send it; still no entity until a machine is found that populates it |
| SAN-less broker certificate | Works today via OpenSSL's CN fallback; will need attention if that's removed |

---

## Credits

- **[@WaresWichall](https://github.com/WaresWichall)** — the original integration, and by far the larger share of the work here. Massive thanks ⭐
- **[@simo26246](https://github.com/simo26246)** — worked out the encrypted-slicer-config token recovery
- Frontend card concept adapted from [@dangreco](https://github.com/dangreco)'s threedy
- Maintained by [@Nino6689](https://github.com/Nino6689)

### Support

This integration is and always will be **completely free** — use it, fork it, modify it. GPL-3.0,
knock yourself out.

If it's saved you time, you can chuck a coffee in the tip jar. Zero pressure — but it does fuel
the late-night patching when Anycubic next changes their API 😄

<a href="https://buymeacoffee.com/nino6689"><img src="https://img.shields.io/badge/Buy_me_a_coffee_or_a_beer-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black" alt="Buy Me A Coffee"></a>

Prefer to support the original author? [@WaresWichall is on the upstream repo](https://github.com/WaresWichall/hass-anycubic_cloud#donations).

---

## Licence

[GPL-3.0](LICENSE), matching upstream.
