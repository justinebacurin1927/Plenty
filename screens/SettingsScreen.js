import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  TextInput,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import Mascot, { getRandomMessage } from "../components/Mascot";
import {
  getSettings,
  saveSettings,
  clearLogs,
  resetAchievementProgress,
  getUnlockedAchievements,
  getLogs,
  weightBasedGoal,
  lbsToKg,
  activityBoostedGoal,
} from "../utils/storage";
import { exportToCSV, exportToJSON, importFromJSON } from "../utils/export";
import { clearWeatherCache } from "../utils/weather";
import { getLullPeriods, getPeakHours } from "../utils/patterns";
import { MASCOT_VARIANTS } from "../components/Mascot";

const MESSAGE_CATEGORIES = [
  { key: "encouraging", icon: "💪", label: "Encouraging", hint: "Motivational messages" },
  { key: "funny",      icon: "😄", label: "Funny",       hint: "Playful and lighthearted" },
  { key: "urgent",     icon: "🔔", label: "Urgent",      hint: "Direct reminders" },
  { key: "fact",       icon: "🧠", label: "Health Facts", hint: "Science and trivia" },
  { key: "morning",    icon: "☀️", label: "Morning",     hint: "Time-appropriate AM messages" },
  { key: "evening",    icon: "🌙", label: "Evening",     hint: "Wind-down PM messages" },
];

