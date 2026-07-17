import { Platform } from "react-native";
import { pickMessage, pickMilestoneMessage } from "./messages";
import { getSettings, getTodayLogs, getLastLogTime, saveSettings, addLog, incrementAchievementProgress, getStreakData, getCelebratedMilestones, saveCelebratedMilestone } from "./storage";
import { getCachedWeather, getHeatAdjustedInterval } from "./weather";

// ─── Lazy import: expo-notifications crashes Expo Go on import ────────
let _Notifications = null;

async function getN() {
  if (!_Notifications) {
    _Notifications = await import("expo-notifications");
  }
  return _Notifications;
}

// ─── Foreground notification handler ─────────────────

export async function initNotifications() {
  try {
    const N = await getN();
    N.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  } catch (e) {
    console.log("ℹ️ Notifications not available in this environment");
  }
}

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

  const N = await getN();

  await N.setNotificationChannelAsync("water-reminder", {
    name: "Water Reminder",
    importance: N.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    sound: "default",
  });

  // C5: Escalation channel — stronger vibration for alert tier
  await N.setNotificationChannelAsync("water-reminder-escalation", {
    name: "Water Reminder (Urgent)",
    importance: N.AndroidImportance.HIGH,
    vibrationPattern: [0, 500, 200, 500, 200, 500, 200, 500],
    sound: "default",
  });
}

// ─── Notification Categories (Action Buttons — C1) ───

export async function setupNotificationCategories() {
  try {
    const N = await getN();
    await N.setNotificationCategoryAsync("water-reminder", [
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

  getN().then((N) => {
    N.addNotificationResponseReceivedListener(async (response) => {
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
  }).catch((e) => {
    console.log("ℹ️ Notification response handler not available:", e.message);
  });
}

async function handleSnooze() {
  const N = await getN();
  console.log("Snoozing reminders for 15 minutes");
  await cancelAllReminders();

  await N.scheduleNotificationAsync({
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
      console.log(`Speed Demon progress +1 (responded in ${Math.round(elapsed / 1000)}s)`);
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

async function buildEscalationContent(tier, message) {
  const N = await getN();
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
    const N = await getN();
    const { status: existing } = await N.getPermissionsAsync();
    let final = existing;
    if (existing !== "granted") {
      const { status } = await N.requestPermissionsAsync();
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

// Serialize scheduling so rapid or concurrent calls can't leave two
// repeating reminders registered at once (which delivers duplicate notifications).
let _scheduleChain = Promise.resolve();

export function scheduleWaterReminder(intervalSeconds, quietHoursSettings) {
  const next = _scheduleChain
    .catch(() => {})
    .then(() => _scheduleWaterReminder(intervalSeconds, quietHoursSettings));
  _scheduleChain = next;
  return next;
}

async function _scheduleWaterReminder(intervalSeconds, quietHoursSettings) {
  await cancelAllReminders();

  try {
    const quietHours = quietHoursSettings || { enabled: false };
    let delaySeconds = intervalSeconds;

    // ─── Escalation check (C4) ──────────────────────
    // Tier drives message urgency only — it must NOT shorten the user's
    // chosen interval (previously capped to 5 min, which spammed reminders).
    const tier = await getEscalationTier();

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

    // Y6: Streak-aware messages — fetch current streak for context
    let currentStreak = 0;
    try {
      const streakData = await getStreakData(settings.dailyGoal);
      currentStreak = streakData.current || 0;
    } catch (e) {
      // Streak not available — fall through with 0
    }

    // C6: Urgent messages for escalation tiers
    const escalationEnabled = [...enabledCategories];
    if (tier !== "normal" && !escalationEnabled.includes("urgent")) {
      escalationEnabled.push("urgent");
    }

    const message = pickMessage({
      goalProgress,
      goalGlassesLeft,
      streak: currentStreak,
      enabledCategories: escalationEnabled,
      lastMessageId: settings.lastMessageId,
    });

    await saveSettings({ lastMessageId: message.id });

    // ─── Build content (C6) ─────────────────────────
    const content = await buildEscalationContent(tier, message);

    const N = await getN();
    const id = await N.scheduleNotificationAsync({
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

/**
 * Check if the current streak has crossed a celebration milestone
 * (7 or 30 days) that hasn't been celebrated yet, and if so,
 * schedule a one-shot celebration notification and persist the milestone.
 *
 * Uses per-milestone tracking (dedicated @plenty_milestones AsyncStorage key)
 * to prevent re-triggering across streak cycles and app restarts.
 *
 * NOTE: This bypasses the AD-5 scheduleWaterReminder() gate intentionally —
 * it's a one-shot notification (repeats: false) that fires immediately.
 * Routing through the gate would call cancelAllReminders(), destroying the
 * user's repeating water reminder. The dedicated milestone key also avoids
 * the saveSettings() race condition that both functions would otherwise share.
 *
 * @returns {Promise<number|null>} — the milestone celebrated (7 or 30), or null
 */
export async function scheduleMilestoneCelebration() {
  try {
    const settings = await getSettings();
    const streakData = await getStreakData(settings.dailyGoal);
    const currentStreak = streakData.current || 0;

    const milestoneMessage = pickMilestoneMessage(currentStreak);
    if (!milestoneMessage) return null;

    // Per-milestone gate: check if this specific milestone was already celebrated
    // Uses dedicated storage key to avoid race with saveSettings()
    const celebratedMilestones = await getCelebratedMilestones();
    if (celebratedMilestones.includes(currentStreak)) return null;

    // Schedule a one-shot celebration notification
    try {
      const N = await getN();
      await N.scheduleNotificationAsync({
        content: {
          title: "🎉 Streak Milestone!",
          body: milestoneMessage.text,
          data: { type: "milestone", streak: currentStreak },
        },
        trigger: {
          type: "timeInterval",
          seconds: 1,
          repeats: false,
        },
      });
    } catch (_) {
      // getN() or scheduleNotificationAsync unavailable (test env, Expo Go).
      // Still save milestone — prevents re-triggering on app restart / cache rebuild.
      // Per-milestone tracking ensures the celebration fires again after a streak
      // break + rebuild (unlike the old monotonic scalar).
    }

    await saveCelebratedMilestone(currentStreak);
    console.log(`Celebrated ${currentStreak}-day streak milestone!`);
    return currentStreak;
  } catch (e) {
    console.error("Failed to schedule milestone celebration:", e.message);
    return null;
  }
}

export async function cancelAllReminders() {
  try {
    const N = await getN();
    const existing = await N.getAllScheduledNotificationsAsync();
    if (existing.length > 0) {
      await N.cancelAllScheduledNotificationsAsync();
      console.log("All reminders cancelled");
    }
  } catch (e) {
    console.error("Failed to cancel reminders:", e.message);
  }
}

export async function getScheduledReminders() {
  try {
    const N = await getN();
    return await N.getAllScheduledNotificationsAsync();
  } catch (e) {
    console.error("Failed to get reminders:", e.message);
    return [];
  }
}

export function setupNotificationTapHandler(handler) {
  const subscriptionPromise = getN().then((N) => {
    const subscription =
      N.addNotificationResponseReceivedListener((response) =>
        handler(response.notification)
      );

    N.getLastNotificationResponseAsync().then((response) => {
      if (response) handler(response.notification);
    });

    return subscription;
  }).catch(() => null);

  return { remove: () => subscriptionPromise.then((s) => s?.remove()) };
}
