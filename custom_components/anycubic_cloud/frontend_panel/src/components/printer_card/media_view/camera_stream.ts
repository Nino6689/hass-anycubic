import { CSSResult, LitElement, PropertyValues, css, html } from "lit";
import { property, state } from "lit/decorators.js";

import { customElementIfUndef } from "../../../internal/register-custom-element";

import { HassEntity, HomeAssistant, LitTemplateResult } from "../../../types";

interface CardHelpersWindow extends Window {
  loadCardHelpers: () => Promise<{
    createCardElement: (config: object) => HTMLElement;
  }>;
}

/** Home Assistant lazily imports `ha-camera-stream`; nothing defines it until a
 *  card that uses it renders, and `whenDefined` alone would wait forever. Asking
 *  the Lovelace helpers to build a picture-entity card pulls in that module
 *  graph as a side effect, which registers the element. The card element itself
 *  is discarded -- only the import is wanted.
 */
let cameraStreamLoad: Promise<void> | undefined;

async function loadHaCameraStream(cameraEntityId: string): Promise<void> {
  if (customElements.get("ha-camera-stream")) {
    return;
  }
  if (!cameraStreamLoad) {
    cameraStreamLoad = (async (): Promise<void> => {
      const helpers = await (window as unknown as CardHelpersWindow)
        .loadCardHelpers()
        .then((h) => h);
      helpers.createCardElement({
        type: "picture-entity",
        entity: cameraEntityId,
        camera_view: "live",
      });
      await customElements.whenDefined("ha-camera-stream");
    })();
  }
  await cameraStreamLoad;
}

/** Live view for a printer camera.
 *
 * `ha-camera-stream` takes the camera's state object rather than `hass`, and
 * finds the websocket connection itself through Home Assistant's element
 * contexts -- those requests cross shadow roots, so nothing needs passing down.
 * It also picks HLS or WebRTC on its own from the entity's reported
 * capabilities, which is how both the local and the cloud camera work here.
 */
@customElementIfUndef("anycubic-printercard-camera_stream")
export class AnycubicPrintercardCameraStream extends LitElement {
  @property()
  public hass!: HomeAssistant;

  @property({ attribute: "camera-entity-id" })
  public cameraEntityId?: string;

  @state()
  private _elementReady: boolean = !!customElements.get("ha-camera-stream");

  @state()
  private _loadFailed: boolean = false;

  protected willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties);

    if (!this._elementReady && !this._loadFailed && this.cameraEntityId) {
      void loadHaCameraStream(this.cameraEntityId).then(
        () => {
          this._elementReady = true;
        },
        () => {
          this._loadFailed = true;
        },
      );
    }
  }

  private _stateObj(): HassEntity | undefined {
    return this.cameraEntityId
      ? this.hass.states[this.cameraEntityId]
      : undefined;
  }

  render(): LitTemplateResult {
    const stateObj = this._stateObj();

    if (this._loadFailed) {
      return html`<div class="ac-cam-message">Video player unavailable</div>`;
    }

    if (!stateObj || stateObj.state === "unavailable") {
      return html`<div class="ac-cam-message">Camera unavailable</div>`;
    }

    if (!this._elementReady) {
      return html`<div class="ac-cam-message">Starting video…</div>`;
    }

    return html`
      <ha-camera-stream
        muted
        .stateObj=${stateObj}
        .fitMode=${"cover"}
      ></ha-camera-stream>
    `;
  }

  static get styles(): CSSResult {
    return css`
      :host {
        display: block;
        width: 100%;
        height: 100%;
      }

      ha-camera-stream {
        display: block;
        width: 100%;
        height: 100%;
      }

      .ac-cam-message {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        color: var(--secondary-text-color);
        font-size: 14px;
      }
    `;
  }
}
