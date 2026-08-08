import { CSSResult, LitElement, PropertyValues, css, html } from "lit";
import { property, state } from "lit/decorators.js";

import { customElementIfUndef } from "../../../internal/register-custom-element";

import { calculateTimeStat, getEntityTotalSeconds } from "../../../helpers";
import {
  CalculatedTimeType,
  HassEntity,
  LitTemplateResult,
} from "../../../types";

import "./stat_line.ts";

@customElementIfUndef("anycubic-printercard-stat-time")
export class AnycubicPrintercardStatTime extends LitElement {
  @property({ attribute: "time-entity" })
  public timeEntity: HassEntity;

  @property({ attribute: "time-type" })
  public timeType: CalculatedTimeType;

  @property({ type: String })
  public name: string;

  @property({ type: Number })
  public direction: number;

  @property({ type: Boolean })
  public round?: boolean;

  @property({ type: Boolean })
  public use_24hr?: boolean;

  @property({ attribute: "is-seconds", type: Boolean })
  public isSeconds?: boolean;

  /** Whether the printer is actually working on the job.
   *
   * These clocks run themselves between updates from the printer, so without
   * this the elapsed time carries on climbing long after a print has finished
   * and the reading drifts away from what the printer reported.
   */
  @property({ type: Boolean })
  public running: boolean = false;

  @state()
  private currentTime: number | string | undefined = 0;

  @state()
  private lastIntervalId: number = -1;

  protected override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties);

    if (!changedProperties.has("timeEntity")) {
      return;
    }

    if (this.lastIntervalId !== -1) {
      clearInterval(this.lastIntervalId);
    }

    this.currentTime = getEntityTotalSeconds(this.timeEntity);

    this.lastIntervalId = setInterval(() => {
      this._incTime();
    }, 1000);
  }

  public connectedCallback(): void {
    super.connectedCallback();
    if (this.lastIntervalId === -1) {
      this.lastIntervalId = setInterval(() => {
        this._incTime();
      }, 1000);
    }
  }

  public disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this.lastIntervalId !== -1) {
      clearInterval(this.lastIntervalId);
      this.lastIntervalId = -1;
    }
  }

  render(): LitTemplateResult {
    return html`<anycubic-printercard-stat-line
      .name=${this.name}
      .value=${calculateTimeStat(
        this.currentTime,
        this.timeType,
        this.round,
        this.use_24hr,
      )}
    ></anycubic-printercard-stat-line>`;
  }

  private _incTime(): void {
    if (!this.running) {
      return;
    }
    if (
      this.currentTime === 0 ||
      (this.currentTime && !isNaN(this.currentTime as number))
    ) {
      const next = Number(this.currentTime) + this.direction;
      // A countdown that runs past zero starts reporting nonsense; hold there
      // until the printer says otherwise.
      this.currentTime = next < 0 ? 0 : next;
    }
  }

  static get styles(): CSSResult {
    return css`
      :host {
        box-sizing: border-box;
        width: 100%;
      }
    `;
  }
}
