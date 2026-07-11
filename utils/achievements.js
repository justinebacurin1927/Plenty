import {
  getLogs,
  getSettings,
  getUnlockedAchievements,
  unlockAchievement,
  getAchievementProgress,
  setAchievementProgress,
} from "./storage";

// ─── Achievement Definitions ──────────────────────────
// All check() functions are synchronous pure functions.

const ACHIEVEMENTS = [
  {
    id: "first_drop",
    emoji: "🌊",
    title: "First Drop",
    description: "Log your first glass of water",
    max: 1,
    check: (logs) => logs.length >= 1,
    getProgress: (logs) => Math.min(logs.length, 1),
  },
  {
    id: "seven_day_streak",
    emoji: "💪",
    title: "7-Day Streak",
    description: "Reach a 7-day hydration streak",
    max: 7,
    check: (logs, settings) => computeStreak(logs, settings.dailyGoal) >= 7,
    getProgress: (logs, settings) =>
      Math.min(computeStreak(logs, settings.dailyGoal), 7),
  },
  {
    id: "thirty_day_streak",
    emoji: "🔥",
    title: "30-Day Streak",
    description: "Reach a 30-day hydration streak",
    max: 30,
    check: (logs, settings) => computeStreak(logs, settings.dailyGoal) >= 30,
    getProgress: (logs, settings) =>
      Math.min(computeStreak(logs, settings.dailyGoal), 30),
  },
  {
    id: "century",
    emoji: "🏅",
    title: "Century",
    description: "Log 100 glasses total",
    max: 100,
    check: (logs) => logs.length >= 100,
    getProgress: (logs) => Math.min(logs.length, 100),
  },
  {
    id: "five_hundred",
    emoji: "🚀",
    title: "500 Club",
    description: "Log 500 glasses total",
    max: 500,
    check: (logs) => logs.length >= 500,
    getProgress: (logs) => Math.min(logs.length, 500),
  },
  {
    id: "early_bird",
    emoji: "☀️",
    title: "Early Bird",
    description: "Log a drink before 8 AM — 10 times",
    max: 10,
    check: (_logs, _settings, progress) => progress >= 10,
    getProgress: (logs) =>
      Math.min(
        logs.filter((e) => new Date(e.timestamp).getHours() < 8).length,
        10
      ),
  },
  {
    id: "night_owl",
    emoji: "🌙",
    title: "Night Owl",
    description: "Log a drink after 10 PM — 10 times",
    max: 10,
    check: (_logs, _settings, progress) => progress >= 10,
    getProgress: (logs) =>
      Math.min(
        logs.filter((e) => new Date(e.timestamp).getHours() >= 22).length,
        10
      ),
  },
  {
    id: "perfect_week",
    emoji: "📅",
    title: "Perfect Week",
    description: "Hit your daily goal every day for a week",
    max: 7,
    check: (logs, settings) => {
      const goalMl = settings.dailyGoal * 250;
      const today = new Date();
      for (let i = 0; i < 7; i++) {
        const date = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate() - i
        );
        const dayLogs = logs.filter((e) => {
          const t = new Date(e.timestamp);
          return (
            t.getFullYear() === date.getFullYear() &&
            t.getMonth() === date.getMonth() &&
            t.getDate() === date.getDate()
          );
        });
        const total = dayLogs.reduce((sum, e) => sum + (e.amount || 250), 0);
        if (total < goalMl) return false;
      }
      return true;
    },
    getProgress: (logs, settings) => {
      const goalMl = settings.dailyGoal * 250;
      const today = new Date();
      let count = 0;
      for (let i = 0; i < 7; i++) {
        const date = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate() - i
        );
        const dayLogs = logs.filter((e) => {
          const t = new Date(e.timestamp);
          return (
            t.getFullYear() === date.getFullYear() &&
            t.getMonth() === date.getMonth() &&
            t.getDate() === date.getDate()
          );
        });
        const total = dayLogs.reduce((sum, e) => sum + (e.amount || 250), 0);
        if (total >= goalMl) count++;
      }
      return count;
    },
  },
  {
    id: "goal_crusher",
    emoji: "🎯",
    title: "Goal Crusher",
    description: "Double your daily goal in a single day",
    max: 100,
    check: (logs, settings) => {
      const goalMl = settings.dailyGoal * 250;
      const today = new Date();
      const todayLogs = logs.filter((e) => {
        const t = new Date(e.timestamp);
        return (
          t.getFullYear() === today.getFullYear() &&
          t.getMonth() === today.getMonth() &&
          t.getDate() === today.getDate()
        );
      });
      const total = todayLogs.reduce((sum, e) => sum + (e.amount || 250), 0);
      return total >= goalMl * 2;
    },
    getProgress: (logs, settings) => {
      const goalMl = settings.dailyGoal * 250;
      const today = new Date();
      const todayLogs = logs.filter((e) => {
        const t = new Date(e.timestamp);
        return (
          t.getFullYear() === today.getFullYear() &&
          t.getMonth() === today.getMonth() &&
          t.getDate() === today.getDate()
        );
      });
      const total = todayLogs.reduce((sum, e) => sum + (e.amount || 250), 0);
      return Math.min(Math.round((total / (goalMl * 2)) * 100), 100);
    },
  },
  {
    id: "speed_demon",
    emoji: "⚡",
    title: "Speed Demon",
    description: "Log within 1 minute of a reminder — 5 times",
    max: 5,
    check: (_l, _s, progress) => progress >= 5,
    getProgress: () => 0, // relies on notification timestamp — Epic C
  },
  {
    id: "comeback_kid",
    emoji: "🦸",
    title: "Comeback Kid",
    description: "Break a 3+ day gap by logging some water",
    max: 1,
    check: (logs) => {
      if (logs.length < 2) return false;
      const sorted = [...logs].sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      );
      const latest = new Date(sorted[0].timestamp);
      const today = new Date();
      const isToday =
        latest.getFullYear() === today.getFullYear() &&
        latest.getMonth() === today.getMonth() &&
        latest.getDate() === today.getDate();
      if (!isToday) return false;

      const prevLogDate = new Date(sorted[1].timestamp);
      const gapDays = Math.floor(
        (today.getTime() - prevLogDate.getTime()) / 86400000
      );
      return gapDays >= 3;
    },
    getProgress: () => 0,
  },
  {
    id: "loyal_user",
    emoji: "💎",
    title: "Loyal User",
    description: "Log water on 30 different days",
    max: 30,
    check: (logs) => {
      const days = new Set(
        logs.map((e) => {
          const d = new Date(e.timestamp);
          return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        })
      );
      return days.size >= 30;
    },
    getProgress: (logs) => {
      const days = new Set(
        logs.map((e) => {
          const d = new Date(e.timestamp);
          return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        })
      );
      return Math.min(days.size, 30);
    },
  },
];

