/**
 * @jest-environment jsdom
 *
 * Tests for WaterFill animated SVG wave component.
 *
 * Uses manual mock from __mocks__/react-native-reanimated.js — provides
 * lightweight SVG class components and synchronous reanimated function mocks
 * without importing the real reanimated/worklets native module tree.
 */
import React from "react";
import { act, create } from "react-test-renderer";

// ── Mocks (hoisted by jest) ──

jest.mock("react-native-reanimated");

// IMPORTANT: spread ReanimatedMock FIRST, then override default with Svg.
// If `default` is set first then spread, ReanimatedMock.default (Animated object)
// would override it, making `import Svg from "react-native-svg"` return an object.
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

/**
 * Render WaterFill inside an isolated module scope with a custom ThemeContext mock.
 * This avoids stale module cache issues when switching theme mocks.
 */

// ── Structure tests ──

describe("WaterFill — render structure", () => {
  it("renders without crashing", () => {
    const tree = render(<WaterFill width={300} height={400} />);
    expect(tree.toJSON()).not.toBeNull();
  });

  it("renders Svg element with correct dimensions", () => {
    const tree = render(<WaterFill width={300} height={400} />).toJSON();
    expect(tree.type).toBe("Svg");
    expect(tree.props.width).toBe(300);
    expect(tree.props.height).toBe(400);
    expect(tree.props.viewBox).toBe("0 0 300 400");
  });

  it("contains Defs > ClipPath > Rect", () => {
    const tree = render(<WaterFill width={300} height={400} />).toJSON();
    const defs = flatten(tree).find((n) => n.type === "Defs");
    expect(defs).toBeDefined();

    const clip = flatten(defs).find((n) => n.type === "ClipPath");
    expect(clip).toBeDefined();
    expect(clip.props.id).toBe("water-clip");

    const clipRect = flatten(clip).find((n) => n.type === "Rect");
    expect(clipRect).toBeDefined();
    expect(clipRect.props.width).toBe(300);
    expect(clipRect.props.height).toBe(400);
  });

  it("renders water body Rect and two wave Paths", () => {
    const nodes = flatten(render(<WaterFill width={300} height={400} />).toJSON());
    const rects = nodes.filter((n) => n.type === "Rect");
    const paths = nodes.filter((n) => n.type === "Path");
    // 1 water-body Rect + 1 clip-mask Rect = 2; exactly 2 Path elements
    expect(rects.length).toBeGreaterThanOrEqual(2);
    expect(paths.length).toBe(2);
  });

  it("water body rect uses primary color in light mode", () => {
    const nodes = flatten(render(<WaterFill width={300} height={400} />).toJSON());
    const body = nodes.find((n) => n.type === "Rect" && n.props.fill === "#4A90D9");
    expect(body).toBeDefined();
    expect(body.props.fill).toBe("#4A90D9");
  });

  it("front wave path has opacity 0.85, back wave has 0.4", () => {
    const paths = flatten(render(<WaterFill width={300} height={400} />).toJSON())
      .filter((n) => n.type === "Path");
    expect(paths[0].props.opacity).toBe(0.4);
    expect(paths[1].props.opacity).toBe(0.85);
  });

  it("both wave paths have clip-path applied", () => {
    const paths = flatten(render(<WaterFill width={300} height={400} />).toJSON())
      .filter((n) => n.type === "Path");
    paths.forEach((p) => {
      expect(p.props.clipPath).toBe("url(#water-clip)");
    });
  });
});

// ── Fill prop tests ──

describe("WaterFill — fill prop", () => {
  it("accepts fill=0 without error", () => {
    const tree = render(<WaterFill width={300} height={400} fill={0} />).toJSON();
    expect(tree).not.toBeNull();
  });

  it("accepts fill=1 without error", () => {
    expect(render(<WaterFill width={300} height={400} fill={1} />).toJSON()).not.toBeNull();
  });

  it("accepts fill=0.5 without error", () => {
    expect(render(<WaterFill width={300} height={400} fill={0.5} />).toJSON()).not.toBeNull();
  });

  it("handles out-of-range fill values", () => {
    expect(render(<WaterFill width={300} height={400} fill={-0.5} />).toJSON()).not.toBeNull();
    expect(render(<WaterFill width={300} height={400} fill={1.5} />).toJSON()).not.toBeNull();
  });

  it("re-renders when fill prop changes", () => {
    const instance = render(<WaterFill width={300} height={400} fill={0} />);
    act(() => {
      instance.update(<WaterFill width={300} height={400} fill={0.75} />);
    });
    expect(instance.toJSON()).not.toBeNull();
  });
});

