import AsyncStorage from "@react-native-async-storage/async-storage";

const KEYS = {
  LOGS: "@plenty_logs",
  SETTINGS: "@plenty_settings",
  MONTHLY_CACHE: "@plenty_monthly_cache",
};

const DEFAULT_SETTINGS = {
  intervalMinutes: 30,
  sound: true,
  quietHoursEnabled: false,
  quietHoursStart: "22:00",
  quietHoursEnd: "08:00",
  dailyGoal: 8,
  drinkAmount: 250,
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

  return logs.filter((entry) => new Date(entry.timestamp).getTime() >= startOfDay);
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
  const logs = await getLogs();
  const today = new Date();
  let streak = 0;
  for (let i = 0; ; i++) {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
    const dayLogs = logs.filter((entry) => {
      const t = new Date(entry.timestamp);
      return (
        t.getFullYear() === date.getFullYear() &&
        t.getMonth() === date.getMonth() &&
        t.getDate() === date.getDate()
      );
    });
    const total = dayLogs.reduce((sum, entry) => sum + (entry.amount || 250), 0);
    const glasses = Math.round(total / 250);
    if (glasses >= goal) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
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
