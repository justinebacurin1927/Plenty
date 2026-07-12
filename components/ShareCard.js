import React, { useRef, useCallback } from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import ViewShot from "react-native-view-shot";

/**
 * Renders a shareable card that can be captured as an image.
 *
 * Mode: "streak" — weekly streak + stats
 * Mode: "achievement" — achievement unlock card
 */
export default function ShareCard({ mode, data, style }) {
  const viewRef = useRef(null);

  const capture = useCallback(async () => {
    if (!viewRef.current) return null;
    try {
      const uri = await viewRef.current.capture();
      return uri;
    } catch {
      return null;
    }
  }, []);

  const cardContent =
    mode === "achievement" ? (
      <AchievementContent data={data} />
    ) : (
      <StreakContent data={data} />
    );

  return (
    <ViewShot
      ref={viewRef}
      options={{ format: "png", quality: 1, result: "tmpfile" }}
      style={[styles.hiddenShot, style]}
    >
      {cardContent}
    </ViewShot>
  );
}

/* ─── Expose capture method via forwardRef ─── */
export const ShareCardForwardRef = React.forwardRef(
  ({ mode, data, style }, ref) => {
    const innerRef = useRef(null);

    // Attach capture to the forwarded ref
    React.useImperativeHandle(ref, () => ({
      capture: async () => {
        if (!innerRef.current) return null;
        try {
          return await innerRef.current.capture();
        } catch {
          return null;
        }
      },
    }));

    return (
      <ViewShot
        ref={innerRef}
        options={{ format: "png", quality: 1, result: "tmpfile" }}
        style={[styles.hiddenShot, style]}
      >
        {mode === "achievement" ? (
          <AchievementContent data={data} />
        ) : (
          <StreakContent data={data} />
        )}
      </ViewShot>
    );
  }
);

/* ─── Streak Card ─── */
function StreakContent({ data }) {
  const { streak = 0, weekGlasses = 0, bestDay = 0, bestDayLabel = "" } =
    data || {};
  return (
    <View style={styles.card}>
      <Text style={styles.appName}>PLENTY</Text>
      <View style={styles.divider} />
      <Text style={styles.streakNumber}>{streak}</Text>
      <Text style={styles.streakLabel}>DAY{streak !== 1 ? "S" : ""}</Text>
      <Text style={styles.tagline}>
        {streak > 0
          ? `"Keep the streak alive!"`
          : `"Start your hydration journey!"`}
      </Text>
      <View style={styles.divider} />
      <Text style={styles.statText}>This week: {weekGlasses} glasses</Text>
      {bestDay > 0 && (
        <Text style={styles.statText}>
          Best day: {bestDayLabel} ({bestDay})
        </Text>
      )}
      <View style={styles.divider} />
      <Text style={styles.footer}>Get Plenty → plenty.app</Text>
    </View>
  );
}

/* ─── Achievement Card ─── */
function AchievementContent({ data }) {
  const { title = "", description = "", emoji = "" } = data || {};
  return (
    <View style={styles.card}>
      <Text style={styles.appName}>PLENTY</Text>
      <View style={styles.divider} />
      <Text style={styles.achievementEmoji}>{emoji}</Text>
      <Text style={styles.achievementTitle}>{title}</Text>
      <Text style={styles.achievementDesc}>{description}</Text>
      <View style={styles.divider} />
      <Text style={styles.footer}>Get Plenty → plenty.app</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hiddenShot: {
    position: "absolute",
    left: -9999,
    top: -9999,
  },
  card: {
    width: 340,
    backgroundColor: "#0D1B2A",
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
  },
  appName: {
    fontSize: 18,
    fontWeight: "800",
    color: "#6BB5FF",
    letterSpacing: 2,
  },
  divider: {
    width: "100%",
    height: 1,
    backgroundColor: "rgba(107, 181, 255, 0.3)",
    marginVertical: 14,
  },
  streakNumber: {
    fontSize: 64,
    fontWeight: "900",
    color: "#FFFFFF",
    lineHeight: 72,
  },
  streakLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#6BB5FF",
    letterSpacing: 3,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 14,
    color: "#B0C4E0",
    fontStyle: "italic",
    marginBottom: 4,
  },
  statText: {
    fontSize: 15,
    color: "#E0EAFF",
    fontWeight: "500",
    marginBottom: 4,
  },
  achievementEmoji: {
    fontSize: 64,
    marginBottom: 8,
  },
  achievementTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 6,
  },
  achievementDesc: {
    fontSize: 14,
    color: "#B0C4E0",
    textAlign: "center",
    lineHeight: 20,
  },
  footer: {
    fontSize: 12,
    color: "rgba(107, 181, 255, 0.6)",
    fontWeight: "600",
  },
});
