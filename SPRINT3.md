# Sprint 3 — 🎮 Gamification & Motivation

> **Goal:** Make drinking water fun. Achievements, custom messages, snooze, escalation.
>
> **Theme:** Keep the user engaged with the app beyond just "set it and forget it."

---

## Why This Sprint

Sprint 2 gave us a working reminder app with a streak counter and daily goal. The app works, but it's functional — not _sticky_. This sprint turns Plenty into something you check because it's rewarding, surprising, and personally engaging.

All features in this sprint touch the same notification system and storage layer, making them efficient to build together.

---

## Epic A — Achievements & Badges 🏆

A lightweight achievement system that detects milestones and celebrates them.

### Epic A Tasks

| # | Task | Detail | Status |
|---|------|--------|--------|
| **A1** | Design achievement data model | Store list of earned achievements in AsyncStorage under `@plenty_achievements` | ✅ |
| **A2** | Achievement definitions | Define 8-12 achievements with detection logic (see below) | ✅ |
| **A3** | Achievement checker engine | Function that runs after every drink log to check + unlock. Runs silently — if nothing new, no UI. | ✅ |
| **A4** | Achievement popup | Modal/card that appears with confetti-like animation when new achievement unlocks | ✅ |
| **A5** | Achievements screen | New tab or section showing all achievements (locked/unlocked) with progress % | ✅ |
| **A6** | Notification on unlock | Fire a local notification when an achievement is earned outside the app | ✅ |

### Candidate Achievements

| Achievement | Trigger |
|---|---|
| 🌊 **First Drop** | Log your first glass |
| 💪 **7-Day Streak** | Reach a 7-day hydration streak |
| 🔥 **30-Day Streak** | Reach a 30-day streak |
| 🏅 **Century** | Log 100 glasses total |
| 🚀 **500 Club** | Log 500 glasses total |
| ⚡ **Early Bird** | Log a drink before 8 AM — 10 times |
| 🌙 **Night Owl** | Log a drink after 10 PM — 10 times |
| ☀️ **Perfect Week** | Hit your daily goal every day for a week |
| 🎯 **Goal Crusher** | Double your daily goal in a single day |
| 🤝 **Social Butterfly** | Share your streak card (future) |
| 🏃 **Post-Workout** | Log 5 drinks within an hour after a workout (manual trigger) |
| 💎 **Loyal User** | Use the app for 30 consecutive days (open counts) |

### Storage
```json
@plenty_achievements: ["first_drop", "seven_day_streak", ...]
@plenty_achievement_progress: { "century": 42, "early_bird": 3, ... }
```

---

## Epic B — Custom Notification Messages 💬

Rotate through a pool of fun, encouraging, and varied messages instead of the same "Time to drink water!" every time.

### Epic B Tasks

| # | Task | Detail | Status |
|---|------|--------|--------|
| **B1** | Message pool | Create an array of 20+ messages with categories (encouraging, funny, urgent, fact-based) | ✅ |
| **B2** | Smart rotation | Pick randomly, never repeat the same message twice in a row | ✅ |
| **B3** | Context-aware messages | Different tone based on time of day (morning ☀️, afternoon, evening 🌙) | ✅ |
| **B4** | Goal-proximity messages | "Almost at your daily goal!" / "You crushed it today!" based on progress | ✅ |
| **B5** | Message admin in Settings | Toggle message categories on/off, option for custom user messages | ✅ |

### Sample Messages

```
"💧 Your brain is 73% water — feed it."
"☀️ Morning splash! Your body lost water overnight."
"🏃 You've been sitting for a while — drink up!"
"🎯 {X} glasses to go — you've got this!"
"🧠 Studies show even 1% dehydration affects focus."
"🌊 Keep the streak alive! 🔥"
"🍵 Yes, tea counts too. But actual water is better."
```

### Implementation Notes
- Message pool lives in a new `utils/messages.js` file
- `scheduleWaterReminder` picks a message when scheduling
- Message can be overridden by achievement notification

---

## Epic C — Snooze & Gentle Escalation 🔔

### Epic C Tasks

| # | Task | Detail | Status |
|---|------|--------|--------|
| **C1** | Notification actions | Add "Snooze 15m" and "I drank!" action buttons to the notification (Android) | ✅ |
| **C2** | Snooze handler | When snoozed, cancel current schedule and re-schedule in 15 minutes | ✅ |
| **C3** | Quick-log from notification | "I drank!" button logs 250ml directly from the notification without opening the app | ✅ |
| **C4** | Escalation tiers | If user hasn't logged in N hours, increase notification intensity | ✅ |
| **C5** | Escalation channel | Android: change to a higher-importance channel with stronger vibration pattern | ✅ |
| **C6** | Escalation message | Use stronger messaging: "It's been 3 hours — seriously, drink some water!" | ✅ |

### Snooze Flow
```
Notification fires
  ├─ "Snooze 15m" → cancel + reschedule 15min later
  └─ "I drank!"   → log 250ml, reschedule at normal interval
```

### Escalation Tiers
| Tier | Condition | Effect |
|------|-----------|--------|
| 🟢 Normal | Last log < 2h ago | Normal notification, normal message |
| 🟡 Warning | Last log 2-4h ago | Higher volume, stronger vibration, "Did you forget?" message |
| 🔴 Alert | Last log > 4h ago | Persistent alert, re-notify every 5 minutes, urgent message |

---

## Epic D — Mascot Upgrades & Reactions 🐶

### Epic D Tasks

| # | Task | Detail | Status |
|---|------|--------|--------|
| **D1** | Mood reacts to streaks | Mascot gets happier expressions as streak grows (e.g., new tier every 7 days) | ✅ |
| **D2** | Achievement celebration | Mascot does a "celebration" animation when achievement unlocks | ✅ |
| **D3** | Mascot upgrades | Unlock new mascot styles/outfits via achievements (tiered) | ✅ |
| **D4** | Mascot selection in Settings | Pick between unlocked mascot variants | ✅ |

---

## Files Changed / Created

| File | Action |
|------|--------|
| `utils/achievements.js` | **New** — achievement definitions and checker engine |
| `utils/messages.js` | **New** — notification message pool + rotation logic |
| `components/AchievementPopup.js` | **New** — celebration modal |
| `screens/AchievementsScreen.js` | **New** — achievement gallery |
| `utils/notifications.js` | **Edit** — add message rotation, escalation, snooze actions |
| `utils/storage.js` | **Edit** — add achievements storage, escalation state |
| `screens/HomeScreen.js` | **Edit** — add achievement check after log, connect mascot upgrades |
| `screens/SettingsScreen.js` | **Edit** — add message preferences, mascot selection |
| `components/Mascot.js` | **Edit** — add mood tiers, celebration animation |
| `App.js` | **Edit** — add Achievements tab |

---

## Success Criteria

- [ ] Achievements unlock correctly as user hits milestones
- [ ] Achievement popup appears only on first unlock
- [ ] Notification messages are varied and never repeat in a row
- [ ] Snooze button delays next notification by 15 minutes
- [ ] Quick-log from notification works without launching app
- [ ] Escalation triggers after missing logs for 2+ hours
- [ ] Mascot expression changes based on streak tier
- [ ] All achievements visible in gallery (locked/unlocked)
