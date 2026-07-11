# Sprint 3 — Epic A: Achievements & Badges 🏆

> **Deep-dive breakdown** of the achievement system. Implementation-ready tasks with data models, edge cases, and per-file specs.

---

## Overview

All achievement logic lives in a single new file (`utils/achievements.js`) that exports:
1. A **definition list** — which achievements exist and how to detect them
2. A **checker function** `checkAchievements(logs, settings)` → `[newlyUnlocked]`
3. The rest is UI: a popup, a gallery screen, and notification integration

No external packages needed.

---

## Task A1 — Data Model & Storage

### What to build

Storage for two things:
- **Unlocked achievements** — flat list of string IDs
- **Progress counters** — key/value for achievements that track toward a threshold

### Storage Keys

```
@plenty_achievements: ["first_drop", "seven_day_streak"]    // unlocked IDs
@plenty_achievement_progress: { "century": 42, "early_bird": 3 }  // progress
```

### Functions to add to `utils/storage.js`

```js
// Achievements
export async function getUnlockedAchievements()    // → string[]
export async function unlockAchievement(id)       // adds to list, returns updated list
export async function getAchievementProgress()    // → { [id]: number }
export async function setAchievementProgress(id, val)  // sets a counter
export async function incrementAchievementProgress(id)  // +1
```

### Edge Cases
- `unlockAchievement` should be **idempotent** — calling twice doesn't duplicate
- On `clearLogs` + reset: achievements should **persist** (you earned them!), but progress resets
- Add a `resetAchievements()` for debug/testing (not exposed in UI)

### File Changes
| File | Action |
|------|--------|
| `utils/storage.js` | Add 6 new functions for achievements storage |

---

## Task A2 — Achievement Definitions

### What to build

A single array of achievement objects in a new file. Each definition has:
- `id` — unique string key
- `emoji` — display icon
- `title` — short name
- `description` — what you did to earn it
- `check(logs, settings, progress)` — function that returns `{ unlocked: true/false, progress: number, max: number }`

### File: `utils/achievements.js` (start)

```js
const ACHIEVEMENTS = [
  {
    id: "first_drop",
    emoji: "🌊",
    title: "First Drop",
    description: "Log your first glass of water",
    check: (logs) => ({
      unlocked: logs.length >= 1,
      progress: Math.min(logs.length, 1),
      max: 1,
    }),
  },
  // ... more below
];
```

### Full Achievement List (12)

| `id` | Trigger | Type |
|------|---------|------|
| `first_drop` | Log ≥1 glass ever | one-shot |
| `seven_day_streak` | Streak ≥7 days | one-shot |
| `thirty_day_streak` | Streak ≥30 days | one-shot |
| `century` | Total glasses ≥100 | threshold |
| `five_hundred` | Total glasses ≥500 | threshold |
| `early_bird` | Log before 8AM, 10 times | threshold |
| `night_owl` | Log after 10PM, 10 times | threshold |
| `perfect_week` | Hit daily goal 7 days in a row | one-shot |
| `goal_crusher` | Double daily goal in one day | one-shot |
| `speed_demon` | Log within 1 minute of reminder | threshold (5×) |
| `comeback_kid` | Break a 3+ day streak miss (log after gap) | one-shot |
| `loyal_user` | Open app 30 distinct days | threshold |

### Edge Cases
- `perfect_week` needs to scan the last 7 days — not any 7 days ever
- `thirty_day_streak` depends on the streak function in `storage.js` — if it's broken, this silently fails
- `speed_demon` needs the notification timestamp — logged later in Epic C

### File Changes
| File | Action |
|------|--------|
| `utils/achievements.js` | **Create** — definition list (focus on data model, checker in A3) |

---

## Task A3 — Checker Engine

### What to build

The core function: `checkAchievements(lastLogEntry, logs, settings)` → `{ unlocked: Achievement[], isNew: boolean }`

Run this after every drink log and on app open (for streak-based ones).

### Algorithm

```
checkAchievements(logs, settings):
  1. Get already-unlocked IDs from storage
  2. Get current progress counters from storage
  3. For each ACHIEVEMENT not yet unlocked:
     a. Run its check(logs, settings, progress)
     b. If check returns unlocked=true:
        - Add to newlyUnlocked list
        - Save to storage
     c. Else:
        - Update progress counter in storage (if changed)
  4. Return newlyUnlocked
```

### Where it runs

```js
// In HomeScreen.js, after logDrink():
const newlyUnlocked = await checkAchievements(allLogs, settings);
if (newlyUnlocked.length > 0) {
  setPopupAchievements(newlyUnlocked);  // triggers popup UI
  if (/* app is in background */) {
    sendAchievementNotification(newlyUnlocked[0]);  // Epic A6
  }
}

// On app mount:
const newlyUnlocked = await checkAchievements(allLogs, settings);
// (no popup for ones unlocked while app was closed — notification handled that)
```

### Edge Cases
- **Double unlock**: if user earns two achievements from one log (e.g., "First Drop" + "Early Bird"), both go into `newlyUnlocked` → popup should queue them
- **App closed**: if achievement was earned while app wasn't running (notification only), the checker shouldn't re-popup it next open
- **Progress-only run**: most runs unlock nothing — engine returns `[]` and is silent

### File Changes
| File | Action |
|------|--------|
| `utils/achievements.js` | **Edit** — add `checkAchievements()`, helper `allLogsFromStorage()` |

---

## Task A4 — Achievement Popup

### What to build

When an achievement unlocks with the app open, show a celebratory modal.

### Component: `components/AchievementPopup.js`

