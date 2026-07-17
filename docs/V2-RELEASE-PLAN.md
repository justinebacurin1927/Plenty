---
name: Plenty V2 Release Plan
description: Comprehensive release plan for Plenty V2 — transforming a functional hydration reminder into a habit-forming, delightful experience with streaks, a signature water animation, onboarding, and Play Store launch.
updated: 2026-07-16
---

# Plenty V2 — Release Plan

## Vision Statement

V1 of Plenty was functional: it reminded you to drink water, tracked your intake, and offered a handful of achievements. V2 is the release where Plenty graduates from utility to habit. The core insight is simple — people don't come back for notifications, they come back for streaks. V2 wraps the existing hydration engine in a streak-driven loop that makes every day of consistency feel earned. A GitHub-style heatmap gives you a long-term record to protect. A Bing-style rewards ladder gives you mile markers — 7 days, 30, 60, 100, 365 — each with a tangible unlock. And a signature animated water fill turns every logged glass into a tiny visual reward. This is the release that makes Plenty sticky, beautiful, and ready for the Play Store.

---

## The Big Idea — Streaks as the Engine

The brainstorming session that shaped V2 started with a conviction: notifications alone don't build lasting habits. The functional app (remind → log → repeat) works, but it doesn't create *momentum*. The breakthrough was realizing that streaks are the addictive hook that transforms a utility into something people protect.

**The heatmap** (a GitHub-style contribution grid on the Home screen) gives users a visual record they don't want to break. A blank cell is a missed day, and a full row of green squares is something to preserve. Over time, the heatmap becomes an identity artifact — "I'm a person who drinks 2L every day" — backed by 60 or 100 consecutive green squares.

**The rewards ladder** (borrowing the Bing Rewards mechanic) gives streaks a progression system. Instead of an abstract "keep it going," each milestone delivers a concrete unlock:

| Milestone | Reward |
|-----------|--------|
| 7 days | First badge: "Dedicated Droplet" |
| 30 days | Custom water color theme |
| 60 days | Mascot outfit unlock |
| 100 days | Gold water wave animation |
| 365 days | "Century Club" permanent flame icon |

These aren't just cosmetic — the streak fire on the Home screen *intensifies* as the streak grows, creating a visceral feedback loop. Break the streak, the flame resets. The cost of losing progress becomes higher than the effort of drinking water.

**Streak protection** (one save per month) prevents life events from destroying long streaks, keeping the mechanic motivating rather than punishing. The widget shows the current streak count. Notifications switch from generic reminders to streak-aware messages: "Don't break your 12-day streak."

Everything in V2 orbits this core loop.

---

## MoSCoW Scope

| Priority | Category | Items |
|----------|----------|-------|
| **MUST** | Core V2 ship | Streak system (heatmap + rewards), Water animation, Bug fixes, Onboarding, Play Store listing |
| **SHOULD** | Quality bar | Testing/regression guards, Notification reliability, Mascot interactivity |
| **COULD** | Polish | Full design system rollout, Micro-interactions (haptics, toast) |
| **WON'T** | Deferred to V2.x | Adaptive reminders (V2.1), iOS parity (V2.2) |

---

### Streak System (MUST)

This is the headline feature of V2. The streak system gives Plenty its emotional hook.

**Heatmap calendar.** The Home screen displays a GitHub-style contribution grid showing the last 12 weeks of daily hydration. Each cell is colored by whether the user hit their goal that day — a spectrum from empty (no drinks logged) through light teal to deep blue for goal hit. The heatmap scrolls left to reveal older weeks. Tapping a cell shows that day's total. The entire component sits above the fold on the Home screen, below the water animation and above the quick-log button, so users see their record every time they open the app.

**Rewards ladder.** Six milestone tiers (7, 30, 60, 100, 365 consecutive days) each unlock a specific reward. Rewards are applied immediately when the streak crosses the threshold and are shown in a new "Streak" section on the Achievements screen. The 365-day "Century Club" reward is permanent even if the streak later breaks — it's the ultimate long-term retention signal.

**Streak protection.** To keep streaks motivating rather than punishing, users can "freeze" their streak once per calendar month. A freeze icon appears on the heatmap cell for that day. Freezes do not count toward milestone progress. The mechanic prevents real life (sick days, travel, device issues) from destroying months of consistency.

