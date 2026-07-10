import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Switch,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getSettings, saveSettings, clearLogs } from "../utils/storage";

export default function SettingsScreen() {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    loadSettings().catch((e) =>
      console.error("Failed to load settings:", e.message, e.stack)
    );
  }, []);

  const loadSettings = async () => {
    const s = await getSettings();
    setSettings(s);
  };

  const update = async (key, value) => {
    try {
      const updated = await saveSettings({ [key]: value });
      setSettings(updated);
    } catch (e) {
      console.error("Failed to save settings:", e.message, e.stack);
    }
  };

  const handleResetData = () => {
    Alert.alert(
      "Reset All Data",
      "This will delete all your drink logs and reset settings. This can't be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            try {
              await clearLogs();
              await saveSettings({
                intervalMinutes: 30,
                sound: true,
                quietHoursEnabled: false,
              });
              await loadSettings();
            } catch (e) {
              console.error("Failed to reset data:", e.message, e.stack);
            }
          },
        },
      ]
    );
  };

  if (!settings) return null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      {/* ── Notification Sound ── */}
      <View style={styles.row}>
        <View style={styles.rowLeft}>
          <Ionicons name="musical-note" size={22} color="#4A90D9" />
          <Text style={styles.rowLabel}>Sound</Text>
        </View>
        <Switch
          value={settings.sound}
          onValueChange={(v) => update("sound", v)}
          trackColor={{ false: "#D6E4F0", true: "#A0C4E8" }}
          thumbColor={settings.sound ? "#4A90D9" : "#f4f3f4"}
        />
      </View>

      {/* ── Quiet Hours ── */}
      <View style={styles.row}>
        <View style={styles.rowLeft}>
          <Ionicons name="moon" size={22} color="#4A90D9" />
          <View>
            <Text style={styles.rowLabel}>Quiet Hours</Text>
            <Text style={styles.rowHint}>
              {settings.quietHoursEnabled
                ? `${settings.quietHoursStart} → ${settings.quietHoursEnd}`
                : "No notifications during sleep"}
            </Text>
          </View>
        </View>
        <Switch
          value={settings.quietHoursEnabled}
          onValueChange={(v) => update("quietHoursEnabled", v)}
          trackColor={{ false: "#D6E4F0", true: "#A0C4E8" }}
          thumbColor={settings.quietHoursEnabled ? "#4A90D9" : "#f4f3f4"}
        />
      </View>

      {/* Separator */}
      <View style={styles.separator} />

      {/* ── Reset Data ── */}
      <TouchableOpacity style={styles.row} onPress={handleResetData}>
        <View style={styles.rowLeft}>
          <Ionicons name="trash-outline" size={22} color="#E8596E" />
          <Text style={[styles.rowLabel, { color: "#E8596E" }]}>
            Reset All Data
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#B8D0E8" />
      </TouchableOpacity>

      {/* ── App Info ── */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Plenty v1.0.0</Text>
        <Text style={styles.footerText}>Built with React Native + Expo</Text>
      </View>
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
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginHorizontal: 24,
    marginTop: 12,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A3A5C",
  },
  rowHint: {
    fontSize: 13,
    color: "#6B8CAB",
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: "#D6E4F0",
    marginHorizontal: 24,
    marginTop: 24,
  },
  footer: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  footerText: {
    fontSize: 13,
    color: "#A0B8D0",
    marginTop: 2,
  },
});
