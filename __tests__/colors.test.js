/**
 * Unit tests for Plenty color tokens — radius + elevation.
 */
import { light, dark } from "../constants/colors";

describe("radius tokens", () => {
  describe("light", () => {
    it("exports radius.xs = 4", () => {
      expect(light.radius.xs).toBe(4);
    });

    it("exports radius.sm = 6", () => {
      expect(light.radius.sm).toBe(6);
    });

    it("exports radius.md = 8", () => {
      expect(light.radius.md).toBe(8);
    });

    it("exports radius.lg = 12", () => {
      expect(light.radius.lg).toBe(12);
    });

    it("exports radius.xl = 16", () => {
      expect(light.radius.xl).toBe(16);
    });

    it("exports radius.pill = 999", () => {
      expect(light.radius.pill).toBe(999);
    });
  });

  describe("dark", () => {
    it("exports radius.xs = 4 (same as light)", () => {
      expect(dark.radius.xs).toBe(4);
    });

    it("exports radius.sm = 6 (same as light)", () => {
      expect(dark.radius.sm).toBe(6);
    });

    it("exports radius.pill = 999 (same as light)", () => {
      expect(dark.radius.pill).toBe(999);
    });

    it("exports radius.md = 8 (same as light)", () => {
      expect(dark.radius.md).toBe(8);
    });

    it("exports radius.lg = 12 (same as light)", () => {
      expect(dark.radius.lg).toBe(12);
    });

    it("exports radius.xl = 16 (same as light)", () => {
      expect(dark.radius.xl).toBe(16);
    });
  });
});

describe("elevation tokens", () => {
  describe("light", () => {
    it("exports elevation[1] with subtle shadow", () => {
      const e1 = light.elevation[1];
      expect(e1.shadowColor).toBe("#000");
      expect(e1.shadowOffset).toEqual({ width: 0, height: 1 });
      expect(e1.shadowOpacity).toBe(0.05);
      expect(e1.shadowRadius).toBe(4);
      expect(e1.elevation).toBe(2);
    });

    it("exports elevation[2] with moderate shadow", () => {
      const e2 = light.elevation[2];
      expect(e2.shadowColor).toBe("#000");
      expect(e2.shadowOffset).toEqual({ width: 0, height: 2 });
      expect(e2.shadowOpacity).toBe(0.15);
      expect(e2.shadowRadius).toBe(8);
      expect(e2.elevation).toBe(6);
    });

    it("exports elevation[3] with popup shadow", () => {
      const e3 = light.elevation[3];
      expect(e3.shadowColor).toBe("#000");
      expect(e3.shadowOffset).toEqual({ width: 0, height: 8 });
      expect(e3.shadowOpacity).toBe(0.25);
      expect(e3.shadowRadius).toBe(24);
      expect(e3.elevation).toBe(12);
    });
  });

  describe("dark", () => {
    it("exports elevation[1] with higher opacity for dark bg", () => {
      const e1 = dark.elevation[1];
      expect(e1.shadowColor).toBe("#000");
      expect(e1.shadowOpacity).toBe(0.15);
      expect(e1.elevation).toBe(2);
    });

    it("exports elevation[2] with moderate shadow for dark bg", () => {
      const e2 = dark.elevation[2];
      expect(e2.shadowColor).toBe("#000");
      expect(e2.shadowOffset).toEqual({ width: 0, height: 2 });
      expect(e2.shadowOpacity).toBe(0.25);
      expect(e2.shadowRadius).toBe(8);
      expect(e2.elevation).toBe(6);
    });

    it("exports elevation[3] with higher opacity for dark bg", () => {
      const e3 = dark.elevation[3];
      expect(e3.shadowColor).toBe("#000");
      expect(e3.shadowOpacity).toBe(0.35);
      expect(e3.elevation).toBe(12);
    });
  });

  describe("consistency", () => {
    it("light and dark elevation have same shadowOffset values per level", () => {
      expect(light.elevation[1].shadowOffset).toEqual(dark.elevation[1].shadowOffset);
      expect(light.elevation[2].shadowOffset).toEqual(dark.elevation[2].shadowOffset);
      expect(light.elevation[3].shadowOffset).toEqual(dark.elevation[3].shadowOffset);
    });

    it("light and dark elevation have same shadowRadius per level", () => {
      expect(light.elevation[1].shadowRadius).toBe(dark.elevation[1].shadowRadius);
      expect(light.elevation[2].shadowRadius).toBe(dark.elevation[2].shadowRadius);
      expect(light.elevation[3].shadowRadius).toBe(dark.elevation[3].shadowRadius);
    });

    it("dark opacity is higher than light per level", () => {
      expect(dark.elevation[1].shadowOpacity).toBeGreaterThan(light.elevation[1].shadowOpacity);
      expect(dark.elevation[2].shadowOpacity).toBeGreaterThan(light.elevation[2].shadowOpacity);
      expect(dark.elevation[3].shadowOpacity).toBeGreaterThan(light.elevation[3].shadowOpacity);
    });
  });
});
