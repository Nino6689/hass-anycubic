import { CSSResult, LitElement, PropertyValues, css, html, nothing } from "lit";
import { property, state } from "lit/decorators.js";
import { styleMap } from "lit/directives/style-map.js";

import "../media_view/camera_stream.ts";

import {
  PrinterArt,
  PrinterArtKind,
  artAspect,
  cameraInset,
  filamentColor,
  renderPrinter,
  selectPrinterArt,
} from "./printer_art";
import {
  getPrinterImageStateUrl,
  getPrinterSensorStateObj,
  getStateObjByKey,
  isPrintStatePrinting,
} from "../../../helpers";

import { customElementIfUndef } from "../../../internal/register-custom-element";

import {
  AnimatedPrinterConfig,
  HassDevice,
  HassEntityInfos,
  HomeAssistant,
  LitTemplateResult,
} from "../../../types";

/**
 * A slot as the ace_spools sensor actually reports it.
 *
 * The attribute is `spool_info`, not `spools`, and each entry carries both an
 * [r,g,b] `color` and a `color_hex`. Confirmed against a live Kobra S1 rather
 * than assumed -- the first pass read the wrong attribute and silently found
 * nothing, which looks identical to a printer with no ACE attached.
 */
interface AceSpool {
  color?: number[] | null;
  color_hex?: string | null;
  spool_loaded?: boolean;
  consumables_percent?: number | null;
  slot?: number;
}

