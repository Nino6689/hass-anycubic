// src/components/printer_card/printer_view/printer_art.ts
import { html, nothing, svg } from "lit";
var SPOOL_CX = [66.5, 102, 137.5, 173];
var DEFAULT_SPOOLS = ["#d94a3d", "#2f7fd1", "#e8b33a", "#3aa87a"];
var anycubicCube = (cx, cy, r) => {
  const h = r * 0.575;
  return svg`
    <g class="ac-apr-logo">
      <path d="M${cx} ${cy - r * 1.05} L${cx + r} ${cy - h * 0.9} L${cx} ${cy + h * 0.2} L${cx - r} ${cy - h * 0.9} Z"
            fill="#403f44"></path>
      <path d="M${cx - r} ${cy - h * 0.9} L${cx} ${cy + h * 0.2} L${cx} ${cy + r * 1.05} L${cx - r} ${cy + h * 1.1} Z"
            fill="#2b262c"></path>
      <path d="M${cx + r} ${cy - h * 0.9} L${cx + r} ${cy + h * 1.1} L${cx} ${cy + r * 1.05} L${cx} ${cy + h * 0.2} Z"
            fill="#41649a"></path>
    </g>`;
};
var chamberLight = (on, x, y, w) => svg`
  ${on ? svg`<rect x="${x - 2}" y="${y}" width="${w + 4}" height="26" rx="6"
              fill="var(--ac-printer-light, #ffd88a)" opacity="0.13"></rect>` : nothing}
  <rect x="${x}" y="${y}" width="${w}" height="3" rx="1.5"
        fill="${on ? "var(--ac-printer-light, #ffd88a)" : "currentColor"}"
        opacity="${on ? 0.95 : 0.3}"></rect>`;
var edgeFor = (colour) => {
  if (!colour || !/^#[0-9a-f]{6}$/i.test(colour)) {
    return "rgba(255,255,255,0.35)";
  }
  const n = parseInt(colour.slice(1), 16);
  const luma = (0.299 * (n >> 16 & 255) + 0.587 * (n >> 8 & 255) + 0.114 * (n & 255)) / 255;
  return luma < 0.45 ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.45)";
};
var modelKey = (url, ...geometry) => {
  const seed = `${url}|${geometry.map((n) => n.toFixed(2)).join(",")}`;
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = h * 31 + seed.charCodeAt(i) | 0;
  }
  return `acm${(h >>> 0).toString(36)}`;
};
var printedMass = (visible, progress, plateX, plateW, plateY, maxH, tip, previewUrl) => {
  if (!visible || progress <= 5e-3) {
    return nothing;
  }
  if (previewUrl) {
    const frac = Math.min(1, progress);
    const boxH = maxH;
    const boxW = Math.min(plateW, boxH);
    const bx = plateX + (plateW - boxW) / 2;
    const by = plateY - boxH;
    const revealH = boxH * frac;
    const id = modelKey(previewUrl, bx, by, boxW, boxH, revealH);
    return svg`
      <g class="ac-apr-print">
        <defs>
          <!-- mask-type:alpha, not a filter and not a luminance mask. The
               render is a transparent PNG of a near-black object, so its
               ALPHA is the silhouette and its luminance is nothing: a default
               luminance mask renders it almost invisible. Masking a plain
               rect of the filament colour gives the part's real outline in
               the colour it is actually being printed in. -->
          <mask id="${id}m" style="mask-type:alpha">
            <image href="${previewUrl}" x="${bx.toFixed(1)}" y="${by.toFixed(1)}"
                   width="${boxW.toFixed(1)}" height="${boxH.toFixed(1)}"
                   preserveAspectRatio="xMidYMax meet"></image>
          </mask>
          <clipPath id="${id}c">
            <rect x="${bx.toFixed(1)}" y="${(plateY - revealH).toFixed(1)}"
                  width="${boxW.toFixed(1)}" height="${revealH.toFixed(1)}"></rect>
          </clipPath>
        </defs>
        <g clip-path="url(#${id}c)">
          <!-- A halo of the same silhouette, very slightly larger, in the
               contrasting edge colour. The live printer is loaded with PLA+
               at #1A1A1A and the chamber is darker still, so without this the
               part is a black shape on a black background. Scaling about the
               shape's own centre keeps it registered. -->
          <g transform="translate(${(bx + boxW / 2).toFixed(1)} ${(by + boxH / 2).toFixed(1)}) scale(1.035) translate(${(-bx - boxW / 2).toFixed(1)} ${(-by - boxH / 2).toFixed(1)})">
            <rect x="${bx.toFixed(1)}" y="${by.toFixed(1)}"
                  width="${boxW.toFixed(1)}" height="${boxH.toFixed(1)}"
                  fill="${edgeFor(tip)}" mask="url(#${id}m)"></rect>
          </g>
          <rect x="${bx.toFixed(1)}" y="${by.toFixed(1)}"
                width="${boxW.toFixed(1)}" height="${boxH.toFixed(1)}"
                fill="${tip}" mask="url(#${id}m)"></rect>
        </g>
        <rect x="${bx.toFixed(1)}" y="${(plateY - revealH).toFixed(1)}"
              width="${boxW.toFixed(1)}" height="1.4"
              fill="var(--ac-printer-card-bg, #fff)" opacity="0.55"></rect>
      </g>`;
  }
  const h = Math.min(1, progress) * maxH;
  const inset = plateW * 0.22;
  const taper = Math.min(6, h * 0.25);
  const x = plateX + inset;
  const w = plateW - inset * 2;
  const step = 4;
  const lines = [];
  for (let y = plateY - step; y > plateY - h + 1; y -= step) {
    const t = (plateY - y) / Math.max(1, h);
    const halfTaper = taper * t;
    lines.push(
      svg`<line x1="${(x + halfTaper).toFixed(1)}" y1="${y.toFixed(1)}"
                x2="${(x + w - halfTaper).toFixed(1)}" y2="${y.toFixed(1)}"
                stroke="var(--ac-printer-card-bg, #fff)" stroke-opacity="0.14"
                stroke-width="0.8"></line>`
    );
  }
  return svg`
    <g class="ac-apr-print">
      <path d="M${x} ${plateY} L${x + taper} ${plateY - h} L${x + w - taper} ${plateY - h} L${x + w} ${plateY} Z"
            fill="${tip}" opacity="0.9"></path>
      ${lines}
      <path d="M${x} ${plateY} L${x + taper} ${plateY - h} L${x + taper + w * 0.32} ${plateY - h} L${x + w * 0.32} ${plateY} Z"
            fill="var(--ac-printer-card-bg, #fff)" opacity="0.07"></path>
      <rect x="${x + taper}" y="${(plateY - h).toFixed(1)}" width="${(w - taper * 2).toFixed(1)}" height="1.6"
            fill="var(--ac-printer-card-bg, #fff)" opacity="0.5"></rect>
    </g>`;
};
var heatGlow = (heat, x, y, w, h) => heat <= 0.02 ? nothing : svg`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3"
            fill="var(--ac-printer-heat, #ff7a3d)"
            opacity="${(0.12 + heat * 0.45).toFixed(2)}"></rect>`;
