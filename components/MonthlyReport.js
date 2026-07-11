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

export default function MonthlyReport() {
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

  // Empty state — no report available
  if (!loading && !report && !expanded) {
    return (
      <TouchableOpacity style={styles.card} onPress={toggle} activeOpacity={0.7}>
        <View style={styles.header}>
          <Ionicons name="stats-chart" size={20} color="#4A90D9" />
          <Text style={styles.headerText}>Monthly Report</Text>
        </View>
        <Ionicons name="chevron-down" size={18} color="#A0B8D0" />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.card, expanded && styles.cardExpanded]}
      onPress={toggle}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="stats-chart" size={20} color="#4A90D9" />
          <Text style={styles.headerText}>
            {report ? report.label : "Monthly Report"}
          </Text>
        </View>
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={18}
          color="#A0B8D0"
        />
      </View>

      {expanded && (
        <View style={styles.body}>
          {loading ? (
            <ActivityIndicator color="#4A90D9" style={styles.loader} />
          ) : !report ? (
            <Text style={styles.emptyText}>
              No data yet this month. Start logging to see your report!
            </Text>
          ) : (
            <>
              {/* Overview stats */}
              <View style={styles.statGrid}>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{report.totalGlasses}</Text>
                  <Text style={styles.statLabel}>Glasses</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{report.daysActive}</Text>
                  <Text style={styles.statLabel}>Days</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{report.avgPerDay}</Text>
                  <Text style={styles.statLabel}>Avg/Day</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{report.bestStreak}</Text>
                  <Text style={styles.statLabel}>Best Streak</Text>
                </View>
              </View>

              {/* Highlights */}
              {highlights.length > 0 && (
                <View style={styles.highlights}>
                  {highlights.slice(0, 3).map((h, i) => (
                    <Text key={i} style={styles.highlight}>
                      {h.icon} {h.text}
                    </Text>
                  ))}
                </View>
              )}

              {/* Quarterly trend */}
              {trends && (
                <View style={styles.trendRow}>
                  <Ionicons
                    name={trends.trend === "up" ? "trending-up" : "trending-down"}
                    size={16}
                    color={trends.trend === "up" ? "#27AE60" : "#E8596E"}
                  />
                  <Text style={styles.trendText}>
                    {trends.pctChange > 0
                      ? `${trends.pctChange}% vs last month`
                      : trends.pctChange < 0
                        ? `${Math.abs(trends.pctChange)}% vs last month`
                        : "Same as last month"}
                  </Text>
                </View>
              )}

              {/* Peak hour & pattern */}
              <View style={styles.extraRow}>
                <Ionicons name="time-outline" size={14} color="#6B8CAB" />
                <Text style={styles.extraText}>
                  Peak: {report.peakHour}
                </Text>
              </View>

              {patternSummary && (
                <View style={styles.extraRow}>
                  <Ionicons name="analytics-outline" size={14} color="#6B8CAB" />
                  <Text style={styles.extraText}>{patternSummary}</Text>
                </View>
              )}
            </>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
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
  cardExpanded: {
    // no extra style needed
  },
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
    color: "#1A3A5C",
  },
  body: {
    marginTop: 16,
  },
  loader: {
    marginVertical: 20,
  },
  emptyText: {
    fontSize: 14,
    color: "#6B8CAB",
    textAlign: "center",
    marginVertical: 12,
  },
  statGrid: {
    flexDirection: "row",
    gap: 8,
  },
  stat: {
    flex: 1,
    backgroundColor: "#F5F9FF",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#4A90D9",
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6B8CAB",
    marginTop: 2,
  },
  highlights: {
    marginTop: 12,
    backgroundColor: "#F0FFF4",
    borderRadius: 10,
    padding: 12,
    gap: 4,
  },
  highlight: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1A3A5C",
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
    color: "#6B8CAB",
  },
  extraRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  extraText: {
    fontSize: 12,
    color: "#6B8CAB",
    flex: 1,
  },
});
