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
import { getTodayLogs } from "../utils/storage";

export default function LogScreen() {
  const [logs, setLogs] = useState([]);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const today = await getTodayLogs();
          setLogs(today.reverse()); // newest first
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Today's Log</Text>
        <Text style={styles.subtitle}>{logs.length} glasses of water</Text>
      </View>

      {logs.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="water-outline" size={64} color="#B8D0E8" />
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
                <Text style={styles.logAmount}>250 ml</Text>
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
    backgroundColor: "#F5F9FF",
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 12,
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
