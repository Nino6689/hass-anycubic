/**
 * Render every body and state to a static page, so the artwork can be LOOKED
 * at rather than only asserted about. The render matrix proves nothing is
 * NaN; only eyes prove it looks like a printer.
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const { selectPrinterArt, renderPrinter, spoolColors, artAspect } = await import(join(here, '.build', 'printer_art.js'));

function flatten(node, out = '') {
  if (node == null) return out;
  if (Array.isArray(node)) return node.reduce((a, n) => flatten(n, a), out);
  if (typeof node === 'object' && node.strings) {
    const { strings, values } = node;
    let s = '';
    for (let i = 0; i < strings.length; i++) {
      s += strings[i];
      if (i < values.length) s += flatten(values[i], '');
    }
    return out + s;
  }
  return out + String(node);
}

const COLOURS = ['#d94a3d', '#2f7fd1', '#e8b33a', '#3aa87a', '#8e5bd1', '#e0752f', '#2fb8a8', '#c9c9c9'];
const cases = [
  ['Kobra S1 · idle · light off',        'Kobra S1', 0, { progress: 0, status: 'idle' }],
  ['Kobra S1 · printing 45% · light on', 'Kobra S1', 0, { progress: 0.45, status: 'printing', lightOn: true, nozzleHeat: 0.9, bedHeat: 0.7, fanOn: true }],
  ['Kobra S1 · camera live',             'Kobra S1', 0, { progress: 0.45, status: 'printing', cameraLive: true, lightOn: true, nozzleHeat: 0.9 }],
  ['Kobra S1 · paused',                  'Kobra S1', 0, { progress: 0.6, status: 'paused', nozzleHeat: 0.5 }],
  ['Kobra S1 · error',                   'Kobra S1', 0, { progress: 0.3, status: 'error' }],
  ['S1 Combo · 1 ACE · slot 2 feeding',  'Kobra S1', 1, { progress: 0.7, status: 'printing', lightOn: true }, 1],
  ['S1 Combo · 2 ACE · slot 6 feeding',  'Kobra S1', 2, { progress: 0.3, status: 'printing' }, 5],
  ['Kobra 3 · printing',                 'Kobra 3', 0, { progress: 0.55, status: 'printing', bedHeat: 0.8, fanOn: true }],
  ['Generic FDM · fallback',             'Mystery Machine', 0, { progress: 0.25, status: 'printing' }],
  ['Photon Mono · resin printing',       'Photon Mono M5s', 0, { progress: 0.6, status: 'printing' }],
];

let html = '';
for (const [label, name, units, state, active = 0] of cases) {
  const colours = spoolColors(Array.from({ length: Math.max(1, units) * 4 }, (_, i) => ({ color_hex: COLOURS[i] })), Math.max(1, units));
  const remaining = [0.15, 0.9, undefined, 0.45, 0.7, 0.05, 0.6, 1];
  const art = selectPrinterArt(name, units, null, colours, active, remaining);
  const svg = flatten(renderPrinter(art, { ...state, tip: colours[active] }));
  html += `<figure><figcaption>${label}</figcaption>
    <div class="card">
      <div class="stage" style="--cam:${art.chamber.map((v) => v + '%').join(' ')}; --aspect:${artAspect(art)}">
        <div class="cam"></div>${svg}
      </div>
    </div></figure>\n`;
}

writeFileSync(join(here, 'preview.html'), `<!doctype html><meta charset="utf-8">
<style>
  body { background:#12161a; color:#dfe6ec; font:14px/1.4 system-ui; margin:0; padding:24px; }
  .grid { display:flex; flex-wrap:wrap; gap:20px; }
  figure { margin:0; width:250px; background:#1b2229; border:1px solid #2b333c; border-radius:12px; padding:10px; }
  figcaption { font-size:12px; color:#93a1ad; margin-bottom:6px; }
  /* A real card gives the printer a box with BOTH dimensions fixed. The
     sizing bug only shows up here, never in a free-height container. */
  /* Grid, not flex: an aspect-ratio child inside a fixed-height FLEX box was
     overflowing rather than clamping, which made the tall Combo bodies look
     broken here while they composed correctly at natural size. The harness
     misreporting the artwork is worse than no harness. */
  .card { height:430px; display:grid; place-items:center; min-height:0;
          border:1px dashed #3a4650; border-radius:8px; overflow:hidden; }
  /* Height-driven, not width-driven. aspect-ratio + max-height did not clamp
     the tall Combo bodies in either flex or grid, so they overflowed and read
     as broken artwork. Every body is square or portrait, so deriving the width
     from a full-height box always fits. */
  .stage { position:relative; aspect-ratio:var(--aspect); height:100%; width:auto; max-width:100%; margin:0 auto;
    --primary-text-color:#c9d3dc; --secondary-text-color:#8b98a4; --divider-color:#5d6a76;
    --primary-color:#4a9fd8; --ha-card-background:#1b2229; }
  /* Standing in for the camera. It is inset from the STAGE, and the stage is
     not always exactly the SVG's rendered box here, so treat its alignment as
     indicative only -- the real card's camera fit is verified by measurement
     against the live DOM, not by this. */
  .cam { position:absolute; inset:var(--cam); z-index:0;
    background:repeating-linear-gradient(135deg,#2c3d4a 0 10px,#223140 10px 20px); }
  .ac-apr-svg { position:relative; z-index:1; display:block; width:100%; height:100%;
    color:var(--primary-text-color);
    --ac-printer-accent:var(--primary-color); --ac-printer-rail:var(--secondary-text-color);
    --ac-printer-plate:var(--divider-color); --ac-printer-card-bg:var(--ha-card-background);
    --ac-printer-light:#ffd88a; --ac-printer-heat:#ff7a3d; }
</style><div class="grid">${html}</div>`);
console.log('  wrote test/preview.html');
