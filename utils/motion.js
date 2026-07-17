/**
 * Animation presets and hooks for Reanimated-based animations.
 *
 * Follows AD-11: Reanimated as the single animation layer.
 * Existing Animated-based code (Mascot.js, AchievementPopup) is grandfathered.
 */
import { AccessibilityInfo } from "react-native";
import { useState, useEffect } from "react";

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
