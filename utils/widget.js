import { NativeModules, Platform } from "react-native";

const { PlentyWidget } = NativeModules;

/**
 * Update the home screen widget with current hydration data.
 * Gracefully no-ops if the native module isn't available
 * (Expo Go, older build, or iOS).
 */
export async function refreshWidget({ currentMl, goalMl, streak, glassesCount }) {
  if (Platform.OS !== "android" || !PlentyWidget) {
    return false;
  }

  try {
    await PlentyWidget.refreshWidget({
      currentMl: Math.round(currentMl),
      goalMl: Math.round(goalMl),
      streak: Math.round(streak),
      glassesCount: Math.round(glassesCount),
    });
    return true;
  } catch (e) {
    console.warn("Widget refresh failed:", e.message);
    return false;
  }
}
