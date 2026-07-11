import React, { useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, Animated, StyleSheet } from "react-native";

const COLORS = {
  drop: "#4A90D9",
  dropLight: "#6BB3F0",
  face: "#1A3A5C",
  blush: "rgba(255, 130, 130, 0.3)",
  highlight: "rgba(255, 255, 255, 0.35)",
  gold: "#F1C40F",
};

/**
 * A friendly water-droplet mascot for Plenty.
 *
 * Props:
 *   size       – overall visible height (default 120)
 *   expression – "happy" | "excited" | "reminding" | "sleepy"
 *   variant    – "classic" | "cool" | "crown" | "super"
 *   celebration – boolean — triggers bounce animation
 *   onPress    – optional tap handler
 *   message    – optional speech bubble text
 *   style      – optional View style
 */
export const BUBBLE_MESSAGES = [
  "💧 Drink up!",
  "Stay hydrated!",
  "I'm wet!",
  "glug glug glug",
  "Water you doing?",
  "Thirsty? Same.",
  "H2-Oh yeah!",
  "Plenty of time!",
  "Splash! 💦",
  "Don't forget!",
  "Cheers! 🥤",
  "Drip drop!",
  "Water is life!",
  "Make a splash!",
  "You're on a roll!",
  "Keep flowing!",
  "I'm all wet!",
  "Hydrate or die!",
  "More water!",
  "Just keep swimming!",
];

export const MASCOT_VARIANTS = [
  { id: "classic", label: "Classic", description: "The original Plenty drop", achievementId: null },
  { id: "cool",    label: "Cool",    description: "Sunglasses vibe",        achievementId: "century" },
  { id: "crown",   label: "Royal",   description: "You're the hydration king", achievementId: "seven_day_streak" },
  { id: "super",   label: "Super",   description: "Sparkle and shine",     achievementId: "five_hundred" },
];

export function getRandomMessage() {
  return BUBBLE_MESSAGES[Math.floor(Math.random() * BUBBLE_MESSAGES.length)];
}

export function streakToExpression(streak) {
  if (streak >= 30) return "excited";
  if (streak >= 14) return "happy";
  if (streak >= 7)  return "happy";
  return "happy";
}

export default function Mascot({
  size = 120,
  expression = "happy",
  variant = "classic",
  celebration = false,
  onPress,
  message = null,
  style,
}) {
  const dropSide = size * 0.62;
  const f = dropSide / 100;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  // ── Celebration bounce animation (D2) ──
  useEffect(() => {
    if (!celebration) {
      bounceAnim.setValue(0);
      return;
    }
    const sequence = Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
        Animated.timing(bounceAnim, { toValue: -1, duration: 150, useNativeDriver: true }),
        Animated.timing(bounceAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.delay(400),
      ]),
      { iterations: 3 }
    );
    sequence.start();
    return () => sequence.stop();
  }, [celebration]);

  const bounce = bounceAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [-8, 0, -8],
  });

  const content = (
    <Animated.View
      style={[
        styles.wrapper,
        { width: size, height: size * 1.05, transform: [{ translateY: celebration ? bounce : 0 }] },
        style,
      ]}
    >
      {/* speech bubble */}
      {message && (
        <View style={[styles.bubbleOuter, { top: -(size * 0.35) }]}>
          <View style={styles.bubble}>
            <Text style={styles.bubbleText}>{message}</Text>
          </View>
          <View style={styles.bubbleArrow} />
        </View>
      )}

      {/* rotated droplet */}
      <View
        style={[
          styles.drop,
          {
            width: dropSide,
            height: dropSide,
            backgroundColor: variant === "super" ? "#9B59B6" : COLORS.drop,
            borderTopLeftRadius: dropSide * 0.05,
            borderTopRightRadius: dropSide * 0.5,
            borderBottomLeftRadius: dropSide * 0.5,
            borderBottomRightRadius: dropSide * 0.5,
          },
        ]}
      >
        {/* face – counter-rotated */}
        <View style={styles.face}>
          {/* shimmer */}
          <View
            style={[
              styles.shimmer,
              {
                width: 14 * f,
                height: 8 * f,
                borderRadius: 4 * f,
                top: -14 * f,
                left: -8 * f,
              },
            ]}
          />

          {/* eyes */}
          <View style={styles.eyesRow}>
            <Eye type={eyeType(expression, "left")} size={5.5 * f} />
            <View style={{ width: 10 * f }} />
            <Eye type={eyeType(expression, "right")} size={5.5 * f} />
          </View>

          {/* mouth */}
          <Mouth expression={expression} size={12 * f} />

          {/* blush */}
          <View style={styles.blushRow}>
            <View style={[styles.blush, { width: 7 * f, height: 4 * f, borderRadius: 3.5 * f }]} />
            <View style={[styles.blush, { width: 7 * f, height: 4 * f, borderRadius: 3.5 * f }]} />
          </View>
        </View>
      </View>

      {/* ── Accessories (D3) ── */}
      <Accessory variant={variant} size={dropSide} />
    </Animated.View>
  );

  if (onPress) {
    return <TouchableOpacity onPress={onPress} activeOpacity={0.7}>{content}</TouchableOpacity>;
  }
  return content;
}

