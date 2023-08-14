import EventEmitter from "events";

export class ButtonManager extends EventEmitter {
  constructor({ clickTime = 100, debounce = 50 } = {}) {
    super();

    this._clickTime = clickTime;
    this._debounce = debounce;

    this._records = {};
  }

  update(pin, value) {
    const oldValue = {
      ...(this._records[pin] || { value: false, timestamp: 0 }),
    };

    const newValue = {
      value,
      timestamp: Date.now(),
    };

    if (!oldValue.value && newValue.value) {
      this.emit("press", pin);
    }

    if (oldValue.value && !newValue.value) {
      this.emit("release", pin);

      const diff = newValue.timestamp - oldValue.timestamp;

      if (diff < this._clickTime) {
        this.emit("click", pin);
      } else {
        this.emit("long_press", pin, diff - this._clickTime);
      }
    }

    this._records[pin] = { ...newValue };
  }
}
