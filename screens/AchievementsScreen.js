import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import Mascot, { getRandomMessage } from "../components/Mascot";
import { getLogs, getSettings, getUnlockedAchievements, getAchievementProgress } from "../utils/storage";
import { buildGalleryList } from "../utils/achievements";
import { useTheme } from "../context/ThemeContext";
import { ShareCardForwardRef } from "../components/ShareCard";
import { captureAndShare } from "../utils/share";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = (SCREEN_WIDTH - 24 * 3) / 2;

export default function AchievementsScreen() {
  const { colors } = useTheme();
  const s = makeStyles(colors);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mascotExpression, setMascotExpression] = useState("happy");
  const [mascotMessage, setMascotMessage] = useState(null);
  const [mascotVariant, setMascotVariant] = useState("classic");
  const [sharingItem, setSharingItem] = useState(null);
  const achievementCardRef = useRef(null);
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
    <TouchableOpacity
      style={[s.card, item.unlocked && s.cardUnlocked]}
      activeOpacity={item.unlocked ? 0.7 : 1}
      onPress={async () => {
        if (!item.unlocked) return;
        setSharingItem(item);
        // Wait for the ShareCard to render with the new data, then capture
        setTimeout(async () => {
          await captureAndShare(achievementCardRef, `I unlocked ${item.title} on Plenty!`);
          setSharingItem(null);
        }, 100);
      }}
    >
      <Text style={[s.cardEmoji, !item.unlocked && s.cardEmojiLocked]}>
        {item.emoji}
      </Text>
      <Text style={[s.cardTitle, !item.unlocked && s.cardTitleLocked]} numberOfLines={1}>
        {item.title}
      </Text>
      <Text style={s.cardDesc} numberOfLines={2}>
        {item.description}
      </Text>

      {item.unlocked ? (
        <View style={s.unlockedBadge}>
          <Ionicons name="checkmark-circle" size={14} color={colors.success} />
          <Text style={s.unlockedText}>Unlocked</Text>
          <Ionicons name="share-outline" size={12} color={colors.success} style={{ marginLeft: 4 }} />
        </View>
      ) : (
        <View style={s.progressSection}>
          <View style={s.progressBarBg}>
            <View style={[s.progressBarFill, { width: `${item.percent}%` }]} />
          </View>
          <Text style={s.progressText}>
            {item.progress} / {item.max}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading && items.length === 0) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.loading}>
          <Text style={s.loadingText}>Loading achievements...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Mascot size={70} expression={mascotExpression} variant={mascotVariant} onPress={cycleExpression} message={mascotMessage} />
        <View style={s.headerText}>
          <Text style={s.title}>Achievements</Text>
          <Text style={s.subtitle}>
            {unlockedCount} / {items.length} unlocked
          </Text>
        </View>
      </View>

      {items.length === 0 ? (
        <View style={s.empty}>
          <Ionicons name="trophy" size={60} color={colors.textTertiary} />
          <Text style={s.emptyText}>No achievements yet</Text>
          <Text style={s.emptyHint}>Keep drinking water to earn your first badge!</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={s.row}
          contentContainerStyle={s.grid}
          renderItem={renderCard}
          showsVerticalScrollIndicator={false}
        />
      )}
      {/* Hidden share card for achievements */}
      <ShareCardForwardRef
        ref={achievementCardRef}
        mode="achievement"
        data={{
          emoji: sharingItem?.emoji || "",
          title: sharingItem?.title || "",
          description: sharingItem?.description || "",
        }}
      />
    </SafeAreaView>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
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
      color: colors.text,
    },
    subtitle: {
      fontSize: 15,
      color: colors.textSecondary,
      marginTop: 2,
    },
    loading: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    loadingText: {
      fontSize: 15,
      color: colors.textSecondary,
    },
    grid: {
      paddingHorizontal: 24,
      paddingBottom: 24,
    },
    row: {
      gap: 12,
      marginBottom: 12,
    },
    card: {
      width: CARD_WIDTH,
      backgroundColor: colors.surface,
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
      borderColor: colors.mascotMoodBorder,
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
      color: colors.text,
      textAlign: "center",
    },
    cardTitleLocked: {
      color: colors.textSecondary,
    },
    cardDesc: {
      fontSize: 11,
      color: colors.textSecondary,
      textAlign: "center",
      marginTop: 4,
      lineHeight: 15,
    },
    unlockedBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginTop: 12,
      backgroundColor: colors.successLight,
      paddingVertical: 4,
      paddingHorizontal: 10,
      borderRadius: 12,
    },
    unlockedText: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.success,
    },
    progressSection: {
      width: "100%",
      marginTop: 12,
      alignItems: "center",
    },
    progressBarBg: {
      width: "100%",
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.primaryBg,
      overflow: "hidden",
    },
    progressBarFill: {
      height: "100%",
      borderRadius: 3,
      backgroundColor: colors.primary,
    },
    progressText: {
      fontSize: 11,
      fontWeight: "600",
      color: colors.textSecondary,
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
      color: colors.textSecondary,
    },
    emptyHint: {
      fontSize: 14,
      color: colors.textTertiary,
      marginTop: 4,
      textAlign: "center",
      paddingHorizontal: 40,
    },
  });
}