**Streak on widget.** The Home screen widget displays the current streak count prominently beneath the day's progress.

**Streak notifications.** The notification message picker gains streak-aware messages. When the user has a streak >= 3 days, messages like "Don't break your X-day streak" replace generic reminders. At the 7-day mark, the notification tone changes subtly. At milestone boundaries (day 6 → 7, day 29 → 30, etc.), a celebration notification fires when the streak is logged.

**Streak flame.** On the Home screen, the streak badge features a small animated flame that flickers more intensely as the streak grows. At 100+ days, the flame is full size with a constant shimmer. This is a pure Reanimated effect — no imported asset.

---

### Water Animation (MUST)

The signature visual of V2. A static progress bar becomes an animated, living water level.

**Animated SVG wave.** The `WaterFill` component renders a two-layer SVG wave path on the Home screen's progress card. Each layer is a sine wave with a horizontal phase offset — one fast, one slow, at different opacities — creating the illusion of depth and constant motion. The wave's vertical position is driven by `fill` (0 to 1, representing goal progress) via a Reanimated shared value.

**Ripple on log.** When the user taps the quick-log button, a brief amplitude spike ripples through the wave and settles — the visual equivalent of a drop hitting a surface. This is a one-shot animation layered on the continuous wave motion.

**Count-up numbers.** The `todayMl` display no longer snaps to the new value. Instead, `useCountUp` interpolates from old to new over ~400ms. The number ticks upward (or downward, on undo) smoothly.

**Goal-reached moment.** At 100%, the wave briefly overshoots into a shimmer/overflow state (a flash of light across the surface), and "Goal reached!" text animates in with a scale-and-fade entrance. The existing confetti from achievements can trigger conservatively here — once per goal hit, not once per log.

**Tech stack:** `react-native-svg` for the wave path, `react-native-reanimated` for all animation. Pure worklet-based UI-thread animation to maintain 60fps. The wave-path math lives in `utils/wave.js` for unit testability.

---

### Bug Fixes (MUST)

Two production bugs shipped in the Sprint 5 APK and must be fixed for V2. Both are already fixed in the codebase — the release plan locks in that they are fully resolved and regression-tested.

1. **Interval persistence.** The reminder interval reset to 30 minutes on every app restart because `intervalMinutes` was never persisted. The fix stores the interval alongside other settings. Regression test: save an interval, reload, assert the same value.

2. **Notification deduplication.** Reminders fired every 5 minutes and duplicated because the escalation cap (5 min minimum) interacted with a scheduling race condition in `scheduleWaterReminder`. The fix ensures concurrent calls produce exactly one repeating reminder. Regression test: call `scheduleWaterReminder` twice in rapid succession, assert one scheduled notification.

3. **Health Connect purge.** Remove the partially-implemented `expo-health-connect` integration (unused dependency, unused files, autolink patch for RN 0.77). The V2 APK must request zero Health permissions. This also reduces APK size and eliminates a source of cryptic build errors.

4. **Edge case sweep.** Day-boundary and timezone edge cases in the log, empty-state handling across all screens, malformed import JSON from backup, and long list rendering performance.

---

### Onboarding (MUST)

A first-time user currently lands on a cold Home screen with no context. V2 adds a guided 3-screen intro flow.

**Screen 1 — What Plenty does.** A brief, visual introduction: "Plenty helps you drink enough water every day." No features, no settings — just the concept.

**Screen 2 — Set your daily goal.** A quick calculator card: enter your weight, optionally adjust for activity level, and see a recommended daily ml goal. The user can accept it or set a custom amount manually.

**Screen 3 — Set your reminder interval + grant permission.** Choose how often to be reminded (30 min, 1h, 2h, or custom). Before the OS permission prompt appears, a brief overlay explains *why* notification permission is needed, with a graceful fallback path if denied ("You can enable notifications later in Settings").

After Screen 3, the user lands on the Home screen with the goal and interval already saved, reminders active, and the streak heatmap already initialized.

Detection: `@plenty_onboarded` flag in storage. If absent, route to onboarding. Replays (from Settings, "Show onboarding again") are a V2.1 nice-to-have.

---

### Play Store Listing (MUST)

Everything required to publish `com.justine7417.plenty` to the Google Play Store production track.

