import React, { useEffect, useRef, useState, useMemo } from "react";
import { View, Text, TouchableOpacity, Animated, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";

export const BUBBLE_MESSAGES = [
  "Drink up!",
  "Stay hydrated!",
  "I'm wet!",
  "glug glug glug",
  "Water you doing?",
  "Thirsty? Same.",
  "H2-Oh yeah!",
  "Plenty of time!",
  "Splash!",
  "Don't forget!",
  "Cheers!",
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

const MASCOT_VARIANTS = [
  { id: "classic", label: "Classic", description: "The original Plenty drop", achievementId: null },
  { id: "cool",    label: "Cool",    description: "Sunglasses vibe",        achievementId: "century" },
  { id: "crown",   label: "Royal",   description: "You're the hydration king", achievementId: "seven_day_streak" },
  { id: "super",   label: "Super",   description: "Sparkle and shine",     achievementId: "five_hundred" },
];

export { MASCOT_VARIANTS };

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
  const { colors, isDark } = useTheme();
  const dropSide = size * 0.62;
  const f = dropSide / 100;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const blinkAnim = useRef(new Animated.Value(0)).current;
  const [isBlinking, setIsBlinking] = useState(false);
  const blinkTimerRef = useRef(null);
  const waveAnim = useRef(new Animated.Value(0)).current;

  const COLORS = {
    drop: variant === "super" ? "#9B59B6" : colors.primary,
    face: colors.text,
    blush: isDark ? "rgba(255, 130, 130, 0.15)" : "rgba(255, 130, 130, 0.3)",
    highlight: isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(255, 255, 255, 0.35)",
    lensBorder: colors.textSecondary,
  };

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

  // ── Idle float (gentle 6px bob, 2s cycle) ──
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  // ── Blink cycle (every 4-6s) ──
  useEffect(() => {
    const scheduleBlink = () => {
      const delay = 4000 + Math.random() * 2000;
      return setTimeout(() => {
        setIsBlinking(true);
        Animated.sequence([
          Animated.timing(blinkAnim, { toValue: 1, duration: 60, useNativeDriver: true }),
          Animated.timing(blinkAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
        ]).start(() => {
          setIsBlinking(false);
          blinkTimerRef.current = scheduleBlink();
        });
      }, delay);
    };
    blinkTimerRef.current = scheduleBlink();
    return () => {
      if (blinkTimerRef.current) clearTimeout(blinkTimerRef.current);
    };
  }, []);

  // ── Arm wave (gentle back-and-forth) ──
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(waveAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(waveAnim, { toValue: 0, duration: 1200, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const bounce = bounceAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [-8, 0, -8],
  });

  const floatOffset = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -6],
  });

  const waveRotation = waveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["-8deg", "8deg"],
  });

  // Combine float (idle) and bounce (celebration) — celebration overrides
  const translateY = useMemo(
    () => (celebration ? bounce : floatOffset),
    [celebration]
  );

  const content = (
    <Animated.View
      style={[
        styles.wrapper,
        { width: size, height: size * 1.05, transform: [{ translateY }] },
        style,
      ]}
    >
      {message && (
        <View style={[styles.bubbleOuter, { top: -(size * 0.35) }]}>
          <View style={[styles.bubble, { backgroundColor: colors.surface }]}>
            <Text style={[styles.bubbleText, { color: colors.text }]}>{message}</Text>
          </View>
          <View style={[styles.bubbleArrow, { borderTopColor: colors.surface }]} />
        </View>
      )}

      <View
        style={[
          styles.drop,
          {
            width: dropSide,
            height: dropSide,
            backgroundColor: COLORS.drop,
            borderTopLeftRadius: dropSide * 0.05,
            borderTopRightRadius: dropSide * 0.5,
            borderBottomLeftRadius: dropSide * 0.5,
            borderBottomRightRadius: dropSide * 0.5,
            shadowColor: COLORS.drop,
          },
        ]}
      >
        <View style={styles.face}>
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

          <View style={styles.eyesRow}>
            <Eye type={eyeType(expression, "left")} size={5.5 * f} faceColor={COLORS.face} blinking={isBlinking} />
            <View style={{ width: 10 * f }} />
            <Eye type={eyeType(expression, "right")} size={5.5 * f} faceColor={COLORS.face} blinking={isBlinking} />
          </View>

          <Mouth expression={expression} size={12 * f} faceColor={COLORS.face} />

          <View style={styles.blushRow}>
            <View style={[styles.blush, { width: 7 * f, height: 4 * f, borderRadius: 3.5 * f }]} />
            <View style={[styles.blush, { width: 7 * f, height: 4 * f, borderRadius: 3.5 * f }]} />
          </View>
        </View>
      </View>

      {/* ── Limbs ── */}
      <View style={[styles.armLeft, {
        width: dropSide * 0.2,
        height: dropSide * 0.09,
        borderRadius: dropSide * 0.045,
        backgroundColor: COLORS.drop,
        top: size * 0.37,
        left: -(dropSide * 0.08),
      }]} />
      <Animated.View style={[styles.armRight, {
        width: dropSide * 0.2,
        height: dropSide * 0.09,
        borderRadius: dropSide * 0.045,
        backgroundColor: COLORS.drop,
        top: size * 0.37,
        right: -(dropSide * 0.08),
        transform: [{ rotate: waveRotation }],
      }]} />
      {variant !== "super" && (
        <View style={[styles.legs, { top: size * 0.86 }]}>
          <View style={[styles.leg, {
            width: dropSide * 0.1,
            height: dropSide * 0.14,
            borderRadius: dropSide * 0.05,
            backgroundColor: COLORS.drop,
          }]} />
          <View style={[styles.leg, {
            width: dropSide * 0.1,
            height: dropSide * 0.14,
            borderRadius: dropSide * 0.05,
            backgroundColor: COLORS.drop,
          }]} />
        </View>
      )}

      <Accessory variant={variant} size={dropSide} />
    </Animated.View>
  );

  if (onPress) {
    return <TouchableOpacity onPress={onPress} activeOpacity={0.7}>{content}</TouchableOpacity>;
  }
  return content;
}

