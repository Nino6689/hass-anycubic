import { mdiCctv, mdiCube, mdiImageOutline, mdiPrinter3d } from "@mdi/js";
import { CSSResult, LitElement, PropertyValues, css, html, nothing } from "lit";
import { property, state } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";

import { customElementIfUndef } from "../../../internal/register-custom-element";

import {
  AnycubicCameraChoice,
  DomClickEvent,
  EvtTargMediaTab,
  HassEntityInfos,
  HomeAssistant,
  LitTemplateResult,
  MediaViewType,
  PrinterArtType,
} from "../../../types";

import { getPrinterImageStateUrl } from "../../../helpers";

import "../printer_view/printer_view.ts";
import "./camera_stream.ts";

interface MediaTab {
  key: MediaViewType;
  icon: string;
  label: string;
}

/** The card's hero area.
 *
 * Three surfaces share one frame: the live camera, the sliced job's preview
 * image, and the animated printer. Which one starts showing is deliberate --
 * see `_defaultTab`.
 */
@customElementIfUndef("anycubic-printercard-media_view")
export class AnycubicPrintercardMediaView extends LitElement {
  @property()
  public hass!: HomeAssistant;

  @property({ attribute: "printer-entities" })
  public printerEntities!: HassEntityInfos;

  @property({ attribute: "printer-entity-id-part" })
  public printerEntityIdPart: string | undefined;

  @property({ attribute: "media-view" })
  public mediaView: MediaViewType = MediaViewType.Auto;

  @property({ attribute: "printer-art" })
  public printerArt?: PrinterArtType;

  @property({ attribute: "no-camera", type: Boolean })
  public noCamera: boolean = false;

  @property({ attribute: false })
  public camera: AnycubicCameraChoice | undefined;

  @property({ attribute: "is-printing", type: Boolean })
  public isPrinting: boolean = false;

  @state()
  private _selected?: MediaViewType;

  @state()
  private _previewUrl?: string;

  /** The preview image is served by the cloud, so on a local-only connection
   *  the entity exists but the fetch fails. Finding out costs a request, so
   *  remember it and stop offering the tab. */
  @state()
  private _previewFailed: boolean = false;

