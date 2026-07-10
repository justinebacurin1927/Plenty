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
- 3 screens: Home (reminder controls), Log (drink history), Settings
- Notifications repeat at user-selected interval (15m–2h)
- Quick-log button vibrates and saves 250ml per tap
- Quiet hours setting suppresses notifications during sleep

## File Map
- `App.js` — tab navigator setup
- `screens/HomeScreen.js`, `screens/LogScreen.js`, `screens/SettingsScreen.js`
- `utils/notifications.js` — permission, schedule, cancel
- `utils/storage.js` — AsyncStorage for logs + settings
- `app.json` — Expo config with expo-notifications plugin
- `DOCUMENTATION.md` — full planning and design doc
