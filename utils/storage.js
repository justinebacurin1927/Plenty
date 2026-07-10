import AsyncStorage from "@react-native-async-storage/async-storage";

const KEYS = {
  LOGS: "@plenty_logs",
  SETTINGS: "@plenty_settings",
};

const DEFAULT_SETTINGS = {
  intervalMinutes: 30,
  sound: true,
  quietHoursEnabled: false,
  quietHoursStart: "22:00",
  quietHoursEnd: "08:00",
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
