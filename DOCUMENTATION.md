# Plenty 💧

> A mobile water drinking reminder app built with React Native + Expo.
>
> Built: July 2026
> Purpose: Learning project — first mobile app, learning the full RN/Expo pipeline

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | React Native (0.86.0) |
| Expo SDK | ~57.0.4 |
| Language | JavaScript |
| Notifications | `expo-notifications` |
| Storage | `@react-native-async-storage/async-storage` |
| Navigation | `@react-navigation/native` + bottom tabs |
| Icons | `@expo/vector-icons` (Ionicons) |

## Hardware Spec (Dev Machine)

- **CPU:** Intel i3-1115G4 (4 threads)
- **RAM:** 7.5GB total (~2.7GB free for dev)
- **Disk:** 91GB free
- **OS:** Ubuntu 24.04 LTS

Runs comfortably — ~600MB RAM during active development. No emulator needed; test via Expo Go on your phone.

## Project Structure

```
Projects/Plenty/
├── App.js                    # Root — bottom tab navigator (Home, Log, Settings)
├── app.json                  # Expo config + expo-notifications plugin
├── package.json
├── screens/
│   ├── HomeScreen.js         # Main screen: interval picker, start/stop, quick-log
│   ├── LogScreen.js          # Today's drink history (newest first)
│   └── SettingsScreen.js     # Sound toggle, quiet hours, reset data
└── utils/
    ├── notifications.js      # Permission, schedule, cancel, tap handler
    └── storage.js            # AsyncStorage CRUD for logs + settings
```

## Screens

### Home
- **Interval picker** — 15m / 30m / 45m / 1h / 2h presets
- **Start Reminders** — requests notification permission, schedules repeating notification
- **Stop Reminders** — cancels all scheduled notifications
- **Today's count** — glasses logged so far
- **I Drank Water** — quick-log button (250ml per tap, vibrates on press)
- **Permission warning** — shown if notifications are denied

### Log
- Lists today's log entries with time and index number
- `useFocusEffect` — auto-refreshes when tab is selected
- Empty state with friendly message

### Settings
- **Sound** toggle — on/off for notification sound
- **Quiet Hours** toggle — mute notifications during sleep (timestamps shown)
- **Reset All Data** — clears logs and resets settings (with confirmation alert)
- App version and build info in footer

## Data Flow

### Notifications
```
User taps Start
  → requestPermission()
  → scheduleNotificationAsync({ seconds: interval * 60, repeats: true })
  → OS fires notification every N minutes
User taps Stop
  → cancelAllScheduledNotificationsAsync()
```

### Storage
```
logs:  Array of { id, timestamp, amount }
settings: { intervalMinutes, sound, quietHoursEnabled,
            quietHoursStart, quietHoursEnd }
```

All persisted via AsyncStorage under `@plenty_logs` and `@plenty_settings` keys.

## Running the App

```bash
cd ~/Projects/Plenty
npx expo start
# Scan QR code in Expo Go app on your phone
```

No build tools, no emulator needed.

## Dependencies Added

- `expo-notifications` — local notifications
- `@react-native-async-storage/async-storage` — persistent storage
- `@react-navigation/native` + `@react-navigation/bottom-tabs` — tab navigation
- `react-native-screens` + `react-native-safe-area-context` — nav prerequisites
- `@expo/vector-icons` — Ionicons for tab bar and UI

## What's Not Built (Intentional)

- No backend, no server, no API keys
- No authentication
- No cross-device sync
- No analytics/tracking
- No database (local only)
- No push notification server — just local repeating notifications

## Design Decisions

- **React Native + Expo** over Flutter or native: lower RAM usage, no emulator, known tooling
- **Local notifications** over push: no server, no Firebase, works offline
- **AsyncStorage** over SQLite: simpler for flat data (log entries + settings)
- **FlatList on LogScreen** with reverse-chronological: user wants to see the most recent first
- **Bottom tab navigation** over stack: 3 peer-level screens, no deep hierarchy

## Team

Initial planning session with:
- 👔 John — Product Manager
- 🏛️ Winston — Architect
- 🎨 Sally — UX Designer
- 📊 Mary — Business Analyst
- 💻 Amelia — Senior Developer

## Next Steps (Ideas for Later)

- [ ] Set custom interval (not just presets)
- [ ] Track daily/weekly streaks
- [ ] Different drink sizes (cup, bottle, etc.)
- [ ] Custom notification messages
- [ ] Gentle escalation if you haven't logged in a while
- [ ] Widget (iOS) / Tile (Android)