export default function SettingsScreen() {
  const [settings, setSettings] = useState(null);
  const [mascotExpression, setMascotExpression] = useState("happy");
  const [mascotMessage, setMascotMessage] = useState(null);
  const [unlockedAchievements, setUnlockedAchievements] = useState([]);
  const [weightText, setWeightText] = useState("");
  const [patternLulls, setPatternLulls] = useState([]);
  const [patternPeaks, setPatternPeaks] = useState([]);
  const [exporting, setExporting] = useState(null); // "csv" | "json" | "importing" | null
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

  useEffect(() => {
    loadSettings().catch((e) =>
      console.error("Failed to load settings:", e.message, e.stack)
    );
  }, []);

  const loadSettings = async () => {
    const [s, unlocked] = await Promise.all([
      getSettings(),
      getUnlockedAchievements(),
    ]);
    setSettings(s);
    setUnlockedAchievements(unlocked);
    if (s.weightKg) setWeightText(String(s.weightKg));

    // Load pattern data
    try {
      const logs = await getLogs();
      setPatternLulls(getLullPeriods(logs));
      setPatternPeaks(getPeakHours(logs));
    } catch (e) {
      // ignore
    }
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
              await resetAchievementProgress();
              await saveSettings({
                intervalMinutes: 30,
                sound: true,
                quietHoursEnabled: false,
                dailyGoal: 8,
                drinkAmount: 250,
                messageCategories: {
                  encouraging: true,
                  funny: true,
                  urgent: true,
                  fact: true,
                  morning: true,
                  evening: true,
                },
                lastMessageId: null,
                mascotVariant: "classic",
                weightKg: null,
                weightUnit: "kg",
                activityAdjustment: false,
                manualLocation: "",
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
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Mascot size={80} expression={mascotExpression} onPress={cycleExpression} message={mascotMessage} />
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

      {/* ── Daily Goal ── */}
      <View style={styles.chipRowContainer}>
        <View style={styles.chipRowLabel}>
          <Ionicons name="flag" size={22} color="#4A90D9" />
          <Text style={styles.rowLabel}>Daily Goal</Text>
        </View>
        <View style={styles.chipRow}>
          {[6, 8, 10, 12].map((n) => (
            <TouchableOpacity
              key={n}
              style={[styles.chip, settings.dailyGoal === n && styles.chipActive]}
              onPress={() => update("dailyGoal", n)}
            >
              <Text style={[styles.chipText, settings.dailyGoal === n && styles.chipTextActive]}>
                {n}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── Drink Amount ── */}
      <View style={styles.chipRowContainer}>
        <View style={styles.chipRowLabel}>
          <Ionicons name="resize" size={22} color="#4A90D9" />
          <Text style={styles.rowLabel}>Drink Size</Text>
        </View>
        <View style={styles.chipRow}>
          {[100, 200, 250, 500].map((n) => (
            <TouchableOpacity
              key={n}
              style={[styles.chip, settings.drinkAmount === n && styles.chipActive]}
              onPress={() => update("drinkAmount", n)}
            >
              <Text style={[styles.chipText, settings.drinkAmount === n && styles.chipTextActive]}>
                {n}ml
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── Weight-Based Goal (C1) ── */}
      <View style={styles.row}>
        <View style={styles.rowLeft}>
          <Ionicons name="scale" size={22} color="#4A90D9" />
          <View>
            <Text style={styles.rowLabel}>Weight-Based Goal</Text>
            <Text style={styles.rowHint}>Auto-calculates daily goal</Text>
          </View>
        </View>
      </View>
      <View style={styles.weightRow}>
        <TextInput
          style={styles.weightInput}
          placeholder="Weight"
          placeholderTextColor="#A0B8D0"
          keyboardType="decimal-pad"
          value={weightText}
          onChangeText={(t) => {
            setWeightText(t);
            const val = parseFloat(t);
            if (val > 0 && val < 500) {
              const kg = settings.weightUnit === "lbs" ? lbsToKg(val) : val;
              const goal = weightBasedGoal(kg);
              if (goal && goal !== settings.dailyGoal) {
                update("weightKg", kg);
                update("dailyGoal", goal);
              }
            }
          }}
        />
        <TouchableOpacity
          style={[styles.weightUnitChip, settings.weightUnit === "kg" && styles.unitActive]}
          onPress={() => update("weightUnit", "kg")}
        >
          <Text style={[styles.unitText, settings.weightUnit === "kg" && styles.unitTextActive]}>
            kg
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.weightUnitChip, settings.weightUnit === "lbs" && styles.unitActive]}
          onPress={() => update("weightUnit", "lbs")}
        >
          <Text style={[styles.unitText, settings.weightUnit === "lbs" && styles.unitTextActive]}>
            lbs
          </Text>
        </TouchableOpacity>
        {settings.weightKg > 0 && (
          <Text style={styles.weightResult}>
            → {weightBasedGoal(settings.weightKg)} glasses/day
          </Text>
        )}
      </View>

      {/* ── Activity Adjustment (C2) ── */}
      <View style={styles.row}>
        <View style={styles.rowLeft}>
          <Ionicons name="fitness" size={22} color="#4A90D9" />
          <View>
            <Text style={styles.rowLabel}>Exercised Today</Text>
            <Text style={styles.rowHint}>+750ml / +3 glasses boost</Text>
          </View>
        </View>
        <Switch
          value={settings.activityAdjustment || false}
          onValueChange={(v) => update("activityAdjustment", v)}
          trackColor={{ false: "#D6E4F0", true: "#A0C4E8" }}
          thumbColor={settings.activityAdjustment ? "#4A90D9" : "#f4f3f4"}
        />
      </View>

      {/* ── Pattern Insights (B3-B4) ── */}
      {patternPeaks.length > 0 && (
        <View style={styles.sectionHeader}>
          <Ionicons name="analytics" size={18} color="#4A90D9" />
          <Text style={styles.sectionHeaderText}>Your Patterns</Text>
        </View>
      )}
      {patternPeaks.length > 0 && (
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Ionicons name="trending-up" size={20} color="#27AE60" />
            <View>
              <Text style={styles.rowLabel}>Peak Time</Text>
              <Text style={styles.rowHint}>
                Most hydrated: {patternPeaks.map((p) => p.label).join(", ")}
              </Text>
            </View>
          </View>
        </View>
      )}
      {patternLulls.length > 0 && (
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Ionicons name="trending-down" size={20} color="#E8596E" />
            <View>
              <Text style={styles.rowLabel}>Low Periods</Text>
              <Text style={styles.rowHint}>
                {patternLulls.filter(l => l.severity === "gap").map((l) => l.label).join(", ") || "Fewer logs in these times"}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* ── Manual Location Fallback (D5) ── */}
      <View style={styles.sectionHeader}>
        <Ionicons name="location" size={18} color="#4A90D9" />
        <Text style={styles.sectionHeaderText}>Weather Location</Text>
      </View>
      <View style={styles.weightRow}>
        <TextInput
          style={[styles.weightInput, { flex: 2 }]}
          placeholder="City or zip code"
          placeholderTextColor="#A0B8D0"
          value={settings.manualLocation || ""}
          onChangeText={(t) => update("manualLocation", t)}
        />
        <TouchableOpacity
          style={styles.weightUnitChip}
          onPress={() => {
            update("manualLocation", "");
            clearWeatherCache().catch(() => {});
          }}
        >
          <Text style={styles.unitText}>Clear</Text>
        </TouchableOpacity>
      </View>

      {/* ── Data Export & Backup (E1-E4) ── */}
      <View style={styles.sectionHeader}>
        <Ionicons name="download" size={18} color="#4A90D9" />
        <Text style={styles.sectionHeaderText}>Data Export & Backup</Text>
      </View>
      <TouchableOpacity
        style={styles.row}
        onPress={async () => {
          setExporting("csv");
          try {
            await exportToCSV();
          } catch (e) {
            Alert.alert("Export Failed", e.message);
          } finally {
            setExporting(null);
          }
        }}
        disabled={exporting !== null}
      >
        <View style={styles.rowLeft}>
          <Ionicons name="grid-outline" size={22} color="#4A90D9" />
          <View>
            <Text style={styles.rowLabel}>
              {exporting === "csv" ? "Exporting..." : "Export CSV"}
            </Text>
            <Text style={styles.rowHint}>Share logs as spreadsheet file</Text>
          </View>
        </View>
        <Ionicons name="share-outline" size={20} color="#B8D0E8" />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.row}
        onPress={async () => {
          setExporting("json");
          try {
            await exportToJSON();
          } catch (e) {
            Alert.alert("Backup Failed", e.message);
          } finally {
            setExporting(null);
          }
        }}
        disabled={exporting !== null}
      >
        <View style={styles.rowLeft}>
          <Ionicons name="archive-outline" size={22} color="#4A90D9" />
          <View>
            <Text style={styles.rowLabel}>
              {exporting === "json" ? "Exporting..." : "Export JSON Backup"}
            </Text>
            <Text style={styles.rowHint}>Full backup with settings & achievements</Text>
          </View>
        </View>
        <Ionicons name="share-outline" size={20} color="#B8D0E8" />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.row}
        onPress={async () => {
          try {
            setExporting("importing");
            const result = await DocumentPicker.getDocumentAsync({
              type: "application/json",
              copyToCacheDirectory: true,
            });

            if (result.canceled) return;
            const file = result.assets?.[0];
            if (!file) return;

            const response = await fetch(file.uri);
            const jsonString = await response.text();
            const summary = await importFromJSON(jsonString);

            Alert.alert(
              "Restored!",
              `Imported ${summary.logs} log entries.\n${summary.hasSettings ? "✅ Settings restored\n" : ""}${summary.hasAchievements ? "✅ Achievements restored" : ""}`,
              [{ text: "Great!" }]
            );
            await loadSettings();
          } catch (e) {
            Alert.alert("Import Failed", e.message || "Could not read backup file");
          } finally {
            setExporting(null);
          }
        }}
        disabled={exporting !== null}
      >
        <View style={styles.rowLeft}>
          <Ionicons name="cloud-upload-outline" size={22} color="#4A90D9" />
          <View>
            <Text style={styles.rowLabel}>
              {exporting === "importing" ? "Importing..." : "Import JSON Backup"}
            </Text>
            <Text style={styles.rowHint}>Restore from a previous backup</Text>
          </View>
        </View>
        <Ionicons name="enter-outline" size={20} color="#B8D0E8" />
      </TouchableOpacity>

      {/* ── Notification Messages ── */}
      <View style={styles.sectionHeader}>
        <Ionicons name="chatbubbles" size={18} color="#4A90D9" />
        <Text style={styles.sectionHeaderText}>Notification Messages</Text>
      </View>

      {MESSAGE_CATEGORIES.map((cat) => (
        <View key={cat.key} style={styles.row}>
          <View style={styles.rowLeft}>
            <Text style={styles.catIcon}>{cat.icon}</Text>
            <View>
              <Text style={styles.rowLabel}>{cat.label}</Text>
              <Text style={styles.rowHint}>{cat.hint}</Text>
            </View>
          </View>
          <Switch
            value={(settings.messageCategories || {})[cat.key] !== false}
            onValueChange={(v) => {
              const updated = { ...(settings.messageCategories || {}) };
              updated[cat.key] = v;
              update("messageCategories", updated);
            }}
            trackColor={{ false: "#D6E4F0", true: "#A0C4E8" }}
            thumbColor={(settings.messageCategories || {})[cat.key] !== false ? "#4A90D9" : "#f4f3f4"}
          />
        </View>
      ))}

      {/* ── Mascot Style (D4) ── */}
      <View style={styles.sectionHeader}>
        <Ionicons name="happy" size={18} color="#4A90D9" />
        <Text style={styles.sectionHeaderText}>Mascot Style</Text>
      </View>

      <View style={styles.mascotRow}>
        {MASCOT_VARIANTS.map((v) => {
          const isUnlocked = !v.achievementId || unlockedAchievements.includes(v.achievementId);
          const isActive = (settings.mascotVariant || "classic") === v.id;
          return (
            <TouchableOpacity
              key={v.id}
              disabled={!isUnlocked}
              style={[
                styles.mascotCard,
                isActive && styles.mascotCardActive,
                !isUnlocked && styles.mascotCardLocked,
              ]}
              onPress={() => update("mascotVariant", v.id)}
            >
              <View style={styles.mascotCardPreview}>
                <Text style={styles.mascotPreviewEmoji}>
                  {v.id === "classic" ? "💧" : v.id === "cool" ? "😎" : v.id === "crown" ? "👑" : "✨"}
                </Text>
              </View>
              <Text style={[styles.mascotCardLabel, !isUnlocked && styles.mascotCardLabelLocked]}>
                {v.label}
              </Text>
              {!isUnlocked && (
                <Text style={styles.mascotCardHint}>Unlock via achievements</Text>
              )}
            </TouchableOpacity>
          );
        })}
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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E8F4FD",
    paddingTop: 80,
  },
  scroll: {
    paddingTop: 40,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 24,
    paddingTop: 0,
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
  chipRowContainer: {
    backgroundColor: "#fff",
    paddingVertical: 14,
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
  chipRowLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  chipRow: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: "#F0F4F8",
    borderWidth: 1,
    borderColor: "#D6E4F0",
  },
  chipActive: {
    backgroundColor: "#4A90D9",
    borderColor: "#4A90D9",
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4A6A85",
  },
  chipTextActive: {
    color: "#fff",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 24,
    marginTop: 24,
    marginBottom: 4,
  },
  sectionHeaderText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#4A6A85",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  catIcon: {
    fontSize: 22,
  },

  // ── Weight Goal ──
  weightRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginHorizontal: 24,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    marginBottom: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  weightInput: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "#F5F9FF",
    fontSize: 15,
    fontWeight: "600",
    color: "#1A3A5C",
  },
  weightUnitChip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: "#F0F4F8",
    borderWidth: 1,
    borderColor: "#D6E4F0",
  },
  unitActive: {
    backgroundColor: "#4A90D9",
    borderColor: "#4A90D9",
  },
  unitText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#4A6A85",
  },
  unitTextActive: {
    color: "#fff",
  },
  weightResult: {
    fontSize: 13,
    fontWeight: "600",
    color: "#27AE60",
  },

  // ── Mascot Style Cards ──
  mascotRow: {
    flexDirection: "row",
    gap: 10,
    marginHorizontal: 24,
    marginTop: 12,
  },
  mascotCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E8F0FE",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  mascotCardActive: {
    borderColor: "#4A90D9",
    backgroundColor: "#E8F4FD",
  },
  mascotCardLocked: {
    opacity: 0.45,
  },
  mascotCardPreview: {
    marginBottom: 6,
  },
  mascotPreviewEmoji: {
    fontSize: 28,
  },
  mascotCardLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1A3A5C",
  },
  mascotCardLabelLocked: {
    color: "#A0B8D0",
  },
  mascotCardHint: {
    fontSize: 9,
    color: "#A0B8D0",
    marginTop: 2,
    textAlign: "center",
  },

  separator: {
    height: 1,
    backgroundColor: "#D6E4F0",
    marginHorizontal: 24,
    marginTop: 24,
  },
  footer: {
    alignItems: "center",
    marginTop: 24,
    paddingBottom: 40,
  },
  footerText: {
    fontSize: 13,
    color: "#A0B8D0",
    marginTop: 2,
  },
});
