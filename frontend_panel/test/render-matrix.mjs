/**
 * Render every printer body against every state and look for the bugs that
 * actually happen here.
 *
 * There is no DOM in this harness and it does not need one. Lit templates are
 * (strings, values) pairs, and every defect this artwork has produced so far
 * lived in an interpolated VALUE: a slot index off the end of an array became
 * x="NaN", an absent colour became fill="undefined". Flattening the template
 * and inspecting those values catches that class without a browser.
 *
 * Run: node test/render-matrix.mjs
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const MODULE = join(here, '.build', 'printer_art.js');

const {
  PRINTER_ART,
  selectPrinterArt,
  gantryTransform,
  nozzleTransform,
  cameraInset,
  filamentColor,
  spoolColors,
  renderPrinter,
} = await import(MODULE);

/* ------------------------------------------------------------- flattening */

/** Walk a Lit TemplateResult into { markup, values }. */
function flatten(node, out = { markup: '', values: [] }) {
  if (node === null || node === undefined) return out;
  if (Array.isArray(node)) {
    for (const n of node) flatten(n, out);
    return out;
  }
  if (typeof node === 'object' && node.strings && 'values' in node) {
    const { strings, values } = node;
    for (let i = 0; i < strings.length; i++) {
      out.markup += strings[i];
      if (i < values.length) {
        const v = values[i];
        if (v && typeof v === 'object' && (v.strings || Array.isArray(v))) {
          flatten(v, out);
        } else {
          out.values.push(v);
          out.markup += String(v ?? '');
        }
      }
    }
    return out;
  }
  out.markup += String(node);
  return out;
}

/* ----------------------------------------------------------------- checks */

const BAD_VALUE = /^(NaN|undefined|null)$/;

function inspect(label, tpl, problems) {
  const { markup, values } = flatten(tpl);

  for (const v of values) {
    const s = String(v);
    if (BAD_VALUE.test(s)) problems.push(`${label}: interpolated ${s}`);
    if (typeof v === 'number' && !Number.isFinite(v)) {
      problems.push(`${label}: non-finite number ${v}`);
    }
  }

  // Numeric SVG attributes that arrived as text.
  for (const m of markup.matchAll(/\s(x|y|cx|cy|r|width|height|rx)="([^"]*)"/g)) {
    const raw = m[2].trim();
    if (raw === '' || BAD_VALUE.test(raw) || Number.isNaN(Number(raw))) {
      problems.push(`${label}: ${m[1]}="${raw}"`);
    }
  }

  // A path whose data contains NaN silently disappears in most renderers.
  for (const m of markup.matchAll(/\sd="([^"]*)"/g)) {
    if (/NaN|undefined/.test(m[1])) problems.push(`${label}: path d contains NaN/undefined`);
  }

  // Negative geometry is not drawable.
  for (const m of markup.matchAll(/\s(width|height|r)="(-?[\d.]+)"/g)) {
    if (Number(m[2]) < 0) problems.push(`${label}: negative ${m[1]}="${m[2]}"`);
  }

  // Duplicate ids inside one card's shadow root break querySelector.
  const ids = [...markup.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (dupes.length) problems.push(`${label}: duplicate id ${[...new Set(dupes)].join(', ')}`);

  return markup;
}

/* ------------------------------------------------------------------ matrix */

const problems = [];
let cases = 0;

const MODELS = [
  ['Anycubic Kobra S1', 'kobra_s1'],
  ['Kobra S1 Combo', 'kobra_s1'],
  ['Anycubic Kobra 3', 'kobra_3'],
  ['Kobra 2 Neo', 'kobra_3'],
  ['Photon Mono M5s', 'resin'],
  ['Something Unheard Of', 'fdm'],
  ['', 'fdm'],
  [undefined, 'fdm'],
];

const PROGRESS = [0, 0.004, 0.5, 1];
const ACE = [0, 1, 2];
const STATUS = ['idle', 'printing', 'paused', 'error'];

