import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  TextInput,
  Dimensions,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import {
  setOnboarded,
  saveSettings,
  weightBasedGoal,
  lbsToKg,
} from "../utils/storage";
import { requestPermission } from "../utils/notifications";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const INTERVAL_OPTIONS = [
  { label: "30 min", value: 30 },
  { label: "1 hour", value: 60 },
  { label: "2 hours", value: 120 },
];

export default function OnboardingScreen({ onComplete }) {
  const { colors, isDark } = useTheme();
  const flatListRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(0);

  // Screen 2 state
  const [weight, setWeight] = useState("");
  const [weightUnit, setWeightUnit] = useState("kg");
  const [customGoal, setCustomGoal] = useState("");
  const [exercised, setExercised] = useState(false);

  // Screen 3 state
  const [intervalMinutes, setIntervalMinutes] = useState(30);

  const weightNum = parseFloat(weight);
  const weightKg = weightUnit === "kg" ? weightNum : lbsToKg(weightNum);
  const recommendedGoal = weightBasedGoal(weightKg);
  const effectiveGoal = customGoal
    ? Math.round(parseInt(customGoal, 10) / 250)
    : (recommendedGoal || 8);
  const goalWithActivity = exercised ? effectiveGoal + 3 : effectiveGoal;

  const handleSkip = () => {
    flatListRef.current?.scrollToEnd({ animated: true });
  };

  const handleGetStarted = async () => {
    // Save all settings
    await saveSettings({
      dailyGoal: goalWithActivity,
      intervalMinutes,
      remindersActive: true,
      weightKg: isNaN(weightKg) ? null : Math.round(weightKg),
      weightUnit,
      activityAdjustment: exercised,
    });

    // Request permission — gracefully handle denial
    await requestPermission();

    // Mark onboarded
    await setOnboarded(true);
    onComplete();
  };

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentPage(viewableItems[0].index ?? 0);
    }
  }).current;

  const pages = [
    // ─── Screen 1: Welcome ─────────────────────────────
    <View key="welcome" style={styles.page}>
      <View style={styles.pageContent}>
        <View style={[styles.iconCircle, { backgroundColor: colors.primaryBg }]}>
          <Ionicons name="water" size={64} color={colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>
          Welcome to Plenty
        </Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          Plenty helps you drink enough water every day.{"\n"}No fuss, no accounts.
        </Text>
      </View>
    </View>,

    // ─── Screen 2: Set Your Goal ───────────────────────
    <View key="goal" style={styles.page}>
      <View style={styles.pageContent}>
        <Text style={[styles.title, { color: colors.text }]}>Set Your Daily Goal</Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          Enter your weight and we'll recommend how much water to drink.
        </Text>

        {/* Weight input */}
        <View style={styles.weightRow}>
          <TextInput
            style={[
              styles.weightInput,
              { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface },
            ]}
            placeholder="Weight"
            placeholderTextColor={colors.textTertiary}
            keyboardType="numeric"
            value={weight}
            onChangeText={setWeight}
          />
          <TouchableOpacity
            style={[
              styles.unitToggle,
              { borderColor: colors.border, backgroundColor: colors.surface },
            ]}
            onPress={() => setWeightUnit(weightUnit === "kg" ? "lbs" : "kg")}
          >
            <Text style={[styles.unitText, { color: colors.text }]}>{weightUnit}</Text>
            <Ionicons name="swap-vertical" size={14} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>

        {/* Recommended goal */}
        {recommendedGoal !== null && (
          <View style={[styles.recommendBox, { backgroundColor: colors.primaryBg }]}>
            <Text style={[styles.recommendText, { color: colors.primary }]}>
              Recommended: {recommendedGoal * 250}ml ({recommendedGoal} glasses)
            </Text>
          </View>
        )}

        {/* Custom override */}
        <View style={styles.customRow}>
          <Text style={[styles.customLabel, { color: colors.textSecondary }]}>
            Custom goal (ml)
          </Text>
          <TextInput
            style={[
              styles.customInput,
              { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface },
            ]}
            placeholder={recommendedGoal ? String(recommendedGoal * 250) : "2000"}
            placeholderTextColor={colors.textTertiary}
            keyboardType="numeric"
            value={customGoal}
            onChangeText={setCustomGoal}
          />
        </View>

        {/* Activity toggle */}
        <TouchableOpacity
          style={[styles.activityToggle, { backgroundColor: exercised ? colors.primaryBg : colors.surface, borderColor: colors.border }]}
          onPress={() => setExercised(!exercised)}
        >
          <Ionicons
            name={exercised ? "checkmark-circle" : "ellipse-outline"}
            size={22}
            color={exercised ? colors.primary : colors.textTertiary}
          />
          <Text style={[styles.activityText, { color: colors.text }]}>
            I exercised today (+3 glasses)
          </Text>
        </TouchableOpacity>

        {/* Result */}
        {weight !== "" && (
          <Text style={[styles.goalResult, { color: colors.text }]}>
            Your goal: {goalWithActivity * 250}ml ({goalWithActivity} glasses)
          </Text>
        )}
      </View>
    </View>,

    // ─── Screen 3: Reminders ────────────────────────────
    <View key="reminders" style={styles.page}>
      <View style={styles.pageContent}>
        <Text style={[styles.title, { color: colors.text }]}>Stay on Track</Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          Plenty sends you gentle reminders to drink water throughout the day.
          We'll never spam you, and you can adjust or turn them off anytime.
        </Text>

        {/* Interval picker */}
        <Text style={[styles.intervalLabel, { color: colors.text }]}>
          Remind me every
        </Text>
        <View style={styles.intervalRow}>
          {INTERVAL_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.intervalBtn,
                {
                  backgroundColor:
                    intervalMinutes === opt.value
                      ? colors.primary
                      : colors.surface,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => setIntervalMinutes(opt.value)}
            >
              <Text
                style={[
                  styles.intervalBtnText,
                  {
                    color:
                      intervalMinutes === opt.value
                        ? colors.textInverse
                        : colors.text,
                  },
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Notification permission hint */}
        <View style={[styles.permissionHint, { backgroundColor: colors.surfaceSecondary }]}>
          <Ionicons
            name="notifications-outline"
            size={20}
            color={colors.primary}
            style={{ marginRight: 8 }}
          />
          <Text style={[styles.permissionHintText, { color: colors.textSecondary }]}>
            We'll ask for notification permission when you tap "Get Started".
            If you change your mind later, you can enable it in Settings.
          </Text>
        </View>
      </View>

      {/* Get Started */}
      <TouchableOpacity
        style={[styles.getStartedBtn, { backgroundColor: colors.primary }]}
        onPress={handleGetStarted}
      >
        <Text style={styles.getStartedText}>Get Started</Text>
      </TouchableOpacity>
    </View>,
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Skip */}
      {currentPage < 2 && (
        <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
          <Text style={[styles.skipText, { color: colors.primary }]}>Skip</Text>
        </TouchableOpacity>
      )}

      {/* Pages */}
      <FlatList
        ref={flatListRef}
        data={pages}
        renderItem={({ item }) => item}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        keyExtractor={(_, i) => String(i)}
      />

      {/* Dot indicators */}
      <View style={styles.dots}>
        {pages.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor:
                  i === currentPage ? colors.primary : colors.border,
                width: i === currentPage ? 24 : 8,
              },
            ]}
          />
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skipBtn: {
    position: "absolute",
    top: Platform.OS === "ios" ? 8 : 12,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  skipText: {
    fontSize: 16,
    fontWeight: "600",
  },

  // ─── Page ───
  page: {
    width: SCREEN_WIDTH,
    flex: 1,
    paddingHorizontal: 32,
  },
  pageContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  // ─── Icon ───
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },

  // ─── Typography ───
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
    paddingHorizontal: 8,
  },

  // ─── Screen 2: Weight ───
  weightRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    width: "100%",
    maxWidth: 280,
  },
  weightInput: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 18,
    fontWeight: "600",
    marginRight: 8,
  },
  unitToggle: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  unitText: {
    fontSize: 16,
    fontWeight: "600",
    marginRight: 4,
  },
  recommendBox: {
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  recommendText: {
    fontSize: 15,
    fontWeight: "600",
  },
  customRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    width: "100%",
    maxWidth: 280,
  },
  customLabel: {
    fontSize: 14,
    flex: 1,
  },
  customInput: {
    width: 100,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 15,
    textAlign: "right",
  },
  activityToggle: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 8,
    width: "100%",
    maxWidth: 280,
  },
  activityText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  goalResult: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 8,
  },

  // ─── Screen 3: Interval ───
  intervalLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  intervalRow: {
    flexDirection: "row",
    marginBottom: 20,
  },
  intervalBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    borderWidth: 1,
    marginRight: 8,
  },
  intervalBtnText: {
    fontSize: 15,
    fontWeight: "600",
  },
  permissionHint: {
    flexDirection: "row",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: "flex-start",
    marginBottom: 20,
    width: "100%",
    maxWidth: 320,
  },
  permissionHintText: {
    fontSize: 13,
    lineHeight: 19,
    flex: 1,
  },
  getStartedBtn: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginHorizontal: 32,
    marginBottom: 24,
  },
  getStartedText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },

  // ─── Dots ───
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    paddingBottom: Platform.OS === "ios" ? 8 : 16,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
});
