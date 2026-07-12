import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { pickMessage } from "./messages";
import { getSettings, getTodayLogs, getLastLogTime, saveSettings, addLog, incrementAchievementProgress } from "./storage";
import { getCachedWeather, getHeatAdjustedInterval } from "./weather";

// ─── Foreground notification handler ─────────────────

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// ─── Helpers ─────────────────────────────────────────

function isInQuietHours(start, end) {
  const now = new Date();
  const current = now.getHours() * 60 + now.getMinutes();
  const [startH, startM] = start.split(":").map(Number);
  const [endH, endM] = end.split(":").map(Number);
  const startMin = startH * 60 + startM;
  const endMin = endH * 60 + endM;

  if (startMin <= endMin) {
    return current >= startMin && current <= endMin;
  }
  return current >= startMin || current <= endMin;
}

function minutesUntil(end) {
  const now = new Date();
  const current = now.getHours() * 60 + now.getMinutes();
  const [endH, endM] = end.split(":").map(Number);
  const endMin = endH * 60 + endM;

  if (endMin > current) return endMin - current;
  return 24 * 60 - current + endMin;
}

/**
 * Determine escalation tier based on time since last drink log.
 * Returns: "normal" | "warning" | "alert"
 */
export async function getEscalationTier() {
  const lastLogTime = await getLastLogTime();
  if (lastLogTime === null) return "alert"; // never logged
  const hoursSinceLastLog = (Date.now() - lastLogTime) / 3600000;

  if (hoursSinceLastLog > 4) return "alert";
  if (hoursSinceLastLog > 2) return "warning";
  return "normal";
}

// ─── Notification Channels (Android) ─────────────────

async function ensureChannels() {
  if (Platform.OS !== "android") return;

  await Notifications.setNotificationChannelAsync("water-reminder", {
    name: "Water Reminder",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    sound: "default",
  });

  // C5: Escalation channel — stronger vibration for alert tier
  await Notifications.setNotificationChannelAsync("water-reminder-escalation", {
    name: "Water Reminder (Urgent)",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 500, 200, 500, 200, 500, 200, 500],
    sound: "default",
  });
}

// ─── Notification Categories (Action Buttons — C1) ───

export async function setupNotificationCategories() {
  try {
    await Notifications.setNotificationCategoryAsync("water-reminder", [
      {
        identifier: "drink",
        buttonTitle: "I drank!",
        options: { opensAppToForeground: false },
      },
      {
        identifier: "snooze",
        buttonTitle: "Snooze 15m",
        options: { opensAppToForeground: false },
      },
    ]);
    console.log("Notification categories set up");
  } catch (e) {
    console.error("Failed to set up notification categories:", e.message);
  }
}

// ─── Response Handler (C2 + C3) ──────────────────────

let _responseHandlerSetup = false;

export function setupResponseHandler() {
  if (_responseHandlerSetup) return;
  _responseHandlerSetup = true;

  Notifications.addNotificationResponseReceivedListener(async (response) => {
    const { actionIdentifier, notification } = response;

    try {
      if (actionIdentifier === "snooze") {
        await handleSnooze();
      } else if (actionIdentifier === "drink") {
        await handleQuickLog(notification);
      }
    } catch (e) {
      console.error("Notification response handler error:", e.message);
    }
  });
}

async function handleSnooze() {
  console.log("Snoozing reminders for 15 minutes");
  await cancelAllReminders();

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Time to drink water!",
      body: "Snoozed reminder — time to hydrate!",
      data: { type: "snooze-followup" },
    },
    trigger: {
      type: "timeInterval",
      seconds: 900, // 15 minutes
      repeats: false,
    },
  });

  console.log("Snoozed — next reminder in 15 min");
}

async function handleQuickLog(notification) {
  console.log("Quick-logged 250ml from notification");
  await addLog({ amount: 250, source: "notification" });

  // ─── Speed Demon check ────────────────────────────
  // If user responded within 60s of notification delivery, count it
  if (notification?.date) {
    const deliveredAt = new Date(notification.date).getTime();
    const elapsed = Date.now() - deliveredAt;
    if (elapsed < 60000) {
      await incrementAchievementProgress("speed_demon");
      console.log("Speed Demon progress +1 (responded in ${Math.round(elapsed / 1000)}s)");
    }
  }

  // Reschedule normal reminders
  const settings = await getSettings();
  await scheduleWaterReminder(settings.intervalMinutes * 60, {
    enabled: settings.quietHoursEnabled,
    start: settings.quietHoursStart,
    end: settings.quietHoursEnd,
  });
}

// ─── Escalation-Aware Message Builder ─────────────────