var coil = (cx, colour, remaining) => {
  const fill = colour ?? "var(--ac-printer-rail, currentColor)";
  const frac = remaining === void 0 ? 1 : Math.max(0, Math.min(1, remaining));
  const full = 32;
  const hub = 11;
  const h = hub + (full - hub) * frac;
  const y = 42 + (full - h) / 2;
  return svg`
    <rect x="${cx - 9}" y="${y.toFixed(1)}" width="18" height="${h.toFixed(1)}" rx="2" fill="${fill}"
          stroke="${edgeFor(colour)}" stroke-width="0.75"></rect>
    <rect x="${cx - 9}" y="55" width="18" height="5" fill="var(--ac-printer-card-bg, #fff)" opacity="0.25"></rect>`;
};
var resinPrint = (visible, progress, tip) => {
  if (!visible || progress <= 5e-3) {
    return nothing;
  }
  const h = Math.min(1, progress) * 40;
  const w = 22;
  const x = 117 - w / 2;
  const top = 68;
  return svg`
    <g class="ac-apr-print">
      <path d="M${x} ${top} L${x + w} ${top} L${x + w - 4} ${(top + h).toFixed(1)} L${x + 4} ${(top + h).toFixed(1)} Z"
            fill="${tip}" opacity="0.8"></path>
    </g>`;
};
var fanMark = (on, cx, cy, r) => svg`
  <g opacity="${on ? 0.9 : 0.3}">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="currentColor" stroke-width="1.3"></circle>
    <g class="${on ? "ac-apr-fan" : ""}">
      <path d="M${cx} ${cy - r * 0.7} A${r * 0.7} ${r * 0.7} 0 0 1 ${cx + r * 0.61} ${cy + r * 0.35} L${cx} ${cy} Z" fill="currentColor"></path>
      <path d="M${cx + r * 0.61} ${cy + r * 0.35} A${r * 0.7} ${r * 0.7} 0 0 1 ${cx - r * 0.61} ${cy + r * 0.35} L${cx} ${cy} Z" fill="currentColor" opacity="0.7"></path>
      <path d="M${cx - r * 0.61} ${cy + r * 0.35} A${r * 0.7} ${r * 0.7} 0 0 1 ${cx} ${cy - r * 0.7} L${cx} ${cy} Z" fill="currentColor" opacity="0.45"></path>
    </g>
  </g>`;
