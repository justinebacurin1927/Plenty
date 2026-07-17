import React, { act } from "react";
import TestRenderer from "react-test-renderer";
import { AccessibilityInfo } from "react-native";

import StreakFlame, { getFlameTier } from "../components/StreakFlame";

// ─── getFlameTier ─────────────────────────────────

describe("getFlameTier", () => {
  it("returns null for streak < 7", () => {
    expect(getFlameTier(0)).toBeNull();
    expect(getFlameTier(3)).toBeNull();
    expect(getFlameTier(6)).toBeNull();
  });

  it("returns tier 1 for 7–29 days", () => {
    expect(getFlameTier(7).tier).toBe(1);
    expect(getFlameTier(14).tier).toBe(1);
    expect(getFlameTier(29).tier).toBe(1);
  });

  it("returns tier 2 for 30–99 days", () => {
    expect(getFlameTier(30).tier).toBe(2);
    expect(getFlameTier(50).tier).toBe(2);
    expect(getFlameTier(99).tier).toBe(2);
  });

  it("returns tier 3 for 100+ days", () => {
    expect(getFlameTier(100).tier).toBe(3);
    expect(getFlameTier(365).tier).toBe(3);
    expect(getFlameTier(1000).tier).toBe(3);
  });

  it("returns null for invalid inputs", () => {
    expect(getFlameTier(NaN)).toBeNull();
    expect(getFlameTier(-1)).toBeNull();
    expect(getFlameTier("7")).toBeNull();
    expect(getFlameTier(undefined)).toBeNull();
  });

  it("includes correct size per tier", () => {
    expect(getFlameTier(7).size).toBe(24);
    expect(getFlameTier(30).size).toBe(32);
    expect(getFlameTier(100).size).toBe(40);
  });
});

// ─── Component rendering ───────────────────────────

async function renderFlame(streakLength, style) {
  let tree;
  await act(async () => {
    tree = TestRenderer.create(<StreakFlame streakLength={streakLength} style={style} />);
  });
  return tree;
}

describe("StreakFlame render", () => {
  it("renders nothing when below tier 1", async () => {
    const tree = await renderFlame(3);
    expect(tree.toJSON()).toBeNull();
  });

  it("renders flame for tier 1 (7 days)", async () => {
    const tree = await renderFlame(7);
    expect(tree.toJSON()).not.toBeNull();
  });

  it("renders flame for tier 2 (50 days)", async () => {
    const tree = await renderFlame(50);
    expect(tree.toJSON()).not.toBeNull();
  });

  it("renders flame for tier 3 (365 days)", async () => {
    const tree = await renderFlame(365);
    expect(tree.toJSON()).not.toBeNull();
  });

  it("accepts and applies style prop", async () => {
    const tree = await renderFlame(7, { marginLeft: 4 });
    expect(tree.toJSON()).not.toBeNull();
  });
});

// ─── Reduce motion ─────────────────────────────────

describe("StreakFlame reduce motion", () => {
  beforeEach(() => {
    AccessibilityInfo.isReduceMotionEnabled = jest.fn().mockResolvedValue(true);
  });

  it("renders with static layers when reduce motion enabled", async () => {
    const tree = await renderFlame(30);
    expect(tree.toJSON()).not.toBeNull();
  });
});
