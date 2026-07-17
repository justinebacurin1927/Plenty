# Story 1.4: Edge Case Sweep

---
baseline_commit: NO_VCS
---

Status: done

## Story

As a user,
I want the app to handle edge cases gracefully — no crashes on boundary dates, long lists, or malformed imports,
so that the experience is smooth regardless of data weirdness.

## Acceptance Criteria

1. Day-boundary and timezone edge cases in log rendering are handled
2. Empty states render on every screen (no drinks, no achievements, no reports)
3. Malformed JSON from backup import is caught with a user-friendly error
4. Long log lists don't degrade performance (FlatList virtualization)

## Tasks / Subtasks

- [x] Guard `formatTime()` against null/invalid timestamps in LogScreen (AC: 1)
- [x] Guard `keyExtractor` and `renderLogItem` against entries missing `id` or `timestamp` (AC: 1)
- [x] Add defensive timestamp validation in `getTodayLogs()` filtering (AC: 1)
- [x] Verify empty states on HomeScreen, LogScreen, AchievementsScreen (AC: 2)
  - [x] HomeScreen: streak hidden at 0, progress shows 0/8, all guards in place
  - [x] LogScreen: "No drinks logged yet today" empty state renders correctly
  - [x] AchievementsScreen: "No achievements yet" empty state renders for brand-new users
  - [x] MonthlyReport: "No data yet this month" when no logs exist
- [x] Add entry-level validation to `importFromJSON` — reject malformed logs, settings, achievements (AC: 3)
- [x] Surface validation warnings in the import success Alert on SettingsScreen (AC: 3)
- [x] Add `removeClippedSubviews={true}` to LogScreen FlatList for long-list perf (AC: 4)

## Dev Notes

### Edge Cases Addressed

#### Timezone / Day-Boundary
- `formatTime(iso)` now wraps `new Date(iso)` in a try/catch and returns `"--:--"` for invalid values
- `renderLogItem` returns `null` for items without a timestamp
- `getTodayLogs()` explicitly checks for missing/null timestamps before comparing
- `keyExtractor` falls back to array index when `item.id` is missing

#### Empty States
- **HomeScreen**: Handled naturally — streak hidden when 0, progress shows 0/8, no escalation/weather/peak hints. No change needed.
- **LogScreen**: Already shows mascot + "No drinks logged yet today" + hint to use Home screen. Verified correct.
- **AchievementsScreen**: Already shows trophy icon + "No achievements yet" + hint. Verified correct.
- **MonthlyReport**: Shows "No data yet this month. Start logging to see your report!" when collapsed + no data.

#### Import Validation
- Validates each log entry has: `id` (truthy), `timestamp` (parses to valid Date), `amount` (positive number if present)
- Skips invalid entries during import instead of failing entirely
- Returns `warnings` array that SettingsScreen surfaces in the success Alert
- Validates settings object structure (must be an object with at least one known key)
- Validates achievements shape (unlocked ∈ array, progress ∈ object)

#### FlatList Performance
- `removeClippedSubviews={true}` added for off-screen item recycling
- `getItemLayout`, `windowSize={7}`, `maxToRenderPerBatch={15}` already set

### Key Files

| File | Change |
|------|--------|
| `screens/LogScreen.js` | Guard formatTime, renderLogItem, keyExtractor; add removeClippedSubviews |
| `utils/storage.js` | Guard getTodayLogs against null timestamps |
| `utils/export.js` | Entry-level import validation with warnings |
| `screens/SettingsScreen.js` | Surface import warnings in Alert |

### References

- [Source: docs/planning-artifacts/epics-v2.md#14--edge-case-sweep] — Epic definition

## Dev Agent Record

### Agent Model Used

Claude Opus 4.8

### Debug Log References

- Traced `getTodayLogs`, `getDailyTotals`, `getStreak` for timezone edge cases — all use epoch-based comparison, correct
- Traced `formatTime` in LogScreen — null/undefined iso would crash, fixed with try/catch
- Traced `importFromJSON` — no entry-level validation, added `isValidLogEntry`, `isValidSettings`, `isValidAchievements`
- Verified empty states on all 4 screens — HomeScreen (implicitly handles 0 state), LogScreen (explicit empty), AchievementsScreen (explicit empty), MonthlyReport (explicit empty)

### Completion Notes List

- Story 1.4 complete. All edge cases addressed across LogScreen, storage, and import logic. No regressions introduced.

### File List

- `screens/LogScreen.js` — edited (formatTime guard, null-item guard, removeClippedSubviews)
- `utils/storage.js` — edited (getTodayLogs null-timestamp guard)
- `utils/export.js` — edited (validated import with user-friendly errors + warnings)
- `screens/SettingsScreen.js` — edited (surface import warnings in Alert)
- `docs/implementation-artifacts/1-4-edge-case-sweep.md` — new