var screenFace = (status, cx, cy, r) => {
  if (status === "paused") {
    const b = r * 0.32;
    return svg`<g>
      <rect x="${cx - b * 1.9}" y="${cy - r * 0.75}" width="${b}" height="${r * 1.5}" rx="${b * 0.3}" fill="#e8b33a"></rect>
      <rect x="${cx + b * 0.9}" y="${cy - r * 0.75}" width="${b}" height="${r * 1.5}" rx="${b * 0.3}" fill="#e8b33a"></rect>
    </g>`;
  }
  if (status === "error") {
    return svg`<g>
      <path d="M${cx} ${cy - r} L${cx + r} ${cy + r * 0.72} L${cx - r} ${cy + r * 0.72} Z"
            fill="none" stroke="#e05252" stroke-width="${r * 0.24}" stroke-linejoin="round"></path>
      <rect x="${cx - r * 0.1}" y="${cy - r * 0.3}" width="${r * 0.2}" height="${r * 0.62}" rx="${r * 0.1}" fill="#e05252"></rect>
    </g>`;
  }
  return anycubicCube(cx, cy, r);
};
var s1Body = ({
  gantry,
  nozzle,
  tip = "var(--ac-printer-accent, currentColor)",
  lightOn = false,
  progress = 0,
  chamberBusy = false,
  previewUrl,
  nozzleHeat = 0,
  bedHeat = 0,
  fanOn = false,
  status = "idle"
}) => svg`
  <g fill="currentColor">
    <rect x="38" y="20" width="163" height="20" rx="5"></rect>
    <rect x="38" y="34" width="11" height="162"></rect>
    <rect x="190" y="34" width="11" height="162"></rect>
    <rect x="38" y="188" width="163" height="26" rx="5"></rect>
    <rect x="47" y="214" width="20" height="7" rx="3" opacity="0.7"></rect>
    <rect x="172" y="214" width="20" height="7" rx="3" opacity="0.7"></rect>
  </g>
  <rect x="54" y="24" width="94" height="2" rx="1" fill="var(--ac-printer-card-bg, #fff)" opacity="0.3"></rect>
  <g>
    <rect x="149" y="2" width="46" height="22" rx="3" fill="currentColor"></rect>
    <rect x="152.5" y="5" width="39" height="16" rx="2" fill="#101216"></rect>
    ${screenFace(status, 172, 13, 7.5)}
  </g>
  <rect x="146" y="22" width="12" height="6" rx="2" fill="currentColor" opacity="0.85"></rect>
  ${chamberLight(lightOn, 56, 42, 127)}
  <rect x="49" y="40" width="141" height="148" stroke="currentColor" stroke-opacity="0.32" stroke-width="1.6" fill="none"></rect>
  <g fill="currentColor" opacity="0.75">
    <rect x="46" y="56" width="5" height="15" rx="2"></rect>
    <rect x="46" y="155" width="5" height="15" rx="2"></rect>
  </g>
  ${fanMark(fanOn, 195.5, 114, 7.5)}
  <path d="M58 46 L82 46 L60 104 L58 104 Z" fill="currentColor" opacity="0.05"></path>
  <path d="M90 46 L100 46 L74 118 L68 118 Z" fill="currentColor" opacity="0.04"></path>
  <g fill="currentColor" opacity="0.22">
    <rect x="47" y="194" width="42" height="2.5" rx="1"></rect>
    <rect x="47" y="200" width="42" height="2.5" rx="1"></rect>
    <rect x="47" y="206" width="42" height="2.5" rx="1"></rect>
  </g>
  ${heatGlow(bedHeat, 54, 176, 132, 12)}
  <rect x="56" y="178" width="128" height="8" rx="1.5" fill="var(--ac-printer-plate, currentColor)" opacity="0.8"></rect>
  <rect x="64" y="186" width="112" height="3" rx="1.5" fill="currentColor" opacity="0.35"></rect>
  ${printedMass(!chamberBusy, progress, 56, 128, 178, 66, tip, previewUrl)}
  <g transform="${gantry}"
     style="${chamberBusy ? "display:none" : ""}">
    <rect x="49" y="48" width="141" height="1.6" fill="currentColor" opacity="0.2"></rect>
    <rect x="49" y="52" width="141" height="6" rx="2" fill="var(--ac-printer-rail, currentColor)" opacity="0.65"></rect>
    <g fill="currentColor" opacity="0.9">
      <rect x="49" y="44" width="13" height="20" rx="2"></rect>
      <rect x="177" y="44" width="13" height="20" rx="2"></rect>
    </g>
    <g transform="${nozzle}">
      ${heatGlow(nozzleHeat, 108, 60, 24, 18)}
      <rect x="102" y="40" width="36" height="25" rx="3" fill="currentColor"></rect>
      <g fill="var(--ac-printer-card-bg, #fff)" opacity="0.28">
        <rect x="107" y="45" width="20" height="2" rx="1"></rect>
        <rect x="107" y="50" width="20" height="2" rx="1"></rect>
        <rect x="107" y="55" width="20" height="2" rx="1"></rect>
      </g>
      <rect x="130" y="44" width="5" height="14" rx="2" fill="var(--ac-printer-accent, currentColor)" opacity="0.7"></rect>
      <path d="M113 65 h13 l-2.9 8 h-7.2 Z" fill="currentColor"></path>
      <path d="M115.9 73 h7.2 l-0.6 3 h-6 Z" fill="${tip}"></path>
    </g>
  </g>`;
