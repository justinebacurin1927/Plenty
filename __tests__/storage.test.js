/**
 * @jest-environment jsdom
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

beforeEach(async () => {
  Object.keys(MOCK_STORAGE).forEach((k) => delete MOCK_STORAGE[k]);
});

const {
  getSettings,
  saveSettings,
  weightBasedGoal,
  lbsToKg,
  activityBoostedGoal,
  getLogs,
  addLog,
  getTodayLogs,
  getLastLogTime,
  getStreak,
  getDailyTotals,
  getUnlockedAchievements,
  unlockAchievement,
  getAchievementProgress,
  setAchievementProgress,
  incrementAchievementProgress,
  getThemePreference,
  saveThemePreference,
} = require("../utils/storage");

// ─── Settings ─────────────────────────────────────────

describe("getSettings / saveSettings", () => {
  test("getSettings returns defaults with no saved data", async () => {
    const settings = await getSettings();
    expect(settings.intervalMinutes).toBe(30);
    expect(settings.dailyGoal).toBe(8);
    expect(settings.drinkAmount).toBe(250);
    expect(settings.sound).toBe(true);
    expect(settings.mascotVariant).toBe("classic");
  });

  test("saveSettings persists changes", async () => {
    await saveSettings({ intervalMinutes: 90 });
    const settings = await getSettings();
    expect(settings.intervalMinutes).toBe(90);
  });

  test("saveSettings merges partial updates", async () => {
    await saveSettings({ intervalMinutes: 60, dailyGoal: 10 });
    const settings = await getSettings();
    expect(settings.intervalMinutes).toBe(60);
    expect(settings.dailyGoal).toBe(10);
    expect(settings.drinkAmount).toBe(250); // unchanged default
  });

  test("saveSettings does not clear unmentioned keys", async () => {
    await saveSettings({ intervalMinutes: 120 });
    const settings = await getSettings();
    expect(settings.sound).toBe(true);
    expect(settings.mascotVariant).toBe("classic");
  });

  test("getSettings round-trips — save then read", async () => {
    await saveSettings({ intervalMinutes: 45, dailyGoal: 12, sound: false });
    const settings = await getSettings();
    expect(settings.intervalMinutes).toBe(45);
    expect(settings.dailyGoal).toBe(12);
    expect(settings.sound).toBe(false);
  });
});

// ─── Logs ─────────────────────────────────────────────

describe("Log operations", () => {
  test("getLogs returns empty array with no data", async () => {
    const logs = await getLogs();
    expect(logs).toEqual([]);
  });

  test("addLog stores an entry", async () => {
    const entry = await addLog({ amount: 250 });
    expect(entry.id).toBeDefined();
    expect(entry.timestamp).toBeDefined();
    expect(entry.amount).toBe(250);

    const logs = await getLogs();
    expect(logs).toHaveLength(1);
    expect(logs[0].amount).toBe(250);
  });

  test("getLastLogTime returns null when no logs", async () => {
    const t = await getLastLogTime();
    expect(t).toBeNull();
  });

  test("getLastLogTime returns the most recent log time", async () => {
    await addLog({ amount: 250 });
    const t = await getLastLogTime();
    expect(t).toBeGreaterThan(0);
  });

  test("getTodayLogs filters correctly", async () => {
    // Add a log from yesterday
    const yesterday = new Date(Date.now() - 86400000);
    MOCK_STORAGE["@plenty_logs"] = JSON.stringify([
      { id: "old", timestamp: yesterday.toISOString(), amount: 250 },
    ]);

    const todayLogs = await getTodayLogs();
    expect(todayLogs).toHaveLength(0);

    MOCK_STORAGE["@plenty_logs"] = JSON.stringify([
      { id: "old", timestamp: yesterday.toISOString(), amount: 250 },
      { id: "new", timestamp: new Date().toISOString(), amount: 500 },
    ]);

    const todayLogs2 = await getTodayLogs();
    expect(todayLogs2).toHaveLength(1);
    expect(todayLogs2[0].amount).toBe(500);
  });
});

// ─── Streak ───────────────────────────────────────────

describe("getStreak", () => {
  test("returns 0 with no logs", async () => {
    const s = await getStreak(8);
    expect(s).toBe(0);
  });

  test("returns 1 for one day meeting goal", async () => {
    const logs = [];
    const d = new Date();
    d.setDate(d.getDate() - 1); // yesterday
    for (let i = 0; i < 8; i++) {
      logs.push({ id: `d0-${i}`, timestamp: d.toISOString(), amount: 250 });
    }
    MOCK_STORAGE["@plenty_logs"] = JSON.stringify(logs);
    const s = await getStreak(8);
    expect(s).toBe(1);
  });

  test("counts consecutive days backward", async () => {
    const logs = [];
    const today = new Date();
    for (let day = 1; day <= 3; day++) {
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - day);
      for (let i = 0; i < 8; i++) {
        logs.push({
          id: `d${day}-${i}`,
          timestamp: d.toISOString(),
          amount: 250,
        });
      }
    }
    MOCK_STORAGE["@plenty_logs"] = JSON.stringify(logs);
    const s = await getStreak(8);
    expect(s).toBe(3);
  });

  test("breaks streak when a day is missed", async () => {
    const today = new Date();
    const logs = [];
    // Day -1 (yesterday): 8 glasses ✓
    const d1 = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
    for (let i = 0; i < 8; i++) {
      logs.push({ id: `d1-${i}`, timestamp: d1.toISOString(), amount: 250 });
    }
    // Day -2: skipped (no logs)
    // Day -3: 8 glasses but should not count because day -2 is missing
    // Day -4: 8 glasses but should not count because gap at -2
    const d3 = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 3);
    for (let i = 0; i < 8; i++) {
      logs.push({ id: `d3-${i}`, timestamp: d3.toISOString(), amount: 250 });
    }

    MOCK_STORAGE["@plenty_logs"] = JSON.stringify(logs);
    const s = await getStreak(8);
    expect(s).toBe(1); // only yesterday (today is partial, gap at day -2)
  });
});

// ─── Achievements ─────────────────────────────────────

describe("Achievement storage", () => {
  test("getUnlockedAchievements returns empty array", async () => {
    const u = await getUnlockedAchievements();
    expect(u).toEqual([]);
  });

  test("unlockAchievement is idempotent", async () => {
    await unlockAchievement("first_drop");
    await unlockAchievement("first_drop");
    const u = await getUnlockedAchievements();
    expect(u).toEqual(["first_drop"]);
  });

  test("getAchievementProgress returns empty object", async () => {
    const p = await getAchievementProgress();
    expect(p).toEqual({});
  });

  test("setAchievementProgress stores correctly", async () => {
    await setAchievementProgress("marathon", 15);
    const p = await getAchievementProgress();
    expect(p.marathon).toBe(15);
  });

  test("incrementAchievementProgress increments from 0", async () => {
    const val = await incrementAchievementProgress("speed_demon");
    expect(val).toBe(1);
    const val2 = await incrementAchievementProgress("speed_demon");
    expect(val2).toBe(2);
  });
});

// ─── Goal Intelligence ────────────────────────────────

describe("Goal intelligence helpers", () => {
  test("weightBasedGoal returns null for invalid input", () => {
    expect(weightBasedGoal(null)).toBeNull();
    expect(weightBasedGoal(0)).toBeNull();
    expect(weightBasedGoal(-5)).toBeNull();
  });

  test("weightBasedGoal calculates correctly", () => {
    // 70kg * 0.033 = 2.31L = 2310ml → 2310/250 = 9.24 → round to 9
    const goal = weightBasedGoal(70);
    expect(goal).toBe(9);
  });

  test("weightBasedGoal returns at least 1", () => {
    const goal = weightBasedGoal(1);
    expect(goal).toBe(1);
  });

  test("lbsToKg converts correctly", () => {
    const kg = lbsToKg(154);
    expect(kg).toBeCloseTo(69.85, 1);
  });

  test("activityBoostedGoal adds 3 glasses when exercised", () => {
    expect(activityBoostedGoal(8, true)).toBe(11);
  });

  test("activityBoostedGoal returns baseGoal when not exercised", () => {
    expect(activityBoostedGoal(8, false)).toBe(8);
  });
});

// ─── Theme Preference ─────────────────────────────────

describe("Theme preference", () => {
  test("getThemePreference returns 'auto' default", async () => {
    const pref = await getThemePreference();
    expect(pref).toBe("auto");
  });

  test("saveThemePreference persists", async () => {
    await saveThemePreference("dark");
    const pref = await getThemePreference();
    expect(pref).toBe("dark");
  });
});
