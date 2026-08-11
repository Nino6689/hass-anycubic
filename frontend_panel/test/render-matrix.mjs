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
  // README lists these as supported. Neither contains "photon" or "mono", so
  // before the matchers gained them both drew as FDM bedslingers.
  ['M7 Pro', 'resin'],
  ['M5s', 'resin'],
  // First-gen Kobras: an open-frame bedslinger, which is the kobra_3 body.
  ['Anycubic Kobra Neo', 'kobra_3'],
  ['Kobra Max', 'kobra_3'],
  ['Something Unheard Of', 'fdm'],
  ['', 'fdm'],
  [undefined, 'fdm'],
];

/** [override, expected kind]. `null` means "must fall back to name matching
 *  and still produce a real body" rather than any particular one. */
const OVERRIDES = [
  ['kobra_s1', 'kobra_s1'],
  ['kobra_3', 'kobra_3'],
  ['resin', 'resin'],
  ['fdm', 'fdm'],
  // Derived, not authored: it must still come back labelled as the Combo.
  ['kobra_s1_combo', 'kobra_s1_combo'],
  // Junk from a DOM attribute must not select anything. 'constructor' is the
  // one that mattered: it is truthy on a plain object, so a bare
  // `PRINTER_ART[override]` guard let a function through as the art.
  ['nonsense', null],
  ['constructor', null],
  ['toString', null],
  ['__proto__', null],
];

const PROGRESS = [0, 0.004, 0.5, 1];
const ACE = [0, 1, 2];
const STATUS = ['idle', 'printing', 'paused', 'error'];

