/**
 * Plenty Streak Rewards — milestone definitions
 *
 * Each milestone becomes unlockable when the user's longest streak
 * reaches the threshold. Rewards are persisted via milestonesReached
 * in the streak cache.
 */

const REWARDS = [
  {
    id: "dedicated_droplet",
    tier: 7,
    title: "Dedicated Droplet",
    emoji: "💧",
    description: "7-day streak — you're building a habit!",
    reward: "Badge unlocked",
    permanent: false,
  },
  {
    id: "water_color",
    tier: 30,
    title: "Water Colorist",
    emoji: "🎨",
    description: "30-day streak — unlock a custom water color theme!",
    reward: "Custom water color",
    permanent: false,
  },
  {
    id: "mascot_outfit",
    tier: 60,
    title: "Mascot Stylist",
    emoji: "👗",
    description: "60-day streak — your mascot gets a new outfit!",
    reward: "Mascot outfit unlock",
    permanent: false,
  },
  {
    id: "gold_wave",
    tier: 100,
    title: "Gold Wave",
    emoji: "🌊",
    description: "100-day streak — golden water animation unlocked!",
    reward: "Gold water wave",
    permanent: false,
  },
  {
    id: "century_club",
    tier: 365,
    title: "Century Club",
    emoji: "🔥",
    description: "365-day streak — you're a hydration legend!",
    reward: "Permanent flame icon",
    permanent: true, // never lost even if streak breaks
  },
];

export default REWARDS;

/**
 * Given the user's longest streak and currently-reached milestones,
 * return which milestones are newly unlocked (if any).
 */
export function checkNewMilestones(longestStreak, currentMilestones) {
  const newlyUnlocked = [];
  for (const r of REWARDS) {
    if (!currentMilestones.includes(r.id) && longestStreak >= r.tier) {
      newlyUnlocked.push(r);
    }
  }
  return newlyUnlocked;
}