**Store listing assets.**
- Feature graphic (1024 x 500 px)
- 4-6 phone screenshots showing key screens: Home with streak heatmap, water animation in progress, quick-log flow, Achievements screen with rewards ladder, onboarding screen, Settings
- Short description (~80 chars)
- Full description (~750 chars) covering features, streak system, and local-only privacy

**Privacy policy.** A hosted "All data stays on your device" statement. The app collects nothing, transmits nothing, has no analytics SDK, and stores all data locally in AsyncStorage. Location data is used solely for weather-based goal adjustments via Open-Meteo (no sharing, no storage). Link to the policy from the app's Settings screen.

**Data safety declaration.** Complete the Play Console data-safety form declaring: location (used for weather, not collected), no personal data collected, no data shared, no data encrypted at rest (no server), no data deletion mechanism required (no server).

**Version and metadata.** Production versionCode and version bump. Category: Health & Fitness. Content rating questionnaire: General (Everyone).

**Build and submit.** `eas build --profile production` (AAB format) followed by `eas submit` to internal testing track, then staged rollout to production.

---

### Testing & Regression Guards (SHOULD)

Establish a test foundation so V2's improvements don't regress.

- `jest-expo` configuration with `@testing-library/react-native`
- Storage unit tests: `getSettings` merges with `DEFAULT_SETTINGS`, `saveSettings` round-trips
- Regression tests for both Sprint 5 field bugs (interval persistence, notification dedup)
- Pure-logic tests for patterns (peak hour / lull detection), report aggregation, weight-based goal calculation
- Wave-path math tests (`utils/wave.js`) for the water animation
- A manual smoke-test checklist for pre-submit QA

---

### Notification Reliability (SHOULD)

Reminders must survive real-world conditions.

- Persist `remindersActive` flag alongside `intervalMinutes` as the source of truth
- Re-arm on app launch: if `remindersActive` but no scheduled reminder exists, reschedule from saved interval
- Reboot survival: verify `RECEIVE_BOOT_COMPLETED` behavior with first-launch re-arm as safety net
- Permission edge cases: handle denied/blocked state with "Open settings" deep link; keep the Home warning banner in sync
- Quiet-hours audit: confirm cross-midnight math, first-reminder-after-quiet-hours timing, channel creation once, sound setting respected

---

### Mascot Interactivity (SHOULD)

The existing mascot (4 expressions x 4 variants, celebration bounce) gains a subtle idle animation — a gentle bobbing motion on the Home screen. The mascot's expression previews the streak state (e.g., happier as the streak grows). This is layered on top of the existing expression system, not replacing it.

---

### Full Design System Rollout (COULD)

A screen-by-screen visual audit followed by applying a consistent type scale (`display / title / heading / body / label / caption`), spacing scale (`xs 4 / sm 8 / md 12 / lg 16 / xl 24 / 2xl 32`), and structural color tokens (radius and elevation presets) across all screens. This is the design foundation that V2.2 (iOS port) will inherit.

---

### Micro-interactions (COULD)

- **Press scale + haptics:** A `PressableScale` wrapper that shrinks buttons to ~0.96 on press (spring back) with `expo-haptics` impact feedback on key actions (log, start/stop, amount picker)
- **Screen transitions:** Subtle fade/slide for tab switches and modal entrances
- **Log toast:** An animated confirmation toast ("+250ml logged") sliding in on each drink log with auto-dismiss
- **Achievement popup polish:** Refined entrance easing and confetti timing
- **Weekly chart entrance:** Bars animate in from zero on mount/focus

All micro-interactions respect the OS reduced-motion setting.

---

## Launch Strategy

**Word-of-mouth only.** No launch campaign, no press outreach, no paid acquisition. The app spreads because it's great — the streak mechanic creates natural sharability ("365 days!") and the visual water animation is something users want to show someone. The Play Store listing is complete, the screenshots are attractive, and the description is clear. That's the entire marketing plan.

**Pre-launch APK to existing testers.** The existing group of real users (Sprint 5 APK recipients) gets the V2 beta first. Their feedback and app store reviews provide the initial rating signal.

**Play Store staged rollout.** Production launches at 10% staged rollout, monitoring crash rate and uninstalls, then ramp to 100% over 1-2 weeks.

---

## What V2 Is NOT (Deferred)

