# Anycubic Cloud for Home Assistant

[![GitHub release](https://img.shields.io/github/v/release/Nino6689/hass-anycubic_cloud?style=flat-square)](https://github.com/Nino6689/hass-anycubic_cloud/releases/latest)
[![hacs](https://img.shields.io/badge/HACS-Custom-41BDF5?style=flat-square&logo=home-assistant&logoColor=white)](https://hacs.xyz)
[![GPLv3](https://img.shields.io/badge/license-GPL_3.0-blue?style=flat-square)](LICENSE)
[![Buy Me A Coffee](https://img.shields.io/badge/Buy_me_a_coffee-FFDD00?style=flat-square&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/nino6689)

Monitor and control your **Anycubic Kobra / Photon** 3D printer from Home Assistant, with
sub-second updates over MQTT.

Temperatures, progress and layer count · **per-slot ACE spools** showing material and colour ·
**printer light control** with brightness · live job preview image · pause, resume and cancel ·
filament used per job and lifetime totals · slicer and model detail for the running job.

---

## Project status

This is a maintained fork of [WaresWichall/hass-anycubic_cloud](https://github.com/WaresWichall/hass-anycubic_cloud),
which did all the original work. Upstream's last release was December 2024 and the author
[stepped back from the project](https://github.com/WaresWichall/hass-anycubic_cloud/issues/33);
stock v0.2.2 no longer loads on current Home Assistant, failing with
`HTTP 500 "Server got itself in trouble"`.

This fork exists to keep it working. What that means in practice:

- **Compatibility with current HA Core** — the paho-mqtt 2.x / Python 3.13+ breakage is fixed,
  and future Core breakage is the priority when it happens.
- **Issue triage** — bugs get looked at, reproduced where possible, and answered.
- **Security fixes** — see [Security](#security) for what's already been done.
- **Upstream first, still** — if @WaresWichall picks the project back up, fixes from here are
  theirs to take and this fork happily retires.

Not every request will become a feature. Things that need hardware I don't have, or that
Anycubic's cloud API doesn't expose, will be recorded honestly in the [Roadmap](#roadmap)
rather than promised.

## Hardware and testing scope

I own a **Kobra S1 with an ACE Pro**. That is the only hardware every change here is
actually tested against — the TLS work, the MQTT connection, the entities, the panel.

Everything else in the [supported printers](#supported-printers) list works because
upstream or the community reported it working, not because I verified it. I'll take care
not to break those models, but I can't confirm behaviour on them first-hand.

So: **bug reports and test results for other models are genuinely useful** and will be
acted on — you're my only visibility into that hardware. And if Anycubic (or anyone with a
spare machine) wants a model properly supported rather than supported-by-inference, a
donated printer means it gets tested for real. Until then I'd rather be upfront about the
gap than imply coverage I don't have.

---

## Table of contents

- [Quick start](#quick-start)
- [Supported printers](#supported-printers)
- [Step 1 — Install](#step-1--install-the-integration)
- [Step 2 — Get an auth token](#step-2--get-an-auth-token)
  - [Option A — Slicer (recommended)](#option-a--slicer-token-recommended-mqtt-live-updates)
  - [Option B — Web](#option-b--web-token-easiest-no-live-mqtt)
  - [Option C — Android](#option-c--android-token-advanced)
- [Step 3 — Add it in Home Assistant](#step-3--add-the-integration-in-home-assistant)
- [Step 4 — Choose a Connect Mode](#step-4--choose-a-connect-mode-controls-when-mqtt-is-active)
- [What you get](#what-you-get)
- [Troubleshooting](#troubleshooting)
- [Frontend card](#frontend-card)
- [Security](#security)
- [Changes from upstream](#changes-from-upstream-v022)
- [Roadmap](#roadmap)
- [Support the project](#support-the-project)
- [Credits](#credits)

---

## Quick start

If you already know your way around HACS and dev tools, here's the speed run:

1. **HACS** → ⋮ → **Custom repositories** → add `https://github.com/Nino6689/hass-anycubic_cloud` as an **Integration**.
2. Install **Anycubic Cloud**, restart HA.
3. Grab a token — either the [Slicer method](#option-a--slicer-token-recommended-mqtt-live-updates) (recommended) or the [Web dev-console snippet](#option-b--web-token-easiest-no-live-mqtt).
4. **Settings → Devices & services → Add integration** → search **Anycubic Cloud** → pick your auth mode → paste token.
5. Select your printer(s). Done.

Otherwise, follow the step-by-step below — it's all explained.

---

## Supported printers

**Verified here** (the hardware I own and test on):

- **Kobra S1** — including **ACE Pro** multi-colour spool details

**Reported working** by upstream and the community — these should work, but I can't test them:

- **Kobra 3 Combo**
- **Kobra 2**, **Kobra 2 Max**, **Kobra 2 Pro**
- **Photon Mono M5s** (basic support)
- **M7 Pro** (basic support)

Tried a model that isn't listed, or one of the "reported" ones and it misbehaved?
[Open an issue](https://github.com/Nino6689/hass-anycubic_cloud/issues) — including the ones
that *do* work, so the list above can be based on something firmer than inference.

---

## Step 1 — Install the integration

### Recommended: HACS

1. In Home Assistant, open **HACS**.
2. Click the **⋮ menu** (top right) → **Custom repositories**.
3. Add this repository:
   - **URL**: `https://github.com/Nino6689/hass-anycubic_cloud`
   - **Category**: `Integration`
4. Click **Add**, then close the dialog.
5. Search HACS for **Anycubic Cloud** and click **Download**.
6. **Restart Home Assistant** (Settings → System → Restart).

### Manual install

If you don't use HACS, grab the latest [release zip](https://github.com/Nino6689/hass-anycubic_cloud/releases/latest), then:

1. Extract the `custom_components/anycubic_cloud/` folder.
2. Copy it into your HA `config/custom_components/` directory.
3. Restart Home Assistant.

---

## Step 2 — Get an auth token

This integration **never asks for your Anycubic email/password directly** — Home Assistant
can't perform the Anycubic OAuth flow with its captchas and 2FA. Instead you obtain a
**token** from somewhere you're already logged in (the slicer, the website, or the Android
app) and paste it in.

Pick **one** of the three options below.

### Option A — Slicer token (RECOMMENDED, MQTT live updates)

> ⚡ **Why this one?** Anycubic blocks MQTT for tokens obtained from the website. Only
> tokens from Anycubic Slicer Next give you real-time status — temperatures, progress and
> layer count updating every second instead of every minute — plus the control buttons.

#### What you need

- [**Anycubic Slicer Next**](https://www.anycubic.com/pages/anycubic-slicer-next) installed on your Mac or Windows PC.
- The slicer logged in to your Anycubic account (do this once via **Settings → Account** inside the slicer).

#### A. If your slicer config is plain text

Older Slicer Next builds store the token readably. Log in once, **quit the slicer**, then run:

**macOS** — in Terminal:

```bash
python3 -c "import json,os; print(json.load(open(os.path.expanduser('~/Library/Application Support/AnycubicSlicerNext/AnycubicSlicerNext.conf')))['anycubic_cloud']['access_token'])"
```

**Windows** — in PowerShell:

```powershell
$conf = "$env:APPDATA\AnycubicSlicerNext\AnycubicSlicerNext.conf"
(Get-Content $conf | ConvertFrom-Json).anycubic_cloud.access_token
```

You'll get a long string (~1200 characters) starting with `eyJ…`. Copy the whole thing and
skip to [Step 3](#step-3--add-the-integration-in-home-assistant).

#### B. If your slicer config is encrypted

Newer Slicer Next builds **encrypt the `anycubic_cloud` section** of that file. If the
command above returns nothing, or the file looks like this:

```json
"anycubic_cloud": {
    "AbC1dEf2GhI3jK4l5MnO6w==": true,
    "Zy9XwV8uTs7RqP6oNmL5kA==": "QWxhYmFzZTY0ZW5jcnlwdGVkdG9rZW4uLi4="
}
```

…then both the key names and the token are AES-encrypted and base64-encoded. The key lives
inside the slicer's `common_encrypt.dll` and isn't exported, so **the file cannot be
decrypted** — there's nothing this integration can do to read it. Pasting the encrypted
blob into Home Assistant will correctly be rejected as invalid authentication.

The slicer does decrypt the token into memory in order to log in, so you can recover it
from the running process. This is a standard Windows feature and nothing leaves your
machine. Credit to [@simo26246 in upstream #67](https://github.com/WaresWichall/hass-anycubic_cloud/issues/67)
for working this out.

1. Open Anycubic Slicer Next and make sure it's **logged in**.
2. **Ctrl+Shift+Esc** → **Details** tab → right-click `AnycubicSlicerNext.exe` (the larger
   of the two) → **Create dump file**. Note the path, usually `%TEMP%\AnycubicSlicerNext.DMP`.
3. Run this in PowerShell — **not as Administrator**, which fails with an out-of-memory
   error. It extracts the token and copies it to your clipboard:

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

4. Paste it into Home Assistant using auth mode **Slicer**.

> 🔐 **Delete the `.DMP` file when you're done** — it contains all your live tokens in clear
> text. Only ever do this for your own account on your own machine.

#### Housekeeping

Tokens expire after roughly five months and may rotate; when HA prompts for re-auth, just
repeat the steps above. Running the slicer and HA logged in at the same time works fine in
practice, so there's no need to log out of the slicer afterwards.

---

### Option B — Web token (EASIEST, no live MQTT)

> ⚠️ **Trade-off:** Web tokens are cloud-polling only — state updates every ~60 seconds
> instead of in real time, and the control buttons won't work. Fine for "is it printing?",
> not for watching the temperature line draw.

1. Open <https://cloud-universe.anycubic.com/file> in your browser and **sign in**.
2. Open browser **Developer Tools** (F12, or right-click → Inspect).
3. Switch to the **Console** tab.
4. Paste this and press Enter:

   ```js
   window.localStorage["XX-Token"]
   ```

5. The console prints your token (~238 characters) as a quoted string. Copy the contents
   **without the surrounding quotes**.

> If this returns `undefined`, you're almost certainly on a freshly-opened tab that
> redirected through OAuth. Read it from the tab you're **already logged in on**.

→ Now jump to [Step 3](#step-3--add-the-integration-in-home-assistant) and pick auth mode **Web**.

---

### Option C — Android token (ADVANCED)

Requires extracting both a token and a `device_id` from the Android app's network traffic
(e.g. via [mitmproxy](https://mitmproxy.org/) or [HTTP Toolkit](https://httptoolkit.com/)).

Significantly more involved than the other two and not recommended unless you have a
specific reason. The HA UI prompts for both **User Token** and **Device ID**.

---

## Step 3 — Add the integration in Home Assistant

1. **Settings → Devices & services**.
2. Click **+ Add integration** (bottom right).
3. Search for **Anycubic Cloud** and click it.
4. Pick the **authentication mode** matching the token from Step 2 (Slicer / Web / Android).
5. Paste your token into **User Token** (and **Device ID** if you picked Android).
6. Click **Submit**.
7. Select which printer(s) to track.
8. Click **Submit** again.

You'll get a new **Anycubic Cloud** entry in your integrations list and a sidebar panel
with a printer card.

---

## Step 4 — Choose a Connect Mode (controls when MQTT is active)

MQTT is what gives you sub-second updates. Staying connected permanently puts a little
extra load on Anycubic's broker, so you can choose when it's on.

To change: **Settings → Devices & services → Anycubic Cloud → Configure**.

| Mode | When MQTT connects |
|---|---|
| **Printing Only** (default) | While a print is running |
| **Printing & Drying** | + while the ACE is drying filament |
| **Device Online** | Whenever the printer is powered on |
| **Always** | All the time — best for live monitoring of an idle printer |
| **Never Connect** | Polled only (closest to "Web auth" behaviour) |

### Force MQTT on right now

If you've just changed mode and don't want to wait for the next print:

1. Toggle `switch.<printer>_manual_mqtt_connection_enabled` → **On**.
2. Press `button.<printer>_refresh_mqtt_connection`.
3. `binary_sensor.<printer>_mqtt_connection_active` should turn **on** within 5–15 seconds.

---

## What you get

Around 60 entities per printer. The ACE appears as its **own device** linked to the printer,
so its spools, drying and fan entities are kept separate — and a second ACE has somewhere to
live. The highlights:

| Kind | Entities |
|---|---|
| **Job** | `job_name`, `job_state`, `job_progress` (%), `job_time_elapsed`, `job_time_remaining`, `job_eta`, `job_current_layer`, `job_total_layers`, `job_z_thickness`, `job_speed_mode`, `job_filament_used` |
| **Lifetime** | `total_material_used` (kg), `total_print_time`, `total_print_count` |
| **Temperatures** | `nozzle_temperature`, `hotbed_temperature` and their `target_*` counterparts |
| **Fans** | `fan_speed` (part cooling), `auxiliary_fan_speed`, `ace_box_fan_level` |
| **Status** | `current_status`, `printer_online`, `is_busy`, `is_available`, `job_in_progress`, `job_complete`, `job_failed`, `job_paused`, `mqtt_connection_active` |
| **ACE** | `ace_slot_1`–`ace_slot_4` (material type per slot; colour hex, full multi-colour list, SKU, loaded state and edit status as attributes), `ace_loaded_slot`, `ace_current_temperature`, `ace_box_fan_level`, `ace_spools` (with a `box_info` attribute: humidity, feed status, model), `drying_active`, `drying_target_temperature`, `drying_remaining_time`, `ace_run_out_refill`, `refresh_ace_spools` |
| **Controls** | `printer_light` (on/off + brightness), `pause_print`, `resume_print`, `cancel_print`, file-list refresh buttons, `manual_mqtt_connection_enabled` |
| **Other** | Live job preview `image`, printer and ACE `update` entities, plus [services](https://github.com/Nino6689/hass-anycubic_cloud/blob/main/custom_components/anycubic_cloud/services.yaml) for printing, drying and file management |

`sensor.<printer>_job_eta` is a proper **timestamp** entity, so Home Assistant renders it
as a local clock time and it works directly in automations and templates:

```jinja
{{ states('sensor.anycubic_kobra_s1_job_eta') | as_datetime | as_local }}
```

Temperature and duration sensors carry the matching device classes, so they graph properly
and follow your unit preferences (°C / °F).

---

## Troubleshooting

### "Invalid authentication" right after submitting the token

- **Most common cause**: a trailing space or newline. Re-copy carefully — the browser
  console adds quotes, which must be stripped.
- **Encrypted slicer config**: if your token doesn't start with `eyJ`, your slicer encrypts
  its config and you've pasted the encrypted blob. See
  [Option A part B](#b-if-your-slicer-config-is-encrypted).
- **Expired token**: they last about five months. Get a fresh one.

### MQTT never connects (entity stays "off")

- Web tokens **don't support MQTT** — Anycubic's design, not a bug. Use a Slicer token.
- Check `binary_sensor.<printer>_printer_online` is **on**. If the printer is off or
  unreachable, MQTT has nothing to talk to.
- The default Connect Mode is **Printing Only** — an idle printer won't connect until the
  next print. Set it to **Always** to monitor an idle machine.

### Logs show "Anycubic MQTT Message unhandled data"

**Harmless, and rare.** These are fields in a message that this version doesn't parse yet —
everything else still flows normally. They're logged once at WARNING, not repeatedly.

If you see one, it's genuinely useful to
[open an issue](https://github.com/Nino6689/hass-anycubic_cloud/issues) with the line: it's how
new printer features get found. Several entities in this release came from exactly that —
the printer light, the ACE spool details and the auxiliary fan were all arriving in messages
that were being discarded.

Unrecognised *message types* (as opposed to unhandled fields) log a single debug line and are
invisible at default log level.

### "Reauthentication required" notification

Your token expired. Re-extract via [Step 2](#step-2--get-an-auth-token), then
**Settings → Devices & services → Anycubic Cloud → Reconfigure → Re-Auth**. Entity IDs,
history and automations are all preserved.

### Still stuck

[Open an issue](https://github.com/Nino6689/hass-anycubic_cloud/issues/new) and include:

- Your **printer model** (especially if it's not a Kobra S1 — see [testing scope](#hardware-and-testing-scope))
- HA version (Settings → About)
- Relevant log lines (Settings → System → Logs → search **anycubic**)
- Which auth mode you used

---

## Frontend card

The integration ships its own **sidebar panel** — no extra install needed.

For a card you can place on a normal dashboard, there's the separate
[Anycubic card](https://github.com/WaresWichall/hass-anycubic_card) from the upstream
author, installed via HACS as a **Frontend** custom repository. Note that it's a separate
project, so fixes made here don't automatically reach it.

---

## Security

As of v0.3.0, traffic to Anycubic's MQTT broker (`mqtt-universe.anycubic.com`) is **fully verified**: the
certificate chain is checked against Anycubic's own pinned root CA and the hostname is
verified, so the connection can't be silently intercepted. Upstream disabled both checks
(`CERT_NONE` + `tls_insecure_set(True)`); that's fixed.

Two relaxations remain, both forced by Anycubic's own certificates:

- **`DEFAULT:@SECLEVEL=0`** — their client certificate is SHA-1 signed, which OpenSSL 3.x
  refuses to load at the default security level. Narrowed from upstream's `ALL:` so the
  normal cipher list still applies.
- **`VERIFY_X509_STRICT` cleared** — their root CA omits the `keyUsage` extension, and
  Python 3.13+ rejects such a CA as a trust anchor outright.

Neither weakens chain or hostname verification. Known future risk: the broker certificate
has no Subject Alternative Name, so hostname matching relies on OpenSSL's deprecated
fallback to Common Name. If a future OpenSSL drops that, this will need revisiting — it's
on the [roadmap](#roadmap).

Found a security issue? See [SECURITY.md](SECURITY.md).

---

## Changes from upstream v0.2.2

This fork is versioned independently of upstream. **v0.3.0** is the first consolidated
release; the `v0.2.2-nbX` tags before it were incremental steps toward it.

| Change | File | Why |
|---|---|---|
| **Verify TLS to the cloud broker** | `anycubic_cloud_api/api/mqtt.py` | Upstream used `CERT_NONE`, `check_hostname = False` and `tls_insecure_set(True)`, so the connection could be intercepted. Now pins Anycubic's root CA with hostname checking on. See [Security](#security) |
| **Job slicer + model detail** | `anycubic_cloud_api/data_models/project.py` | Layer height, filament types per slot, model dimensions, nozzle/bed temps, slicer, printer profile and job source all arrived with every project and were never surfaced. Now attributes on `job_name` |
| **Spool-shaped colour icons** | `helpers.py` | ACE slot icons are drawn as a filament spool in the loaded colour rather than a plain disc |
| **ACE is its own device** | `entity.py`, `helpers.py` | Spool, drying and fan entities lived on the printer device, which made the page long and left no room for a second ACE. Each ACE is now a separate device linked to the printer, named from its reported model |
| **Filament colour swatches** | `sensor.py`, `helpers.py` | Each ACE slot shows a generated swatch of its filament colour as the entity picture, so the colour is visible without a custom card. Multi-colour spools render as bands |
| **Full ACE data exposed** | `anycubic_cloud_api/data_models/printer_properties.py` | `color_group` (multi-colour spools), `edit_status`, `icon_type`, `consumables_percent`, box `humidity` and `feed_status` were all being received and discarded. Also consumes `head_tools_model` so it stops logging as unhandled |
| **Auxiliary + ACE box fan** | `sensor.py` | The printer reports `aux_fan_speed_pct` and `box_fan_level` alongside the part fan; both were discarded |
| **Printer light control** | `light.py`, `anycubic_cloud_api/` | The API layer could already set the light, but no `light` platform existed and the printer's `light/report` replies were discarded as an unknown message type. Now a real on/off + brightness entity |
| **Per-slot ACE spool entities** | `sensor.py`, `coordinator.py` | Material type, colour and SKU per slot were only reachable by digging through an attribute blob |
| **Levelling no longer reads as "unknown"** | `anycubic_cloud_api/data_models/project.py` | A Kobra S1 reports print status `9` while levelling, which isn't in the status enum, so `job_state` read `unknown` and `job_in_progress` stayed **off** for the first couple of minutes of every print. Falls back to the plain-text phase the printer also sends. Fixes upstream [#55](https://github.com/WaresWichall/hass-anycubic_cloud/issues/55) |
| **ETA reports unknown when there is no estimate** | `anycubic_cloud_api/data_models/project.py` | With no remaining-time estimate the ETA silently tracked the wall clock, or rendered as 1970 |
| **Unknown MQTT types no longer log as errors** | `anycubic_cloud_api/api/mqtt.py` | Unparsed message types logged a full traceback at ERROR. Now a single debug line |
| **ETA shown in local time** | `frontend_panel/src/helpers.ts` | The panel formatted the ETA as a UTC wall-clock time. Fixes upstream [#52](https://github.com/WaresWichall/hass-anycubic_cloud/issues/52) |
| **Bad tokens report "invalid auth"** | `anycubic_cloud_api/api/base.py`, `models/auth.py` | A rejected token could return data with no user id, hitting `int(None)` and surfacing as an unexplained crash instead of an auth error. Common with encrypted slicer configs — upstream [#67](https://github.com/WaresWichall/hass-anycubic_cloud/issues/67) |
| **Sensor device classes** | `sensor.py` | Temperature and duration sensors had none, so no unit conversion and poor history graphs |
| `iot_class` → `cloud_push` | `manifest.json` | The integration receives live MQTT push, not just polling |
| `paho-mqtt==1.6.1` → `>=1.6.1` | `manifest.json` | HA Core ships paho-mqtt 2.1.0; the strict pin failed to install on Python 3.13/3.14 → config flow crashed with HTTP 500 |
| `Client(CallbackAPIVersion.VERSION1, …)` | `anycubic_cloud_api/api/mqtt.py` | paho-mqtt 2.x requires `CallbackAPIVersion` first. `VERSION1` keeps the existing callback signatures; falls back gracefully on paho-mqtt 1.x |
| Hassfest fixes | `services.yaml`, `strings.json`, `translations/en.json` | File-selector `accept:` now required; literal URLs no longer allowed in strings |
| Repo URLs + codeowners | `manifest.json` | Points at this fork; codeowners credits upstream too |
| Brand assets | `brand/` | So HACS shows an icon |
| Documentation | `README.md` | macOS slicer path, encrypted-config recovery, entity reference, security notes |

---

## Roadmap

Nothing here is promised by a date. Items marked 🔒 need hardware I don't have — see
[testing scope](#hardware-and-testing-scope).

| Item | Status |
|---|---|
| Camera / print stream support ([#4](https://github.com/WaresWichall/hass-anycubic_cloud/issues/4)) | The printer reports a camera peripheral and a `video_taskid`, but the latter reads 0 here. Needs work to find how the stream is actually opened |
| 🔒 Second ACE unit ([#66](https://github.com/WaresWichall/hass-anycubic_cloud/issues/66)) | Entities and a second device are already wired up; needs someone with two ACE units to confirm it works |
| 🔒 LAN / local mode for Kobra S1 ([#47](https://github.com/WaresWichall/hass-anycubic_cloud/issues/47)) | Would remove the cloud dependency entirely. Big job |
| 🔒 Resin printer support ([#10](https://github.com/WaresWichall/hass-anycubic_cloud/issues/10)) | Photon support is minimal; needs a resin machine |
| Translations ([#30](https://github.com/WaresWichall/hass-anycubic_cloud/issues/30)) | English only today. PRs very welcome |
| Units for ACE dry-status sensors | `drying_total_duration` / `drying_remaining_time` ship with no unit; needs confirming against real dryer runs before changing, to avoid breaking existing history |
| ACE `edit_status` meaning | Reads 0 on the slot with an RFID SKU and 1 on manually-set slots, which suggests "identified by the spool" vs "set by hand" — but that's one data point. Exposed raw until confirmed |
| `aiSettings` message type | The printer advertises AI detection and foreign-object detection and sends an `aiSettings` message, but its contents haven't been captured yet |
| SAN-less broker certificate | Works today via OpenSSL's CN fallback; will need attention if that's removed |

---

## Support the project ☕

This integration is and always will be **completely free** — use it, fork it, modify it.
GPL-3.0, knock yourself out.

If it's saved you time or made your printing setup nicer, you can chuck a coffee (or a
beer 🍺) in the tip jar:

[![Buy Me A Coffee](https://img.shields.io/badge/Buy_me_a_coffee_or_a_beer-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/nino6689)

Zero pressure — but it does fuel the late-night patching when Anycubic next changes their API 😄

If you'd rather support the original author who did the heavy lifting,
[@WaresWichall is on the upstream repo](https://github.com/WaresWichall/hass-anycubic_cloud#donations) too.

---

## Credits

- **[@WaresWichall](https://github.com/WaresWichall)** — original integration, and by far the
  larger share of the work here. Massive thanks. ⭐
- **[@simo26246](https://github.com/simo26246)** — worked out the encrypted-slicer-config
  token recovery documented above.
- Frontend card concept originally adapted from [@dangreco](https://github.com/dangreco)'s threedy.
- Maintained by [@Nino6689](https://github.com/Nino6689).

---

## Licence

[GPL-3.0](LICENSE), matching upstream.
