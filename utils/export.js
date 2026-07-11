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

export async function importFromJSON(jsonString) {
  let data;
  try {
    data = JSON.parse(jsonString);
  } catch {
    throw new Error("Invalid JSON file");
  }

  if (!data.version) {
    throw new Error("Unsupported backup format");
  }

  const tasks = [];
  if (data.logs) tasks.push(importLogs(data.logs));
  if (data.settings) tasks.push(importSettings(data.settings));
  if (data.achievements) {
    tasks.push(
      importAchievements(data.achievements.unlocked, data.achievements.progress)
    );
  }

  if (tasks.length === 0) {
    throw new Error("No data found in backup file");
  }

  await Promise.all(tasks);
  return {
    logs: data.logs?.length ?? 0,
    hasSettings: !!data.settings,
    hasAchievements: !!data.achievements,
  };
}
