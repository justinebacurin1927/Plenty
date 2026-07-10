import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Logger from "../utils/logger";

export default function DevLogScreen() {
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState("ALL"); // ALL | LOG | WARN | ERROR
  const listRef = useRef(null);

  useEffect(() => {
    // Load existing logs
    setLogs(Logger.getLogs());

    // Subscribe to new logs
    const unsub = Logger.subscribe((entry) => {
      if (entry) {
        setLogs((prev) => [...prev, entry]);
      } else {
        setLogs([]);
      }
    });

    return unsub;
  }, []);

  const filteredLogs = filter === "ALL" ? logs : logs.filter((l) => l.level === filter);

  const formatTime = (iso) => {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Dev Logs</Text>
        <TouchableOpacity onPress={() => Logger.clear()}>
          <Text style={styles.clearBtn}>Clear</Text>
        </TouchableOpacity>
      </View>

      {/* Filter chips */}
      <View style={styles.filterRow}>
        {["ALL", "LOG", "WARN", "ERROR"].map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Log list */}
      {filteredLogs.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="code-slash" size={48} color="#B8D0E8" />
          <Text style={styles.emptyText}>No logs yet</Text>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={filteredLogs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item, index }) => (
            <View style={styles.logItem}>
              <View style={styles.logHeader}>
                <Text style={[styles.logBadge, { color: item.color }]}>
                  {item.label}
                </Text>
                <Text style={styles.logTime}>{formatTime(item.timestamp)}</Text>
                <Text style={styles.logIndex}>#{index + 1}</Text>
              </View>
              <Text style={styles.logMessage}>{item.message}</Text>
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
    backgroundColor: "#1A1D23",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#E8EDF2",
  },
  clearBtn: {
    fontSize: 15,
    fontWeight: "600",
    color: "#E8596E",
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: "#2A2D35",
  },
  filterChipActive: {
    backgroundColor: "#4A90D9",
  },
  filterText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#8892A0",
  },
  filterTextActive: {
    color: "#fff",
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  logItem: {
    backgroundColor: "#23262E",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginTop: 6,
    borderLeftWidth: 3,
    borderLeftColor: "#3A3D45",
  },
  logHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  logBadge: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
  },
  logTime: {
    fontSize: 11,
    color: "#6B7280",
    fontFamily: "monospace",
  },
  logIndex: {
    fontSize: 10,
    color: "#4B5563",
    marginLeft: "auto",
  },
  logMessage: {
    fontSize: 13,
    color: "#D1D5DB",
    fontFamily: "monospace",
    lineHeight: 18,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 60,
  },
  emptyText: {
    fontSize: 15,
    color: "#6B7280",
    marginTop: 10,
  },
});
