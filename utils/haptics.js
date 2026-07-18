import { Platform } from "react-native";
import * as Haptics from "expo-haptics";

// Re-export for convenience
export const ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle;

/**
 * Fire-and-forget haptic feedback, gated by platform availability.
 *
 * On web, haptics are silently skipped. On native, the promise is
 * caught so failures are invisible to the caller.
 *
 * @param {Haptics.ImpactFeedbackStyle} style - feedback intensity
 */
export function triggerHaptic(style = ImpactFeedbackStyle.Medium) {
  if (Platform.OS === "web") return;
  Haptics.impactAsync(style).catch((e) => {
    if (__DEV__) console.warn("Haptic failed:", e);
  });
}
