const EventEmitter = require("events");

class AppEvents extends EventEmitter {
  constructor({ logger } = {}) {
    super();
    this.logger = logger || null;

    this.setMaxListeners(50);
  }

  emit(eventName, payload) {
    try {
      this.logger?.info?.(`[event] ${eventName}`);
    } catch (_) {}

    return super.emit(eventName, payload);
  }

  onEvent(eventName, handler) {
    this.on(eventName, handler);
    return () => this.off(eventName, handler);
  }

  onceEvent(eventName, handler) {
    this.once(eventName, handler);
    return () => this.off(eventName, handler);
  }

  offEvent(eventName, handler) {
    this.off(eventName, handler);
  }
}

module.exports = { AppEvents };
