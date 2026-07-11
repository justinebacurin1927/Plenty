import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Dimensions,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import Mascot, { getRandomMessage } from "../components/Mascot";
import { getLogs, getSettings, getUnlockedAchievements, getAchievementProgress } from "../utils/storage";
import { buildGalleryList } from "../utils/achievements";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = (SCREEN_WIDTH - 24 * 3) / 2; // 24 padding both sides + 12 gap

export default function AchievementsScreen() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mascotExpression, setMascotExpression] = useState("happy");
  const [mascotMessage, setMascotMessage] = useState(null);
  const [mascotVariant, setMascotVariant] = useState("classic");
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
          setLoading(true);
          const [logs, settings, unlocked, progress] = await Promise.all([
            getLogs(),
            getSettings(),
            getUnlockedAchievements(),
            getAchievementProgress(),
          ]);
          const list = buildGalleryList(logs, settings, unlocked, progress);
          // Sort: unlocked first, then by progress descending
          list.sort((a, b) => {
            if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1;
            return b.percent - a.percent;
          });
          setMascotVariant(settings.mascotVariant || "classic");
          setItems(list);
        } catch (e) {
          console.error("Failed to load achievements:", e.message, e.stack);
        } finally {
          setLoading(false);
        }
      })();
    }, [])
  );

  const unlockedCount = items.filter((i) => i.unlocked).length;

  const renderCard = ({ item }) => (
    <View style={[styles.card, item.unlocked && styles.cardUnlocked]}>
      <Text style={[styles.cardEmoji, !item.unlocked && styles.cardEmojiLocked]}>
        {item.emoji}
      </Text>
      <Text style={[styles.cardTitle, !item.unlocked && styles.cardTitleLocked]} numberOfLines={1}>
        {item.title}
      </Text>
      <Text style={styles.cardDesc} numberOfLines={2}>
        {item.description}
      </Text>

      {item.unlocked ? (
        <View style={styles.unlockedBadge}>
          <Ionicons name="checkmark-circle" size={14} color="#27AE60" />
          <Text style={styles.unlockedText}>Unlocked</Text>
        </View>
      ) : (
        <View style={styles.progressSection}>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${item.percent}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {item.progress} / {item.max}
          </Text>
        </View>
      )}
    </View>
  );

  if (loading && items.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Loading achievements...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Mascot size={70} expression={mascotExpression} variant={mascotVariant} onPress={cycleExpression} message={mascotMessage} />
        <View style={styles.headerText}>
          <Text style={styles.title}>Achievements</Text>
          <Text style={styles.subtitle}>
            {unlockedCount} / {items.length} unlocked
          </Text>
        </View>
      </View>

      {items.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🏆</Text>
          <Text style={styles.emptyText}>No achievements yet</Text>
          <Text style={styles.emptyHint}>Keep drinking water to earn your first badge!</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.grid}
          renderItem={renderCard}
          showsVerticalScrollIndicator={false}
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
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1A3A5C",
  },
  subtitle: {
    fontSize: 15,
    color: "#6B8CAB",
    marginTop: 2,
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontSize: 15,
    color: "#6B8CAB",
  },

  // ── Grid ──
  grid: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  row: {
    gap: 12,
    marginBottom: 12,
  },

  // ── Card ──
  card: {
    width: CARD_WIDTH,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardUnlocked: {
    borderWidth: 1.5,
    borderColor: "#A0D8B0",
  },
  cardEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  cardEmojiLocked: {
    opacity: 0.35,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1A3A5C",
    textAlign: "center",
  },
  cardTitleLocked: {
    color: "#6B8CAB",
  },
  cardDesc: {
    fontSize: 11,
    color: "#6B8CAB",
    textAlign: "center",
    marginTop: 4,
    lineHeight: 15,
  },

  // ── Unlocked badge ──
  unlockedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 12,
    backgroundColor: "#E8F8EE",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  unlockedText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#27AE60",
  },

  // ── Progress ──
  progressSection: {
    width: "100%",
    marginTop: 12,
    alignItems: "center",
  },
  progressBarBg: {
    width: "100%",
    height: 6,
    borderRadius: 3,
    backgroundColor: "#E8F0FE",
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: "#4A90D9",
  },
  progressText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6B8CAB",
    marginTop: 4,
  },

  // ── Empty ──
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 60,
  },
  emptyEmoji: {
    fontSize: 60,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#6B8CAB",
  },
  emptyHint: {
    fontSize: 14,
    color: "#A0B8D0",
    marginTop: 4,
    textAlign: "center",
    paddingHorizontal: 40,
  },
});