function buildEscalationContent(tier, message) {
  const base = {
    title: "Time to drink water!",
    body: message.text,
    data: { type: "reminder", tier },
    categoryIdentifier: "water-reminder",
  };

  if (Platform.OS === "android" && tier === "alert") {
    base.channelId = "water-reminder-escalation";
  }

  if (tier === "alert") {
    base.title = "Please drink water!";
  } else if (tier === "warning") {
    base.title = "Don't forget to hydrate!";
  }

  return base;
}

// ─── Public API ──────────────────────────────────────

export async function requestPermission() {
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    let final = existing;
    if (existing !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      final = status;
    }
    if (final !== "granted") {
      console.warn("Notification permission not granted");
      return false;
    }

    await ensureChannels();
    await setupNotificationCategories();
    return true;
  } catch (e) {
    console.error("Failed to request notification permission:", e.message);
    return false;
  }
}

export async function scheduleWaterReminder(intervalSeconds, quietHoursSettings) {
  await cancelAllReminders();

  try {
    const quietHours = quietHoursSettings || { enabled: false };
    let delaySeconds = intervalSeconds;

    // ─── Escalation check (C4) ──────────────────────
    const tier = await getEscalationTier();
    if (tier === "alert") {
      // Shorten interval to 5 min during alert tier
      delaySeconds = Math.min(delaySeconds, 300);
      console.log(`Alert tier — interval reduced to ${delaySeconds}s`);
    }

    // ─── Weather-based heat adjustment (D3) ─────────
    try {
      const weather = await getCachedWeather();
      if (weather && weather.temp !== null) {
        const adjusted = getHeatAdjustedInterval(weather.temp, delaySeconds);
        if (adjusted < delaySeconds) {
          delaySeconds = adjusted;
          console.log(`Heat adjustment: interval reduced to ${delaySeconds}s (${Math.round(weather.temp)}°C)`);
        }
      }
    } catch (e) {
      // Weather cache may not exist — no adjustment needed
    }

    // ─── Quiet hours ────────────────────────────────
    if (quietHours.enabled && isInQuietHours(quietHours.start, quietHours.end)) {
      delaySeconds = Math.max(minutesUntil(quietHours.end) * 60, 60);
      console.log(
        `In quiet hours — first reminder in ${Math.round(delaySeconds / 60)} minutes`
      );
    }

    // ─── Pick a message ─────────────────────────────
    const settings = await getSettings();
    const todayLogs = await getTodayLogs();
    const todayMl = todayLogs.reduce((sum, entry) => sum + (entry.amount || 250), 0);
    const effectiveGoal = settings.dailyGoal + (settings.activityAdjustment ? 3 : 0); // +3 glasses if exercised
    const goalMl = (effectiveGoal || 8) * 250;
    const goalProgress = Math.round((todayMl / goalMl) * 100);
    const goalGlassesLeft = Math.max(Math.round((goalMl - todayMl) / 250), 0);

    const catSettings = settings.messageCategories || {};
    const enabledCategories = Object.keys(catSettings).filter((c) => catSettings[c]);

    // C6: Urgent messages for escalation tiers
    const escalationEnabled = [...enabledCategories];
    if (tier !== "normal" && !escalationEnabled.includes("urgent")) {
      escalationEnabled.push("urgent");
    }

    const message = pickMessage({
      goalProgress,
      goalGlassesLeft,
      enabledCategories: escalationEnabled,
      lastMessageId: settings.lastMessageId,
    });

    await saveSettings({ lastMessageId: message.id });

    // ─── Build content (C6) ─────────────────────────
    const content = buildEscalationContent(tier, message);

    const id = await Notifications.scheduleNotificationAsync({
      content,
      trigger: {
        type: "timeInterval",
        seconds: delaySeconds,
        repeats: true,
      },
    });

    console.log(
      `Notification scheduled (ID: ${id}) — tier: ${tier}, message: "${message.text}"`
    );
    return id;
  } catch (e) {
    console.error("Failed to schedule notification:", e.message);
  }
}

export async function cancelAllReminders() {
  try {
    const existing = await Notifications.getAllScheduledNotificationsAsync();
    if (existing.length > 0) {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log("All reminders cancelled");
    }
  } catch (e) {
    console.error("Failed to cancel reminders:", e.message);
  }
}

export async function getScheduledReminders() {
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (e) {
    console.error("Failed to get reminders:", e.message);
    return [];
  }
}

export function setupNotificationTapHandler(handler) {
  const subscription =
    Notifications.addNotificationResponseReceivedListener((response) =>
      handler(response.notification)
    );

  Notifications.getLastNotificationResponseAsync().then((response) => {
    if (response) handler(response.notification);
  });

  return subscription;
}