/* ─── Accessory overlay (D3) ───────────── */

function Accessory({ variant, size }) {
  const s = size / 100; // scale factor

  if (variant === "cool") {
    return (
      <View style={[styles.accessory, { top: size * 0.23 }]}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 2 * s }}>
          <View style={[styles.lens, { width: 12 * s, height: 8 * s, borderRadius: 3 * s }]} />
          <View style={{ width: 6 * s, height: 2 * s, backgroundColor: "#1A3A5C" }} />
          <View style={[styles.lens, { width: 12 * s, height: 8 * s, borderRadius: 3 * s }]} />
        </View>
      </View>
    );
  }

  if (variant === "crown") {
    return (
      <View style={[styles.accessory, { top: -size * 0.1 }]}>
        <Text style={{ fontSize: 20 * (s / 0.62), marginTop: -4 }}>👑</Text>
      </View>
    );
  }

  if (variant === "super") {
    return (
      <>
        <View style={[styles.accessory, { top: -size * 0.15, left: -size * 0.15 }]}>
          <Text style={{ fontSize: 10 * (s / 0.62) }}>✨</Text>
        </View>
        <View style={[styles.accessory, { top: -size * 0.1, right: -size * 0.15 }]}>
          <Text style={{ fontSize: 8 * (s / 0.62) }}>⭐</Text>
        </View>
      </>
    );
  }

  return null;
}

/* ─── Eye sub-component ─────────────────── */

function Eye({ type, size }) {
  const half = size / 2;
  if (type === "circle") {
    return <View style={{ width: size, height: size, borderRadius: half, backgroundColor: COLORS.face }} />;
  }
  if (type === "big") {
    return <View style={{ width: size * 1.3, height: size * 1.3, borderRadius: (size * 1.3) / 2, backgroundColor: COLORS.face }} />;
  }
  return <View style={{ width: size * 1.5, height: 2.2, borderRadius: 1.5, backgroundColor: COLORS.face }} />;
}

/* ─── Mouth sub-component ───────────────── */

function Mouth({ expression, size }) {
  const w = size * 0.7;
  if (expression === "happy" || expression === "reminding") {
    return (
      <View style={{ marginTop: 4, width: w, height: w * 0.35, borderBottomLeftRadius: w * 0.4, borderBottomRightRadius: w * 0.4, borderBottomWidth: 2.5, borderBottomColor: COLORS.face }} />
    );
  }
  if (expression === "excited") {
    return (
      <View style={{ marginTop: 4, width: w * 0.5, height: w * 0.5, borderRadius: w * 0.25, backgroundColor: COLORS.face }} />
    );
  }
  return (
    <View style={{ marginTop: 4, width: w * 0.5, height: w * 0.2, borderBottomLeftRadius: w * 0.1, borderBottomRightRadius: w * 0.1, borderBottomWidth: 2, borderBottomColor: COLORS.face }} />
  );
}

/* ─── Expression helpers ────────────────── */

function eyeType(expression, side) {
  const MAP = {
    happy: { left: "circle", right: "circle" },
    excited: { left: "big", right: "big" },
    reminding: { left: "line", right: "circle" },
    sleepy: { left: "line", right: "line" },
  };
  return (MAP[expression] || MAP.happy)[side];
}

/* ─── Styles ────────────────────────────── */

const styles = StyleSheet.create({
  wrapper: { alignItems: "center", justifyContent: "center" },
  drop: {
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "45deg" }],
    shadowColor: COLORS.drop,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  face: {
    transform: [{ rotate: "-45deg" }],
    alignItems: "center",
    justifyContent: "center",
    marginTop: "12%",
  },
  shimmer: { position: "absolute", backgroundColor: COLORS.highlight },
  eyesRow: { flexDirection: "row", alignItems: "center", marginTop: "-8%" },
  blushRow: {
    position: "absolute",
    flexDirection: "row",
    justifyContent: "space-between",
    width: "130%",
    top: "55%",
  },
  blush: { backgroundColor: COLORS.blush },
  accessory: { position: "absolute", zIndex: 5 },
  lens: { backgroundColor: "#1A3A5C", borderWidth: 1, borderColor: "#2C3E50" },
  bubbleOuter: { position: "absolute", left: 0, right: 0, alignItems: "center", zIndex: 10 },
  bubble: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    maxWidth: 180,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
  },
  bubbleText: { fontSize: 13, color: "#1A3A5C", fontWeight: "600", textAlign: "center" },
  bubbleArrow: {
    width: 0, height: 0,
    borderLeftWidth: 8, borderRightWidth: 8, borderTopWidth: 8,
    borderLeftColor: "transparent", borderRightColor: "transparent", borderTopColor: "#fff",
    marginTop: -1,
  },
});
