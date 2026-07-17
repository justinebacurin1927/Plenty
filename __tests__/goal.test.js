/**
 * @jest-environment jsdom
 *
 * Tests for weight-based goal calculation (pure functions from storage.js).
 * These don't need AsyncStorage mocking at all — they're stateless functions.
 */

const MOCK_STORAGE = {};

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(async (key) => MOCK_STORAGE[key] ?? null),
  setItem: jest.fn(async (key, value) => { MOCK_STORAGE[key] = value; }),
  removeItem: jest.fn(async (key) => { delete MOCK_STORAGE[key]; }),
  clear: jest.fn(async () => { Object.keys(MOCK_STORAGE).forEach((k) => delete MOCK_STORAGE[k]); }),
}));

const {
  weightBasedGoal,
  lbsToKg,
  activityBoostedGoal,
} = require("../utils/storage");

describe("weightBasedGoal", () => {
  it("returns null for null/undefined/zero/negative input", () => {
    expect(weightBasedGoal(null)).toBeNull();
    expect(weightBasedGoal(undefined)).toBeNull();
    expect(weightBasedGoal(0)).toBeNull();
    expect(weightBasedGoal(-10)).toBeNull();
  });

  it("calculates goal from weight correctly", () => {
    // 70kg × 0.033 = 2.31L → 2310ml → 2310/250 = 9.24 → round to 9
    expect(weightBasedGoal(70)).toBe(9);
    // 55kg × 0.033 = 1.815L → 1815ml → 1815/250 = 7.26 → round to 7
    expect(weightBasedGoal(55)).toBe(7);
    // 90kg × 0.033 = 2.97L → 2970ml → 2970/250 = 11.88 → round to 12
    expect(weightBasedGoal(90)).toBe(12);
  });

  it("returns at least 1 for tiny weights", () => {
    expect(weightBasedGoal(1)).toBe(1);
    expect(weightBasedGoal(5)).toBe(1);
  });
});

describe("lbsToKg", () => {
  it("converts pounds to kg correctly", () => {
    expect(lbsToKg(154)).toBeCloseTo(69.85, 1);
    expect(lbsToKg(200)).toBeCloseTo(90.72, 1);
    expect(lbsToKg(0)).toBe(0);
  });
});

describe("activityBoostedGoal", () => {
  it("adds 3 glasses when exercised", () => {
    expect(activityBoostedGoal(8, true)).toBe(11);
    expect(activityBoostedGoal(10, true)).toBe(13);
    expect(activityBoostedGoal(4, true)).toBe(7);
  });

  it("returns base goal when not exercised", () => {
    expect(activityBoostedGoal(8, false)).toBe(8);
    expect(activityBoostedGoal(12, false)).toBe(12);
  });
});
