import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import {
  getLogs,
  getSettings,
  getUnlockedAchievements,
  getAchievementProgress,
  importLogs,
  importSettings,
  importAchievements,
} from "./storage";

// ─── CSV Export (E1) ────────────────────────────────

export function logsToCSV(logs) {
  const header = "Date,Time,Amount (ml),Day of Week";
  const rows = logs.map((entry) => {
    const d = new Date(entry.timestamp);
    const date = d.toISOString().split("T")[0];
    const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
    const amount = entry.amount || 250;
    const dayName = d.toLocaleDateString("en-US", { weekday: "long" });
    return `${date},${time},${amount},"${dayName}"`;
  });

  return [header, ...rows].join("\n");
}

export async function exportToCSV() {
  const logs = await getLogs();
  if (logs.length === 0) {
    throw new Error("No logs to export");
  }

  const csv = logsToCSV(logs);
  const filename = `plenty-export-${new Date().toISOString().split("T")[0]}.csv`;
  const filePath = `${FileSystem.cacheDirectory}${filename}`;

  await FileSystem.writeAsStringAsync(filePath, csv, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(filePath, {
      mimeType: "text/csv",
      dialogTitle: "Export Plenty data",
    });
  } else {
    throw new Error("Sharing is not available on this device");
  }

  return filePath;
}

// ─── JSON Backup (E3) ────────────────────────────────

export async function exportToJSON() {
  const [logs, settings, unlockedAchievements, achievementProgress] = await Promise.all([
    getLogs(),
    getSettings(),
    getUnlockedAchievements(),
    getAchievementProgress(),
  ]);

  const backup = {
    version: 1,
    exportedAt: new Date().toISOString(),
    logs,
    settings,
    achievements: {
      unlocked: unlockedAchievements,
      progress: achievementProgress,
    },
  };

  const json = JSON.stringify(backup, null, 2);
  const filename = `plenty-backup-${new Date().toISOString().split("T")[0]}.json`;
  const filePath = `${FileSystem.cacheDirectory}${filename}`;

  await FileSystem.writeAsStringAsync(filePath, json, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(filePath, {
      mimeType: "application/json",
      dialogTitle: "Backup Plenty data",
    });
  } else {
    throw new Error("Sharing is not available on this device");
  }

  return filePath;
}

// ─── JSON Import (E4) ───────────────────────────────

function isValidLogEntry(entry) {
  if (!entry || typeof entry !== "object") return false;
  if (!entry.id || !entry.timestamp) return false;
  const ts = new Date(entry.timestamp);
  if (isNaN(ts.getTime())) return false;
  if (entry.amount !== undefined && (typeof entry.amount !== "number" || entry.amount <= 0)) return false;
  return true;
}

function isValidSettings(settings) {
  if (!settings || typeof settings !== "object" || Array.isArray(settings)) return false;
  const defaults = { intervalMinutes: 30, dailyGoal: 8, drinkAmount: 250, sound: true };
  return Object.keys(defaults).some((k) => k in settings);
}

function isValidAchievements(unlocked, progress) {
  if (unlocked && (!Array.isArray(unlocked) || unlocked.some((id) => !id))) return false;
  if (progress && (typeof progress !== "object" || Array.isArray(progress))) return false;
  return true;
}

export async function importFromJSON(jsonString) {
  let data;
  try {
    data = JSON.parse(jsonString);
  } catch {
    throw new Error("Invalid JSON file — the file doesn't appear to be valid JSON.");
  }

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("Unsupported backup format — the file doesn't match a Plenty backup.");
  }

  if (!data.version) {
    throw new Error("Unsupported backup format — the backup version is missing or incompatible.");
  }

  const errors = [];

  // Validate logs
  if (data.logs !== undefined) {
    if (!Array.isArray(data.logs)) {
      errors.push("Logs data is not a list");
      data.logs = [];
    } else {
      const badEntries = data.logs.filter((e) => !isValidLogEntry(e));
      if (badEntries.length > 0) {
        errors.push(`${badEntries.length} log entr${badEntries.length === 1 ? "y" : "ies"} skipped due to missing or invalid data`);
        data.logs = data.logs.filter(isValidLogEntry);
      }
    }
  }

  // Validate settings
  if (data.settings !== undefined && !isValidSettings(data.settings)) {
    errors.push("Settings data is invalid — using defaults for missing values");
    data.settings = {};
  }

  // Validate achievements
  if (data.achievements !== undefined) {
    const a = data.achievements;
    if (!isValidAchievements(a.unlocked, a.progress)) {
      errors.push("Achievement data is invalid — skipping");
      data.achievements = null;
    }
  }

  const tasks = [];
  if (data.logs) tasks.push(importLogs(data.logs));
  if (data.settings) tasks.push(importSettings(data.settings));
  if (data.achievements) {
    tasks.push(
      importAchievements(data.achievements.unlocked, data.achievements.progress)
    );
  }

  if (tasks.length === 0 && errors.length === 0) {
    throw new Error("No data found in backup file — nothing to import.");
  }

  await Promise.all(tasks);
  return {
    logs: data.logs?.length ?? 0,
    hasSettings: !!data.settings,
    hasAchievements: !!data.achievements,
    warnings: errors.length > 0 ? errors : undefined,
  };
}
