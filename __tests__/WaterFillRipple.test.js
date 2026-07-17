/**
 * @jest-environment jsdom
 *
 * Tests for WaterFill ripple integration.
 *
 * The pure math tests (rippleY, RIPPLE_CONFIG) live in __tests__/wave.test.js.
 * This file tests the component integration: that triggerRipple is exposed via
 * ref, that it doesn't crash at various fill levels, and that the ripple wiring
 * doesn't break the two-layer wave structure.
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

function flatten(node) {
  if (!node || typeof node === "string") return [];
  return [node, ...(node.children || []).flatMap(flatten)];
}

// ── Structure tests ──

describe("WaterFillRipple — component structure", () => {
  it("renders without crashing", () => {
    const tree = render(<WaterFill width={300} height={400} />);
    expect(tree.toJSON()).not.toBeNull();
  });

  it("still renders two Path elements with ripple wiring", () => {
    const nodes = flatten(render(<WaterFill width={300} height={400} />).toJSON());
    const paths = nodes.filter((n) => n.type === "Path");
    expect(paths.length).toBe(2);
  });
});

// ── Ref / triggerRipple tests ──

describe("WaterFillRipple — triggerRipple via ref", () => {
  it("exposes triggerRipple on ref", () => {
    const ref = React.createRef();
    render(<WaterFill ref={ref} width={300} height={400} />);
    expect(ref.current).toBeDefined();
    expect(typeof ref.current.triggerRipple).toBe("function");
  });

  it("triggerRipple does not crash at fill=0", () => {
    const ref = React.createRef();
    render(<WaterFill ref={ref} width={300} height={400} fill={0} />);
    act(() => {
      ref.current.triggerRipple();
    });
  });

  it("triggerRipple does not crash at fill=0.5", () => {
    const ref = React.createRef();
    render(<WaterFill ref={ref} width={300} height={400} fill={0.5} />);
    act(() => {
      ref.current.triggerRipple();
    });
  });

  it("triggerRipple does not crash at fill=1", () => {
    const ref = React.createRef();
    render(<WaterFill ref={ref} width={300} height={400} fill={1} />);
    act(() => {
      ref.current.triggerRipple();
    });
  });

  it("triggerRipple can be called multiple times without error", () => {
    const ref = React.createRef();
    render(<WaterFill ref={ref} width={300} height={400} />);
    act(() => {
      ref.current.triggerRipple();
      ref.current.triggerRipple();
      ref.current.triggerRipple();
    });
  });

  it("does not crash when ref is not provided (no forwardRef consumer)", () => {
    const tree = render(<WaterFill width={300} height={400} />);
    expect(tree.toJSON()).not.toBeNull();
  });

  it("WaveFill unmounts cleanly after triggerRipple", () => {
    const ref = React.createRef();
    const instance = render(<WaterFill ref={ref} width={300} height={400} />);
    act(() => {
      ref.current.triggerRipple();
    });
    act(() => {
      instance.unmount();
    });
  });
});

// ── Reduced motion test (isolated modules) ──

describe("WaterFillRipple — reduced motion", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it("triggerRipple is no-op when reduced motion is enabled", () => {
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
    a(() => { inst = c(R.createElement(WaterFillRM, { ref, width: 300, height: 400 })); });

    expect(ref.current).toBeDefined();
    expect(typeof ref.current.triggerRipple).toBe("function");

    // Should not throw even with reduced motion
    a(() => { ref.current.triggerRipple(); });
    a(() => { inst.unmount(); });
  });
});