var aceModule = (spools, active = 0, feed = "M188 88 C 216 94 214 116 196 122", feeding = true, unit = 0, remaining = []) => svg`
  <g id="ace-${unit}">
    <rect x="45" y="6" width="149" height="95" rx="11" fill="currentColor"></rect>
    <rect x="45" y="6" width="149" height="16" rx="8" fill="currentColor"></rect>
    <rect x="56" y="21" width="127" height="2" rx="1" fill="var(--ac-printer-card-bg, #fff)" opacity="0.28"></rect>
    <rect x="103" y="9" width="34" height="4" rx="2" fill="var(--ac-printer-card-bg, #fff)" opacity="0.22"></rect>
    ${SPOOL_CX.map(
  (cx, i) => svg`
      <rect x="${cx - 15}" y="38" width="30" height="40" rx="4" fill="var(--ac-printer-card-bg, #fff)" opacity="0.9"></rect>
      ${coil(cx, spools[i], remaining[i])}
      <rect x="${cx - 13.5}" y="40" width="4.5" height="36" rx="2" fill="currentColor" opacity="0.9"></rect>
      <rect x="${cx + 9}" y="40" width="4.5" height="36" rx="2" fill="currentColor" opacity="0.9"></rect>`
)}
    ${// Only the feeding unit shows a highlight, and only for a slot it owns.
// Previously this drew unconditionally with the caller's raw index, so
// the OTHER unit always got an out-of-range lookup and rendered
// x="NaN" -- which happened in every two-unit configuration.
SPOOL_CX[active] === void 0 ? nothing : svg`<rect x="${SPOOL_CX[active] - 17}" y="36" width="34" height="44" rx="5" fill="none"
                stroke="${spools[active] ?? "currentColor"}" stroke-width="2"></rect>`}
    <rect x="56" y="86" width="127" height="7" rx="3.5" fill="var(--ac-printer-card-bg, #fff)" opacity="0.18"></rect>
    <circle cx="186" cy="16" r="2.6" fill="var(--ac-printer-accent, currentColor)"></circle>
  </g>
  <path d="${feed}" stroke="${feeding && spools[active] || "var(--ac-printer-rail, currentColor)"}"
        stroke-opacity="0.9" stroke-width="4.5" stroke-linecap="round" fill="none"></path>`;
