import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  getStreakData,
  useFreeze,
  checkMissedDay,
  invalidateStreakCache,
} from "../utils/storage";

// ─── In-memory mock ─────────────────────────────────
const MOCK = {};
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(async (key) => MOCK[key] ?? null),
  setItem: jest.fn(async (key, value) => { MOCK[key] = value; }),
  removeItem: jest.fn(async (key) => { delete MOCK[key]; }),
  clear: jest.fn(async () => { Object.keys(MOCK).forEach(k => delete MOCK[k]); }),
}));

async function resetStorage() {
  Object.keys(MOCK).forEach(k => delete MOCK[k]);
}

function makeDayLog(dayOffset, amount) {
  if (amount === undefined) amount = 250;
  const entryCount = Math.ceil(amount / 250);
  return Array.from({ length: entryCount }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + dayOffset);
    d.setHours(8 + i);
    return {
      id: `log-${dayOffset}-${i}`,
      timestamp: d.toISOString(),
      amount: i === entryCount - 1 ? amount - i * 250 : 250,
    };
  });
}

async function seedLogs(dayEntries) {
  for (const entry of dayEntries) {
    const existing = JSON.parse(MOCK["@plenty_logs"] || "[]");
    MOCK["@plenty_logs"] = JSON.stringify([...existing, ...entry]);
  }
}

describe("Streak Freeze", () => {
  const GOAL = 8;

  beforeEach(async () => {
    await resetStorage();
  });

  async function addHitDay(offset) {
    await seedLogs([makeDayLog(offset, GOAL * 250)]);
  }

  async function addMissedDay(offset) {
    await seedLogs([makeDayLog(offset, (GOAL - 3) * 250)]);
  }

  describe("useFreeze", () => {
    it("returns false when no streak cache exists", async () => {
      const result = await useFreeze("2026-07-16");
      expect(result).toBe(false);
    });

    it("returns false when no freezes available", async () => {
      // Create initial streak cache
      await addHitDay(-1);
      const data = await getStreakData(GOAL);

      // Use all freezes by hacking the cache
      const raw = JSON.parse(MOCK["@plenty_streak"]);
      raw.freezesAvailable = 0;
      MOCK["@plenty_streak"] = JSON.stringify(raw);

      const result = await useFreeze("2026-07-16");
      expect(result).toBe(false);
    });

    it("adds a frozen day and decrements freezes", async () => {
      await addMissedDay(-1);
      // Initialize cache first
      await getStreakData(GOAL);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;

      const result = await useFreeze(yesterdayStr);
      expect(result).toBe(true);

      // Reload to get fresh data
      const data = await getStreakData(GOAL);
      expect(data.frozenDays).toContain(yesterdayStr);
      expect(data.freezesAvailable).toBe(0);
    });
  });

  describe("Streak continuity with freeze", () => {
    it("preserves streak when frozen day exists", async () => {
      await addHitDay(-4);
      await addHitDay(-3);
      await addMissedDay(-2);
      await addHitDay(-1);

      // Initialize the cache first
      await getStreakData(GOAL);

      // Use freeze on day -2
      const day2 = new Date();
      day2.setDate(day2.getDate() - 2);
      const day2Str = `${day2.getFullYear()}-${String(day2.getMonth() + 1).padStart(2, "0")}-${String(day2.getDate()).padStart(2, "0")}`;
      const frozen = await useFreeze(day2Str);
      expect(frozen).toBe(true);

      // Reload to rebuild cache with frozen day
      const data = await getStreakData(GOAL);
      // Days: -4 (hit) → -3 (hit) → -2 (frozen) → -1 (hit) = 4 consecutive
      expect(data.current).toBe(4);
      expect(data.longest).toBe(4);

      // History should show day -2 as frozen
      const frozenDay = data.history.find((h) => h.date === day2Str);
      expect(frozenDay).toBeDefined();
      expect(frozenDay.goalMet).toBe(false);
      expect(frozenDay.frozen).toBe(true);
    });

    it("does not count frozen days toward milestone progress", async () => {
      // 3 hit days, 1 frozen, 3 hit days
      await addHitDay(-7);
      await addHitDay(-6);
      await addHitDay(-5);
      await addMissedDay(-4);
      await addHitDay(-3);
      await addHitDay(-2);
      await addHitDay(-1);

      // Initialize the cache first
      await getStreakData(GOAL);

      // Use freeze on day -4
      const day4 = new Date();
      day4.setDate(day4.getDate() - 4);
      const day4Str = `${day4.getFullYear()}-${String(day4.getMonth() + 1).padStart(2, "0")}-${String(day4.getDate()).padStart(2, "0")}`;
      const frozen = await useFreeze(day4Str);
      expect(frozen).toBe(true);

      // Reload to rebuild cache with frozen day
      const data = await getStreakData(GOAL);
      // Current streak = 7 consecutive days (freeze preserved continuity)
      expect(data.current).toBe(7);
      // Milestone longest = 3 (only hit-only streaks count, frozen resets it)
      // The "7-day" milestone should NOT be triggered
      expect(data.milestonesReached).not.toContain("dedicated_droplet");
    });
  });

  describe("checkMissedDay", () => {
    it("returns missed=true when yesterday is below goal", async () => {
      await addMissedDay(-1);
      const result = await checkMissedDay();
      expect(result.missed).toBe(true);
      expect(result.freezesAvailable).toBeGreaterThan(0);
    });

    it("returns missed=false when yesterday hit goal", async () => {
      await addHitDay(-1);
      const result = await checkMissedDay();
      expect(result.missed).toBe(false);
    });

    it("returns missed=false when yesterday is frozen", async () => {
      await addMissedDay(-1);
      // Initialize cache first
      await getStreakData(GOAL);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;
      await useFreeze(yesterdayStr);
      // Reload so freeze is reflected
      await getStreakData(GOAL);

      const result = await checkMissedDay();
      expect(result.missed).toBe(false);
    });

    it("returns missed=false when no logs exist", async () => {
      const result = await checkMissedDay();
      expect(result.missed).toBe(false);
    });
  });
});
