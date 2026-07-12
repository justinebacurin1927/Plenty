# Plenty

> A mobile water drinking reminder app built with React Native + Expo.
>
> Built: July 2026
> Purpose: Learning project — first mobile app, learning the full RN/Expo pipeline

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | React Native (0.83.6) |
| Expo SDK | 55 |
| Language | JavaScript (React) |
| Notifications | `expo-notifications` |
| Storage | `@react-native-async-storage/async-storage` |
| Navigation | `@react-navigation/native` + bottom tabs |
| Icons | `@expo/vector-icons` (Ionicons) |
| Weather | Open-Meteo (free API, no key) |
| Health | `react-native-health-connect` |
| Build | Expo Application Services (EAS) |
| Patches | `patch-package` |

## Hardware Spec (Dev Machine)

- **CPU:** Intel i3-1115G4 (4 threads)
- **RAM:** 7.5GB total (~2.7GB free for dev)
- **Disk:** 91GB free
- **OS:** Ubuntu 24.04 LTS

Runs comfortably — ~600MB RAM during active development. No emulator needed; test via Expo Go on your phone. Development builds (with native module support) via EAS.

## Project Structure

```
Projects/Plenty/
├── App.js                        # Root — bottom tab navigator, ThemeProvider, error handler
├── app.json                      # Expo config with plugins (notifications, health, widget, build props)
├── constants/
│   └── colors.js                 # Color tokens for light + dark themes
├── context/
│   └── ThemeContext.js           # Theme provider (system-follow, light, dark)
├── screens/
│   ├── HomeScreen.js             # Main screen: interval picker, start/stop, quick-log, progress
│   ├── LogScreen.js              # Drink history, weekly chart, monthly report, pattern insights
│   ├── AchievementsScreen.js     # Achievement gallery grid (tap to share)
│   └── SettingsScreen.js         # Theme, sound, quiet hours, goal calc, health sync, export
├── components/
│   ├── Mascot.js                 # Animated water droplet with 4 expressions, 4 variants
│   ├── AchievementPopup.js       # Celebration modal with confetti effect
│   ├── MonthlyReport.js          # Collapsible report card with stats, highlights, trends
│   ├── WeatherBanner.js          # Heat advisory banner
│   ├── ShareCard.js              # ViewShot card for sharing (streak + achievement modes)
│   └── ErrorBoundary.js          # Crash catcher
├── utils/
│   ├── storage.js                # AsyncStorage CRUD for logs, settings, achievements, cache
│   ├── notifications.js          # Permission, schedule, cancel, escalation, response handler
│   ├── achievements.js           # 12 achievement definitions + checker engine
│   ├── messages.js               # 30 messages in 7 categories + context-aware picker
│   ├── reports.js                # Monthly/quarterly report generation + caching
│   ├── patterns.js               # Peak hour, lull, day-of-week pattern analysis
│   ├── weather.js                # Open-Meteo API, caching, heat adjustment, advisory
│   ├── export.js                 # CSV/JSON export and import via share sheet
│   ├── health.js                 # Health Connect sync (read/write/permissions)
│   ├── share.js                  # Image capture and sharing utility
│   └── widget.js                 # JS bridge to Android home screen widget
├── modules/
│   └── plenty-widget/            # Local Expo module — Android AppWidget with Kotlin
├── plugins/
│   └── withPlentyWidget.js       # Config plugin for widget AndroidManifest entries
├── patches/
│   └── react-native-health-connect+3.5.3.patch
├── assets/                       # App icon, adaptive icons, splash, favicon
└── docs/                         # Sprint plans and documentation
```

## All Features

### Reminders & Notifications
- Repeating interval: 1m to 2h (custom input supported)
- Quiet hours: suppress notifications during sleep with start/end times
- Escalation: warning at 2h, alert at 4h with stronger vibration
- Weather-aware: heat advisory shortens reminder interval automatically (Open-Meteo)
- Context-aware messages: 7 categories with 30+ messages, picks by time/goal progress
- Quick-log from notification action button ("I drank!") + Snooze 15m

### Logging
- Quick-log: tap logs 250ml with haptic feedback, long-press for custom amounts
- Debounce: prevents double-logs within 500ms
- Daily progress: ML count, glass count, percentage toward goal
- Weekly chart: 7-day bar chart showing daily totals
- Auto-sync to Health Connect (optional toggle)

### Achievements (12 total)
| # | Name | Trigger |
|---|------|---------|
| 1 | First Drop | Log your first glass |
| 2 | Strong Start | Log 3 glasses in a day |
| 3 | On Fire | 7-day streak |
| 4 | Century | Reach 100 total glasses |
| 5 | Marathon | Log 30 glasses in a day |
| 6 | Early Bird | Log before 8 AM (10x) |
| 7 | Night Owl | Log after 10 PM (10x) |
| 8 | Week Warrior | Log every day for a week |
| 9 | Sharp Shooter | Hit goal exactly (no over/under) |
| 10 | Speed Demon | Respond to notification in <60s (10x) |
| 11 | Super Hydrated | Exceed 3x your goal in a day |
| 12 | Diamond | Unlock all other achievements |

### Mascot
- Animated water droplet character
- 4 expressions: happy, excited, reminding, sleepy (tap to cycle)
- 4 variants: classic, cool (sunglasses), crown, super (cape) — unlock via achievements
- Speech bubble with random messages
- Celebration bounce animation on achievement unlock