var PRINTER_ART = {
  kobra_s1: {
    kind: "kobra_s1",
    park: 36,
    viewBox: "0 0 240 240",
    chamber: [16.7, 19.6, 20, 19.2],
    travel: 104,
    body: s1Body
  },
  // Kobra 3 / Kobra 2 — open-frame bedslinger.
  kobra_3: {
    kind: "kobra_3",
    park: 36,
    viewBox: "0 0 240 240",
    chamber: [19, 24, 30, 24],
    travel: 92,
    body: ({
      gantry,
      nozzle,
      tip = "var(--ac-printer-accent, currentColor)",
      lightOn = false,
      progress = 0,
      chamberBusy = false,
      previewUrl,
      nozzleHeat = 0,
      bedHeat = 0,
      fanOn = false,
      status = "idle"
    }) => svg`
      <g fill="currentColor">
        <rect x="20" y="176" width="200" height="38" rx="7"></rect>
        <rect x="40" y="42" width="18" height="136" rx="3"></rect>
        <rect x="182" y="42" width="18" height="136" rx="3"></rect>
        <rect x="40" y="30" width="160" height="16" rx="5"></rect>
        <rect x="36" y="214" width="24" height="8" rx="3" opacity="0.8"></rect>
        <rect x="180" y="214" width="24" height="8" rx="3" opacity="0.8"></rect>
      </g>
      <g fill="var(--ac-printer-card-bg, #fff)" opacity="0.2">
        <rect x="46" y="52" width="6" height="120" rx="3"></rect>
        <rect x="188" y="52" width="6" height="120" rx="3"></rect>
        <rect x="52" y="35" width="136" height="5" rx="2.5"></rect>
      </g>
      <g fill="currentColor" opacity="0.85">
        <circle cx="52" cy="38" r="5"></circle>
        <circle cx="188" cy="38" r="5"></circle>
      </g>
      <g fill="currentColor" opacity="0.22">
        <rect x="34" y="184" width="44" height="2.5" rx="1"></rect>
        <rect x="34" y="190" width="44" height="2.5" rx="1"></rect>
        <rect x="34" y="196" width="44" height="2.5" rx="1"></rect>
      </g>
      <rect x="146" y="29" width="50" height="15" rx="3" fill="currentColor" opacity="0.9"></rect>
      <rect x="150" y="32" width="42" height="9" rx="2" fill="#101216"></rect>
      ${screenFace(status, 171, 36.5, 5)}
      ${chamberLight(lightOn, 52, 47, 136)}
      <rect x="54" y="177" width="132" height="3" rx="1.5" fill="var(--ac-printer-rail, currentColor)" opacity="0.5"></rect>
      ${heatGlow(bedHeat, 60, 164, 120, 12)}
      <rect x="62" y="166" width="116" height="8" rx="1.5" fill="var(--ac-printer-plate, currentColor)" opacity="0.8"></rect>
      <rect x="70" y="174" width="100" height="4" rx="2" fill="currentColor" opacity="0.35"></rect>
      ${printedMass(!chamberBusy, progress, 62, 116, 166, 58, tip, previewUrl)}
      ${fanMark(fanOn, 30, 196, 7)}
      <g transform="${gantry}"
     style="${chamberBusy ? "display:none" : ""}">
        <rect x="42" y="54" width="156" height="1.6" fill="currentColor" opacity="0.2"></rect>
        <rect x="42" y="58" width="156" height="6" rx="2" fill="var(--ac-printer-rail, currentColor)" opacity="0.65"></rect>
        <g fill="currentColor" opacity="0.9">
          <rect x="42" y="50" width="12" height="20" rx="2"></rect>
          <rect x="186" y="50" width="12" height="20" rx="2"></rect>
        </g>
        <g transform="${nozzle}">
          ${heatGlow(nozzleHeat, 108, 66, 24, 18)}
          <rect x="102" y="46" width="36" height="25" rx="3" fill="currentColor"></rect>
          <g fill="var(--ac-printer-card-bg, #fff)" opacity="0.28">
            <rect x="107" y="51" width="20" height="2" rx="1"></rect>
            <rect x="107" y="56" width="20" height="2" rx="1"></rect>
            <rect x="107" y="61" width="20" height="2" rx="1"></rect>
          </g>
          <rect x="130" y="50" width="5" height="14" rx="2" fill="var(--ac-printer-accent, currentColor)" opacity="0.7"></rect>
          <path d="M113 71 h13 l-2.9 8 h-7.2 Z" fill="currentColor"></path>
          <path d="M115.9 79 h7.2 l-0.6 3 h-6 Z" fill="${tip}"></path>
        </g>
      </g>`
  },
  // Mandatory fallback: deliberately schematic, dashed chamber outline.
  fdm: {
    kind: "fdm",
    park: 34,
    viewBox: "0 0 240 240",
    chamber: [20, 19.2, 29, 19.2],
    travel: 92,
    // Narrower flank than the S1, so its spool sits at cx 222.
    body: ({
      gantry,
      nozzle,
      tip = "var(--ac-printer-accent, currentColor)",
      lightOn = false,
      progress = 0,
      chamberBusy = false,
      previewUrl,
      nozzleHeat = 0,
      bedHeat = 0,
      fanOn = false,
      status = "idle"
    }) => svg`
      <g fill="currentColor">
        <rect x="24" y="178" width="192" height="34" rx="6"></rect>
        <rect x="30" y="46" width="16" height="132" rx="3"></rect>
        <rect x="194" y="46" width="16" height="132" rx="3"></rect>
        <rect x="30" y="34" width="180" height="14" rx="4"></rect>
      </g>
      <rect x="46" y="52" width="148" height="126" stroke="currentColor" stroke-opacity="0.22" stroke-width="2" stroke-dasharray="5 6" fill="none"></rect>
      <g fill="var(--ac-printer-card-bg, #fff)" opacity="0.18">
        <rect x="35" y="52" width="6" height="120" rx="3"></rect>
        <rect x="199" y="52" width="6" height="120" rx="3"></rect>
      </g>
      ${heatGlow(bedHeat, 58, 168, 124, 12)}
      <rect x="60" y="170" width="120" height="8" rx="1.5" fill="var(--ac-printer-plate, currentColor)" opacity="0.8"></rect>
      <rect x="68" y="178" width="104" height="4" rx="2" fill="currentColor" opacity="0.35"></rect>
      ${printedMass(!chamberBusy, progress, 60, 120, 170, 60, tip, previewUrl)}
      ${fanMark(fanOn, 34, 200, 6.5)}
      <rect x="154" y="33" width="50" height="16" rx="3" fill="currentColor" opacity="0.9"></rect>
      <rect x="158" y="36" width="42" height="10" rx="2" fill="#101216"></rect>
      ${screenFace(status, 179, 41, 5)}
      ${chamberLight(lightOn, 46, 52, 148)}
      <g fill="currentColor" opacity="0.2">
        <rect x="36" y="188" width="40" height="2.5" rx="1"></rect>
        <rect x="36" y="194" width="40" height="2.5" rx="1"></rect>
      </g>
      <g transform="${gantry}"
     style="${chamberBusy ? "display:none" : ""}">
        <rect x="32" y="60" width="176" height="6" rx="2" fill="var(--ac-printer-rail, currentColor)" opacity="0.65"></rect>
        <g fill="currentColor" opacity="0.9">
          <rect x="32" y="52" width="12" height="20" rx="2"></rect>
          <rect x="196" y="52" width="12" height="20" rx="2"></rect>
        </g>
        <g transform="${nozzle}">
          ${heatGlow(nozzleHeat, 109, 67, 22, 17)}
          <rect x="104" y="48" width="32" height="24" rx="3" fill="currentColor"></rect>
          <g fill="var(--ac-printer-card-bg, #fff)" opacity="0.26">
            <rect x="109" y="53" width="18" height="2" rx="1"></rect>
            <rect x="109" y="58" width="18" height="2" rx="1"></rect>
            <rect x="109" y="63" width="18" height="2" rx="1"></rect>
          </g>
          <path d="M113 72 h13 l-3 7.5 h-7 Z" fill="currentColor"></path>
          <path d="M116 79.5 h7 l-0.5 2.5 h-6 Z" fill="${tip}"></path>
        </g>
      </g>`
  },
  // Photon Mono family. #gantry is the build platform, #nozzle its arm — ids
  // kept so the animation code stays model-agnostic.
  resin: {
    kind: "resin",
    park: 0,
    viewBox: "0 0 240 240",
    chamber: [16, 26, 38, 26],
    travel: 76,
    // Resin machines have no chamber light to show, so lightOn is ignored.
    body: ({
      gantry,
      tip = "var(--ac-printer-accent, currentColor)",
      progress = 0,
      chamberBusy = false,
      status = "idle"
    }) => svg`
      <path d="M74 34 h92 a8 8 0 0 1 8 8 v108 h-108 v-108 a8 8 0 0 1 8 -8 Z" stroke="currentColor" stroke-opacity="0.45" stroke-width="4" fill="none"></path>
      <g fill="currentColor">
        <rect x="36" y="150" width="168" height="62" rx="8"></rect>
        <rect x="52" y="212" width="24" height="8" rx="3" opacity="0.8"></rect>
        <rect x="164" y="212" width="24" height="8" rx="3" opacity="0.8"></rect>
        <rect x="58" y="40" width="16" height="110" rx="4"></rect>
      </g>
      <rect x="104" y="26" width="36" height="6" rx="3" fill="currentColor" opacity="0.5"></rect>
      <rect x="63" y="46" width="5" height="100" rx="2.5" fill="var(--ac-printer-card-bg, #fff)" opacity="0.22"></rect>
      <rect x="130" y="162" width="60" height="26" rx="5" fill="currentColor" opacity="0.9"></rect>
      <rect x="136" y="168" width="48" height="14" rx="3" fill="#101216"></rect>
      ${screenFace(status, 160, 175, 5.5)}
      <g fill="currentColor" opacity="0.2">
        <rect x="50" y="176" width="46" height="2.5" rx="1"></rect>
        <rect x="50" y="182" width="46" height="2.5" rx="1"></rect>
        <rect x="50" y="188" width="46" height="2.5" rx="1"></rect>
      </g>
      <path d="M80 126 h84 l-6 24 h-72 Z" fill="currentColor" opacity="0.28"></path>
      <path d="M85 137 h74" stroke="${tip}" stroke-opacity="0.75" stroke-width="3"></path>
      <rect x="78" y="118" width="96" height="8" rx="2" fill="var(--ac-printer-plate, currentColor)" opacity="0.8"></rect>
      <g transform="${gantry}">
        <rect x="70" y="46" width="14" height="10" rx="2" fill="var(--ac-printer-rail, currentColor)" opacity="0.7"></rect>
        <g>
          <rect x="84" y="48" width="66" height="6" rx="2" fill="currentColor"></rect>
          <rect x="96" y="54" width="42" height="14" rx="2" fill="var(--ac-printer-accent, currentColor)" opacity="0.8"></rect>
        </g>
        ${resinPrint(!chamberBusy, progress, tip)}
      </g>`
  }
};
var MATCHERS = [
  ["kobra s1", "kobra_s1"],
  ["kobra 3", "kobra_3"],
  ["kobra 2", "kobra_3"],
  ["photon", "resin"],
  ["mono", "resin"],
  ["m5s", "resin"],
  ["m7", "resin"],
  // First-gen Kobra / Neo / Go / Plus / Max: open-frame bedslingers, which is
  // exactly what the kobra_3 body draws. Must stay last -- it is a prefix of
  // every entry above.
  ["kobra", "kobra_3"]
];
var gantryTransform = (art, progress, cameraLive) => cameraLive ? `translate(0 ${-art.park})` : `translate(0 ${(art.travel * (1 - progress / 100)).toFixed(1)})`;
var nozzleTransform = (x, span = 48) => `translate(${(x * span).toFixed(1)} 0)`;
var ACE_PITCH = 101;
function withAce(art, count, spools = DEFAULT_SPOOLS, active = 0, remaining = []) {
  if (count < 1) {
    return art;
  }
  const offset = count * ACE_PITCH + 14;
  const height = 221 + offset + 8;
  const [t, r, b, l] = art.chamber;
  const top0 = t / 100 * 240;
  const bottom0 = 240 - b / 100 * 240;
  return {
    ...art,
    kind: art.kind === "kobra_s1" ? "kobra_s1_combo" : art.kind,
    viewBox: `0 0 240 ${height}`,
    chamber: [
      +((top0 + offset) / height * 100).toFixed(2),
      r,
      +((height - (bottom0 + offset)) / height * 100).toFixed(2),
      l
    ],
    body: (st) => svg`
      ${Array.from({ length: count }, (_, k) => {
      const drop = offset - k * ACE_PITCH;
      const feedActive = Math.floor(active / 4) === k;
      const feed = k === 0 && count === 2 ? `M188 88 C 214 94 219 106 219 130 L 219 ${drop + 8} C 219 ${drop + 17} 210 ${drop + 21} 200 ${drop + 22}` : `M188 88 C 216 94 214 ${drop + 12} 196 ${drop + 22}`;
      const slot = spools.slice(k * 4, k * 4 + 4);
      const slotRemaining = remaining.slice(k * 4, k * 4 + 4);
      const localActive = feedActive ? active - k * 4 : -1;
      return svg`<g transform="translate(0 ${k * ACE_PITCH})">
          ${aceModule(slot, localActive, feed, feedActive, k, slotRemaining)}
        </g>`;
    })}
      <g transform="translate(0 ${offset})">${art.body(st)}</g>`
  };
}
var sideSpool = (color = "var(--ac-printer-accent, currentColor)", cy = 70, cx = 219.5) => svg`
  <g>
    <path d="M${cx - 7.5} ${cy - 12} C ${cx - 7.5} ${cy - 26} ${cx - 13.5} ${cy - 34} ${cx - 31.5} ${cy - 32}" stroke="${color}"
          stroke-opacity="0.9" stroke-width="3.5" stroke-linecap="round" fill="none"></path>
    <rect x="${cx - 23.5}" y="${cy - 3}" width="16" height="6" rx="3" fill="currentColor" opacity="0.85"></rect>
    <rect x="${cx - 8.5}" y="${cy - 18}" width="17" height="36" rx="2" fill="${color}"
          stroke="${edgeFor(color)}" stroke-width="0.75"></rect>
    <!-- Wound filament: a couple of banded highlights so the reel reads as
         coiled material rather than a solid block of colour. -->
    <rect x="${cx - 8.5}" y="${cy - 13}" width="17" height="1.2" fill="var(--ac-printer-card-bg, #fff)" opacity="0.16"></rect>
    <rect x="${cx - 8.5}" y="${cy + 10}" width="17" height="1.2" fill="#000" opacity="0.14"></rect>
    <!-- The hub, which is what makes it a reel seen edge-on and not a pill. -->
    <rect x="${cx - 8.5}" y="${cy - 4.5}" width="17" height="9" rx="1"
          fill="var(--ac-printer-card-bg, #fff)" opacity="0.30"></rect>
    <rect x="${cx - 2.2}" y="${cy - 3}" width="4.4" height="6" rx="1"
          fill="currentColor" opacity="0.55"></rect>
    <rect x="${cx - 12.5}" y="${cy - 23}" width="5" height="46" rx="2.5" fill="currentColor" opacity="0.9"></rect>
    <rect x="${cx + 7.5}" y="${cy - 23}" width="5" height="46" rx="2.5" fill="currentColor" opacity="0.9"></rect>
  </g>`;
