import { AnimatedPrinterConfig } from "../../../types";

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
