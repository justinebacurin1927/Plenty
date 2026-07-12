# Sprint 5 — 🎨 Polish, Platform & Social

> **Goal:** Make the app feel premium. Dark mode, widgets, health integration, social features.
>
> **Theme:** Turn a functional app into something you're proud to show off.

---

## Why This Sprint

Sprints 1-4 built a complete, smart hydration app. Sprint 5 is about _craft_. Dark mode for late-night check-ins. A home screen widget so you don't even need to open the app. Health app sync so your data lives everywhere. And social features to share the journey.

This is also a "debt" sprint — performance optimization, accessibility, and code cleanup.

---

## Epic A — Dark Mode 🌗

### Epic A Tasks

| # | Task | Detail | Status |
|---|------|--------|--------|
| **A1** | Color system refactor | Extract all hardcoded colors into a theme object with light + dark palettes | ✅ |
| **A2** | Theme context | Create `ThemeContext` with system-follow detection and manual override | ✅ |
| **A3** | Light theme | Document and lock the current palette as the canonical light theme | ✅ |
| **A4** | Dark theme | Design a dark palette (dark navy base, cool tones, reduced contrast) | ✅ |
| **A5** | Theme toggle in Settings | Auto (follow system) / Light / Dark picker | ✅ |
| **A6** | Theme persistence | Save theme preference in AsyncStorage | ✅ |
| **A7** | All screens themed | Home, Log, Settings, Achievements — all switch cleanly | ✅ |
| **A8** | Navigation bar | Bottom tab bar adapts to dark theme | ✅ |
| **A9** | Splash screen | Dark-compatible splash/loading state | ❌ |

### Design Notes
- **Dark palette suggestion:** Background `#0D1B2A`, Surface `#1B2838`, Primary `#6BB5FF` (lighter blue for contrast), Text `#E0EAFF`
- Never use pure black (`#000`) — causes eye strain
- Mascot should be visible on both backgrounds
- Tab bar icons need a slight tint boost against dark backgrounds

---

## Epic B — Widget (Android) / Widget Considerations (iOS) 📱

### Epic B Tasks

| # | Task | Detail | Status |
|---|------|--------|--------|
| **B1** | Android home screen widget | Raw Android widget with Dev Build via Expo module + config plugin | ✅ |
| **B2** | Widget layout | Show: today's progress (ml), glasses count, streak, progress bar | ✅ |
| **B3** | Widget refresh | Update widget via SharedPreferences + broadcast on every drink log | ✅ |
| **B4** | Widget tap actions | Tap widget → open app to Home screen | ✅ |
| **B5** | Android Quick Settings tile | A tile that when tapped logs a drink without opening any app | ❌ |

### Widget Layout (Sketch)
```
┌──────────────────────────────┐
│  💧 Plenty                   │
│  ━━━━━━━━━━━━━━━━━━━━━━━━   │
│  5 / 8 glasses    🔥 7 days  │
│                              │
│  [ 💧 Log water ]            │
└──────────────────────────────┘
```

### Implementation Notes
- Widget support requires the Expo dev build (already set up)
- Use `expo-notifications` channel, not a separate service
- Widget state stored via AsyncStorage or a small native module bridge

---

## Epic C — Health App Sync (Apple Health / Google Fit) ❤️

### Epic C Tasks

| # | Task | Detail | Status |
|---|------|--------|--------|
| **C1** | Research health APIs | Check `expo-health-connect` for Google Fit / Health Connect on Android | ❌ |
| **C2** | Write hydration data | Log water intake to the platform's health store | ❌ |
| **C3** | Read previous data | On first sync, pull in water data from the last 7 days (if user used another app) | ❌ |
| **C4** | Sync toggle in Settings | Enable/disable health sync with platform permission prompt | ❌ |
| **C5** | Sync status indicator | Show last sync time, number of entries synced | ❌ |

