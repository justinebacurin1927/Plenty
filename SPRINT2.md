# Sprint 2 — Development Build & Notifications

> **Goal:** Ship a development build APK that enables real notification reminders (sound, vibration, repeat).
> **Status:** ✅ Complete

---

## Why Sprint 2 Exists

Sprint 1 delivered a working React Native app in Expo Go. The app logs drinks, shows history, and has settings — but **notifications are dead** because Expo Go on Android SDK 53+ dropped push notification support. The `expo-notifications` module can't initialize at all in that environment.

Sprint 2 moves the app out of Expo Go into a **development build**, where native modules run for real.

---

## Progress

### Epic A — Development Build

| Task | Detail | Status |
|---|---|---|
| **A1. Install EAS CLI** | `npm install -g eas-cli` | ✅ Done |
| **A2. Log in to Expo account** | `eas login` | ✅ Done (`justine7417`) |
| **A3. Configure `eas.json`** | Build profile for Android dev builds | ✅ Done |
| **A4. Build dev APK** | `eas build --platform android --profile development` | ✅ Done |
| **A5. Install on phone** | APK downloaded and sideloaded | ✅ Done |
| **A6. Verify dev build works** | `npx expo start --dev-client` — app loads from APK | ✅ Done |

### Epic B — Notifications

| Task | Detail | Status |
|---|---|---|
| **B1. Clean up lazy-load stubs** | Removed `isExpoGo` guards, dynamic imports, lazy loader | ✅ Done |
| **B2. Custom intervals** | Custom input supporting `30s`, `5m`, `2h` format | ✅ Done |
| **B3. Quiet hours** | Scheduler checks quiet hours, delays if in range | ✅ Code done — not explicitly tested |
| **B4. Tap-to-open** | Notification tap opens app | ✅ Tested |

### Epic C — Data Persistence

| Task | Detail | Status |
|---|---|---|
| **C1. Logs survive restart** | AsyncStorage works in dev build | ✅ Working |
| **C2. Settings survive restart** | Interval, quiet hours, sound all retained | ✅ Working |

### Epic D — Polish ✅

| Task | Detail | Status |
|---|---|---|
| **D1. Remove Dev Logs tab** | Hidden from user-facing app | ✅ Done |
| **D2. Daily goal progress** | Progress bar with X/Y glasses + "Goal reached!" | ✅ Done |
| **D3. Fire streak** | 🔥 N days streak badge on Home | ✅ Done |
| **D4. Custom drink amounts** | Long-press → pick 100/200/250/500ml | ✅ Done |
| **D5. Weekly stats** | 7-day bar chart on Log screen | ✅ Done |

---

## What Changed

### `notifications.js`
- Direct `import * as Notifications from "expo-notifications"` — no more lazy loader
- `scheduleWaterReminder(intervalSeconds, quietHoursSettings)` — accepts seconds, quiet hours
- Quiet hours checked at schedule time
- `sound: "default"` removed (Android channel handles it)
- `shouldShowAlert` → `shouldShowBanner` (deprecation fix)

### `HomeScreen.js`
- Custom interval input parser — `30s`, `5m`, `2h`, `90s`, etc.
- Minimum 60s guard (Android repeating notification requirement)
- Presets updated to include 1m and 5m
- Progress bar showing today's ml / goal ml with percentage fill
- 🔥 Streak badge (consecutive days hitting goal)
- Long-press "I drank water" → bottom sheet to pick drink amount
- Auto-refreshes when tab is focused (loads latest streak/goal/data)

### `LogScreen.js`
- Weekly bar chart showing last 7 days of drink totals
- Today's bar highlighted in blue

### `SettingsScreen.js`
- "Daily Goal" row — pick 6, 8, 10, or 12 glasses
- "Drink Size" row — pick 100, 200, 250, or 500ml

### `App.js`
- Dev Logs tab removed from navigator

### `storage.js`
- Added `getLogsForDate()`, `getLastWeekLogs()`, `getDailyTotals()`, `getStreak()`
- Added `dailyGoal` and `drinkAmount` to default settings

### Files created
- `eas.json` — EAS build profiles for development/preview/production
- `qr-dev-client.png` — QR code for Metro connection
