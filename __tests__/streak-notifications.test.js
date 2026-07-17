/**
 * @jest-environment jsdom
 *
 * Tests for streak-aware notification messages and milestone celebrations.
 * Covers pickMessage with streak param, pickMilestoneMessage, and milestone gating.
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

jest.mock("expo-notifications", () => ({
  scheduleNotificationAsync: jest.fn(() => Promise.resolve("mock-id")),
  setNotificationChannelAsync: jest.fn(),
  setNotificationHandler: jest.fn(),
  setNotificationCategoryAsync: jest.fn(),
  getAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve([])),
  cancelAllScheduledNotificationsAsync: jest.fn(),
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: "granted" })),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: "granted" })),
  AndroidImportance: { HIGH: 4 },
}), { virtual: true });
jest.mock("../utils/weather", () => ({
  getCachedWeather: jest.fn(() => Promise.resolve(null)),
  getHeatAdjustedInterval: jest.fn(),
}));

// Mock storage with controlled streak data
jest.mock("../utils/storage", () => {
  const actual = jest.requireActual("../utils/storage");
  return {
    ...actual,
    getStreakData: jest.fn(),
    getSettings: jest.fn(),
    getTodayLogs: jest.fn(),
    saveSettings: jest.fn(),
  };
});

const { pickMessage, pickMilestoneMessage, getAvailableCategories } = require("../utils/messages");
const { getStreakData, getSettings, getTodayLogs, saveSettings } = require("../utils/storage");
const { scheduleMilestoneCelebration } = require("../utils/notifications");

beforeEach(() => {
  jest.clearAllMocks();
  // Clear milestone tracking between tests to prevent cross-test pollution
  delete MOCK_STORAGE["@plenty_milestones"];
});

// ─── pickMessage with streak parameter ─────────────────

describe("pickMessage with streak parameter", () => {
  const defaultOpts = {
    hour: 14, // afternoon — no time skew
    goalProgress: 0,
    goalGlassesLeft: 8,
    enabledCategories: ["encouraging", "funny", "urgent", "fact"],
    lastMessageId: null,
  };

  test("returns a streak-aware message when streak >= 3", () => {
    const result = pickMessage({ ...defaultOpts, streak: 3 });
    expect(result.text).toMatch(/streak/i);
    expect(result.text).toContain("3");
    expect(result.categories).toContain("streak-short");
  });

  test("returns a streak-established message when streak >= 7", () => {
    const result = pickMessage({ ...defaultOpts, streak: 7 });
    expect(result.text).toMatch(/streak/i);
    expect(result.text).toContain("7");
    expect(result.categories).toContain("streak-established");
  });

  test("returns a streak-long message when streak >= 30", () => {
    const result = pickMessage({ ...defaultOpts, streak: 30 });
    expect(result.text).toMatch(/streak/i);
    expect(result.text).toContain("30");
    expect(result.categories).toContain("streak-long");
  });

  test("streak=6 is upper bound of short tier", () => {
    const result = pickMessage({ ...defaultOpts, streak: 6 });
    expect(result.text).toMatch(/streak/i);
    expect(result.text).toContain("6");
    expect(result.categories).toContain("streak-short");
  });

  test("streak=29 is upper bound of established tier", () => {
    const result = pickMessage({ ...defaultOpts, streak: 29 });
    expect(result.text).toMatch(/streak/i);
    expect(result.text).toContain("29");
    expect(result.categories).toContain("streak-established");
  });

  test("returns normal messages when streak is 1-2 (unchanged)", () => {
    const result1 = pickMessage({ ...defaultOpts, streak: 1 });
    // streak < 3 should not activate streak tier — check categories, not text,
    // because pre-existing message e1 "Keep the streak alive!" contains "streak"
    // but is NOT a streak-category message
    const result2 = pickMessage({ ...defaultOpts, streak: 2 });
    expect(result1.categories).not.toContain("streak");
    expect(result2.categories).not.toContain("streak");
  });

  test("returns normal messages when streak is 0", () => {
    const result = pickMessage({ ...defaultOpts, streak: 0 });
    expect(result.categories).not.toContain("streak");
  });

  test("streak-aware messages include {streak} placeholder replaced with actual count", () => {
    const result = pickMessage({ ...defaultOpts, streak: 5 });
    expect(result.text).toContain("5");
    expect(result.text).not.toMatch(/\{streak\}/);
  });

  test("goal-proximity messages still take priority over streak messages", () => {
    // goalProgress >= 80 should return goal-proximity, not streak
    const result = pickMessage({
      ...defaultOpts,
      streak: 10,
      goalProgress: 85,
      goalGlassesLeft: 1,
    });
    // Goal proximity messages mention "almost" or "close" or "stretch"
    expect(result.text).not.toMatch(/streak/i);
    expect(result.categories).toContain("goal-proximity");
  });

  test("time-of-day morning messages still work alongside streak", () => {
    const result = pickMessage({
      ...defaultOpts,
      hour: 9, // morning
      streak: 5,
      enabledCategories: ["encouraging", "funny", "fact", "morning"],
    });
    // Should contain morning or streak message (time-skewing keeps morning messages
    // alongside streak-tier messages in the candidate pool)
    expect(result).toBeDefined();
    expect(result.text).toBeTruthy();
    expect(
      result.categories.includes("morning") || result.categories.includes("streak")
    ).toBe(true);
  });

  test("time-of-day evening messages still work alongside streak", () => {
    const result = pickMessage({
      ...defaultOpts,
      hour: 21, // evening
      streak: 5,
      enabledCategories: ["encouraging", "funny", "fact", "evening"],
    });
    expect(result).toBeDefined();
    expect(result.text).toBeTruthy();
    expect(
      result.categories.includes("evening") || result.categories.includes("streak")
    ).toBe(true);
  });

  test("handles null or undefined streak gracefully", () => {
    const result1 = pickMessage({ ...defaultOpts, streak: null });
    const result2 = pickMessage({ ...defaultOpts, streak: undefined });
    const result3 = pickMessage(defaultOpts); // no streak key
    // All should fall back to default (streak=0) → no streak categories
    expect(result1.categories).not.toContain("streak");
    expect(result2.categories).not.toContain("streak");
    expect(result3.categories).not.toContain("streak");
  });
});

// ─── pickMilestoneMessage ──────────────────────────────

describe("pickMilestoneMessage", () => {
  test("returns celebration content for streak=7", () => {
    const result = pickMilestoneMessage(7);
    expect(result).not.toBeNull();
    expect(result.text).toMatch(/7/);
    expect(result.text).toMatch(/day|week|streak/i);
    expect(result.type).toBe("milestone");
  });

  test("returns celebration content for streak=30", () => {
    const result = pickMilestoneMessage(30);
    expect(result).not.toBeNull();
    expect(result.text).toMatch(/30/);
    expect(result.text).toMatch(/day|month|streak/i);
    expect(result.type).toBe("milestone");
  });

  test("returns null for non-milestone streaks (1, 8, 31)", () => {
    expect(pickMilestoneMessage(1)).toBeNull();
    expect(pickMilestoneMessage(8)).toBeNull();
    expect(pickMilestoneMessage(31)).toBeNull();
  });

  test("returns null for negative or zero streak", () => {
    expect(pickMilestoneMessage(0)).toBeNull();
    expect(pickMilestoneMessage(-5)).toBeNull();
  });

  test("returns null for null/undefined streak", () => {
    expect(pickMilestoneMessage(null)).toBeNull();
    expect(pickMilestoneMessage(undefined)).toBeNull();
  });
});

// ─── Milestone celebration gating ─────────────────────

describe("scheduleMilestoneCelebration gating", () => {
  test("celebrates when currentStreak reaches 7 and not yet celebrated", async () => {
    getStreakData.mockResolvedValue({ current: 7 });
    getSettings.mockResolvedValue({ dailyGoal: 8 });

    const result = await scheduleMilestoneCelebration();
    expect(result).toBe(7);
  });

  test("does not celebrate when milestone 7 was already celebrated", async () => {
    // First call celebrates 7
    getStreakData.mockResolvedValue({ current: 7 });
    getSettings.mockResolvedValue({ dailyGoal: 8 });
    await scheduleMilestoneCelebration();

    // Second call — milestone already recorded
    getStreakData.mockResolvedValue({ current: 7 });
    getSettings.mockResolvedValue({ dailyGoal: 8 });
    const result = await scheduleMilestoneCelebration();
    expect(result).toBeNull();
  });

  test("celebrates when currentStreak reaches 30 (after 7 already celebrated)", async () => {
    // Pre-populate 7 as already celebrated
    MOCK_STORAGE["@plenty_milestones"] = JSON.stringify([7]);

    getStreakData.mockResolvedValue({ current: 30 });
    getSettings.mockResolvedValue({ dailyGoal: 8 });

    const result = await scheduleMilestoneCelebration();
    expect(result).toBe(30);
  });

  test("does not celebrate for non-milestone streak values", async () => {
    getStreakData.mockResolvedValue({ current: 10 });
    getSettings.mockResolvedValue({ dailyGoal: 8 });

    const result = await scheduleMilestoneCelebration();
    expect(result).toBeNull();
  });

  test("does not celebrate milestone 30 twice", async () => {
    // Pre-populate 30 as already celebrated
    MOCK_STORAGE["@plenty_milestones"] = JSON.stringify([30]);

    getStreakData.mockResolvedValue({ current: 30 });
    getSettings.mockResolvedValue({ dailyGoal: 8 });

    const result = await scheduleMilestoneCelebration();
    expect(result).toBeNull();
  });
});

// ─── getAvailableCategories unaffected ─────────────────

describe("getAvailableCategories still works", () => {
  test("excludes streak sub-categories from returned categories", () => {
    const cats = getAvailableCategories();
    // Should include existing categories
    expect(cats).toContain("encouraging");
    expect(cats).toContain("funny");
    expect(cats).toContain("fact");
    // Streak is not a user-togglable category (like goal-proximity)
    expect(cats).not.toContain("streak-short");
    expect(cats).not.toContain("streak");
  });
});
