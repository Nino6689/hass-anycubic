import { CSSResult, LitElement, PropertyValues, css, html, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import { localize } from "../../../localize/localize";

import {
  getDefaultCardConfig,
  getPanelACEMonitoredStats,
  getPanelBasicMonitoredStats,
  getPanelFDMMonitoredStats,
  getPrinterBinarySensorState,
  getPrinterEntities,
  getPrinterEntityIdPart,
  getPrinterID,
  getPrinterMAC,
  getPrinterSensorStateFloat,
  getPrinterSensorStateString,
  getPrinterUpdateEntityState,
  isFDMPrinter,
} from "../../helpers";
import {
  AnycubicCardConfig,
  CardSectionType,
  HassDevice,
  HassEntityInfos,
  HassPanel,
  HassRoute,
  HomeAssistant,
  LitTemplateResult,
  MediaViewType,
  PrinterArtType,
  PrinterCardStatType,
  TranslationDict,
} from "../../types";

import "../../components/printer_card/card/card.ts";

const monitoredStatsACE: PrinterCardStatType[] = getPanelACEMonitoredStats();
const monitoredStatsBasic: PrinterCardStatType[] =
  getPanelBasicMonitoredStats();
const monitoredStatsFDM: PrinterCardStatType[] = getPanelFDMMonitoredStats();

/** The panel is the showcase, so it opens the filament tray rather than
 *  leaving the hero on component defaults with everything folded away. */
const PANEL_SECTIONS: CardSectionType[] = [CardSectionType.Filament];

/** The preview must behave EXACTLY as the emitted YAML would once pasted, so
 *  any key the preset omits falls back to the card's own default -- not to a
 *  panel-flavoured one. The gallery drifting from its code is the one failure
 *  this section cannot afford. */
const presetDefaults = getDefaultCardConfig();

const infoFields: string[] = [
  "printer_name",
  "printer_id",
  "printer_mac",
  "printer_model",
  "printer_fw_version",
  "printer_fw_update_available",
  "printer_online",
  "printer_available",
  "curr_nozzle_temp",
  "curr_hotbed_temp",
  "target_nozzle_temp",
  "target_hotbed_temp",
  "job_state",
  "job_progress",
  "ace_fw_version",
  "ace_fw_update_available",
  "drying_active",
  "drying_progress",
];

@customElement("anycubic-view-main")
export class AnycubicViewMain extends LitElement {
  @property()
  public hass!: HomeAssistant;

  @property()
  public language!: string;

  @property({ type: Boolean, reflect: true })
  public narrow!: boolean;

  @property()
  public route!: HassRoute;

  @property()
  public panel!: HassPanel;

  @property({ attribute: "selected-printer-id" })
  public selectedPrinterID: string | undefined;

  @property({ attribute: "selected-printer-device" })
  public selectedPrinterDevice: HassDevice | undefined;

  @state()
  private printerEntities: HassEntityInfos;

  @state()
  private printerEntityIdPart: string | undefined;

  @state()
  private printerID: string | undefined;

  @state()
  private printerMAC: string | null;

  @state()
  private printerStateFwUpdateAvailable: string | undefined;

  @state()
  private printerStateAvailable: string | boolean | undefined;

  @state()
  private printerStateOnline: string | boolean | undefined;

  @state()
  private printerStateCurrNozzleTemp: number | undefined;

  @state()
  private printerStateCurrHotbedTemp: number | undefined;

  @state()
  private printerStateTargetNozzleTemp: number | undefined;

  @state()
  private printerStateTargetHotbedTemp: number | undefined;

  @state()
  private jobStateProgress: string | undefined;

  @state()
  private jobStatePrintState: string | undefined;

  @state()
  private aceStateFwUpdateAvailable: string | boolean | undefined;

  @state()
  private aceStateDryingActive: string | boolean | undefined;

  @state()
  private aceStateDryingRemaining: number | undefined;

  @state()
  private aceStateDryingTotal: number | undefined;

  @state()
  private aceDryingProgress: string | undefined;

  @state()
  private isFDM: boolean = false;

  @state()
  private monitoredStats: PrinterCardStatType[] = monitoredStatsBasic;

  @state()
  private _statTranslations: TranslationDict;

  protected willUpdate(changedProperties: PropertyValues<this>): void {
    super.willUpdate(changedProperties);

    if (changedProperties.has("language")) {
      this._statTranslations = infoFields.reduce((fConf, fieldKey) => {
        fConf[fieldKey] = localize(
          `panels.main.cards.main.fields.${fieldKey}`,
          this.language,
        );
        return fConf;
      }, {});
    }

    if (changedProperties.has("selectedPrinterDevice")) {
      this.printerID = getPrinterID(this.selectedPrinterDevice);
      this.printerMAC = getPrinterMAC(this.selectedPrinterDevice);
    }

    if (changedProperties.has("selectedPrinterID")) {
      this.printerEntities = getPrinterEntities(
        this.hass,
        this.selectedPrinterID,
      );
      this.printerEntityIdPart = getPrinterEntityIdPart(this.printerEntities);
    }

    if (
      changedProperties.has("hass") ||
      changedProperties.has("selectedPrinterID")
    ) {
      this.isFDM = isFDMPrinter(
        this.hass,
        this.printerEntities,
        this.printerEntityIdPart,
      );
      this.printerStateFwUpdateAvailable = getPrinterUpdateEntityState(
        this.hass,
        this.printerEntities,
        this.printerEntityIdPart,
        "printer_firmware",
      );
      this.printerStateAvailable = getPrinterBinarySensorState(
        this.hass,
        this.printerEntities,
        this.printerEntityIdPart,
        "is_available",
        "Available",
        "Busy",
      );
      this.printerStateOnline = getPrinterBinarySensorState(
        this.hass,
        this.printerEntities,
        this.printerEntityIdPart,
        "printer_online",
        "Online",
        "Offline",
      );
      this.printerStateCurrNozzleTemp = getPrinterSensorStateFloat(
        this.hass,
        this.printerEntities,
        this.printerEntityIdPart,
        "nozzle_temperature",
      );
      this.printerStateCurrHotbedTemp = getPrinterSensorStateFloat(
        this.hass,
        this.printerEntities,
        this.printerEntityIdPart,
        "hotbed_temperature",
      );
      this.printerStateTargetNozzleTemp = getPrinterSensorStateFloat(
        this.hass,
        this.printerEntities,
        this.printerEntityIdPart,
        "target_nozzle_temperature",
      );
      this.printerStateTargetHotbedTemp = getPrinterSensorStateFloat(
        this.hass,
        this.printerEntities,
        this.printerEntityIdPart,
        "target_hotbed_temperature",
      );
      const projProgress = getPrinterSensorStateFloat(
        this.hass,
        this.printerEntities,
        this.printerEntityIdPart,
        "job_progress",
      );
      this.jobStateProgress =
        typeof projProgress !== "undefined" ? `${projProgress}%` : "0%";
      this.jobStatePrintState = getPrinterSensorStateString(
        this.hass,
        this.printerEntities,
        this.printerEntityIdPart,
        "job_state",
        true,
      );
      this.aceStateFwUpdateAvailable = getPrinterUpdateEntityState(
        this.hass,
        this.printerEntities,
        this.printerEntityIdPart,
        "ace_firmware",
      );
      this.aceStateDryingActive = getPrinterBinarySensorState(
        this.hass,
        this.printerEntities,
        this.printerEntityIdPart,
        "drying_active",
        "Drying",
        "Not Drying",
      );
      this.aceStateDryingRemaining = getPrinterSensorStateFloat(
        this.hass,
        this.printerEntities,
        this.printerEntityIdPart,
        "drying_remaining_time",
      );
      this.aceStateDryingTotal = getPrinterSensorStateFloat(
        this.hass,
        this.printerEntities,
        this.printerEntityIdPart,
        "drying_total_duration",
      );
      this.aceDryingProgress =
        typeof this.aceStateDryingRemaining !== "undefined" &&
        typeof this.aceStateDryingTotal !== "undefined"
          ? String(
              (this.aceStateDryingTotal > 0
                ? Math.round(
                    (1 -
                      this.aceStateDryingRemaining / this.aceStateDryingTotal) *
                      10000,
                  ) / 100
                : 0
              ).toFixed(2),
            ) + "%"
          : undefined;
      if (this.aceStateFwUpdateAvailable) {
        this.monitoredStats = monitoredStatsACE;
      } else if (this.isFDM) {
        this.monitoredStats = monitoredStatsFDM;
      } else {
        this.monitoredStats = monitoredStatsBasic;
      }
    }
  }

  private _renderInfoRow(
    fieldKey: string,
    rowData: string | number | boolean | undefined | null,
  ): LitTemplateResult {
    return html`
      <div class="info-row">
        <span class="info-heading"> ${this._statTranslations[fieldKey]}:</span>
        <span class="info-detail">${rowData}</span>
      </div>
    `;
  }

  private _renderOptionalInfoRow(
    fieldKey: string,
    rowData: string | number | boolean | undefined | null,
  ): LitTemplateResult | null {
    return typeof rowData !== "undefined"
      ? this._renderInfoRow(fieldKey, rowData)
      : null;
  }

  /** One titled group of label/value rows. Rows with nothing to say are
   *  dropped rather than printed as blanks, and a group that ends up empty
   *  does not render its heading -- an empty box under a title reads as
   *  something broken. */
  private _renderGroup(
    key: string,
    rows: [string, string | number | boolean | undefined | null][],
  ): LitTemplateResult {
    const live = rows.filter(
      ([, v]) => v !== undefined && v !== null && v !== "",
    );
    if (!live.length) {
      return nothing;
    }
    const rendered = live.map(([k, v]) => this._renderInfoRow(k, v));
    return html`
      <div class="ac-tile">
        <h3 class="ac-tile-title">
          ${localize(`panels.main.groups.${key}`, this.language)}
        </h3>
        ${rendered}
      </div>
    `;
  }

  /** Identifiers, demoted. These matter once a year, when something is wrong,
   *  and previously sat in the same list and the same weight as job progress. */
  private _renderDiagnostics(): LitTemplateResult {
    return html`
      <details class="ac-diag">
        <summary>
          ${localize("panels.main.groups.diagnostics", this.language)}
        </summary>
        ${this._renderInfoRow(
          "printer_name",
          this.selectedPrinterDevice ? this.selectedPrinterDevice.name : null,
        )}
        ${this._renderInfoRow("printer_id", this.printerID)}
        ${this._renderInfoRow("printer_mac", this.printerMAC)}
      </details>
    `;
  }

  /** The point of the page: the hero above IS the shipped card, so these are
   *  the same object configured differently. Each one is rendered live from
   *  the SAME object the YAML is generated from, so the picture and the code
   *  cannot drift apart.
   *
   *  No camera preset here on purpose. The card discovers a camera on its own,
   *  so a `mediaView: camera` tile would open a stream just by being on this
   *  page -- and an Anycubic account hands the camera to whichever session
   *  asked most recently, which would quietly take it from the phone app. */
  private _renderPresets(): LitTemplateResult {
    const id = this.selectedPrinterDevice?.id ?? "YOUR_PRINTER_DEVICE_ID";
    const presets: [string, AnycubicCardConfig][] = [
      [
        "full",
        {
          printer_id: id,
          mediaView: MediaViewType.Printer,
          showControls: true,
          showMoveButtons: true,
          sections: [CardSectionType.Filament],
          alwaysShow: true,
        },
      ],
      [
        "model",
        {
          printer_id: id,
          mediaView: MediaViewType.PrinterModel,
          showControls: true,
          showMoveButtons: false,
          alwaysShow: true,
        },
      ],
      [
        "compact",
        {
          printer_id: id,
          mediaView: MediaViewType.Printer,
          showControls: false,
          showMoveButtons: false,
          alwaysShow: true,
          monitoredStats: [PrinterCardStatType.Status, PrinterCardStatType.ETA],
        },
      ],
      [
        "vertical",
        {
          printer_id: id,
          vertical: true,
          mediaView: MediaViewType.Printer,
          showControls: true,
          showMoveButtons: false,
          alwaysShow: true,
        },
      ],
    ];
    const rendered = presets.map(([key, config]) =>
      this._presetCard(key, config),
    );
    return html`
      <div class="ac-presets">
        <h3 class="ac-tile-title">
          ${localize("panels.main.presets.title", this.language)}
        </h3>
        <p class="ac-presets-lede">
          ${localize("panels.main.presets.lede", this.language)}
        </p>
        <div class="ac-preset-grid">${rendered}</div>
      </div>
    `;
  }

  /** YAML from the very object being rendered beside it. Hand-writing the
   *  snippet separately is how a gallery starts lying about itself. */
  private _presetYaml(config: AnycubicCardConfig): string {
    const lines = ["type: custom:anycubic-card"];
    for (const [key, value] of Object.entries(config)) {
      if (Array.isArray(value)) {
        lines.push(`${key}:`);
        for (const item of value) {
          lines.push(`  - ${String(item)}`);
        }
      } else {
        lines.push(`${key}: ${String(value)}`);
      }
    }
    return lines.join("\n");
  }

  private _presetCard(
    key: string,
    config: AnycubicCardConfig,
  ): LitTemplateResult {
    const yaml = this._presetYaml(config);
    return html`
      <div class="ac-preset">
        <div class="ac-preset-head">
          <span>${localize(`panels.main.presets.${key}`, this.language)}</span>
          <button class="ac-copy" .yaml=${yaml} @click=${this._copyPreset}>
            ${localize("panels.main.presets.copy", this.language)}
          </button>
        </div>
        <div class="ac-preset-frame">
          <anycubic-printercard-card
            .hass=${this.hass}
            .language=${this.language}
            .selectedPrinterID=${this.selectedPrinterID}
            .selectedPrinterDevice=${this.selectedPrinterDevice}
            .vertical=${config.vertical ?? false}
            .round=${true}
            .use_24hr=${this.panel.config.use_24hr ?? true}
            .temperatureUnit=${this.panel.config.temperatureUnit}
            .monitoredStats=${config.monitoredStats ??
            presetDefaults.monitoredStats}
            .mediaView=${config.mediaView ?? presetDefaults.mediaView}
            .showControls=${config.showControls ?? presetDefaults.showControls}
            .showMoveButtons=${config.showMoveButtons ??
            presetDefaults.showMoveButtons}
            .sections=${config.sections ?? presetDefaults.sections}
            .showSettingsButton=${presetDefaults.showSettingsButton}
            .alwaysShow=${config.alwaysShow ?? presetDefaults.alwaysShow}
            .noCamera=${true}
          ></anycubic-printercard-card>
        </div>
        <pre>${yaml}</pre>
      </div>
    `;
  }

  private _copyPreset = (ev: Event): void => {
    const btn = ev.currentTarget as HTMLButtonElement & { yaml: string };
    // navigator.clipboard is [SecureContext]-only, and most Home Assistant
    // installs are plain http on the LAN -- where the flagship button of this
    // section would otherwise do nothing, silently. The textarea +
    // execCommand path is the one that works there.
    const copied = (): void => {
      const was = btn.textContent;
      btn.textContent = localize("panels.main.presets.copied", this.language);
      setTimeout(() => {
        btn.textContent = was;
      }, 1500);
    };
    const fallback = (): void => {
      const ta = document.createElement("textarea");
      ta.value = btn.yaml;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      let didCopy = false;
      try {
        didCopy = document.execCommand("copy");
      } catch (_e) {
        didCopy = false;
      }
      ta.remove();
      if (didCopy) {
        copied();
      }
    };
    // The DOM types say clipboard always exists; at runtime it is undefined
    // outside secure contexts, which is most LAN Home Assistant installs.
    // The cast keeps the guard the type system would otherwise "simplify"
    // into a crash.
    const clip = window.navigator.clipboard as Clipboard | undefined;
    if (clip?.writeText) {
      clip.writeText(btn.yaml).then(copied, fallback);
    } else {
      fallback();
    }
  };

  render(): LitTemplateResult {
    return html`
      <div class="ac-panel">
        <printer-card elevation="2" class="ac-hero">
          <anycubic-printercard-card
            .hass=${this.hass}
            .language=${this.language}
            .selectedPrinterID=${this.selectedPrinterID}
            .selectedPrinterDevice=${this.selectedPrinterDevice}
            .vertical=${this.panel.config.vertical ?? false}
            .round=${this.panel.config.round ?? true}
            .use_24hr=${this.panel.config.use_24hr ?? true}
            .temperatureUnit=${this.panel.config.temperatureUnit}
            .lightEntityId=${this.panel.config.lightEntityId}
            .powerEntityId=${this.panel.config.powerEntityId}
            .cameraEntityId=${this.panel.config.cameraEntityId}
            .monitoredStats=${this.panel.config.monitoredStats ??
            this.monitoredStats}
            .scaleFactor=${this.panel.config.scaleFactor}
            .slotColors=${this.panel.config.slotColors}
            .showSettingsButton=${this.panel.config.showSettingsButton ?? true}
            .alwaysShow=${this.panel.config.alwaysShow ?? true}
            .mediaView=${this.panel.config.mediaView ?? MediaViewType.Auto}
            .printerArt=${this.panel.config.printerArt ?? PrinterArtType.Auto}
            .showControls=${this.panel.config.showControls ?? true}
            .showMoveButtons=${this.panel.config.showMoveButtons ?? true}
            .sections=${this.panel.config.sections ?? PANEL_SECTIONS}
          ></anycubic-printercard-card>
        </printer-card>

        <div class="ac-rail">
          ${this._renderGroup("machine", [
            ["printer_model", this.selectedPrinterDevice?.model],
            ["printer_fw_version", this.selectedPrinterDevice?.sw_version],
            ["printer_fw_update_available", this.printerStateFwUpdateAvailable],
            ["printer_online", this.printerStateOnline],
            ["printer_available", this.printerStateAvailable],
          ])}
          ${this._renderGroup("ace", [
            ["ace_fw_update_available", this.aceStateFwUpdateAvailable],
            ["drying_active", this.aceStateDryingActive],
            ["drying_progress", this.aceDryingProgress],
          ])}
          ${this._renderDiagnostics()}
        </div>

        ${this._renderPresets()}
      </div>
    `;
  }

  static get styles(): CSSResult {
    return css`
      :host {
        padding: 16px;
        display: block;
      }

      /* The old layout capped the whole page at 600px and centred it, so on a
         1920px screen roughly 69% of the width was empty and the page still
         scrolled. The hero and its rail now sit side by side once there is
         room for both, and stack below that. */
      .ac-panel {
        display: grid;
        grid-template-columns: 1fr;
        gap: 16px;
        max-width: 1600px;
        margin: 0 auto;
        align-items: start;
      }

      @media (min-width: 1100px) {
        .ac-panel {
          grid-template-columns: minmax(0, 1.5fr) minmax(320px, 0.8fr);
        }
        .ac-presets {
          grid-column: 1 / -1;
        }
      }

      printer-card {
        padding: 16px;
        display: block;
        font-size: 18px;
      }

      anycubic-printercard-card {
        margin: 8px;
      }

      .ac-rail {
        display: flex;
        flex-direction: column;
        gap: 16px;
        min-width: 0;
      }

      .ac-tile,
      .ac-diag,
      .ac-presets {
        background: var(--ha-card-background, var(--card-background-color));
        border-radius: var(--ha-card-border-radius, 12px);
        border: 1px solid var(--divider-color, rgba(127, 127, 127, 0.2));
        padding: 12px 16px;
        box-sizing: border-box;
      }

      .ac-tile-title {
        margin: 0 0 8px 0;
        font-size: 0.8em;
        font-weight: 600;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: var(--secondary-text-color);
      }

      /* Identifiers are reference material, not a readout. Folded away, and
         in a smaller monospace so a MAC address stops competing with the
         machine's actual state. */
      .ac-diag summary {
        cursor: pointer;
        font-size: 0.8em;
        font-weight: 600;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: var(--secondary-text-color);
      }

      .ac-diag[open] summary {
        margin-bottom: 8px;
      }

      .ac-diag .info-detail {
        font-family: var(--code-font-family, monospace);
        font-size: 0.85em;
        font-weight: 400;
      }

      .ac-presets-lede {
        margin: 0 0 12px 0;
        font-size: 0.9em;
        color: var(--secondary-text-color);
      }

      .ac-preset-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 380px));
        gap: 12px;
      }

      .ac-preset {
        border: 1px solid var(--divider-color, rgba(127, 127, 127, 0.2));
        border-radius: 8px;
        overflow: hidden;
        min-width: 0;
      }

      .ac-preset-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        padding: 8px 10px;
        font-size: 0.9em;
        font-weight: 600;
        background: var(--secondary-background-color);
      }

      .ac-copy {
        border: 1px solid var(--divider-color, rgba(127, 127, 127, 0.3));
        background: transparent;
        color: var(--primary-text-color);
        border-radius: 999px;
        padding: 2px 10px;
        font: inherit;
        font-size: 0.85em;
        cursor: pointer;
      }

      .ac-copy:hover {
        background: var(--divider-color, rgba(127, 127, 127, 0.2));
      }

      /* Deliberately narrower than the card's own 480px container breakpoint,
         so each tile shows the STACKED form a dashboard column actually gives
         it -- not the wide panel form, which would flatter the preset and then
         look different once pasted. */
      .ac-preset-frame {
        padding: 8px;
        background: var(--primary-background-color);
        border-bottom: 1px solid var(--divider-color, rgba(127, 127, 127, 0.2));
        container-type: inline-size;
      }

      /* Previews are a shop window: looking is fine, operating a printer by
         accident from a gallery is not. */
      .ac-preset-frame anycubic-printercard-card {
        pointer-events: none;
      }

      /* YAML must never widen the page; it scrolls inside its own box. */
      .ac-preset pre {
        margin: 0;
        padding: 10px;
        overflow-x: auto;
        font-family: var(--code-font-family, monospace);
        font-size: 0.8em;
        line-height: 1.5;
      }

      .info-row {
        margin-bottom: 6px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-direction: row;
        box-sizing: border-box;
        width: 100%;
      }

      .info-heading {
        margin-right: 10px;
        font-size: 0.85em;
      }

      .info-detail {
        font-weight: 700;
      }
    `;
  }
}