  protected willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties);

    if (
      changedProperties.has("hass") ||
      changedProperties.has("printerEntityIdPart")
    ) {
      const nextPreviewUrl = getPrinterImageStateUrl(
        this.hass,
        this.printerEntities,
        this.printerEntityIdPart,
        "job_preview",
      );
      if (nextPreviewUrl !== this._previewUrl) {
        this._previewUrl = nextPreviewUrl;
        this._previewFailed = false;
      }
    }
  }

  /** Which surface to show when the user has not chosen one.
   *
   * Never the camera. A cloud-camera session burns a single-use Agora token and
   * Anycubic hands the camera to whichever session asked most recently, so
   * opening it silently takes the stream away from the phone app or the slicer.
   * That is a decision for the person looking at the card, not a side effect of
   * loading a dashboard. `mediaView: camera` opts in.
   */
  private _defaultTab(): MediaViewType {
    if (this._usablePreview()) {
      return MediaViewType.Preview;
    }
    return MediaViewType.Printer;
  }

  private _usablePreview(): boolean {
    return !!this._previewUrl && !this._previewFailed;
  }

  private _availableTabs(): MediaTab[] {
    const tabs: MediaTab[] = [];
    if (this.camera && !this.noCamera) {
      tabs.push({
        key: MediaViewType.Camera,
        icon: mdiCctv,
        label: "Camera",
      });
    }
    if (this._usablePreview()) {
      tabs.push({
        key: MediaViewType.Preview,
        icon: mdiImageOutline,
        label: "Preview",
      });
    }
    tabs.push({
      key: MediaViewType.Printer,
      icon: mdiPrinter3d,
      label: "Printer",
    });
    // Only worth offering when there is actually a model to put in the
    // chamber, and only as a separate choice when a camera could otherwise
    // claim it -- with no camera, `Printer` already shows the model.
    if (this._usablePreview() && this.camera) {
      tabs.push({
        key: MediaViewType.PrinterModel,
        icon: mdiCube,
        label: "Printer + model",
      });
    }
    return tabs;
  }

  private _activeTab(): MediaViewType {
    const tabs = this._availableTabs();
    const wanted =
      this._selected ??
      (this.mediaView === MediaViewType.Auto
        ? this._defaultTab()
        : this.mediaView);
    return tabs.some((t) => t.key === wanted) ? wanted : MediaViewType.Printer;
  }

  private _renderTabs(
    tabs: MediaTab[],
    active: MediaViewType,
  ): LitTemplateResult[] {
    return tabs.map(
      (tab: MediaTab): LitTemplateResult => html`
        <button
          class="ac-media-tab ${classMap({
            "ac-media-tab-active": tab.key === active,
          })}"
          title=${tab.label}
          aria-label=${tab.label}
          aria-pressed=${tab.key === active ? "true" : "false"}
          .tabKey=${tab.key}
          @click=${this._selectTab}
        >
          <ha-svg-icon .path=${tab.icon}></ha-svg-icon>
        </button>
      `,
    );
  }

  private _previewLoadFailed = (): void => {
    this._previewFailed = true;
    if (this._selected === MediaViewType.Preview) {
      this._selected = undefined;
    }
  };

  private _selectTab = (ev: DomClickEvent<EvtTargMediaTab>): void => {
    this._selected = ev.currentTarget.tabKey;
  };

  render(): LitTemplateResult {
    if (this.mediaView === MediaViewType.None) {
      return nothing;
    }

    const active = this._activeTab();
    const tabs = this._availableTabs();

    return html`
      <div
        class="ac-media ${classMap({
          "ac-media-tall":
            active === MediaViewType.Printer ||
            active === MediaViewType.PrinterModel,
        })}"
      >
        <div class="ac-media-surface">${this._renderSurface(active)}</div>
        ${tabs.length > 1
          ? html`
              <div class="ac-media-tabs">${this._renderTabs(tabs, active)}</div>
            `
          : nothing}
        ${active === MediaViewType.Camera && this.camera?.isCloud
          ? html`<div class="ac-media-badge">LIVE</div>`
          : nothing}
      </div>
    `;
  }

  private _renderSurface(active: MediaViewType): LitTemplateResult {
    if (active === MediaViewType.Camera && this.camera && !this.noCamera) {
      return html`
        <anycubic-printercard-camera_stream
          .hass=${this.hass}
          .cameraEntityId=${this.camera.entity_id}
        ></anycubic-printercard-camera_stream>
      `;
    }

    if (active === MediaViewType.Preview && this._usablePreview()) {
      return html`
        <img
          class="ac-media-preview"
          src=${this._previewUrl}
          alt="Job preview"
          @error=${this._previewLoadFailed}
        />
      `;
    }

    return html`
      <anycubic-printercard-printer_view
        .hass=${this.hass}
        .printerEntities=${this.printerEntities}
        .printerEntityIdPart=${this.printerEntityIdPart}
        .scaleFactor=${1}
        .cameraEntityId=${this._insetCameraEntityId()}
        .printerArt=${this.printerArt}
      ></anycubic-printercard-printer_view>
    `;
  }

  /** The camera to play inside the printer chassis, if any.
   *
   * Only when the printer view was actually asked for -- by tapping its tab or
   * by `mediaView: printer` -- never when it is merely standing in because
   * there is no preview to show. Starting the cloud camera takes the stream
   * away from whatever else is watching, so it must follow from a choice.
   */
  private _insetCameraEntityId(): string | undefined {
    // `available` matters as much as `chosen`. selectPrinterCamera falls back
    // to cameras[0] when nothing is available, so an offline LAN camera still
    // arrives here -- and claiming the chamber with it left a dead black
    // rectangle where the sliced model should have been.
    if (this.noCamera || !this.camera || !this.camera.available) {
      return undefined;
    }
    // PrinterModel deliberately withholds the chamber from the camera so the
    // sliced model can have it; that is the whole difference between the two.
    if (this._activeTab() === MediaViewType.PrinterModel) {
      return undefined;
    }
    const chosen =
      this._selected === MediaViewType.Printer ||
      this.mediaView === MediaViewType.Printer;
    return chosen ? this.camera.entity_id : undefined;
  }

  static get styles(): CSSResult {
    return css`
      :host {
        display: block;
      }

      .ac-media {
        position: relative;
        width: 100%;
        aspect-ratio: 16 / 9;
        border-radius: 12px;
        overflow: hidden;
        background: var(--ac-media-background);
        box-sizing: border-box;
      }

      /* The printer silhouette is drawn tall; 16:9 crops its frame. It also
         reads better standing on the card than boxed in a panel. */
      .ac-media-tall {
        aspect-ratio: 4 / 3;
        background: transparent;
      }

      .ac-media-tall .ac-media-surface {
        padding: 8px 0;
      }

      .ac-media-tall .ac-media-tabs {
        background: var(--ac-overlay-background-solid);
      }

      .ac-media-surface {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .ac-media-preview {
        width: 100%;
        height: 100%;
        object-fit: contain;
        background: var(--ac-media-background);
      }

      anycubic-printercard-printer_view {
        width: 100%;
        height: 100%;
      }

      .ac-media-tabs {
        position: absolute;
        left: 8px;
        bottom: 8px;
        display: flex;
        flex-direction: row;
        gap: 2px;
        padding: 2px;
        border-radius: 999px;
        background: var(--ac-overlay-background);
        backdrop-filter: blur(8px);
      }

      .ac-media-tab {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 30px;
        height: 30px;
        padding: 0;
        border: none;
        border-radius: 999px;
        background: transparent;
        color: var(--ac-overlay-text);
        cursor: pointer;
        --mdc-icon-size: 18px;
        transition: background-color 150ms ease-in-out;
      }

      .ac-media-tab:hover {
        background: var(--ac-overlay-hover);
      }

      .ac-media-tab-active {
        background: var(--ac-overlay-active);
        color: var(--ac-overlay-active-text);
      }

      .ac-media-badge {
        position: absolute;
        right: 8px;
        top: 8px;
        padding: 2px 8px;
        border-radius: 999px;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.06em;
        color: #fff;
        background: #e5484d;
      }
    `;
  }
}
