/**
 * Printer artwork for animated_printer.ts — inline SVG, no asset imports.
 *
 * Every body is frame-only: the build chamber is negative space, so the
 * camera element sitting behind it shows through. Chamber boxes are given as
 * percentage insets for positioning `.ac-apr-camera`.
 *
 * Theme wiring (set these on the host / .ac-apr-svg):
 *   color                  <- var(--primary-text-color)                 chassis
 *   --ac-printer-accent    <- var(--state-icon-active-color, var(--primary-color))
 *   --ac-printer-rail      <- var(--secondary-text-color)               X rail
 *   --ac-printer-plate     <- var(--divider-color)                      build plate
 *   --ac-printer-card-bg   <- var(--ha-card-background, var(--card-background-color))
 *                             (ACE spool holes punch to the card, not to white)
 */
import { html, nothing, svg, SVGTemplateResult, TemplateResult } from 'lit';

export type PrinterArtKind = 'kobra_s1' | 'kobra_s1_combo' | 'kobra_3' | 'fdm' | 'resin';

export interface PrinterArt {
  kind: PrinterArtKind;
  viewBox: string;
  /** Camera inset in %: [top, right, bottom, left] */
  chamber: [number, number, number, number];
  /** Gantry Y travel in user units; 0 = parked at top of chamber. */
  travel: number;
  /**
   * Extra lift applied ONLY while the camera is live, so the head clears
   * the chamber entirely instead of hanging into the top of the picture.
   * Authoring the gantry "parked at 0" still left the hotend ~36 units
   * inside the stream, which is a quarter of the S1's chamber height.
   */
  park: number;
  body: (s: PrinterBodyState) => SVGTemplateResult;
}

/**
 * Everything the artwork can reflect about the machine.
 *
 * `cameraLive` is not decoration: anything drawn INSIDE the build chamber has
 * to disappear when the stream is up, or the card covers the video it exists
 * to show. Bodies must check it before drawing into the chamber.
 */
export interface PrinterBodyState {
  gantry: string;
  nozzle: string;
  /** Active filament colour, for the nozzle tip and the feed tube. */
  tip?: string;
  /** The printer's own chamber light entity. */
  lightOn?: boolean;
  /** 0-1. Drives the printed mass rising off the plate. */
  progress?: number;
  /** Suppresses everything inside the chamber, so the stream stays clear. */
  cameraLive?: boolean;
  /** 0-1, how far each heater is toward its own target. */
  nozzleHeat?: number;
  bedHeat?: number;
  /** Part-cooling fan running. */
  fanOn?: boolean;
  /** What the screen shows. */
  status?: 'idle' | 'printing' | 'paused' | 'error';
}

/* ------------------------------------------------------------------ pieces */

export const SPOOL_CX = [66.5, 102, 137.5, 173];
export const DEFAULT_SPOOLS = ['#d94a3d', '#2f7fd1', '#e8b33a', '#3aa87a'];

/**
 * The Anycubic cube, as shown on the printer's own display.
 *
 * Drawn rather than embedded: the brand assets this integration already ships
 * in custom_components/anycubic_cloud/brand/ are 256px PNGs, and inlining one
 * as a data URI would cost ~22KB in every bundle to fill a 15-unit box. The
 * mark is three flat quadrilaterals, so it vectorises exactly, and the face
 * colours below are sampled from that same icon.png.
 *
 * Fixed colours on purpose. This is a manufacturer's mark identifying the
 * device, not themeable furniture -- recolouring it per theme would make it
 * something other than the logo. It sits on its own dark screen panel so it
 * reads in both themes.
 *
 * @param cx  centre x       @param cy  centre y       @param r  half-width
 */
