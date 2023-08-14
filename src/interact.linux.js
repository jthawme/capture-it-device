import GPIO from "rpi-gpio";
import { clamp, mapRange, timeout } from "./utils.js";
import { ButtonManager } from "./ButtonManager.js";

const gpio = GPIO.promise;

const PIN = {
  ERROR: 7,
  STATIC_IMAGE: 11,
  TIMELAPSE: 13,
  STATUS: 12,
};

const manager = new ButtonManager();

export const initialize = () => {
  return Promise.all([
    gpio.setup(PIN.ERROR, gpio.DIR_OUT),
    gpio.setup(PIN.STATUS, gpio.DIR_OUT),
    gpio.setup(PIN.STATIC_IMAGE, gpio.DIR_IN, gpio.EDGE_BOTH),
    gpio.setup(PIN.TIMELAPSE, gpio.DIR_IN, gpio.EDGE_BOTH),
  ]);
};

export const turnOn = (pin) => {
  return gpio.write(pin, true).then(() => {
    return () => gpio.write(pin, false);
  });
};

export const displayError = (msg) => {
  return turnOn(PIN.ERROR);
};

export const blink = ({ pin = PIN.STATUS, interval = 250 } = {}) => {
  let timer;

  const next = async (on = true) => {
    await gpio.write(pin, on);
    timer = setTimeout(() => {
      next(!on);
    }, interval);
  };

  next();

  return () => {
    clearTimeout(timer);
    return gpio.write(pin, false);
  };
};

export const listenForInput = (onEvent) => {
  gpio.on("change", (channel, value) => {
    manager.update(channel, value);
  });

  manager
    .on("long_press", (pin, time) => {
      if (pin === PIN.STATIC_IMAGE) {
        onEvent(
          "image",
          clamp(mapRange(time, 0, 3000, 1000, 6000), 1000, 6000)
        );
      }

      if (pin === PIN.TIMELAPSE) {
        onEvent("timelapse", clamp(mapRange(time, 0, 3000, 20, 120), 20, 120));
      }
    })
    .on("click", (pin) => {
      if (pin === PIN.STATIC_IMAGE) {
        onEvent("image");
      }

      if (pin === PIN.TIMELAPSE) {
        onEvent("timelapse");
      }
    });
};

export const destroy = () => {
  return Promise.all([
    gpio.destroy(PIN.ERROR),
    gpio.destroy(PIN.STATIC_IMAGE),
    gpio.destroy(PIN.TIMELAPSE),
  ]);
};
