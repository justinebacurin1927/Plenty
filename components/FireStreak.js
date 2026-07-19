/**
 * FireStreak — Animated flame streak effect behind icons.
 *
 * Renders a layered flame SVG behind children (Ionicons, etc.)
 * using the fire-streak.svg design.
 */
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet } from "react-native";
import Svg, { Path, Circle, Defs, LinearGradient, Stop, RadialGradient } from "react-native-svg";
import { useReducedMotion } from "../utils/motion";

export default function FireStreak({ size = 40, children, style }) {
  const reduceMotion = useReducedMotion();
  const swayAnim = useRef(new Animated.Value(0)).current;
  const flickerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduceMotion) return;
    const sway = Animated.loop(
      Animated.sequence([
        Animated.timing(swayAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(swayAnim, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    );
    const flicker = Animated.loop(
      Animated.sequence([
        Animated.timing(flickerAnim, { toValue: 1, duration: 650, useNativeDriver: true }),
        Animated.timing(flickerAnim, { toValue: 0, duration: 650, useNativeDriver: true }),
      ])
    );
    sway.start();
    flicker.start();
    return () => { sway.stop(); flicker.stop(); };
  }, [reduceMotion]);

  const swayRotate = swayAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ["0deg", "2deg", "0deg"],
  });
  const flickerScale = flickerAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.08, 1],
  });
  const flickerOpacity = flickerAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.85, 1, 0.85],
  });

  const s = size / 100;

  const flame = (
    <Svg width={size * 0.75} height={size} viewBox="0 0 300 400" style={{ position: "absolute", top: 0, left: 0 }}>
      <Defs>
        <LinearGradient id="fsOuter" x1="0" y1="1" x2="0" y2="0">
          <Stop offset="0%" stopColor="#FF6A00" />
          <Stop offset="45%" stopColor="#FF9A2E" />
          <Stop offset="80%" stopColor="#FFC94D" />
          <Stop offset="100%" stopColor="#FFE98A" />
        </LinearGradient>
        <LinearGradient id="fsInner" x1="0" y1="1" x2="0" y2="0">
          <Stop offset="0%" stopColor="#FFB100" />
          <Stop offset="50%" stopColor="#FFD447" />
          <Stop offset="100%" stopColor="#FFF6C8" />
        </LinearGradient>
        <RadialGradient id="fsCore" cx="50%" cy="70%" r="60%">
          <Stop offset="0%" stopColor="#FFF6D8" />
          <Stop offset="60%" stopColor="#FFDE6B" />
          <Stop offset="100%" stopColor="#FFB840" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Path
        d="M150,380 C90,380 60,330 65,270 C68,230 90,200 85,160 C82,135 70,115 75,90 C100,110 115,135 118,160 C120,120 105,80 120,35 C135,65 145,90 148,120 C160,80 155,45 175,10 C185,55 180,95 195,125 C205,100 205,75 220,55 C230,90 222,120 232,155 C240,190 250,220 240,260 C255,240 262,215 260,185 C280,220 285,270 260,320 C235,365 195,380 150,380 Z"
        fill="url(#fsOuter)"
        opacity={0.5}
      />
      <Path
        d="M150,345 C110,345 92,310 96,270 C99,242 112,222 110,195 C108,178 100,164 104,148 C120,163 128,180 130,198 C132,170 122,142 132,112 C142,133 148,150 150,170 C158,145 155,120 168,95 C175,125 172,152 182,172 C190,155 190,138 200,124 C207,148 202,170 208,193 C214,216 220,236 213,262 C224,248 229,231 227,210 C240,232 244,264 226,296 C208,326 180,345 150,345 Z"
        fill="url(#fsInner)"
        opacity={0.35}
      />
      <Circle cx={150} cy={320} r={50} fill="url(#fsCore)" opacity={0.2} />
    </Svg>
  );

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          width: size * 0.75,
          height: size,
          transform: reduceMotion ? [] : [{ rotate: swayRotate }, { scale: flickerScale }],
          opacity: reduceMotion ? 0.3 : flickerOpacity,
        },
        style,
      ]}
    >
      {flame}
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
});