for (const [name, expectedKind] of MODELS) {
  const base = selectPrinterArt(name, 0);
  if (expectedKind && base.kind !== expectedKind && base.kind !== 'kobra_s1_combo') {
    problems.push(`match: ${JSON.stringify(name)} -> ${base.kind}, expected ${expectedKind}`);
  }

  // The override path, which nothing exercised before: it is the whole point
  // of the card's printer-artwork setting, and junk must not reach the art.
  for (const [ov, want] of OVERRIDES) {
    cases++;
    const label = `${name ?? 'undefined'}/override:${ov}`;
    let art;
    try {
      art = selectPrinterArt(name, 0, ov, [], 0, []);
    } catch (e) {
      problems.push(`${label}: threw ${e.message}`);
      continue;
    }
    if (want && art.kind !== want) {
      problems.push(`${label}: -> ${art.kind}, expected ${want}`);
    }
    if (!want && art.kind === ov) {
      problems.push(`${label}: junk override was accepted as a kind`);
    }
    // Whatever came back must be a drawable body, not a prototype member.
    if (typeof art.viewBox !== 'string' || typeof art.body !== 'function') {
      problems.push(`${label}: produced a non-art object`);
    }
    // Selecting the Combo asserts an ACE even though aceCount was 0.
    if (ov === 'kobra_s1_combo' && !/ 344| 4\d\d/.test(art.viewBox)) {
      problems.push(`${label}: Combo viewBox not grown for an ACE (${art.viewBox})`);
    }
    // Rendering is inside the try as well: a bad override does not fail at
    // selection time, it fails later on `art.viewBox.split` — which without
    // this catch takes the whole harness down with a stack trace instead of
    // naming the case.
    try {
      inspect(label, renderPrinter(art, { progress: 0.4, status: 'printing' }), problems);
    } catch (e) {
      problems.push(`${label}: renderPrinter threw ${e.message}`);
    }
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
            // The light wash and the bed ember live inside the video hole, so
            // the same rule binds them. (The nozzle ember rides the gantry
            // group, which is already display:none'd under a live camera.)
            if (cameraLive && /ac-apr-wash\b/.test(markup)) {
              problems.push(`${label}: light wash painted over the camera`);
            }
            if (cameraLive && /ac-apr-bedember\b/.test(markup)) {
              problems.push(`${label}: bed ember painted over the camera`);
            }
            // And the converse, so "never draws them" cannot pass either.
            // FDM bodies only: a resin machine has no hotend, no heated bed
            // and no chamber strip, so silence is correct there.
            if (art.kind !== 'resin') {
              if (!cameraLive && status === 'printing' && !/ac-apr-wash\b/.test(markup)) {
                problems.push(`${label}: light on but no wash drawn`);
              }
              if (!cameraLive && progress < 0.9 && !/ac-apr-bedember\b/.test(markup)) {
                problems.push(`${label}: bed heating but no ember drawn`);
              }
              if (!cameraLive && progress > 0.1 && !/ac-apr-ember\b/.test(markup)) {
                problems.push(`${label}: nozzle hot but no melt-zone mark drawn`);
              }
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

/* ------------------------------------------- the print takes the model shape */

// With a model render available the mass on the plate becomes that model's
// own silhouette, revealed from the plate upward. The render is transparent
// PNG, so clipping it gives the real outline rather than a rectangle.
const MODEL = 'http://x/api/image_proxy/image.job_preview?token=abc';
for (const progress of [0.01, 0.25, 0.6, 1]) {
  cases++;
  const art = selectPrinterArt('Anycubic Kobra S1', 0, null, ['#d94a3d'], 0, []);
  const m = flatten(renderPrinter(art, { progress, previewUrl: MODEL, tip: '#d94a3d', status: 'printing' })).markup;
  if (!m.includes('<image')) problems.push(`model: p${progress} drew no model image`);
  if (!m.includes('clip-path')) problems.push(`model: p${progress} not clipped to progress`);
  // Tinted to the filament colour: the render is a near-black PNG and would
  // otherwise vanish into the chamber. Asserted on the RESULT (a shape in the
  // filament colour, masked by the render) rather than on the mechanism.
  if (!/fill="#d94a3d"[^>]*mask="url\(#/.test(m)) {
    problems.push(`model: p${progress} not tinted to the filament`);
  }
  // Alpha, not luminance: a near-black render under a luminance mask is
  // almost entirely invisible, which is the trap this replaced.
  if (!/mask-type:\s*alpha/.test(m)) {
    problems.push(`model: p${progress} mask is not alpha-typed`);
  }
  // A near-black part on a darker chamber needs an edge, exactly as the reels
  // did. Two masked shapes: the halo behind, the filament colour in front.
  const masked = [...m.matchAll(/fill="([^"]+)"[^>]*mask="url\(#/g)].map((x) => x[1]);
  if (masked.length < 2) problems.push(`model: p${progress} part has no contrast halo`);
  if (masked.length && masked[masked.length - 1] !== '#d94a3d') {
    problems.push(`model: p${progress} filament colour is not the front-most layer`);
  }
  // The generic wedge must stand down when the real shape is available.
  if (/<path d="M[\d.]+ [\d.]+ L[\d.]+ [\d.]+ L[\d.]+ [\d.]+ L[\d.]+ [\d.]+ Z"\s+fill="#d94a3d"/.test(m)) {
    problems.push(`model: p${progress} drew the generic wedge as well`);
  }
  // Without a render, the wedge is still the fallback.
  const noModel = flatten(renderPrinter(art, { progress, tip: '#d94a3d', status: 'printing' })).markup;
  if (noModel.includes('<image')) problems.push(`model: p${progress} drew an image with no render available`);
  if (!/ac-apr-print/.test(noModel)) problems.push(`model: p${progress} lost the fallback wedge`);
}

// SVG ids are document-global, so two cards on one dashboard must not clash.
{
  cases++;
  const art = selectPrinterArt('Anycubic Kobra S1', 0, null, ['#d94a3d'], 0, []);
  const a = flatten(renderPrinter(art, { progress: 0.5, previewUrl: MODEL + '1', tip: '#fff' })).markup;
  const b = flatten(renderPrinter(art, { progress: 0.5, previewUrl: MODEL + '2', tip: '#fff' })).markup;
  const ids = (t) => [...t.matchAll(/id="([^"]+)"/g)].map((m) => m[1]);
  const shared = ids(a).filter((i) => ids(b).includes(i));
  if (shared.length) problems.push(`model: different models share ids ${shared.join(',')}`);
  const same = flatten(renderPrinter(art, { progress: 0.5, previewUrl: MODEL + '1', tip: '#fff' })).markup;
  if (ids(a).join() !== ids(same).join()) problems.push('model: same model produced unstable ids');

  // The case that actually bit: the SAME model at DIFFERENT progress on one
  // page. url(#id) takes the first match in the document, so sharing an id
  // here means every card silently uses the first card's clip rectangle.
  const p30 = flatten(renderPrinter(art, { progress: 0.3, previewUrl: MODEL, tip: '#fff' })).markup;
  const p70 = flatten(renderPrinter(art, { progress: 0.7, previewUrl: MODEL, tip: '#fff' })).markup;
  const clash = ids(p30).filter((i) => ids(p70).includes(i));
  if (clash.length) {
    problems.push(`model: same model at different progress shares ids ${clash.join(',')}`);
  }
}

/* ------------------------------------------- the head the CSS animates */

// The sweep is a CSS animation in animated_printer.ts targeting a selector in
// the artwork. Nothing links the two, so removing the target leaves a rule
// matching nothing and the head silently stops moving -- which is exactly what
// happened when the artwork's global ids were cleaned up. This asserts the
// artwork still emits what that stylesheet animates.
{
  const css = readFileSync(
    join(here, '..', 'src', 'components', 'printer_card', 'printer_view', 'animated_printer.ts'),
    'utf8',
  );
  const target = css.match(/:host\(\[printing\]\)\s+\.ac-apr-svg\s+([.#][\w-]+)\s*\{[^}]*animation:/);
  if (!target) {
    problems.push('sweep: no printing-gated animation rule found in the stylesheet');
  } else {
    const sel = target[1];
    if (sel.startsWith('#')) {
      problems.push(`sweep: animation targets an id (${sel}); ids are document-global and collide between cards`);
    }
    const attr = sel.startsWith('.') ? `class="${sel.slice(1)}"` : `id="${sel.slice(1)}"`;
    for (const kind of ['kobra_s1', 'kobra_3', 'fdm']) {
      cases++;
      const art = selectPrinterArt(null, 0, kind, ['#d94a3d'], 0, []);
      const m = flatten(renderPrinter(art, { progress: 0.5, status: 'printing' })).markup;
      if (!m.includes(attr)) {
        problems.push(`sweep: ${kind} does not emit ${attr}, so the head cannot animate`);
      }
    }
  }
}

/* --------------------------------------------- contrast of the reel edges */

// A reel has to read against the chassis whatever colour the filament is.
// Real spools that motivated this: PLA+ #1A1A1A on a #101216 chassis, and two
// PETGs at #EFF0F1 that merged into one block.
for (const colour of ['#1A1A1A', '#EFF0F1', '#F0F0ED', '#75787B', '#000000', '#ffffff']) {
  cases++;
  const art = selectPrinterArt('Anycubic Kobra S1', 1, null, [colour, colour, colour, colour], 0, []);
  const markup = flatten(renderPrinter(art, { progress: 0.5, status: 'printing' })).markup;
  const reel = markup.match(new RegExp(`fill="${colour}"[^>]*stroke="([^"]+)"`, 'i'));
  if (!reel) {
    problems.push(`edge: reel ${colour} has no outline`);
    continue;
  }
  const dark = /rgba\(0,0,0/.test(reel[1]);
  const n = parseInt(colour.slice(1), 16);
  const luma = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  // A dark reel needs a light edge and vice versa; the wrong way round is
  // worse than none, because it reinforces the colour it should separate.
  if (luma < 0.45 && dark) problems.push(`edge: dark reel ${colour} got a dark outline`);
  if (luma >= 0.45 && !dark) problems.push(`edge: light reel ${colour} got a light outline`);
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
