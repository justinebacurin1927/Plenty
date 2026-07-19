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
  Linking,
} from "react-native";
import Constants from "expo-constants";
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
import { useTheme } from "../context/ThemeContext";

const MESSAGE_CATEGORIES = [
  { key: "encouraging", icon: "megaphone", label: "Encouraging", hint: "Motivational messages" },
  { key: "funny",      icon: "happy",      label: "Funny",       hint: "Playful and lighthearted" },
  { key: "urgent",     icon: "alert-circle",  label: "Urgent",      hint: "Direct reminders" },
  { key: "fact",       icon: "bulb",       label: "Health Facts", hint: "Science and trivia" },
  { key: "morning",    icon: "sunny",      label: "Morning",     hint: "Time-appropriate AM messages" },
  { key: "evening",    icon: "moon",       label: "Evening",     hint: "Wind-down PM messages" },
];

const THEME_OPTIONS = [
  { key: "auto",   label: "Auto",   icon: "phone-portrait" },
  { key: "light",  label: "Light",  icon: "sunny" },
  { key: "dark",   label: "Dark",   icon: "moon" },
];

const PRIVACY_POLICY_URL = "https://justine7417.github.io/plenty/privacy-policy";

export default function SettingsScreen() {
  const { colors, themeMode, setThemeMode } = useTheme();
  const s = makeStyles(colors);

  const [settings, setSettings] = useState(null);
  const [mascotExpression, setMascotExpression] = useState("happy");
  const [mascotVariant, setMascotVariant] = useState("classic");
  const [mascotMessage, setMascotMessage] = useState(null);
  const [unlockedAchievements, setUnlockedAchievements] = useState([]);
  const [weightText, setWeightText] = useState("");
  const [patternLulls, setPatternLulls] = useState([]);
  const [patternPeaks, setPatternPeaks] = useState([]);
  const [exporting, setExporting] = useState(null);
  const [exportExpanded, setExportExpanded] = useState(false);
  const [messagesExpanded, setMessagesExpanded] = useState(false);
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
    setMascotVariant(s.mascotVariant || "classic");

    try {
      const logs = await getLogs();
      setPatternLulls(getLullPeriods(logs));
      setPatternPeaks(getPeakHours(logs));
    } catch (e) {}
  };

  const update = async (key, value) => {
    try {
      const updated = await saveSettings({ [key]: value });
      setSettings(updated);
    } catch (e) {
      console.error("Failed to save settings:", e.message, e.stack);
    }
  };

  const handleOpenPrivacyPolicy = () => {
    Linking.openURL(PRIVACY_POLICY_URL).catch((e) =>
      console.error("Failed to open privacy policy URL:", e.message, e.stack)
    );
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
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <Mascot size={80} expression={mascotExpression} variant={mascotVariant} onPress={cycleExpression} message={mascotMessage} />
          <Text style={s.title}>Settings</Text>
        </View>

        {/* ── Theme (Sprint 5, Epic A5) ── */}
        <View style={s.sectionHeader}>
          <Ionicons name="color-palette" size={18} color={colors.primary} />
          <Text style={s.sectionHeaderText}>Appearance</Text>
        </View>
        <View style={[s.chipRowContainer, { paddingVertical: 14 }]}>
          <View style={s.themeRow}>
            {THEME_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.key}
                style={[s.themeChip, themeMode === opt.key && s.themeChipActive]}
                onPress={() => setThemeMode(opt.key)}
                accessibilityLabel={`${opt.label} theme`}
                accessibilityRole="button"
              >
                <Ionicons
                  name={opt.icon}
                  size={18}
                  color={themeMode === opt.key ? "#fff" : colors.textSection}
                />
                <Text style={[s.themeChipText, themeMode === opt.key && s.themeChipTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Notification Sound ── */}
        <View style={s.row}>
          <View style={s.rowLeft}>
            <Ionicons name="musical-note" size={22} color={colors.primary} />
            <Text style={s.rowLabel}>Sound</Text>
          </View>
          <Switch
            value={settings.sound}
            onValueChange={(v) => update("sound", v)}
            trackColor={{ false: colors.switchTrackOff, true: colors.switchTrackOn }}
            thumbColor={settings.sound ? colors.switchThumbOn : colors.switchThumbOff}
            accessibilityLabel={`Sound ${settings.sound ? "on" : "off"}`}
          />
        </View>

        {/* ── Quiet Hours ── */}
        <View style={s.row}>
          <View style={s.rowLeft}>
            <Ionicons name="moon" size={22} color={colors.primary} />
            <View>
              <Text style={s.rowLabel}>Quiet Hours</Text>
              <Text style={s.rowHint}>
                {settings.quietHoursEnabled
                  ? `${settings.quietHoursStart} → ${settings.quietHoursEnd}`
                  : "No notifications during sleep"}
              </Text>
            </View>
          </View>
          <Switch
            value={settings.quietHoursEnabled}
            onValueChange={(v) => update("quietHoursEnabled", v)}
            trackColor={{ false: colors.switchTrackOff, true: colors.switchTrackOn }}
            thumbColor={settings.quietHoursEnabled ? colors.switchThumbOn : colors.switchThumbOff}
            accessibilityLabel={`Quiet hours ${settings.quietHoursEnabled ? "on" : "off"}`}
          />
        </View>

        {/* ── Daily Goal ── */}
        <View style={s.chipRowContainer}>
          <View style={s.chipRowLabel}>
            <Ionicons name="flag" size={22} color={colors.primary} />
            <Text style={s.rowLabel}>Daily Goal</Text>
          </View>
          <View style={s.chipRow}>
            {[6, 8, 10, 12].map((n) => (
              <TouchableOpacity
                key={n}
                style={[s.chip, settings.dailyGoal === n && s.chipActive]}
                onPress={() => update("dailyGoal", n)}
              >
                <Text style={[s.chipText, settings.dailyGoal === n && s.chipTextActive]}>
                  {n}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Drink Amount ── */}
        <View style={s.chipRowContainer}>
          <View style={s.chipRowLabel}>
            <Ionicons name="resize" size={22} color={colors.primary} />
            <Text style={s.rowLabel}>Drink Size</Text>
          </View>
          <View style={s.chipRow}>
            {[100, 200, 250, 500].map((n) => (
              <TouchableOpacity
                key={n}
                style={[s.chip, settings.drinkAmount === n && s.chipActive]}
                onPress={() => update("drinkAmount", n)}
              >
                <Text style={[s.chipText, settings.drinkAmount === n && s.chipTextActive]}>
                  {n}ml
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Weight-Based Goal ── */}
        <View style={s.rowGroup}>
          <View style={s.rowGroupHeader}>
            <Ionicons name="scale" size={22} color={colors.primary} />
            <View>
              <Text style={s.rowLabel}>Weight-Based Goal</Text>
              <Text style={s.rowHint}>Auto-calculates daily goal</Text>
            </View>
          </View>
          <View style={s.weightRow}>
          <TextInput
            style={s.weightInput}
            placeholder="Weight"
            placeholderTextColor={colors.textTertiary}
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
            style={[s.weightUnitChip, settings.weightUnit === "kg" && s.unitActive]}
            onPress={() => update("weightUnit", "kg")}
          >
            <Text style={[s.unitText, settings.weightUnit === "kg" && s.unitTextActive]}>
              kg
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.weightUnitChip, settings.weightUnit === "lbs" && s.unitActive]}
            onPress={() => update("weightUnit", "lbs")}
          >
            <Text style={[s.unitText, settings.weightUnit === "lbs" && s.unitTextActive]}>
              lbs
            </Text>
          </TouchableOpacity>
          {settings.weightKg > 0 && (
            <Text style={s.weightResult}>
              → {weightBasedGoal(settings.weightKg)} glasses/day
            </Text>
          )}
        </View>
        </View>

        {/* ── Activity Adjustment ── */}
        <View style={s.row}>
          <View style={s.rowLeft}>
            <Ionicons name="fitness" size={22} color={colors.primary} />
            <View>
              <Text style={s.rowLabel}>Exercised Today</Text>
              <Text style={s.rowHint}>+750ml / +3 glasses boost</Text>
            </View>
          </View>
          <Switch
            value={settings.activityAdjustment || false}
            onValueChange={(v) => update("activityAdjustment", v)}
            trackColor={{ false: colors.switchTrackOff, true: colors.switchTrackOn }}
            thumbColor={settings.activityAdjustment ? colors.switchThumbOn : colors.switchThumbOff}
            accessibilityLabel={`Activity adjustment ${settings.activityAdjustment ? "on" : "off"}`}
          />
        </View>

        {/* ── Pattern Insights ── */}
        {patternPeaks.length > 0 && (
          <View style={s.sectionHeader}>
            <Ionicons name="analytics" size={18} color={colors.primary} />
            <Text style={s.sectionHeaderText}>Your Patterns</Text>
          </View>
        )}
        {patternPeaks.length > 0 && (
          <View style={s.row}>
            <View style={s.rowLeft}>
              <Ionicons name="trending-up" size={20} color={colors.success} />
              <View>
                <Text style={s.rowLabel}>Peak Time</Text>
                <Text style={s.rowHint}>
                  Most hydrated: {patternPeaks.map((p) => p.label).join(", ")}
                </Text>
              </View>
            </View>
          </View>
        )}
        {patternLulls.length > 0 && (
          <View style={s.row}>
            <View style={s.rowLeft}>
              <Ionicons name="trending-down" size={20} color={colors.error} />
              <View>
                <Text style={s.rowLabel}>Low Periods</Text>
                <Text style={s.rowHint}>
                  {patternLulls.filter(l => l.severity === "gap").map((l) => l.label).join(", ") || "Fewer logs in these times"}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* ── Weather Location ── */}
        <View style={s.sectionHeader}>
          <Ionicons name="location" size={18} color={colors.primary} />
          <Text style={s.sectionHeaderText}>Weather Location</Text>
        </View>
        <View style={s.row}>
          <TextInput
            style={[s.weightInput, { flex: 2 }]}
            placeholder="City or zip code"
            placeholderTextColor={colors.textTertiary}
            value={settings.manualLocation || ""}
            onChangeText={(t) => update("manualLocation", t)}
          />
          <TouchableOpacity
            style={s.weightUnitChip}
            onPress={() => {
              update("manualLocation", "");
              clearWeatherCache().catch(() => {});
            }}
          >
            <Text style={s.unitText}>Clear</Text>
          </TouchableOpacity>
        </View>

        {/* ── Data Export & Backup (dropdown accordion) ── */}
        <TouchableOpacity
          style={s.sectionHeaderDropdown}
          onPress={() => setExportExpanded((v) => !v)}
          activeOpacity={0.7}
        >
          <Ionicons name="download" size={18} color={colors.primary} />
          <Text style={s.sectionHeaderText}>Data Export & Backup</Text>
          <Ionicons
            name={exportExpanded ? "chevron-up" : "chevron-down"}
            size={18}
            color={colors.textMuted}
            style={{ marginLeft: "auto" }}
          />
        </TouchableOpacity>

        {exportExpanded && (
          <>
            <TouchableOpacity
              style={s.row}
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
              <View style={s.rowLeft}>
                <Ionicons name="grid-outline" size={22} color={colors.primary} />
                <View>
                  <Text style={s.rowLabel}>
                    {exporting === "csv" ? "Exporting..." : "Export CSV"}
                  </Text>
                  <Text style={s.rowHint}>Share logs as spreadsheet file</Text>
                </View>
              </View>
              <Ionicons name="share-outline" size={20} color={colors.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity
              style={s.row}
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
              <View style={s.rowLeft}>
                <Ionicons name="archive-outline" size={22} color={colors.primary} />
                <View>
                  <Text style={s.rowLabel}>
                    {exporting === "json" ? "Exporting..." : "Export JSON Backup"}
                  </Text>
                  <Text style={s.rowHint}>Full backup with settings & achievements</Text>
                </View>
              </View>
              <Ionicons name="share-outline" size={20} color={colors.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity
              style={s.row}
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
                  let msg = `Imported ${summary.logs} log entr${summary.logs === 1 ? "y" : "ies"}.\n`;
                  if (summary.hasSettings) msg += "Settings restored.\n";
                  if (summary.hasAchievements) msg += "Achievements restored.\n";
                  if (summary.warnings) msg += `\n⚠️ ${summary.warnings.join("\n")}`;
                  Alert.alert("Restored!", msg.trim(), [{ text: "Great!" }]);
                  await loadSettings();
                } catch (e) {
                  Alert.alert("Import Failed", e.message || "Could not read backup file");
                } finally {
                  setExporting(null);
                }
              }}
              disabled={exporting !== null}
            >
              <View style={s.rowLeft}>
                <Ionicons name="cloud-upload-outline" size={22} color={colors.primary} />
                <View>
                  <Text style={s.rowLabel}>
                    {exporting === "importing" ? "Importing..." : "Import JSON Backup"}
                  </Text>
                  <Text style={s.rowHint}>Restore from a previous backup</Text>
                </View>
              </View>
              <Ionicons name="enter-outline" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </>
        )}

        {/* ── Notification Messages (dropdown accordion) ── */}
        <TouchableOpacity
          style={s.sectionHeaderDropdown}
          onPress={() => setMessagesExpanded((v) => !v)}
          activeOpacity={0.7}
        >
          <Ionicons name="chatbubbles" size={18} color={colors.primary} />
          <Text style={s.sectionHeaderText}>Notification Messages</Text>
          <Ionicons
            name={messagesExpanded ? "chevron-up" : "chevron-down"}
            size={18}
            color={colors.textMuted}
            style={{ marginLeft: "auto" }}
          />
        </TouchableOpacity>

        {messagesExpanded && MESSAGE_CATEGORIES.map((cat) => (
          <View key={cat.key} style={s.row}>
            <View style={s.rowLeft}>
              <Ionicons name={cat.icon} size={22} color={colors.primary} />
              <View>
                <Text style={s.rowLabel}>{cat.label}</Text>
                <Text style={s.rowHint}>{cat.hint}</Text>
              </View>
            </View>
            <Switch
              value={(settings.messageCategories || {})[cat.key] !== false}
              onValueChange={(v) => {
                const updated = { ...(settings.messageCategories || {}) };
                updated[cat.key] = v;
                update("messageCategories", updated);
              }}
              trackColor={{ false: colors.switchTrackOff, true: colors.switchTrackOn }}
              thumbColor={(settings.messageCategories || {})[cat.key] !== false ? colors.switchThumbOn : colors.switchThumbOff}
            />
          </View>
        ))}

        {/* ── Mascot Style ── */}
        <View style={s.sectionHeader}>
          <Ionicons name="happy" size={18} color={colors.primary} />
          <Text style={s.sectionHeaderText}>Mascot Style</Text>
        </View>

        <View style={s.mascotRow}>
          {MASCOT_VARIANTS.map((v) => {
            const isUnlocked = !v.achievementId || unlockedAchievements.includes(v.achievementId);
            const isActive = (settings.mascotVariant || "classic") === v.id;
            return (
              <TouchableOpacity
                key={v.id}
                disabled={!isUnlocked}
                style={[
                  s.mascotCard,
                  isActive && s.mascotCardActive,
                  !isUnlocked && s.mascotCardLocked,
                ]}
                onPress={() => update("mascotVariant", v.id)}
              >
                <View style={s.mascotCardPreview}>
                  <Ionicons
                    name={v.id === "classic" ? "water" : v.id === "cool" ? "glasses" : v.id === "crown" ? "ribbon" : "sparkles"}
                    size={28}
                    color={isActive ? colors.primary : colors.textSection}
                  />
                </View>
                <Text style={[s.mascotCardLabel, !isUnlocked && s.mascotCardLabelLocked]}>
                  {v.label}
                </Text>
                {!isUnlocked && (
                  <Text style={s.mascotCardHint}>Unlock via achievements</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={s.separator} />

        <TouchableOpacity style={s.row} onPress={handleResetData}>
          <View style={s.rowLeft}>
            <Ionicons name="trash-outline" size={22} color={colors.error} />
            <Text style={[s.rowLabel, { color: colors.error }]}>
              Reset All Data
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={s.row} onPress={handleOpenPrivacyPolicy}>
          <View style={s.rowLeft}>
            <Ionicons name="shield-checkmark-outline" size={22} color={colors.textSecondary} />
            <View>
              <Text style={s.rowLabel}>Privacy Policy</Text>
              <Text style={s.rowHint}>How your data is handled</Text>
            </View>
          </View>
          <Ionicons name="open-outline" size={20} color={colors.textMuted} />
        </TouchableOpacity>

        <View style={s.footer}>
          <Text style={s.footerText}>Plenty v{Constants.expoConfig?.version || "1.0.0"}</Text>
          <Text style={s.footerText}>Built with React Native + Expo</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
      paddingTop: 60,
    },
    scroll: {
      paddingBottom: 40,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingHorizontal: 24,
      paddingBottom: 8,
    },
    title: {
      fontSize: 28,
      fontWeight: "700",
      color: colors.text,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors.surface,
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
      color: colors.text,
    },
    rowHint: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 2,
    },
    chipRowContainer: {
      backgroundColor: colors.surface,
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
      backgroundColor: colors.surfaceTertiary,
      borderWidth: 1,
      borderColor: colors.border,
    },
    chipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    chipText: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.textSection,
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
      color: colors.textSection,
      letterSpacing: 0.3,
      textTransform: "uppercase",
    },
    sectionHeaderDropdown: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginHorizontal: 24,
      marginTop: 24,
      marginBottom: 4,
      paddingVertical: 8,
    },
    catIcon: {
      fontSize: 22,
    },

    // ── Row Group (connected card, e.g. weight goal) ──
    rowGroup: {
      marginHorizontal: 24,
      marginTop: 12,
      borderRadius: 14,
      backgroundColor: colors.surface,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
      overflow: "hidden",
    },
    rowGroupHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 16,
      paddingHorizontal: 20,
    },

    // ── Theme Row (Sprint 5) ──
    themeRow: {
      flexDirection: "row",
      gap: 8,
    },
    themeChip: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 10,
      borderRadius: 12,
      backgroundColor: colors.surfaceTertiary,
      borderWidth: 1,
      borderColor: colors.border,
    },
    themeChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    themeChipText: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.textSection,
    },
    themeChipTextActive: {
      color: "#fff",
    },

    // ── Weight Goal ──
    weightRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: colors.surfaceSecondary,
      paddingVertical: 12,
      paddingHorizontal: 20,
    },
    weightInput: {
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 10,
      backgroundColor: colors.surfaceSecondary,
      fontSize: 15,
      fontWeight: "600",
      color: colors.text,
    },
    weightUnitChip: {
      paddingVertical: 6,
      paddingHorizontal: 14,
      borderRadius: 16,
      backgroundColor: colors.surfaceTertiary,
      borderWidth: 1,
      borderColor: colors.border,
    },
    unitActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    unitText: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.textSection,
    },
    unitTextActive: {
      color: "#fff",
    },
    weightResult: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.success,
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
      backgroundColor: colors.surface,
      borderRadius: 14,
      paddingVertical: 14,
      paddingHorizontal: 10,
      alignItems: "center",
      borderWidth: 2,
      borderColor: colors.borderLight,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    mascotCardActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primaryBg,
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
      color: colors.text,
    },
    mascotCardLabelLocked: {
      color: colors.textTertiary,
    },
    mascotCardHint: {
      fontSize: 9,
      color: colors.textTertiary,
      marginTop: 2,
      textAlign: "center",
    },
    separator: {
      height: 1,
      backgroundColor: colors.separator,
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
      color: colors.textTertiary,
      marginTop: 2,
    },
  });
}
