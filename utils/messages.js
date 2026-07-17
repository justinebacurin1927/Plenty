/**
 * Plenty notification message pool.
 *
 * Categories:
 *   encouraging – motivational, keeps you going
 *   funny       – lighthearted, playful
 *   urgent      – direct, no-nonsense
 *   fact        – science/health trivia
 *   morning     – time-appropriate for AM (5-11)
 *   evening     – time-appropriate for PM (18-22)
 */

const MESSAGES = [
  // ── Morning ──
  { id: "m1",  text: "Good morning! Your body lost water overnight -- time to replenish.", categories: ["morning", "encouraging"] },
  { id: "m2",  text: "Rise and shine! Start your day with a glass of water.", categories: ["morning", "encouraging"] },
  { id: "m3",  text: "Before coffee, try water. Your brain will thank you.", categories: ["morning", "fact"] },

  // ── Encouraging ──
  { id: "e1",  text: "Keep the streak alive!", categories: ["encouraging"] },
  { id: "e2",  text: "{X} glasses to go -- you've got this!", categories: ["encouraging"] },
  { id: "e3",  text: "Keep flowing! Your body loves water.", categories: ["encouraging"] },
  { id: "e4",  text: "Stay hydrated, stay strong!", categories: ["encouraging"] },
  { id: "e5",  text: "You're doing great! Keep drinking.", categories: ["encouraging"] },
  { id: "e6",  text: "One glass at a time. You're on a roll!", categories: ["encouraging"] },
  { id: "e7",  text: "Every glass counts toward your goal!", categories: ["encouraging"] },

  // ── Funny ──
  { id: "f1",  text: "Water you waiting for? Drink up!", categories: ["funny"] },
  { id: "f2",  text: "Glug glug glug -- you know you want to.", categories: ["funny"] },
  { id: "f3",  text: "I'm all wet. Now it's your turn.", categories: ["funny"] },
  { id: "f4",  text: "Thirsty? Same. Let's drink together.", categories: ["funny"] },
  { id: "f5",  text: "H2-Oh yeah! Time for water.", categories: ["funny"] },
  { id: "f6",  text: "A fish needs water. You are not a fish, but still.", categories: ["funny"] },
  { id: "f7",  text: "Don't be a raisin -- stay hydrated!", categories: ["funny"] },

  // ── Urgent ──
  { id: "u1",  text: "It's been a while! Drink some water right now.", categories: ["urgent"] },
  { id: "u2",  text: "Hydration check! Don't skip this one.", categories: ["urgent"] },
  { id: "u3",  text: "Hey! Yes, you! Drink water please!", categories: ["urgent"] },

  // ── Fact ──
  { id: "t1",  text: "Your brain is 73% water -- feed it.", categories: ["fact"] },
  { id: "t2",  text: "Even 1% dehydration can affect your focus.", categories: ["fact"] },
  { id: "t3",  text: "Water helps your heart pump blood more easily.", categories: ["fact"] },
  { id: "t4",  text: "Feeling tired? Dehydration is a common cause of fatigue.", categories: ["fact"] },
  { id: "t5",  text: "Water keeps your skin healthy and glowing.", categories: ["fact"] },
  { id: "t6",  text: "Proper hydration helps prevent muscle cramps.", categories: ["fact"] },

  // ── Evening ──
  { id: "n1",  text: "Don't forget to hydrate before bed. Your body repairs overnight.", categories: ["evening", "fact"] },
  { id: "n2",  text: "Winding down? Grab one last glass of water.", categories: ["evening", "encouraging"] },
  { id: "n3",  text: "You made it through the day! Finish strong with some water.", categories: ["evening", "encouraging"] },

  // ── Goal Proximity (dynamically selected) ──
  { id: "gp1", text: "Almost at your daily goal! Just {X} to go.", categories: ["goal-proximity"] },
  { id: "gp2", text: "You're so close! Don't stop now.", categories: ["goal-proximity"] },
  { id: "gp3", text: "Final stretch! You've got {X} glass left.", categories: ["goal-proximity"] },
  { id: "gp4", text: "Goal reached! You crushed it today!", categories: ["goal-proximity"] },
  { id: "gp5", text: "Overachiever! Doubled your goal! Champ!", categories: ["goal-proximity"] },

  // ── Streak (tier-aware, dynamically selected) ──
  // These use {streak} placeholder replaced at runtime.

  // short (3-6 days)
  { id: "ss1", text: "Don't break your {streak}-day streak! 🏆", categories: ["streak", "streak-short"] },
  { id: "ss2", text: "You're on a {streak}-day streak — keep it going!", categories: ["streak", "streak-short"] },
  { id: "ss3", text: "{streak} days strong — don't break your streak!", categories: ["streak", "streak-short"] },
  { id: "ss4", text: "Protect your {streak}-day streak — time to hydrate!", categories: ["streak", "streak-short"] },

  // established (7-29 days)
  { id: "se1", text: "You're on a {streak}-day streak — that's commitment!", categories: ["streak", "streak-established"] },
  { id: "se2", text: "{streak}-day streak and counting! Don't stop now!", categories: ["streak", "streak-established"] },
  { id: "se3", text: "Your {streak}-day streak is impressive — keep flowing!", categories: ["streak", "streak-established"] },
  { id: "se4", text: "Look at you — {streak}-day streak of staying hydrated! 🎉", categories: ["streak", "streak-established"] },

  // long (30+ days)
  { id: "sl1", text: "🔥 {streak}-day streak! You're unstoppable!", categories: ["streak", "streak-long"] },
  { id: "sl2", text: "{streak}-day streak of hydration mastery! You're a legend!", categories: ["streak", "streak-long"] },
  { id: "sl3", text: "Incredible — {streak}-day streak! Your body thanks you!", categories: ["streak", "streak-long"] },
];

