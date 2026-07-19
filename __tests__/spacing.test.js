/**
 * Unit tests for Plenty spacing scale tokens.
 */
import { spacing, space } from "../constants/spacing";

describe("spacing tokens", () => {
  it("exports xxs (2)", () => {
    expect(spacing.xxs).toBe(2);
  });

  it("exports xs (4)", () => {
    expect(spacing.xs).toBe(4);
  });

  it("exports xsm (6)", () => {
    expect(spacing.xsm).toBe(6);
  });

  it("exports sm (8)", () => {
    expect(spacing.sm).toBe(8);
  });

  it("exports smd (10)", () => {
    expect(spacing.smd).toBe(10);
  });

  it("exports md (12)", () => {
    expect(spacing.md).toBe(12);
  });

  it("exports lgm (14)", () => {
    expect(spacing.lgm).toBe(14);
  });

  it("exports lg (16)", () => {
    expect(spacing.lg).toBe(16);
  });

  it("exports lgx (20)", () => {
    expect(spacing.lgx).toBe(20);
  });

  it("exports xl (24)", () => {
    expect(spacing.xl).toBe(24);
  });

  it("exports 2xl (32)", () => {
    expect(spacing["2xl"]).toBe(32);
  });

  it("exports 3xl (40)", () => {
    expect(spacing["3xl"]).toBe(40);
  });
});

describe("space helper", () => {
  it("returns correct value for xs", () => {
    expect(space("xs")).toBe(4);
  });

  it("returns correct value for lg", () => {
    expect(space("lg")).toBe(16);
  });

  it("returns correct value for 2xl", () => {
    expect(space("2xl")).toBe(32);
  });

  it("returns undefined for unknown token", () => {
    expect(space("invalid")).toBeUndefined();
  });
});