var NAMED_FILAMENT = {
  black: "#1c1c1e",
  white: "#f2f2f0",
  grey: "#8a9099",
  gray: "#8a9099",
  silver: "#c2c7cc",
  red: "#d94a3d",
  orange: "#e07a2f",
  yellow: "#e8b33a",
  green: "#3aa87a",
  blue: "#2f7fd1",
  purple: "#7a5cd1",
  pink: "#d9679b",
  brown: "#8a5a3b",
  clear: "#cfd8de",
  natural: "#e6ded2",
  transparent: "#cfd8de"
};
var UNKNOWN = "var(--ac-printer-accent, currentColor)";
function filamentColor(raw) {
  if (!raw) {
    return UNKNOWN;
  }
  const s = String(raw).trim();
  if (/^#[0-9a-f]{8}$/i.test(s)) {
    return s.slice(0, 7);
  }
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(s)) {
    return s;
  }
  if (/^[0-9a-f]{6}([0-9a-f]{2})?$/i.test(s)) {
    return "#" + s.slice(0, 6);
  }
  if (/^(rgb|hsl)a?\(/i.test(s)) {
    return s;
  }
  return NAMED_FILAMENT[s.toLowerCase()] ?? UNKNOWN;
}
var rgbToHex = (rgb) => Array.isArray(rgb) && rgb.length >= 3 ? "#" + rgb.slice(0, 3).map(
  (c) => Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2, "0")
).join("") : void 0;
var spoolColors = (slots = [], count = 1) => Array.from({ length: Math.max(1, count) * 4 }, (_, i) => {
  const slot = slots[i];
  if (!slot) {
    return filamentColor(null);
  }
  if (slot.color_hex) {
    return filamentColor(slot.color_hex);
  }
  if (Array.isArray(slot.color)) {
    return filamentColor(rgbToHex(slot.color));
  }
  return filamentColor(typeof slot.color === "string" ? slot.color : null);
});
var activeTipColor = (slots, active = 0, singleFilament) => slots?.length ? filamentColor(slots[active]?.color) : filamentColor(singleFilament);
var renderPrinter = (art, state = {}) => html` <svg
    class="ac-apr-svg"
    viewBox=${art.viewBox}
    fill="none"
    preserveAspectRatio="xMidYMid meet"
    aria-hidden="true"
  >
    ${art.body({
  ...state,
  gantry: gantryTransform(
    art,
    (state.progress ?? 0) * 100,
    !!state.cameraLive
  ),
  // The camera owns the chamber when it is playing, so nothing modelled
  // is drawn into it. The part on the plate is suppressed entirely; it
  // would be drawn over the video.
  chamberBusy: !!state.cameraLive,
  nozzle: nozzleTransform(state.nozzleX ?? 0)
})}
  </svg>`;