// ── Default prop tests ──

describe("WaterFill — default props", () => {
  it("uses 300x400 with fill=0 when no props provided", () => {
    const tree = render(<WaterFill />).toJSON();
    expect(tree.props.width).toBe(300);
    expect(tree.props.height).toBe(400);
  });

  it("honours explicit but unusual dimensions", () => {
    const tree = render(<WaterFill width={100} height={800} fill={0.3} />).toJSON();
    expect(tree.props.width).toBe(100);
    expect(tree.props.height).toBe(800);
    expect(tree.props.viewBox).toBe("0 0 100 800");
  });
});

// ── Lifecycle cleanup tests ──

describe("WaterFill — lifecycle cleanup", () => {
  it("unmounts without error (cleanup exercises cancelAnimation)", () => {
    const instance = render(<WaterFill width={300} height={400} />);
    act(() => {
      instance.unmount();
    });
    // If the cleanup effect threw, the test fails
  });
});

// ── Dark mode tests (isolated modules to change ThemeContext mock) ──

describe("WaterFill — dark mode", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it("uses dark primary (#6BB5FF) in dark mode", () => {
    jest.mock("react-native-reanimated");
    jest.mock("react-native-svg", () => {
      const RM = require("react-native-reanimated");
      return { __esModule: true, ...RM, default: RM.Svg };
    });
    jest.mock("../context/ThemeContext", () => ({
      useTheme: () => ({ colors: { primary: "#6BB5FF", primaryLight: "#4A7FA8" }, isDark: true }),
    }));
    jest.mock("../utils/motion", () => ({
      useReducedMotion: () => false,
      DURATION: { waveCycle: 3000 },
    }));

    const { act: a, create: c } = require("react-test-renderer");
    const WaterFillDark = require("../components/WaterFill").default;
    const R = require("react");

    let inst;
    a(() => { inst = c(R.createElement(WaterFillDark, { width: 300, height: 400 })); });
    const nodes = flatten(inst.toJSON());
    const body = nodes.find((n) => n.type === "Rect" && n.props.fill === "#6BB5FF");
    expect(body).toBeDefined();
  });

  it("both wave layers use primaryLight for back, primary for front in dark mode", () => {
    jest.mock("react-native-reanimated");
    jest.mock("react-native-svg", () => {
      const RM = require("react-native-reanimated");
      return { __esModule: true, ...RM, default: RM.Svg };
    });
    jest.mock("../context/ThemeContext", () => ({
      useTheme: () => ({ colors: { primary: "#6BB5FF", primaryLight: "#4A7FA8" }, isDark: true }),
    }));
    jest.mock("../utils/motion", () => ({
      useReducedMotion: () => false,
      DURATION: { waveCycle: 3000 },
    }));

    const { act: a, create: c } = require("react-test-renderer");
    const WaterFillDark = require("../components/WaterFill").default;
    const R = require("react");

    let inst;
    a(() => { inst = c(R.createElement(WaterFillDark, { width: 300, height: 400 })); });
    const paths = flatten(inst.toJSON()).filter((n) => n.type === "Path");
    expect(paths.length).toBe(2);
    // Back layer uses primaryLight for depth illusion in dark mode
    expect(paths[0].props.fill).toBe("#4A7FA8");
    // Front layer uses primary
    expect(paths[1].props.fill).toBe("#6BB5FF");
  });

  it("light mode uses primaryLight for back layer", () => {
    jest.mock("react-native-reanimated");
    jest.mock("react-native-svg", () => {
      const RM = require("react-native-reanimated");
      return { __esModule: true, ...RM, default: RM.Svg };
    });
    jest.mock("../context/ThemeContext", () => ({
      useTheme: () => ({ colors: { primary: "#4A90D9", primaryLight: "#A0C4E8" }, isDark: false }),
    }));
    jest.mock("../utils/motion", () => ({
      useReducedMotion: () => false,
      DURATION: { waveCycle: 3000 },
    }));

    const { act: a, create: c } = require("react-test-renderer");
    const WaterFillLight = require("../components/WaterFill").default;
    const R = require("react");

    let inst;
    a(() => { inst = c(R.createElement(WaterFillLight, { width: 300, height: 400 })); });
    const paths = flatten(inst.toJSON()).filter((n) => n.type === "Path");
    expect(paths.length).toBe(2);
    expect(paths[0].props.fill).toBe("#A0C4E8");
  });
});
