import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import Mascot, { getRandomMessage } from "../components/Mascot";
import MonthlyReport from "../components/MonthlyReport";
import { getTodayLogs, getDailyTotals, getSettings, getLogs } from "../utils/storage";
import { getLowestHydrationDay } from "../utils/patterns";
import { useTheme } from "../context/ThemeContext";

const MAX_BAR = 200;

export default function LogScreen() {
  const { colors } = useTheme();
  const s = makeStyles(colors);

  const [logs, setLogs] = useState([]);
  const [weekly, setWeekly] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mascotVariant, setMascotVariant] = useState("classic");
  const [mascotExpression, setMascotExpression] = useState("happy");
  const [lowDayPattern, setLowDayPattern] = useState(null);
  const [mascotMessage, setMascotMessage] = useState(null);
  const EXPRESSIONS = ["happy", "excited", "reminding", "sleepy"];

  const cycleExpression = () => {
    setMascotExpression((prev) => {
      const idx = EXPRESSIONS.indexOf(prev);
      return EXPRESSIONS[(idx + 1) % EXPRESSIONS.length];
    });
    setMascotMessage(getRandomMessage());
    if (window._mascotTimer) clearTimeout(window._mascotTimer);
    window._mascotTimer = setTimeout(() => setMascotMessage(null), 2500);
  };

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const today = await getTodayLogs();
          setLogs(today.reverse());
          const days = await getDailyTotals();
          setWeekly(days);
          const settings = await getSettings();
          setMascotVariant(settings.mascotVariant || "classic");

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
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const maxTotal = useMemo(
    () => Math.max(...weekly.map((d) => d.total), 1),
    [weekly]
  );

  const ITEM_HEIGHT = 58;

  const renderLogItem = useCallback(
    ({ item, index }) => (
      <View style={s.logItem}>
        <View style={s.logLeft}>
          <Text style={s.logIndex}>#{logs.length - index}</Text>
          <Ionicons name="water" size={20} color={colors.primary} />
          <Text style={s.logAmount}>{item.amount || 250} ml</Text>
        </View>
        <Text style={s.logTime}>{formatTime(item.timestamp)}</Text>
      </View>
    ),
    [colors, logs.length]
  );

  const headerComponent = (
    <>
      <View style={s.header}>
        <View style={s.headerLeft}>
          <Mascot size={80} expression={mascotExpression} variant={mascotVariant} onPress={cycleExpression} message={mascotMessage} />
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
              const height = Math.max((day.total / maxTotal) * MAX_BAR, day.total > 0 ? 10 : 4);
              return (
                <View key={i} style={s.barCol}>
                  <Text style={s.barValue}>{Math.round(day.total / 250)}</Text>
                  <View style={[s.bar, { height }]}>
                    <View
                      style={[
                        s.barFill,
                        {
                          height: "100%",
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
            <Mascot size={110} expression={mascotExpression} variant={mascotVariant} onPress={cycleExpression} message={mascotMessage} />
            <Text style={s.emptyText}>No drinks logged yet today</Text>
            <Text style={s.emptyHint}>
              Go to Home and tap "I drank water"
            </Text>
          </View>
        </ScrollView>
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(item) => item.id}
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
      borderRadius: 16,
      marginHorizontal: 24,
      marginBottom: 12,
      padding: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
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
      borderRadius: 6,
      backgroundColor: colors.primaryBg,
      overflow: "hidden",
      justifyContent: "flex-end",
    },
    barFill: {
      width: "100%",
      borderRadius: 6,
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
      borderRadius: 14,
      marginTop: 10,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
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
  });
}
