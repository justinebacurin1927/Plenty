import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import {
  View,
  Text,
  Animated,
  FlatList,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import MonthlyReport from "../components/MonthlyReport";
import Heatmap from "../components/Heatmap";
import StreakFlame from "../components/StreakFlame";
import { getTodayLogs, getDailyTotals, getSettings, getLogs, getStreak } from "../utils/storage";
import { getLowestHydrationDay } from "../utils/patterns";
import { useTheme } from "../context/ThemeContext";
import { useReducedMotion } from "../utils/motion";

const MAX_BAR = 200;
const WEEKLY_BARS = 7;

export default function LogScreen() {
  const { colors } = useTheme();
  const s = makeStyles(colors);

  const [logs, setLogs] = useState([]);
  const [weekly, setWeekly] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lowDayPattern, setLowDayPattern] = useState(null);
  const [dailyGoal, setDailyGoal] = useState(8);
  const [streak, setStreak] = useState(0);
  const reduceMotion = useReducedMotion();

  // Stable animated values for bar entrance animation
  const barAnimsRef = useRef(null);
  if (!barAnimsRef.current) {
    barAnimsRef.current = Array.from({ length: WEEKLY_BARS }, () => new Animated.Value(0));
  }
  const barAnims = barAnimsRef.current;

  // Track whether entrance animation has ever played to avoid re-animating on tab re-focus
  const hasAnimatedRef = useRef(false);

  // Trigger staggered bar animation when weekly data loads
  useEffect(() => {
    if (weekly.length === 0) return;

    const springs = [];

    barAnims.forEach((anim, i) => {
      if (i >= weekly.length) return;

      const dayTotal = weekly[i]?.total ?? 0;
      const ratio = maxTotal > 0 ? dayTotal / maxTotal : 0;
      const targetHeight = Math.max(ratio * MAX_BAR, dayTotal > 0 ? 10 : 4);

      if (reduceMotion || hasAnimatedRef.current) {
        anim.setValue(targetHeight);
      } else {
        anim.stopAnimation(); // stop any in-flight from prior runs
        anim.setValue(0);
        const spring = Animated.spring(anim, {
          toValue: targetHeight,
          friction: 8,
          tension: 40,
          delay: i * 70,
          useNativeDriver: false,
        });
        spring.start();
        springs.push(spring);
      }
    });

    if (!reduceMotion) {
      hasAnimatedRef.current = true;
    }

    return () => {
      springs.forEach((s) => s.stop());
    };
  }, [weekly, maxTotal, reduceMotion]);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const today = await getTodayLogs();
          setLogs(today.reverse());
          const days = await getDailyTotals();
          setWeekly(days);
          const settings = await getSettings();
          setDailyGoal(settings.dailyGoal || 8);
          const strk = await getStreak(settings.dailyGoal);
          setStreak(strk);

          try {
            const allLogs = await getLogs();
            const lowDay = getLowestHydrationDay(allLogs);
            if (lowDay && lowDay.count >= 3) {
              setLowDayPattern(lowDay);
            } else {
              setLowDayPattern(null);
            }
          } catch (e) {}
        } catch (e) {
          console.error("Failed to load log data:", e.message, e.stack);
        }
        setLoading(false);
      })();
    }, [])
  );

  const formatTime = (iso) => {
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return "--:--";
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "--:--";
    }
  };

  const maxTotal = useMemo(
    () => Math.max(...weekly.map((d) => d.total), 1),
    [weekly]
  );

  const ITEM_HEIGHT = 58;

  const renderLogItem = useCallback(
    ({ item, index }) => {
      if (!item || !item.timestamp) return null;
      return (
        <View style={s.logItem}>
          <View style={s.logLeft}>
            <Text style={s.logIndex}>#{logs.length - index}</Text>
            <Ionicons name="water" size={20} color={colors.primary} />
            <Text style={s.logAmount}>{item.amount || 250} ml</Text>
          </View>
          <Text style={s.logTime}>{formatTime(item.timestamp)}</Text>
        </View>
      );
    },
    [colors, logs.length]
  );

  const headerComponent = (
    <>
      <View style={s.header}>
        <View style={s.headerLeft}>
          <View>
            <Text style={s.title}>Your Log</Text>
            <Text style={s.subtitle}>{logs.length} glasses today</Text>
          </View>
        </View>
      </View>

      <MonthlyReport />

      {weekly.length > 0 && (
        <View style={s.weeklyCard}>
          <Text style={s.weeklyTitle}>Last 7 Days</Text>
          <View style={s.chartRow}>
            {weekly.map((day, i) => {
              return (
                <View key={i} style={s.barCol}>
                  <Text style={s.barValue}>{Math.round(day.total / 250)}</Text>
                  <View style={[s.bar, { height: MAX_BAR }]}>
                    <Animated.View
                      style={[
                        s.barFill,
                        {
                          height: barAnims[i],
                          backgroundColor: i === 6 ? colors.barToday : colors.barDefault,
                        },
                      ]}
                    />
                  </View>
                  <Text style={s.barLabel}>{day.label}</Text>
                </View>
              );
            })}
          </View>

          {lowDayPattern && (
            <View style={s.patternHint}>
              <Ionicons name="analytics-outline" size={14} color={colors.textSecondary} />
              <Text style={s.patternHintText}>
                You drink least on {lowDayPattern.name}s (avg {lowDayPattern.avg}ml)
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Streak banner — full streak info for the Log Screen */}
      {streak > 0 && (
        <View style={s.logStreakBanner}>
          <StreakFlame streakLength={streak} />
          <Text style={s.logStreakText}>{streak} day streak 🔥</Text>
        </View>
      )}

      {/* GitHub-style streak heatmap */}
      <View style={[s.heatmapCard, { backgroundColor: colors.surface }]}>
        <Text style={s.heatmapTitle}>Streak History</Text>
        <Heatmap goalGlasses={dailyGoal} />
      </View>
    </>
  );

  return (
    <SafeAreaView style={s.container}>
      {loading ? (
        <View style={s.loading}>
          <Text style={s.loadingText}>Loading your logs...</Text>
        </View>
      ) : logs.length === 0 ? (
        <ScrollView contentContainerStyle={s.list}>
          {headerComponent}
          <View style={s.empty}>
            <Text style={s.emptyText}>No drinks logged yet today</Text>
            <Text style={s.emptyHint}>
              Go to Home and tap "I drank water"
            </Text>
          </View>
        </ScrollView>
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(item, index) => item?.id ?? String(index)}
          contentContainerStyle={s.list}
          style={{ flex: 1 }}
          ListHeaderComponent={headerComponent}
          renderItem={renderLogItem}
          getItemLayout={(_data, index) => ({
            length: ITEM_HEIGHT,
            offset: ITEM_HEIGHT * index,
            index,
          })}
          windowSize={7}
          maxToRenderPerBatch={15}
          removeClippedSubviews={true}
        />
      )}
    </SafeAreaView>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
      paddingTop: 80,
    },
    header: {
      paddingHorizontal: 24,
      paddingTop: 0,
      paddingBottom: 12,
    },
    headerLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    title: {
      fontSize: 28,
      fontWeight: "700",
      color: colors.text,
    },
    subtitle: {
      fontSize: 15,
      color: colors.textSecondary,
      marginTop: 4,
    },
    weeklyCard: {
      backgroundColor: colors.surface,
      borderRadius: colors.radius.xl,
      marginHorizontal: 24,
      marginBottom: 12,
      padding: 20,
      ...colors.elevation[1],
    },
    weeklyTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.text,
      marginBottom: 16,
    },
    chartRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-end",
      height: MAX_BAR + 30,
    },
    barCol: {
      alignItems: "center",
      flex: 1,
    },
    barValue: {
      fontSize: 11,
      fontWeight: "600",
      color: colors.textSecondary,
      marginBottom: 4,
    },
    bar: {
      width: 20,
      borderRadius: colors.radius.sm,
      backgroundColor: colors.primaryBg,
      overflow: "hidden",
      justifyContent: "flex-end",
    },
    barFill: {
      width: "100%",
      borderRadius: colors.radius.sm,
    },
    barLabel: {
      fontSize: 11,
      fontWeight: "600",
      color: colors.textSecondary,
      marginTop: 6,
    },
    patternHint: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: 14,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: colors.borderLight,
    },
    patternHintText: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.textSecondary,
      flex: 1,
    },
    loading: {
      alignItems: "center",
      paddingTop: 40,
      paddingBottom: 40,
    },
    loadingText: {
      fontSize: 15,
      color: colors.textSecondary,
    },
    empty: {
      alignItems: "center",
      paddingTop: 40,
      paddingBottom: 40,
    },
    emptyText: {
      fontSize: 17,
      fontWeight: "600",
      color: colors.textSecondary,
      marginTop: 12,
    },
    emptyHint: {
      fontSize: 14,
      color: colors.textTertiary,
      marginTop: 4,
    },
    list: {
      paddingHorizontal: 24,
      paddingBottom: 24,
    },
    logItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors.surface,
      paddingVertical: 14,
      paddingHorizontal: 18,
      borderRadius: colors.radius.lg,
      marginTop: 10,
      ...colors.elevation[1],
    },
    logLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    logIndex: {
      fontSize: 13,
      color: colors.textTertiary,
      fontWeight: "500",
      width: 28,
    },
    logAmount: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.text,
    },
    logTime: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    logStreakBanner: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 12,
      paddingHorizontal: 20,
      marginHorizontal: 24,
      marginBottom: 8,
      backgroundColor: colors.warningBg,
      borderRadius: colors.radius.lg,
    },
    logStreakText: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.warning,
    },
    heatmapCard: {
      borderRadius: colors.radius.xl,
      marginHorizontal: 24,
      marginBottom: 12,
      padding: 8,
      ...colors.elevation[1],
    },
    heatmapTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.text,
      marginBottom: 4,
      paddingHorizontal: 8,
      paddingTop: 4,
    },
  });
}
