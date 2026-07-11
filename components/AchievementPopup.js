import React, { useEffect, useRef, useState } from "react";
import { View, Text, Modal, TouchableOpacity, Animated, StyleSheet, Dimensions } from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const CONFETTI_COLORS = ["#4A90D9", "#E67E22", "#27AE60", "#E8596E", "#F1C40F", "#9B59B6"];

/**
 * Achievement popup with confetti animation.
 *
 * Props:
 *   achievements — array of Achievement objects (from checkAchievements)
 *   visible     — boolean
 *   onDismiss   — () => void — called when user dismisses or queue empties
 */
export default function AchievementPopup({ achievements, visible, onDismiss }) {
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const confettiRefs = useRef(
    Array.from({ length: 8 }, () => ({
      translateY: new Animated.Value(0),
      translateX: new Animated.Value(0),
      opacity: new Animated.Value(1),
      scale: new Animated.Value(1),
    }))
  ).current;

  // Sync achievements prop into internal queue
  useEffect(() => {
    if (achievements && achievements.length > 0) {
      setQueue(achievements);
      setCurrentIndex(0);
    } else {
      setQueue([]);
    }
  }, [achievements]);

  // Animate in/out when visibility or index changes
  useEffect(() => {
    if (visible && queue.length > 0) {
      animateIn();
    } else {
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
    }
  }, [visible, currentIndex, queue.length]);

  function animateIn() {
    scaleAnim.setValue(0);
    fadeAnim.setValue(0);
    confettiRefs.forEach((c) => {
      c.translateY.setValue(0);
      c.translateX.setValue(0);
      c.opacity.setValue(1);
      c.scale.setValue(1);
    });

    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 100,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Confetti burst
    confettiRefs.forEach((c, i) => {
      const angle = (i / confettiRefs.length) * Math.PI * 2;
      const dist = 60 + Math.random() * 80;
      Animated.parallel([
        Animated.timing(c.translateY, {
          toValue: Math.sin(angle) * dist - 80,
          duration: 700,
          delay: i * 40,
          useNativeDriver: true,
        }),
        Animated.timing(c.translateX, {
          toValue: Math.cos(angle) * dist,
          duration: 700,
          delay: i * 40,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(400),
          Animated.timing(c.opacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.delay(200),
          Animated.timing(c.scale, {
            toValue: 0.3,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    });

    // Auto-dismiss after 4 seconds
    setTimeout(() => {
      handleDismiss();
    }, 4000);
  }

  function handleDismiss() {
    if (currentIndex < queue.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      setQueue([]);
      setCurrentIndex(0);
      onDismiss && onDismiss();
    }
  }

  if (!visible || queue.length === 0) return null;

  const achievement = queue[currentIndex];

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={handleDismiss}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={handleDismiss}>
        <Animated.View
          style={[
            styles.card,
            { transform: [{ scale: scaleAnim }], opacity: fadeAnim },
          ]}
        >
          {/* Confetti dots */}
          <View style={styles.confettiLayer} pointerEvents="none">
            {confettiRefs.map((c, i) => (
              <Animated.View
                key={i}
                style={[
                  styles.confettiDot,
                  {
                    backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
                    transform: [
                      { translateY: c.translateY },
                      { translateX: c.translateX },
                      { scale: c.scale },
                    ],
                    opacity: c.opacity,
                  },
                ]}
              />
            ))}
          </View>

          {/* Trophy */}
          <Text style={styles.trophy}>🏆</Text>

          {/* Achievement emoji + title */}
          <Text style={styles.emoji}>{achievement.emoji}</Text>
          <Text style={styles.title}>{achievement.title}</Text>
          <Text style={styles.description}>{achievement.description}</Text>

          {/* Dismiss button */}
          <TouchableOpacity style={styles.button} onPress={handleDismiss}>
            <Text style={styles.buttonText}>
              {currentIndex < queue.length - 1 ? "Next →" : "Awesome!"}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 28,
    paddingVertical: 36,
    paddingHorizontal: 32,
    alignItems: "center",
    width: SCREEN_WIDTH * 0.8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
  confettiLayer: {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: 0,
    height: 0,
    zIndex: 0,
  },
  confettiDot: {
    position: "absolute",
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: -5,
    marginTop: -5,
  },
  trophy: {
    fontSize: 40,
    marginBottom: 8,
  },
  emoji: {
    fontSize: 56,
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1A3A5C",
    textAlign: "center",
  },
  description: {
    fontSize: 15,
    color: "#6B8CAB",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 22,
  },
  button: {
    marginTop: 28,
    backgroundColor: "#4A90D9",
    paddingVertical: 12,
    paddingHorizontal: 36,
    borderRadius: 24,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
