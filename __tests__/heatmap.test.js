import AsyncStorage from "@react-native-async-storage/async-storage";

// Mock AsyncStorage for module resolution
const MOCK = {};
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(async (key) => MOCK[key] ?? null),
  setItem: jest.fn(async (key, value) => { MOCK[key] = value; }),
  removeItem: jest.fn(async (key) => { delete MOCK[key]; }),
  clear: jest.fn(async () => { Object.keys(MOCK).forEach(k => delete MOCK[k]); }),
}));

import { computeGridData } from "../components/Heatmap";

describe("computeGridData", () => {
  const GOAL = 8;
  const GOAL_ML = GOAL * 250;

  it("returns 12 weeks of data", () => {
    const grid = computeGridData([], GOAL);
    expect(grid.length).toBe(12);
    grid.forEach((week, i) => {
      expect(week.length).toBe(7, `Week ${i} should have 7 days`);
    });
  });

  it("marks cells as hit when day meets goal", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;

    const history = [
      { date: dateStr, goalMet: true, totalMl: GOAL_ML },
    ];

    const grid = computeGridData(history, GOAL);
    // Find the cell that matches yesterday
    const allCells = grid.flat();
    const matched = allCells.find((c) => c.dateStr === dateStr);
    expect(matched).toBeDefined();
    expect(matched.color).toBe("hit");
    expect(matched.totalMl).toBe(GOAL_ML);
  });

  it("marks cells as missed when day logs but falls short", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;

    const history = [
      { date: dateStr, goalMet: false, totalMl: 1000 },
    ];

    const grid = computeGridData(history, GOAL);
    const allCells = grid.flat();
    const matched = allCells.find((c) => c.dateStr === dateStr);
    expect(matched).toBeDefined();
    expect(matched.color).toBe("missed");
  });

  it("marks over150 when totalMl >= 150% of goal", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;

    const history = [
      { date: dateStr, goalMet: true, totalMl: GOAL_ML * 1.6 },
    ];

    const grid = computeGridData(history, GOAL);
    const allCells = grid.flat();
    const matched = allCells.find((c) => c.dateStr === dateStr);
    expect(matched.color).toBe("over150");
  });

  it("marks over200 when totalMl >= 200% of goal", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;

    const history = [
      { date: dateStr, goalMet: true, totalMl: GOAL_ML * 2.5 },
    ];

    const grid = computeGridData(history, GOAL);
    const allCells = grid.flat();
    const matched = allCells.find((c) => c.dateStr === dateStr);
    expect(matched.color).toBe("over200");
  });

  it("marks cells as empty when no history exists", () => {
    const grid = computeGridData([], GOAL);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;

    const allCells = grid.flat();
    const matched = allCells.find((c) => c.dateStr === dateStr);
    expect(matched).toBeDefined();
    expect(matched.color).toBe("empty");
    expect(matched.totalMl).toBe(0);
  });

  it("correctly reports totalMl for each cell", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;

    const history = [
      { date: dateStr, goalMet: true, totalMl: 1750 },
    ];

    const grid = computeGridData(history, GOAL);
    const allCells = grid.flat();
    const matched = allCells.find((c) => c.dateStr === dateStr);
    expect(matched.totalMl).toBe(1750);
  });
});
