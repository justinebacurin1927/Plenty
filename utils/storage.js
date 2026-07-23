import AsyncStorage from "@react-native-async-storage/async-storage";
import REWARDS from "../constants/rewards";
import { checkNewMilestones } from "../constants/rewards";

const KEYS = {
  LOGS: "@plenty_logs",
  SETTINGS: "@plenty_settings",
  MONTHLY_CACHE: "@plenty_monthly_cache",
  ONBOARDED: "@plenty_onboarded",
  STREAK: "@plenty_streak",
  MILESTONES: "@plenty_milestones",
};

const DEFAULT_SETTINGS = {
  name: "",
  intervalMinutes: 30,
  sound: true,
  quietHoursEnabled: false,
  quietHoursStart: "22:00",
  quietHoursEnd: "08:00",
  dailyGoal: 8,
  drinkAmount: 250,
  remindersActive: false,
  messageCategories: {
    encouraging: true,
    funny: true,
    urgent: true,
    fact: true,
    morning: true,
    evening: true,
  },
  lastMessageId: null,
  mascotVariant: "classic",

  // Sprint 4 — Goal Intelligence (Epic C)
  weightKg: null,
  weightUnit: "kg", // "kg" | "lbs"
  activityAdjustment: false, // "I exercised today" toggle

  // Sprint 4 — Weather fallback (Epic D)
  manualLocation: "", // city or zip code if location denied

  // Epic 4 — Onboarding
  onboarded: false,
};

// ─── Logs ───────────────────────────────────────────

export async function getLogs() {
  const raw = await AsyncStorage.getItem(KEYS.LOGS);
  return raw ? JSON.parse(raw) : [];
}

export async function addLog(entry) {
  const logs = await getLogs();
  const newEntry = {
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
    ...entry,
  };
  logs.push(newEntry);
  await AsyncStorage.setItem(KEYS.LOGS, JSON.stringify(logs));
  return newEntry;
}

export async function clearLogs() {
  await AsyncStorage.removeItem(KEYS.LOGS);
}

export async function getLastLogTime() {
  const logs = await getLogs();
  if (logs.length === 0) return null;
  const sorted = [...logs].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  return new Date(sorted[0].timestamp).getTime();
}

export async function getTodayLogs() {
  const logs = await getLogs();
  const today = new Date();
  const startOfDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  ).getTime();

  return logs.filter((entry) => {
    if (!entry || !entry.timestamp) return false;
    const t = new Date(entry.timestamp);
    return !isNaN(t.getTime()) && t.getTime() >= startOfDay;
  });
}

// ─── Weekly & Streaks ───────────────────────────────

export async function getLogsForDate(date) {
  const logs = await getLogs();
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const end = start + 86400000;
  return logs.filter((entry) => {
    const t = new Date(entry.timestamp).getTime();
    return t >= start && t < end;
  });
}

export async function getLastWeekLogs() {
  const logs = await getLogs();
  const now = new Date();
  const weekAgo = now.getTime() - 7 * 86400000;
  return logs.filter((entry) => new Date(entry.timestamp).getTime() >= weekAgo);
}

export async function getDailyTotals() {
  const logs = await getLastWeekLogs();
  const days = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const dayLogs = logs.filter((entry) => {
      const t = new Date(entry.timestamp);
      return (
        t.getFullYear() === date.getFullYear() &&
        t.getMonth() === date.getMonth() &&
        t.getDate() === date.getDate()
      );
    });
    const total = dayLogs.reduce((sum, entry) => sum + (entry.amount || 250), 0);
    const label = i === 0 ? "Today" : date.toLocaleDateString([], { weekday: "short" });
    days.push({ label, date, total, count: dayLogs.length });
  }
  return days;
}

export async function getStreak(goal) {
  const data = await getStreakData(goal);
  return data.current;
}

// ─── Streak Engine (Epic 2) ────────────────────────────────

const STREAK_SCHEMA_VERSION = 1;

/**
 * Build a date-key string "YYYY-MM-DD" from a Date object
 */
function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Rebuild the streak cache from all logs.
 */
