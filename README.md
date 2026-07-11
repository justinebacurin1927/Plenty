<h1 align="center">💧 Plenty</h1>
<p align="center"><em>A water drinking reminder app built with React Native + Expo</em></p>

<p align="center">
  <img src="https://img.shields.io/badge/Expo-55-blue?logo=expo" alt="Expo SDK 55">
  <img src="https://img.shields.io/badge/React_Native-0.83-blue?logo=react" alt="React Native 0.83">
  <img src="https://img.shields.io/badge/status-active-brightgreen" alt="Status">
</p>

---

## ✨ Features

- **⏰ Repeating reminders** — Notifications every 15m / 30m / 45m / 1h / 2h
- **💧 Quick log** — Tap "I drank water" to log 250ml with haptic feedback
- **📊 Today's progress** — See your glass count at a glance
- **📋 Drink history** — Full day log with timestamps
- **🌙 Quiet hours** — Suppress notifications during sleep
- **🔧 Dev Logs** — In-app console viewer for debugging

## 📸 Screenshots

| Home | Log | Settings | Dev Logs |
|------|-----|----------|----------|
| *coming soon* | *coming soon* | *coming soon* | *coming soon* |

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Expo Go](https://expo.dev/go) on your phone (Android or iOS)
- Or: [Android Studio](https://developer.android.com/studio) for emulator

### Install

```bash
git clone https://github.com/justinebacurin1927/Plenty.git
cd Plenty
npm install
```

### Run

```bash
npx expo start
```

Scan the QR code with **Expo Go** (Android) or the **Camera** app (iOS).

> **Note:** Push notifications don't work in Expo Go on Android SDK 53+. See [development builds](#-development-build) for full notification support.

## 🏗️ Project Structure

```
Plenty/
├── App.js                  # Root navigator (bottom tabs)
├── app.json                # Expo configuration
├── screens/
│   ├── HomeScreen.js       # Reminder controls + quick log
│   ├── LogScreen.js        # Today's drink history
│   ├── AchievementsScreen.js # Achievement gallery
│   └── SettingsScreen.js   # Sound, quiet hours, reset
├── components/
│   ├── ErrorBoundary.js    # Crash catcher
│   ├── Mascot.js           # Water droplet mascot
│   └── AchievementPopup.js # Celebration modal
├── utils/
│   ├── storage.js          # AsyncStorage (logs + settings)
│   ├── notifications.js    # Notification helpers
│   ├── achievements.js     # Achievement definitions + checker
│   └── messages.js         # Notification message pool
├── assets/                 # Icons, splash screen
└── docs/                   # Sprint plans and documentation
    ├── SPRINT2.md
    ├── SPRINT3.md
    ├── SPRINT4.md
    ├── SPRINT5.md
    └── SPRINT3_EPIC_A_DEEP_DIVE.md
```

## 🧪 Development Build

For **real notifications** (sound + vibration on Android), you need a development build APK instead of Expo Go.

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform android --profile development
npx expo start --dev-client
```

See [`docs/SPRINT2.md`](docs/SPRINT2.md) for the full roadmap.

## 📋 Roadmap

- [x] Sprint 1 — Core app (logging, settings, dev logs)
- [x] Sprint 2 — Development build + real notifications ([docs/SPRINT2.md](docs/SPRINT2.md))
- [x] Sprint 3 — 🎮 Gamification & Motivation ([docs/SPRINT3.md](docs/SPRINT3.md))
- [ ] Sprint 4 — 📊 Smarter Insights & Intelligence ([docs/SPRINT4.md](docs/SPRINT4.md))
- [ ] Sprint 5 — 🎨 Polish, Platform & Social ([docs/SPRINT5.md](docs/SPRINT5.md))

## 🛠️ Built With

- [React Native](https://reactnative.dev/) — Framework
- [Expo](https://expo.dev/) — Toolchain
- [expo-notifications](https://docs.expo.dev/versions/latest/sdk/notifications/) — Local repeating notifications
- [AsyncStorage](https://react-native-async-storage.github.io/async-storage/) — Persistent storage
- [React Navigation](https://reactnavigation.org/) — Bottom tab navigation
- [@expo/vector-icons](https://docs.expo.dev/guides/icons/) — Ionicons

## 📄 License

MIT
