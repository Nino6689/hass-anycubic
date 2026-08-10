import {
  AnimatedPrinterBasicDimension,
  AnimatedPrinterConfig,
  AnimatedPrinterDimensions,
} from "../../../types";

class Scale {
  scale_factor: number;

  constructor(scale_factor: number) {
    this.scale_factor = scale_factor;
  }

  val(value): number {
    return this.scale_factor * value;
  }

  og(value): number {
    return value / this.scale_factor;
  }

  scaleFactor(): number {
    return this.scale_factor;
  }
}

export const printerConfigAnycubic: AnimatedPrinterConfig = {
  top: {
    width: 340,
    height: 20,
  },
  bottom: {
    width: 340,
    height: 52.3,
  },
  left: {
    width: 30,
    height: 400,
  },
  right: {
    width: 30,
    height: 380,
  },

  buildplate: {
    maxWidth: 250,
    maxHeight: 260,
    verticalOffset: 55,
  },

  xAxis: {
    stepper: true,
    width: 400,
    offsetLeft: -30,
    height: 30,
    extruder: {
      width: 60,
      height: 100,
    },
  },
};