async function rebuildStreakCache(goal) {
  const logs = await getLogs();

  // ── Group logs by day ──
  const dayMap = {};
  for (const entry of logs) {
    if (!entry || !entry.timestamp) continue;
    const d = new Date(entry.timestamp);
    if (isNaN(d.getTime())) continue;
    const key = dateKey(d);
    dayMap[key] = (dayMap[key] || 0) + (entry.amount || 250);
  }

  // ── Preserve frozenDays & permanent milestones from old cache ──
  const oldRaw = await AsyncStorage.getItem(KEYS.STREAK);
  const oldCache = oldRaw ? JSON.parse(oldRaw) : null;
  const previousFrozenDays = oldCache?.frozenDays || [];
  const permanentMilestones = oldCache?.permanentMilestones || [];
  const previousFreezesAvailable = oldCache?.freezesAvailable ?? 1;
  const previousLastFreezeResetMonth = oldCache?.lastFreezeResetMonth;

  // ── Build sorted history ──
  const today = new Date();
  const todayStr = dateKey(today);

  const fullDays = Object.keys(dayMap)
    .filter((k) => k < todayStr)
    .sort(); // chronological

  const history = [];
  let runningStreak = 0; // includes frozen days (for display)
  let longestStreak = 0;
  let milestoneRunningStreak = 0; // excludes frozen days (for milestone thresholds)
  let milestoneLongestStreak = 0;

  for (const dateStr of fullDays) {
    const totalMl = dayMap[dateStr];
    const glasses = Math.round(totalMl / 250);
    const goalMet = glasses >= goal;
    const isFrozen = !goalMet && previousFrozenDays.includes(dateStr);

    history.push({ date: dateStr, goalMet, totalMl, frozen: isFrozen });

    if (goalMet || isFrozen) {
      // Streak continues (display streak — includes freezes)
      runningStreak++;
      if (runningStreak > longestStreak) longestStreak = runningStreak;

      if (goalMet) {
        // Milestone progress only counts days where goal was actually met
        milestoneRunningStreak++;
        if (milestoneRunningStreak > milestoneLongestStreak) milestoneLongestStreak = milestoneRunningStreak;
      } else {
        // Frozen day doesn't advance milestone progress but streak is preserved
        milestoneRunningStreak = 0;
      }
    } else {
      runningStreak = 0;
      milestoneRunningStreak = 0;
    }
  }

  // ── Compute CURRENT streak (from yesterday backward, includes frozen) ──
  let currentStreak = 0;
  for (let i = 0; ; i++) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
    const key = dateKey(d);

    if (key === todayStr) continue;

    const dayData = history.find((h) => h.date === key);
    if (dayData && (dayData.goalMet || dayData.frozen)) {
      currentStreak++;
    } else {
      break;
    }
  }

  // ── Compute milestones from milestone-specific longest streak ──
  const milestoneLongest = Math.max(milestoneLongestStreak, ...permanentMilestones.map(
    (id) => REWARDS.find((r) => r.id === id)?.tier || 0
  ));
  const milestonesFromLongest = checkNewMilestones(milestoneLongest, []);
  const allMilestones = [
    ...milestonesFromLongest.map((m) => m.id),
    ...permanentMilestones.filter((id) => !milestonesFromLongest.some((m) => m.id === id)),
  ];
  const uniqueMilestones = [...new Set(allMilestones)];

  // ── Freezes: 1 per month, resets on the 1st ──
  const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const monthChanged = previousLastFreezeResetMonth && previousLastFreezeResetMonth !== currentMonth;
  const freezesAvailable = monthChanged ? 1 : previousFreezesAvailable;

  const cache = {
    version: STREAK_SCHEMA_VERSION,
    lastBuildDate: todayStr,
    current: currentStreak,
    longest: longestStreak,
    freezesAvailable,
    lastFreezeResetMonth: currentMonth,
    frozenDays: previousFrozenDays,
    milestonesReached: uniqueMilestones,
    permanentMilestones,
    history: history.reverse(), // newest first
  };

  await AsyncStorage.setItem(KEYS.STREAK, JSON.stringify(cache));
  return cache;
}

/**
 * Get cached streak data. Rebuilds lazily if cache is missing or stale.
 * Returns: { current, longest, history, freezesAvailable, milestonesReached }
 */
export async function getStreakData(goal) {
  const raw = await AsyncStorage.getItem(KEYS.STREAK);
  let cached = raw ? JSON.parse(raw) : null;

  // Rebuild if cache is missing, version mismatch, or stale
  const today = new Date();
  const todayStr = dateKey(today);
  const needsRebuild =
    !cached ||
    cached.version !== STREAK_SCHEMA_VERSION ||
    cached.lastBuildDate !== todayStr;

  if (needsRebuild) {
    cached = await rebuildStreakCache(goal);
  }

  return {
    current: cached.current,
    longest: cached.longest,
    history: cached.history || [],
    freezesAvailable: cached.freezesAvailable ?? 1,
    milestonesReached: cached.milestonesReached || [],
    frozenDays: cached.frozenDays || [],
  };
}

