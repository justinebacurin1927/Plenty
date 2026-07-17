# Story 2.1: Streak Engine + Persistence

---
baseline_commit: NO_VCS
---

Status: done

## Story

As the app,
I want to accurately track daily streak data and persist it efficiently,
so the rest of the streak system has a reliable data source.

## Acceptance Criteria

1. For each day, store whether the user hit their goal (true/false) plus total ml
2. Store the current streak count, longest streak, and streak freeze available/month
3. Add `@plenty_streak` storage key with versioned schema
4. Efficient batch reads (don't scan all logs every time)
5. `getStreakData()` returns: `{current, longest, history: [{date, goalMet, totalMl}], freezesAvailable, milestonesReached}`
6. Existing `getStreak()` is refactored to use the new engine (backward-compatible)
7. Unit tests for streak math: consecutive days, break detection, freeze behavior

## Tasks / Subtasks

- [x] Define streak data schema + add STREAK key to KEYS
- [x] Implement `rebuildStreakCache()` — iterate logs, compute per-day goal met, build history
- [x] Implement `getStreakData()` — read from cache, return structured response
- [x] Implement `invalidateStreakCache()` — mark dirty so next read rebuilds
- [x] Refactor existing `getStreak(goal)` to use `getStreakData().current`
- [x] Create `__tests__/streak.test.js` — 12 tests for streak math
- [x] Run `npm test` — all 82 tests passing

## Dev Notes

### Approach

- The streak cache is rebuilt lazily: `getStreakData()` checks if it needs rebuild (stale or first call), otherwise reads from cache
- Rebuild scans all logs once, computing per-day totals and streak lengths
- Schema: `{ version: 1, current, longest, lastUpdated, lastLogDate, freezesAvailable, milestonesReached, history: [{ date, goalMet, totalMl }] }`
- History array sorted by date descending, capped to last 365 days
- Existing `getStreak(goal)` calls `getStreakData(goal)` and returns `.current`
- `getStreak()` signature stays the same — takes `goal` param, returns number
- Streak freeze: `freezesAvailable` resets to 1 on the 1st of each month

### Key Files

| File | Action |
|------|--------|
| `utils/storage.js` | Add STREAK key, streak schema, rebuildStreakCache, getStreakData, update getStreak |
| `__tests__/streak.test.js` | New — streak math unit tests |

### References

- [Source: docs/planning-artifacts/epics-v2.md#21--streak-engine--persistence]
