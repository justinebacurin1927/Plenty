/**
 * @jest-environment jsdom
 *
 * Tests for Toast component — non-blocking log confirmation.
 *
 * Verifies:
 * - Renders with message text
 * - Auto-dismisses after 2s
 * - Respects reduced motion (appears instantly, no animation)
 * - Single toast at a time — new message replaces pending
 * - Does not render when not visible
 */

import React from "react";
import { act, create } from "react-test-renderer";

// ── Dynamic mock for useReducedMotion ──

let mockReduceMotion = false;

jest.mock("../utils/motion", () => ({
  useReducedMotion: () => mockReduceMotion,
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ bottom: 0, top: 0, left: 0, right: 0 }),
}));

jest.mock("../context/ThemeContext", () => ({
  useTheme: () => ({
    colors: { success: "#34C759", textOnSuccess: "#fff" },
    isDark: false,
  }),
  default: {},
}));

import Toast from "../components/Toast";

// ── Helpers ──

beforeEach(() => {
  jest.useFakeTimers();
  mockReduceMotion = false;
});

afterEach(() => {
  jest.useRealTimers();
});

function createAndWait(el) {
  let root;
  act(() => {
    root = create(el);
  });
  return root;
}

function destroy(root) {
  act(() => {
    root.unmount();
  });
}

function findToastByText(root, text) {
  const all = root.root.findAll(
    (el) =>
      typeof el.type === "string" &&
      el.children &&
      el.children.some((c) => typeof c === "string" && c.includes(text))
  );
  return all.length > 0 ? all[0] : null;
}

// ── Tests ──

test("renders with message text when visible", () => {
  const onDismiss = jest.fn();
  const root = createAndWait(
    <Toast message="+250ml logged!" visible={true} onDismiss={onDismiss} />
  );

  expect(findToastByText(root, "+250ml logged!")).not.toBeNull();

  destroy(root);
});

test("does not render when not visible", () => {
  const onDismiss = jest.fn();
  const root = createAndWait(
    <Toast message="250ml logged!" visible={false} onDismiss={onDismiss} />
  );

  // Should render nothing
  const json = root.toJSON();
  expect(json).toBeNull();

  destroy(root);
});

test("does not render when message is empty", () => {
  const onDismiss = jest.fn();
  const root = createAndWait(
    <Toast message="" visible={true} onDismiss={onDismiss} />
  );

  const json = root.toJSON();
  expect(json).toBeNull();

  destroy(root);
});

test("auto-dismisses after 2 seconds", () => {
  const onDismiss = jest.fn();
  const root = createAndWait(
    <Toast message="250ml logged!" visible={true} onDismiss={onDismiss} />
  );

  expect(onDismiss).not.toHaveBeenCalled();

  // Fast-forward 2 seconds
  act(() => {
    jest.advanceTimersByTime(2000);
  });

  expect(onDismiss).toHaveBeenCalledTimes(1);

  destroy(root);
});

test("respects reduced motion — renders instantly without animation", () => {
  mockReduceMotion = true;
  const onDismiss = jest.fn();

  const root = createAndWait(
    <Toast message="250ml logged!" visible={true} onDismiss={onDismiss} />
  );

  // Should render with message
  expect(findToastByText(root, "250ml logged!")).not.toBeNull();

  // Should still auto-dismiss after 2s
  act(() => {
    jest.advanceTimersByTime(2000);
  });
  expect(onDismiss).toHaveBeenCalledTimes(1);

  destroy(root);
});

test("new message replaces pending toast", () => {
  const onDismiss = jest.fn();
  let root = null;

  act(() => {
    root = create(
      <Toast message="250ml logged!" visible={true} onDismiss={onDismiss} />
    );
  });

  // Rerender with different message
  act(() => {
    root.update(
      <Toast message="500ml logged!" visible={true} onDismiss={onDismiss} />
    );
  });

  // New message should be visible
  expect(findToastByText(root, "500ml logged!")).not.toBeNull();
  // Old message should not be visible
  expect(findToastByText(root, "250ml logged!")).toBeNull();

  destroy(root);
});

test("clears timeout on unmount", () => {
  const onDismiss = jest.fn();
  const root = createAndWait(
    <Toast message="250ml logged!" visible={true} onDismiss={onDismiss} />
  );

  destroy(root);

  // Advance past 2s — should NOT fire onDismiss (cleared on unmount)
  act(() => {
    jest.advanceTimersByTime(2000);
  });

  expect(onDismiss).not.toHaveBeenCalled();
});
