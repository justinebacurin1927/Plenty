import React, { useEffect, useRef, useState } from "react";
import { View, Animated, AccessibilityInfo, StyleSheet } from "react-native";

/**
 * Flame tiers based on streak length.
 * Returns config or null (tier 0 = no flame).
 */
export function getFlameTier(streakLength) {
  if (typeof streakLength !== "number" || Number.isNaN(streakLength) || streakLength < 7) {
    return null;
  }
  if (streakLength < 30) {
    return { tier: 1, colors: { outer: "rgba(255,140,66,0.25)", mid: "#FF8C42", core: "#FFD700" }, size: 24 };
  }
  if (streakLength < 100) {
    return { tier: 2, colors: { outer: "rgba(255,107,53,0.3)", mid: "#FF6B35", core: "#FFA500" }, size: 32 };
  }
  return { tier: 3, colors: { outer: "rgba(255,215,0,0.35)", mid: "#FF8C00", core: "#FFF8DC" }, size: 40 };
}

const BASE_DURATIONS = {
  outer: { up: 400, down: 350, hold: 200 },
  mid: { up: 200, down: 180, hold: 120 },
  core: { up: 120, down: 100, hold: 80 },
};

function flickerAnimation(animValue, durations) {
  const { up, down, hold } = durations;
  return Animated.loop(
    Animated.sequence([
      Animated.timing(animValue, { toValue: 0.7, duration: down, useNativeDriver: true }),
      Animated.timing(animValue, { toValue: 1, duration: up, useNativeDriver: true }),
      Animated.timing(animValue, { toValue: 0.85, duration: hold, useNativeDriver: true }),
      Animated.timing(animValue, { toValue: 1, duration: up, useNativeDriver: true }),
    ])
  );
}

export default function StreakFlame({ streakLength, style }) {
  const [reduceMotion, setReduceMotion] = useState(null);

  const outerOpacity = useRef(new Animated.Value(1)).current;
  const midScale = useRef(new Animated.Value(1)).current;
  const coreScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    try {
      AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => {});
    } catch (_) {}
  }, []);

  useEffect(() => {
    const config = getFlameTier(streakLength);
    if (!config || reduceMotion !== false) return;

    const speed = config.tier === 3 ? 2.5 : config.tier === 2 ? 1.5 : 1;
    const scale = (d) => ({ up: Math.round(d.up / speed), down: Math.round(d.down / speed), hold: Math.round(d.hold / speed) });

    const outerAnim = flickerAnimation(outerOpacity, scale(BASE_DURATIONS.outer));
    const midAnim = flickerAnimation(midScale, scale(BASE_DURATIONS.mid));
    const coreAnim = flickerAnimation(coreScale, scale(BASE_DURATIONS.core));

    try {
      if (outerAnim) outerAnim.start();
      if (midAnim) midAnim.start();
      if (coreAnim) coreAnim.start();
    } catch (_) {
      // Animation may throw in test environments without native driver
    }

    return () => {
      try {
        if (outerAnim) outerAnim.stop();
        if (midAnim) midAnim.stop();
        if (coreAnim) coreAnim.stop();
      } catch (_) {}
    };
  }, [streakLength, reduceMotion]);

  const config = streakLength != null ? getFlameTier(streakLength) : null;
  if (!config || reduceMotion === null) return null;

  const { colors, size } = config;
  const outerSize = size * 2;
  const midSize = size * 1.2;
  const coreSize = size * 0.6;

  return (
    <View style={[styles.wrapper, { width: outerSize, height: outerSize }, style]}>
      {/* Outer glow */}
      <Animated.View
        style={[
          styles.layer,
          {
            width: outerSize,
            height: outerSize,
            borderRadius: outerSize / 2,
            backgroundColor: colors.outer,
            opacity: reduceMotion ? 0.35 : outerOpacity,
          },
        ]}
      />
      {/* Mid flame */}
      <Animated.View
        style={[
          styles.layer,
          {
            width: midSize,
            height: midSize,
            borderRadius: midSize / 2,
            backgroundColor: colors.mid,
            transform: [{ scale: reduceMotion ? 1 : midScale }],
          },
        ]}
      />
      {/* Core */}
      <Animated.View
        style={[
          styles.layer,
          {
            width: coreSize,
            height: coreSize,
            borderRadius: coreSize / 2,
            backgroundColor: colors.core,
            transform: [{ scale: reduceMotion ? 1 : coreScale }],
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  layer: {
    position: "absolute",
  },
});
