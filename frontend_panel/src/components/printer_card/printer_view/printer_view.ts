import { CSSResult, LitElement, css, html } from "lit";
import { property } from "lit/decorators.js";

import { printerConfigAnycubic } from "./utils";
import { PrinterArtKind } from "./printer_art";
import { customElementIfUndef } from "../../../internal/register-custom-element";

import {
  HassEntityInfos,
  HomeAssistant,
  LitTemplateResult,
  PrinterArtType,
} from "../../../types";

import "./animated_printer.ts";

@customElementIfUndef("anycubic-printercard-printer_view")
export class AnycubicPrintercardPrinterview extends LitElement {
  @property()
  public hass!: HomeAssistant;

  @property({ attribute: "toggle-video", type: Function })
  public toggleVideo?: () => void;

  @property({ attribute: "printer-entities" })
  public printerEntities: HassEntityInfos;

  @property({ attribute: "printer-entity-id-part" })
  public printerEntityIdPart: string | undefined;

  @property({ attribute: "scale-factor" })
  public scaleFactor?: number;

  /** When set, the live camera plays inside the printer's build volume instead
   *  of the modelled print. */
  @property({ attribute: "camera-entity-id" })
  public cameraEntityId?: string;

  /** `Auto` is mapped away below rather than passed on: "auto" is not a body,
   *  and selectPrinterArt only falls back to name matching when the override
   *  is absent. */
  @property({ attribute: "printer-art" })
  public printerArt?: PrinterArtType;

  render(): LitTemplateResult {
    return html`
      <div class="ac-printercard-printerview" @click=${this._viewClick}>
        <anycubic-printercard-animated_printer
          .hass=${this.hass}
          .scaleFactor=${this.scaleFactor}
          .printerEntities=${this.printerEntities}
          .printerEntityIdPart=${this.printerEntityIdPart}
          .printerConfig=${printerConfigAnycubic}
          .cameraEntityId=${this.cameraEntityId}
          .printerArt=${this.printerArt === PrinterArtType.Auto
            ? undefined
            : (this.printerArt as PrinterArtKind | undefined)}
        ></anycubic-printercard-animated_printer>
      </div>
    `;
  }

  private _viewClick = (): void => {
    if (this.toggleVideo) {
      this.toggleVideo();
    }
  };

  static get styles(): CSSResult {
    return css`
      :host {
        box-sizing: border-box;
        width: 100%;
      }

      .ac-printercard-printerview {
        height: 100%;
        box-sizing: border-box;
      }
    `;
  }
}
