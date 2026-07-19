/**
 * Non-blocking toast confirmation for drink log actions.
 *
 * Slides in from bottom, auto-dismisses after 2s with fade-out.
 * Respects reduced-motion setting — appears instantly, no animation.
 *
 * Uses legacy Animated API (grandfathered per AD-11).
 */
import React, { useEffect, useRef } from "react";
import { Animated, Text, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useReducedMotion } from "../utils/motion";

export default function Toast({ message, visible, onDismiss }) {
  const reduceMotion = useReducedMotion();
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  useEffect(() => {
    if (!visible || !message) return;

    if (reduceMotion) {
      // Show instantly — no animation
      translateY.setValue(0);
      opacity.setValue(1);
    } else {
      // Stop any in-flight animation before starting new one
      translateY.stopAnimation();
      opacity.stopAnimation();
      // Reset and animate in from below
      translateY.setValue(100);
      opacity.setValue(1);
      Animated.spring(translateY, {
        toValue: 0,
        friction: 8,
        tension: 100,
        useNativeDriver: true,
      }).start();
    }

    // Auto-dismiss after 2s
    const timer = setTimeout(() => {
      if (!reduceMotion) {
        // Start fade-out. useNativeDriver animation continues on native thread
        // even if the component unmounts — the fade plays to completion.
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }
      // Call onDismiss immediately so parent can update state in the same tick
      onDismissRef.current?.();
    }, 2000);

    return () => {
      clearTimeout(timer);
      translateY.stopAnimation();
      opacity.stopAnimation();
    };
  }, [visible, message, reduceMotion]);

  if (!visible || !message) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.container,
        {
          opacity: reduceMotion ? 1 : opacity,
          transform: reduceMotion ? [] : [{ translateY }],
          bottom: Math.max(insets.bottom, 12) + 80,
        },
      ]}
    >
      <Text style={styles.message}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 16,
    right: 16,
    backgroundColor: "#34C759",
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 999,
  },
  message: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
});
