/**
 * Simple in-app logger that captures logs and stores them
 * so you can view them on your phone during development.
 *
 * Usage:
 *   import Logger from "../utils/logger";
 *   Logger.log("Something happened", data);
 *   Logger.error("Something broke", error);
 *   Logger.warn("Heads up");
 *
 * View logs by going to the Developer screen in the app.
 */

const MAX_LOGS = 200;

const LOG_LEVELS = {
  LOG: { label: "LOG", color: "#4A90D9" },
  WARN: { label: "WARN", color: "#F5A623" },
  ERROR: { label: "ERROR", color: "#E8596E" },
};

let logs = [];
let listeners = [];

const Logger = {
  /** Capture a log entry */
  _add(level, ...args) {
    const entry = {
      id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
      level,
      label: LOG_LEVELS[level].label,
      color: LOG_LEVELS[level].color,
      message: args
        .map((a) => {
          try {
            return typeof a === "object" ? JSON.stringify(a, null, 2) : String(a);
          } catch {
            return String(a);
          }
        })
        .join(" "),
      timestamp: new Date().toISOString(),
    };

    logs.push(entry);

    // Keep only the last MAX_LOGS
    if (logs.length > MAX_LOGS) {
      logs = logs.slice(logs.length - MAX_LOGS);
    }

    // Notify listeners
    listeners.forEach((fn) => fn(entry));
  },

  log(...args) {
    this._add("LOG", ...args);
  },

  warn(...args) {
    this._add("WARN", ...args);
  },

  error(...args) {
    this._add("ERROR", ...args);
  },

  /** Get all captured logs */
  getLogs() {
    return [...logs];
  },

  /** Clear all logs */
  clear() {
    logs = [];
    listeners.forEach((fn) => fn(null));
  },

  /** Subscribe to new log entries */
  subscribe(fn) {
    listeners.push(fn);
    return () => {
      listeners = listeners.filter((f) => f !== fn);
    };
  },
};

// Override console.log/warn/error to also capture in our logger
const originalLog = console.log;
const originalWarn = console.warn;
const originalError = console.error;

console.log = (...args) => {
  originalLog(...args);
  Logger._add("LOG", ...args);
};

console.warn = (...args) => {
  originalWarn(...args);
  Logger._add("WARN", ...args);
};

console.error = (...args) => {
  originalError(...args);
  Logger._add("ERROR", ...args);
};

export default Logger;
