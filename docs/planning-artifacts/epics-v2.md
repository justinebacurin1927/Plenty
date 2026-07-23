---
name: Plenty V2 Epics
description: Epic definitions for Plenty V2 — Streaks, Water Animation, Onboarding, Bug Fixes, Quality, and Play Store Launch
updated: 2026-07-16
---

# Plenty V2 — Epic Definitions

> **Release Context:** V2 transforms Plenty from a functional hydration utility into a habit-forming experience. The core loop is streaks — a GitHub-style heatmap + Bing Rewards ladder that makes consistency addictive. Everything else serves that loop.
>
> **Launch Strategy:** Word-of-mouth only. No campaign. The app spreads because it's great.

---

## MoSCoW Summary

| Priority | Epics |
|----------|-------|
| **MUST** | Epic 1 (Bug Fixes), Epic 2 (Streak System), Epic 3 (Water Animation), Epic 4 (Onboarding), Epic 8 (Play Store) |
| **SHOULD** | Epic 5 (Quality Foundation) |
| **COULD** | Epic 6 (Mascot & Interactions), Epic 7 (Design System) |
| **WON'T** | Adaptive reminders → V2.1, iOS parity → V2.2 |

---

## Recommended Build Order

```
Epic 1 (Bug Fixes) → Epic 5 (Quality) → Epic 4 (Onboarding) → then:
  ├─ Epic 2 (Streak System) — the headline
  ├─ Epic 3 (Water Animation) — the visual wow
  ├─ Epic 7 (Design System) — visual consistency
  └─ Epic 6 (Mascot & Interactions) — polish
→ Epic 8 (Play Store) — gates launch
```

---

## Epic 1 — Bug Fixes & Foundations

| Field | Value |
|-------|-------|
| **Priority** | MUST |
| **Theme** | Ship-stopper fixes before any new work touches the codebase |
| **Depends on** | Nothing |
| **Build order** | 1st |

### Objective

Lock in the two production bugs that shipped in Sprint 5 and remove dead code before building anything new. A stable foundation is non-negotiable for V2.

### Stories

#### 1.1 — Fix interval persistence
**User Story:** As a user, I want my reminder interval to stay at the value I set, even when I restart the app, so I don't have to re-configure it every time.

**Acceptance Criteria:**
- `intervalMinutes` is persisted to AsyncStorage alongside other settings
- On app restart, `getSettings` returns the saved interval, not the default 30
- Regression test: save interval → reload → assert same value

**Files:** `utils/storage.js` (edit)

---

#### 1.2 — Fix notification deduplication
**User Story:** As a user, I want exactly one reminder scheduled at a time, so I don't get bombarded every 5 minutes.

**Acceptance Criteria:**
- Concurrent `scheduleWaterReminder` calls produce exactly one repeating reminder
- The escalation cap (5 min minimum) no longer overrides the user's chosen interval
- Regression test: call `scheduleWaterReminder` twice → assert one scheduled notification

**Files:** `utils/notifications.js` (edit)

---

#### 1.3 — Purge Health Connect
**User Story:** As a developer, I want to remove all Health Connect code so the V2 APK requests zero Health permissions.

**Acceptance Criteria:**
- Remove `expo-health-connect` and `react-native-health-connect` from package.json
- Delete `utils/health.js` and `modules/plenty-health/`
- Remove the autolink patch
- Built APK requests no Health permissions
- No references to health connect remain anywhere in the codebase

**Files:**
- `utils/health.js` (delete)
- `modules/plenty-health/` (delete directory)
- `package.json` (edit)

---

#### 1.4 — Edge case sweep
**User Story:** As a user, I want the app to handle edge cases gracefully — no crashes on boundary dates, long lists, or malformed imports.

**Acceptance Criteria:**
- Day-boundary and timezone edge cases in log rendering are handled
- Empty states render on every screen (no drinks, no achievements, no reports)
- Malformed JSON from backup import is caught with a user-friendly error
- Long log lists don't degrade performance (FlatList virtualization)
- `updated with success criteria and Business context`

