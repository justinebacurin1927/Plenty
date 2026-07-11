import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Vibration,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Mascot, { getRandomMessage, streakToExpression } from "../components/Mascot";
import AchievementPopup from "../components/AchievementPopup";
import { getTodayLogs, addLog, getSettings, getStreak } from "../utils/storage";
import { checkAchievements } from "../utils/achievements";
import {
  requestPermission,
  scheduleWaterReminder,
  cancelAllReminders,
  getScheduledReminders,
  getEscalationTier,
} from "../utils/notifications";

// Presets in minutes, stored as seconds internally
const PRESET_MINUTES = [1, 5, 15, 30, 60, 120];

/** Parse "30s" / "5m" / "2h" to seconds. Returns null if unparseable. */
function parseInterval(text) {
  if (!text) return null;
  const m = text.trim().match(/^(\d+)\s*(s|m|h)$/);
  if (!m) return null;
  const val = parseInt(m[1], 10);
  if (val <= 0) return null;
  if (m[2] === "s") return val;
  if (m[2] === "m") return val * 60;
  if (m[2] === "h") return val * 3600;
  return null;
}

/** Format seconds for display */
function formatInterval(sec) {
  if (sec >= 3600 && sec % 3600 === 0) return `${sec / 3600}h`;
  if (sec >= 60 && sec % 60 === 0) return `${sec / 60}m`;
  return `${sec}s`;
}

const AMOUNT_OPTIONS = [100, 200, 250, 500];

