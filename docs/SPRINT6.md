# Sprint 6 — Harden & Ship

> **Goal:** Turn the shared preview APK into a trustworthy, publishable app.
> Lock in reliability with a real test suite, make notifications survive the
> real world, add a first-run experience, and complete Play Store readiness.
> **Status:** Planned

---

## Why This Sprint

Sprints 1–5 built a feature-rich app; Sprint 5 shipped a standalone APK to real
users. Within a day of real use, two production bugs surfaced:

1. The reminder interval reset to 30 min on every restart (never persisted).
2. Reminders fired every 5 min and duplicated (escalation cap + a scheduling race).

Both are now fixed — but nothing stops them from regressing, because the project
has **no tests, no lint, no CI**. Before adding more features or publishing, the
app needs to *stay* fixed and behave under real-world conditions (reboots, denied
permissions, cold starts). This sprint hardens the foundation and prepares the
Play Store launch. No net-new user features.

---

## Epic A — Test Foundation & Regression Guards

Establish `jest-expo` and lock in the bugs just fixed so CI catches any regression.

### Epic A Tasks

| # | Task | Detail | Status |
|---|------|--------|--------|
| A1 | Configure jest-expo | Add `jest-expo`, `@testing-library/react-native`, jest config + `test` script to `package.json` | ⬜ Planned |
| A2 | Storage unit tests | `getSettings` merges `DEFAULT_SETTINGS`; `saveSettings` round-trips; mock AsyncStorage | ⬜ Planned |
| A3 | **Regression: interval persistence** | Save an interval → reload → same value (guards the 30-min bug) | ⬜ Planned |
| A4 | Notifications logic tests | `isInQuietHours`, `minutesUntil`, `getEscalationTier` tiers, and that a chosen interval is **not** shortened to 5 min | ⬜ Planned |
| A5 | **Regression: schedule dedupe** | Concurrent `scheduleWaterReminder` calls leave exactly one repeating reminder | ⬜ Planned |
| A6 | Pure-logic tests | `patterns` (peak/lull), `reports` aggregation, `weightBasedGoal` | ⬜ Planned |

---

## Epic B — Notification Reliability

Make reminders survive reboots, cold starts, and permission edge cases.

### Epic B Tasks

| # | Task | Detail | Status |
|---|------|--------|--------|
| B1 | Persist "reminders active" intent | Store `remindersActive` flag alongside `intervalMinutes`; source of truth for re-arming | ⬜ Planned |
| B2 | Re-arm on launch | On app open, if `remindersActive` but no scheduled reminder exists, reschedule from saved interval | ⬜ Planned |
| B3 | Reboot survival | Verify `RECEIVE_BOOT_COMPLETED` behavior; re-arm on first launch after reboot as a safety net | ⬜ Planned |
| B4 | Permission edge cases | Handle denied/blocked state; "Open settings" deep link; keep the Home warning banner in sync | ⬜ Planned |
| B5 | Quiet-hours + channel audit | Confirm cross-midnight math, first-reminder-after-quiet-hours timing, channels created once, sound setting respected | ⬜ Planned |

---

## Epic C — First-Run Onboarding & Permission Priming

A new user currently lands on a cold Home screen with no context and a raw OS
permission prompt. Give them a guided start.

### Epic C Tasks

| # | Task | Detail | Status |
|---|------|--------|--------|
| C1 | First-run detection | `@plenty_onboarded` flag in storage; route to onboarding when absent | ⬜ Planned |
| C2 | Intro flow (3 slides) | What Plenty does → set daily goal → set reminder interval | ⬜ Planned |
| C3 | Permission priming | Explain *why* before the OS prompt; graceful path if denied | ⬜ Planned |
| C4 | Persist onboarding choices | Save goal + interval + `remindersActive`, then land on Home ready to go | ⬜ Planned |

---

## Epic D — Play Store Readiness

Everything needed to publish `com.justine7417.plenty` to production.

### Epic D Tasks

| # | Task | Detail | Status |
|---|------|--------|--------|
| D1 | Store listing assets | Feature graphic (1024×500), 4–6 phone screenshots, short + full description | ⬜ Planned |
| D2 | Privacy policy | "All data stays on your device" statement; hosted URL; link from Settings | ⬜ Planned |
| D3 | Data safety declaration | Play Console form: location used for weather, no data shared/collected | ⬜ Planned |
| D4 | Version & metadata | Bump `versionCode`/`version`, set category, content rating questionnaire | ⬜ Planned |
| D5 | Production build + submit | `eas build --profile production` (AAB) → `eas submit` to internal testing track | ⬜ Planned |

---

## Epic E — Bug Bash & Dead-Code Removal

Reduce attack surface and remove ship-blockers before review.

### Epic E Tasks

| # | Task | Detail | Status |
|---|------|--------|--------|
| E1 | **Purge Health Connect** | Remove `expo-health-connect`, `react-native-health-connect`, `utils/health.js`, `modules/plenty-health/`, and the autolink patch; confirm the built APK requests **no** Health permissions | ⬜ Planned |
| E2 | Dependency + config audit | `npx expo-doctor`; drop any other unused deps | ⬜ Planned |
| E3 | Edge-case bug bash | Day-boundary/timezone in logs, empty states, long log lists, malformed import JSON | ⬜ Planned |
| E4 | Error-path audit | Notification failures, storage errors, permission denials all fail gracefully (no crashes) | ⬜ Planned |
| E5 | Accessibility pass | Labels, dark-mode contrast, dynamic font sizes | ⬜ Planned |

---

## Files (planned to change / add)

- **Add:** `jest.config` (or `package.json` jest field), `__tests__/` (storage, notifications, patterns, reports)
- **Add:** `screens/OnboardingScreen.js`, first-run routing in `App.js`
- **Add:** `screens/PrivacyPolicyScreen.js` (or Settings link)
- **Edit:** `utils/notifications.js` (re-arm on launch, permission-denied handling)
- **Edit:** `utils/storage.js` (`remindersActive`, `@plenty_onboarded`)
- **Edit:** `screens/HomeScreen.js` / `screens/SettingsScreen.js` (permission state, policy link)
- **Remove:** `utils/health.js`, `modules/plenty-health/`, health deps + patch
- **Edit:** `app.json` / `package.json` (version bump, dependency cleanup)

---

## Success Criteria

- `npm test` runs green, including regression tests for both Sprint 5 field bugs.
- Reminders re-arm correctly after app kill and device reboot.
- A denied notification permission never leaves the app in a broken/silent state.
- A first-time user reaches an active reminder without touching raw OS prompts unguided.
- Built production AAB requests only expected permissions (no Health Connect).
- Play Store internal-testing track has a complete listing, privacy policy, and data-safety form.

---

## Out of Scope (future sprints)

- iOS parity (notifications, WidgetKit widget, App Store) — planned as Sprint 9.
- Adaptive/"smarter" reminders v2.
- Cloud sync or any backend — the app stays local-only by design.