/**
 * Invalidate the streak cache so it rebuilds on next getStreakData call.
 * Call this when goal settings change.
 */
export async function invalidateStreakCache() {
  await AsyncStorage.removeItem(KEYS.STREAK);
}

/**
 * Check which streak milestones have been reached and update the cache.
 * Returns newly-unlocked milestone IDs (empty array if none).
 */
export async function checkAndUpdateMilestones() {
  const settings = await getSettings();
  const data = await getStreakData(settings.dailyGoal);
  const newlyUnlocked = checkNewMilestones(data.longest, data.milestonesReached);
  if (newlyUnlocked.length === 0) return [];

  // Update cache
  const allIds = [...data.milestonesReached, ...newlyUnlocked.map((r) => r.id)];
  const raw = await AsyncStorage.getItem(KEYS.STREAK);
  if (raw) {
    const cache = JSON.parse(raw);
    cache.milestonesReached = allIds;
    // Mark permanent milestones permanently (never lost)
    for (const r of newlyUnlocked) {
      const reward = REWARDS.find((x) => x.id === r.id);
      if (reward?.permanent) {
        if (!cache.permanentMilestones) cache.permanentMilestones = [];
        if (!cache.permanentMilestones.includes(r.id)) {
          cache.permanentMilestones.push(r.id);
        }
      }
    }
    await AsyncStorage.setItem(KEYS.STREAK, JSON.stringify(cache));
  }

  return newlyUnlocked;
}

/**
 * Use a streak freeze to protect a missed day.
 * Adds the day to frozenDays, decrements freezesAvailable, and forces a cache rebuild.
 * Returns true if the freeze was applied, false if none available.
 */
export async function useFreeze(dateStr) {
  const raw = await AsyncStorage.getItem(KEYS.STREAK);
  if (!raw) return false;
  const cache = JSON.parse(raw);
  if (cache.freezesAvailable <= 0) return false;

  cache.freezesAvailable--;
  if (!cache.frozenDays) cache.frozenDays = [];
  if (!cache.frozenDays.includes(dateStr)) {
    cache.frozenDays.push(dateStr);
  }

  // Invalidate by setting a stale date so next getStreakData rebuilds
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  cache.lastBuildDate = dateKey(yesterday);

  await AsyncStorage.setItem(KEYS.STREAK, JSON.stringify(cache));
  return true;
}

/**
 * Check if yesterday was missed (no log / under goal) and a freeze is available.
 * Returns { missed: boolean, dateStr: string | null, freezesAvailable: number }
 */
export async function checkMissedDay() {
  const settings = await getSettings();
  const data = await getStreakData(settings.dailyGoal);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = dateKey(yesterday);

  const yesterdayEntry = (data.history || []).find((h) => h.date === yesterdayStr);
  // Missed = yesterday in history but goal not met AND not frozen,
  // OR yesterday completely skipped (not in history at all) AND had a streak going
  let missed = false;
  if (yesterdayEntry) {
    missed = !yesterdayEntry.goalMet && !yesterdayEntry.frozen;
  } else {
    // No logs for yesterday — also missed, check if there's any history (user has logged before)
    const hasPreviousLogs = data.history.length > 0 || data.longest > 0;
    missed = hasPreviousLogs;
  }

  return {
    missed,
    dateStr: missed ? yesterdayStr : null,
    freezesAvailable: data.freezesAvailable,
    currentStreak: data.current,
  };
}

// ─── Milestone Celebration Tracking (Story 2.7) ─────────────────

/**
 * Get the set of streak milestones that have already been celebrated.
 * Uses a dedicated AsyncStorage key to avoid race conditions with saveSettings().
 * @returns {Promise<number[]>} — array of milestone numbers (e.g., [7, 30])
 */
export async function getCelebratedMilestones() {
  const raw = await AsyncStorage.getItem(KEYS.MILESTONES);
  return raw ? JSON.parse(raw) : [];
}

/**
 * Record a streak milestone as celebrated. Idempotent — won't duplicate entries.
 * @param {number} milestone — 7 or 30
 * @returns {Promise<number[]>} — updated list of celebrated milestones
 */
