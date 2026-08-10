import {
  mdiChevronDown,
  mdiCog,
  mdiEngineOffOutline,
  mdiHome,
  mdiLightbulbOff,
  mdiLightbulbOn,
  mdiMenuDown,
  mdiMenuLeft,
  mdiMenuRight,
  mdiMenuUp,
  mdiPause,
  mdiPlay,
  mdiPower,
  mdiStop,
} from "@mdi/js";
import { CSSResult, LitElement, PropertyValues, css, html, nothing } from "lit";
import { property, state } from "lit/decorators.js";
import { query } from "lit/decorators/query.js";
import { classMap } from "lit/directives/class-map.js";
import { styleMap } from "lit/directives/style-map.js";

import { localize } from "../../../../localize/localize";

import { customElementIfUndef } from "../../../internal/register-custom-element";

import { fireEvent } from "../../../fire_event";

import {
  AnycubicCameraChoice,
  CardSectionType,
  DomClickEvent,
  EvtTargCardSection,
  EvtTargEntityPress,
  EvtTargSelectOption,
  HassDevice,
  HassEntity,
  HassEntityInfos,
  HomeAssistant,
  LitTemplateResult,
  MediaViewType,
  PrinterArtType,
  PrinterCardStatType,
  TemperatureUnit,
} from "../../../types";

import {
  getDefaultMonitoredStats,
  getEntityIdByKey,
  getEntityStateBinary,
  getPrinterCameras,
  getPrinterEntities,
  getPrinterEntityIdPart,
  getPrinterSensorStateObj,
  getStateFloatByKey,
  getStateObjByKey,
  isPrintStatePrinting,
  printStateStatusColor,
  selectPrinterCamera,
  toTitleCase,
  undefinedDefault,
} from "../../../helpers";

import "../media_view/media_view.ts";
import "../multicolorbox_view/multicolorbox_view.ts";
import "../stats/stats_component.ts";
import "../multicolorbox_view/multicolorbox_modal_drying.ts";
import "../multicolorbox_view/multicolorbox_modal_spool.ts";
import "../printsettings/printsettings_modal.ts";

const defaultMonitoredStats: PrinterCardStatType[] = getDefaultMonitoredStats();

@customElementIfUndef("anycubic-printercard-card")
export class AnycubicPrintercardCard extends LitElement {
  @query(".ac-printer-card")
  private _printerCardContainer!: HTMLElement | Window;

  @property()
  public hass!: HomeAssistant;

  @property()
  public language!: string;

  @property({ attribute: "monitored-stats" })
  public monitoredStats?: PrinterCardStatType[] = defaultMonitoredStats;

  @property({ attribute: "selected-printer-id" })
  public selectedPrinterID: string | undefined;

  @property({ attribute: "selected-printer-device" })
  public selectedPrinterDevice: HassDevice | undefined;

  @property({ type: Boolean })
  public round?: boolean = true;

  @property({ type: Boolean })
  public use_24hr?: boolean;

  @property({ attribute: "show-settings-button", type: Boolean })
  public showSettingsButton?: boolean;

  @property({ attribute: "always-show", type: Boolean })
  public alwaysShow?: boolean;

  @property({ attribute: "temperature-unit", type: String })
  public temperatureUnit: TemperatureUnit = TemperatureUnit.C;

  @property({ attribute: "light-entity-id", type: String })
  public lightEntityId?: string;

  @property({ attribute: "power-entity-id", type: String })
  public powerEntityId?: string;

  @property({ attribute: "camera-entity-id", type: String })
  public cameraEntityId?: string;

  @property({ type: Boolean })
  public vertical?: boolean;

  @property({ attribute: "scale-factor" })
  public scaleFactor?: number;

  @property({ attribute: "slot-colors" })
  public slotColors?: string[];

  @property({ attribute: "media-view" })
  public mediaView: MediaViewType = MediaViewType.Auto;

  @property({ attribute: "printer-art" })
  public printerArt: PrinterArtType = PrinterArtType.Auto;

  @property({ attribute: "show-controls", type: Boolean })
  public showControls?: boolean = true;

  @property({ attribute: false })
  public sections?: CardSectionType[];

  @state()
  private isHidden: boolean = false;

  @state()
  private isPrinting: boolean = false;

  @state()
  private isPaused: boolean = false;

  @state()
  private hiddenOverride: boolean = false;

  @state()
  private hasColorbox: boolean = false;

  @state()
  private hasSecondaryColorbox: boolean = false;

  @state()
  private lightIsOn: boolean = false;

  @state()
  private statusColor: string = "#ffc107";

  @state()
  private printStateString: string = "unknown";

  @state()
  private printerEntities: HassEntityInfos;

  @state()
  private printerEntityIdPart: string | undefined;

  @state()
  private progressPercent: number = 0;

  @state()
  private camera: AnycubicCameraChoice | undefined;

  @state()
  private _buttonPrintSettings: string;

  @state()
  private _togglingLight: boolean = false;