**Files:** `screens/LogScreen.js`, `screens/AchievementsScreen.js`, `screens/HomeScreen.js` (edit), `utils/export.js` (edit)

---

## Epic 2 — Streak System ⭐

| Field | Value |
|-------|-------|
| **Priority** | MUST |
| **Theme** | The headline V2 feature — what makes Plenty addictive |
| **Depends on** | Epic 5 (Quality — test foundation for streak math) |
| **Build order** | 5th |

### Objective

Transform streaks from a passive counter into the core emotional hook. A GitHub-style heatmap gives users a visual record they want to protect. A Bing Rewards ladder with unlockable cosmetic rewards at 7/30/60/100/365 days gives every milestone something to look forward to.

### Stories

#### 2.1 — Streak engine + persistence ✅
**User Story:** As the app, I want to accurately track daily streak data and persist it efficiently, so the rest of the streak system has a reliable data source.

**Acceptance Criteria:**
- For each day, store whether the user hit their goal (true/false) plus total ml
- Store the current streak count, longest streak, and streak freeze available/month
- Add `@plenty_streak` storage key with versioned schema
- Efficient batch reads (don't scan all logs every time)
- `getStreakData()` returns: `{current, longest, history: [{date, goalMet, totalMl}], freezesAvailable, milestonesReached}`
- Existing `getStreak()` is refactored to use the new engine (backward-compatible)
- Unit tests for streak math: consecutive days, break detection, freeze behavior

**Files:**
- `utils/storage.js` (edit — add streak keys + accessors)
- `__tests__/streak.test.js` (new)

**Status:** done — streak engine with lazy cache rebuild, 82/82 tests passing.

---

#### 2.2 — GitHub-style heatmap on Home screen ✅
**User Story:** As a user, I want to see my last 12 weeks of hydration at a glance on the Home screen, so I can visually track my consistency and avoid breaking my streak.

**Acceptance Criteria:**
- A contribution-grid component renders below the water animation, above the quick-log button
- 12 weeks of day cells, each colored by goal status:
  - Empty/not tracked → transparent/light gray
  - Hit goal that day → teal-to-deep-blue gradient based on how much over goal
  - Missed goal but logged something → light fill
- Scrolls left to reveal older weeks
- Tapping a cell shows a tooltip with that day's total ml
- Respects dark mode
- Animated on first render (cells fade in row by row)
- No external calendar library — implement with React Native Views + Reanimated
- Unit test: correct cell count, correct color mapping

**Files:**
- `components/Heatmap.js` (new)
- `screens/HomeScreen.js` (edit — integrate Heatmap)

**Status:** done — 12-week grid with color coding, tooltips, fade-in animation, 89/89 tests passing.

---

#### 2.3 — Rewards ladder + Streak UI ✅
**User Story:** As a user, I want to see my streak milestones and unlock rewards, so I have something concrete to work toward beyond the number itself.

**Acceptance Criteria:**
- Achievements screen gains a "Streak" section showing 5 milestone tiers:

  | Milestone | Reward |
  |-----------|--------|
  | 7 days | Badge: "Dedicated Droplet" |
  | 30 days | Unlock custom water color theme |
  | 60 days | Mascot outfit unlock |
  | 100 days | Gold water wave animation |
  | 365 days | "Century Club" permanent flame icon |

- Each unreached milestone shows as locked with "X days to go"
- Reward is applied immediately when streak crosses threshold
- 365-day "Century Club" reward is permanent even if streak breaks
- A "Rewards Vault" view shows upcoming milestones and what you'd unlock at each
- Rewards state is persisted (milestones reached stored in streaks data)

**Files:**
- `screens/AchievementsScreen.js` (edit — add streak rewards section)
- `utils/storage.js` (edit — milestone checking in rebuildStreakCache)
- `constants/rewards.js` (new — reward definitions, unlock conditions)

**Status:** done — horizontal scroll of milestone cards with lock/unlock states, permanent milestones preserved on rebuild, 89/89 tests passing.

---

#### 2.4 — Streak protection ✅
**User Story:** As a user, I want to save my streak if I miss a day for a legitimate reason, so real life doesn't destroy months of consistency.

**Acceptance Criteria:**
- One streak freeze available per calendar month
- Freeze icon appears on the heatmap cell for the frozen day
- Frozen days do NOT count toward milestone progress (no progress on frozen day)
- Freeze is used when user opens the app on a missed day — prompt: "Looks like you missed yesterday. Use a streak freeze to keep your streak alive? (1 remaining this month)"
- Streak doesn't break on frozen days
- Clear UI showing how many freezes remain

**Files:**
- `utils/streak.js` (edit — freeze logic)
- `utils/storage.js` (edit — persist freezes)
- `components/Heatmap.js` (edit — freeze indicator)
- `screens/HomeScreen.js` (edit — freeze prompt)

**Status:** done — `useFreeze()`/`checkMissedDay()` in storage.js, freeze modal on HomeScreen, ❄️ on frozen heatmap cells, dual streak counters (display vs milestone), 98/98 tests passing.

---

#### 2.5 — Streak flame
**User Story:** As a user, I want the streak badge to feel alive — a flame that burns hotter as my streak grows.

**Acceptance Criteria:**
- A small animated flame next to the streak count on Home screen
- Flame flickers more intensely as streak length increases:
  - 0–6 days: no flame (or ember)
  - 7–29 days: small flame
  - 30–99 days: medium flame with visible flicker
  - 100+ days: full flame with constant shimmer
- Pure Reanimated effect (no imported GIF or asset)
- Respects reduced-motion setting

**Files:**
- `components/StreakFlame.js` (new)
- `screens/HomeScreen.js` (edit — integrate StreakFlame)

---

#### 2.6 — Streak on widget
**User Story:** As a user, I want to see my current streak on the home screen widget, so I don't even need to open the app.

**Acceptance Criteria:**
- The existing Android widget displays the current streak count
- Streak data flows through the widget data bridge (`utils/widget.js`)
- Widget updates when streak changes (on log)
- Widget shows: streak count, current day's progress (ml), and a compact progress bar

**Files:**
- `utils/widget.js` (edit — add streak data to widget payload)
- `plugins/withPlentyWidget.js` (edit — widget layout update)

---

#### 2.7 — Streak-aware notifications
**User Story:** As a user, I want reminders that reference my streak when I have one going, so they feel personal and make me want to protect it.

**Acceptance Criteria:**
- When streak >= 3 days, notification messages switch to streak-aware variants:
  - "Don't break your X-day streak! 🏆"
  - "You're on a X-day streak — keep it going!" (etc.)
- At milestone boundaries (day 6→7, 29→30), a celebration notification fires when the streak is logged
- Tone subtly changes at 7-day mark

**Files:**
- `utils/messages.js` (edit — add streak-aware message pool)
- `utils/notifications.js` (edit — select streak messages)

---

## Epic 3 — Water Animation

| Field | Value |
|-------|-------|
| **Priority** | MUST |
| **Theme** | The signature visual — the one thing users screenshot |
| **Depends on** | Nothing (new component, no existing code change) |
| **Build order** | 6th |

### Objective

Replace the static progress bar with an animated, living water level that reacts to every drink logged. The water ripple, count-up numbers, and goal-reached overflow create the premium feel V2 needs.

### Stories

#### 3.1 — Animated SVG wave (WaterFill component)
**User Story:** As a user, I want to see a moving water wave instead of a flat progress bar, so the app feels alive and premium.

**Acceptance Criteria:**
- `WaterFill` component renders an SVG wave with two layers (sine wave path)
- Each layer has independent horizontal phase offset, speed, and opacity → creates depth illusion
- `fill` prop (0–1) drives the wave's vertical position via Reanimated shared value
- Continuous wave motion even when idle
- Smooth animation when `fill` changes (e.g., 0.4 → 0.5)
- Pure worklet-based UI-thread animation (60fps)
- Respects dark mode colors
- Wave path math is in `utils/wave.js` and unit-testable

**Tech dependencies:** `react-native-svg`, `react-native-reanimated`

**Files:**
- `components/WaterFill.js` (new)
- `utils/wave.js` (new)
- `__tests__/wave.test.js` (new)

---

#### 3.2 — Integrate WaterFill + ripple on log
**User Story:** As a user, I want the water to ripple when I log a drink, so there's a satisfying visual reward for every tap.

**Acceptance Criteria:**
- The flat progress bar on HomeScreen is replaced with `WaterFill`
- On `logDrink`, the water level animates up smoothly (fill changes)
- A brief amplitude spike (ripple) animates through the wave and settles
- Ripple is a one-shot animation layered on the continuous wave

**Files:**
- `screens/HomeScreen.js` (edit — replace progress bar with WaterFill)
- `components/WaterFill.js` (edit — add ripple animation)

---

#### 3.3 — Count-up numbers
**User Story:** As a user, I want the ml total to count up smoothly when I log, so it feels like progress rather than a number snap.

**Acceptance Criteria:**
- `todayMl` display interpolates from old value to new over ~400ms
- Numbers tick upward (or downward on undo) smoothly
- Uses Reanimated shared value timing

**Files:**
- `utils/motion.js` (new — `useCountUp` hook)
- `screens/HomeScreen.js` (edit — use count-up for ml display)

---

#### 3.4 — Goal-reached moment
**User Story:** As a user, when I hit my daily goal I want the app to celebrate with me — not just stop counting.

**Acceptance Criteria:**
- At 100%, the wave briefly overshoots into a shimmer state
- A flash of light across the water surface animates (1.5s)
- "Goal reached! 🎉" text animates in with scale-and-fade
- Existing confetti from AchievementPopup triggers conservatively (once per goal hit, not per log)
- Goal-reached animation doesn't re-trigger if user logs more after hitting goal (only triggers on first crossing 100%)

**Files:**
- `components/WaterFill.js` (edit — overshoot + shimmer animation)
- `screens/HomeScreen.js` (edit — goal-reached text + confetti trigger)

---

## Epic 4 — Onboarding

| Field | Value |
|-------|-------|
| **Priority** | MUST |
| **Theme** | First 30 seconds that hooks users instead of confusing them |
| **Depends on** | Epic 1 (stable foundation) |
| **Build order** | 3rd |

### Objective

A new user currently lands on a cold Home screen with no context. V2 adds a guided 3-screen introduction that sets their goal, configures reminders, and primes their notification permission — all without touching a raw OS prompt unguided.

### Stories

#### 4.1 — First-run detection ✅
**User Story:** As the app, I want to detect first-time users and route them to onboarding, so they don't land on an empty Home screen.

**Acceptance Criteria:**
- `@plenty_onboarded` boolean flag in AsyncStorage
- If flag is absent on app start → route to `OnboardingScreen`
- If flag is present → route to main navigation (existing behavior)
- `getSettings` merges the flag with `DEFAULT_SETTINGS`

**Files:**
- `utils/storage.js` (edit — add `@plenty_onboarded` to KEYS + DEFAULT_SETTINGS)
- `App.js` (edit — conditional routing based on flag)

**Status:** done — flag persisted, App.js gates routing, 70/70 tests passing.

---

#### 4.2 — Onboarding screen (3-swipe intro) ✅
**User Story:** As a new user, I want a quick, friendly welcome that sets up my goal and reminders, so I can start using Plenty immediately.

**Acceptance Criteria:**
- Three-screen swipeable/flat-list flow:
  - **Screen 1 — What Plenty does:** Short visual intro with mascot: "Plenty helps you drink enough water every day. No fuss, no accounts."
  - **Screen 2 — Set your daily goal:** Weight-based goal calculator card. Enter weight → see recommended ml. Can accept or set custom. Optional activity level toggle.
  - **Screen 3 — Set interval + permission:** Choose reminder frequency (30m/1h/2h/custom). Before OS permission prompt, explain *why* notifications are needed. Graceful path if denied ("You can enable in Settings later").
- Dot indicators at bottom showing current screen (3 of 3)
- "Skip" link in top corner (goes to defaults)
- "Get Started" button on screen 3
- On completion: save goal + interval + `remindersActive: true` + `@plenty_onboarded: true`, then route to Home
- Onboarding choices persist — user lands on Home ready to go, heatmap initialized

**Files:**
- `screens/OnboardingScreen.js` (new — full 3-screen onboarding)
- `utils/storage.js` (edit — save onboarding choices)

**Status:** done — 3-screen swipeable flow with weight goal calculator, interval picker, permission request.

---

## Epic 5 — Quality Foundation

| Field | Value |
|-------|-------|
| **Priority** | SHOULD |
| **Theme** | Test infrastructure + notification reliability that keeps V2 from regressing |
| **Depends on** | Epic 1 (bug fixes must be in to test against) |
| **Build order** | 2nd |

### Objective

Establish the test suite, regression guards, and notification reliability that V2 needs. The app currently has zero tests — every manual bug fix is one regression away from being re-broken.

### Stories

#### 5.1 — Test infrastructure (jest-expo) ✅
**User Story:** As a developer, I want a test suite I can run with `npm test`, so I can catch regressions before they ship.

**Acceptance Criteria:**
- `jest-expo` configured with `@testing-library/react-native`
- `npm test` script in package.json
- `jest.config.js` created
- Coverage: storage unit tests (getSettings merges, saveSettings round-trips), notifications logic tests (`isInQuietHours`, `getEscalationTier`, interval safety), pattern tests (peak/lull detection), report aggregation, weight-based goal calculation

**Files:**
- `jest.config.js` (new)
- `package.json` (edit — test script)
- `__tests__/storage.test.js` (new)
- `__tests__/notifications.test.js` (new)
- `__tests__/patterns.test.js` (new)

**Status:** done — jest-expo configured, 70 tests across 6 suites, all passing via `npm test`.

---

#### 5.2 — Regression tests for Sprint 5 bugs ✅
**User Story:** As a developer, I want automated regression tests for both production bugs, so they never come back.

**Acceptance Criteria:**
- Interval persistence regression test: save interval → reload → assert same value
- Notification dedup regression test: concurrent `scheduleWaterReminder` calls assert one scheduled reminder

**Files:**
- `__tests__/regression.test.js` (new)

**Status:** done — existing tests fixed (assertion semantics) and runnable under jest-expo.

---

#### 5.3 — Notification reliability ✅
**User Story:** As a user, I want my reminders to survive app restarts and device reboots, so I don't miss hydration even if my phone restarts.

**Acceptance Criteria:**
- `remindersActive` flag persisted alongside `intervalMinutes` as source of truth
- On app launch: if `remindersActive` but no scheduled reminder exists, reschedule from saved interval
- Reboot survival: first-launch re-arm acts as safety net
- Permission edge cases: denied/blocked state shows "Open settings" deep link, Home warning banner stays in sync
- Cross-midnight quiet-hours math confirmed correct
- Notification channels created once, sound setting respected

**Files:**
- `utils/notifications.js` (edit — re-arm, permission handling, boot receiver)

**Status:** done — remindersActive flag persisted, re-arm logic on mount, permission deep-link, channels created once.

---

## Epic 6 — Mascot & Micro-interactions

| Field | Value |
|-------|-------|
| **Priority** | COULD |
| **Theme** | Delight and tactile feedback that makes the app feel polished |
| **Depends on** | Epic 7 (design tokens + reduced-motion) |
| **Build order** | 8th |

### Objective

The mascot gains idle animation and streak-awareness. Buttons feel tactile. Transitions smooth out. A log toast confirms every drink. These are the final polish layer before launch.

### Stories

#### 6.1 — Mascot idle animation + streak awareness
**User Story:** As a user, I want the mascot to feel alive — gently bobbing on screen, reacting to how well I'm doing.

**Acceptance Criteria:**
- Mascot has a gentle idle bob animation (Reanimated or existing Animated, ~2s loop)
- Expression previews streak state:
  - 0–6 days: neutral/happy
  - 7–29 days: happier
  - 30+ days: excited
  - At goal milestone celebrations: extra bounce
- Idle bob is layered on top of existing expression system (doesn't replace it)
- Respects reduced-motion setting (no bob when reduced motion enabled)
- Tap interaction still works (cycling expressions)

**Files:**
- `components/Mascot.js` (edit — idle bob, streak-aware expressions)

---

#### 6.2 — Press feedback + haptics
**User Story:** As a user, I want buttons to feel responsive — a subtle press-down and a gentle buzz — so every interaction feels tactile.

**Acceptance Criteria:**
- `PressableScale` wrapper: buttons scale to ~0.96 on press (spring back)
- `expo-haptics` impact feedback on:
  - Quick-log tap
  - Start/stop reminders
  - Amount picker selection
- Gated by Platform + reduced-motion setting

**Files:**
- `components/PressableScale.js` (new)
- `screens/HomeScreen.js` (edit — wrap key buttons)

---

#### 6.3 — Screen transitions + toast
**User Story:** As a user, I want screens to transition smoothly and every log to be confirmed instantly.

**Acceptance Criteria:**
- Tab switches have subtle fade animation
- Modal entrances (achievement popup, amount picker) have smooth scale-in
- Toast component: "+250ml logged" slides in from bottom on each log, auto-dismisses after 2s
- Toast is non-blocking (doesn't interrupt what user is doing)
- All transitions respect reduced-motion

**Files:**
- `components/Toast.js` (new)
- `App.js` (edit — navigator transitions)
- `components/AchievementPopup.js` (edit — refined entrance)
- `screens/HomeScreen.js` (edit — trigger toast on log)

---

#### 6.4 — Weekly chart entrance
**User Story:** As a user, I want the weekly chart bars to animate in, so even statistics feel alive.

**Acceptance Criteria:**
- Last-7-Days chart bars grow from 0 to value on mount/focus
- Staggered animation (each bar starts slightly after the previous)
- Total ~500ms for all bars to reach height

**Files:**
- `screens/LogScreen.js` (edit — bar entrance animation)

---

## Epic 7 — Design System

| Field | Value |
|-------|-------|
| **Priority** | COULD |
| **Theme** | Visual consistency across all screens |
| **Depends on** | Nothing |
| **Build order** | 7th |

### Objective

A screen-by-screen visual audit followed by applying consistent type, spacing, and elevation tokens across the app. This is the design foundation that V2.2 (iOS port) will inherit.

### Stories

#### 7.1 — Type + spacing tokens
**User Story:** As a developer, I want a shared type and spacing scale so every screen uses consistent sizing.

**Acceptance Criteria:**
- Type scale: `display / title / heading / body / label / caption` with size, weight, lineHeight
- Spacing scale: `xs 4 / sm 8 / md 12 / lg 16 / xl 24 / 2xl 32`
- Tokens exported from `constants/typography.js` and `constants/spacing.js`
- HomeScreen is the pilot — consumes new tokens

**Files:**
- `constants/typography.js` (new)
- `constants/spacing.js` (new)
- `screens/HomeScreen.js` (edit — replace inline values with tokens)

---

#### 7.2 — Structural color tokens
**User Story:** As a user, I want shadows and rounded corners to be consistent across every card and button.

**Acceptance Criteria:**
- `colors.js` adds: `radius` (sm/md/lg/pill), `elevation` (shadow presets 1–3 for light+dark)
- Shadows and radii come from tokens, not inline literals
- `ThemeContext` exposes new tokens

**Files:**
- `constants/colors.js` (edit — add radius + elevation)
- `context/ThemeContext.js` (edit — expose new tokens)

---

## Epic 8 — Play Store Launch

| Field | Value |
|-------|-------|
| **Priority** | MUST |
| **Theme** | Everything needed to publish `com.justine7417.plenty` to production |
| **Depends on** | All MUST epics complete |
| **Build order** | 9th (last) |

### Objective

Complete Play Store listing, privacy policy, build, and staged rollout. This is the final gate — nothing ships until it's all in order.

### Stories

#### 8.1 — Store listing assets
**User Story:** As a potential user browsing the Play Store, I want to see attractive screenshots and a clear description so I download the app.

**Acceptance Criteria:**
- Feature graphic (1024 × 500 px) designed
- 4–6 phone screenshots showing key screens:
  1. Home screen with water animation + streak heatmap
  2. Quick-log flow
  3. Achievements with rewards ladder
  4. Onboarding screen
  5. Settings screen
- Short description (~80 chars): "Plenty helps you build a daily hydration habit with streaks, rewards, and a beautiful water animation."
- Full description (~750 chars) covering: streak system, rewards ladder, water animation, goal calculator, weather-aware reminders, achievements, privacy (all local)

**Files:**
- `assets/store/` (new directory — screenshots, feature graphic)

---

#### 8.2 — Privacy policy
**User Story:** As a privacy-conscious user, I want to know my data stays on my device.

**Acceptance Criteria:**
- Privacy policy document hosted at a URL
- Content: "All data stays on your device — Plenty collects nothing, transmits nothing, has no analytics SDK, and stores all data locally in AsyncStorage. Location data is used solely for weather-based goal adjustments via Open-Meteo (no sharing, no storage)."
- Link from Settings screen ("Privacy Policy" row)
- Data safety declaration in Play Console: location (used for weather, not collected), no personal data collected, no data shared

**Files:**
- `screens/SettingsScreen.js` (edit — privacy policy link)

---

#### 8.3 — Production build + staged rollout
**User Story:** As a developer, I want to build and publish the production AAB with confidence.

**Acceptance Criteria:**
- VersionCode and version bumped in `app.json`
- Category: Health & Fitness
- Content rating: General (Everyone)
- `eas build --profile production` produces clean AAB
- AAB requests only expected permissions (no Health Connect)
- `eas submit` to internal testing track first
- Internal testers (existing Sprint 5 APK group) get V2 beta
- Staged rollout: 10% → monitor crash rate/uninstalls 48h → ramp to 100% over 1–2 weeks

**Files:**
- `app.json` (edit — version bump)
- `eas.json` (edit — profile confirmation)

---

---

## Epic 9 — Screen Redesign & UI Refresh

| Field | Value |
|-------|-------|
| **Priority** | SHOULD |
| **Theme** | Visual overhaul across all three main screens — fonts, layout, icons, personalization |
| **Depends on** | Nothing |
| **Build order** | 10th |

### Objective

Refresh the entire app's visual identity: migrate from Fredoka/Poppins to Bitrank (titles) and Creamy Chicken Zips (headers), redesign the HomeScreen layout (mascot spacing, slim glass, centered CTA, polished banners), overhaul LogScreen (personal greeting, date header, space-filling chart, streak banner redesign), and polish AchievementsScreen (personal greeting, reorder sections, proper icons). Every change is visual — no new features.

### Stories

#### 9.1 — Font migration (Bitrank + Creamy Chicken Zips)
**User Story:** As a user, I want the app to use the new custom fonts — Bitrank for big titles and Creamy Chicken Zips for headers — so the app feels more unique and friendly.

**Acceptance Criteria:**
- `Bitrank.otf` loaded at boot from `assets/fonts/Bitrank/Bitrank.otf`
- `Creamy_Chicken.otf` loaded at boot from `assets/fonts/Creamy_Chicken/Creamy_Chicken.otf`
- `constants/typography.js` updated:
  - `display`, `title` → use `"Bitrank"` (single-weight, uses fontWeight of the OTF)
  - `heading` → use `"Creamy_Chicken"` (single-weight)
  - `body`, `label`, `caption`, `small` → remain Poppins (unchanged)
- `App.js` font loading updated:
  - Remove `@expo-google-fonts/fredoka` and `@expo-google-fonts/poppins` imports
  - Load local OTF fonts via `useFonts` using `require()` paths

**Files:**
- `App.js` (edit — font loading)
- `constants/typography.js` (edit — font families)
- `assets/fonts/Bitrank/Bitrank.otf` (new — extracted from zip)
- `assets/fonts/Creamy_Chicken/Creamy_Chicken.otf` (new — extracted from zip)

---

#### 9.2 — DrinkSizePicker icon refresh (accurate water containers)
**User Story:** As a user, I want the drink size picker to show icons that actually look like the drink containers I use, so the visual matches reality.

**Acceptance Criteria:**
- All 6 drink options get accurate MaterialCommunityIcons instead of generic Ionicons
- Icon mapping for each size clearly communicates the container shape:
  - 100ml → `cup-water` (small glass)
  - 200ml → `glass-mug` (mug)
  - 250ml → `bottle-tonic` (standard glass)
  - 330ml → `bottle-soda` (can-shaped)
  - 500ml → `glass-tulip` (water bottle)
  - 750ml → `kettle` (large carafe)
- Import changed from `@expo/vector-icons/Ionicons` to `@expo/vector-icons/MaterialCommunityIcons`

**Files:**
- `components/DrinkSizePicker.js` (edit — icons + import)

---

#### 9.3 — HomeScreen redesign (mascot spacing, glass shape, banners, CTA)
**User Story:** As a user, I want the home screen to look tighter and more polished — mascot closer to the dialogue, a slimmer glass, refined banners, and the drink button centered.

**Acceptance Criteria:**
- Mascot and title/dialogue are brought closer together (reduce vertical gap between them)
- Glass SVG path is slimmed — narrower top-to-bottom silhouette (currently top margin 16%, bottom margin 26%)
- Fire streak on glass redesigned — current looks mismatched
- Warning (red) banner redesigned — no longer looks like a system error; app-grade design with the Plenty aesthetic
- Average/goal suggestion banner redesigned to match other banners visually
- "I drank water" button centered horizontally (currently left-aligned)
- All changes preserve dark mode, reduced-motion, and existing functionality

**Files:**
- `screens/HomeScreen.js` (edit)

---

#### 9.4 — LogScreen redesign (greeting, date header, space-filling chart, pagination)
**User Story:** As a user, I want the log screen to feel personal and show my data efficiently — greeting me by name, filling the space well, and giving me control over the log list.

**Acceptance Criteria:**
- Personalized greeting "Hello, [name]! This is your progress" at the top (requires name loaded from settings)
- Current date displayed on the left side of the header (reference: header(design).jpeg)
- Last 7 Days bar graph redesigned to fill available space better — taller bars, better spacing (reference: tracker.jpeg)
- Streak fire banner redesigned — clean look without raw emoji in text
- Streak history table corrected (proper spacing, aligned cells)
- Log list gets pagination/dropdown (show 10/25/50 entries at a time)
- `name` field added to `DEFAULT_SETTINGS` in `utils/storage.js`

**Files:**
- `screens/LogScreen.js` (edit)
- `utils/storage.js` (edit — add `name` field)

---

#### 9.5 — AchievementsScreen redesign (greeting, section order, icons, share)
**User Story:** As a user, I want the achievements screen to feel personal and polished — greeting me by name, showing achievements first, and using proper icons.

**Acceptance Criteria:**
- Personalized subtitle "Hey [name]! This is all your achievements"
- Section order reversed — achievements grid comes FIRST, streak rewards scroll moves BELOW
- All emoji in achievement cards replaced with icon components (MaterialCommunityIcons or Ionicons)
- Share button uses an icon instead of text label
- All changes preserve existing functionality, dark mode, and animations

**Files:**
- `screens/AchievementsScreen.js` (edit)

---

> **After Epic 9:** V2 is live. Rest. Then V2.1 (Adaptive Reminders) and V2.2 (iOS Parity) are the next tracked work.