**Adaptive reminders (V2.1).** Smart reminders that learn from user patterns — suggesting intervals based on when the user actually drinks, weather-based intensity, and time-of-day personalization. The architecture (notification engine, weather integration) is already in place from Sprint 4; V2.1 applies the learning layer on top.

**iOS parity (V2.2).** V2 is Android-only. iOS parity — including native notifications via APNs, WidgetKit widget, and App Store listing — is a separate tracked project. The design system and component library built in V2 (design tokens, `WaterFill`, `Mascot` with animation, streak engine) are the shared foundation that iOS reuses.

---

## Success Criteria

**Downloads.**
- 250 downloads within 30 days of production launch
- 1,000 downloads within 90 days

**Ratings.**
- 4.5+ star average (minimum 50 ratings within 60 days)
- Zero 1-star reviews mentioning crashes, broken notifications, or data loss

**Retention signals (measured by the app's internal streak data, opt-in).**
- 30% of users who install maintain a 7-day streak within their first two weeks
- 10% of users reach a 30-day streak within 90 days
- At least one user reaches 100-day streak within 6 months of launch (hand-counted, but worth tracking)

**Quality gates (pre-launch).**
- `npm test` runs green, including both Sprint 5 regression tests
- Production AAB requests only expected permissions (no Health Connect)
- Onboarding: a first-time user reaches an active reminder without touching a raw OS prompt unguided
- Water animation holds 60fps on a mid-range Android device (Pixel 6-equivalent or older)
- All OS notification states (allowed, denied, blocked) leave the app in a functional, non-broken state

---

## Key Files to Create or Change

| File | Change |
|------|--------|
| `components/WaterFill.js` | **New** — Animated SVG wave component |
| `utils/wave.js` | **New** — Wave path math, unit-testable |
| `utils/motion.js` | **New** — Reanimated presets, `useCountUp`, `usePressScale`, reduced-motion hook |
| `components/StreakFlame.js` | **New** — Animated streak flame indicator |
| `components/PressableScale.js` | **New** — Animated pressable wrapper with haptics |
| `components/Toast.js` | **New** — Log confirmation toast |
| `screens/OnboardingScreen.js` | **New** — 3-screen intro flow |
| `utils/notifications.js` | **Edit** — Re-arm on launch, streak-aware messages, permission handling |
| `utils/storage.js` | **Edit** — `remindersActive`, `@plenty_onboarded`, streak data persistence |
| `constants/colors.js` | **Edit** — Add radius and elevation tokens |
| `constants/typography.js` | **New** — Type scale tokens |
| `constants/spacing.js` | **New** — Spacing scale tokens |
| `context/ThemeContext.js` | **Edit** — Use new structural tokens |
| `screens/HomeScreen.js` | **Edit** — Integrate `WaterFill`, streak heatmap, streak flame, count-up numbers |
| `screens/AchievementsScreen.js` | **Edit** — Add streak milestones and rewards section |
| `screens/SettingsScreen.js` | **Edit** — Privacy policy link, onboarding replay option |
| `components/Mascot.js` | **Edit** — Idle bob animation, streak-aware expressions |
| `utils/health.js` | **Delete** — Health Connect removal |
| `modules/plenty-health/` | **Delete** — Health Connect module removal |
| `__tests__/` | **New** — Jest test suite (storage, notifications, patterns, wave math) |
| `jest.config` | **New** — Jest configuration |

---

## Build Order (Recommended)

1. **Bug fixes** — lock in the two Sprint 5 field bug fixes. Everything else is built on a stable foundation.
2. **Test foundation** — `jest-expo`, regression tests for the fixed bugs, pure-logic tests.
3. **Onboarding** — 3-screen flow. Changes storage and routing; better to land early.
4. **Notification reliability** — re-arm on launch, reboot survival, permission edge cases.
5. **Streak system** — heatmap, rewards ladder, streak protection, streak notifications, streak flame. The core V2 feature.
6. **Water animation** — `WaterFill`, ripple on log, count-up numbers, goal-reached moment.
7. **Design system + visual audit** — apply tokens, unify components, empty states.
8. **Mascot interactivity + micro-interactions** — idle bob, press scale, haptics, transitions, toast.
9. **Play Store listing** — assets, policy, build, submit. Last step, fully gates launch.