for (const [name, expectedKind] of MODELS) {
  const base = selectPrinterArt(name, 0);
  if (expectedKind && base.kind !== expectedKind && base.kind !== 'kobra_s1_combo') {
    problems.push(`match: ${JSON.stringify(name)} -> ${base.kind}, expected ${expectedKind}`);
  }

  for (const units of ACE) {
    // Every slot the units expose, plus indices that should be out of range.
    const slots = [0, 1, 3, 4, 5, 7, 9, -1];
    for (const active of slots) {
      const colours = spoolColors(
        Array.from({ length: units * 4 }, (_, i) => ({ color: [i * 30, 90, 120] })),
        Math.max(1, units),
      );
      const remaining = Array.from({ length: units * 4 }, (_, i) => (i % 3 === 0 ? undefined : i / 8));
      const art = selectPrinterArt(name, units, null, colours, active, remaining);

      for (const progress of PROGRESS) {
        for (const cameraLive of [false, true]) {
          for (const status of STATUS) {
            cases++;
            const label = `${name ?? 'undefined'}/${units}ACE/slot${active}/p${progress}/${cameraLive ? 'cam' : 'nocam'}/${status}`;
            const markup = inspect(
              label,
              renderPrinter(art, {
                progress,
                cameraLive,
                tip: colours[active] ?? undefined,
                lightOn: status === 'printing',
                nozzleHeat: progress,
                bedHeat: 1 - progress,
                fanOn: status === 'printing',
                status,
              }),
              problems,
            );

            // The camera rule, asserted rather than trusted: nothing may be
            // drawn into the chamber while the stream is up.
            if (cameraLive && /ac-apr-print\b/.test(markup)) {
              problems.push(`${label}: printed mass drawn over the camera`);
            }
            // The converse, or "never draws it" would also pass.
            if (!cameraLive && progress > 0.01 && !/ac-apr-print\b/.test(markup)) {
              problems.push(`${label}: printing but no printed mass drawn`);
            }
          }
        }
      }
    }
  }
}

/* --------------------------------------------------------- pure functions */

const pure = [
  ['filamentColor(undefined)', filamentColor(undefined), (v) => typeof v === 'string' && v.length],
  ['filamentColor("")', filamentColor(''), (v) => typeof v === 'string' && v.length],
  ['filamentColor("#abc")', filamentColor('#abc'), (v) => v === '#abc'],
  ['filamentColor("ff0000ff")', filamentColor('ff0000ff'), (v) => v === '#ff0000'],
  ['filamentColor("nonsense")', filamentColor('nonsense'), (v) => typeof v === 'string' && v.length],
  ['spoolColors([], 2).length', spoolColors([], 2).length, (v) => v === 8],
  ['spoolColors([], 1).length', spoolColors([], 1).length, (v) => v === 4],
  ['spoolColors([], 0).length', spoolColors([], 0).length, (v) => v === 4],
];
for (const [label, value, ok] of pure) {
  cases++;
  if (!ok(value)) problems.push(`pure: ${label} -> ${JSON.stringify(value)}`);
}

for (const kind of Object.keys(PRINTER_ART)) {
  const art = PRINTER_ART[kind];
  cases++;
  const inset = cameraInset(art);
  if (!/^(\d|\.)+% (\d|\.)+% (\d|\.)+% (\d|\.)+%$/.test(inset)) {
    problems.push(`chamber: ${kind} inset "${inset}"`);
  }
  for (const p of [0, 50, 100]) {
    for (const cam of [false, true]) {
      const t = gantryTransform(art, p, cam);
      if (/NaN|undefined/.test(t)) problems.push(`gantry: ${kind} p=${p} cam=${cam} -> ${t}`);
    }
  }
  if (/NaN/.test(nozzleTransform(0))) problems.push(`nozzle: ${kind}`);
}

/* ------------------------------------------------------------------ report */

console.log(`  cases: ${cases}`);
if (problems.length === 0) {
  console.log('  PASS - no NaN, no undefined, no duplicate ids, no negative geometry');
  process.exit(0);
}
const unique = [...new Set(problems)];
console.log(`  FAIL - ${problems.length} problem(s), ${unique.length} distinct:`);
for (const p of unique.slice(0, 25)) console.log(`     ${p}`);
if (unique.length > 25) console.log(`     ... and ${unique.length - 25} more`);
process.exit(1);
