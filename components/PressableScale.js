import React, { useRef } from "react";
import { Pressable, Animated } from "react-native";
import { useReducedMotion } from "../utils/motion";

export default function PressableScale({
  onPress,
  children,
  style,
  disabled,
  scaleTo = 0.96,
  springConfig = { friction: 8, tension: 150 },
  ...props
}) {
  const reduceMotion = useReducedMotion();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (reduceMotion) return;
    Animated.spring(scaleAnim, {
      ...springConfig,
      toValue: scaleTo,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    if (reduceMotion) return;
    Animated.spring(scaleAnim, {
      ...springConfig,
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable
      {...props}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
    >
      <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