export async function saveCelebratedMilestone(milestone) {
  const current = await getCelebratedMilestones();
  if (!current.includes(milestone)) {
    current.push(milestone);
  }
  await AsyncStorage.setItem(KEYS.MILESTONES, JSON.stringify(current));
  return current;
}

// ─── Settings ───────────────────────────────────────

export async function getSettings() {
  const raw = await AsyncStorage.getItem(KEYS.SETTINGS);
  return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
}

export async function saveSettings(updates) {
  const current = await getSettings();
  const merged = { ...current, ...updates };
  await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(merged));
  return merged;
}

// ─── Achievements ─────────────────────────────────────

const ACHIEVEMENT_KEYS = {
  UNLOCKED: "@plenty_achievements",
  PROGRESS: "@plenty_achievement_progress",
};

export async function getUnlockedAchievements() {
  const raw = await AsyncStorage.getItem(ACHIEVEMENT_KEYS.UNLOCKED);
  return raw ? JSON.parse(raw) : [];
}

export async function unlockAchievement(id) {
  const current = await getUnlockedAchievements();
  if (current.includes(id)) return current; // idempotent
  const updated = [...current, id];
  await AsyncStorage.setItem(ACHIEVEMENT_KEYS.UNLOCKED, JSON.stringify(updated));
  return updated;
}

export async function getAchievementProgress() {
  const raw = await AsyncStorage.getItem(ACHIEVEMENT_KEYS.PROGRESS);
  return raw ? JSON.parse(raw) : {};
}

export async function setAchievementProgress(id, val) {
  const current = await getAchievementProgress();
  current[id] = val;
  await AsyncStorage.setItem(ACHIEVEMENT_KEYS.PROGRESS, JSON.stringify(current));
  return current;
}

export async function incrementAchievementProgress(id) {
  const current = await getAchievementProgress();
  current[id] = (current[id] || 0) + 1;
  await AsyncStorage.setItem(ACHIEVEMENT_KEYS.PROGRESS, JSON.stringify(current));
  return current[id];
}

export async function resetAchievementProgress() {
  await AsyncStorage.removeItem(ACHIEVEMENT_KEYS.PROGRESS);
}

// ─── Monthly Report Cache (Epic A) ─────────────────────

export async function getMonthlyCache() {
  const raw = await AsyncStorage.getItem(KEYS.MONTHLY_CACHE);
  return raw ? JSON.parse(raw) : {};
}

export async function setMonthlyCache(reports) {
  await AsyncStorage.setItem(KEYS.MONTHLY_CACHE, JSON.stringify(reports));
}

// ─── Export / Import (Epic E) ───────────────────────────

export async function getAllLogs() {
  return await getLogs();
}

export async function importLogs(logs) {
  await AsyncStorage.setItem(KEYS.LOGS, JSON.stringify(logs));
}

export async function importSettings(settings) {
  await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
}

export async function importAchievements(unlocked, progress) {
  await AsyncStorage.setItem(ACHIEVEMENT_KEYS.UNLOCKED, JSON.stringify(unlocked || []));
  await AsyncStorage.setItem(ACHIEVEMENT_KEYS.PROGRESS, JSON.stringify(progress || {}));
}

// ─── Goal Intelligence Helpers (Epic C) ─────────────────

/** Weight-based daily goal in glasses (250ml each) */
export function weightBasedGoal(weightKg) {
  if (!weightKg || weightKg <= 0) return null;
  const liters = weightKg * 0.033;
  return Math.max(Math.round(liters / 0.25), 1);
}

/** Convert lbs to kg */
export function lbsToKg(lbs) {
  return lbs * 0.453592;
}

/** Add activity boost to goal */
export function activityBoostedGoal(baseGoal, exercised) {
  return exercised ? baseGoal + Math.round(750 / 250) : baseGoal; // +750ml ≈ +3 glasses
}

// ─── Theme Preference (Sprint 5) ─────────────────────────

export async function getThemePreference() {
  const raw = await AsyncStorage.getItem("@plenty_theme");
  return raw || "auto";
}

export async function saveThemePreference(mode) {
  await AsyncStorage.setItem("@plenty_theme", mode);
}

// ─── Onboarding Flag (Epic 4) ──────────────────────────────

export async function getOnboarded() {
  const raw = await AsyncStorage.getItem(KEYS.ONBOARDED);
  return raw === "true";
}

export async function setOnboarded(val) {
  await AsyncStorage.setItem(KEYS.ONBOARDED, val ? "true" : "false");
}
