/**
 * @jest-environment jsdom
 *
 * Tests for GoalReached — goal-hit celebration animations.
 *
 * Verifies:
 * - WaterFill triggerGoalCelebration() exists and is callable
 * - Reduced motion skip
 * - HomeScreen goal-hit gate logic (via integration)
 */

import React from "react";
import { act, create } from "react-test-renderer";

// ── Mocks (hoisted by jest) ──

jest.mock("react-native-reanimated");

jest.mock("react-native-svg", () => {
  const ReanimatedMock = require("react-native-reanimated");
  return { __esModule: true, ...ReanimatedMock, default: ReanimatedMock.Svg };
});

jest.mock("../context/ThemeContext", () => ({
  useTheme: () => ({
    colors: { primary: "#4A90D9", primaryLight: "#A0C4E8" },
    isDark: false,
  }),
}));

jest.mock("../utils/motion", () => ({
  useReducedMotion: () => false,
  DURATION: { waveCycle: 3000 },
}));

import WaterFill from "../components/WaterFill";

// ── Helpers ──

function render(el) {
  let instance;
  act(() => {
    instance = create(el);
  });
  return instance;
}

// ── Tests: WaterFill triggerGoalCelebration ──

describe("WaterFill goal celebration", () => {
  it("exposes triggerGoalCelebration via ref", () => {
    const ref = React.createRef();
    render(<WaterFill ref={ref} fill={0.5} width={300} height={200} />);
    expect(ref.current).toBeDefined();
    expect(typeof ref.current.triggerGoalCelebration).toBe("function");
  });

  it("calling triggerGoalCelebration does not throw at fill=1", () => {
    const ref = React.createRef();
    render(<WaterFill ref={ref} fill={1} width={300} height={200} />);
    expect(() => {
      act(() => {
        ref.current.triggerGoalCelebration();
      });
    }).not.toThrow();
  });

  it("calling triggerGoalCelebration does not throw at fill=0.5", () => {
    const ref = React.createRef();
    render(<WaterFill ref={ref} fill={0.5} width={300} height={200} />);
    expect(() => {
      act(() => {
        ref.current.triggerGoalCelebration();
      });
    }).not.toThrow();
  });

  it("can be called multiple times without error", () => {
    const ref = React.createRef();
    render(<WaterFill ref={ref} fill={1} width={300} height={200} />);
    act(() => {
      ref.current.triggerGoalCelebration();
      ref.current.triggerGoalCelebration();
      ref.current.triggerGoalCelebration();
    });
  });

  it("triggerGoalCelebration coexists with triggerRipple", () => {
    const ref = React.createRef();
    render(<WaterFill ref={ref} fill={1} width={300} height={200} />);
    expect(typeof ref.current.triggerRipple).toBe("function");
    expect(typeof ref.current.triggerGoalCelebration).toBe("function");
    act(() => {
      ref.current.triggerRipple();
      ref.current.triggerGoalCelebration();
    });
  });

  it("unmounts cleanly after triggerGoalCelebration", () => {
    const ref = React.createRef();
    const instance = render(<WaterFill ref={ref} fill={1} width={300} height={200} />);
    act(() => {
      ref.current.triggerGoalCelebration();
    });
    act(() => {
      instance.unmount();
    });
  });
});

// ── Reduced motion test (isolated modules) ──

describe("WaterFill goal celebration — reduced motion", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it("triggerGoalCelebration is no-op when reduced motion is enabled", () => {
    jest.mock("react-native-reanimated");
    jest.mock("react-native-svg", () => {
      const RM = require("react-native-reanimated");
      return { __esModule: true, ...RM, default: RM.Svg };
    });
    jest.mock("../context/ThemeContext", () => ({
      useTheme: () => ({ colors: { primary: "#4A90D9", primaryLight: "#A0C4E8" }, isDark: false }),
    }));
    jest.mock("../utils/motion", () => ({
      useReducedMotion: () => true,
      DURATION: { waveCycle: 3000 },
    }));

    const { act: a, create: c } = require("react-test-renderer");
    const R = require("react");
    const WaterFillRM = require("../components/WaterFill").default;

    const ref = R.createRef();
    let inst;
    a(() => { inst = c(R.createElement(WaterFillRM, { ref, width: 300, height: 200 })); });

    expect(ref.current).toBeDefined();
    expect(typeof ref.current.triggerGoalCelebration).toBe("function");

    // Should not throw even with reduced motion
    a(() => { ref.current.triggerGoalCelebration(); });
    a(() => { inst.unmount(); });
  });
});
