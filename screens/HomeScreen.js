import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Vibration,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Mascot, { getRandomMessage, streakToExpression } from "../components/Mascot";
import AchievementPopup from "../components/AchievementPopup";
import WeatherBanner from "../components/WeatherBanner";
import { getTodayLogs, addLog, getSettings, getStreak, getLogs } from "../utils/storage";
import { checkAchievements } from "../utils/achievements";
import { getPeakHoursSummary } from "../utils/patterns";
import {
  requestPermission,
  scheduleWaterReminder,
  cancelAllReminders,
  getScheduledReminders,
  getEscalationTier,
} from "../utils/notifications";
import { useTheme } from "../context/ThemeContext";
import { refreshWidget } from "../utils/widget";
import {
  isHealthConnectAvailable,
  getSyncPreference,
  writeHydrationRecord,
} from "../utils/health";
import { ShareCardForwardRef } from "../components/ShareCard";
import { captureAndShare } from "../utils/share";

const PRESET_MINUTES = [1, 5, 15, 30, 60, 120];

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

function formatInterval(sec) {
  if (sec >= 3600 && sec % 3600 === 0) return `${sec / 3600}h`;
  if (sec >= 60 && sec % 60 === 0) return `${sec / 60}m`;
  return `${sec}s`;
}

const AMOUNT_OPTIONS = [100, 200, 250, 500];