export const anycubicCube = (cx: number, cy: number, r: number) => {
  const h = r * 0.575; // half-height of a face's vertical edge
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

/**
 * The chamber LED bar under the top rail, driven by the printer's own light
 * entity rather than drawn as decoration.
 *
 * Off is deliberately still visible: an unlit strip is part of the machine, so
 * it dims to the chassis colour instead of vanishing. On adds a soft wash
 * below it -- kept low-opacity because the camera stream sits directly behind
 * this area, and a bright overlay would fog the video it is meant to light.
 */
const chamberLight = (on: boolean, x: number, y: number, w: number) => svg`
  ${
    on
      ? svg`<rect x="${x - 2}" y="${y}" width="${w + 4}" height="26" rx="6"
              fill="var(--ac-printer-light, #ffd88a)" opacity="0.13"></rect>`
      : nothing
  }
  <rect x="${x}" y="${y}" width="${w}" height="3" rx="1.5"
        fill="${on ? 'var(--ac-printer-light, #ffd88a)' : 'currentColor'}"
        opacity="${on ? 0.95 : 0.3}"></rect>`;

/**
 * The object being printed, rising off the plate with progress.
 *
 * Draws NOTHING while the camera is live. The stream shows the real print, and
 * a modelled block over it would hide the one thing worth looking at -- the
 * same reasoning that parks the gantry at the top.
 *
 * Inset and slightly tapered, because a print is a mass on the plate rather
 * than a full-width slab: at low progress it should read as "something is
 * starting", not as a bar chart.
 */
const printedMass = (
  visible: boolean,
  progress: number,
  plateX: number,
  plateW: number,
  plateY: number,
  maxH: number,
  tip: string,
) => {
  if (!visible || progress <= 0.005) return nothing;
  const h = Math.min(1, progress) * maxH;
  const inset = plateW * 0.22;
  const taper = Math.min(6, h * 0.25);
  const x = plateX + inset;
  const w = plateW - inset * 2;
  return svg`
    <path d="M${x} ${plateY} L${x + taper} ${plateY - h} L${x + w - taper} ${plateY - h} L${x + w} ${plateY} Z"
          fill="${tip}" opacity="0.85"></path>
    <rect x="${x + taper}" y="${plateY - h}" width="${w - taper * 2}" height="1.5"
          fill="${tip}" opacity="0.55"></rect>`;
};

/**
 * Heat as a wash over the part itself rather than a separate badge.
 *
 * The caller passes progress toward that part's OWN target, so a bed at 60C
 * with a 60C target is fully warm while one at 60C with no target is not
 * warming at all -- which is what the machine actually means.
 */
const heatGlow = (heat: number, x: number, y: number, w: number, h: number) =>
  heat <= 0.02
    ? nothing
    : svg`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3"
            fill="var(--ac-printer-heat, #ff7a3d)"
            opacity="${(0.12 + heat * 0.45).toFixed(2)}"></rect>`;

/** Part-cooling fan, on the chassis and so never over the stream. */
const fanMark = (on: boolean, cx: number, cy: number, r: number) => svg`
  <g opacity="${on ? 0.9 : 0.3}">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="currentColor" stroke-width="1.3"></circle>
    <g class="${on ? 'ac-apr-fan' : ''}">
      <path d="M${cx} ${cy - r * 0.7} A${r * 0.7} ${r * 0.7} 0 0 1 ${cx + r * 0.61} ${cy + r * 0.35} L${cx} ${cy} Z" fill="currentColor"></path>
      <path d="M${cx + r * 0.61} ${cy + r * 0.35} A${r * 0.7} ${r * 0.7} 0 0 1 ${cx - r * 0.61} ${cy + r * 0.35} L${cx} ${cy} Z" fill="currentColor" opacity="0.7"></path>
      <path d="M${cx - r * 0.61} ${cy + r * 0.35} A${r * 0.7} ${r * 0.7} 0 0 1 ${cx} ${cy - r * 0.7} L${cx} ${cy} Z" fill="currentColor" opacity="0.45"></path>
    </g>
  </g>`;

/**
 * What the display shows.
 *
 * Idle and printing show the maker's cube; paused and error replace it,
 * because a fault is the one thing worth interrupting branding for. The
 * screen sits outside the build chamber, so it stays readable with the
 * camera running.
 */
const screenFace = (
  status: PrinterBodyState['status'],
  cx: number,
  cy: number,
  r: number,
) => {
  if (status === 'paused') {
    const b = r * 0.32;
    return svg`<g>
      <rect x="${cx - b * 1.9}" y="${cy - r * 0.75}" width="${b}" height="${r * 1.5}" rx="${b * 0.3}" fill="#e8b33a"></rect>
      <rect x="${cx + b * 0.9}" y="${cy - r * 0.75}" width="${b}" height="${r * 1.5}" rx="${b * 0.3}" fill="#e8b33a"></rect>
    </g>`;
  }
  if (status === 'error') {
    return svg`<g>
      <path d="M${cx} ${cy - r} L${cx + r} ${cy + r * 0.72} L${cx - r} ${cy + r * 0.72} Z"
            fill="none" stroke="#e05252" stroke-width="${r * 0.24}" stroke-linejoin="round"></path>
      <rect x="${cx - r * 0.1}" y="${cy - r * 0.3}" width="${r * 0.2}" height="${r * 0.62}" rx="${r * 0.1}" fill="#e05252"></rect>
    </g>`;
  }
  return anycubicCube(cx, cy, r);
};

const s1Body = ({
  gantry,
  nozzle,
  tip = 'var(--ac-printer-accent, currentColor)',
  lightOn = false,
  progress = 0,
  cameraLive = false,
  nozzleHeat = 0,
  bedHeat = 0,
  fanOn = false,
  status = 'idle',
}: PrinterBodyState) => svg`
  <g fill="currentColor">
    <rect x="38" y="20" width="163" height="20" rx="5"></rect>
    <rect x="38" y="34" width="11" height="162"></rect>
    <rect x="190" y="34" width="11" height="162"></rect>
    <rect x="38" y="188" width="163" height="26" rx="5"></rect>
    <rect x="47" y="214" width="20" height="7" rx="3" opacity="0.7"></rect>
    <rect x="172" y="214" width="20" height="7" rx="3" opacity="0.7"></rect>
  </g>
  <rect x="54" y="24" width="94" height="2" rx="1" fill="var(--ac-printer-card-bg, #fff)" opacity="0.3"></rect>
  <g id="screen">
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
  ${printedMass(!cameraLive, progress, 56, 128, 178, 118, tip)}
  <g id="gantry" transform="${gantry}">
    <rect x="49" y="48" width="141" height="1.6" fill="currentColor" opacity="0.2"></rect>
    <rect id="xaxis" x="49" y="52" width="141" height="6" rx="2" fill="var(--ac-printer-rail, currentColor)" opacity="0.65"></rect>
    <g fill="currentColor" opacity="0.9">
      <rect x="49" y="44" width="13" height="20" rx="2"></rect>
      <rect x="177" y="44" width="13" height="20" rx="2"></rect>
    </g>
    <g id="nozzle" transform="${nozzle}">
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

/**
 * ACE Pro / ACE 2 Pro: 366 x 234 mm, drawn at the same scale as the S1 body and
 * sitting ON TOP of it (that is where it goes on a Combo). Four spool ports in
 * a row across the front; the PTFE bundle loops down into the printer's top.
 */
/** feed = PTFE bundle path from this unit down into the printer's top-right. */
const aceModule = (
  spools: string[],
  /** Slot to highlight, or -1 when this unit is not the one feeding. */
  active = 0,
  feed = 'M188 88 C 216 94 214 116 196 122',
  /** Only the unit actually feeding the print draws its tube in filament colour. */
  feeding = true,
  /** Distinguishes the two units when a Combo carries both. */
  unit = 0,
) => svg`
  <g id="ace-${unit}">
    <rect x="45" y="6" width="149" height="95" rx="11" fill="currentColor"></rect>
    <rect x="45" y="6" width="149" height="16" rx="8" fill="currentColor"></rect>
    <rect x="56" y="21" width="127" height="2" rx="1" fill="var(--ac-printer-card-bg, #fff)" opacity="0.28"></rect>
    <rect x="103" y="9" width="34" height="4" rx="2" fill="var(--ac-printer-card-bg, #fff)" opacity="0.22"></rect>
    ${SPOOL_CX.map((cx, i) => svg`
      <rect x="${cx - 15}" y="38" width="30" height="40" rx="4" fill="var(--ac-printer-card-bg, #fff)" opacity="0.9"></rect>
      <rect x="${cx - 9}" y="42" width="18" height="32" rx="2" fill="${spools[i] ?? 'var(--ac-printer-rail, currentColor)'}"></rect>
      <rect x="${cx - 9}" y="55" width="18" height="5" fill="var(--ac-printer-card-bg, #fff)" opacity="0.25"></rect>
      <rect x="${cx - 13.5}" y="40" width="4.5" height="36" rx="2" fill="currentColor" opacity="0.9"></rect>
      <rect x="${cx + 9}" y="40" width="4.5" height="36" rx="2" fill="currentColor" opacity="0.9"></rect>`)}
    ${
      // Only the feeding unit shows a highlight, and only for a slot it owns.
      // Previously this drew unconditionally with the caller's raw index, so
      // the OTHER unit always got an out-of-range lookup and rendered
      // x="NaN" -- which happened in every two-unit configuration.
      SPOOL_CX[active] === undefined
        ? nothing
        : svg`<rect x="${SPOOL_CX[active] - 17}" y="36" width="34" height="44" rx="5" fill="none"
                stroke="${spools[active] ?? 'currentColor'}" stroke-width="2"></rect>`
    }
    <rect x="56" y="86" width="127" height="7" rx="3.5" fill="var(--ac-printer-card-bg, #fff)" opacity="0.18"></rect>
    <circle cx="186" cy="16" r="2.6" fill="var(--ac-printer-accent, currentColor)"></circle>
  </g>
  <path d="${feed}" stroke="${(feeding && spools[active]) || 'var(--ac-printer-rail, currentColor)'}"
        stroke-opacity="0.9" stroke-width="4.5" stroke-linecap="round" fill="none"></path>`;

/* ------------------------------------------------------------------- table */

export const PRINTER_ART: Record<Exclude<PrinterArtKind, 'kobra_s1_combo'>, PrinterArt> = {
  kobra_s1: {
    kind: 'kobra_s1',
    park: 36,
    viewBox: '0 0 240 240',
    chamber: [16.7, 19.6, 20, 19.2],
    travel: 104,
    body: s1Body,
  },

  // Kobra 3 / Kobra 2 — open-frame bedslinger.
  kobra_3: {
    kind: 'kobra_3',
    park: 36,
    viewBox: '0 0 240 240',
    chamber: [19, 24, 30, 24],
    travel: 92,
    body: ({
      gantry,
      nozzle,
      tip = 'var(--ac-printer-accent, currentColor)',
      lightOn = false,
      progress = 0,
      cameraLive = false,
      nozzleHeat = 0,
      bedHeat = 0,
      fanOn = false,
      status = 'idle',
    }: PrinterBodyState) => svg`
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
      ${printedMass(!cameraLive, progress, 62, 116, 166, 100, tip)}
      ${fanMark(fanOn, 30, 196, 7)}
      <g id="gantry" transform="${gantry}">
        <rect x="42" y="54" width="156" height="1.6" fill="currentColor" opacity="0.2"></rect>
        <rect id="xaxis" x="42" y="58" width="156" height="6" rx="2" fill="var(--ac-printer-rail, currentColor)" opacity="0.65"></rect>
        <g fill="currentColor" opacity="0.9">
          <rect x="42" y="50" width="12" height="20" rx="2"></rect>
          <rect x="186" y="50" width="12" height="20" rx="2"></rect>
        </g>
        <g id="nozzle" transform="${nozzle}">
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
      </g>`,
  },

  // Mandatory fallback: deliberately schematic, dashed chamber outline.
  fdm: {
    kind: 'fdm',
    park: 34,
    viewBox: '0 0 240 240',
    chamber: [20, 19.2, 29, 19.2],
    travel: 92,
    // Narrower flank than the S1, so its spool sits at cx 222.
    body: ({
      gantry,
      nozzle,
      tip = 'var(--ac-printer-accent, currentColor)',
      lightOn = false,
      progress = 0,
      cameraLive = false,
      nozzleHeat = 0,
      bedHeat = 0,
      fanOn = false,
      status = 'idle',
    }: PrinterBodyState) => svg`
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
      ${printedMass(!cameraLive, progress, 60, 120, 170, 104, tip)}
      ${fanMark(fanOn, 34, 200, 6.5)}
      <rect x="154" y="33" width="50" height="16" rx="3" fill="currentColor" opacity="0.9"></rect>
      <rect x="158" y="36" width="42" height="10" rx="2" fill="#101216"></rect>
      ${screenFace(status, 179, 41, 5)}
      ${chamberLight(lightOn, 46, 52, 148)}
      <g fill="currentColor" opacity="0.2">
        <rect x="36" y="188" width="40" height="2.5" rx="1"></rect>
        <rect x="36" y="194" width="40" height="2.5" rx="1"></rect>
      </g>
      <g id="gantry" transform="${gantry}">
        <rect id="xaxis" x="32" y="60" width="176" height="6" rx="2" fill="var(--ac-printer-rail, currentColor)" opacity="0.65"></rect>
        <g fill="currentColor" opacity="0.9">
          <rect x="32" y="52" width="12" height="20" rx="2"></rect>
          <rect x="196" y="52" width="12" height="20" rx="2"></rect>
        </g>
        <g id="nozzle" transform="${nozzle}">
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
      </g>`,
  },

  // Photon Mono family. #gantry is the build platform, #nozzle its arm — ids
  // kept so the animation code stays model-agnostic.
  resin: {
    kind: 'resin',
    park: 0,
    viewBox: '0 0 240 240',
    chamber: [16, 26, 38, 26],
    travel: 76,
    // Resin machines have no chamber light to show, so lightOn is ignored.
    body: ({ gantry, tip = 'var(--ac-printer-accent, currentColor)' }: PrinterBodyState) => svg`
      <path d="M74 34 h92 a8 8 0 0 1 8 8 v108 h-108 v-108 a8 8 0 0 1 8 -8 Z" stroke="currentColor" stroke-opacity="0.45" stroke-width="4" fill="none"></path>
      <g fill="currentColor">
        <rect x="36" y="150" width="168" height="62" rx="8"></rect>
        <rect x="52" y="212" width="24" height="8" rx="3" opacity="0.8"></rect>
        <rect x="164" y="212" width="24" height="8" rx="3" opacity="0.8"></rect>
        <rect x="58" y="40" width="16" height="110" rx="4"></rect>
      </g>
      <rect x="104" y="26" width="36" height="6" rx="3" fill="currentColor" opacity="0.5"></rect>
      <rect x="63" y="46" width="5" height="100" rx="2.5" fill="var(--ac-printer-card-bg, #fff)" opacity="0.22"></rect>
      <rect x="130" y="162" width="60" height="26" rx="5" fill="var(--ac-printer-accent, currentColor)" opacity="0.55"></rect>
      <rect x="136" y="168" width="48" height="14" rx="3" fill="var(--ac-printer-card-bg, #fff)" opacity="0.3"></rect>
      <g fill="currentColor" opacity="0.2">
        <rect x="50" y="176" width="46" height="2.5" rx="1"></rect>
        <rect x="50" y="182" width="46" height="2.5" rx="1"></rect>
        <rect x="50" y="188" width="46" height="2.5" rx="1"></rect>
      </g>
      <path d="M80 126 h84 l-6 24 h-72 Z" fill="currentColor" opacity="0.28"></path>
      <path d="M85 137 h74" stroke="${tip}" stroke-opacity="0.75" stroke-width="3"></path>
      <rect x="78" y="118" width="96" height="8" rx="2" fill="var(--ac-printer-plate, currentColor)" opacity="0.8"></rect>
      <g id="gantry" transform="${gantry}">
        <rect id="xaxis" x="70" y="46" width="14" height="10" rx="2" fill="var(--ac-printer-rail, currentColor)" opacity="0.7"></rect>
        <g id="nozzle">
          <rect x="84" y="48" width="66" height="6" rx="2" fill="currentColor"></rect>
          <rect x="96" y="54" width="42" height="14" rx="2" fill="var(--ac-printer-accent, currentColor)" opacity="0.8"></rect>
        </g>
      </g>`,
  },
};

/* ------------------------------------------------------------------ matcher */

/**
 * machine_name is an arbitrary server string, so match fuzzily and
 * longest-key-first ("kobra s1" must beat "kobra"). Never exact equality.
 */
const MATCHERS: Array<[string, Exclude<PrinterArtKind, 'kobra_s1_combo'>]> = [
  ['kobra s1', 'kobra_s1'],
  ['kobra 3', 'kobra_3'],
  ['kobra 2', 'kobra_3'],
  ['photon', 'resin'],
  ['mono', 'resin'],
];

export function selectPrinterArt(
  machineName?: string | null,
  /** How many ACE units the card reports attached: 0, 1 or 2. */
  aceCount: 0 | 1 | 2 = 0,
  override?: Exclude<PrinterArtKind, 'kobra_s1_combo'> | null,
  spools?: string[],
  activeSlot = 0,
): PrinterArt {
  const name = (machineName ?? '').toLowerCase();
  let kind: Exclude<PrinterArtKind, 'kobra_s1_combo'> = 'fdm';
  if (override && PRINTER_ART[override]) {
    kind = override;
  } else {
    for (const [needle, k] of MATCHERS) {
      if (name.includes(needle)) { kind = k; break; }
    }
  }
  const art = PRINTER_ART[kind];
  // Resin has no filament path at all. Every FDM body takes either a side
  // spool (0 ACE) or 1-2 stacked ACE units.
  if (kind === 'resin') return art;
  return withFilamentSource(art, aceCount, spools, activeSlot);
}

/* ------------------------------------------------------- transform helpers */

/**
 * Authored parked at the top of the chamber; translates DOWN as progress
 * falls. While the camera is live it stays pinned at 0 so the head sits above
 * the video instead of riding across it.
 */
export const gantryTransform = (art: PrinterArt, progress: number, cameraLive: boolean): string =>
  cameraLive
    ? `translate(0 ${-art.park})`
    : `translate(0 ${(art.travel * (1 - progress / 100)).toFixed(1)})`;

/** Swap for real axis data when it is wired; x is -1..1 across the rail. */
export const nozzleTransform = (x: number, span = 48): string =>
  `translate(${(x * span).toFixed(1)} 0)`;


/* ------------------------------------------------- ACE units (0, 1 or 2) */

const ACE_H = 95;
const ACE_PITCH = 101;

/**
 * Any FDM body can carry 0, 1 or 2 ACE units, stacked on top. Rather than a
 * second artwork per model, this wraps an existing PrinterArt and shifts the
 * printer down, growing the viewBox and re-deriving the chamber insets.
 *
 *   selectPrinterArt('Kobra 3', 2) -> Kobra 3 with two ACE Pros on top
 */
export function withAce(
  art: PrinterArt,
  count: 0 | 1 | 2,
  spools: string[] = DEFAULT_SPOOLS,
  active = 0,
): PrinterArt {
  if (count < 1) return art;

  // +14 rather than -20: 34 units of clearance above the printer so the S1's
  // flip-up screen never crowds the ACE sitting over it.
  const offset = count * ACE_PITCH + 14;
  const height = 221 + offset + 8;
  // Base chamber in user units, recovered from the unshifted art.
  const [t, r, b, l] = art.chamber;
  const top0 = (t / 100) * 240;
  const bottom0 = 240 - (b / 100) * 240;

  return {
    ...art,
    kind: art.kind === 'kobra_s1' ? 'kobra_s1_combo' : art.kind,
    viewBox: `0 0 240 ${height}`,
    chamber: [
      +(((top0 + offset) / height) * 100).toFixed(2),
      r,
      +(((height - (bottom0 + offset)) / height) * 100).toFixed(2),
      l,
    ],
    body: (st: PrinterBodyState) => svg`
      ${Array.from({ length: count }, (_, k) => {
        const drop = offset - k * ACE_PITCH;
        // Upper unit (when there are two) runs its tube down the right flank.
        const feedActive = Math.floor(active / 4) === k;
        const feed = k === 0 && count === 2
          ? `M188 88 C 214 94 219 106 219 130 L 219 ${drop + 8} C 219 ${drop + 17} 210 ${drop + 21} 200 ${drop + 22}`
          : `M188 88 C 216 94 214 ${drop + 12} 196 ${drop + 22}`;
        // Each unit owns four slots. A caller that supplied only four colours
        // has described one unit, so the second is drawn unpainted rather than
        // mirroring the first -- showing the same reels twice would be a
        // confident lie about hardware we have no colours for.
        const slot = spools.slice(k * 4, k * 4 + 4);
        // -1 when this unit is not the feeding one, so it draws no highlight.
        const localActive = feedActive ? active - k * 4 : -1;
        return svg`<g transform="translate(0 ${k * ACE_PITCH})">
          ${aceModule(slot, localActive, feed, feedActive, k)}
        </g>`;
      })}
      <g transform="translate(0 ${offset})">${art.body(st)}</g>`,
  };
}


/* --------------------------------------------------- side spool (0 ACE) */

/**
 * With no ACE attached the machine feeds from a single spool on a side holder.
 * Drawn OUTSIDE the chassis (x > 201) so it never covers the camera; the ring
 * takes the filament colour, and the tube runs into the top of the frame.
 */
export const sideSpool = (
  color = 'var(--ac-printer-accent, currentColor)',
  cy = 70,
  /** Centre x of the reel. Narrower bodies carry it further out. */
  cx = 219.5,
) => svg`
  <g id="sidespool">
    <path d="M${cx - 7.5} ${cy - 12} C ${cx - 7.5} ${cy - 26} ${cx - 13.5} ${cy - 34} ${cx - 31.5} ${cy - 32}" stroke="${color}"
          stroke-opacity="0.9" stroke-width="3.5" stroke-linecap="round" fill="none"></path>
    <rect x="${cx - 23.5}" y="${cy - 3}" width="16" height="6" rx="3" fill="currentColor" opacity="0.85"></rect>
    <rect x="${cx - 8.5}" y="${cy - 18}" width="17" height="36" rx="2" fill="${color}"></rect>
    <rect x="${cx - 8.5}" y="${cy - 3}" width="17" height="6" fill="var(--ac-printer-card-bg, #fff)" opacity="0.25"></rect>
    <rect x="${cx - 12.5}" y="${cy - 23}" width="5" height="46" rx="2.5" fill="currentColor" opacity="0.9"></rect>
    <rect x="${cx + 7.5}" y="${cy - 23}" width="5" height="46" rx="2.5" fill="currentColor" opacity="0.9"></rect>
  </g>`;

/** 0 ACE -> side spool; 1-2 ACE -> stacked units, no side spool. */
export const withFilamentSource = (
  art: PrinterArt,
  aceCount: 0 | 1 | 2,
  spools: string[] = DEFAULT_SPOOLS,
  active = 0,
): PrinterArt =>
  aceCount > 0
    ? withAce(art, aceCount, spools, active)
    : {
        ...art,
        body: (st: PrinterBodyState) => svg`
          ${sideSpool(st.tip, art.kind === 'kobra_3' ? 80 : 70, art.kind === 'fdm' ? 222 : 219.5)}
          ${art.body(st)}`,
      };

/* -------------------------------------------------- filament colour lookup */

const NAMED_FILAMENT: Record<string, string> = {
  black: '#1c1c1e', white: '#f2f2f0', grey: '#8a9099', gray: '#8a9099',
  silver: '#c2c7cc', red: '#d94a3d', orange: '#e07a2f', yellow: '#e8b33a',
  green: '#3aa87a', blue: '#2f7fd1', purple: '#7a5cd1', pink: '#d9679b',
  brown: '#8a5a3b', clear: '#cfd8de', natural: '#e6ded2', transparent: '#cfd8de',
};

const UNKNOWN = 'var(--ac-printer-accent, currentColor)';

/**
 * Slot colour attributes arrive in whatever shape the cloud/LAN source used:
 * '#RRGGBB', 'RRGGBBAA', 'rgb(...)', or a colour name. Anything unrecognised
 * falls back to the theme accent so an empty slot still looks intentional.
 */
export function filamentColor(raw?: string | null): string {
  if (!raw) return UNKNOWN;
  const s = String(raw).trim();
  if (/^#[0-9a-f]{8}$/i.test(s)) return s.slice(0, 7);
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(s)) return s;
  if (/^[0-9a-f]{6}([0-9a-f]{2})?$/i.test(s)) return '#' + s.slice(0, 6);
  if (/^(rgb|hsl)a?\(/i.test(s)) return s;
  return NAMED_FILAMENT[s.toLowerCase()] ?? UNKNOWN;
}

/**
 * Map ACE slot objects to colours, four per attached unit.
 *
 * `count` matters: with two units the second one's colours live at indices
 * 4-7, and a four-long array would leave it unpainted. Pass the number of
 * units actually attached so the array is the length withAce expects.
 */
export const spoolColors = (
  slots: Array<{ color?: string | null } | null | undefined> = [],
  count = 1,
): string[] =>
  Array.from({ length: Math.max(1, count) * 4 }, (_, i) => filamentColor(slots[i]?.color));

/** Colour for the nozzle tip: the active slot, or the single-extruder colour. */
export const activeTipColor = (
  slots?: Array<{ color?: string | null } | null | undefined>,
  active = 0,
  singleFilament?: string | null,
): string => (slots?.length ? filamentColor(slots[active]?.color) : filamentColor(singleFilament));

/* ----------------------------------------------------------- render + CSS */

/**
 * Built with `html`, not `svg`. Lit's `svg` tag produces a fragment meant to
 * be interpolated INSIDE an existing <svg>; using it to create the <svg>
 * element itself puts the root in the wrong namespace, and the failure mode
 * is an empty box with no error anywhere.
 */
export const renderPrinter = (
  art: PrinterArt,
  state: Omit<PrinterBodyState, 'gantry' | 'nozzle'> & {
    progress?: number;
    nozzleX?: number;
  } = {},
): TemplateResult => html`
  <svg class="ac-apr-svg" viewBox="${art.viewBox}" fill="none"
       preserveAspectRatio="xMidYMid meet" aria-hidden="true">
    ${art.body({
      ...state,
      gantry: gantryTransform(art, (state.progress ?? 0) * 100, !!state.cameraLive),
      nozzle: nozzleTransform(state.nozzleX ?? 0),
    })}
  </svg>`;

/** Inset for `.ac-apr-camera` so the stream fills exactly the chamber hole. */
export const cameraInset = (art: PrinterArt): string =>
  art.chamber.map((v) => `${v}%`).join(' ');

/*
  Styles to add to the existing `css` block:

  .ac-apr-svg {
    width: 100%;
    height: auto;
    position: relative;
    z-index: 1;
    pointer-events: none;
    color: var(--primary-text-color);
    --ac-printer-accent: var(--state-icon-active-color, var(--primary-color));
    --ac-printer-rail: var(--secondary-text-color);
    --ac-printer-plate: var(--divider-color);
    --ac-printer-card-bg: var(--ha-card-background, var(--card-background-color));
  }
  .ac-apr-camera { position: absolute; inset: var(--ac-apr-chamber); z-index: 0; }

  ...and set `--ac-apr-chamber: ${cameraInset(art)}` on the wrapper.
  The old .ac-apr-frame / .ac-apr-xaxis / .ac-apr-gantry / .ac-apr-nozzle /
  .ac-apr-buildplate rules and the runtime scale maths in utils.ts can go.
*/