var artAspect = (art) => {
  const [, , w, h] = art.viewBox.split(/\s+/).map(Number);
  return `${w} / ${h}`;
};
var cameraInset = (art) => art.chamber.map((v) => `${v}%`).join(" ");
var withFilamentSource = (art, aceCount, spools = DEFAULT_SPOOLS, active = 0, remaining = []) => aceCount > 0 ? withAce(art, aceCount, spools, active, remaining) : {
  ...art,
  body: (st) => svg`
          ${sideSpool(st.tip, art.kind === "kobra_3" ? 80 : 70, art.kind === "fdm" ? 222 : 219.5)}
          ${art.body(st)}`
};
function selectPrinterArt(machineName, aceCount = 0, override, spools, activeSlot = 0, remaining = []) {
  const name = (machineName ?? "").toLowerCase();
  let kind = "fdm";
  let units = aceCount;
  if (override === "kobra_s1_combo") {
    kind = "kobra_s1";
    units = units > 0 ? units : 1;
  } else if (override && // `override` arrives from a DOM attribute, so it can be any string.
  // Plain `PRINTER_ART[override]` is truthy for 'constructor' and friends,
  // which then blows up in artAspect() on `art.viewBox.split`.
  Object.prototype.hasOwnProperty.call(PRINTER_ART, override)) {
    kind = override;
  } else {
    for (const [needle, k] of MATCHERS) {
      if (name.includes(needle)) {
        kind = k;
        break;
      }
    }
  }
  const art = PRINTER_ART[kind];
  if (kind === "resin") {
    return art;
  }
  return withFilamentSource(art, units, spools, activeSlot, remaining);
}
export {
  DEFAULT_SPOOLS,
  PRINTER_ART,
  SPOOL_CX,
  activeTipColor,
  anycubicCube,
  artAspect,
  cameraInset,
  filamentColor,
  gantryTransform,
  nozzleTransform,
  renderPrinter,
  rgbToHex,
  selectPrinterArt,
  sideSpool,
  spoolColors,
  withAce,
  withFilamentSource
};
