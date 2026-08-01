# Brief: iOS NFC tag writer for Anycubic ACE spools

**Audience:** the developer/agent building the iOS app.
**Author of this brief:** maintainer of the [Anycubic Cloud Home Assistant integration](https://github.com/Nino6689/hass-anycubic_cloud), who owns the Home Assistant side of this and is not building the app.

---

## 1. What this is for

Anycubic's ACE Pro reads an NFC tag on each filament spool and tells the printer
what material is loaded. Only Anycubic's own filament ships with those tags, so
third-party spools show up as unknown.

Two existing projects solve the writing problem, both without an iOS option:

| Project | Platform | Notes |
|---|---|---|
| [Molodos/anycubic-nfc-filament](https://github.com/Molodos/anycubic-nfc-filament) | Desktop + ACR122U USB reader | Has the best format documentation (`format.md`) |
| [DnG-Crafts/ACE-RFID](https://github.com/DnG-Crafts/ACE-RFID) | Android, ESP32/ESP8266/Pico W, Windows | Android app is on Google Play |

**There is no iOS app at all.** That is the gap this fills. Between them those two
projects have 220+ stars, so the demand is real and entirely unserved on iPhone.

This app does two jobs:

1. **Write ACE-compatible tags** for any spool, including aftermarket brands, so
   the printer recognises the filament.
2. **Give every physical spool a unique identity**, so Home Assistant can tell two
   otherwise-identical reels apart and track each one's remaining filament
   separately.

Job 2 is the part that must not be improvised — see [§5](#5-the-unique-spool-id-contract-with-home-assistant),
which is a contract with software that already exists.

---

## 2. Licence position — read this before looking at any code

**Neither reference project has a licence.** Both return `license: null` from the
GitHub API, which means **all rights reserved**: you may view and fork them on
GitHub, but you have no right to copy, modify or redistribute their code.

What that means in practice:

- ✅ **Read `format.md` and use it as a specification.** A data format is a fact,
  not copyrightable expression, and reimplementing one for interoperability is
  legitimate and normal.
- ✅ **Read their code to understand the format**, then write your own.
- ❌ **Do not copy code, structure, comments or resources** from either project
  into this app.
- ✅ **Credit both projects** in the app's about screen and the repo README. They
  did the reverse-engineering; that deserves saying out loud.

If in doubt, work from §4 of this brief rather than from their source. §4 is a
restatement of the format with corrections, written to be sufficient on its own.

---

## 3. Platform requirements

| | |
|---|---|
| Language | Swift, SwiftUI |
| Minimum iOS | 13.0 (`sendMiFareCommand` requires it); target 16+ for a modern UI |
| Framework | `CoreNFC` |
| Capability | **Near Field Communication Tag Reading** on the App ID |
| Entitlement | `com.apple.developer.nfc.readersession.formats` = `["TAG"]` |
| Info.plist | `NFCReaderUsageDescription` with a plain-English explanation |
| Devices | iPhone 7 and later. NFC writing is unavailable on iPad |

A paid Apple Developer account is available and already set up. Nothing here needs
special approval from Apple.

### Why the raw-tag route is mandatory

Anycubic tags **are not NDEF**. The data sits in raw NTAG pages. This is exactly why
no existing phone app can write them — apps like NFC Tools only handle NDEF records,
and the Home Assistant Companion app is NDEF-only too (its source contains zero calls
to `sendMiFareCommand`).

So the app must use:

```swift
NFCTagReaderSession(pollingOption: .iso14443, delegate: self)
// -> case .miFare(let tag) where tag.mifareFamily == .ultralight
tag.sendMiFareCommand(...)   // raw NTAG commands
```

NTAG command bytes:

| Command | Bytes | Effect |
|---|---|---|
| `READ` | `0x30, <page>` | Returns 16 bytes (4 pages) |
| `WRITE` | `0xA2, <page>, <4 data bytes>` | Writes one page |

Write **one page at a time**, and verify by reading back afterwards.

---

## 4. Tag format specification

**Chip:** NTAG213 (NTAG215 and NTAG216 also work — anything with ≥36 pages and a
144-byte user area). Tags must be blank/rewritable; some sold as "read-only" or
already locked will fail.

**Layout:** pages `04`–`1F` inclusive. Pages `00`–`03` are chip management (UID,
lock bits, capability container) and pages `28`+ are configuration — **never write
to either**.

### ⚠️ Byte order — the reference doc is wrong about this

`format.md` says "byte order is big endian". **It is not, for numeric fields.** All
multi-byte numbers are **little-endian 16-bit**. Verified against real dumps:

```
Page 1F: e8:03:00:00  ->  0x03E8 = 1000 g      (little-endian)
Page 1E: af:00:4a:01  ->  0x00AF = 175, 0x014A = 330
Page 18: c8:00:d2:00  ->  0x00C8 = 200, 0x00D2 = 210 °C
```

Strings are plain ASCII, null-padded to the end of their field.

### Field map

| Pages | Bytes | Field | Encoding |
|---|---|---|---|
| `04` | 4 | Format version | `7B 00 <ver> 00` — `0x64` = v1, `0x65` = v2. **Write v2.** |
| `05`–`09` | **20** | **SKU** | ASCII, null-terminated/padded |
| `0A`–`0E` | 20 | Manufacturer | ASCII. `"AC"` on Anycubic spools (v2 only) |
| `0F`–`13` | 20 | Material type | ASCII, null-padded |
| `14` | 4 | Colour | `AA BB GG RR` — opacity first, then **RGB reversed** |
| `15`–`16` | 8 | Unknown | Zero. Possibly colours 2 and 3 for multi-colour |
| `17` | 4 | Print speed range 1 | min, max — mm/s, LE16 each |
| `18` | 4 | Nozzle temp range 1 | min, max — °C, LE16 each |
| `19` | 4 | Print speed range 2 | v2 only |
| `1A` | 4 | Nozzle temp range 2 | v2 only |
| `1B` | 4 | Print speed range 3 | v2 only |
| `1C` | 4 | Nozzle temp range 3 | v2 only |
| `1D` | 4 | Bed temp range | min, max — °C, LE16 each |
| `1E` | 4 | Diameter, length | diameter in mm×10⁻² (175 = 1.75 mm), length in metres |
| `1F` | 4 | Weight | grams, LE16 |
| `20`–`27` | 32 | **Free** | All zero on every genuine tag inspected. Available |

### Colour encoding, worked through

```
Page 14 = FF 4F A8 89   ->  opacity FF, then 4F A8 89 reversed = 89 A8 4F
                        ->  #89A84F
```

So for `#RRGGBB` at full opacity, write `FF BB GG RR`.

### Two things to verify on real hardware

1. **The `0x3F` bytes in the material field.** The one v2 sample reads
   `PLA?High?Speed`, with `0x3F` (`?`) where spaces belong. That sample was
   reconstructed from a Reddit post rather than dumped directly, so it may be an
   artefact. Dump a genuine multi-word spool and check whether it is `0x3F` or
   `0x20`. Get this wrong and material recognition breaks.
2. **Whether a long SKU is accepted** — see §5, this is the critical test.

---

## 5. The unique spool ID: contract with Home Assistant

This section is a **contract**, not a suggestion. The Home Assistant side already
exists and ships today; the app must match it.

### Why it has to live in the SKU

When the ACE reads a tag, only three of its fields ever reach Home Assistant
through Anycubic's cloud:

```json
{"sku": "AHPEBW-102", "type": "PETG", "color": [239, 240, 241]}
```

**Not** the weight, length, temperatures or anything in the free pages. So a unique
ID written anywhere except SKU, material or colour is invisible to Home Assistant.

Material and colour are both unsuitable — changing them breaks material recognition
and the colour swatches. **The SKU is the only viable channel.**

### The scheme

```
<BASE_SKU>-<UID6>
```

- `BASE_SKU` — the real Anycubic SKU for that filament type, e.g. `AHPEBW-102`
- `UID6` — six uppercase hex characters, unique per physical spool

Example: `AHPEBW-102-A7F3C2`

Sizing, against the 20-byte field: `AHPLPBW-102` is the longest known base SKU at
11 characters, `+1` separator `+6` ID `+1` null = **19 bytes. Fits.**

Derive `UID6` from the tag's own factory UID (pages `00`–`01`, globally unique and
immutable) — take six hex characters of it. That makes it deterministic: rewriting
the same physical tag yields the same ID, so a spool keeps its identity even if the
user reprograms it.

### Home Assistant then does the rest, with no changes needed

The integration already fingerprints spools as `material|colour|sku` and remembers
consumption against that fingerprint, restoring it when a part-used reel is
reinserted in any slot. A unique SKU makes that fingerprint unique per physical
reel automatically.

### 🔴 The critical first test — do this before building anything else

**Unknown: does the ACE accept a SKU longer than the ones it ships with, and does
it pass it through to the cloud verbatim?**

Everything above depends on the answer. Test it as the very first task:

1. Write a tag with SKU `AHPEBW-102-A7F3C2`, correct material/colour otherwise
2. Insert into the ACE
3. Check the printer recognises the material
4. Have the HA maintainer confirm what `sku` arrives in the cloud payload

| Outcome | What to do |
|---|---|
| Full SKU arrives verbatim | ✅ Proceed as specified |
| Truncated to 12 bytes | Shorten to `<BASE>-<UID3>`, or drop to a 4-char base code |
| Rejected / blanked / material unrecognised | **Fall back:** encode the ID in the colour's low bits — perturb blue by ±1–2 per spool. Visually identical, survives the cloud, still unique. Ugly, but it works |

**Report the result before writing the rest of the app.** A UI built on the wrong
assumption is wasted work.

Cosmetic cost either way: an unrecognised SKU shows as `?` in Anycubic Slicer Next's
"Workbench" tab. The material still syncs correctly in "Prepare". Accepted trade-off
— make sure the UI says so, so users aren't surprised.

---

## 6. Aftermarket spool presets

The main reason to use this app over Anycubic's ecosystem: **spools they don't sell.**
Ship a preset library so users pick a brand and material rather than typing eight
numbers.

Each preset supplies: material name, density (for the app's own weight/length maths),
nozzle range, bed range, print speed range, default diameter (1.75 mm) and default
spool weight.

### Starter set

Cover these brands, which between them are most of the aftermarket:

**SUNLU, Elegoo, Overture, eSun, Polymaker, Prusament, Hatchbox, Amazon Basics,
Creality, Bambu Lab, Anycubic** (own-brand, for rewriting genuine spools).

And these materials, with sane defaults:

| Material | Density g/cm³ | Nozzle °C | Bed °C | Speed mm/s |
|---|---|---|---|---|
| PLA | 1.24 | 190–220 | 50–60 | 50–150 |
| PLA+ | 1.24 | 200–230 | 50–60 | 50–150 |
| PLA Silk | 1.24 | 200–230 | 50–60 | 40–120 |
| PLA Matte | 1.24 | 190–220 | 50–60 | 50–150 |
| High Speed PLA | 1.24 | 190–230 | 50–60 | 100–300 |
| PETG | 1.27 | 230–250 | 70–85 | 40–120 |
| ABS | 1.04 | 240–260 | 90–110 | 40–120 |
| ASA | 1.07 | 240–260 | 90–110 | 40–120 |
| TPU | 1.21 | 210–230 | 40–60 | 20–40 |
| PC | 1.20 | 260–290 | 100–110 | 30–80 |
| PA (Nylon) | 1.14 | 250–280 | 80–100 | 30–80 |
| PAHT-CF | 1.30 | 270–300 | 90–110 | 30–80 |
| HIPS | 1.04 | 230–245 | 90–110 | 40–100 |

⚠️ **These are starting points, not gospel.** Real values vary by brand and colour.
Every field must remain user-editable, and the preset should be a starting point the
user can adjust and save.

Base SKU per preset: use the closest real Anycubic SKU for that material type, since
that is what drives slicer recognition. `format.md` lists the known ones —
`AHPLBK-101` (PLA Basic), `AHPLPBK-102` (PLA+), `HPEBK-103` (PETG), `HASBK-101`
(ASA), `HABBK-102` (ABS), `AHHSBK-102` (HS PLA).

Let users save their own presets — someone with ten Sunlu colours should set it up
once.

---

## 7. App features

### Must have

- **Write a tag** — pick preset or enter manually, tap phone to sticker, done
- **Read a tag** — show what is on an existing tag, including genuine Anycubic ones
- **Read-back verification after every write.** Re-read all written pages and compare.
  A half-written tag can leave a spool unrecognised, or worse, wrong
- **Colour picker** with hex entry, since colour reaches Home Assistant and is part
  of the spool fingerprint
- **Preset library** per §6, with user-defined presets
- **Spool ID display** — show the assigned unique ID clearly after writing, so it
  can be cross-checked in Home Assistant
- **Clear error states** — tag too small, locked/read-only, moved away mid-write,
  verification mismatch

### Should have

- **Spool history** — what has been written, when, which ID. Useful for reconciling
  against Home Assistant
- **Duplicate the last tag** — most people write several spools in a sitting
- **Export/share a spool ID** so it can be pasted into Home Assistant

### Explicitly out of scope

- Any Home Assistant communication. The app never talks to HA. The link between them
  is the tag itself, read by the printer. **Do not build an HA integration into this
  app** — that side is already handled
- Tracking filament consumption. Home Assistant does that
- Writing to pages `00`–`03` or `28`+
- Android. Already covered by DnG-Crafts

---

## 8. Safety requirements

Writing bad data to a tag can leave a spool unusable until rewritten, so:

1. **Never write to management pages.** Guard `04 ≤ page ≤ 27` in code, not just UI
2. **Always read back and verify.** Report a clear failure on mismatch
3. **Offer a dump-before-write** for genuine Anycubic tags, so an original can be
   restored if the user changes their mind
4. **Do not lock tags.** Never set the lock bits in pages `02`/`28`+ — a locked tag
   is permanently read-only and the sticker is wasted
5. **Warn before overwriting** a tag that already has valid Anycubic data

---

## 9. Division of ownership

| Side | Owner | Responsibility |
|---|---|---|
| iOS app | app developer | Writing tags, presets, unique ID generation per §5 |
| Home Assistant | integration maintainer | Reading SKU via the cloud, per-spool consumption, remaining-filament estimate |

**The only interface between them is the SKU string format in §5.** No API, no
network calls, no shared library. Get §5 right and the two sides never need to know
about each other again.

Already live on the Home Assistant side, so no work is needed there:

- Per-slot filament remaining in grams and percent
- Configurable spool weight, and a reset button per slot
- Spool fingerprinting by material + colour + SKU, with consumption remembered
  across removal, reinsertion, and moves between slots

---

## 10. Acceptance criteria

1. Writes a tag an ACE Pro recognises, with the correct material and colour
2. Reads back and verifies every write; failures are surfaced, not silent
3. A written spool appears in Home Assistant with a **unique** SKU, distinct from
   another spool of the same brand, material and colour
4. At least the brands and materials in §6 ship as presets, all fields editable
5. Genuine Anycubic tags can be read without being modified
6. No management pages are ever written; no tag is ever locked
7. Both reference projects are credited in-app and in the repo
8. The §5 critical test has been run and its result documented

---

## Appendix: reference dump

A genuine Anycubic v1 tag, PLA Pantone Spring Leaf, for checking an implementation
against:

```
[Page 04] 7b:00:64:00   Format version 1
[Page 05] 48:50:4c:31   SKU "HPL19-102"
[Page 06] 39:2d:31:30
[Page 07] 32:00:00:00
[Page 0f] 50:4c:41:00   Type "PLA"
[Page 14] ff:4f:a8:89   Colour #89A84F, opacity FF
[Page 18] c8:00:d2:00   Nozzle 200-210 °C
[Page 1d] 32:00:3c:00   Bed 50-60 °C
[Page 1e] af:00:4a:01   1.75 mm, 330 m
[Page 1f] e8:03:00:00   1000 g
[Page 20] 00:00:00:00   free from here to page 27
```
