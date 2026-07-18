/**
 * Animation presets and hooks for Reanimated-based animations.
 *
 * Follows AD-11: Reanimated as the single animation layer.
 * Existing Animated-based code (Mascot.js, AchievementPopup) is grandfathered.
 */
import { AccessibilityInfo } from "react-native";
import { useState, useEffect, useRef } from "react";
import {
  useSharedValue,
  withTiming,
  cancelAnimation,
  useAnimatedReaction,
  runOnJS,
} from "react-native-reanimated";

/**
 * Hook that returns true when the user prefers reduced motion.
 *
 * Uses AccessibilityInfo.isReduceMotionEnabled() for system-level detection
 * and listens for runtime changes via the reduceMotionChanged event.
 *
 * @returns {boolean} true if animations should be reduced
 */
export function useReducedMotion() {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let mounted = true;

    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (mounted) setReduceMotion(enabled);
      })
      .catch(() => {
        // Gracefully degrade if API is unavailable
      });

    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      (enabled) => {
        if (mounted) setReduceMotion(enabled);
      }
    );

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return reduceMotion;
}

/**
 * Preset animation durations in milliseconds.
 */
export const DURATION = {
  fast: 200,
  normal: 400,
  slow: 600,
  waveCycle: 3000,
};

/**
 * Hook that returns an animated display string for a numeric value.
 *
 * On `value` change, the displayed number animates smoothly via Reanimated's
 * `withTiming` (~400ms). The animation is display-only — callers should still
 * use the raw `value` for calculations.
 *
 * On reduced motion, returns the value instantly (no shared values created).
 *
 * @param {number} value - The current real value to animate toward
 * @param {number} [duration=400] - Animation duration in ms
 * @returns {{ displayText: string }} Animated display-ready string
 */
export function useCountUp(value, duration = DURATION.normal) {
  const reduceMotion = useReducedMotion();

  // Start at "0" on mount for a satisfying initial animation.
  // On reduced motion, show the value immediately.
  const [displayText, setDisplayText] = useState(() =>
    reduceMotion ? String(Math.round(value)) : "0"
  );

  // Shared value that animates over time. Only created once per hook mount.
  const countUp = useSharedValue(0);

  // Ref tracks the live reduceMotion value across renders so the
  // useAnimatedReaction callback (which is registered once) can guard on it.
  const reduceMotionRef = useRef(reduceMotion);
  reduceMotionRef.current = reduceMotion;

  // Animate when `value` or `reduceMotion` changes.
  useEffect(() => {
    if (reduceMotion) {
      // Reduced motion: skip animation, show value directly.
      setDisplayText(String(Math.round(value)));
      return;
    }

    // Cancel any in-flight animation, then start fresh toward the new target.
    cancelAnimation(countUp);
    countUp.value = withTiming(value, { duration });

    return () => cancelAnimation(countUp);
  }, [value, duration, reduceMotion, countUp]);

  // Drive the display string from the animated shared value.
  // `runOnJS` bridges the UI-thread worklet to the JS-thread setState.
  // The reduceMotionRef guard prevents overriding the display value when
  // reduced motion is active (where countUp stays at 0 because animation
  // was skipped).
  useAnimatedReaction(
    () => countUp.value,
    (current) => {
      if (!reduceMotionRef.current) {
        runOnJS(setDisplayText)(String(Math.round(current)));
      }
    },
    [countUp]
  );

  return { displayText };
}
