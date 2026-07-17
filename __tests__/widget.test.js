/**
 * @jest-environment jsdom
 */

// Use var for hoisting compatibility with jest.mock transform
var mockRefreshWidget;
var mockPlatform;

jest.mock("react-native", () => {
  const fn = jest.fn().mockResolvedValue(undefined);
  mockRefreshWidget = fn;
  mockPlatform = { OS: "android" };
  return {
    Platform: mockPlatform,
    NativeModules: { PlentyWidget: { refreshWidget: fn } },
  };
});

const widget = require("../utils/widget");

beforeEach(() => {
  mockRefreshWidget.mockClear();
  mockPlatform.OS = "android";
  // Restore the native module in case a previous test removed it
  const rn = require("react-native");
  rn.NativeModules.PlentyWidget = { refreshWidget: mockRefreshWidget };
});

describe("formatWidgetStreak", () => {
  it("returns 'Start tracking!' for streak 0", () => {
    expect(widget.formatWidgetStreak(0)).toBe("Start tracking!");
  });

  it("returns '1 day streak' for streak 1", () => {
    expect(widget.formatWidgetStreak(1)).toBe("1 day streak");
  });

  it("returns '7 day streak' for streak 7", () => {
    expect(widget.formatWidgetStreak(7)).toBe("7 day streak");
  });

  it("returns '100 day streak' for streak 100", () => {
    expect(widget.formatWidgetStreak(100)).toBe("100 day streak");
  });

  it("handles negative streak gracefully", () => {
    expect(widget.formatWidgetStreak(-1)).toBe("Start tracking!");
  });

  it("handles null and undefined streak gracefully", () => {
    expect(widget.formatWidgetStreak(null)).toBe("Start tracking!");
    expect(widget.formatWidgetStreak(undefined)).toBe("Start tracking!");
  });
});

describe("refreshWidget", () => {
  it("calls native refreshWidget with correct data shape including streak", async () => {
    const data = { currentMl: 1000, goalMl: 2000, streak: 5, glassesCount: 4 };
    const result = await widget.refreshWidget(data);
    expect(result).toBe(true);
    expect(mockRefreshWidget).toHaveBeenCalledTimes(1);
    expect(mockRefreshWidget).toHaveBeenCalledWith({
      currentMl: 1000,
      goalMl: 2000,
      streak: 5,
      glassesCount: 4,
    });
  });

  it("rounds float values to integers", async () => {
    const data = { currentMl: 1000.7, goalMl: 2000.3, streak: 5.8, glassesCount: 4.2 };
    await widget.refreshWidget(data);
    expect(mockRefreshWidget).toHaveBeenCalledWith({
      currentMl: 1001,
      goalMl: 2000,
      streak: 6,
      glassesCount: 4,
    });
  });

  it("returns false when Platform is not Android", async () => {
    mockPlatform.OS = "ios";
    const data = { currentMl: 1000, goalMl: 2000, streak: 5, glassesCount: 4 };
    const result = await widget.refreshWidget(data);
    expect(result).toBe(false);
    expect(mockRefreshWidget).not.toHaveBeenCalled();
  });

  it("returns false when PlentyWidget native module is null", async () => {
    const rn = require("react-native");
    rn.NativeModules.PlentyWidget = null;
    const data = { currentMl: 1000, goalMl: 2000, streak: 5, glassesCount: 4 };
    const result = await widget.refreshWidget(data);
    expect(result).toBe(false);
  });

  it("handles native module throwing an error gracefully", async () => {
    mockRefreshWidget.mockRejectedValueOnce(new Error("Native error"));
    const data = { currentMl: 1000, goalMl: 2000, streak: 5, glassesCount: 4 };
    const result = await widget.refreshWidget(data);
    expect(result).toBe(false);
  });

  it("passes streak 0 correctly through the native bridge", async () => {
    const data = { currentMl: 0, goalMl: 2000, streak: 0, glassesCount: 0 };
    await widget.refreshWidget(data);
    expect(mockRefreshWidget).toHaveBeenCalledWith({
      currentMl: 0,
      goalMl: 2000,
      streak: 0,
      glassesCount: 0,
    });
  });

  it("passes streak of 365 (century club) correctly", async () => {
    const data = { currentMl: 2000, goalMl: 2000, streak: 365, glassesCount: 8 };
    await widget.refreshWidget(data);
    expect(mockRefreshWidget).toHaveBeenCalledWith({
      currentMl: 2000,
      goalMl: 2000,
      streak: 365,
      glassesCount: 8,
    });
  });
});
