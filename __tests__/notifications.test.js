/**
 * @jest-environment jsdom
 *
 * Tests for notification pure-logic functions.
 * Functions that require expo-notifications native module are excluded
 * (they're tested via integration tests on device).
 */

const MOCK_STORAGE = {};

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(async (key) => MOCK_STORAGE[key] ?? null),
  setItem: jest.fn(async (key, value) => {
    MOCK_STORAGE[key] = value;
  }),
  removeItem: jest.fn(async (key) => {
    delete MOCK_STORAGE[key];
  }),
  clear: jest.fn(async () => {
    Object.keys(MOCK_STORAGE).forEach((k) => delete MOCK_STORAGE[k]);
  }),
}));

jest.mock("expo-notifications", () => ({}), { virtual: true });
jest.mock("../utils/weather", () => ({
  getCachedWeather: jest.fn(() => Promise.resolve(null)),
  getHeatAdjustedInterval: jest.fn(),
}));
jest.mock("../utils/messages", () => ({
  pickMessage: jest.fn(() => ({ id: "test-1", text: "Time to drink!" })),
}));

beforeEach(async () => {
  Object.keys(MOCK_STORAGE).forEach((k) => delete MOCK_STORAGE[k]);
});

const {
  getEscalationTier,
} = require("../utils/notifications");
const { addLog, getLastLogTime } = require("../utils/storage");

// ─── Escalation ──────────────────────────────────────

describe("getEscalationTier", () => {
  test("returns 'alert' when no logs exist", async () => {
    const tier = await getEscalationTier();
    expect(tier).toBe("alert");
  });

  test("returns 'normal' when recently logged", async () => {
    await addLog({ amount: 250 });
    const tier = await getEscalationTier();
    expect(tier).toBe("normal");
  });

  test("returns 'warning' when last log was >2h ago", async () => {
    const threeHoursAgo = Date.now() - 3 * 3600000;
    MOCK_STORAGE["@plenty_logs"] = JSON.stringify([
      { id: "old", timestamp: new Date(threeHoursAgo).toISOString(), amount: 250 },
    ]);
    const tier = await getEscalationTier();
    expect(tier).toBe("warning");
  });

  test("returns 'alert' when last log was >4h ago", async () => {
    const fiveHoursAgo = Date.now() - 5 * 3600000;
    MOCK_STORAGE["@plenty_logs"] = JSON.stringify([
      { id: "old", timestamp: new Date(fiveHoursAgo).toISOString(), amount: 250 },
    ]);
    const tier = await getEscalationTier();
    expect(tier).toBe("alert");
  });
});

// ─── Schedule chain ──────────────────────────────────

describe("Schedule chain pattern", () => {
  test("Promise chain serializes concurrent calls — calls execute in order", async () => {
    const order = [];
    let chain = Promise.resolve();

    async function simulateStep(label) {
      await new Promise((r) => setTimeout(r, 5));
      order.push(label);
    }

    const call1 = chain
      .catch(() => {})
      .then(() => simulateStep("cancel-1"))
      .then(() => simulateStep("schedule-1"));
    chain = call1;

    const call2 = chain
      .catch(() => {})
      .then(() => simulateStep("cancel-2"))
      .then(() => simulateStep("schedule-2"));

    await Promise.all([call1, call2]);
    expect(order).toEqual(["cancel-1", "schedule-1", "cancel-2", "schedule-2"]);
    expect(order.indexOf("cancel-2")).toBeGreaterThan(order.indexOf("schedule-1"));
  });

  test("chain pattern: last scheduled wins", async () => {
    const scheduled = [];
    let chain = Promise.resolve();

    async function scheduleFn(label) {
      await new Promise((r) => setTimeout(r, 5));
      scheduled.length = 0;
      scheduled.push(label);
    }

    const call1 = chain.catch(() => {}).then(() => scheduleFn("call1"));
    chain = call1;
    const call2 = chain.catch(() => {}).then(() => scheduleFn("call2"));

    await Promise.all([call1, call2]);
    expect(scheduled).toHaveLength(1);
    expect(scheduled[0]).toBe("call2");
  });
});
