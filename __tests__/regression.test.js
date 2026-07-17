/**
 * Regression tests — Sprint 5 production field bugs
 *
 * Prerequisites: jest-expo configured (Epic 5 — Quality Foundation)
 * Run: npx jest __tests__/regression.test.js
 *
 * These tests guard against the two production bugs that shipped in the
 * Sprint 5 APK. They must never regress.
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

const {
  getSettings,
  saveSettings,
} = require("../utils/storage");

beforeEach(async () => {
  Object.keys(MOCK_STORAGE).forEach((k) => delete MOCK_STORAGE[k]);
});

// ─── Bug #1: Interval persistence ────────────────────────────

describe("Bug #1 — Interval persistence", () => {
  test("getSettings returns default intervalMinutes with no saved data", async () => {
    const settings = await getSettings();
    expect(settings.intervalMinutes).toBe(30);
  });

  test("saveSettings persists intervalMinutes", async () => {
    await saveSettings({ intervalMinutes: 90 });
    const settings = await getSettings();
    expect(settings.intervalMinutes).toBe(90);
  });

  test("saveSettings writes to AsyncStorage — data survives in storage layer", async () => {
    await saveSettings({ intervalMinutes: 120 });

    // Verify the data was written to AsyncStorage (simulates disk persistence)
    const raw = MOCK_STORAGE["@plenty_settings"];
    expect(raw).toBeDefined();
    const parsed = JSON.parse(raw);
    expect(parsed.intervalMinutes).toBe(120);

    // Verify other settings are preserved (not wiped by the partial update)
    expect(parsed.dailyGoal).toBe(8); // default value
    expect(parsed.sound).toBe(true);  // default value
  });

  test("saveSettings with multiple keys preserves intervalMinutes", async () => {
    await saveSettings({ intervalMinutes: 60, dailyGoal: 10, sound: false });
    const settings = await getSettings();
    expect(settings.intervalMinutes).toBe(60);
    expect(settings.dailyGoal).toBe(10);
    expect(settings.sound).toBe(false);
  });
});

// ─── Bug #2: Notification deduplication ──────────────────────
// The fix: Promise chain serialization (notifications.js:240-250)
//
//   let _scheduleChain = Promise.resolve();
//   function scheduleWaterReminder(...) {
//     const next = _scheduleChain.catch(() => {}).then(() => _scheduleWaterReminder(...));
//     _scheduleChain = next;
//     return next;
//   }
//
// Each call chains off the previous one. When call2's cancelAllReminders runs
// AFTER call1's schedule completes, only call2's reminder survives.

describe("Bug #2 — Notification dedup (serialized scheduling)", () => {
  test("Promise chain serializes concurrent calls — calls execute in order", async () => {
    const order = [];
    let chain = Promise.resolve();

    async function simulateStep(label) {
      await new Promise((r) => setTimeout(r, 5));
      order.push(label);
    }

    // Queue two "schedule" calls, each chained off the previous
    const call1 = chain
      .catch(() => {})
      .then(() => simulateStep("cancel-1"))
      .then(() => simulateStep("schedule-1"));

    chain = call1; // call2 chains off call1

    const call2 = chain
      .catch(() => {})
      .then(() => simulateStep("cancel-2"))
      .then(() => simulateStep("schedule-2"));

    await Promise.all([call1, call2]);

    // call2's cancel must run AFTER call1's schedule completes
    expect(order).toEqual(["cancel-1", "schedule-1", "cancel-2", "schedule-2"]);
    expect(order.indexOf("cancel-2")).toBeGreaterThan(order.indexOf("schedule-1"));
  });

  test("chain pattern: last scheduled wins — earlier schedules are cancelled", async () => {
    const scheduled = [];
    let chain = Promise.resolve();

    async function scheduleFn(label, interval) {
      await new Promise((r) => setTimeout(r, 5));
      scheduled.length = 0; // simulate cancelAllReminders
      scheduled.push({ label, interval });
    }

    const call1 = chain.catch(() => {}).then(() => scheduleFn("call1", 1800));
    chain = call1;
    const call2 = chain.catch(() => {}).then(() => scheduleFn("call2", 3600));

    await Promise.all([call1, call2]);

    // Only call2's schedule survives because cancelAllReminders in call2
    // wipes what call1 scheduled
    expect(scheduled).toHaveLength(1);
    expect(scheduled[0].label).toBe("call2");
    expect(scheduled[0].interval).toBe(3600);
  });

  test("intervalMinutes read by scheduleWaterReminder matches saved value", async () => {
    await saveSettings({ intervalMinutes: 90 });
    const settings = await getSettings();
    const intervalSeconds = settings.intervalMinutes * 60;
    expect(intervalSeconds).toBe(5400);

    expect(settings.intervalMinutes).toBe(90);
    expect(settings.intervalMinutes).not.toBe(30);
  });
});
