import { NativeModules, Platform } from "react-native";

/**
 * Format streak number for widget display.
 * Returns "Start tracking!" when streak is 0 or invalid,
 * or "{n} day streak" when streak is active.
 */
export function formatWidgetStreak(streak) {
  if (!streak || typeof streak !== "number" || streak < 1) {
    return "Start tracking!";
  }
  return `${streak} day streak`;
}

/**
 * Update the home screen widget with current hydration data.
 * Gracefully no-ops if the native module isn't available
 * (Expo Go, older build, or iOS).
 */
export async function refreshWidget({ currentMl, goalMl, streak, glassesCount }) {
  if (Platform.OS !== "android" || !NativeModules.PlentyWidget) {
    return false;
  }

  try {
    await NativeModules.PlentyWidget.refreshWidget({
      currentMl: Math.round(currentMl || 0),
      goalMl: Math.round(goalMl || 0),
      streak: Math.round(streak || 0),
      glassesCount: Math.round(glassesCount || 0),
    });
    return true;
  } catch (e) {
    console.warn("Widget refresh failed:", e.message);
    return false;
  }
}
