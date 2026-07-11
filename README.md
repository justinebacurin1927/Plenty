<h1 align="center">💧 Plenty</h1>
<p align="center"><em>A water drinking reminder app built with React Native + Expo</em></p>

<p align="center">
  <img src="https://img.shields.io/badge/Expo-55-blue?logo=expo" alt="Expo SDK 55">
  <img src="https://img.shields.io/badge/React_Native-0.83-blue?logo=react" alt="React Native 0.83">
  <img src="https://img.shields.io/badge/status-active-brightgreen" alt="Status">
</p>

---

## ✨ Features

- **⏰ Smart reminders** — Repeating notifications with quiet hours, escalation (2h warning, 4h alert), and weather-aware interval adjustment on hot days
- **💧 Quick log** — Tap to log 250ml with haptic feedback, long-press for custom amounts, quick-log from notification action buttons
- **🎮 Gamification** — 12 achievements with popup celebration, mascot variants (unlock via achievements), streak tracking
- **📊 Monthly reports** — Auto-generated with glasses count, avg/day, best streak, goal hits, quarterly trends, natural language highlights
- **📈 Pattern analysis** — Peak drinking hours, lull period detection, day-of-week insights
- **🧮 Smart goal calculator** — Weight-based formula (kg × 0.033), activity boost toggle, adaptive goal suggestions
- **🌤️ Weather-aware** — Open-Meteo integration, heat advisory banner, automatic interval shortening on hot days
- **💾 Data export** — CSV export for spreadsheets, full JSON backup & restore with share sheet
- **🎨 Custom notifications** — Choose from 7 message categories (encouraging, funny, health facts, etc.) with context-aware picker
- **🤖 Animated mascot** — Water droplet character with 4 expressions, 4 styles, and celebration bounce

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
│   ├── HomeScreen.js       # Reminder controls, quick log, weather banner, peak time, goal suggestions
│   ├── LogScreen.js        # Drink history, weekly chart, monthly report, pattern insights
│   ├── AchievementsScreen.js # Achievement gallery grid
│   └── SettingsScreen.js   # Sound, quiet hours, goal calc, activity, export/import, messages, mascot
├── components/
│   ├── ErrorBoundary.js    # Crash catcher
│   ├── Mascot.js           # Water droplet mascot with expressions, variants, celebration
│   ├── AchievementPopup.js # Celebration modal with confetti
│   ├── MonthlyReport.js    # Collapsible report card with stats, highlights, quarterly trends
│   └── WeatherBanner.js    # Heat advisory banner on Home screen
├── utils/
│   ├── storage.js          # AsyncStorage (logs, settings, achievements, monthly cache)
│   ├── notifications.js    # Permission, schedule, cancel, escalation, weather adjustment
│   ├── achievements.js     # 12 achievement definitions + checker engine
│   ├── messages.js         # 30 messages in 7 categories + context-aware picker
│   ├── reports.js          # Monthly/quarterly report generation + caching
│   ├── patterns.js         # Peak hour, lull, day-of-week analysis
│   ├── weather.js          # Open-Meteo API, caching, heat adjustment
│   └── export.js           # CSV/JSON export and import via share sheet
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
- [x] Sprint 2 — Development build + real notifications
- [x] Sprint 3 — 🎮 Gamification & Motivation ([docs/SPRINT3.md](docs/SPRINT3.md))
- [x] Sprint 4 — 📊 Smarter Insights & Intelligence ([docs/SPRINT4.md](docs/SPRINT4.md))
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
