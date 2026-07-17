---
name: Plenty
description: A water drinking reminder app built with React Native + Expo
updated: 2026-07-15
---

# Plenty — Project Context

## Stack
- React Native 0.83.6 / Expo SDK 55
- expo-notifications (local repeating notifications)
- @react-native-async-storage/async-storage
- @react-navigation/bottom-tabs
- expo-location (weather-aware reminders)
- expo-sharing / expo-file-system (data export)
- expo-document-picker (JSON backup import)

## Architecture
- All local — no backend, no API keys, no push server
- 4 screens: Home (reminder controls), Log (drink history), Achievements, Settings
- Notifications repeat at user-selected interval (1m–2h, custom input supported)

## Current State
- Sprint 5 complete (Polish, Platform & Social)
- Sprint 6 planned (Harden & Ship — testing, notification reliability, onboarding, Play Store readiness)
- Standalone APK shipped to real users; two production bugs fixed (interval persistence, notification deduplication)

## Key Features
- Quick-log button: 250ml per tap (long-press for custom amounts)
- Quiet hours suppression
- Notification action buttons: drink/snooze
- Escalation: warning at 2h, alert at 4h
- 12 achievements with popup celebration
- Mascot: 4 expressions × 4 variants, celebration bounce
- Custom notification messages (7 categories, context-aware picker)
- Monthly/quarterly reports with pattern analysis (peak hour, lull, day-of-week)
- Weight-based goal calculator with activity boost
- Weather-aware reminders via Open-Meteo
- CSV export, JSON backup/restore

## Sprint Roadmap
- Sprint 1: Core reminder engine & notification scheduling
- Sprint 2: Dev build + real notifications
- Sprint 3: Gamification & motivation (achievements, mascot, messages)
- Sprint 4: Insights & intelligence (reports, patterns, weather)
- Sprint 5: Polish, platform & social (export, error boundaries, APK)
- Sprint 6: Harden & Ship (testing, notification reliability, onboarding, Play Store)
- Sprint 7: Community & social features
- Sprint 8: Advanced features
- Sprint 9: Growth & analytics
