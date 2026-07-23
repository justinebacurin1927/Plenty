import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Modal,
  Linking,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Vibration,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Path } from "react-native-svg";
import Mascot, { getRandomMessage, streakToExpression } from "../components/Mascot";
import AchievementPopup from "../components/AchievementPopup";
import WeatherBanner from "../components/WeatherBanner";
import { getTodayLogs, addLog, getSettings, getStreak, getLogs, saveSettings, checkMissedDay, useFreeze } from "../utils/storage";
import { checkAchievements } from "../utils/achievements";
import {
  requestPermission,
  scheduleWaterReminder,
  cancelAllReminders,
  getScheduledReminders,
  getEscalationTier,
  scheduleMilestoneCelebration,
} from "../utils/notifications";
import { useTheme } from "../context/ThemeContext";
import { refreshWidget } from "../utils/widget";
import { ShareCardForwardRef } from "../components/ShareCard";
import { captureAndShare } from "../utils/share";
import { useCountUp, useReducedMotion } from "../utils/motion";
import { triggerHaptic, ImpactFeedbackStyle } from "../utils/haptics";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from "react-native-reanimated";
import StreakFlame from "../components/StreakFlame";
import FireStreak from "../components/FireStreak";
import WaterFill from "../components/WaterFill";
import PressableScale from "../components/PressableScale";
import Toast from "../components/Toast";
import DrinkSizePicker from "../components/DrinkSizePicker";
import { type, fontSize, lineHeight } from "../constants/typography";
import { space } from "../constants/spacing";

const REMIND_OPTIONS = [
  { minutes: 30, label: "30 mins" },
  { minutes: 60, label: "1 hr" },
  { minutes: 120, label: "2 hrs" },
  { minutes: 150, label: "2 hrs & 30 mins" },
];

/** Tiny SVG glass icon — drinking glass shape */
function GlassIcon({ filled, color, emptyColor, size = 16 }) {
  const s = size;
  const vw = 20;
  const vh = 26;
  const scale = s / vw;
  return (
    <Svg width={s} height={Math.round(vh * scale)} viewBox={`0 0 ${vw} ${vh}`}>
      {filled ? (
        <Path
          d="M4,2 L3,18 C3,20 6,24 10,24 C14,24 17,20 17,18 L16,2 Z"
          fill={color}
          stroke={color}
          strokeWidth={1.2}
          strokeLinejoin="round"
          opacity={0.9}
        />
      ) : (
        <Path
          d="M4,2 L3,18 C3,20 6,24 10,24 C14,24 17,20 17,18 L16,2 Z"
          fill="none"
          stroke={emptyColor || "#CBD5E1"}
          strokeWidth={1.5}
          strokeLinejoin="round"
          opacity={0.5}
        />
      )}
    </Svg>
  );
}

