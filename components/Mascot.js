import React, { useEffect, useRef, useState, useMemo } from "react";
import { View, Text, TouchableOpacity, Animated, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { useReducedMotion } from "../utils/motion";
import Svg, { Path, Ellipse, Circle, Defs, LinearGradient, Stop, RadialGradient } from "react-native-svg";

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
  if (streak >= 7) return "happier";
  return "happy";
}

/**
 * SVG-based mascot body — glossy teardrop with no limbs, matching
 * the floating_droplet_slime.svg design from the brand kit.
 */
function SvgBody({ size, expression, isBlinking, variant }) {
  const w = size;
  const h = size * 1.05;

  function Eyes() {
    if (isBlinking || expression === "sleepy") {
      // Closed eyes — curved arcs
      return (
        <>
          <Path d="M292,272 Q306,260 320,272" fill="none" stroke="#04342C" strokeWidth={4} strokeLinecap="round" />
          <Path d="M360,272 Q374,260 388,272" fill="none" stroke="#04342C" strokeWidth={4} strokeLinecap="round" />
        </>
      );
    }
    if (expression === "reminding") {
      // Wink — left closed, right open
      return (
        <>
          <Path d="M292,272 Q306,260 320,272" fill="none" stroke="#04342C" strokeWidth={4} strokeLinecap="round" />
          <Ellipse cx={374} cy={270} rx={9} ry={13} fill="#04342C" />
          <Circle cx={377} cy={265} r={2.5} fill="#EFFFF9" />
        </>
      );
    }
    // Open eyes — big for "happier"/"excited", normal otherwise
    const big = expression === "happier" || expression === "excited";
    return (
      <>
        <Ellipse cx={306} cy={270} rx={big ? 11 : 9} ry={big ? 16 : 13} fill="#04342C" />
        <Ellipse cx={374} cy={270} rx={big ? 11 : 9} ry={big ? 16 : 13} fill="#04342C" />
        <Circle cx={big ? 310 : 309} cy={big ? 264 : 265} r={big ? 3 : 2.5} fill="#EFFFF9" />
        <Circle cx={big ? 378 : 377} cy={big ? 264 : 265} r={big ? 3 : 2.5} fill="#EFFFF9" />
      </>
    );
  }

  function Mouth() {
    if (expression === "excited") {
      return <Ellipse cx={340} cy={312} rx={16} ry={10} fill="#04342C" />;
    }
    if (expression === "happier") {
      return <Path d="M300,302 Q340,342 380,302" fill="none" stroke="#04342C" strokeWidth={4.5} strokeLinecap="round" />;
    }
    if (expression === "sleepy") {
      return <Path d="M315,305 Q340,318 365,305" fill="none" stroke="#04342C" strokeWidth={3} strokeLinecap="round" />;
    }
    // Default smile (happy, reminding)
    return <Path d="M308,302 Q340,334 372,302" fill="none" stroke="#04342C" strokeWidth={4.5} strokeLinecap="round" />;
  }

  return (
    <Svg width={w} height={h} viewBox="0 0 680 450" preserveAspectRatio="xMidYMid meet">
      <Defs>
        <LinearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#7FE0BE" />
          <Stop offset="55%" stopColor="#3FBE92" />
          <Stop offset="100%" stopColor="#0F6E56" />
        </LinearGradient>
        <RadialGradient id="shineGrad" cx="35%" cy="30%" r="70%">
          <Stop offset="0%" stopColor="#EFFFF9" stopOpacity={0.85} />
          <Stop offset="100%" stopColor="#EFFFF9" stopOpacity={0} />
        </RadialGradient>
      </Defs>

      {/* Shadow */}
      <Ellipse cx={340} cy={385} rx={70} ry={12} fill="#0C447C" opacity={0.15} />

      {/* Body */}
      <Path
        d="M340,90 C340,90 250,225 250,300 C250,353 290,392 340,392 C390,392 430,353 430,300 C430,225 340,90 340,90 Z"
        fill="url(#bodyGrad)"
        stroke="#0A4D3C"
        strokeWidth={2.5}
      />
      <Path
        d="M340,90 C340,90 250,225 250,300 C250,353 290,392 340,392 C390,392 430,353 430,300 C430,225 340,90 340,90 Z"
        fill="url(#shineGrad)"
      />
      <Ellipse cx={295} cy={225} rx={14} ry={30} fill="#DFFFF3" opacity={0.4} />

      {/* Eyebrows */}
      <Path d="M292,248 Q305,236 318,247" fill="none" stroke="#073D30" strokeWidth={3.5} strokeLinecap="round" />
      <Path d="M362,247 Q375,236 388,248" fill="none" stroke="#073D30" strokeWidth={3.5} strokeLinecap="round" />

      {/* Eyes — handles blink, sleepy, wink, and open states */}
      <Eyes />

      {/* Blush */}
      <Circle cx={288} cy={304} r={13} fill="#F0997B" opacity={0.5} />
      <Circle cx={392} cy={304} r={13} fill="#F0997B" opacity={0.5} />

      {/* Mouth — smile arc or open mouth for excited */}
      <Mouth />
    </Svg>
  );
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
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();
  const dropSide = size * 0.62;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const [isBlinking, setIsBlinking] = useState(false);
  const blinkTimerRef = useRef(null);

  useEffect(() => {
    if (!celebration) {
      bounceAnim.setValue(0);
      return;
    }
    if (reduceMotion) return;
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
  }, [celebration, reduceMotion]);

  // ── Idle float (gentle 6px bob, 2s cycle) ──
  // Skipped when reduced motion is enabled
  useEffect(() => {
    if (reduceMotion) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [reduceMotion]);

  // ── Blink cycle (every 4-6s) ──
  // Skipped when reduced motion is enabled
  useEffect(() => {
    if (reduceMotion) return;
    const scheduleBlink = () => {
      const delay = 4000 + Math.random() * 2000;
      return setTimeout(() => {
        setIsBlinking(true);
        setTimeout(() => {
          setIsBlinking(false);
          blinkTimerRef.current = scheduleBlink();
        }, 120);
      }, delay);
    };
    blinkTimerRef.current = scheduleBlink();
    return () => {
      if (blinkTimerRef.current) clearTimeout(blinkTimerRef.current);
    };
  }, [reduceMotion]);

  const bounce = bounceAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [-8, 0, -8],
  });

  const floatOffset = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -6],
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

      <SvgBody size={size} expression={expression} isBlinking={isBlinking} variant={variant} />

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

const styles = StyleSheet.create({
  wrapper: { alignItems: "center", justifyContent: "center" },
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
});
