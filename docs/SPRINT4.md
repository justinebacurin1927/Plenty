# Sprint 4 — 📊 Smarter Insights & Intelligence

> **Goal:** Turn raw logs into meaningful insights. Make the app smart about you.
>
> **Theme:** The app learns your patterns and adapts — it doesn't just remind you.

---

## Why This Sprint

Sprint 3 made the app fun. Sprint 4 makes it _smart_. You've been logging drinks (hopefully!) — now let's surface patterns, set smarter goals, and make the app aware of context like weather and activity.

Unlike Sprint 3's new user-facing screens, a lot of this sprint is data processing and background smarts. The visible output is richer stats and a more personalized experience.

---

## Epic A — Monthly & Quarterly Reports 📈

### Epic A Tasks

| # | Task | Detail | Status |
|---|------|--------|--------|
| **A1** | Monthly report generator | Aggregate logs into key metrics: avg glasses/day, total ml, streak days, best day | ✅ |
| **A2** | Report storage | Cache last 3 monthly reports in AsyncStorage so they load instantly | ✅ |
| **A3** | Report card on Log screen | Collapsible summary section showing "This Month" stats above the weekly chart | ✅ |
| **A4** | Quarterly trends | 3-month comparison: "You averaged 6.2 glasses/day this month vs 5.8 last month" | ✅ |
| **A5** | Highlight callouts | Natural language highlights: "🔥 Best streak ever: 12 days!" / "☀️ Most hydrated day: July 8" | ✅ |
| **A6** | Monthly share card | Generate a shareable image/status card | 🥈 Sprint 5 |

### Example Monthly Summary
```
📊 June 2026 — In Review

🥤 248 glasses logged (62,000 ml)
📆 28 days with at least 1 glass
🔥 Best streak: 12 days (June 3-14)
⭐ Average: 8.9 glasses/day
🏆 Goal met: 19 out of 30 days
☀️ Peak hour: 2-4 PM
🍃 Lowest day: June 21 (3 glasses)
```

### Storage
```json
@plenty_monthly_cache: {
  "2026-07": { totalGlasses, totalMl, daysActive, avgPerDay, bestStreak, goalHits, peakHour },
  "2026-06": { ... },
  "2026-05": { ... }
}
```

---

## Epic B — Peak Hydration Time & Pattern Analysis 🕐

### Epic B Tasks

| # | Task | Detail | Status |
|---|------|--------|--------|
| **B1** | Hourly aggregation | Group logs by hour of day across all history to find peak drinking times | ✅ |
| **B2** | Peak time display | Show "You drink most between X-Y" on Home screen or Log screen | ✅ |
| **B3** | Lull detection | Find times of day where user consistently misses drinking (e.g., 2-4 PM slump) | ✅ |
| **B4** | Smart reminder boost | Display lull periods in Settings with insight section | ✅ |
| **B5** | Day-of-week patterns | "You tend to drink less on Sundays" — visible on weekly chart | ✅ |

### Pattern Detection
```
Peak hours:   2-4 PM (strong), 10-11 AM (moderate)
Lull periods: 3-5 PM (user logs 60% less than peak)
 → Suggestion: Add a reminder at 3:30 PM during lull window
``` 

---

## Epic C — Goal Intelligence 🧮

### Epic C Tasks

| # | Task | Detail | Status |
|---|------|--------|--------|
| **C1** | Weight-based goal calculator | New Settings row: input weight (kg/lbs) → daily goal = weight × 0.033 (liters) | ✅ |
| **C2** | Activity adjustment | Toggle "I exercised today" — boosts goal by 500-1000ml | ✅ |
| **C3** | Goal suggestions | If user consistently hits goal, suggest increasing it. If consistently misses, suggest decreasing. | ✅ |
| **C4** | Weekly goal review | End-of-week summary — implicitly covered by weekly chart + monthly report | ✅ |

### Goal Calculation Reference
```
Weight-based formula:
  Body weight (kg) × 0.033 = daily liters
  Example: 70kg → 2.31L ≈ 9 glasses of 250ml

Activity adjustment:
  +500ml for light exercise
  +1000ml for intense workout
```

---

## Epic D — Weather-Aware Reminders 🌤️

### Epic D Tasks

| # | Task | Detail | Status |
|---|------|--------|--------|
| **D1** | Weather data source | Use free API (Open-Meteo) — no API key needed, just lat/lon | ✅ |
| **D2** | Location permission | Request coarse location once per session (not persistent tracking) | ✅ |
| **D3** | Heat adjustment | On hot days (>30°C / 86°F), increase reminder frequency by reducing interval | ✅ |
| **D4** | Weather notification | "☀️ It's 34°C today — drink extra water!" banner on Home screen | ✅ |
| **D5** | Fallback (no location) | If location denied, user can manually set city or zip code in Settings | ✅ |

### Implementation Notes
- **API:** Open-Meteo (https://open-meteo.com/) — free, no key, CORS-friendly
- **Frequency:** Check weather once daily at first app open; cache response for 6 hours
- **Privacy:** Only request coarse location, never send location off-device except to Open-Meteo
- **Modularity:** Weather logic in `utils/weather.js`, fully optional (missing permission = graceful fallback)

---

## Epic E — Data Export & Backup 💾

### Epic E Tasks

| # | Task | Detail | Status |
|---|------|--------|--------|
| **E1** | CSV export | Write all logs to CSV with columns: date, time, amount, day-of-week | ✅ |
| **E2** | Share sheet | Use `expo-sharing` to share the exported CSV file | ✅ |
| **E3** | JSON backup | Full export including settings and achievements as JSON | ✅ |
| **E4** | Import JSON | Restore from a previously exported JSON backup | ✅ |
| **E5** | Auto-backup reminder | Periodic reminder to export your data | ❌ Not implemented |

---

## Files Changed / Created

| File | Action |
|------|--------|
| `utils/reports.js` | **New** — monthly/quarterly report generation + caching |
| `utils/patterns.js` | **New** — peak hour, lull, day-of-week analysis |
| `utils/weather.js` | **New** — Open-Meteo integration, caching, heat adjustment |
| `utils/export.js` | **New** — CSV/JSON export and import |
| `components/MonthlyReport.js` | **New** — collapsible report card with stats, highlights, quarterly trend |
| `components/WeatherBanner.js` | **New** — heat advisory banner on Home screen |
| `screens/LogScreen.js` | **Edit** — add MonthlyReport section + day-of-week pattern insight |
| `screens/HomeScreen.js` | **Edit** — add WeatherBanner, peak time hint, goal suggestion, activity boost display |
| `screens/SettingsScreen.js` | **Edit** — add weight input, unit toggle, activity toggle, pattern insights, location fallback, CSV/JSON export/import |
| `utils/storage.js` | **Edit** — add monthly cache keys, weight goal helpers, export/import functions |
| `utils/notifications.js` | **Edit** — heat-adjusted reminder interval, activity-boosted goal context |
| `package.json` | **Edit** — add `expo-sharing`, `expo-file-system`, `expo-location`, `expo-document-picker` |

---

## Success Criteria

- [x] Monthly report shows accurate stats from actual log data
- [x] Peak hour detection matches visual inspection of logs
- [x] Weight-based goal calculates correctly (kg and lbs)
- [x] Weather check works on real device (or gracefully degrades without location)
- [x] CSV export produces valid CSV that opens in spreadsheet app
- [x] JSON import restores all data correctly
- [x] Heat adjustment actually shortens reminder interval on hot days
