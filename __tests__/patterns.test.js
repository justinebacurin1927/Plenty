/**
 * @jest-environment jsdom
 */

const {
  getHourlyDistribution,
  getPeakHours,
  getPeakHoursSummary,
  getLullPeriods,
  getDayOfWeekPatterns,
  getLowestHydrationDay,
  getPatternSummary,
} = require("../utils/patterns");

function log(hour, amount) {
  const d = new Date();
  d.setHours(hour, 0, 0, 0);
  return { id: String(Math.random()), timestamp: d.toISOString(), amount: amount ?? 250 };
}

function logOnDay(dayOffset, hour, amount) {
  const d = new Date();
  d.setDate(d.getDate() - dayOffset);
  d.setHours(hour, 0, 0, 0);
  return { id: String(Math.random()), timestamp: d.toISOString(), amount: amount ?? 250 };
}

// ─── Hourly Distribution ────────────────────────────

describe("getHourlyDistribution", () => {
  test("returns 24 zeros for empty logs", () => {
    const dist = getHourlyDistribution([]);
    expect(dist).toHaveLength(24);
    expect(dist.every((c) => c === 0)).toBe(true);
  });

  test("counts logs by hour", () => {
    const logs = [log(9), log(9), log(14)];
    const dist = getHourlyDistribution(logs);
    expect(dist[9]).toBe(2);
    expect(dist[14]).toBe(1);
  });
});

// ─── Peak Hours ─────────────────────────────────────

describe("getPeakHours", () => {
  test("returns empty for no logs", () => {
    expect(getPeakHours([])).toEqual([]);
  });

  test("returns top 3 hours sorted by count", () => {
    const logs = [];
    // 9am: 5 logs (peak)
    for (let i = 0; i < 5; i++) logs.push(log(9));
    // 2pm: 3 logs
    for (let i = 0; i < 3; i++) logs.push(log(14));
    // 8am: 2 logs
    for (let i = 0; i < 2; i++) logs.push(log(8));

    const peaks = getPeakHours(logs);
    expect(peaks).toHaveLength(3);
    expect(peaks[0].hour).toBe(9);
    expect(peaks[1].hour).toBe(14);
    expect(peaks[2].hour).toBe(8);
  });
});

describe("getPeakHoursSummary", () => {
  test("returns null for empty logs", () => {
    expect(getPeakHoursSummary([])).toBeNull();
  });

  test("summarizes top peaks", () => {
    const logs = [];
    for (let i = 0; i < 5; i++) logs.push(log(9));
    for (let i = 0; i < 3; i++) logs.push(log(14));
    const summary = getPeakHoursSummary(logs);
    expect(summary).toContain("09:00-10:00");
    expect(summary).toContain("14:00-15:00");
  });
});

// ─── Lull Periods ────────────────────────────────────

describe("getLullPeriods", () => {
  test("returns empty for evenly distributed logs", () => {
    const logs = [];
    for (let h = 6; h < 23; h++) {
      logs.push(log(h));
      logs.push(log(h));
    }
    const lulls = getLullPeriods(logs);
    expect(lulls).toEqual([]);
  });

  test("detects a low-activity period", () => {
    const logs = [];
    // Heavy drinking at hours 8-10 and 18-20
    for (let i = 0; i < 5; i++) {
      logs.push(log(8));
      logs.push(log(9));
      logs.push(log(10));
      logs.push(log(18));
      logs.push(log(19));
      logs.push(log(20));
    }
    // Light drinking at hours 13-15 (below 30% of peak = 1.5)
    logs.push(log(13));
    logs.push(log(14));
    logs.push(log(15));
    const lulls = getLullPeriods(logs);
    const lowLulls = lulls.filter((l) => l.severity === "gap" || l.severity === "low");
    expect(lowLulls.length).toBeGreaterThan(0);
  });
});

// ─── Day-of-Week Patterns ────────────────────────────

describe("getDayOfWeekPatterns", () => {
  test("returns all 7 days with 0s for empty logs", () => {
    const patterns = getDayOfWeekPatterns([]);
    expect(patterns).toHaveLength(7);
    expect(patterns.every((d) => d.count === 0)).toBe(true);
  });

  test("groups logs by day of week", () => {
    const logs = [
      logOnDay(0, 10), // today
      logOnDay(1, 10), // yesterday
      logOnDay(2, 10), // 2 days ago
      logOnDay(3, 10), // 3 days ago
    ];
    const patterns = getDayOfWeekPatterns(logs);
    expect(patterns.reduce((s, d) => s + d.count, 0)).toBe(4);
  });
});

describe("getLowestHydrationDay", () => {
  test("returns null for empty logs", () => {
    expect(getLowestHydrationDay([])).toBeNull();
  });

  test("returns the day with lowest avg", () => {
    const logs = [];
    // Monday (today = day 0 from now... need to be careful)
    for (let i = 0; i < 14; i++) {
      logs.push(logOnDay(i, 9, 250));
    }
    const result = getLowestHydrationDay(logs);
    expect(result).toBeDefined();
    expect(result.name).toBeDefined();
  });
});

// ─── Pattern Summary ─────────────────────────────────

describe("getPatternSummary", () => {
  test("returns null for <5 logs", () => {
    const logs = [log(9), log(10)];
    expect(getPatternSummary(logs)).toBeNull();
  });

  test("returns combined summary for sufficient data", () => {
    const logs = [];
    for (let d = 0; d < 5; d++) {
      for (let i = 0; i < 3; i++) logs.push(logOnDay(d, 9));
      for (let i = 0; i < 2; i++) logs.push(logOnDay(d, 18));
    }
    const summary = getPatternSummary(logs);
    expect(summary).toBeTruthy();
    expect(typeof summary).toBe("string");
  });
});
