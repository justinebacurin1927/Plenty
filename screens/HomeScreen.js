import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Vibration,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getTodayLogs, addLog } from "../utils/storage";
import {
  requestPermission,
  scheduleWaterReminder,
  cancelAllReminders,
  getScheduledReminders,
} from "../utils/notifications";

const INTERVALS = [15, 30, 45, 60, 120];

export default function HomeScreen() {
  const [todayCount, setTodayCount] = useState(0);
  const [selectedInterval, setSelectedInterval] = useState(30);
  const [isActive, setIsActive] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(null);

  // Load today's count on mount
  useEffect(() => {
    loadTodayCount().catch((e) =>
      console.error("Failed to load today count:", e.message, e.stack)
    );
  }, []);

  const loadTodayCount = async () => {
    const logs = await getTodayLogs();
    setTodayCount(logs.length);
  };

  // ── Start Reminder ────────────────────────────────

  const startReminder = async () => {
    try {
      console.log("🔔 Requesting notification permission...");
      const granted = await requestPermission();
      setPermissionGranted(granted);
      if (!granted) {
        console.warn("🚫 Notification permission denied");
        return;
      }

      console.log(`✅ Scheduling reminders every ${selectedInterval} minutes`);
      await scheduleWaterReminder(selectedInterval);
      setIsActive(true);
      console.log("✅ Reminders are now active");
    } catch (e) {
      console.error("❌ Failed to start reminders:", e.message, e.stack);
    }
  };

  // ── Stop Reminder ─────────────────────────────────

  const stopReminder = async () => {
    try {
      console.log("🛑 Stopping all reminders");
      await cancelAllReminders();
      setIsActive(false);
      console.log("✅ All reminders cancelled");
    } catch (e) {
      console.error("❌ Failed to stop reminders:", e.message, e.stack);
    }
  };

  // ── Log Drink ──────────────────────────────────────

  const logDrink = useCallback(async () => {
    await addLog({ amount: 250 }); // 250ml per drink
    Vibration.vibrate(50);
    setTodayCount((c) => c + 1);
    console.log(`💧 Drank water! Total today: ${todayCount + 1} glasses`);
  }, [todayCount]);

  // ── Check if reminders are active on mount ────────

  useEffect(() => {
    (async () => {
      try {
        const reminders = await getScheduledReminders();
        console.log(
          reminders.length > 0
            ? `✅ Found ${reminders.length} active reminder(s) on app start`
            : "ℹ️ No active reminders on app start"
        );
        if (reminders.length > 0) setIsActive(true);
      } catch (e) {
        console.error("Failed to check reminders on mount:", e.message, e.stack);
      }
    })();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.title}>Plenty</Text>
        <Text style={styles.subtitle}>Stay hydrated</Text>
      </View>

      {/* ── Today's Progress ── */}
      <View style={styles.progressCard}>
        <Ionicons name="water" size={48} color="#4A90D9" />
        <Text style={styles.progressCount}>{todayCount}</Text>
        <Text style={styles.progressLabel}>glasses today</Text>
      </View>

      {/* ── Interval Picker ── */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Remind me every</Text>
        <View style={styles.intervalRow}>
          {INTERVALS.map((min) => (
            <TouchableOpacity
              key={min}
              style={[
                styles.intervalChip,
                selectedInterval === min && styles.intervalChipActive,
              ]}
              onPress={() => setSelectedInterval(min)}
            >
              <Text
                style={[
                  styles.intervalText,
                  selectedInterval === min && styles.intervalTextActive,
                ]}
              >
                {min < 60 ? `${min}m` : `${min / 60}h`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── Start / Stop Button ── */}
      <TouchableOpacity
        style={[styles.mainButton, isActive ? styles.stopButton : styles.startButton]}
        onPress={isActive ? stopReminder : startReminder}
      >
        <Ionicons
          name={isActive ? "pause-circle" : "notifications"}
          size={28}
          color="#fff"
        />
        <Text style={styles.mainButtonText}>
          {isActive ? "Stop Reminders" : "Start Reminders"}
        </Text>
      </TouchableOpacity>

      {/* ── Quick Log Drink ── */}
      <TouchableOpacity style={styles.drinkButton} onPress={logDrink}>
        <Ionicons name="add-circle" size={24} color="#4A90D9" />
        <Text style={styles.drinkButtonText}>I drank water</Text>
      </TouchableOpacity>

      {/* ── Permission Warning ── */}
      {permissionGranted === false && (
        <Text style={styles.warning}>
          Notifications not enabled. Enable them in Settings to receive reminders.
        </Text>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F9FF",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  header: {
    marginTop: 40,
    alignItems: "center",
  },
  title: {
    fontSize: 36,
    fontWeight: "700",
    color: "#1A3A5C",
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    color: "#6B8CAB",
    marginTop: 4,
  },

  // ── Progress ──
  progressCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingVertical: 32,
    paddingHorizontal: 48,
    alignItems: "center",
    marginTop: 32,
    shadowColor: "#4A90D9",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  progressCount: {
    fontSize: 52,
    fontWeight: "800",
    color: "#1A3A5C",
    marginTop: 8,
  },
  progressLabel: {
    fontSize: 16,
    color: "#6B8CAB",
    marginTop: 4,
  },

  // ── Interval ──
  section: {
    marginTop: 28,
    alignItems: "center",
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#4A6A85",
    marginBottom: 10,
  },
  intervalRow: {
    flexDirection: "row",
    gap: 10,
  },
  intervalChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#D6E4F0",
  },
  intervalChipActive: {
    backgroundColor: "#4A90D9",
    borderColor: "#4A90D9",
  },
  intervalText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4A6A85",
  },
  intervalTextActive: {
    color: "#fff",
  },

  // ── Main Button ──
  mainButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    width: "100%",
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 28,
  },
  startButton: {
    backgroundColor: "#4A90D9",
  },
  stopButton: {
    backgroundColor: "#E8596E",
  },
  mainButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },

  // ── Quick Log ──
  drinkButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: "#E8F0FE",
  },
  drinkButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4A90D9",
  },

  // ── Warning ──
  warning: {
    color: "#E8596E",
    fontSize: 13,
    textAlign: "center",
    marginTop: 16,
    paddingHorizontal: 20,
  },
});
