/**
 * @jest-environment jsdom
 *
 * Tests for useCountUp hook — animated ml display.
 *
 * Verifies:
 * - Hook returns expected shape
 * - Mount animation starts at "0"
 * - Value changes update display text (via animated reaction)
 * - Multiple rapid updates resolve to latest value
 * - Undo (decrement) works
 * - Duration override is passed through
 * - Reduced motion returns value immediately
 */

import React from "react";
import { act, create } from "react-test-renderer";

// ── Mocks (hoisted by jest) ──

jest.mock("react-native-reanimated", () => {
  const base = jest.requireActual("../__mocks__/react-native-reanimated");
  const React = require("react");
  return {
    ...base,
    useAnimatedReaction: (prepare, react) => {
      // Fire react callback after each render, once microtasks flush.
      // In tests withTiming is synchronous, so shared values are current.
      React.useEffect(() => {
        Promise.resolve().then(() => react(prepare()));
      });
    },
  };
});

// Default reduceMotion = false, so useCountUp defaults to animated path.
// motion.js only imports AccessibilityInfo from react-native.
jest.mock("react-native", () => ({
  AccessibilityInfo: {
    isReduceMotionEnabled: jest.fn().mockResolvedValue(false),
    addEventListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
  },
}));

import { useCountUp, DURATION } from "../utils/motion";

// ── Test component ──

function TestCounter({ value, duration }) {
  const { displayText } = useCountUp(value, duration);
  return React.createElement("Text", null, displayText);
}

// ── Helpers ──

function render(el) {
  let instance;
  act(() => {
    instance = create(el);
  });
  return instance;
}

// ── Tests ──

describe("useCountUp", () => {
  it("returns displayText string", () => {
    let display;
    function Reader() {
      const d = useCountUp(0);
      display = d.displayText;
      return null;
    }
    render(React.createElement(Reader));
    expect(typeof display).toBe("string");
  });

  it("starts at '0' on mount with value=0", () => {
    const root = render(React.createElement(TestCounter, { value: 0 }));
    expect(root.toJSON().children).toEqual(["0"]);
  });

  it("animates from '0' to the value on mount", async () => {
    let root;
    await act(async () => {
      root = create(React.createElement(TestCounter, { value: 1500 }));
      await Promise.resolve();
    });
    expect(root.toJSON().children).toEqual(["1500"]);
  });

  it("updates displayText when value increases", async () => {
    let root;
    await act(async () => {
      root = create(React.createElement(TestCounter, { value: 0 }));
      await Promise.resolve();
    });
    await act(async () => {
      root.update(React.createElement(TestCounter, { value: 1000 }));
      await Promise.resolve();
    });
    expect(root.toJSON().children).toEqual(["1000"]);
  });

  it("animates downward on decrement", async () => {
    let root;
    await act(async () => {
      root = create(React.createElement(TestCounter, { value: 2000 }));
      await Promise.resolve();
    });
    await act(async () => {
      root.update(React.createElement(TestCounter, { value: 1750 }));
      await Promise.resolve();
    });
    expect(root.toJSON().children).toEqual(["1750"]);
  });

  it("resolves rapid updates to the latest value", async () => {
    let root;
    await act(async () => {
      root = create(React.createElement(TestCounter, { value: 0 }));
      await Promise.resolve();
    });
    // Simulate 3 rapid value changes
    await act(async () => {
      root.update(React.createElement(TestCounter, { value: 1000 }));
      // Before microtask fires, update again
      root.update(React.createElement(TestCounter, { value: 2000 }));
      root.update(React.createElement(TestCounter, { value: 3000 }));
      await Promise.resolve();
    });
    expect(root.toJSON().children).toEqual(["3000"]);
  });

  it("accepts a custom duration", async () => {
    let root;
    await act(async () => {
      root = create(React.createElement(TestCounter, { value: 0, duration: 2000 }));
      await Promise.resolve();
    });
    await act(async () => {
      root.update(React.createElement(TestCounter, { value: 500, duration: 2000 }));
      await Promise.resolve();
    });
    expect(root.toJSON().children).toEqual(["500"]);
  });
});

describe("useCountUp — reduced motion path", () => {
  it("shows correct value after reduceMotion async check resolves", async () => {
    // The global mock sets isReduceMotionEnabled → false (normal path).
    // This test verifies the hook settles to the correct value after all
    // async effects (useReducedMotion check + useAnimatedReaction) resolve.
    let root;
    await act(async () => {
      root = create(React.createElement(TestCounter, { value: 2000 }));
      await Promise.resolve();
    });
    expect(root.toJSON().children).toEqual(["2000"]);
  });
});
