@AGENTS.md

# Plenty 💧 — Project Context

A water drinking reminder app built with React Native + Expo.

## Stack
- React Native 0.86.0 / Expo SDK 57
- expo-notifications (local repeating notifications)
- @react-native-async-storage/async-storage
- @react-navigation/bottom-tabs

## Key Facts
- All local — no backend, no API keys, no push server
- Test via Expo Go on phone: `npx expo start`
- 4 screens: Home (reminder controls), Log (drink history), Achievements, Settings
- Notifications repeat at user-selected interval (1m–2h, custom input supported)
- Quick-log button vibrates and saves 250ml per tap (long-press for custom amounts)
- Quiet hours setting suppresses notifications during sleep
- Notification action buttons: "💧 I drank!" and "Snooze 15m"
- Gentle escalation (warning at 2h, alert at 4h with stronger vibration)
- 12 achievements with popup celebration + gallery tab

## File Map
- `App.js` — tab navigator setup
- `screens/HomeScreen.js`, `screens/LogScreen.js`, `screens/SettingsScreen.js`
- `utils/notifications.js` — permission, schedule, cancel
- `utils/storage.js` — AsyncStorage for logs + settings
- `app.json` — Expo config with expo-notifications plugin
- `DOCUMENTATION.md` — full planning and design doc
- `SPRINT3.md` — Gamification & Motivation plan
- `SPRINT4.md` — Insights & Intelligence plan
- `SPRINT5.md` — Polish, Platform & Social plan
- `SPRINT3_EPIC_A_DEEP_DIVE.md` — Epic A implementation breakdown

## Auto-Sync
- `.md` files in this project auto-copy to `~/Documents/Obsidian Vault/Plenty/` via post-tool-use hook
- Hook: `.claude/hooks/sync-md-to-vault.sh`
- Name mapping in the script handles project → vault filename differences