function Accessory({ variant, size }) {
  const { colors } = useTheme();
  const s = size / 100;

  if (variant === "cool") {
    return (
      <View style={[styles.accessory, { top: size * 0.23 }]}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 2 * s }}>
          <View style={[styles.lens, { width: 12 * s, height: 8 * s, borderRadius: 3 * s, backgroundColor: "#1A3A5C", borderColor: "#2C3E50" }]} />
          <View style={{ width: 6 * s, height: 2 * s, backgroundColor: "#1A3A5C" }} />
          <View style={[styles.lens, { width: 12 * s, height: 8 * s, borderRadius: 3 * s, backgroundColor: "#1A3A5C", borderColor: "#2C3E50" }]} />
        </View>
      </View>
    );
  }

  if (variant === "crown") {
    return (
      <View style={[styles.accessory, { top: -size * 0.1 }]}>
        <Ionicons name="ribbon" size={20 * (s / 0.62)} color="#FFD700" style={{ marginTop: -4 }} />
      </View>
    );
  }

  if (variant === "super") {
    return (
      <>
        <View style={[styles.accessory, { top: -size * 0.15, left: -size * 0.15 }]}>
          <Ionicons name="sparkles" size={10 * (s / 0.62)} color="#FFD700" />
        </View>
        <View style={[styles.accessory, { top: -size * 0.1, right: -size * 0.15 }]}>
          <Ionicons name="star" size={8 * (s / 0.62)} color="#FFD700" />
        </View>
      </>
    );
  }

  return null;
}

function Eye({ type, size, faceColor, blinking }) {
  if (blinking) {
    return <View style={{ width: size * 1.1, height: 1.5, borderRadius: 1, backgroundColor: faceColor }} />;
  }
  const half = size / 2;
  if (type === "circle") {
    return <View style={{ width: size, height: size, borderRadius: half, backgroundColor: faceColor }} />;
  }
  if (type === "big") {
    return <View style={{ width: size * 1.3, height: size * 1.3, borderRadius: (size * 1.3) / 2, backgroundColor: faceColor }} />;
  }
  return <View style={{ width: size * 1.5, height: 2.2, borderRadius: 1.5, backgroundColor: faceColor }} />;
}

function Mouth({ expression, size, faceColor }) {
  const w = size * 0.7;
  if (expression === "happy" || expression === "reminding") {
    return (
      <View style={{ marginTop: 4, width: w, height: w * 0.35, borderBottomLeftRadius: w * 0.4, borderBottomRightRadius: w * 0.4, borderBottomWidth: 2.5, borderBottomColor: faceColor }} />
    );
  }
  if (expression === "excited") {
    return (
      <View style={{ marginTop: 4, width: w * 0.5, height: w * 0.5, borderRadius: w * 0.25, backgroundColor: faceColor }} />
    );
  }
  return (
    <View style={{ marginTop: 4, width: w * 0.5, height: w * 0.2, borderBottomLeftRadius: w * 0.1, borderBottomRightRadius: w * 0.1, borderBottomWidth: 2, borderBottomColor: faceColor }} />
  );
}

function eyeType(expression, side) {
  const MAP = {
    happy: { left: "circle", right: "circle" },
    excited: { left: "big", right: "big" },
    reminding: { left: "line", right: "circle" },
    sleepy: { left: "line", right: "line" },
  };
  return (MAP[expression] || MAP.happy)[side];
}

const styles = StyleSheet.create({
  wrapper: { alignItems: "center", justifyContent: "center" },
  drop: {
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "45deg" }],
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
  shimmer: { position: "absolute", backgroundColor: "rgba(255, 255, 255, 0.35)" },
  eyesRow: { flexDirection: "row", alignItems: "center", marginTop: "-8%" },
  blushRow: {
    position: "absolute",
    flexDirection: "row",
    justifyContent: "space-between",
    width: "130%",
    top: "55%",
  },
  blush: { backgroundColor: "rgba(255, 130, 130, 0.3)" },
  accessory: { position: "absolute", zIndex: 5 },
  lens: { borderWidth: 1 },
  bubbleOuter: { position: "absolute", left: 0, right: 0, alignItems: "center", zIndex: 10 },
  bubble: {
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
  bubbleText: { fontSize: 13, fontWeight: "600", textAlign: "center" },
  bubbleArrow: {
    width: 0, height: 0,
    borderLeftWidth: 8, borderRightWidth: 8, borderTopWidth: 8,
    borderLeftColor: "transparent", borderRightColor: "transparent",
    marginTop: -1,
  },
  armLeft: { position: "absolute", zIndex: 3 },
  armRight: { position: "absolute", zIndex: 3 },
  legs: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    zIndex: 3,
  },
  leg: {},
});
