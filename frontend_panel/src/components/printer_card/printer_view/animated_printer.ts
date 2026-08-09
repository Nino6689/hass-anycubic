import { CSSResult, LitElement, PropertyValues, css, html, nothing } from "lit";
import { property, state } from "lit/decorators.js";
import { styleMap } from "lit/directives/style-map.js";

import { customElementIfUndef } from "../../../internal/register-custom-element";

import "../media_view/camera_stream.ts";

import {
  getPrinterImageStateUrl,
  getPrinterSensorStateObj,
  getStateObjByKey,
  isPrintStatePrinting,
} from "../../../helpers";

import {
  PrinterArt,
  PrinterArtKind,
  cameraInset,
  filamentColor,
  renderPrinter,
  selectPrinterArt,
} from "./printer_art";

import {
  AnimatedPrinterConfig,
  HassEntityInfos,
  HomeAssistant,
  LitTemplateResult,
} from "../../../types";

/** A slot as the ace_spools sensor reports it: colour is [r, g, b]. */
interface AceSpool {
  color?: number[] | null;
  spool_loaded?: boolean;
}

const rgbToHex = (rgb?: number[] | null): string | undefined =>
  Array.isArray(rgb) && rgb.length >= 3
    ? "#" + rgb.slice(0, 3).map((c) => Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2, "0")).join("")
    : undefined;

@customElementIfUndef("anycubic-printercard-animated_printer")
export class AnycubicPrintercardAnimatedPrinter extends LitElement {
  @property()
  public hass!: HomeAssistant;

  @property({ attribute: "scale-factor" })
  public scaleFactor?: number;

  @property({ attribute: "printer-config" })
  public printerConfig: AnimatedPrinterConfig;

  @property({ attribute: "printer-entities" })
  public printerEntities: HassEntityInfos;

  @property({ attribute: "printer-entity-id-part" })
  public printerEntityIdPart: string | undefined;

  /** Plays the live camera in the build volume in place of the modelled print,
   *  so the chassis frames the real thing. */
  @property({ attribute: "camera-entity-id" })
  public cameraEntityId?: string;

  /** Overrides model detection when the reported name matches nothing.
   *  kobra_s1_combo is absent on purpose: a Combo is an S1 with ACE units
   *  wrapped around it, derived from the attached hardware rather than
   *  chosen, so offering it here would let the override disagree with the
   *  printer about what is plugged in. */
  @property({ attribute: "printer-art" })
  public printerArt?: Exclude<PrinterArtKind, "kobra_s1_combo">;

  @state()
  private _progressNum: number = 0;

  @state()
  private _isPrinting: boolean = false;

  @state()
  private _lightOn: boolean = false;

  @state()
  private imagePreviewUrl: string | undefined;

  @state()
  private imagePreviewBgUrl: string | undefined;

  protected willUpdate(changedProperties: PropertyValues<this>): void {
    super.willUpdate(changedProperties);

    if (
      !changedProperties.has("hass") &&
      !changedProperties.has("printerEntities") &&
      !changedProperties.has("printerEntityIdPart")
    ) {
      return;
    }

    const prevUrl = getPrinterImageStateUrl(
      this.hass,
      this.printerEntities,
      this.printerEntityIdPart,
      "job_preview",
    );
    if (this.imagePreviewUrl !== prevUrl) {
      this.imagePreviewUrl = prevUrl;
      this.imagePreviewBgUrl = prevUrl ? `url('${prevUrl}')` : undefined;
    }

    this._progressNum =
      Number(
        getPrinterSensorStateObj(
          this.hass,
          this.printerEntities,
          this.printerEntityIdPart,
          "job_progress",
          0,
        ).state,
      ) / 100;

    this._isPrinting = isPrintStatePrinting(
      getPrinterSensorStateObj(
        this.hass,
        this.printerEntities,
        this.printerEntityIdPart,
        "job_state",
      ).state.toLowerCase(),
    );

    // The printer's own chamber light, so the artwork agrees with the machine
    // rather than decorating it. Anything that is not a clear "on" reads as
    // off: unknown and unavailable must not look illuminated.
    this._lightOn =
      getStateObjByKey(this.hass, this.printerEntities, "printer_light")
        ?.state === "on";
  }

  /**
   * The model, from the device registry rather than a sensor.
   *
   * machine_name is not exposed as an entity, but the integration writes it to
   * the device's model field, and every printer entity carries device_id.
   */
  private _machineName(): string | undefined {
    for (const key in this.printerEntities) {
      const deviceId = this.printerEntities[key].device_id;
      if (deviceId && this.hass.devices[deviceId]) {
        return (
          this.hass.devices[deviceId].model ?? this.hass.devices[deviceId].name
        );
      }
    }
    return undefined;
  }

