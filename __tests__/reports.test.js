/**
 * @jest-environment jsdom
 */

const MOCK_STORAGE = {};

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(async (key) => MOCK_STORAGE[key] ?? null),
  setItem: jest.fn(async (key, value) => { MOCK_STORAGE[key] = value; }),
  removeItem: jest.fn(async (key) => { delete MOCK_STORAGE[key]; }),
  clear: jest.fn(async () => { Object.keys(MOCK_STORAGE).forEach((k) => delete MOCK_STORAGE[k]); }),
}));

const {
  generateMonthlyReportData,
  getHighlights,
} = require("../utils/reports");

function log(year, month, day, hour, amount) {
  const d = new Date(year, month - 1, day, hour || 12);
  return {
    id: `${year}-${month}-${day}-${hour || 12}-${Math.random()}`,
    timestamp: d.toISOString(),
    amount: amount ?? 250,
  };
}

// ─── generateMonthlyReportData ──────────────────────

describe("generateMonthlyReportData", () => {
  test("returns null for empty month", () => {
    const report = generateMonthlyReportData([], 2026, 7);
    expect(report).toBeNull();
  });

  test("aggregates basic stats for a month with logs", () => {
    const logs = [];
    for (let day = 1; day <= 5; day++) {
      for (let i = 0; i < 8; i++) {
        logs.push(log(2026, 7, day, 9, 250));
      }
    }
    const report = generateMonthlyReportData(logs, 2026, 7);
    expect(report).not.toBeNull();
    expect(report.totalGlasses).toBe(40); // 5 days × 8 glasses
    expect(report.daysActive).toBe(5);
    expect(report.totalMl).toBe(10000); // 40 × 250
    expect(report.label).toContain("July");
    expect(report.label).toContain("2026");
  });

  test("calculates best streak from consecutive days", () => {
    const logs = [];
    // 3 consecutive days (day 1, 2, 3)
    for (let day = 1; day <= 3; day++) {
      logs.push(log(2026, 7, day, 9, 250));
    }
    // gap on day 4
    // day 5 (isolated)
    logs.push(log(2026, 7, 5, 9, 250));

    const report = generateMonthlyReportData(logs, 2026, 7);
    expect(report.bestStreak).toBe(3);
  });

  test("detects peak hour", () => {
    const logs = [];
    // 10 logs at 9am
    for (let i = 0; i < 10; i++) logs.push(log(2026, 7, 1, 9));
    // 2 logs at 2pm
    logs.push(log(2026, 7, 1, 14));
    logs.push(log(2026, 7, 2, 14));

    const report = generateMonthlyReportData(logs, 2026, 7);
    expect(report.peakHour).toBe("9:00-10:00");
  });

  test("handles year boundary correctly", () => {
    // December 2025 → January 2026 should not cross-contaminate
    const logs = [
      log(2025, 12, 31, 12, 250),
      log(2026, 1, 1, 12, 250),
      log(2026, 1, 2, 12, 250),
    ];

    const janReport = generateMonthlyReportData(logs, 2026, 1);
    expect(janReport).not.toBeNull();
    expect(janReport.totalGlasses).toBe(2);
    expect(janReport.daysActive).toBe(2);
  });
});

// ─── getHighlights ────────────────────────────────────

describe("getHighlights", () => {
  test("returns empty for null report", () => {
    expect(getHighlights(null)).toEqual([]);
  });

  test("generates streak highlight for >=7 days", () => {
    const report = {
      bestStreak: 7,
      avgPerDay: 8,
      totalGlasses: 100,
      goalHits: 20,
      totalDays: 25,
      bestDay: "2026-07-15",
    };
    const highlights = getHighlights(report);
    expect(highlights.some((h) => h.text.includes("Best streak"))).toBe(true);
  });

  test("generates star highlight for high avg", () => {
    const report = {
      bestStreak: 3,
      avgPerDay: 9,
      totalGlasses: 100,
      goalHits: 20,
      totalDays: 25,
      bestDay: "2026-07-15",
    };
    const highlights = getHighlights(report);
    expect(highlights.some((h) => h.text.includes("excellent"))).toBe(true);
  });

  test("generates trophy highlight for high goal hit rate", () => {
    const report = {
      bestStreak: 3,
      avgPerDay: 7,
      totalGlasses: 100,
      goalHits: 22,
      totalDays: 25,
      bestDay: "2026-07-15",
    };
    const highlights = getHighlights(report);
    expect(highlights.some((h) => h.text.includes("Hit your goal"))).toBe(true);
  });

  test("generates big number highlight for 200+ total glasses", () => {
    const report = {
      bestStreak: 3,
      avgPerDay: 7,
      totalGlasses: 210,
      goalHits: 15,
      totalDays: 30,
      bestDay: "2026-07-15",
    };
    const highlights = getHighlights(report);
    expect(highlights.some((h) => h.text.includes("crushing"))).toBe(true);
  });
});