export default function HomeScreen({ navigation }) {
  const { colors } = useTheme();
  const s = makeStyles(colors);

  const [todayCount, setTodayCount] = useState(0);
  const [todayMl, setTodayMl] = useState(0);
  const [dailyGoal, setDailyGoal] = useState(8);
  const [drinkAmount, setDrinkAmount] = useState(250);
  const [streak, setStreak] = useState(0);
  const [selectedInterval, setSelectedInterval] = useState(1800);
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
  const [peakTimeHint, setPeakTimeHint] = useState(null);
  const [hasWeatherLocation, setHasWeatherLocation] = useState(false);
  const [weatherLat, setWeatherLat] = useState(null);
  const [weatherLon, setWeatherLon] = useState(null);
  const [goalSuggestion, setGoalSuggestion] = useState(null);
  const [activityEnabled, setActivityEnabled] = useState(false);
  const streakCardRef = React.useRef(null);
  const EXPRESSIONS = ["happy", "excited", "reminding", "sleepy"];
  const lastLogRef = React.useRef(0);

  // Load everything on mount
  useEffect(() => {
    loadData().catch((e) =>
      console.error("Failed to load data:", e.message, e.stack)
    );
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
    setActivityEnabled(settings.activityAdjustment || false);
    const logs = await getTodayLogs();
    const totalMl = logs.reduce((sum, entry) => sum + (entry.amount || 250), 0);
    setTodayCount(logs.length);
    setTodayMl(totalMl);
    setMascotVariant(settings.mascotVariant || "classic");
    const strk = await getStreak(settings.dailyGoal);
    setStreak(strk);
    setMascotExpression(streakToExpression(strk));
    const tier = await getEscalationTier();
    setEscalationTier(tier);

    try {
      const allLogs = await getLogs();
      const hint = getPeakHoursSummary(allLogs);
      setPeakTimeHint(hint);
    } catch (e) {}

    try {
      const allLogs = await getLogs();
      const today = new Date();
      const recentDays = [];
      for (let i = 1; i <= 7; i++) {
        const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
        const dayLogs = allLogs.filter((entry) => {
          const t = new Date(entry.timestamp);
          return t.getFullYear() === d.getFullYear() &&
            t.getMonth() === d.getMonth() &&
            t.getDate() === d.getDate();
        });
        const totalMl = dayLogs.reduce((sum, e) => sum + (e.amount || 250), 0);
        const dayGlasses = Math.round(totalMl / 250);
        recentDays.push(dayGlasses);
      }
      const avgRecent = recentDays.reduce((a, b) => a + b, 0) / recentDays.length;
      const currentGoal = settings.dailyGoal || 8;
      if (avgRecent >= currentGoal * 1.2 && currentGoal < 15) {
        setGoalSuggestion({
          text: `You averaged ${Math.round(avgRecent)} glasses/day — try increasing your goal to ${currentGoal + 2}?`,
        });
      } else if (avgRecent < currentGoal * 0.6 && avgRecent > 0 && currentGoal > 4) {
        setGoalSuggestion({
          text: `You averaged ${Math.round(avgRecent)} glasses/day — consider lowering your goal to ${Math.max(currentGoal - 2, 4)}`,
        });
      } else {
        setGoalSuggestion(null);
      }
    } catch (e) {}

    try {
      const { requestForegroundPermissionsAsync, getCurrentPositionAsync } = require("expo-location");
      const { status } = await requestForegroundPermissionsAsync();
      if (status === "granted") {
        const pos = await getCurrentPositionAsync({});
        setWeatherLat(pos.coords.latitude);
        setWeatherLon(pos.coords.longitude);
        setHasWeatherLocation(true);
      }
    } catch (e) {
      console.log("ℹ️ Location not available for weather");
    }

    // Refresh widget on app load
    refreshWidget({
      currentMl: totalMl,
      goalMl: settings.dailyGoal * 250,
      streak: strk,
      glassesCount: Math.round(totalMl / 250),
    }).catch(() => {});
  };

  useEffect(() => {
    const unsub = navigation?.addListener("focus", loadData);
    return unsub;
  }, []);

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
      Alert.alert("Could Not Start Reminders", e.message || "An error occurred");
    }
  };

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

  const logDrink = useCallback(
    async (amount) => {
      const now = Date.now();
      if (now - lastLogRef.current < 500) return; // debounce
      lastLogRef.current = now;

      await addLog({ amount });
      Vibration.vibrate(50);
      setTodayCount((c) => c + 1);
      setTodayMl((m) => m + amount);
      const strk = await getStreak(dailyGoal);
      setStreak(strk);
      setMascotExpression(streakToExpression(strk));
      console.log(`💧 Drank ${amount}ml! Total today: ${todayMl + amount}ml`);

      const newlyUnlocked = await checkAchievements();
      if (newlyUnlocked.length > 0) {
        setPopupAchievements(newlyUnlocked);
        setMascotCelebration(true);
        setMascotExpression("excited");
        setMascotMessage(`${newlyUnlocked[0].emoji} ${newlyUnlocked[0].title}!`);
        setTimeout(() => setMascotCelebration(false), 2000);
        console.log(`🏆 Unlocked: ${newlyUnlocked.map((a) => a.title).join(", ")}`);
      }

      // Update home screen widget
      refreshWidget({
        currentMl: todayMl + amount,
        goalMl: dailyGoal * 250,
        streak: strk,
        glassesCount: Math.round((todayMl + amount) / 250),
      }).catch(() => {});

      // Sync to Health Connect (best-effort, checks pref internally)
      _syncToHealth(amount).catch(() => {});
    },
    [todayMl, dailyGoal]
  );

  const _syncToHealth = async (amount) => {
    const syncEnabled = await getSyncPreference();
    if (!syncEnabled) return;
    const available = await isHealthConnectAvailable();
    if (!available) return;
    await writeHydrationRecord(amount, new Date().toISOString());
  };

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

  const goalMl = React.useMemo(() => dailyGoal * 250, [dailyGoal]);
  const progressPct = React.useMemo(
    () => Math.min(todayMl / goalMl, 1),
    [todayMl, goalMl]
  );
  const glassesFromMl = React.useMemo(
    () => Math.round(todayMl / 250),
    [todayMl]
  );

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <View style={s.mascotArea}>
            <Mascot size={100} expression={mascotExpression} variant={mascotVariant} celebration={mascotCelebration} onPress={cycleExpression} message={mascotMessage} />
          </View>
          <View>
            <Text style={s.title}>Plenty</Text>
            <Text style={s.subtitle}>Stay hydrated</Text>
          </View>
        </View>

        {streak > 0 && (
          <View style={s.streakBadge}>
            <Ionicons name="flame" size={18} color={colors.warning} />
            <Text style={s.streakText}>{streak} day{streak > 1 ? "s" : ""}</Text>
            <TouchableOpacity
              style={s.shareStreakBtn}
              onPress={async () => {
                await captureAndShare(streakCardRef, "My Plenty streak!");
              }}
            >
              <Ionicons name="share-outline" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        {/* Hidden share card for streak screenshot */}
        <ShareCardForwardRef
          ref={streakCardRef}
          mode="streak"
          data={{
            streak,
            weekGlasses: Math.round(todayMl / 250),
            bestDay: 0,
            bestDayLabel: "",
          }}
        />

        {peakTimeHint && (
          <View style={s.peakHint}>
            <Ionicons name="time-outline" size={14} color={colors.primary} />
            <Text style={s.peakHintText}>{peakTimeHint}</Text>
          </View>
        )}

        <WeatherBanner
          hasLocation={hasWeatherLocation}
          lat={weatherLat}
          lon={weatherLon}
        />

        {escalationTier !== "normal" && (
          <View style={[s.escalationBanner, escalationTier === "alert" ? s.escalationAlert : s.escalationWarning]}>
            <Ionicons name={escalationTier === "alert" ? "alert-circle" : "warning"} size={18} color="#fff" />
            <Text style={s.escalationText}>
              {escalationTier === "alert"
                ? "You haven't logged in a while! Drink some water now."
                : "It's been a while -- time to hydrate!"}
            </Text>
          </View>
        )}

        <View style={s.progressCard}>
          <View style={s.progressHeader}>
            <Ionicons name="water" size={32} color={colors.primary} />
            <Text style={s.progressCount}>{todayMl}ml</Text>
          </View>
          <Text style={s.progressLabel}>
            {glassesFromMl} / {dailyGoal} glasses
          </Text>
          <View style={s.barBg}>
            <View style={[s.barFill, { width: `${progressPct * 100}%` }]} />
          </View>
          {progressPct >= 1 && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 }}>
              <Ionicons name="checkmark-circle" size={18} color={colors.success} />
              <Text style={s.goalMet}>Goal reached!</Text>
            </View>
          )}
        </View>

        {activityEnabled && (
          <View style={s.activityHint}>
            <Ionicons name="fitness" size={14} color={colors.success} />
            <Text style={s.activityHintText}>
              Exercised today — goal boosted by 3 glasses
            </Text>
          </View>
        )}

        {goalSuggestion && (
          <View style={s.goalSuggestion}>
            <Ionicons name="bulb-outline" size={16} color={colors.primary} />
            <Text style={s.goalSuggestionText}>{goalSuggestion.text}</Text>
          </View>
        )}

        <View style={s.section}>
          <Text style={s.sectionLabel}>Remind me every</Text>
          <View style={s.intervalRow}>
            {PRESET_MINUTES.map((min) => {
              const sec = min * 60;
              return (
                <TouchableOpacity
                  key={min}
                  style={[
                    s.intervalChip,
                    selectedInterval === sec && !customText && s.intervalChipActive,
                  ]}
                  onPress={() => {
                    setSelectedInterval(sec);
                    setCustomText("");
                    setIntervalError("");
                  }}
                >
                  <Text
                    style={[
                      s.intervalText,
                      selectedInterval === sec && !customText && s.intervalTextActive,
                    ]}
                  >
                    {min < 60 ? `${min}m` : `${min / 60}h`}
                  </Text>
                </TouchableOpacity>
              );
            })}
            <TextInput
              style={[
                s.customInput,
                customText ? s.customInputActive : null,
              ]}
              placeholder="ex: 30s"
              placeholderTextColor={colors.textTertiary}
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
            <Text style={s.inputHint}>Use 30s, 5m, or 2h</Text>
          )}
          {intervalError ? (
            <Text style={s.inputHint}>{intervalError}</Text>
          ) : null}
        </View>

        <TouchableOpacity
          style={[s.mainButton, isActive ? s.stopButton : s.startButton]}
          onPress={isActive ? stopReminder : startReminder}
          accessibilityLabel={isActive ? "Stop reminders" : "Start reminders"}
          accessibilityRole="button"
        >
          <Ionicons
            name={isActive ? "pause-circle" : "notifications"}
            size={28}
            color="#fff"
          />
          <Text style={s.mainButtonText}>
            {isActive ? "Stop Reminders" : "Start Reminders"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={s.drinkButton}
          onPress={() => logDrink(drinkAmount)}
          onLongPress={() => setShowAmountPicker(true)}
          delayLongPress={300}
          accessibilityLabel={`Log water drink, ${drinkAmount} milliliters`}
          accessibilityRole="button"
        >
          <Ionicons name="add-circle" size={24} color={colors.primary} />
          <Text style={s.drinkButtonText}>I drank water ({drinkAmount}ml)</Text>
        </TouchableOpacity>

        {permissionGranted === false && (
          <Text style={s.warning}>
            Notifications not enabled. Enable them in Settings to receive reminders.
          </Text>
        )}
      </ScrollView>

      <Modal visible={showAmountPicker} transparent animationType="fade">
        <TouchableOpacity
          style={s.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowAmountPicker(false)}
        >
          <View style={s.modalSheet}>
            <Text style={s.modalTitle}>How much did you drink?</Text>
            {AMOUNT_OPTIONS.map((amount) => (
              <TouchableOpacity
                key={amount}
                style={s.modalOption}
                onPress={() => {
                  logDrink(amount);
                  setShowAmountPicker(false);
                }}
              >
                <Ionicons
                  name={amount === drinkAmount ? "water" : "water-outline"}
                  size={22}
                  color={colors.primary}
                />
                <Text style={s.modalOptionText}>{amount} ml</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={s.modalCancel}
              onPress={() => setShowAmountPicker(false)}
            >
              <Text style={s.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <AchievementPopup
        achievements={popupAchievements}
        visible={popupAchievements.length > 0}
        onDismiss={() => setPopupAchievements([])}
      />
    </SafeAreaView>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
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
      color: colors.text,
      letterSpacing: 1,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      marginTop: 4,
    },
    streakBadge: {
      marginTop: 16,
      backgroundColor: colors.warningBg,
      paddingVertical: 6,
      paddingHorizontal: 16,
      borderRadius: 20,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    streakText: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.warning,
    },
    shareStreakBtn: {
      backgroundColor: "rgba(255,255,255,0.2)",
      borderRadius: 12,
      width: 26,
      height: 26,
      alignItems: "center",
      justifyContent: "center",
    },
    peakHint: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginTop: 6,
      paddingVertical: 4,
      paddingHorizontal: 12,
    },
    peakHintText: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.primary,
    },
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
      backgroundColor: colors.highBg,
    },
    escalationAlert: {
      backgroundColor: colors.extremeBg,
    },
    escalationText: {
      fontSize: 13,
      fontWeight: "600",
      color: "#fff",
      flex: 1,
    },
    progressCard: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      paddingVertical: 24,
      paddingHorizontal: 32,
      alignItems: "center",
      width: "100%",
      marginTop: 20,
      shadowColor: colors.primary,
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
      color: colors.text,
    },
    progressLabel: {
      fontSize: 16,
      color: colors.textSecondary,
      marginTop: 4,
      marginBottom: 12,
    },
    barBg: {
      width: "100%",
      height: 12,
      borderRadius: 6,
      backgroundColor: colors.primaryBg,
      overflow: "hidden",
    },
    barFill: {
      height: "100%",
      borderRadius: 6,
      backgroundColor: colors.primary,
    },
    goalMet: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.success,
      marginTop: 8,
    },
    activityHint: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: 12,
      paddingVertical: 6,
      paddingHorizontal: 14,
      backgroundColor: colors.successBg,
      borderRadius: 10,
    },
    activityHintText: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.success,
    },
    goalSuggestion: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: 10,
      paddingVertical: 10,
      paddingHorizontal: 16,
      backgroundColor: colors.goalSuggestionBg,
      borderRadius: 12,
      width: "100%",
    },
    goalSuggestionText: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.goalSuggestionText,
      flex: 1,
    },
    section: {
      marginTop: 28,
      alignItems: "center",
    },
    sectionLabel: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.textSection,
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
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: colors.border,
    },
    intervalChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    intervalText: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.textSection,
    },
    intervalTextActive: {
      color: "#fff",
    },
    customInput: {
      width: 64,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 20,
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: colors.border,
      fontSize: 14,
      fontWeight: "600",
      color: colors.textSection,
      textAlign: "center",
    },
    customInputActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primaryBg,
    },
    inputHint: {
      fontSize: 12,
      color: colors.error,
      marginTop: 6,
    },
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
      backgroundColor: colors.primary,
    },
    stopButton: {
      backgroundColor: colors.error,
    },
    mainButtonText: {
      fontSize: 18,
      fontWeight: "700",
      color: "#fff",
    },
    drinkButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: 16,
      paddingVertical: 14,
      paddingHorizontal: 24,
      borderRadius: 12,
      backgroundColor: colors.primaryBg,
    },
    drinkButtonText: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.primary,
    },
    warning: {
      color: colors.error,
      fontSize: 13,
      textAlign: "center",
      marginTop: 16,
      paddingHorizontal: 20,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: "flex-end",
    },
    modalSheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 24,
      paddingBottom: 40,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.text,
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
      backgroundColor: colors.surfaceSecondary,
      marginBottom: 8,
    },
    modalOptionText: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
    },
    modalCancel: {
      alignItems: "center",
      paddingVertical: 14,
      marginTop: 4,
    },
    modalCancelText: {
      fontSize: 16,
      color: colors.textSecondary,
      fontWeight: "600",
    },
  });
}
