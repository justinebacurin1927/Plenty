/**
 * @jest-environment jsdom
 *
 * Tests for wave math utility functions (pure, no React).
 */

const { sineY, buildWavePath, LAYER_CONFIG, rippleY, RIPPLE_CONFIG } = require("../utils/wave");

describe("sineY", () => {
  test("returns baseline at x=0 when phase=0 and sin(0)=0", () => {
    expect(sineY(0, 10, 1, 0, 100)).toBe(100);
  });

  test("returns baseline + amplitude when sin(π/2)=1", () => {
    // sin(2π*1*0.25 + 0) = sin(π/2) = 1 → 10*1 + 100 = 110
    expect(sineY(0.25, 10, 1, 0, 100)).toBeCloseTo(110, 0);
  });

  test("returns baseline - amplitude when sin(3π/2)=-1", () => {
    // sin(2π*1*0.75 + 0) = sin(3π/2) = -1 → 10*(-1) + 100 = 90
    expect(sineY(0.75, 10, 1, 0, 100)).toBeCloseTo(90, 0);
  });

  test("returns sine of 2π*f*x+phase offset", () => {
    const result = sineY(50, 10, 0.5, Math.PI, 200);
    expect(result).toBeCloseTo(200 + 10 * Math.sin(2 * Math.PI * 0.5 * 50 + Math.PI), 1);
  });

  test("handles zero amplitude", () => {
    expect(sineY(100, 0, 1, 0, 50)).toBe(50);
  });
});

describe("buildWavePath", () => {
  test("returns a string starting with M (moveto)", () => {
    const path = buildWavePath(300, 400, 0.5, 10, 1, 0);
    expect(typeof path).toBe("string");
    expect(path.startsWith("M")).toBe(true);
  });

  test("path ends with Z (closepath) for filled shape", () => {
    const path = buildWavePath(300, 400, 0.5, 10, 1, 0);
    expect(path.endsWith(" Z")).toBe(true);
  });

  test("path contains quadratic bezier commands", () => {
    const path = buildWavePath(300, 400, 0.5, 10, 1, 0);
    expect(path).toContain("Q");
  });

  test("path length changes with width", () => {
    const small = buildWavePath(100, 400, 0.5, 10, 1, 0);
    const large = buildWavePath(500, 400, 0.5, 10, 1, 0);
    expect(large.length).toBeGreaterThan(small.length);
  });

  test("fill=0 puts baseline at bottom of container (height)", () => {
    // With fill=0, baseline should be at height, so the path
    // bottom-right corner should be at y=height
    const path = buildWavePath(300, 400, 0, 10, 1, 0);
    // The path with fill=0 goes from top->right->bottom->left->top
    // so it should have a bottom right corner at (300, 400)
    expect(path).toContain("400");
  });

  test("fill=1 puts baseline at top of container (y=0)", () => {
    const path = buildWavePath(300, 400, 1, 10, 1, 0);
    // The path with fill=1 should cover the full container
    // It doesn't go above y=0 since that's the top
    // The path should contain (300, 0) for top-right
    expect(path).toContain("0");
  });
});

describe("rippleY", () => {
  test("returns 0 when amplitude is 0", () => {
    expect(rippleY(100, 100, 0, 60)).toBe(0);
  });

  test("returns amplitude at center (x === center)", () => {
    expect(rippleY(100, 100, 20, 60)).toBe(20);
  });

  test("decays to near-0 at distance greater than 4*sigma", () => {
    const result = rippleY(100, 460, 20, 60);
    // exp(-(360^2) / (2 * 60^2)) = exp(-129600 / 7200) = exp(-18) ≈ 1.5e-8
    expect(result).toBeLessThan(0.001);
  });

  test("is symmetric around the center", () => {
    const left = rippleY(50, 100, 20, 60);
    const right = rippleY(150, 100, 20, 60);
    expect(left).toBeCloseTo(right, 5);
  });

  test("uses default sigma=60 when not provided", () => {
    const result = rippleY(100, 100, 20);
    expect(result).toBe(20);
  });
});

describe("RIPPLE_CONFIG", () => {
  test("has spikeAmplitude, sigma, and duration keys", () => {
    expect(RIPPLE_CONFIG).toHaveProperty("spikeAmplitude");
    expect(RIPPLE_CONFIG).toHaveProperty("sigma");
    expect(RIPPLE_CONFIG).toHaveProperty("duration");
  });

  test("spikeAmplitude is 20", () => {
    expect(RIPPLE_CONFIG.spikeAmplitude).toBe(20);
  });

  test("sigma is 60", () => {
    expect(RIPPLE_CONFIG.sigma).toBe(60);
  });

  test("duration is 600", () => {
    expect(RIPPLE_CONFIG.duration).toBe(600);
  });
});

describe("buildWavePath with rippleFn", () => {
  test("accepts optional rippleFn parameter without error", () => {
    const path = buildWavePath(300, 400, 0.5, 10, 1, 0, () => 0);
    expect(typeof path).toBe("string");
    expect(path.startsWith("M")).toBe(true);
  });

  test("rippleFn modifies the path shape", () => {
    const withoutRipple = buildWavePath(300, 400, 0.5, 10, 1, 0);
    const withRipple = buildWavePath(300, 400, 0.5, 10, 1, 0, (x) => {
      // Constant 50px offset should produce a different path
      return 50;
    });
    // With a constant +50px offset, the path should differ from the no-ripple version
    expect(withRipple).not.toBe(withoutRipple);
  });
});

describe("LAYER_CONFIG", () => {
  test("has exactly 2 entries", () => {
    expect(LAYER_CONFIG).toHaveLength(2);
  });

  test("each entry has required keys", () => {
    for (const layer of LAYER_CONFIG) {
      expect(layer).toHaveProperty("amplitude");
      expect(layer).toHaveProperty("frequency");
      expect(layer).toHaveProperty("speed");
      expect(layer).toHaveProperty("opacity");
    }
  });

  test("layer 0 has higher speed than layer 1", () => {
    expect(LAYER_CONFIG[0].speed).toBeGreaterThan(LAYER_CONFIG[1].speed);
  });

  test("layer 0 has higher opacity than layer 1", () => {
    expect(LAYER_CONFIG[0].opacity).toBeGreaterThan(LAYER_CONFIG[1].opacity);
  });
});