export default MESSAGES;

// ─── Picker ───────────────────────────────────────────

/**
 * Determine the streak tier key from streak length.
 */
function streakTierKey(streak) {
  if (streak >= 30) return "streak-long";
  if (streak >= 7) return "streak-established";
  if (streak >= 3) return "streak-short";
  return null;
}

/**
 * Pick a notification message based on context.
 *
 * @param {object} options
 * @param {number}  options.hour          – current hour (0-23), for time-aware selection
 * @param {number}  options.goalProgress  – 0-100, how close to daily goal
 * @param {number}  options.goalGlassesLeft – how many glasses to go
 * @param {number}  options.streak        – current streak length (0 if none)
 * @param {string[]} options.enabledCategories – categories the user has enabled
 * @param {string}  options.lastMessageId – the last message shown (never repeat)
 * @returns {{ id: string, text: string, categories: string[] }}
 */
export function pickMessage({
  hour = new Date().getHours(),
  goalProgress = -1,
  goalGlassesLeft = -1,
  streak = 0,
  enabledCategories = ["encouraging", "funny", "fact", "morning", "evening"],
  lastMessageId = null,
} = {}) {
  // Build candidate pool
  let candidates = [];

  // Goal-proximity messages — high priority if applicable
  if (goalProgress >= 80 && goalProgress < 100) {
    const gpMsgs = MESSAGES.filter(
      (m) => m.categories.includes("goal-proximity") && !m.text.includes("Goal reached") && !m.text.includes("Overachiever")
    );
    candidates.push(...gpMsgs.map((m) => ({
      ...m,
      text: m.text.replace("{X}", String(Math.max(goalGlassesLeft, 1))),
    })));
  } else if (goalProgress >= 100 && goalProgress < 200) {
    // Goal reached
    const reached = MESSAGES.filter((m) => m.id === "gp4");
    candidates.push(...reached);
  } else if (goalProgress >= 200) {
    // Doubled!
    const doubled = MESSAGES.filter((m) => m.id === "gp5");
    candidates.push(...doubled);
  }

  // Time-skew: if morning/evening, add some time-appropriate messages
  if (hour >= 5 && hour < 12) {
    const morning = MESSAGES.filter((m) => m.categories.includes("morning") && enabledCategories.includes("morning"));
    candidates.push(...morning);
  } else if (hour >= 18 || hour < 5) {
    const evening = MESSAGES.filter((m) => m.categories.includes("evening") && enabledCategories.includes("evening"));
    candidates.push(...evening);
  }

  // If not in goal-proximity territory, check for streak-awareness
  if (goalProgress < 80 && streak >= 3) {
    const tier = streakTierKey(streak);
    if (tier) {
      const streakMsgs = MESSAGES
        .filter((m) => m.categories.includes(tier))
        .map((m) => ({
          ...m,
          text: m.text.replace("{streak}", String(streak)),
        }));
      if (streakMsgs.length > 0) {
        // Keep any time-skewed messages, replace regular with streak tier
        const timeSkewed = candidates.filter((m) =>
          m.categories.includes("morning") || m.categories.includes("evening")
        );
        candidates = [...timeSkewed, ...streakMsgs];
      }
    }
  } else if (goalProgress < 80) {
    // No streak or low streak — fill with regular messages from enabled categories
    const regular = MESSAGES.filter(
      (m) =>
        !m.categories.includes("goal-proximity") &&
        !m.categories.includes("morning") &&
        !m.categories.includes("evening") &&
        !m.categories.includes("streak") &&
        m.categories.some((c) => enabledCategories.includes(c))
    );
    candidates.push(...regular);
  }

  // Remove last message if possible
  if (lastMessageId && candidates.length > 1) {
    candidates = candidates.filter((m) => m.id !== lastMessageId);
    // If removing the last leaves us empty (shouldn't happen), restore it
    if (candidates.length === 0) {
      // Put back one from the regular pool
      const lastMsg = MESSAGES.find((m) => m.id === lastMessageId);
      if (lastMsg && lastMsg.categories.some((c) => enabledCategories.includes(c))) {
        // Actually just pick one from the original pool
        candidates = MESSAGES.filter((m) =>
          m.categories.some((c) => enabledCategories.includes(c))
        );
      }
    }
  }

  // If goal-proximity messages are present, prefer them (dominant priority)
  const hasGoalProximity = candidates.some((m) =>
    m.categories.includes("goal-proximity")
  );
  if (hasGoalProximity) {
    candidates = candidates.filter((m) => m.categories.includes("goal-proximity"));
  }

  // Random pick — fallback if all categories disabled
  if (candidates.length === 0) {
    return { id: "fallback", text: "Time to drink water!", categories: ["encouraging"] };
  }
  const pick = candidates[Math.floor(Math.random() * candidates.length)];

  // Replace {X} in regular messages too
  if (goalGlassesLeft >= 0) {
    return {
      ...pick,
      text: pick.text.replace("{X}", String(goalGlassesLeft)),
    };
  }

  return pick;
}

/**
 * Return a celebration notification for milestone streak boundaries.
 * Returns null if the streak is not a celebration milestone.
 *
 * @param {number} streak – current streak length
 * @returns {{ type: string, text: string, categories: string[] } | null}
 */
export function pickMilestoneMessage(streak) {
  if (streak === 7) {
    return { type: "milestone", text: "🎉 7-day streak! You're crushing it!", categories: ["milestone"] };
  }
  if (streak === 30) {
    return { type: "milestone", text: "🔥 30-day streak! You're an absolute legend!", categories: ["milestone"] };
  }
  return null;
}

/**
 * Get all unique category names from the message pool.
 */
export function getAvailableCategories() {
  const set = new Set();
  MESSAGES.forEach((m) => m.categories.forEach((c) => set.add(c)));
  return Array.from(set).filter((c) => c !== "goal-proximity" && !c.startsWith("streak")); // not user-togglable
}

/**
 * Default enabled categories for new users.
 */
export const DEFAULT_ENABLED_CATEGORIES = {
  encouraging: true,
  funny: true,
  urgent: true,
  fact: true,
  morning: true,
  evening: true,
};
