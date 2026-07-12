import { Platform } from "react-native";

let HealthConnect = null;

// Lazy-load to avoid import crashes on iOS / Expo Go
try {
  HealthConnect = require("react-native-health-connect");
} catch (e) {
  // Native module not available — will gracefully no-op
}

const STORAGE_KEY = "@plenty_health_sync";
const LAST_SYNC_KEY = "@plenty_health_last_sync";

/**
 * Check if Health Connect is available and initialized.
 * Returns false on iOS or when the native module isn't linked.
 */
export async function isHealthConnectAvailable() {
  if (!HealthConnect || Platform.OS !== "android") return false;
  try {
    const status = await HealthConnect.getSdkStatus();
    return status === HealthConnect.SdkAvailabilityStatus.SDK_AVAILABLE;
  } catch {
    return false;
  }
}

/**
 * Get the user's sync preference from AsyncStorage.
 */
export async function getSyncPreference() {
  try {
    const { getItem } = require("@react-native-async-storage/async-storage");
    const val = await getItem(STORAGE_KEY);
    return val === "true" ? true : false;
  } catch {
    return false;
  }
}

/**
 * Persist the user's sync preference.
 */
export async function saveSyncPreference(enabled) {
  try {
    const { setItem } = require("@react-native-async-storage/async-storage");
    await setItem(STORAGE_KEY, enabled ? "true" : "false");
  } catch (e) {
    console.warn("⚠️ Failed to save sync preference:", e.message);
  }
}

/**
 * Get last sync timestamp (ISO string).
 */
export async function getLastSyncTime() {
  try {
    const { getItem } = require("@react-native-async-storage/async-storage");
    return await getItem(LAST_SYNC_KEY);
  } catch {
    return null;
  }
}

/**
 * Request read + write permissions for Hydration records.
 * Returns true if granted.
 */
export async function requestHydrationPermissions() {
  if (!HealthConnect) return false;
  try {
    const granted = await HealthConnect.requestPermission([
      { accessType: "read", recordType: "Hydration" },
      { accessType: "write", recordType: "Hydration" },
    ]);
    return granted && granted.length >= 2;
  } catch (e) {
    console.warn("⚠️ Health Connect permission request failed:", e.message);
    return false;
  }
}

/**
 * Write a hydration record to Health Connect.
 *
 * @param {number} volumeMl - Volume in milliliters
 * @param {string} startTime - ISO timestamp (when the drink was logged)
 */
export async function writeHydrationRecord(volumeMl, startTime) {
  if (!HealthConnect) return false;
  try {
    const endTime = new Date(
      new Date(startTime).getTime() + 1000
    ).toISOString();
    await HealthConnect.insertRecords([
      {
        recordType: "Hydration",
        startTime,
        endTime,
        volume: {
          value: Math.round(volumeMl),
          unit: "milliliters",
        },
      },
    ]);
    await _saveLastSync();
    return true;
  } catch (e) {
    console.warn("⚠️ Health Connect write failed:", e.message);
    return false;
  }
}

/**
 * Read hydration records from Health Connect for a given time range.
 *
 * @param {string} startTime - ISO start of the range
 * @param {string} endTime - ISO end of the range
 * @returns {Array<{ volumeMl: number, startTime: string }>}
 */
export async function readHydrationRecords(startTime, endTime) {
  if (!HealthConnect) return [];
  try {
    const result = await HealthConnect.readRecords("Hydration", {
      timeRangeFilter: {
        operator: "between",
        startTime,
        endTime,
      },
      ascendingOrder: true,
    });
    return result.records.map((r) => ({
      volumeMl: r.volume.inMilliliters,
      startTime: r.startTime,
    }));
  } catch (e) {
    console.warn("⚠️ Health Connect read failed:", e.message);
    return [];
  }
}

/**
 * Pull water data from the last 7 days and return it as a flat array
 * of {volumeMl, startTime} entries.  Useful for first-sync merge.
 */
export async function readLast7Days() {
  const end = new Date().toISOString();
  const start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  return await readHydrationRecords(start, end);
}

async function _saveLastSync() {
  try {
    const { setItem } = require("@react-native-async-storage/async-storage");
    await setItem(LAST_SYNC_KEY, new Date().toISOString());
  } catch {
    // best-effort
  }
}