```
Props:
  - achievements: Achievement[]  (the newly unlocked ones)
  - visible: boolean
  - onDismiss: () => void
  - onShare: (achievement) => void  (optional, wired in Sprint 5)

Behavior:
  - Shows first achievement in the list
  - On dismiss → if more in queue, show next; else close
  - Animation: scale-in + confetti dots (simple animated dots, no external lib)
  - Auto-dismiss after 4 seconds (unless user taps)
```

### Layout Sketch
```
┌──────────────────────────┐
│                          │
│         🏆               │
│                          │
│    🌊  First Drop        │
│  "Log your first glass"  │
│                          │
│    [  Awesome!  ]        │
│                          │
└──────────────────────────┘
```

### Implementation Notes
- Use React Native's `Animated` API — import `Animated` from react-native
- No external animation library needed
- Simple confetti: 6-8 colored dots that animate upward with `Animated.timing` + fade out
- `onDismiss` callback lets HomeScreen know it can clean up state

### Confetti Animation (pseudocode)
```js
// 8 circles with random x-offset, random delay
// Animate each: translateY: 0 → -150, opacity: 1 → 0, scale: 1 → 0.3
// Duration: 600ms per dot, staggered by 50-100ms
```

### Edge Cases
- If user logs 3 drinks quickly and triggers 2 achievements, they should queue (show one, dismiss, show next)
- Popup should NOT re-appear on tab switch — clear state after dismiss
- If `achievements` is empty, don't render anything even if `visible` is true

### File Changes
| File | Action |
|------|--------|
| `components/AchievementPopup.js` | **Create** — popup modal + confetti animation |

---

## Task A5 — Achievements Gallery Screen

### What to build

A new screen showing all achievements: locked, unlocked, and in-progress.

### Screen: `screens/AchievementsScreen.js`

```
Layout:
  - Header: "Achievements" + total unlocked count (e.g., "3 / 12")
  - Grid of achievement cards, 2 columns
  - Each card shows:
    - Emoji (grayscale if locked)
    - Title
    - Description (small, muted)
    - Progress bar if threshold type
    - "UNLOCKED" badge or "🔒"
  - Unlocked sorted first, then by progress % descending
```

### Card States

| State | Visual |
|-------|--------|
| 🔓 Unlocked | Full color emoji, "✨ Unlocked" badge, green tint |
| 🔒 In progress | Emoji at 50% opacity, progress bar "7 / 10", "X more to go!" |
| 🔒 Not started | Emoji at 30% opacity, no progress bar, "🔒" |

### Navigation

Add as a 4th tab in `App.js`:
```js
<Tab.Screen name="Achievements" component={AchievementsScreen} />
```

Tab icon: `"trophy"` from Ionicons.

### Data Loading

```js
useFocusEffect(
  useCallback(() => {
    const unlocked = await getUnlockedAchievements();
    const progress = await getAchievementProgress();
    const logs = await getLogs();
    const settings = await getSettings();
    // Compute display state for each achievement
    setDisplayAchievements(buildGalleryList(unlocked, progress, logs, settings));
  }, [])
);
```

### Empty State
```
  🏆
  No achievements yet
  Keep drinking water to earn your first badge!
```

### Edge Cases
- If progress counter doesn't exist for an achievement, show 0
- "Locked" achievements with hidden description? (No, keep them visible — motivation)
- Rapid switching between tabs shouldn't cause stale data (useFocusEffect handles this)

### File Changes
| File | Action |
|------|--------|
| `screens/AchievementsScreen.js` | **Create** — gallery with 2-column grid |
| `App.js` | **Edit** — add Achievements tab, import screen, add to TAB_ICONS |
| `utils/achievements.js` | **Edit** — export `buildGalleryList()` function or expose definition list |

---

## Task A6 — Notification on Unlock

### What to build

When achievement unlocks while app is in background, fire a local notification.

### Implementation

In `checkAchievements()`, if newly unlocked and we can detect background state:

```js
// In notifications.js or achievements.js
export async function sendAchievementNotification(achievement) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `🏆 Achievement Unlocked!`,
      body: `${achievement.emoji} ${achievement.title} — ${achievement.description}`,
      data: { type: "achievement", id: achievement.id },
    },
    trigger: null, // immediate
  });
}
```

### Where it's called

When the app is backgrounded and an achievement unlocks via a background-log action (e.g., quick-log from notification in Epic C), the checker runs and if new achievements are found, fire a notification.

In the foreground case, the popup handles it (don't double-fire).

### Edge Cases
- Don't fire notification if user is actively using the app (popup handles it)
- If multiple achievements unlock at once, fire one notification: "2 achievements unlocked!"
- Tapping the notification should open the Achievements screen (future — requires deep link setup)

---

## Dependency Graph

```
A1 (storage) ──┐
               ├── A3 (checker) ──┬── A4 (popup)
A2 (defs) ─────┘                 ├── A5 (gallery)
                                  └── A6 (notification)
```

**Build order:** A1 → A2 → A3 → A4 + A5 (parallel after A3) → A6

A4 and A5 are independent once A3 is done.

---

## Success Criteria

- [ ] Unlocked achievements persist across app restarts
- [ ] Progress counters persist and increment correctly
- [ ] `checkAchievements` returns `[]` when nothing new (silent)
- [ ] Achievement popup appears with animation on unlock
- [ ] Multiple achievements queue properly (dismiss one → next appears)
- [ ] Gallery shows correct lock/unlock/progress state for all 12 achievements
- [ ] Background unlock fires a notification
- [ ] No crash when all achievements are unlocked (graceful: "You got them all!")
- [ ] "Reset All Data" in Settings clears progress but keeps earned achievements