export default function HomeScreen({ navigation }) {
  const { colors } = useTheme();
  const s = makeStyles(colors);

  const [todayCount, setTodayCount] = useState(0);
  const [todayMl, setTodayMl] = useState(0);
  const [dailyGoal, setDailyGoal] = useState(8);
  const [drinkAmount, setDrinkAmount] = useState(250);
  const [streak, setStreak] = useState(0);
  const [selectedInterval, setSelectedInterval] = useState(1800);
  const [isActive, setIsActive] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(null);
  const [intervalError, setIntervalError] = useState("");
  const [showAmountPicker, setShowAmountPicker] = useState(false);
  const [mascotExpression, setMascotExpression] = useState("happy");
  const [mascotMessage, setMascotMessage] = useState("Stay hydrated!");
  const [popupAchievements, setPopupAchievements] = useState([]);
  const [escalationTier, setEscalationTier] = useState("normal");
  const [mascotCelebration, setMascotCelebration] = useState(false);
  const [mascotTalking, setMascotTalking] = useState(false);
  const [mascotVariant, setMascotVariant] = useState("classic");
  const [hasWeatherLocation, setHasWeatherLocation] = useState(false);
  const [weatherLat, setWeatherLat] = useState(null);
  const [weatherLon, setWeatherLon] = useState(null);
  const [goalSuggestion, setGoalSuggestion] = useState(null);
  const [activityEnabled, setActivityEnabled] = useState(false);
  const [freezePrompt, setFreezePrompt] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [showStreakBanner, setShowStreakBanner] = useState(true);
  const [showWeatherBanner, setShowWeatherBanner] = useState(true);
  const streakCardRef = React.useRef(null);
  const EXPRESSIONS = ["happy", "idle", "excited", "reminding", "sleepy"];
  const lastLogRef = React.useRef(0);
  const waterFillRef = useRef(null);
  const reducedMotion = useReducedMotion();
  const goalCyclesRef = useRef(0); // tracks completed goal cycles for wrap-around celebration
  const mountGuard = useRef(true);
  const mascotTalkingRef = useRef(false);
  const [waterWidth, setWaterWidth] = useState(Dimensions.get("window").width - 48);

  // Load everything on mount
  useEffect(() => {
    loadData().catch((e) =>
      console.error("Failed to load data:", e.message, e.stack)
    );
    checkAchievements().then((unlocked) => {
      if (unlocked.length > 0) {
        console.log(`Background unlock: ${unlocked.map((a) => a.title).join(", ")}`);
      }
    });
  }, []);

  const loadData = async () => {
    const settings = await getSettings();
    setDailyGoal(settings.dailyGoal);
    setDrinkAmount(settings.drinkAmount);
    setActivityEnabled(settings.activityAdjustment || false);
    const savedIntervalSec = Math.round((settings.intervalMinutes || 30) * 60);
    setSelectedInterval(savedIntervalSec);
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

    // Check for missed day → freeze prompt
    try {
      const missed = await checkMissedDay();
      if (missed.missed && missed.freezesAvailable > 0) {
        setFreezePrompt(missed);
      } else {
        setFreezePrompt(null);
      }
    } catch (e) {
      // Silently ignore
    }
  };

  const handleUseFreeze = async () => {
    if (!freezePrompt?.dateStr) return;
    const ok = await useFreeze(freezePrompt.dateStr);
    if (ok) {
      setFreezePrompt(null);
      await loadData();
    }
  };

  const handleWaterLayout = useCallback((e) => {
    const w = e.nativeEvent.layout.width;
    setWaterWidth((prev) => (prev === w ? prev : w));
  }, []);

  useEffect(() => {
    const unsub = navigation?.addListener("focus", loadData);
    return unsub;
  }, []);

  const startReminder = async () => {
    try {
      console.log("Requesting notification permission...");
      const granted = await requestPermission();
      setPermissionGranted(granted);
      if (!granted) {
        console.warn("Notification permission denied");
        return;
      }

      setIntervalError("");
      if (selectedInterval < 60) {
        setIntervalError("Minimum interval is 60 seconds on Android");
        return;
      }
      console.log(`Scheduling reminders every ${selectedInterval >= 3600 ? `${selectedInterval / 3600}h` : `${selectedInterval / 60}m`}`);
      await saveSettings({ intervalMinutes: selectedInterval / 60, remindersActive: true });
      const settings = await getSettings();
      await scheduleWaterReminder(selectedInterval, {
        enabled: settings.quietHoursEnabled,
        start: settings.quietHoursStart,
        end: settings.quietHoursEnd,
      });
      setIsActive(true);
      console.log("Reminders are now active");
    } catch (e) {
      console.error("Failed to start reminders:", e.message, e.stack);
      Alert.alert("Could Not Start Reminders", e.message || "An error occurred");
    }
  };

  const stopReminder = async () => {
    try {
      console.log("Stopping all reminders");
      await cancelAllReminders();
      await saveSettings({ remindersActive: false });
      setIsActive(false);
      console.log("All reminders cancelled");
    } catch (e) {
      console.error("Failed to stop reminders:", e.message, e.stack);
    }
  };

  const logDrink = useCallback(
    async (amount) => {
      const now = Date.now();
      if (now - lastLogRef.current < 500) return;
      lastLogRef.current = now;

      await addLog({ amount });
      setToastMessage(`+${amount}ml logged!`);
      if (!reducedMotion) Vibration.vibrate(50);
      setTodayCount((c) => c + 1);
      setTodayMl((m) => m + amount);
      const strk = await getStreak(dailyGoal);
      setStreak(strk);
      setMascotExpression(streakToExpression(strk));
      console.log(`Drank ${amount}ml! Total today: ${todayMl + amount}ml`);

      const newlyUnlocked = await checkAchievements();
      if (newlyUnlocked.length > 0) {
        setPopupAchievements(newlyUnlocked);
        setMascotCelebration(true);
        setMascotExpression("excited");
        setMascotMessage(`${newlyUnlocked[0].emoji} ${newlyUnlocked[0].title}!`);
        setTimeout(() => setMascotCelebration(false), 2000);
        console.log(`Unlocked: ${newlyUnlocked.map((a) => a.title).join(", ")}`);
      }

      refreshWidget({
        currentMl: todayMl + amount,
        goalMl: dailyGoal * 250,
        streak: strk,
        glassesCount: Math.round((todayMl + amount) / 250),
      }).catch(() => {});

      scheduleMilestoneCelebration();
      waterFillRef.current?.triggerRipple();
    },
    [todayMl, dailyGoal, reducedMotion]
  );

  useEffect(() => {
    (async () => {
      try {
        const settings = await getSettings();
        const reminders = await getScheduledReminders();

        if (settings.remindersActive && reminders.length === 0) {
          console.log("Re-arming reminders on app start");
          console.log(`Requesting notification permission...`);
          const granted = await requestPermission();
          setPermissionGranted(granted);
          if (granted) {
            await scheduleWaterReminder(settings.intervalMinutes * 60, {
              enabled: settings.quietHoursEnabled,
              start: settings.quietHoursStart,
              end: settings.quietHoursEnd,
            });
            setIsActive(true);
            console.log("Reminders re-armed successfully");
          } else {
            await saveSettings({ remindersActive: false });
            console.warn("Permission lost — reminders deactivated");
          }
        } else if (reminders.length > 0) {
          setIsActive(true);
          console.log(`Found ${reminders.length} active reminder(s) on app start`);
        } else {
          console.log("No active reminders on app start");
        }
      } catch (e) {
        console.error("Failed to check reminders on mount:", e.message, e.stack);
      }
    })();
  }, []);

  // Keep ref in sync for auto-cycle timer
  useEffect(() => {
    mascotTalkingRef.current = mascotTalking;
  }, [mascotTalking]);

  // Auto-cycle mascot expression every ~12s so expressions don't get stuck
  useEffect(() => {
    const autoCycle = setInterval(() => {
      if (mascotTalkingRef.current) return;
      setMascotExpression((prev) => {
        const idx = EXPRESSIONS.indexOf(prev);
        return EXPRESSIONS[(idx + 1) % EXPRESSIONS.length];
      });
      setMascotMessage(getRandomMessage());
    }, 12000);
    return () => clearInterval(autoCycle);
  }, []);

  const cycleExpression = useCallback(() => {
    if (mascotTalking) return;
    setMascotTalking(true);
    setTimeout(() => {
      setMascotTalking(false);
      setMascotExpression("idle");
      setMascotMessage(getRandomMessage());
    }, 1800);
  }, [mascotTalking]);

  const goalMl = React.useMemo(() => dailyGoal * 250, [dailyGoal]);
  const progressPct = React.useMemo(
    () => (todayMl % (goalMl || 1)) / (goalMl || 1),
    [todayMl, goalMl]
  );
  const glassesFromMl = React.useMemo(
    () => Math.round(todayMl / 250),
    [todayMl]
  );

  const { displayText } = useCountUp(todayMl);

  // Glass-shaped clip path for WaterFill — drinking glass silhouette
  // Uses cubic bezier sides for gentle taper + rounded corners on all vertices
  const W = waterWidth;
  const H = 200;
  const glassClipPath = useMemo(() => {
    const topM = W * 0.19;    // narrower at the top (19% margin each side = 62% width)
    const botM = W * 0.29;    // narrower at the bottom (29% margin each side = 42% width)
    const r = 5;              // corner rounding radius
    const midY = H * 0.5;     // where the side taper midpoint is

    return (
      <Path
        d={[
          `M ${topM + r}, 0`,
          `L ${W - topM - r}, 0`,
          `Q ${W - topM}, 0, ${W - topM}, ${r}`,
          `C ${W - topM}, ${midY}, ${W - botM}, ${H * 0.7}, ${W - botM}, ${H - r}`,
          `Q ${W - botM}, ${H}, ${W - botM - r}, ${H}`,
          `L ${botM + r}, ${H}`,
          `Q ${botM}, ${H}, ${botM}, ${H - r}`,
          `C ${botM}, ${H * 0.7}, ${topM}, ${midY}, ${topM}, ${r}`,
          `Q ${topM}, 0, ${topM + r}, 0`,
          `Z`,
        ].join(' ')}
      />
    );
  }, [W, H]);

  // ── Goal celebration gate ──
  const goalReachedScale = useSharedValue(0);
  const goalReachedOpacity = useSharedValue(0);

  const goalReachedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: goalReachedScale.value }],
    opacity: goalReachedOpacity.value,
  }));

  useEffect(() => {
    const cycles = goalMl > 0 ? Math.floor(todayMl / goalMl) : 0;

    if (mountGuard.current) {
      mountGuard.current = false;
      if (cycles > 0) {
        goalCyclesRef.current = cycles;
        goalReachedScale.value = 1;
        goalReachedOpacity.value = 1;
      }
      return;
    }

    if (cycles > goalCyclesRef.current) {
      goalCyclesRef.current = cycles;
      waterFillRef.current?.triggerGoalCelebration();

      if (!reducedMotion) {
        setPopupAchievements(prev => {
          if (prev.some(a => a.title === "Goal Reached!")) return prev;
          return [...prev, { title: "Goal Reached!", emoji: "", description: "You hit your daily hydration goal!" }];
        });

        goalReachedScale.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.back(1.5)) });
        goalReachedOpacity.value = withTiming(1, { duration: 400 });
      } else {
        goalReachedScale.value = 1;
        goalReachedOpacity.value = 1;
      }
    }
  }, [todayMl, goalMl, reducedMotion]);

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* ── Header: bigger mascot + "Plenty" title + cloud bubble below title ── */}
        <View style={s.header}>
          <Mascot
            size={160}
            expression={mascotExpression}
            variant={mascotVariant}
            celebration={mascotCelebration}
            talking={mascotTalking}
            onPress={cycleExpression}
          />
          <View style={s.headerRight}>
            <Text style={s.title}>Plenty</Text>
            <View style={[s.cloudBubble, { backgroundColor: colors.surface }]}>
              <Text style={[s.cloudBubbleText, { color: colors.primary }]}>
                {mascotMessage}
              </Text>
            </View>
            {/* Bubble tail — points left toward the mascot */}
            <View style={[s.cloudTailOutline, { borderRightColor: colors.primaryLight }]} />
            <View style={[s.cloudTail, { borderRightColor: colors.surface }]} />
          </View>
        </View>

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

        {/* ── Streak Banner (dismissable) ── */}
        {showStreakBanner && streak > 0 && (
          <View style={s.streakBadge}>
            <StreakFlame streakLength={streak} />
            <Text style={s.streakText}>{streak} day{streak > 1 ? "s" : ""}</Text>
            <TouchableOpacity
              style={s.shareStreakBtn}
              onPress={async () => {
                await captureAndShare(streakCardRef, "My Plenty streak!");
              }}
            >
              <FireStreak size={20}>
                <Ionicons name="share-outline" size={16} color="#fff" />
              </FireStreak>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.dismissBtn}
              onPress={() => setShowStreakBanner(false)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <FireStreak size={24}>
                <Ionicons name="close" size={18} color={colors.warning} />
              </FireStreak>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Weather Banner (dismiss inside the component) ── */}
        {showWeatherBanner && (
          <View style={s.weatherRow}>
            <WeatherBanner
              hasLocation={hasWeatherLocation}
              lat={weatherLat}
              lon={weatherLon}
              onDismiss={() => setShowWeatherBanner(false)}
            />
          </View>
        )}

        {/* ── Escalation Banner (app-grade redesign) ── */}
        {escalationTier !== "normal" && (
          <View style={[s.escalationBanner, escalationTier === "alert" ? s.escalationAlert : s.escalationWarning]}>
            <View style={[s.escalationAccent, { backgroundColor: escalationTier === "alert" ? "#E53E3E" : "#DD6B20" }]} />
            <View style={s.escalationContent}>
              <Text style={[s.escalationTitle, { color: "#fff" }]}>
                {escalationTier === "alert" ? "Time to Hydrate!" : "Hydration Reminder"}
              </Text>
              <Text style={s.escalationText}>
                {escalationTier === "alert"
                  ? "You haven't logged in a while. Drink some water now!"
                  : "It's been a while — time for a drink!"}
              </Text>
            </View>
            <View style={[s.escalationIconWrap, { backgroundColor: escalationTier === "alert" ? "rgba(229,62,62,0.3)" : "rgba(221,107,32,0.3)" }]}>
              <Ionicons name={escalationTier === "alert" ? "water" : "cafe"} size={22} color="#fff" />
            </View>
          </View>
        )}

        {/* ── Water Progress Card ── */}
        <View style={s.progressCard}>
          <View style={s.progressHeader}>
            <Ionicons name="water" size={32} color={colors.primary} />
            <Text style={s.progressCount}>{displayText}ml</Text>
          </View>
          <Text style={s.progressLabel}>
            {glassesFromMl} / {dailyGoal} glasses
          </Text>

          {/* Glass-shaped icons — one per daily goal */}
          <View style={s.glassesRow}>
            {Array.from({ length: Math.min(dailyGoal, 16) }, (_, i) => {
              const filled = i < glassesFromMl;
              return (
                <View key={i} style={s.glassSlot}>
                  <GlassIcon
                    filled={filled}
                    color={colors.primary}
                    emptyColor={colors.border}
                    size={16}
                  />
                </View>
              );
            })}
          </View>

          {/* Single flame above the glass when streak active */}
          {streak >= 3 && (
            <View style={s.glassFlameWrapper}>
              <StreakFlame streakLength={streak} />
            </View>
          )}

          <View style={s.waterGlassOuter}>
            <View style={s.waterContainer} onLayout={handleWaterLayout}>
              <WaterFill ref={waterFillRef} fill={progressPct} width={waterWidth} height={200} clipPathDef={glassClipPath} />
            </View>
            {/* Glass outline overlay — same smooth tapered path as the clip path */}
            <Svg
              width={waterWidth}
              height={200}
              viewBox={`0 0 ${waterWidth} 200`}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            >
              <Path
                d={(() => {
                  const t = W * 0.19, b = W * 0.29, r = 5, m = H * 0.5;
                  return [
                    `M ${t + r}, 0`,
                    `L ${W - t - r}, 0`,
                    `Q ${W - t}, 0, ${W - t}, ${r}`,
                    `C ${W - t}, ${m}, ${W - b}, ${H * 0.7}, ${W - b}, ${H - r}`,
                    `Q ${W - b}, ${H}, ${W - b - r}, ${H}`,
                    `L ${b + r}, ${H}`,
                    `Q ${b}, ${H}, ${b}, ${H - r}`,
                    `C ${b}, ${H * 0.7}, ${t}, ${m}, ${t}, ${r}`,
                    `Q ${t}, 0, ${t + r}, 0`,
                    `Z`,
                  ].join(' ');
                })()}
                fill="none"
                stroke={colors.text}
                strokeWidth={3.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.5}
              />
            </Svg>
          </View>
          {progressPct >= 1 && (
            <Animated.View style={[{ flexDirection: "row", alignItems: "center", gap: space("xsm"), marginTop: space("sm") }, goalReachedStyle]}>
              <Ionicons name="checkmark-circle" size={18} color={colors.success} />
              <Text style={s.goalMet}>Goal reached!</Text>
            </Animated.View>
          )}
        </View>

        {/* ── Activity Hint ── */}
        {activityEnabled && (
          <View style={s.activityHint}>
            <Ionicons name="fitness" size={14} color={colors.success} />
            <Text style={s.activityHintText}>
              Exercised today — goal boosted by 3 glasses
            </Text>
          </View>
        )}

        {/* ── Goal Suggestion ── */}
        {goalSuggestion && (
          <View style={s.goalSuggestion}>
            <View style={[s.goalSuggestionAccent, { backgroundColor: colors.primary }]} />
            <View style={s.goalSuggestionContent}>
              <Text style={[s.goalSuggestionTitle, { color: colors.primary }]}>Suggestion</Text>
              <Text style={[s.goalSuggestionText, { color: colors.textSecondary }]}>{goalSuggestion.text}</Text>
            </View>
            <View style={[s.goalSuggestionIconWrap, { backgroundColor: colors.primaryBg }]}>
              <Ionicons name="bulb-outline" size={20} color={colors.primary} />
            </View>
          </View>
        )}

        {/* ── Freeze prompt ── */}
        {freezePrompt && (
          <Modal transparent animationType="fade" visible={!!freezePrompt}>
            <View style={s.freezeOverlay}>
              <View style={[s.freezeModal, { backgroundColor: colors.surface }]}>
                <Text style={[s.freezeEmoji]}>❄️</Text>
                <Text style={[s.freezeTitle, { color: colors.text }]}>
                  Missed yesterday?
                </Text>
                <Text style={[s.freezeDesc, { color: colors.textSecondary }]}>
                  Looks like you missed yesterday. Use a streak freeze to keep your {freezePrompt.currentStreak}-day streak alive?
                </Text>
                <Text style={[s.freezeCount, { color: colors.textTertiary }]}>
                  {freezePrompt.freezesAvailable} remaining this month
                </Text>
                <View style={s.freezeActions}>
                  <TouchableOpacity
                    style={[s.freezeBtnPrimary, { backgroundColor: colors.primary }]}
                    onPress={handleUseFreeze}
                  >
                    <Text style={s.freezeBtnPrimaryText}>Use Freeze</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={s.freezeBtnSkip}
                    onPress={() => setFreezePrompt(null)}
                  >
                    <Text style={[s.freezeBtnSkipText, { color: colors.textSecondary }]}>
                      Skip, break my streak
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}

        {/* ── I Drank Water Button ── */}
        <PressableScale
          style={s.drinkButton}
          onPress={() => {
            if (!reducedMotion) triggerHaptic(ImpactFeedbackStyle.Light);
            setShowAmountPicker(true);
          }}
          accessibilityLabel="Log water drink — choose amount"
          accessibilityRole="button"
        >
          <Ionicons name="add-circle" size={24} color="#fff" />
          <Text style={s.drinkButtonText}>I drank water</Text>
        </PressableScale>

        {/* ── Start / Stop Reminder Button ── */}
        <View style={s.mainButtonOuter}>
          <PressableScale
            style={[s.mainButton, isActive ? s.stopButton : s.startButton]}
            onPress={() => {
              if (!reducedMotion) triggerHaptic(ImpactFeedbackStyle.Medium);
              return isActive ? stopReminder() : startReminder();
            }}
            accessibilityLabel={isActive ? "Stop reminders" : "Start reminders"}
            accessibilityRole="button"
          >
            <View style={s.mainButtonInner}>
              <Ionicons
                name={isActive ? "pause-circle" : "notifications"}
                size={28}
                color="#fff"
              />
              <Text style={s.mainButtonText}>
                {isActive ? "Stop Reminders" : "Start Reminders"}
              </Text>
            </View>
          </PressableScale>
        </View>

        {/* ── Remind Me Section (4 preset buttons, 2×2 grid) ── */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>Remind me every</Text>
          <View style={s.intervalGrid}>
            {REMIND_OPTIONS.map((option) => {
              const sec = option.minutes * 60;
              const isActiveOpt = selectedInterval === sec;
              return (
                <TouchableOpacity
                  key={option.minutes}
                  style={[
                    s.intervalChip,
                    isActiveOpt && s.intervalChipActive,
                  ]}
                  onPress={async () => {
                    setSelectedInterval(sec);
                    setIntervalError("");
                    try {
                      await saveSettings({ intervalMinutes: option.minutes });
                    } catch (e) {
                      console.error("Failed to save interval:", e.message);
                    }
                  }}
                >
                  <Text
                    style={[
                      s.intervalText,
                      isActiveOpt && s.intervalTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {intervalError ? (
            <Text style={s.inputHint}>{intervalError}</Text>
          ) : null}
        </View>

        {permissionGranted === false && (
          <View style={s.warningBlock}>
            <Text style={s.warning}>
              Notifications not enabled. Enable them in Settings to receive reminders.
            </Text>
            <TouchableOpacity
              style={s.settingsLink}
              onPress={() => Linking.openURL("app-settings:")}
            >
              <Text style={s.settingsLinkText}>Open Settings</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <DrinkSizePicker
        visible={showAmountPicker}
        onSelect={(amount) => {
          if (!reducedMotion) triggerHaptic(ImpactFeedbackStyle.Light);
          logDrink(amount);
          setShowAmountPicker(false);
        }}
        onDismiss={() => setShowAmountPicker(false)}
      />

      <AchievementPopup
        achievements={popupAchievements}
        visible={popupAchievements.length > 0}
        onDismiss={() => setPopupAchievements([])}
      />

      <Toast
        message={toastMessage}
        visible={!!toastMessage}
        onDismiss={() => setToastMessage(null)}
      />
    </SafeAreaView>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
      position: "relative",
    },
    scroll: {
      alignItems: "center",
      paddingHorizontal: space("xl"),
      paddingTop: 16,
      paddingBottom: space("3xl"),
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: space("smd"),
      width: "100%",
      justifyContent: "center",
    },
    headerRight: {
      position: "relative",
    },
    title: {
      ...type.display,
      color: colors.text,
      letterSpacing: 1,
    },
    cloudBubble: {
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 8,
      marginTop: 6,
      maxWidth: 180,
      borderWidth: 1.5,
      borderColor: colors.primaryLight,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 5,
    },
    cloudBubbleText: {
      fontSize: 13,
      fontWeight: "600",
      textAlign: "center",
    },
    cloudTail: {
      position: "absolute",
      left: -10,
      top: 59,
      width: 0,
      height: 0,
      borderTopWidth: 8,
      borderBottomWidth: 8,
      borderRightWidth: 12,
      borderTopColor: "transparent",
      borderBottomColor: "transparent",
    },
    cloudTailOutline: {
      position: "absolute",
      left: -12,
      top: 58,
      width: 0,
      height: 0,
      borderTopWidth: 9,
      borderBottomWidth: 9,
      borderRightWidth: 14,
      borderTopColor: "transparent",
      borderBottomColor: "transparent",
    },
    streakBadge: {
      marginTop: space("lg"),
      backgroundColor: colors.warningBg,
      paddingVertical: space("xsm"),
      paddingHorizontal: space("lg"),
      borderRadius: space("lgx"),
      flexDirection: "row",
      alignItems: "center",
      gap: space("sm"),
    },
    streakText: {
      ...type.label,
      color: colors.warning,
    },
    shareStreakBtn: {
      backgroundColor: "rgba(255,255,255,0.2)",
      borderRadius: space("md"),
      width: 26,
      height: 26,
      alignItems: "center",
      justifyContent: "center",
    },
    dismissBtn: {
      marginLeft: "auto",
      paddingLeft: space("xsm"),
    },
    weatherRow: {
      width: "100%",
      marginTop: space("smd"),
    },
    escalationBanner: {
      flexDirection: "row",
      alignItems: "center",
      width: "100%",
      borderRadius: space("lg"),
      marginTop: space("md"),
      overflow: "hidden",
    },
    escalationWarning: {
      backgroundColor: "#7C3AED",
    },
    escalationAlert: {
      backgroundColor: "#C53030",
    },
    escalationAccent: {
      width: 6,
      height: "100%",
      position: "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      borderTopLeftRadius: space("lg"),
      borderBottomLeftRadius: space("lg"),
    },
    escalationContent: {
      flex: 1,
      paddingVertical: space("smd"),
      paddingLeft: space("lg"),
      paddingRight: space("sm"),
    },
    escalationTitle: {
      fontSize: fontSize("label"),
      fontWeight: "700",
      marginBottom: 2,
    },
    escalationText: {
      fontSize: fontSize("small"),
      fontWeight: "500",
      color: "rgba(255,255,255,0.85)",
    },
    escalationIconWrap: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
      marginRight: space("smd"),
    },
    progressCard: {
      backgroundColor: colors.surface,
      borderRadius: space("lgx"),
      paddingVertical: space("xl"),
      paddingHorizontal: space("2xl"),
      alignItems: "center",
      width: "100%",
      marginTop: space("lgx"),
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
      elevation: 6,
    },
    progressHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: space("sm"),
    },
    progressCount: {
      ...type.display,
      color: colors.text,
    },
    progressLabel: {
      fontSize: fontSize("body"),
      color: colors.textSecondary,
      marginTop: space("xs"),
    },
    glassesRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      gap: 6,
      marginTop: space("sm"),
      marginBottom: space("md"),
    },
    glassSlot: {
      width: 18,
      height: 24,
      justifyContent: "center",
      alignItems: "center",
    },
    glassFlameWrapper: {
      position: "absolute",
      top: -4,
      zIndex: 10,
    },
    waterGlassOuter: {
      position: "relative",
      width: "100%",
      height: 200,
      marginTop: space("md"),
    },
    waterContainer: {
      width: "100%",
      height: 200,
    },
    goalMet: {
      ...type.label,
      color: colors.success,
      marginTop: space("sm"),
    },
    activityHint: {
      flexDirection: "row",
      alignItems: "center",
      gap: space("xsm"),
      marginTop: space("md"),
      paddingVertical: space("xsm"),
      paddingHorizontal: space("lgm"),
      backgroundColor: colors.successBg,
      borderRadius: space("smd"),
    },
    activityHintText: {
      fontSize: fontSize("small"),
      fontWeight: "600",
      color: colors.success,
    },
    goalSuggestion: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: space("smd"),
      width: "100%",
      borderRadius: space("lg"),
      backgroundColor: colors.goalSuggestionBg,
      overflow: "hidden",
    },
    goalSuggestionAccent: {
      width: 5,
      position: "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      borderTopLeftRadius: space("lg"),
      borderBottomLeftRadius: space("lg"),
    },
    goalSuggestionContent: {
      flex: 1,
      paddingVertical: space("smd"),
      paddingLeft: space("lg"),
      paddingRight: space("sm"),
    },
    goalSuggestionTitle: {
      fontSize: fontSize("label"),
      fontWeight: "700",
      marginBottom: 2,
    },
    goalSuggestionText: {
      fontSize: fontSize("small"),
      fontWeight: "500",
    },
    goalSuggestionIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      marginRight: space("smd"),
    },
    section: {
      marginTop: space("xl") + 4,
      alignItems: "center",
      width: "100%",
    },
    sectionLabel: {
      fontSize: fontSize("label"),
      fontWeight: "600",
      color: colors.textSection,
      marginBottom: space("smd"),
    },
    intervalGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      gap: space("md"),
      width: "100%",
      maxWidth: 340,
    },
    intervalChip: {
      width: "46%",
      paddingVertical: space("md"),
      borderRadius: space("lgx"),
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: colors.border,
      alignItems: "center",
    },
    intervalChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    intervalText: {
      fontSize: fontSize("body"),
      fontWeight: "600",
      color: colors.textSection,
    },
    intervalTextActive: {
      color: "#fff",
    },
    inputHint: {
      fontSize: fontSize("small"),
      color: colors.error,
      marginTop: space("xsm"),
    },
    mainButtonOuter: {
      width: "100%",
      marginTop: space("xl") + 4,
    },
    mainButton: {
      paddingVertical: space("lg"),
      borderRadius: space("lg"),
    },
    mainButtonInner: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: space("smd"),
    },
    startButton: {
      backgroundColor: colors.primary,
    },
    stopButton: {
      backgroundColor: colors.error,
    },
    mainButtonText: {
      fontSize: fontSize("body"),
      fontWeight: "700",
      color: "#fff",
      textAlign: "center",
    },
    drinkButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: space("sm"),
      marginTop: space("lg"),
      paddingVertical: space("lgm"),
      paddingHorizontal: space("2xl"),
      borderRadius: 50,
      backgroundColor: colors.primary,
      alignSelf: "center",
      minWidth: 220,
    },
    drinkButtonText: {
      fontSize: fontSize("body"),
      fontWeight: "700",
      color: "#fff",
    },
    warningBlock: {
      alignItems: "center",
      marginTop: space("lg"),
      paddingHorizontal: space("lgx"),
    },
    warning: {
      color: colors.error,
      fontSize: fontSize("caption"),
      textAlign: "center",
    },
    settingsLink: {
      marginTop: space("sm"),
      paddingVertical: space("sm"),
      paddingHorizontal: space("lgx"),
      backgroundColor: colors.primary,
      borderRadius: space("sm"),
    },
    settingsLinkText: {
      color: "#fff",
      fontWeight: "600",
      fontSize: fontSize("caption"),
    },

    // ── Freeze prompt ──
    freezeOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      alignItems: "center",
      padding: space("2xl"),
    },
    freezeModal: {
      borderRadius: space("lgx"),
      padding: space("xl") + 4,
      alignItems: "center",
      maxWidth: 340,
      width: "100%",
    },
    freezeEmoji: {
      fontSize: 42,
      marginBottom: space("md"),
    },
    freezeTitle: {
      fontSize: 20,
      fontWeight: "700",
      marginBottom: space("sm"),
      textAlign: "center",
    },
    freezeDesc: {
      ...type.label,
      textAlign: "center",
      marginBottom: space("sm"),
    },
    freezeCount: {
      fontSize: fontSize("caption"),
      marginBottom: space("lgx"),
    },
    freezeActions: {
      width: "100%",
      gap: space("sm"),
    },
    freezeBtnPrimary: {
      paddingVertical: space("lgm"),
      borderRadius: space("lgm"),
      alignItems: "center",
    },
    freezeBtnPrimaryText: {
      color: "#fff",
      fontSize: fontSize("body"),
      fontWeight: "700",
    },
    freezeBtnSkip: {
      alignItems: "center",
      paddingVertical: space("smd"),
    },
    freezeBtnSkipText: {
      fontSize: fontSize("caption"),
      fontWeight: "500",
    },
  });
}