export default ACHIEVEMENTS;

// ─── Shared helper: compute streak from logs ──────────

function computeStreak(logs, goal) {
  const today = new Date();
  let streak = 0;
  for (let i = 0; ; i++) {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
    const dayLogs = logs.filter((e) => {
      const t = new Date(e.timestamp);
      return (
        t.getFullYear() === date.getFullYear() &&
        t.getMonth() === date.getMonth() &&
        t.getDate() === date.getDate()
      );
    });
    const total = dayLogs.reduce((sum, e) => sum + (e.amount || 250), 0);
    if (Math.round(total / 250) >= goal) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

// ─── Checker Engine (A3) ──────────────────────────────

/**
 * Run all achievement checks against current data.
 * Unlocks any newly-earned achievements and saves progress.
 *
 * Returns: Array of newly unlocked Achievement objects (empty if none).
 */
export async function checkAchievements() {
  try {
    const logs = await getLogs();
    const settings = await getSettings();
    const unlocked = await getUnlockedAchievements();
    const progress = await getAchievementProgress();
    const newlyUnlocked = [];

    for (const a of ACHIEVEMENTS) {
      if (unlocked.includes(a.id)) continue;

      const prevProgress = progress[a.id] || 0;
      const isUnlocked = a.check(logs, settings, prevProgress);

      if (isUnlocked) {
        newlyUnlocked.push(a);
        await unlockAchievement(a.id);
      } else {
        const currentProgress = a.getProgress(logs, settings);
        if (currentProgress > prevProgress) {
          await setAchievementProgress(a.id, currentProgress);
        }
      }
    }

    return newlyUnlocked;
  } catch (e) {
    console.error("❌ Achievement check failed:", e.message, e.stack);
    return [];
  }
}

// ─── Gallery Display Helper (A5) ──────────────────────

/**
 * Pure function — computes display state for every achievement.
 * Used by AchievementsScreen — does NOT write to storage.
 *
 * Returns array of:
 *   { id, emoji, title, description, unlocked, progress, max, percent }
 */
export function buildGalleryList(logs, settings, unlocked, progress) {
  return ACHIEVEMENTS.map((a) => {
    const isUnlocked = unlocked.includes(a.id);
    const prog = isUnlocked
      ? a.max
      : (progress[a.id] !== undefined
          ? progress[a.id]
          : a.getProgress(logs, settings));
    return {
      id: a.id,
      emoji: a.emoji,
      title: a.title,
      description: a.description,
      unlocked: isUnlocked,
      progress: prog,
      max: a.max,
      percent: Math.round((prog / a.max) * 100),
    };
  });
}

// ─── Achievement Notification (A6) ────────────────────

/**
 * Fire a local notification when an achievement is unlocked
 * while the app is in the background.
 *
 * Called from Epic C (notification quick-log) when the checker
 * runs outside the app context. Not called from HomeScreen
 * during normal use — the popup handles foreground display.
 */
export async function sendAchievementNotification(achievement) {
  try {
    const Notifications = require("expo-notifications");
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `🏆 Achievement Unlocked!`,
        body: `${achievement.emoji} ${achievement.title} — ${achievement.description}`,
        data: { type: "achievement", id: achievement.id },
      },
      trigger: null, // immediate
    });
  } catch (e) {
    console.error("❌ Failed to send achievement notification:", e.message);
  }
}