### Monthly Report
- Stats: total glasses, days active, avg/day, best streak
- Highlights: goal hit rate, biggest day, milestones
- Quarterly trends: up/down vs last month with percentage
- Pattern summary: peak hours, lulls, lowest day of week

### Dark Mode
- Auto (system-follow), Light, or Dark toggle in Settings
- Dark palette: navy-based (#0D1B2A bg, #1B2838 surface)
- Persists across app restarts

### Android Widget
- Home screen widget showing today's progress (ml), glasses count, streak
- Progress bar visualization
- Tap widget to open app
- Updates on every drink log via SharedPreferences bridge

### Health Connect (Android)
- Write hydration data to Health Connect on each log
- Read last 7 days on first sync
- Toggle in Settings with permission prompt
- Last sync timestamp indicator

### Social & Sharing
- Share streak card: streak count, weekly stats, motivational tagline
- Share achievement card: emoji, title, description
- Generates clean PNG image via ViewShot, shared via system share sheet

### Data Export
- CSV: all logs with timestamps and amounts, shared as file
- JSON backup: full data (logs + settings + achievements), shareable
- JSON restore: import from file with validation

## Screens

### Home
- Interval picker with presets and custom input
- Start/Stop reminders with permission handling
- Goal progress (ML + glasses + percentage)
- Quick-log button (tap/haptic 250ml, long-press custom)
- Weather banner with heat advisory
- Peak drinking time suggestion
- Goal suggestion card
- Streak badge with share button
- Escalation status indicator

### Log
- Today's entries in reverse-chronological FlatList
- Weekly bar chart
- Collapsible Monthly Report card
- Pattern insight summary
- Loading state while data loads
- Victory lap animation (full progress bar)

### Achievements
- 2-column gallery grid of all 12 achievements
- Locked/unlocked visual state with progress bars
- Tap unlocked achievement to share card
- Mascot with expression cycling
- Count: X/12 unlocked

### Settings
- Theme selection: Auto / Light / Dark
- Sound toggle for notifications
- Quiet hours (enable, start, end)
- Daily goal: ml input + glass count display
- Drink size: ml per glass
- Weight-based goal calculator (kg x 0.033)
- Activity boost toggle (+3 glasses)
- Message category selection (7 categories)
- Health Connect sync toggle
- Weather location (requires permission)
- Mascot variant selector (4 options)
- Data import (JSON) and export (CSV, JSON)
- Reset all data
- App version and build number

## Data Flow

### Notifications
```
User taps Start
  → requestPermission()
  → ensureChannels() (Android notification channels)
  → getEscalationTier() (checks time since last log)
  → getCachedWeather() (heat adjustment check)
  → isInQuietHours() (check sleep schedule)
  → pickMessage() (context-aware from 7 categories)
  → scheduleNotificationAsync({ interval, repeats: true })
```

### Storage Keys
```
@plenty_logs          — Array of { id, timestamp, amount }
@plenty_settings      — { intervalMinutes, sound, quietHours*, dailyGoal, ... }
@plenty_unlocked      — Array of achievement IDs
@plenty_progress      — { [achievementId]: { current, max } }
@plenty_monthly_*     — Cached monthly reports
@plenty_monthly_cache — Cached monthly aggregation
@plenty_weather_cache — Cached weather data (6h TTL)
@plenty_theme_pref    — "auto" | "light" | "dark"
@plenty_health_sync   — "true" | "false"
@plenty_widget        — Widget shared preferences
```

### Theme System
```
colors.js (light + dark tokens)
  → ThemeContext.js (detects system, stores pref)
    → useTheme() hook in every screen/component
      → makeStyles(colors) factory returns StyleSheet
```

## Development Build (APK)

```bash
cd ~/Projects/Plenty
npx eas build --platform android --profile development
```

The widget and Health Connect require native modules — they won't work in Expo Go. Build via EAS, download the APK, and install it. Supports side-loading on any Android device.

## Design Decisions

- **React Native + Expo** over Flutter or native: lower RAM usage, no emulator, known tooling
- **Local notifications** over push: no server, no Firebase, works offline
- **AsyncStorage** over SQLite: simpler for flat data (log entries + settings + cache)
- **FlatList on LogScreen** with reverse-chronological: user wants to see the most recent first
- **Bottom tab navigation** over stack: 4 peer-level screens, no deep hierarchy
- **Open-Meteo** over WeatherAPI/OpenWeather: no API key required
- **Custom local module** for widget over third-party: learning experience, full control
- **patch-package** for native module fixes: avoids waiting for upstream PRs
- **Ionicons** exclusively: consistent icon set, no emoji rendering across platforms

## Migrations / Notable Changes

- **Sprint 3**: Added mascot, achievements, streak tracking, custom messages (30 messages, 7 categories)
- **Sprint 4**: Added monthly reports, pattern analysis, smart goal calculator, weather integration
- **Sprint 5**: Added dark mode, Android widget, Health Connect sync, social sharing cards, performance optimization, icon/branding finalization

## Team

Initial planning session with:
- John — Product Manager
- Winston — Architect
- Sally — UX Designer
- Mary — Business Analyst
- Amelia — Senior Developer