const rgbToHex = (rgb?: number[] | null): string | undefined =>
  Array.isArray(rgb) && rgb.length >= 3
    ? "#" +
      rgb
        .slice(0, 3)
        .map((c) =>
          Math.max(0, Math.min(255, Math.round(c)))
            .toString(16)
            .padStart(2, "0"),
        )
        .join("")
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
   *
   *  kobra_s1_combo IS selectable, and means more than the others: a Combo is
   *  an S1 with ACE units wrapped around it rather than a drawing of its own,
   *  so choosing it asserts the hardware. That is deliberate -- a Combo whose
   *  ACE sensors report nothing yet has no other way to be drawn correctly,
   *  and being drawn as a bare S1 is the worse failure. */
  @property({ attribute: "printer-art" })
  public printerArt?: PrinterArtKind;

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
      // hass.devices is typed as a total record, so TS thinks the lookup
      // always succeeds; at runtime a stale entity can name a device that is
      // gone, so the check stays and the type is narrowed by hand.
      const device = deviceId
        ? (this.hass.devices[deviceId] as HassDevice | undefined)
        : undefined;
      if (device) {
        return device.model ?? device.name;
      }
    }
    return undefined;
  }

  /** Slot colours and remaining filament from the ACE sensors. */
  private _spoolState(): {
    spools: string[];
    active: number;
    units: 0 | 1 | 2;
    remaining: (number | undefined)[];
  } {
    const read = (key: string): AceSpool[] => {
      const stateObj = getStateObjByKey(this.hass, this.printerEntities, key);
      // Attributes are an `any` bag by definition -- this is the boundary
      // where that becomes a typed array, so the cast belongs here.
      const spools: unknown = stateObj?.attributes.spool_info;
      return Array.isArray(spools) ? (spools as AceSpool[]) : [];
    };

    const primary = read("ace_spools");
    const secondary = read("secondary_ace_spools");
    const units = secondary.length ? 2 : primary.length ? 1 : 0;

    const all = [...primary, ...secondary];
    const colours = all.map((s) =>
      filamentColor(s.color_hex ?? rgbToHex(s.color)),
    );
    // consumables_percent is 0-100 when the printer reports it at all.
    // Undefined stays undefined: the artwork draws an unknown reel full,
    // because a reel we know nothing about must not look nearly empty.
    const remaining = all.map((s) =>
      typeof s.consumables_percent === "number"
        ? Math.max(0, Math.min(1, s.consumables_percent / 100))
        : undefined,
    );

    // The feeding slot lives on the box, not on a sensor of its own, and is
    // null whenever the printer is drawing from the external spool instead.
    const boxInfo = getStateObjByKey(
      this.hass,
      this.printerEntities,
      "ace_spools",
    )?.attributes.box_info as { loaded_slot?: number | null } | undefined;
    const loaded = boxInfo?.loaded_slot;

    return {
      spools: colours,
      active: typeof loaded === "number" && loaded > 0 ? loaded - 1 : 0,
      units,
      remaining,
    };
  }

  /** How far a heater is toward its OWN target, 0-1. No target = not heating. */
  private _heat(currentKey: string, targetKey: string): number {
    const num = (key: string): number =>
      Number(
        getPrinterSensorStateObj(
          this.hass,
          this.printerEntities,
          this.printerEntityIdPart,
          key,
          0,
        ).state,
      );
    const target = num(targetKey);
    if (!Number.isFinite(target) || target <= 0) {
      return 0;
    }
    const current = num(currentKey);
    if (!Number.isFinite(current)) {
      return 0;
    }
    // Ambient is roughly 20C; below that there is nothing to show.
    return Math.max(0, Math.min(1, (current - 20) / Math.max(1, target - 20)));
  }

  private _status(): "idle" | "printing" | "paused" | "error" {
    // getStateObjByKey matches on translation_key, which is "job_is_paused".
    // The ENTITY ID ends in "job_paused", so the wrong key here looked right
    // in every log and search while never matching, and the artwork could
    // never enter its paused state.
    const paused = getStateObjByKey(
      this.hass,
      this.printerEntities,
      "job_is_paused",
    )?.state;
    if (paused === "on") {
      return "paused";
    }
    const job = getPrinterSensorStateObj(
      this.hass,
      this.printerEntities,
      this.printerEntityIdPart,
      "job_state",
    ).state.toLowerCase();
    if (job.includes("fail") || job.includes("error")) {
      return "error";
    }
    return this._isPrinting ? "printing" : "idle";
  }

  private _art(): PrinterArt {
    const { spools, active, units, remaining } = this._spoolState();
    return selectPrinterArt(
      this._machineName(),
      units,
      this.printerArt ?? null,
      spools,
      active,
      remaining,
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
        style=${styleMap({
          "--ac-apr-chamber": cameraInset(art),
          "--ac-apr-aspect": artAspect(art),
        })}
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
        ${renderPrinter(art, {
          progress: this._progressNum,
          cameraLive,
          tip,
          lightOn: this._lightOn,
          nozzleHeat: this._heat(
            "nozzle_temperature",
            "target_nozzle_temperature",
          ),
          bedHeat: this._heat(
            "hotbed_temperature",
            "target_hotbed_temperature",
          ),
          fanOn:
            Number(
              getPrinterSensorStateObj(
                this.hass,
                this.printerEntities,
                this.printerEntityIdPart,
                "fan_speed",
                0,
              ).state,
            ) > 0,
          status: this._status(),
        })}
      </div>
    `;
  }

  static get styles(): CSSResult {
    return css`
      :host {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        box-sizing: border-box;
        /* Without this the host has no definite height for max-height to
           resolve against, and the cap silently does nothing. */
        min-height: 0;
      }

      /* The wrapper carries the drawing's own aspect ratio, and is capped by
         BOTH dimensions of whatever box the card gives it.

         This is what stops the printer rendering enormous. width:100% on the
         SVG alone means its height just follows the aspect ratio with nothing
         to cap it, and a Combo with two ACE units is nearly twice as tall as
         it is wide. Constraining the wrapper rather than letting the SVG
         letterbox inside it also keeps the camera aligned: the stream is
         positioned by percentage inset OF THIS BOX, so if the drawing did not
         fill it exactly, the chamber hole would stop lining up with the video
         behind it. */
      .ac-printercard-animatedprinter {
        position: relative;
        aspect-ratio: var(--ac-apr-aspect, 1 / 1);
        max-width: 100%;
        max-height: 100%;
        margin: 0 auto;
        box-sizing: border-box;
        overflow: hidden;
      }

      /* Both of these fill exactly the chamber hole in the artwork, which is
         negative space, so the SVG frames them rather than covering them.
         The inset comes from the art itself because it moves with ACE count. */
      /* The chamber is a hole in the artwork, so whatever sits behind it must
         be clipped to that hole. The stream is the reason: its <video> is in a
         shadow root we cannot reach and sizes itself, so without clipping here
         it renders at its own aspect ratio and spills out past the chassis. */
      .ac-apr-camera,
      .ac-apr-imgprev {
        position: absolute;
        inset: var(--ac-apr-chamber, 0);
        z-index: 0;
        overflow: hidden;
        /* The camera is a custom element whose own :host sets width and height
           to 100%. An explicit size beats the four inset edges, so without
           these the stream filled the whole wrapper instead of the chamber
           hole -- measured on the live card as 115x165 against a chamber that
           should be about 71x105. Styles from here outrank :host, so auto
           hands sizing back to the insets. */
        width: auto;
        height: auto;
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
        display: block;
        width: 100%;
        height: 100%;
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

      .ac-apr-svg .ac-apr-fan {
        transform-box: fill-box;
        transform-origin: center;
        animation: ac-apr-spin 1.1s linear infinite;
      }

      @keyframes ac-apr-spin {
        to {
          transform: rotate(360deg);
        }
      }

      /* Motion is the whole point of both of these, so under reduced-motion
         they stop rather than slow: the fan still reads as running from its
         opacity, and the head from its position. */
      @media (prefers-reduced-motion: reduce) {
        :host([printing]) .ac-apr-svg #nozzle,
        .ac-apr-svg .ac-apr-fan {
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
