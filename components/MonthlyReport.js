import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  getCurrentMonthReport,
  getQuarterlyTrends,
  getHighlights,
} from "../utils/reports";
import { getPatternSummary } from "../utils/patterns";
import { getLogs } from "../utils/storage";
import { useTheme } from "../context/ThemeContext";

export default function MonthlyReport() {
  const { colors } = useTheme();
  const s = makeStyles(colors);

  const [expanded, setExpanded] = useState(false);
  const [report, setReport] = useState(null);
  const [trends, setTrends] = useState(null);
  const [highlights, setHighlights] = useState([]);
  const [patternSummary, setPatternSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!expanded) return;
    (async () => {
      try {
        setLoading(true);
        const [r, t, logs] = await Promise.all([
          getCurrentMonthReport(),
          getQuarterlyTrends(),
          getLogs(),
        ]);
        setReport(r);
        setTrends(t);
        setHighlights(r ? getHighlights(r) : []);
        setPatternSummary(getPatternSummary(logs));
      } catch (e) {
        console.error("Failed to load monthly report:", e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [expanded]);

  const toggle = () => setExpanded((v) => !v);

  if (!loading && !report && !expanded) {
    return (
      <TouchableOpacity style={s.card} onPress={toggle} activeOpacity={0.7}>
        <View style={s.header}>
          <Ionicons name="stats-chart" size={20} color={colors.primary} />
          <Text style={s.headerText}>Monthly Report</Text>
        </View>
        <Ionicons name="chevron-down" size={18} color={colors.textTertiary} />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[s.card, expanded && s.cardExpanded]}
      onPress={toggle}
      activeOpacity={0.7}
    >
      <View style={s.header}>
        <View style={s.headerLeft}>
          <Ionicons name="stats-chart" size={20} color={colors.primary} />
          <Text style={s.headerText}>
            {report ? report.label : "Monthly Report"}
          </Text>
        </View>
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={18}
          color={colors.textTertiary}
        />
      </View>

      {expanded && (
        <View style={s.body}>
          {loading ? (
            <ActivityIndicator color={colors.primary} style={s.loader} />
          ) : !report ? (
            <Text style={s.emptyText}>
              No data yet this month. Start logging to see your report!
            </Text>
          ) : (
            <>
              <View style={s.statGrid}>
                <View style={s.stat}>
                  <Text style={s.statValue}>{report.totalGlasses}</Text>
                  <Text style={s.statLabel}>Glasses</Text>
                </View>
                <View style={s.stat}>
                  <Text style={s.statValue}>{report.daysActive}</Text>
                  <Text style={s.statLabel}>Days</Text>
                </View>
                <View style={s.stat}>
                  <Text style={s.statValue}>{report.avgPerDay}</Text>
                  <Text style={s.statLabel}>Avg/Day</Text>
                </View>
                <View style={s.stat}>
                  <Text style={s.statValue}>{report.bestStreak}</Text>
                  <Text style={s.statLabel}>Best Streak</Text>
                </View>
              </View>

              {highlights.length > 0 && (
                <View style={s.highlights}>
                  {highlights.slice(0, 3).map((h, i) => (
                    <View key={i} style={s.highlightRow}>
                      <Ionicons name={h.icon} size={14} color={colors.warning} />
                      <Text style={s.highlightText}>{h.text}</Text>
                    </View>
                  ))}
                </View>
              )}

              {trends && (
                <View style={s.trendRow}>
                  <Ionicons
                    name={trends.trend === "up" ? "trending-up" : "trending-down"}
                    size={16}
                    color={trends.trend === "up" ? colors.success : colors.error}
                  />
                  <Text style={s.trendText}>
                    {trends.pctChange > 0
                      ? `${trends.pctChange}% vs last month`
                      : trends.pctChange < 0
                        ? `${Math.abs(trends.pctChange)}% vs last month`
                        : "Same as last month"}
                  </Text>
                </View>
              )}

              <View style={s.extraRow}>
                <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                <Text style={s.extraText}>
                  Peak: {report.peakHour}
                </Text>
              </View>

              {patternSummary && (
                <View style={s.extraRow}>
                  <Ionicons name="analytics-outline" size={14} color={colors.textSecondary} />
                  <Text style={s.extraText}>{patternSummary}</Text>
                </View>
              )}
            </>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      marginHorizontal: 24,
      marginBottom: 12,
      padding: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    cardExpanded: {},
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    headerLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    headerText: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.text,
    },
    body: {
      marginTop: 16,
    },
    loader: {
      marginVertical: 20,
    },
    emptyText: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: "center",
      marginVertical: 12,
    },
    statGrid: {
      flexDirection: "row",
      gap: 8,
    },
    stat: {
      flex: 1,
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 10,
      paddingVertical: 10,
      alignItems: "center",
    },
    statValue: {
      fontSize: 20,
      fontWeight: "800",
      color: colors.primary,
    },
    statLabel: {
      fontSize: 11,
      fontWeight: "600",
      color: colors.textSecondary,
      marginTop: 2,
    },
    highlights: {
      marginTop: 12,
      backgroundColor: colors.successBg,
      borderRadius: 10,
      padding: 12,
      gap: 4,
    },
    highlightRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    highlightText: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.text,
    },
    trendRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: 10,
    },
    trendText: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.textSecondary,
    },
    extraRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: 6,
    },
    extraText: {
      fontSize: 12,
      color: colors.textSecondary,
      flex: 1,
    },
  });
}
