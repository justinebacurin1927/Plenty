@AGENTS.md

# Plenty 💧 — Project Context

A water drinking reminder app built with React Native + Expo.

## Stack
- React Native 0.83.6 / Expo SDK 55
- expo-notifications (local repeating notifications)
- @react-native-async-storage/async-storage
- @react-navigation/bottom-tabs
- expo-location (weather-aware reminders)
- expo-sharing / expo-file-system (data export)
- expo-document-picker (JSON backup import)

## Key Facts
- All local — no backend, no API keys, no push server
- Test via Expo Go on phone: `npx expo start` (or dev build for full notification support)
- 4 screens: Home (reminder controls), Log (drink history), Achievements, Settings
- Notifications repeat at user-selected interval (1m–2h, custom input supported)
- Quick-log button vibrates and saves 250ml per tap (long-press for custom amounts)
- Quiet hours setting suppresses notifications during sleep
- Notification action buttons: "💧 I drank!" and "Snooze 15m"
- Gentle escalation (warning at 2h, alert at 4h with stronger vibration)
- 12 achievements with popup celebration + gallery tab
- Mascot with 4 expressions, 4 variants (classic/cool/crown/super), celebration bounce animation
- Custom notification messages from 7 categories with context-aware picker
- Monthly reports with cached aggregation, quarterly trends, and natural language highlights
- Peak hour, lull detection, and day-of-week pattern analysis
- Weight-based goal calculator (kg × 0.033 formula) with activity boost
- Weather-aware reminders via Open-Meteo (heat-adjusted interval + advisory banner)
- CSV export, JSON backup & restore via share sheet


## File Map
- `App.js` — tab navigator setup
- `screens/HomeScreen.js` — reminder controls, progress, quick log, weather banner, peak time, goal suggestions
- `screens/LogScreen.js` — drink history, weekly chart, monthly report, pattern insights
- `screens/SettingsScreen.js` — sound, quiet hours, daily goal, drink size, weight calculator, activity toggle, location, export/import, message categories, mascot style
- `screens/AchievementsScreen.js` — achievement gallery grid
- `components/Mascot.js` — water droplet mascot with expressions, variants, celebration animation
- `components/AchievementPopup.js` — celebration modal with confetti
- `components/MonthlyReport.js` — collapsible report card with stats, highlights, quarterly trends
- `components/WeatherBanner.js` — heat advisory banner on Home screen
- `components/ErrorBoundary.js` — crash catcher
- `utils/notifications.js` — permission, schedule, cancel, escalation, response handler, weather adjustment
- `utils/storage.js` — AsyncStorage for logs, settings, achievements, monthly cache, export/import helpers
- `utils/achievements.js` — 12 achievement definitions + checker engine
- `utils/messages.js` — 30 messages in 7 categories + context-aware picker
- `utils/reports.js` — monthly/quarterly report generation + caching
- `utils/patterns.js` — peak hour, lull, day-of-week analysis
- `utils/weather.js` — Open-Meteo API, caching, heat adjustment
- `utils/export.js` — CSV/JSON export and import via share sheet
- `app.json` — Expo config with expo-notifications plugin
- `docs/SPRINT3.md` — Gamification & Motivation plan
- `docs/SPRINT4.md` — Insights & Intelligence plan
- `docs/SPRINT5.md` — Polish, Platform & Social plan
- `docs/SPRINT3_EPIC_A_DEEP_DIVE.md` — Epic A implementation breakdown

## Auto-Sync
- `.md` files in this project auto-copy to `~/Documents/Obsidian Vault/Plenty/` via post-tool-use hook
- Hook: `.claude/hooks/sync-md-to-vault.sh`
- Name mapping in the script handles project → vault filename differences