### Android
- Use [Health Connect](https://developer.android.com/health-connect) via `expo-health-connect`
- Write `HydrationRecord` (type: water) with amount in liters
- Requires Health Connect app installed on phone

### iOS
- Apple Health via `HealthKit` — needs an Expo config plugin
- Write hydration samples to HKQuantityTypeIdentifierDietaryWater

---

## Epic D — Social & Sharing 📤

### Epic D Tasks

| # | Task | Detail | Status |
|---|------|--------|--------|
| **D1** | Share streak card | Generate an image showing streak + weekly stats, share via system share sheet | ❌ |
| **D2** | Share achievement | Share individual achievement cards ("I just unlocked 🏆 Century on Plenty!") | ❌ |
| **D3** | Streak card design | Clean, shareable design: app name, streak count, glasses this week, motivational line | ❌ |
| **D4** | Friend challenges (stretch) | Compare streaks with a friend via simple share-and-show — no backend | ❌ |

### Streak Card Design
```
┌──────────────────────────────┐
│  💧 PLENTY                   │
│                              │
│      🔥 12 DAYS              │
│    "Keep the streak alive!"  │
│                              │
│    This week: 48 glasses     │
│    Best day: Wednesday (9)   │
│                              │
│  ──────────────────────────  │
│  Get Plenty → link           │
└──────────────────────────────┘
```

---

## Epic E — Performance & Polish ⚡

### Epic E Tasks

| # | Task | Detail | Status |
|---|------|--------|--------|
| **E1** | FlatList optimization | Ensure Log screen uses proper `keyExtractor`, `getItemLayout`, remove anonymous renders | ❌ |
| **E2** | Debounce quick-log | Prevent double-tap logging the same drink twice in <500ms | ❌ |
| **E3** | Reduce re-renders | Memoize callbacks in HomeScreen, use `useMemo` for derived values | ❌ |
| **E4** | App icon & splash | Finalize app icon (already have one), add branded splash screen | ❌ |
| **E5** | Adaptive icon (Android) | Generate adaptive icon foreground + background layers for Android 13+ | ❌ |
| **E6** | Accessibility labels | Add `accessibilityLabel` to all interactive elements | ❌ |
| **E7** | Loading states | Show simple loading indicators on screens while AsyncStorage reads complete | ❌ |
| **E8** | Error handling audit | Review all `try/catch` blocks — are error messages user-friendly or just console logs? | ❌ |
| **E9** | App version in Settings | Show current version + build number (link to this sprint's release) | ❌ |

---

## Epic F — Code De-fragmentation 🧹

### Epic F Tasks

| # | Task | Detail | Status |
|---|------|--------|--------|
| **F1** | Shared styles | Extract repeated styles (row, card, button, chip) into a shared style object or constants file | ❌ |
| **F2** | Color constants | Move all hex colors into `constants/colors.js` (feeds into Dark Mode) | ❌ |
| **F3** | Remove dead imports | Scan for unused imports, dead code paths, orphan console.log statements | ❌ |
| **F4** | Standardize error handling | Consistent pattern: log to console via logger, show user-friendly toast for actionable errors | ❌ |
| **F5** | Component audit | Can any screen's inline sub-UI be cleanly extracted into a reusable component? | ❌ |

---

## Files Changed / Created

| File | Action |
|------|--------|
| `constants/colors.js` | **New** — all color tokens for light + dark themes |
| `context/ThemeContext.js` | **New** — theme provider with system-follow + manual override |
| `App.js` | **Edit** — wrap in ThemeProvider, tab bar uses theme colors |
| `screens/HomeScreen.js` | **Edit** — adopt theme colors via useTheme() |
| `screens/LogScreen.js` | **Edit** — adopt theme colors |
| `screens/SettingsScreen.js` | **Edit** — adopt theme, add Auto/Light/Dark theme picker |
| `screens/AchievementsScreen.js` | **Edit** — adopt theme colors |
| `components/Mascot.js` | **Edit** — speech bubble uses theme surface/text colors |
| `components/MonthlyReport.js` | **Edit** — adopt theme colors |
| `components/WeatherBanner.js` | **Edit** — adopt theme colors |
| `components/AchievementPopup.js` | **Edit** — adopt theme colors |
| `utils/storage.js` | **Edit** — add getThemePreference / saveThemePreference |

---

## Success Criteria

- [x] Dark mode applies to all screens and adapts instantly on toggle
- [x] Theme preference persists across app restarts
- [ ] Android widget shows live data and quick-log works from widget
- [ ] Health Connect writes are visible in Google Fit / Health Connect app
- [ ] Share card generates as a clean image
- [ ] Quick-log is debounced (no double-logs)
- [ ] FlatList scrolls smoothly with no jank on 500+ log entries
- [ ] All interactive elements have accessibility labels
- [ ] App launches without warnings about unused imports or missing keys
