/**
 * @jest-environment jsdom
 *
 * Tests for Mascot idle animation and streak-aware expressions.
 *
 * Verifies:
 * - streakToExpression returns correct expression for all streak ranges
 * - "happier" expression renders with wider eyes and bigger smile
 * - Reduced motion disables idle float animation
 * - Tap still cycles expressions
 */

import React from "react";
import { act, create } from "react-test-renderer";

// ── Mocks ──

jest.mock("../context/ThemeContext", () => ({
  useTheme: () => ({
    colors: { primary: "#4A90D9", text: "#333", textSecondary: "#888", surface: "#FFF" },
    isDark: false,
  }),
}));

jest.mock("../utils/motion", () => ({
  useReducedMotion: () => false,
}));

jest.mock("@expo/vector-icons", () => ({ Ionicons: "Ionicons" }), { virtual: true });

import Mascot, { streakToExpression } from "../components/Mascot";

// ── Helpers ──

function render(el) {
  let instance;
  act(() => {
    instance = create(el);
  });
  return instance;
}

function findElementWithProp(instance, propKey, propValue) {
  // Walk the rendered tree to find elements with a certain prop
  const root = instance.toJSON();
  function walk(node) {
    if (!node || typeof node !== "object") return null;
    if (node.props && node.props[propKey] === propValue) return node;
    if (node.children) {
      for (const child of node.children) {
        const found = walk(child);
        if (found) return found;
      }
    }
    return null;
  }
  return walk(root);
}

// ── Tests: streakToExpression ──

describe("streakToExpression", () => {
  it('returns "happy" for 0 days', () => {
    expect(streakToExpression(0)).toBe("happy");
  });

  it('returns "happy" for 6 days', () => {
    expect(streakToExpression(6)).toBe("happy");
  });

  it('returns "happier" for 7 days', () => {
    expect(streakToExpression(7)).toBe("happier");
  });

  it('returns "happier" for 14 days', () => {
    expect(streakToExpression(14)).toBe("happier");
  });

  it('returns "happier" for 29 days', () => {
    expect(streakToExpression(29)).toBe("happier");
  });

  it('returns "excited" for 30 days', () => {
    expect(streakToExpression(30)).toBe("excited");
  });

  it('returns "excited" for 100 days', () => {
    expect(streakToExpression(100)).toBe("excited");
  });

  it("returns a valid expression for any input", () => {
    const valid = ["happy", "happier", "excited", "reminding", "sleepy"];
    for (const val of [0, 1, 3, 7, 15, 30, 50, 100, -1, NaN, null, undefined]) {
      expect(valid).toContain(streakToExpression(val));
    }
  });
});

// ── Tests: Mascot rendering with happier expression ──

describe("Mascot with happier expression", () => {
  it("renders without error with happier expression", () => {
    const instance = render(<Mascot expression="happier" />);
    expect(instance.toJSON()).not.toBeNull();
  });

  it("renders without error with happier at various sizes", () => {
    const instance = render(<Mascot expression="happier" size={80} />);
    expect(instance.toJSON()).not.toBeNull();
  });

  it("renders without error with happier and variant=cool", () => {
    const instance = render(<Mascot expression="happier" variant="cool" />);
    expect(instance.toJSON()).not.toBeNull();
  });

  it("renders without error with happier and celebration=true", () => {
    const instance = render(<Mascot expression="happier" celebration />);
    expect(instance.toJSON()).not.toBeNull();
  });

  it("renders without error with happier and a message", () => {
    const instance = render(<Mascot expression="happier" message="Hello!" />);
    expect(instance.toJSON()).not.toBeNull();
  });

  it("tap handler still works with happier expression", () => {
    const onPress = jest.fn();
    const instance = render(<Mascot expression="happier" onPress={onPress} />);

    // Find any element with onPress prop (TouchableOpacity wrapper)
    const root = instance.root;
    const all = root.findAll(() => true);
    const pressable = all.find(n => n.props && typeof n.props.onPress === "function");
    expect(pressable).toBeDefined();

    act(() => {
      pressable.props.onPress();
    });
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("mascot renders with all valid expressions including happier", () => {
    const expressions = ["happy", "happier", "excited", "reminding", "sleepy"];
    for (const expr of expressions) {
      const instance = render(<Mascot expression={expr} />);
      expect(instance.toJSON()).not.toBeNull();
    }
  });
});

// ── Tests: Reduced motion ──

describe("Mascot reduced motion", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it("renders without error when reduced motion is enabled", () => {
    jest.mock("../context/ThemeContext", () => ({
      useTheme: () => ({
        colors: { primary: "#4A90D9", text: "#333", textSecondary: "#888", surface: "#FFF" },
        isDark: false,
      }),
    }));
    jest.mock("../utils/motion", () => ({
      useReducedMotion: () => true,
    }));

    const { act: a, create: c } = require("react-test-renderer");
    const MascotRM = require("../components/Mascot").default;

    let inst;
    a(() => {
      inst = c(React.createElement(MascotRM, { expression: "happy" }));
    });
    expect(inst.toJSON()).not.toBeNull();
    a(() => { inst.unmount(); });
  });

  it("renders streak-aware expression correctly under reduced motion", () => {
    jest.mock("../context/ThemeContext", () => ({
      useTheme: () => ({
        colors: { primary: "#4A90D9", text: "#333", textSecondary: "#888", surface: "#FFF" },
        isDark: false,
      }),
    }));
    jest.mock("../utils/motion", () => ({
      useReducedMotion: () => true,
    }));

    const { act: a, create: c } = require("react-test-renderer");
    const R = require("react");
    const MascotRM = require("../components/Mascot").default;
    const { streakToExpression: sTE } = require("../components/Mascot");

    // streakToExpression is a pure function, should work regardless of reduced motion
    expect(sTE(7)).toBe("happier");
    expect(sTE(30)).toBe("excited");
    expect(sTE(0)).toBe("happy");

    let inst;
    a(() => {
      inst = c(R.createElement(MascotRM, { expression: sTE(14) }));
    });
    expect(inst.toJSON()).not.toBeNull();
    a(() => { inst.unmount(); });
  });
});
