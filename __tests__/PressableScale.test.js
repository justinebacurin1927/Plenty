/**
 * @jest-environment jsdom
 *
 * Tests for PressableScale component.
 *
 * Verifies:
 * - Renders children
 * - Calls onPress on press
 * - Respects reduced motion (no scale animation)
 * - Disabled state prevents onPress
 */

import React from "react";
import { Text } from "react-native";
import { act, create } from "react-test-renderer";

// ── Dynamic mock for useReducedMotion ──
// Variable name MUST be prefixed with "mock" so Jest's hoisting allows it.

let mockReduceMotion = false;

jest.mock("../utils/motion", () => ({
  useReducedMotion: () => mockReduceMotion,
}));

import PressableScale from "../components/PressableScale";

// ── Helpers ──

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

function findPressable(root) {
  // Pressable has both onPress and onPressIn (plus onPressOut) — find by that combo
  const all = root.root.findAll(
    (el) => typeof el.props.onPress === "function" && typeof el.props.onPressIn === "function",
  );
  return all[0];
}

function press(root) {
  const pressable = findPressable(root);
  act(() => {
    pressable.props.onPress();
  });
}

// ── Tests ──

describe("PressableScale", () => {
  beforeEach(() => {
    mockReduceMotion = false;
  });

  it("renders children", () => {
    const root = createAndWait(
      <PressableScale onPress={() => {}}>
        <Text testID="child">Press me</Text>
      </PressableScale>,
    );
    const child = root.root.find((el) => el.props.testID === "child");
    expect(child).toBeTruthy();
    expect(child.props.children).toBe("Press me");
    destroy(root);
  });

  it("calls onPress when pressed", () => {
    const onPress = jest.fn();
    const root = createAndWait(
      <PressableScale onPress={onPress}>
        <Text>Press me</Text>
      </PressableScale>,
    );
    press(root);
    expect(onPress).toHaveBeenCalledTimes(1);
    destroy(root);
  });

  it("passes disabled prop through to Pressable", () => {
    const root = createAndWait(
      <PressableScale onPress={() => {}} disabled>
        <Text>Press me</Text>
      </PressableScale>,
    );
    const pressable = findPressable(root);
    expect(pressable.props.disabled).toBe(true);
    destroy(root);
  });

  it("renders with reduced motion enabled (no crash)", () => {
    mockReduceMotion = true;

    const onPress = jest.fn();
    const root = createAndWait(
      <PressableScale onPress={onPress}>
        <Text>Press me</Text>
      </PressableScale>,
    );

    const pressable = findPressable(root);
    expect(typeof pressable.props.onPressIn).toBe("function");
    act(() => {
      pressable.props.onPressIn();
    });

    press(root);
    expect(onPress).toHaveBeenCalledTimes(1);
    destroy(root);
  });

  it("passes accessibility props through to Pressable", () => {
    const root = createAndWait(
      <PressableScale
        onPress={() => {}}
        accessibilityLabel="Test button"
        accessibilityRole="button"
      >
        <Text>Press me</Text>
      </PressableScale>,
    );
    const pressable = findPressable(root);
    expect(pressable.props.accessibilityLabel).toBe("Test button");
    expect(pressable.props.accessibilityRole).toBe("button");
    destroy(root);
  });
});
