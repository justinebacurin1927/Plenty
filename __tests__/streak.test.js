import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  getStreakData,
  getStreak,
  invalidateStreakCache,
} from "../utils/storage";

// ─── In-memory mock ─────────────────────────────────
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

async function resetStorage() {
  Object.keys(MOCK_STORAGE).forEach((k) => delete MOCK_STORAGE[k]);
}

// ─── Helpers ────────────────────────────────────────

function makeDayLog(dayOffset, amount) {
  if (amount === undefined) amount = 250;
  const entryCount = Math.ceil(amount / 250);
  return Array.from({ length: entryCount }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + dayOffset);
    d.setHours(8 + i); // 08:00, 09:00, 10:00... never overflows
    return {
      id: `log-${dayOffset}-${i}`,
      timestamp: d.toISOString(),
      amount: i === entryCount - 1 ? amount - i * 250 : 250,
    };
  });
}

async function seedLogs(dayEntries, _goal) {
  for (const entry of dayEntries) {
    const existing = JSON.parse(MOCK_STORAGE["@plenty_logs"] || "[]");
    MOCK_STORAGE["@plenty_logs"] = JSON.stringify([...existing, ...entry]);
  }
}

// ─── Tests ──────────────────────────────────────────

describe("Streak Engine", () => {
  const GOAL = 8;

  beforeEach(async () => {
    await resetStorage();
  });

  async function addDays(count, hitGoal = true) {
    const allLogs = [];
    for (let i = count; i > 0; i--) {
      const amount = hitGoal ? GOAL * 250 : (GOAL - 2) * 250;
      allLogs.push(makeDayLog(-i, amount));
    }
    await seedLogs(allLogs, GOAL);
  }

  describe("getStreakData", () => {
    it("returns empty streak when no logs exist", async () => {
      const data = await getStreakData(GOAL);
      expect(data.current).toBe(0);
      expect(data.longest).toBe(0);
      expect(data.history).toEqual([]);
      expect(data.freezesAvailable).toBe(1);
      expect(data.milestonesReached).toEqual([]);
    });

    it("returns current=1 when yesterday hit goal", async () => {
      await addDays(1, true);
      const data = await getStreakData(GOAL);
      expect(data.current).toBe(1);
      expect(data.longest).toBe(1);
    });

    it("returns current=5 for 5 consecutive days", async () => {
      await addDays(5, true);
      const data = await getStreakData(GOAL);
      expect(data.current).toBe(5);
      expect(data.longest).toBe(5);
    });

    it("breaks streak when a day misses the goal", async () => {
      const good = GOAL * 250;
      const bad = (GOAL - 2) * 250;

      const allLogs = [
        makeDayLog(-5, good),
        makeDayLog(-4, good),
        makeDayLog(-3, good),
        makeDayLog(-2, bad),
        makeDayLog(-1, good),
      ];
      await seedLogs(allLogs, GOAL);
      const data = await getStreakData(GOAL);
      expect(data.current).toBe(1);
      expect(data.longest).toBe(3);
    });

    it("tracks history entries correctly", async () => {
      await addDays(3, true);
      const data = await getStreakData(GOAL);
      expect(data.history.length).toBeGreaterThanOrEqual(3);
      expect(data.history[0].goalMet).toBe(true);
      expect(data.history[0]).toHaveProperty("date");
      expect(data.history[0]).toHaveProperty("goalMet");
      expect(data.history[0]).toHaveProperty("totalMl");
    });

    it("marks goalMet=false when day falls short", async () => {
      await seedLogs([makeDayLog(-1, (GOAL - 3) * 250)], GOAL);
      const data = await getStreakData(GOAL);
      expect(data.history[0].goalMet).toBe(false);
      expect(data.current).toBe(0);
    });
  });

  describe("getStreak (backward compat)", () => {
    it("returns 0 for no logs", async () => {
      const s = await getStreak(GOAL);
      expect(s).toBe(0);
    });

    it("returns same value as getStreakData().current", async () => {
      await addDays(4, true);
      const [streak, data] = await Promise.all([
        getStreak(GOAL),
        getStreakData(GOAL),
      ]);
      expect(streak).toBe(data.current);
      expect(streak).toBe(4);
    });
  });

  describe("Freeze behavior", () => {
    it("starts with 1 freeze available", async () => {
      const data = await getStreakData(GOAL);
      expect(data.freezesAvailable).toBe(1);
    });
  });

  describe("Data persistence", () => {
    it("caches streak data in AsyncStorage", async () => {
      await addDays(3, true);
      await getStreakData(GOAL);
      const raw = await AsyncStorage.getItem("@plenty_streak");
      expect(raw).not.toBeNull();
      const parsed = JSON.parse(raw);
      expect(parsed.current).toBe(3);
    });

    it("returns cached data on subsequent calls", async () => {
      await addDays(2, true);
      const data1 = await getStreakData(GOAL);
      const data2 = await getStreakData(GOAL);
      expect(data2.current).toBe(data1.current);
    });
  });

  describe("invalidateStreakCache", () => {
    it("removes cached streak data", async () => {
      await addDays(2, true);
      await getStreakData(GOAL);

      await invalidateStreakCache();
      const raw = await AsyncStorage.getItem("@plenty_streak");
      expect(raw).toBeNull();
    });
  });
});
