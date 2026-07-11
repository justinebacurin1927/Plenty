import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import Mascot, { getRandomMessage } from "../components/Mascot";
import MonthlyReport from "../components/MonthlyReport";
import { getTodayLogs, getDailyTotals, getSettings, getLogs } from "../utils/storage";
import { getLowestHydrationDay } from "../utils/patterns";

const MAX_BAR = 200; // max visual height

export default function LogScreen() {
  const [logs, setLogs] = useState([]);
  const [weekly, setWeekly] = useState([]);
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

          // Day-of-week pattern (B5)
          try {
            const allLogs = await getLogs();
            const lowDay = getLowestHydrationDay(allLogs);
            if (lowDay && lowDay.count >= 3) {
              setLowDayPattern(lowDay);
            } else {
              setLowDayPattern(null);
            }
          } catch (e) {
            // ignore
          }
        } catch (e) {
          console.error("Failed to load log data:", e.message, e.stack);
        }
      })();
    }, [])
  );

  const formatTime = (iso) => {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const maxTotal = Math.max(...weekly.map((d) => d.total), 1);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Mascot size={80} expression={mascotExpression} variant={mascotVariant} onPress={cycleExpression} message={mascotMessage} />
          <View>
            <Text style={styles.title}>Your Log</Text>
            <Text style={styles.subtitle}>{logs.length} glasses today</Text>
          </View>
        </View>
      </View>

      {/* ── Monthly Report (A3) ── */}
      <MonthlyReport />

      {/* ── Weekly Bar Chart ── */}
      {weekly.length > 0 && (
        <View style={styles.weeklyCard}>
          <Text style={styles.weeklyTitle}>Last 7 Days</Text>
          <View style={styles.chartRow}>
            {weekly.map((day, i) => {
              const height = Math.max((day.total / maxTotal) * MAX_BAR, day.total > 0 ? 10 : 4);
              return (
                <View key={i} style={styles.barCol}>
                  <Text style={styles.barValue}>{Math.round(day.total / 250)}</Text>
                  <View style={[styles.bar, { height }]}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          height: "100%",
                          backgroundColor: i === 6 ? "#4A90D9" : "#A0C4E8",
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.barLabel}>{day.label}</Text>
                </View>
              );
            })}
          </View>

          {/* Day-of-week insight (B5) */}
          {lowDayPattern && (
            <View style={styles.patternHint}>
              <Ionicons name="analytics-outline" size={14} color="#6B8CAB" />
              <Text style={styles.patternHintText}>
                You drink least on {lowDayPattern.name}s (avg {lowDayPattern.avg}ml)
              </Text>
            </View>
          )}
        </View>
      )}

      {/* ── Today's List ── */}
      {logs.length === 0 ? (
        <View style={styles.empty}>
          <Mascot size={110} expression={mascotExpression} variant={mascotVariant} onPress={cycleExpression} message={mascotMessage} />
          <Text style={styles.emptyText}>No drinks logged yet today</Text>
          <Text style={styles.emptyHint}>
            Go to Home and tap "I drank water"
          </Text>
        </View>
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item, index }) => (
            <View style={styles.logItem}>
              <View style={styles.logLeft}>
                <Text style={styles.logIndex}>#{logs.length - index}</Text>
                <Ionicons name="water" size={20} color="#4A90D9" />
                <Text style={styles.logAmount}>{item.amount || 250} ml</Text>
              </View>
              <Text style={styles.logTime}>{formatTime(item.timestamp)}</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E8F4FD",
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
    color: "#1A3A5C",
  },
  subtitle: {
    fontSize: 15,
    color: "#6B8CAB",
    marginTop: 4,
  },

  // ── Weekly ──
  weeklyCard: {
    backgroundColor: "#fff",
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
    color: "#1A3A5C",
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
    color: "#6B8CAB",
    marginBottom: 4,
  },
  bar: {
    width: 20,
    borderRadius: 6,
    backgroundColor: "#E8F0FE",
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
    color: "#6B8CAB",
    marginTop: 6,
  },

  // ── Pattern Hint ──
  patternHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#E8F0FE",
  },
  patternHintText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B8CAB",
    flex: 1,
  },

  // ── Empty ──
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 60,
  },
  emptyText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#6B8CAB",
    marginTop: 12,
  },
  emptyHint: {
    fontSize: 14,
    color: "#A0B8D0",
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
    backgroundColor: "#fff",
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
    color: "#A0B8D0",
    fontWeight: "500",
    width: 28,
  },
  logAmount: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1A3A5C",
  },
  logTime: {
    fontSize: 14,
    color: "#6B8CAB",
  },
});