  @state()
  private _togglingPower: boolean = false;

  @state()
  private _openSection: CardSectionType | undefined;

  protected willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties);

    if (changedProperties.has("language")) {
      this._buttonPrintSettings = localize(
        "card.buttons.print_settings",
        this.language,
      );
    }

    if (changedProperties.has("monitoredStats")) {
      this.monitoredStats = undefinedDefault(
        this.monitoredStats,
        defaultMonitoredStats,
      ) as PrinterCardStatType[];
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
      changedProperties.has("alwaysShow") ||
      changedProperties.has("hiddenOverride") ||
      changedProperties.has("cameraEntityId") ||
      changedProperties.has("selectedPrinterID")
    ) {
      this.progressPercent = this._percentComplete();
      this.hasColorbox =
        getPrinterSensorStateObj(
          this.hass,
          this.printerEntities,
          this.printerEntityIdPart,
          "ace_spools",
          "inactive",
        ).state === "active";
      this.hasSecondaryColorbox =
        getPrinterSensorStateObj(
          this.hass,
          this.printerEntities,
          this.printerEntityIdPart,
          "secondary_multi_color_box_spools",
          "inactive",
        ).state === "active";

      this.camera = selectPrinterCamera(
        getPrinterCameras(this.hass, this.printerEntities),
        this.cameraEntityId,
      );

      this.lightIsOn = getEntityStateBinary(
        this.hass,
        { entity_id: this.lightEntityId ?? "" },
        true,
        false,
      ) as boolean;

      const jobState = getPrinterSensorStateObj(
        this.hass,
        this.printerEntities,
        this.printerEntityIdPart,
        "job_state",
        "unknown",
      ).state.toLowerCase();

      // Job state comes from the cloud. On a local-only connection it reports
      // nothing, and calling a printer that is sitting there online
      // "Unavailable" is simply wrong -- fall back to what the printer itself
      // says about being ready.
      const knowsJob = jobState !== "unavailable" && jobState !== "unknown";
      this.printStateString = knowsJob ? jobState : this._printerAvailability();

      this.isPrinting = knowsJob && isPrintStatePrinting(jobState);
      this.isPaused = jobState === "paused";
      this.isHidden = !this.alwaysShow
        ? !this.hiddenOverride && !this.isPrinting
        : false;
      this.statusColor = printStateStatusColor(this.printStateString);
    }
  }

  render(): LitTemplateResult {
    return html`
      <ha-card class="ac-printer-card">
        ${this._renderHeader()}
        <div
          class="ac-body ${classMap({ "ac-body-hidden": this.isHidden })}"
          aria-hidden=${this.isHidden ? "true" : "false"}
        >
          <div
            class="ac-main ${classMap({ "ac-main-stacked": !!this.vertical })}"
            style=${styleMap(this._mainColumnStyles())}
          >
            ${this._renderMedia()}
            <div class="ac-summary">
              ${this._renderProgress()} ${this._renderStats()}
            </div>
          </div>
          ${this._renderControls()} ${this._renderSections()}
        </div>
        <anycubic-printercard-multicolorbox_modal_spool
          .hass=${this.hass}
          .language=${this.language}
          .selectedPrinterDevice=${this.selectedPrinterDevice}
          .slotColors=${this.slotColors}
        ></anycubic-printercard-multicolorbox_modal_spool>
        <anycubic-printercard-printsettings_modal
          .hass=${this.hass}
          .language=${this.language}
          .selectedPrinterDevice=${this.selectedPrinterDevice}
          .printerEntities=${this.printerEntities}
          .printerEntityIdPart=${this.printerEntityIdPart}
        ></anycubic-printercard-printsettings_modal>
        <anycubic-printercard-multicolorbox_modal_drying
          .hass=${this.hass}
          .language=${this.language}
          .selectedPrinterDevice=${this.selectedPrinterDevice}
          .printerEntities=${this.printerEntities}
          .printerEntityIdPart=${this.printerEntityIdPart}
        ></anycubic-printercard-multicolorbox_modal_drying>
      </ha-card>
    `;
  }

  private _renderHeader(): LitTemplateResult {
    const stylesDot = {
      "background-color": this.statusColor,
    };

    return html`
      <div class="ac-header">
        <button
          class="ac-header-identity"
          @click=${this._toggleHiddenOveride}
          title=${this.alwaysShow ? "" : "Show or hide the card body"}
        >
          <span class="ac-status-dot" style=${styleMap(stylesDot)}></span>
          <span class="ac-header-text">
            <span class="ac-header-name"
              >${this.selectedPrinterDevice?.name ?? "Anycubic printer"}</span
            >
            <span class="ac-header-state"
              >${toTitleCase(this.printStateString)}</span
            >
          </span>
        </button>
        <div class="ac-header-actions">
          ${this.lightEntityId
            ? html`
                <button
                  class="ac-icon-button ${classMap({
                    "ac-icon-button-on": this.lightIsOn,
                  })}"
                  .disabled=${this._togglingLight}
                  title="Printer light"
                  aria-label="Printer light"
                  @click=${this._toggleLightEntity}
                >
                  <ha-svg-icon
                    .path=${this.lightIsOn ? mdiLightbulbOn : mdiLightbulbOff}
                  ></ha-svg-icon>
                </button>
              `
            : nothing}
          ${this.powerEntityId
            ? html`
                <button
                  class="ac-icon-button"
                  .disabled=${this._togglingPower}
                  title="Printer power"
                  aria-label="Printer power"
                  @click=${this._togglePowerEntity}
                >
                  <ha-svg-icon .path=${mdiPower}></ha-svg-icon>
                </button>
              `
            : nothing}
        </div>
      </div>
    `;
  }

  /** `scaleFactor` sets how much of a side-by-side layout the media takes.
   *  The old card used it to skew two fixed columns; here it weights the media
   *  column against the summary column, which is the same intent in a layout
   *  that also has to work on a phone. */
  private _mainColumnStyles(): Record<string, string> {
    const factor =
      this.scaleFactor && this.scaleFactor > 0 ? this.scaleFactor : 1;
    return {
      "grid-template-columns": `minmax(0, ${factor}fr) minmax(0, 1fr)`,
    };
  }

  private _renderMedia(): LitTemplateResult {
    if (this.mediaView === MediaViewType.None) {
      return nothing;
    }
    return html`
      <anycubic-printercard-media_view
        .hass=${this.hass}
        .printerEntities=${this.printerEntities}
        .printerEntityIdPart=${this.printerEntityIdPart}
        .mediaView=${this.mediaView}
        .printerArt=${this.printerArt}
        .camera=${this.camera}
        .isPrinting=${this.isPrinting}
      ></anycubic-printercard-media_view>
    `;
  }

  private _renderProgress(): LitTemplateResult {
    // An unavailable printer reports no progress at all, which parses to NaN --
    // and NaN fails every comparison, so it has to be excluded by name or the
    // card confidently renders "NaN%" over a full-width bar.
    if (!isFinite(this.progressPercent) || this.progressPercent < 0) {
      return nothing;
    }

    const pct = Math.max(0, Math.min(100, this.progressPercent));
    const layer = getStateFloatByKey(
      this.hass,
      this.printerEntities,
      "job_current_layer",
    );
    const totalLayers = getStateFloatByKey(
      this.hass,
      this.printerEntities,
      "job_total_layers",
    );

    return html`
      <div class="ac-progress">
        <div class="ac-progress-head">
          <span class="ac-progress-pct"
            >${this.round ? Math.round(pct) : pct}%</span
          >
          ${typeof layer !== "undefined" && typeof totalLayers !== "undefined"
            ? html`<span class="ac-progress-layers"
                >Layer ${layer} / ${totalLayers}</span
              >`
            : nothing}
        </div>
        <div class="ac-progress-track">
          <div
            class="ac-progress-fill"
            style=${styleMap({
              width: `${pct}%`,
              "background-color": this.statusColor,
            })}
          ></div>
        </div>
      </div>
    `;
  }

  private _renderStats(): LitTemplateResult {
    return html`
      <anycubic-printercard-stats-component
        .hass=${this.hass}
        .language=${this.language}
        .monitoredStats=${this.monitoredStats}
        .printerEntities=${this.printerEntities}
        .printerEntityIdPart=${this.printerEntityIdPart}
        .progressPercent=${this.progressPercent}
        .showPercent=${false}
        .round=${this.round}
        .use_24hr=${this.use_24hr}
        .temperatureUnit=${this.temperatureUnit}
      ></anycubic-printercard-stats-component>
    `;
  }

  private _renderControls(): LitTemplateResult {
    if (!this.showControls) {
      return nothing;
    }

    const buttons: LitTemplateResult[] = [];

    if (this.isPrinting) {
      buttons.push(
        this.isPaused
          ? this._renderActionButton("Resume", mdiPlay, "resume_print")
          : this._renderActionButton("Pause", mdiPause, "pause_print"),
      );
      buttons.push(
        this._renderActionButton("Cancel", mdiStop, "cancel_print", true),
      );
    }

    if (this.showSettingsButton || this.isPrinting) {
      buttons.push(html`
        <button class="ac-button" @click=${this._openPrintSettingsModal}>
          <ha-svg-icon .path=${mdiCog}></ha-svg-icon>
          <span>${this._buttonPrintSettings}</span>
        </button>
      `);
    }

    if (!buttons.length) {
      return nothing;
    }

    return html`<div class="ac-controls">${buttons}</div>`;
  }

  /** A button that presses one of the printer's own button entities.
   *
   * Resolved through the entity registry rather than by building an entity id
   * from a string, so a renamed entity disables the button instead of firing a
   * service call at an id that does not exist.
   */
  private _renderActionButton(
    label: string,
    icon: string,
    translationKey: string,
    danger: boolean = false,
  ): LitTemplateResult {
    const entityId = getEntityIdByKey(this.printerEntities, translationKey);
    const stateObj = entityId ? this.hass.states[entityId] : undefined;
    const disabled = !entityId || stateObj?.state === "unavailable";

    return html`
      <button
        class="ac-button ${classMap({ "ac-button-danger": danger })}"
        .disabled=${disabled}
        .entityId=${entityId}
        @click=${this._pressButtonEvent}
      >
        <ha-svg-icon .path=${icon}></ha-svg-icon>
        <span>${label}</span>
      </button>
    `;
  }

  private _renderSections(): LitTemplateResult {
    const wanted = this.sections ?? [CardSectionType.Filament];
    const rendered: LitTemplateResult[] = [];

    if (wanted.includes(CardSectionType.Filament) && this.hasColorbox) {
      rendered.push(
        this._renderSection(
          CardSectionType.Filament,
          "Filament",
          this._renderFilamentSection(),
        ),
      );
    }
    if (wanted.includes(CardSectionType.Move)) {
      rendered.push(
        this._renderSection(
          CardSectionType.Move,
          "Move",
          this._renderMoveSection(),
        ),
      );
    }
    if (wanted.includes(CardSectionType.Insights)) {
      rendered.push(
        this._renderSection(
          CardSectionType.Insights,
          "Insights",
          this._renderInsightsSection(),
        ),
      );
    }

    return rendered.length ? html`${rendered}` : nothing;
  }

  private _renderSection(
    key: CardSectionType,
    title: string,
    body: LitTemplateResult,
  ): LitTemplateResult {
    const open = this._openSection === key;
    return html`
      <div class="ac-section">
        <button
          class="ac-section-head"
          aria-expanded=${open ? "true" : "false"}
          .sectionKey=${key}
          @click=${this._toggleSection}
        >
          <span>${title}</span>
          <ha-svg-icon
            class="ac-section-chevron ${classMap({
              "ac-section-chevron-open": open,
            })}"
            .path=${mdiChevronDown}
          ></ha-svg-icon>
        </button>
        ${open ? html`<div class="ac-section-body">${body}</div>` : nothing}
      </div>
    `;
  }

  private _renderFilamentSection(): LitTemplateResult {
    return html`
      <anycubic-printercard-multicolorbox_view
        .hass=${this.hass}
        .language=${this.language}
        .printerEntities=${this.printerEntities}
        .printerEntityIdPart=${this.printerEntityIdPart}
        .box_id=${0}
      ></anycubic-printercard-multicolorbox_view>
      ${this.hasSecondaryColorbox
        ? html`
            <anycubic-printercard-multicolorbox_view
              .hass=${this.hass}
              .language=${this.language}
              .printerEntities=${this.printerEntities}
              .printerEntityIdPart=${this.printerEntityIdPart}
              .box_id=${1}
            ></anycubic-printercard-multicolorbox_view>
          `
        : nothing}
    `;
  }

  private _renderMoveSection(): LitTemplateResult {
    const stepEntityId = getEntityIdByKey(this.printerEntities, "axis_step");
    const stepState = stepEntityId ? this.hass.states[stepEntityId] : undefined;
    const moving =
      getStateObjByKey(this.hass, this.printerEntities, "axis_moving")
        ?.state === "on";
    const refused =
      getStateObjByKey(this.hass, this.printerEntities, "axis_move_failed")
        ?.state === "on";

    return html`
      ${stepState
        ? html`
            <div class="ac-step-segmented">
              ${this._renderStepOptions(stepEntityId, stepState)}
            </div>
          `
        : nothing}
      <div class="ac-move">
        <div class="ac-move-col">
          ${this._renderSquareButton("axis_home_all", mdiHome, "Home all axes")}
          ${this._renderSquareButton(
            "axis_motors_off",
            mdiEngineOffOutline,
            "Release motors",
          )}
        </div>

        <div class="ac-dial">
          ${this._renderWedge("axis_move_y_plus", mdiMenuUp, "Y+", "up")}
          ${this._renderWedge("axis_move_x_minus", mdiMenuLeft, "X-", "left")}
          ${this._renderWedge("axis_move_x_plus", mdiMenuRight, "X+", "right")}
          ${this._renderWedge("axis_move_y_minus", mdiMenuDown, "Y-", "down")}
          ${this._renderDialCentre()}
        </div>

        <div class="ac-move-col">
          ${this._renderSquareButton(
            "axis_move_z_plus",
            mdiMenuUp,
            "Z up",
            "Z+",
          )}
          ${this._renderSquareButton(
            "axis_home_z",
            mdiHome,
            "Home Z",
            "",
            true,
          )}
          ${this._renderSquareButton(
            "axis_move_z_minus",
            mdiMenuDown,
            "Z down",
            "Z-",
          )}
        </div>
      </div>
      ${moving
        ? html`<p class="ac-note">Moving…</p>`
        : refused
          ? html`<p class="ac-note ac-note-warn">
              Last move was refused. Z has to be homed on its own before it will
              move.
            </p>`
          : nothing}
    `;
  }

  /** One quadrant of the XY dial. */
  private _renderWedge(
    translationKey: string,
    icon: string,
    label: string,
    position: string,
  ): LitTemplateResult {
    const entityId = getEntityIdByKey(this.printerEntities, translationKey);
    const stateObj = entityId ? this.hass.states[entityId] : undefined;
    const disabled = !entityId || stateObj?.state === "unavailable";

    return html`
      <button
        class="ac-wedge ac-wedge-${position}"
        .disabled=${disabled}
        title=${label}
        aria-label=${label}
        .entityId=${entityId}
        @click=${this._pressButtonEvent}
      >
        <span class="ac-wedge-inner">
          <ha-svg-icon .path=${icon}></ha-svg-icon>
          <span class="ac-wedge-label">${label}</span>
        </span>
      </button>
    `;
  }

  private _renderDialCentre(): LitTemplateResult {
    const entityId = getEntityIdByKey(this.printerEntities, "axis_home_xy");
    const stateObj = entityId ? this.hass.states[entityId] : undefined;
    const disabled = !entityId || stateObj?.state === "unavailable";

    return html`
      <button
        class="ac-dial-centre"
        .disabled=${disabled}
        title="Home X and Y"
        aria-label="Home X and Y"
        .entityId=${entityId}
        @click=${this._pressButtonEvent}
      >
        <ha-svg-icon .path=${mdiHome}></ha-svg-icon>
      </button>
    `;
  }

  private _renderSquareButton(
    translationKey: string,
    icon: string,
    title: string,
    label: string = "",
    accent: boolean = false,
  ): LitTemplateResult {
    const entityId = getEntityIdByKey(this.printerEntities, translationKey);
    const stateObj = entityId ? this.hass.states[entityId] : undefined;
    const disabled = !entityId || stateObj?.state === "unavailable";

    return html`
      <button
        class="ac-square ${classMap({ "ac-square-accent": accent })}"
        .disabled=${disabled}
        title=${title}
        aria-label=${title}
        .entityId=${entityId}
        @click=${this._pressButtonEvent}
      >
        ${label ? html`<span class="ac-square-label">${label}</span>` : nothing}
        <ha-svg-icon .path=${icon}></ha-svg-icon>
      </button>
    `;
  }

  private _renderStepOptions(
    stepEntityId: string | undefined,
    stepState: HassEntity,
  ): LitTemplateResult[] {
    const options =
      (stepState.attributes.options as string[] | undefined) ?? [];
    return options.map(
      (opt: string): LitTemplateResult => html`
        <button
          class="ac-chip-button ${classMap({
            "ac-chip-button-active": stepState.state === opt,
          })}"
          .entityId=${stepEntityId}
          .option=${opt}
          @click=${this._selectOptionEvent}
        >
          ${opt}
        </button>
      `,
    );
  }

  private _renderInsightsSection(): LitTemplateResult {
    const currency = this.hass.config.currency ?? "";
    const rows: { label: string; value: string }[] = [];

    const push = (label: string, value: string | undefined): void => {
      if (typeof value !== "undefined") {
        rows.push({ label, value });
      }
    };

    const money = (key: string): string | undefined => {
      const v = getStateFloatByKey(this.hass, this.printerEntities, key);
      if (typeof v === "undefined") {
        return undefined;
      }
      if (!currency) {
        return v.toFixed(2);
      }
      try {
        return new Intl.NumberFormat(this.hass.language, {
          style: "currency",
          currency,
        }).format(v);
      } catch {
        // An unrecognised currency in the HA config must not blank the row.
        return `${v.toFixed(2)} ${currency}`;
      }
    };
    const grams = (key: string): string | undefined => {
      const v = getStateFloatByKey(this.hass, this.printerEntities, key);
      return typeof v === "undefined" ? undefined : `${Math.round(v)} g`;
    };

    push("This job", money("job_cost"));
    push("Last job", money("last_job_cost"));
    push("Filament spend", money("filament_cost_total"));
    push("Job needs", grams("job_filament_required"));
    push("Shortfall", grams("job_filament_shortfall"));

    const nozzleWear = getStateFloatByKey(
      this.hass,
      this.printerEntities,
      "nozzle_wear_percent",
    );
    push(
      "Nozzle wear",
      typeof nozzleWear === "undefined"
        ? undefined
        : `${nozzleWear.toFixed(1)}%`,
    );
    push("Spools left", grams("spool_inventory_remaining"));

    const insufficient = getStateObjByKey(
      this.hass,
      this.printerEntities,
      "job_filament_insufficient",
    );

    if (!rows.length) {
      return html`<p class="ac-note">
        Nothing to report yet. Cost and forecast figures appear once a job has
        run and spool weights are set.
      </p>`;
    }

    return html`
      ${insufficient?.state === "on"
        ? html`<p class="ac-note ac-note-warn">
            Not enough filament loaded to finish this job.
          </p>`
        : nothing}
      <div class="ac-insights">${this._renderInsightRows(rows)}</div>
    `;
  }

  private _renderInsightRows(
    rows: { label: string; value: string }[],
  ): LitTemplateResult[] {
    return rows.map(
      (row: { label: string; value: string }): LitTemplateResult => html`
        <div class="ac-insight">
          <span class="ac-insight-label">${row.label}</span>
          <span class="ac-insight-value">${row.value}</span>
        </div>
      `,
    );
  }

  private _pressButtonEvent = (ev: DomClickEvent<EvtTargEntityPress>): void => {
    const entityId = ev.currentTarget.entityId;
    if (!entityId) {
      return;
    }
    void this.hass.callService("button", "press", { entity_id: entityId });
  };

  private _selectOptionEvent = (
    ev: DomClickEvent<EvtTargSelectOption>,
  ): void => {
    const entityId = ev.currentTarget.entityId;
    if (!entityId) {
      return;
    }
    void this.hass.callService("select", "select_option", {
      entity_id: entityId,
      option: ev.currentTarget.option,
    });
  };

  private _toggleSection = (ev: DomClickEvent<EvtTargCardSection>): void => {
    const key = ev.currentTarget.sectionKey;
    this._openSection = this._openSection === key ? undefined : key;
  };

  private _openPrintSettingsModal = (): void => {
    fireEvent(this._printerCardContainer, "ac-printset-modal", {
      modalOpen: true,
    });
  };

  private _toggleLightEntity = (): void => {
    if (this.lightEntityId) {
      this._togglingLight = true;
      this.hass
        .callService("homeassistant", "toggle", {
          entity_id: this.lightEntityId,
        })
        .then(() => {
          this._togglingLight = false;
        })
        .catch((_e: unknown) => {
          this._togglingLight = false;
        });
    }
  };

  private _togglePowerEntity = (): void => {
    if (this.powerEntityId) {
      this._togglingPower = true;
      this.hass
        .callService("homeassistant", "toggle", {
          entity_id: this.powerEntityId,
        })
        .then(() => {
          this._togglingPower = false;
        })
        .catch((_e: unknown) => {
          this._togglingPower = false;
        });
    }
  };

  private _toggleHiddenOveride = (): void => {
    this.hiddenOverride = !this.hiddenOverride;
  };

  /** What to say about a printer with no job to report. */
  private _printerAvailability(): string {
    const online = getStateObjByKey(
      this.hass,
      this.printerEntities,
      "printer_online",
    );
    if (online?.state === "off") {
      return "offline";
    }
    const status = getPrinterSensorStateObj(
      this.hass,
      this.printerEntities,
      this.printerEntityIdPart,
      "current_status",
      "unknown",
    ).state.toLowerCase();
    return status;
  }

  private _percentComplete(): number {
    return Number(
      getPrinterSensorStateObj(
        this.hass,
        this.printerEntities,
        this.printerEntityIdPart,
        "job_progress",
        -1.0,
      ).state,
    );
  }

  static get styles(): CSSResult {
    return css`
      :host {
        display: block;

        --ac-gap: 12px;
        --ac-radius: 12px;
        --ac-media-background: color-mix(
          in srgb,
          var(--primary-text-color) 8%,
          transparent
        );
        --ac-overlay-background: rgba(0, 0, 0, 0.45);
        /* The tab strip sits on the card itself in the printer view, where a
           translucent scrim has nothing behind it to soften. */
        --ac-overlay-background-solid: rgba(0, 0, 0, 0.72);
        --ac-overlay-hover: rgba(255, 255, 255, 0.14);
        --ac-overlay-active: rgba(255, 255, 255, 0.92);
        --ac-overlay-active-text: #111;
        --ac-overlay-text: #fff;
        --ac-subtle: color-mix(
          in srgb,
          var(--primary-text-color) 6%,
          transparent
        );
        --ac-pressed: color-mix(
          in srgb,
          var(--primary-text-color) 12%,
          transparent
        );
        --ac-border: var(--divider-color, rgba(127, 127, 127, 0.3));
      }

      .ac-printer-card {
        display: block;
        box-sizing: border-box;
        padding: 12px;
        overflow: hidden;
        /* Lets the layout answer to the space the card was actually given,
           rather than to the width of the browser window. */
        container-type: inline-size;
      }

      /* Header ------------------------------------------------------------ */

      .ac-header {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }

      .ac-header-identity {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 10px;
        flex: 1 1 auto;
        min-width: 0;
        padding: 4px;
        border: none;
        border-radius: 8px;
        background: transparent;
        cursor: pointer;
        text-align: left;
        color: inherit;
        font: inherit;
      }

      .ac-status-dot {
        flex: 0 0 auto;
        width: 10px;
        height: 10px;
        border-radius: 50%;
      }

      .ac-header-text {
        display: flex;
        flex-direction: column;
        min-width: 0;
      }

      .ac-header-name {
        font-size: 16px;
        font-weight: 600;
        color: var(--primary-text-color);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .ac-header-state {
        font-size: 12px;
        color: var(--secondary-text-color);
      }

      .ac-header-actions {
        display: flex;
        flex-direction: row;
        gap: 2px;
        flex: 0 0 auto;
      }

      .ac-icon-button {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        padding: 0;
        border: none;
        border-radius: 50%;
        background: transparent;
        color: var(--secondary-text-color);
        cursor: pointer;
        --mdc-icon-size: 20px;
        transition:
          background-color 150ms ease-in-out,
          color 150ms ease-in-out;
      }

      .ac-icon-button:hover:not(:disabled) {
        background: var(--ac-subtle);
      }

      .ac-icon-button:disabled {
        opacity: 0.5;
        cursor: default;
      }

      .ac-icon-button-on {
        color: var(--state-light-active-color, #fdd835);
      }

      /* Body -------------------------------------------------------------- */

      .ac-body {
        display: flex;
        flex-direction: column;
        gap: var(--ac-gap);
        padding-top: var(--ac-gap);
        max-height: 2400px;
        transition:
          opacity 200ms ease-in-out,
          max-height 250ms ease-in-out;
        overflow: hidden;
      }

      .ac-body-hidden {
        max-height: 0;
        opacity: 0;
        padding-top: 0;
        pointer-events: none;
      }

      .ac-main {
        display: flex;
        flex-direction: column;
        gap: var(--ac-gap);
      }

      .ac-summary {
        display: flex;
        flex-direction: column;
        gap: var(--ac-gap);
        min-width: 0;
      }

      /* Side by side once the card is wide enough to earn it, unless the
         config asked for a stacked layout. */
      @container (min-width: 480px) {
        /* The column ratio itself is set inline from scaleFactor; grid-template
           cannot be assembled from a custom property in plain CSS. It is inert
           while this element is display:flex on a narrow card. */
        .ac-main:not(.ac-main-stacked) {
          display: grid;
          align-items: start;
        }

        .ac-main:not(.ac-main-stacked) .ac-summary {
          justify-content: center;
        }
      }

      /* Progress ---------------------------------------------------------- */

      .ac-progress {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .ac-progress-head {
        display: flex;
        flex-direction: row;
        align-items: baseline;
        justify-content: space-between;
      }

      .ac-progress-pct {
        font-size: 22px;
        font-weight: 700;
        color: var(--primary-text-color);
        font-variant-numeric: tabular-nums;
      }

      .ac-progress-layers {
        font-size: 12px;
        color: var(--secondary-text-color);
        font-variant-numeric: tabular-nums;
      }

      .ac-progress-track {
        width: 100%;
        height: 6px;
        border-radius: 999px;
        background: var(--ac-subtle);
        overflow: hidden;
      }

      .ac-progress-fill {
        height: 100%;
        border-radius: 999px;
        transition: width 400ms ease-in-out;
      }

      /* Controls ---------------------------------------------------------- */

      .ac-controls {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        gap: 8px;
      }

      .ac-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        flex: 1 1 auto;
        min-height: 38px;
        padding: 0 14px;
        border: 1px solid var(--ac-border);
        border-radius: 999px;
        background: transparent;
        color: var(--primary-text-color);
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        --mdc-icon-size: 18px;
        transition: background-color 150ms ease-in-out;
      }

      .ac-button:hover:not(:disabled) {
        background: var(--ac-subtle);
      }

      .ac-button:disabled {
        opacity: 0.45;
        cursor: default;
      }

      .ac-button-danger {
        color: var(--error-color, #db4437);
        border-color: color-mix(
          in srgb,
          var(--error-color, #db4437) 45%,
          transparent
        );
      }

      /* Sections ---------------------------------------------------------- */

      .ac-section {
        border-top: 1px solid var(--ac-border);
      }

      .ac-section-head {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        padding: 10px 2px;
        border: none;
        background: transparent;
        color: var(--primary-text-color);
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
      }

      .ac-section-chevron {
        --mdc-icon-size: 20px;
        color: var(--secondary-text-color);
        transition: transform 200ms ease-in-out;
      }

      .ac-section-chevron-open {
        transform: rotate(180deg);
      }

      .ac-section-body {
        padding: 4px 0 12px 0;
      }

      /* Move -------------------------------------------------------------- */

      .ac-chip-button {
        padding: 4px 10px;
        border: 1px solid var(--ac-border);
        border-radius: 999px;
        background: transparent;
        color: var(--primary-text-color);
        font-size: 12px;
        cursor: pointer;
        white-space: nowrap;
        transition:
          background-color 150ms ease-in-out,
          border-color 150ms ease-in-out,
          color 150ms ease-in-out;
      }

      .ac-chip-button:hover:not(.ac-chip-button-active) {
        background: var(--ac-subtle);
      }

      .ac-chip-button-active {
        background: var(--primary-color);
        border-color: var(--primary-color);
        color: var(--text-primary-color, #fff);
      }

      .ac-step-segmented {
        display: flex;
        flex-direction: row;
        gap: 6px;
        margin-bottom: 18px;
      }

      .ac-step-segmented .ac-chip-button {
        flex: 1 1 0;
        min-height: 34px;
        font-size: 13px;
        font-weight: 600;
        border-radius: 10px;
      }

      .ac-move {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
      }

      .ac-move-col {
        display: flex;
        flex-direction: column;
        gap: 10px;
        flex: 0 0 auto;
      }

      .ac-square {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0;
        width: 46px;
        height: 46px;
        padding: 0;
        border: 1px solid var(--ac-border);
        border-radius: 12px;
        background: transparent;
        color: var(--primary-color);
        cursor: pointer;
        --mdc-icon-size: 22px;
        transition:
          background-color 150ms ease-in-out,
          border-color 150ms ease-in-out;
      }

      .ac-square:hover:not(:disabled) {
        background: var(--ac-subtle);
      }

      .ac-square:active:not(:disabled) {
        background: var(--ac-pressed);
      }

      .ac-square:disabled {
        opacity: 0.35;
        cursor: default;
      }

      .ac-square-accent {
        border-color: var(--primary-color);
      }

      .ac-square-label {
        font-size: 10px;
        font-weight: 700;
        line-height: 1;
        color: var(--secondary-text-color);
      }

      /* The XY dial: four quadrants clipped out of one circle, with a home
         button sitting in the middle. */
      .ac-dial {
        position: relative;
        flex: 0 0 auto;
        width: 148px;
        height: 148px;
        border-radius: 50%;
        background: var(--ac-subtle);
        overflow: hidden;
      }

      .ac-wedge {
        position: absolute;
        inset: 0;
        display: flex;
        padding: 0;
        border: none;
        background: transparent;
        color: var(--primary-color);
        cursor: pointer;
        --mdc-icon-size: 16px;
        transition: background-color 150ms ease-in-out;
      }

      .ac-wedge:hover:not(:disabled) {
        background: var(--ac-subtle);
      }

      .ac-wedge:active:not(:disabled) {
        background: var(--ac-pressed);
      }

      .ac-wedge:disabled {
        opacity: 0.35;
        cursor: default;
      }

      .ac-wedge-up {
        clip-path: polygon(0 0, 100% 0, 50% 50%);
        align-items: flex-start;
        justify-content: center;
        padding-top: 10px;
      }

      .ac-wedge-right {
        clip-path: polygon(100% 0, 100% 100%, 50% 50%);
        align-items: center;
        justify-content: flex-end;
        padding-right: 8px;
      }

      .ac-wedge-down {
        clip-path: polygon(0 100%, 100% 100%, 50% 50%);
        align-items: flex-end;
        justify-content: center;
        padding-bottom: 10px;
      }

      .ac-wedge-left {
        clip-path: polygon(0 0, 0 100%, 50% 50%);
        align-items: center;
        justify-content: flex-start;
        padding-left: 8px;
      }

      .ac-wedge-inner {
        display: flex;
        align-items: center;
        gap: 1px;
      }

      .ac-wedge-up .ac-wedge-inner,
      .ac-wedge-down .ac-wedge-inner {
        flex-direction: column;
      }

      .ac-wedge-down .ac-wedge-inner {
        flex-direction: column-reverse;
      }

      .ac-wedge-right .ac-wedge-inner {
        flex-direction: row-reverse;
      }

      .ac-wedge-label {
        font-size: 11px;
        font-weight: 600;
        color: var(--secondary-text-color);
      }

      .ac-dial-centre {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        display: flex;
        align-items: center;
        justify-content: center;
        width: 52px;
        height: 52px;
        padding: 0;
        border: 1px solid var(--ac-border);
        border-radius: 50%;
        background: var(
          --ha-card-background,
          var(--card-background-color, #fff)
        );
        color: var(--primary-color);
        cursor: pointer;
        --mdc-icon-size: 22px;
        transition: background-color 150ms ease-in-out;
      }

      .ac-dial-centre:hover:not(:disabled) {
        background: var(--ac-subtle);
      }

      .ac-dial-centre:disabled {
        opacity: 0.35;
        cursor: default;
      }

      /* Insights ---------------------------------------------------------- */

      .ac-insights {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
        gap: 8px;
      }

      .ac-insight {
        display: flex;
        flex-direction: column;
        gap: 2px;
        padding: 8px 10px;
        border-radius: 10px;
        background: var(--ac-subtle);
      }

      .ac-insight-label {
        font-size: 11px;
        color: var(--secondary-text-color);
      }

      .ac-insight-value {
        font-size: 15px;
        font-weight: 600;
        color: var(--primary-text-color);
        font-variant-numeric: tabular-nums;
      }

      /* Notes ------------------------------------------------------------- */

      .ac-note {
        margin: 8px 0 0 0;
        font-size: 12px;
        color: var(--secondary-text-color);
      }

      .ac-note-warn {
        color: var(--warning-color, #ffa600);
      }

      @media (max-width: 420px) {
        .ac-move {
          gap: 12px;
        }
      }
    `;
  }
}