  /** Slot colours from the ACE sensors, four per attached unit. */
  private _spoolState(): { spools: string[]; active: number; units: 0 | 1 | 2 } {
    const read = (key: string): AceSpool[] => {
      const stateObj = getStateObjByKey(this.hass, this.printerEntities, key);
      const spools = stateObj?.attributes?.spools;
      return Array.isArray(spools) ? (spools as AceSpool[]) : [];
    };

    const primary = read("ace_spools");
    const secondary = read("secondary_ace_spools");
    const units = (secondary.length ? 2 : primary.length ? 1 : 0) as 0 | 1 | 2;

    const colours = [...primary, ...secondary].map((s) =>
      filamentColor(rgbToHex(s.color)),
    );

    // Which slot is feeding. Absent on machines with no multi-colour unit,
    // where the highlight is meaningless anyway.
    const active = Number(
      getPrinterSensorStateObj(
        this.hass,
        this.printerEntities,
        this.printerEntityIdPart,
        "ace_active_slot",
        0,
      ).state,
    );

    return {
      spools: colours,
      active: Number.isFinite(active) && active > 0 ? active - 1 : 0,
      units,
    };
  }

  private _art(): PrinterArt {
    const { spools, active, units } = this._spoolState();
    return selectPrinterArt(
      this._machineName(),
      units,
      this.printerArt ?? null,
      spools,
      active,
    );
  }

  render(): LitTemplateResult {
    const art = this._art();
    const { spools, active } = this._spoolState();
    const tip = spools[active] ?? undefined;
    const cameraLive = Boolean(this.cameraEntityId);

    return html`
      <div
        class="ac-printercard-animatedprinter"
        style=${styleMap({ "--ac-apr-chamber": cameraInset(art) })}
      >
        ${cameraLive
          ? html`
              <anycubic-printercard-camera_stream
                class="ac-apr-camera"
                .hass=${this.hass}
                .cameraEntityId=${this.cameraEntityId}
              ></anycubic-printercard-camera_stream>
            `
          : this.imagePreviewBgUrl
            ? html`
                <div
                  class="ac-apr-imgprev"
                  style=${styleMap({
                    "background-image": this.imagePreviewBgUrl,
                  })}
                ></div>
              `
            : nothing}
        ${renderPrinter(
          art,
          this._progressNum * 100,
          cameraLive,
          0,
          tip,
          this._lightOn,
        )}
      </div>
    `;
  }

  static get styles(): CSSResult {
    return css`
      :host {
        display: block;
        width: 100%;
        height: 100%;
        box-sizing: border-box;
      }

      .ac-printercard-animatedprinter {
        position: relative;
        width: 100%;
        height: 100%;
        box-sizing: border-box;
        display: flex;
        justify-content: center;
        align-items: center;
      }

      /* Both of these fill exactly the chamber hole in the artwork, which is
         negative space, so the SVG frames them rather than covering them.
         The inset comes from the art itself because it moves with ACE count. */
      .ac-apr-camera,
      .ac-apr-imgprev {
        position: absolute;
        inset: var(--ac-apr-chamber, 0);
        z-index: 0;
      }

      .ac-apr-camera {
        background-color: #000;
      }

      .ac-apr-imgprev {
        background-size: contain;
        background-repeat: no-repeat;
        background-position: center bottom;
      }

      /* Sits over the stream, and must never swallow clicks meant for the
         card underneath. */
      .ac-apr-svg {
        position: relative;
        z-index: 1;
        pointer-events: none;
        width: 100%;
        height: auto;
        max-height: 100%;
        color: var(--primary-text-color);
        --ac-printer-accent: var(
          --state-icon-active-color,
          var(--primary-color)
        );
        --ac-printer-rail: var(--secondary-text-color);
        --ac-printer-plate: var(--divider-color);
        --ac-printer-card-bg: var(
          --ha-card-background,
          var(--card-background-color, #fff)
        );
        --ac-printer-light: #ffd88a;
      }

      /* The head sweeps only while a job is running. Driven from CSS rather
         than axis data, which the printer does not report often enough to
         animate from -- when it is wired, replace this with nozzleTransform. */
      .ac-apr-svg #nozzle {
        transform-box: fill-box;
        transform-origin: center;
      }

      :host([printing]) .ac-apr-svg #nozzle {
        animation: ac-apr-sweep 4.4s ease-in-out infinite;
      }

      @keyframes ac-apr-sweep {
        0%,
        100% {
          transform: translateX(-46px);
        }
        50% {
          transform: translateX(46px);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        :host([printing]) .ac-apr-svg #nozzle {
          animation: none;
        }
      }
    `;
  }

  protected updated(changed: PropertyValues<this>): void {
    super.updated(changed);
    // Reflected so the sweep keyframe can be scoped to an actual print.
    this.toggleAttribute("printing", this._isPrinting);
  }
}