export default function HomeScreen({ navigation }) {
  const [todayCount, setTodayCount] = useState(0);
  const [todayMl, setTodayMl] = useState(0);
  const [dailyGoal, setDailyGoal] = useState(8);
  const [drinkAmount, setDrinkAmount] = useState(250);
  const [streak, setStreak] = useState(0);
  const [selectedInterval, setSelectedInterval] = useState(1800); // 30m in seconds
  const [customText, setCustomText] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(null);
  const [intervalError, setIntervalError] = useState("");
  const [showAmountPicker, setShowAmountPicker] = useState(false);
  const [mascotExpression, setMascotExpression] = useState("happy");
  const [mascotMessage, setMascotMessage] = useState(null);
  const [popupAchievements, setPopupAchievements] = useState([]);
  const [escalationTier, setEscalationTier] = useState("normal");
  const [mascotCelebration, setMascotCelebration] = useState(false);
  const [mascotVariant, setMascotVariant] = useState("classic");
  const EXPRESSIONS = ["happy", "excited", "reminding", "sleepy"];

  // Load everything on mount
  useEffect(() => {
    loadData().catch((e) =>
      console.error("Failed to load data:", e.message, e.stack)
    );
    // Silent achievement check — record any earned while app was closed,
    // but don't popup (user saw notifications for these)
    checkAchievements().then((unlocked) => {
      if (unlocked.length > 0) {
        console.log(`🏆 Background unlock: ${unlocked.map((a) => a.title).join(", ")}`);
      }
    });
  }, []);

  const loadData = async () => {
    const settings = await getSettings();
    setDailyGoal(settings.dailyGoal);
    setDrinkAmount(settings.drinkAmount);
    const logs = await getTodayLogs();
    const totalMl = logs.reduce((sum, entry) => sum + (entry.amount || 250), 0);
    setTodayCount(logs.length);
    setTodayMl(totalMl);
    setMascotVariant(settings.mascotVariant || "classic");
    const s = await getStreak(settings.dailyGoal);
    setStreak(s);
    setMascotExpression(streakToExpression(s));
    const tier = await getEscalationTier();
    setEscalationTier(tier);
  };

  // Refresh data when screen comes into focus
  useEffect(() => {
    const unsub = navigation?.addListener("focus", loadData);
    return unsub;
  }, []);

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

      setIntervalError("");
      if (selectedInterval < 60) {
        setIntervalError("Minimum interval is 60 seconds on Android");
        return;
      }
      console.log(`✅ Scheduling reminders every ${formatInterval(selectedInterval)}`);
      const settings = await getSettings();
      await scheduleWaterReminder(selectedInterval, {
        enabled: settings.quietHoursEnabled,
        start: settings.quietHoursStart,
        end: settings.quietHoursEnd,
      });
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

  const logDrink = useCallback(
    async (amount) => {
      await addLog({ amount });
      Vibration.vibrate(50);
      setTodayCount((c) => c + 1);
      setTodayMl((m) => m + amount);
      const s = await getStreak(dailyGoal);
      setStreak(s);
      setMascotExpression(streakToExpression(s));
      console.log(`💧 Drank ${amount}ml! Total today: ${todayMl + amount}ml`);

      // Check for newly unlocked achievements
      const newlyUnlocked = await checkAchievements();
      if (newlyUnlocked.length > 0) {
        setPopupAchievements(newlyUnlocked);
        setMascotCelebration(true);
        setMascotExpression("excited");
        setMascotMessage(`🎉 ${newlyUnlocked[0].emoji} ${newlyUnlocked[0].title}!`);
        setTimeout(() => setMascotCelebration(false), 2000);
        console.log(`🏆 Unlocked: ${newlyUnlocked.map((a) => a.title).join(", ")}`);
      }
    },
    [todayMl, dailyGoal]
  );

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

  const cycleExpression = useCallback(() => {
    setMascotExpression((prev) => {
      const idx = EXPRESSIONS.indexOf(prev);
      return EXPRESSIONS[(idx + 1) % EXPRESSIONS.length];
    });
    setMascotMessage(getRandomMessage());
    if (window._mascotTimer) clearTimeout(window._mascotTimer);
    window._mascotTimer = setTimeout(() => setMascotMessage(null), 2500);
  }, []);
  const goalMl = dailyGoal * 250;
  const progressPct = Math.min(todayMl / goalMl, 1);
  const glassesFromMl = Math.round(todayMl / 250);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.mascotArea}>
            <Mascot size={100} expression={mascotExpression} variant={mascotVariant} celebration={mascotCelebration} onPress={cycleExpression} message={mascotMessage} />
          </View>
          <View>
            <Text style={styles.title}>Plenty</Text>
            <Text style={styles.subtitle}>Stay hydrated</Text>
          </View>
        </View>

        {/* ── Streak ── */}
        {streak > 0 && (
          <View style={styles.streakBadge}>
            <Text style={styles.streakText}>🔥 {streak} day{streak > 1 ? "s" : ""}</Text>
          </View>
        )}

        {/* ── Escalation Banner ── */}
        {escalationTier !== "normal" && (
          <View style={[styles.escalationBanner, escalationTier === "alert" ? styles.escalationAlert : styles.escalationWarning]}>
            <Ionicons name={escalationTier === "alert" ? "alert-circle" : "warning"} size={18} color="#fff" />
            <Text style={styles.escalationText}>
              {escalationTier === "alert"
                ? "🔴 You haven't logged in a while! Drink some water now."
                : "⚠️ It's been a while — time to hydrate!"}
            </Text>
          </View>
        )}

        {/* ── Progress Bar ── */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Ionicons name="water" size={32} color="#4A90D9" />
            <Text style={styles.progressCount}>{todayMl}ml</Text>
          </View>
          <Text style={styles.progressLabel}>
            {glassesFromMl} / {dailyGoal} glasses
          </Text>
          {/* Bar */}
          <View style={styles.barBg}>
            <View style={[styles.barFill, { width: `${progressPct * 100}%` }]} />
          </View>
          {progressPct >= 1 && (
            <Text style={styles.goalMet}>🎉 Goal reached!</Text>
          )}
        </View>

        {/* ── Interval Picker ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Remind me every</Text>
          <View style={styles.intervalRow}>
            {PRESET_MINUTES.map((min) => {
              const sec = min * 60;
              return (
                <TouchableOpacity
                  key={min}
                  style={[
                    styles.intervalChip,
                    selectedInterval === sec && !customText && styles.intervalChipActive,
                  ]}
                  onPress={() => {
                    setSelectedInterval(sec);
                    setCustomText("");
                    setIntervalError("");
                  }}
                >
                  <Text
                    style={[
                      styles.intervalText,
                      selectedInterval === sec && !customText && styles.intervalTextActive,
                    ]}
                  >
                    {min < 60 ? `${min}m` : `${min / 60}h`}
                  </Text>
                </TouchableOpacity>
              );
            })}
            <TextInput
              style={[
                styles.customInput,
                customText ? styles.customInputActive : null,
              ]}
              placeholder="ex: 30s"
              placeholderTextColor="#A0B8D0"
              autoCapitalize="none"
              autoCorrect={false}
              value={customText}
              onChangeText={(t) => {
                setCustomText(t);
                setIntervalError("");
                const parsed = parseInterval(t);
                if (parsed !== null) setSelectedInterval(parsed);
              }}
            />
          </View>
          {customText && parseInterval(customText) === null && customText.length > 0 && (
            <Text style={styles.inputHint}>Use 30s, 5m, or 2h</Text>
          )}
          {intervalError ? (
            <Text style={styles.inputHint}>{intervalError}</Text>
          ) : null}
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
        <TouchableOpacity
          style={styles.drinkButton}
          onPress={() => logDrink(drinkAmount)}
          onLongPress={() => setShowAmountPicker(true)}
          delayLongPress={300}
        >
          <Ionicons name="add-circle" size={24} color="#4A90D9" />
          <Text style={styles.drinkButtonText}>I drank water ({drinkAmount}ml)</Text>
        </TouchableOpacity>

        {/* ── Permission Warning ── */}
        {permissionGranted === false && (
          <Text style={styles.warning}>
            Notifications not enabled. Enable them in Settings to receive reminders.
          </Text>
        )}
      </ScrollView>

      {/* ── Amount Picker Modal ── */}
      <Modal visible={showAmountPicker} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowAmountPicker(false)}
        >
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>How much did you drink?</Text>
            {AMOUNT_OPTIONS.map((amount) => (
              <TouchableOpacity
                key={amount}
                style={styles.modalOption}
                onPress={() => {
                  logDrink(amount);
                  setShowAmountPicker(false);
                }}
              >
                <Ionicons
                  name={amount === drinkAmount ? "water" : "water-outline"}
                  size={22}
                  color="#4A90D9"
                />
                <Text style={styles.modalOptionText}>{amount} ml</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.modalCancel}
              onPress={() => setShowAmountPicker(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Achievement Popup ── */}
      <AchievementPopup
        achievements={popupAchievements}
        visible={popupAchievements.length > 0}
        onDismiss={() => setPopupAchievements([])}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E8F4FD",
  },
  scroll: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    width: "100%",
    justifyContent: "center",
  },
  mascotArea: {
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

  // ── Streak ──
  streakBadge: {
    marginTop: 16,
    backgroundColor: "#FFF3E0",
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  streakText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#E67E22",
  },

  // ── Escalation Banner ──
  escalationBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    width: "100%",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 12,
  },
  escalationWarning: {
    backgroundColor: "#E67E22",
  },
  escalationAlert: {
    backgroundColor: "#E8596E",
  },
  escalationText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#fff",
    flex: 1,
  },

  // ── Progress ──
  progressCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 32,
    alignItems: "center",
    width: "100%",
    marginTop: 20,
    shadowColor: "#4A90D9",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  progressCount: {
    fontSize: 36,
    fontWeight: "800",
    color: "#1A3A5C",
  },
  progressLabel: {
    fontSize: 16,
    color: "#6B8CAB",
    marginTop: 4,
    marginBottom: 12,
  },
  barBg: {
    width: "100%",
    height: 12,
    borderRadius: 6,
    backgroundColor: "#E8F0FE",
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 6,
    backgroundColor: "#4A90D9",
  },
  goalMet: {
    fontSize: 15,
    fontWeight: "700",
    color: "#27AE60",
    marginTop: 8,
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
    flexWrap: "wrap",
    justifyContent: "center",
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
  customInput: {
    width: 64,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#D6E4F0",
    fontSize: 14,
    fontWeight: "600",
    color: "#4A6A85",
    textAlign: "center",
  },
  customInputActive: {
    borderColor: "#4A90D9",
    backgroundColor: "#E8F0FE",
  },
  inputHint: {
    fontSize: 12,
    color: "#E8596E",
    marginTop: 6,
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
    paddingVertical: 14,
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

  // ── Modal ──
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A3A5C",
    marginBottom: 16,
    textAlign: "center",
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "#F5F9FF",
    marginBottom: 8,
  },
  modalOptionText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A3A5C",
  },
  modalCancel: {
    alignItems: "center",
    paddingVertical: 14,
    marginTop: 4,
  },
  modalCancelText: {
    fontSize: 16,
    color: "#6B8CAB",
    fontWeight: "600",
  },
});
