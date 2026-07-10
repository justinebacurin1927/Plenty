import { Platform } from "react-native";
import Constants from "expo-constants";

// expo-notifications cannot be used in Expo Go on Android SDK 53+.
// Its top-level initialization throws even with dynamic import().
// Detect the environment upfront and skip the module entirely.
const isExpoGo = Constants.appOwnership === "expo";

// ─── Lazy loader (never called in Expo Go) ──────────

let Notifications = null;
let initAttempted = false;

async function ensureNotifications() {
  if (isExpoGo) return null;
  if (Notifications) return Notifications;
  if (initAttempted) return null;
  initAttempted = true;
  try {
    const mod = await import("expo-notifications");
    try {
      mod.default.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });
    } catch (_) {
      // foreground handler isn't critical
    }
    Notifications = mod.default;
    return Notifications;
  } catch (e) {
    console.warn("⚠️ expo-notifications init failed:", e.message);
    return null;
  }
}

// ─── Public API — all functions are safe if unavailable ──

export async function requestPermission() {
  if (isExpoGo) {
    console.log("ℹ️ Push notifications not available in Expo Go (SDK 53+)");
    return false;
  }
  const notif = await ensureNotifications();
  if (!notif) return false;

  try {
    const { status: existing } = await notif.getPermissionsAsync();
    let final = existing;
    if (existing !== "granted") {
      const { status } = await notif.requestPermissionsAsync();
      final = status;
    }
    if (final !== "granted") {
      console.warn("🚫 Notification permission not granted");
      return false;
    }
    if (Platform.OS === "android") {
      await notif.setNotificationChannelAsync("water-reminder", {
        name: "Water Reminder",
        importance: notif.AndroidImportance?.HIGH || 4,
        vibrationPattern: [0, 250, 250, 250],
        sound: "default",
      });
    }
    return true;
  } catch (e) {
    console.error("❌ Failed to request notification permission:", e.message);
    return false;
  }
}

export async function scheduleWaterReminder(intervalMinutes) {
  if (isExpoGo) {
    console.log("ℹ️ Notifications unavailable — skipping schedule");
    return;
  }
  const notif = await ensureNotifications();
  if (!notif) return;

  await cancelAllReminders(notif);

  try {
    const id = await notif.scheduleNotificationAsync({
      content: {
        title: "💧 Time to drink water!",
        body: "Stay hydrated — your body will thank you.",
        sound: "default",
      },
      trigger: {
        type: "timeInterval",
        seconds: intervalMinutes * 60,
        repeats: true,
      },
    });
    console.log(`✅ Notification scheduled (ID: ${id})`);
    return id;
  } catch (e) {
    console.error("❌ Failed to schedule notification:", e.message);
  }
}

export async function cancelAllReminders(notifOverride) {
  if (isExpoGo) return;
  const notif = notifOverride || (await ensureNotifications());
  if (!notif) return;

  try {
    const existing = await notif.getAllScheduledNotificationsAsync();
    if (existing.length > 0) {
      await notif.cancelAllScheduledNotificationsAsync();
      console.log("✅ All reminders cancelled");
    }
  } catch (e) {
    console.error("❌ Failed to cancel reminders:", e.message);
  }
}

export async function getScheduledReminders() {
  if (isExpoGo) return [];
  const notif = await ensureNotifications();
  if (!notif) return [];

  try {
    return await notif.getAllScheduledNotificationsAsync();
  } catch (e) {
    console.error("❌ Failed to get reminders:", e.message);
    return [];
  }
}

export async function setupNotificationTapHandler(handler) {
  if (isExpoGo) return null;
  const notif = await ensureNotifications();
  if (!notif) return null;

  try {
    const response = await notif.getLastNotificationResponseAsync();
    if (response) handler(response.notification);
    return notif.addNotificationResponseReceivedListener((response) => {
      handler(response.notification);
    });
  } catch (e) {
    console.error("❌ Failed to set up notification tap handler:", e.message);
    return null;
  }
}
