# Story 2.4: Streak Protection (Freezes)

---
baseline_commit: NO_VCS
---

Status: done

## Story

As a user,
I want to save my streak if I miss a day for a legitimate reason,
so real life doesn't destroy months of consistency.

## Acceptance Criteria

1. One streak freeze available per calendar month
2. Freeze icon appears on the heatmap cell for the frozen day
3. Frozen days do NOT count toward milestone progress (no progress on frozen day)
4. Freeze is used when user opens the app on a missed day — prompt: "Looks like you missed yesterday. Use a streak freeze to keep your streak alive? (1 remaining this month)"
5. Streak doesn't break on frozen days
6. Clear UI showing how many freezes remain

## Tasks / Subtasks

- [x] Add `useFreeze()` function to `utils/storage.js`
- [x] Add freeze tracking to streak cache (frozenDays array)
- [x] Update `rebuildStreakCache` — treat frozen days as goalMet=true for streak continuity, but not milestone progress
- [x] Add freeze prompt to HomeScreen on mount when user missed yesterday
- [x] Update Heatmap to show ❄️ indicator on frozen cells
- [x] Show freeze count in streak badge area on HomeScreen
- [x] Create `__tests__/freeze.test.js` — freeze math, persistence, streak continuity
- [x] Run `npm test` — confirm no regressions

## Dev Notes

### Approach

- Freezes stored as `frozenDays: ["YYYY-MM-DD", ...]` in the streak cache
- `useFreeze(dateStr)` adds the day to frozenDays, decrements freezesAvailable
- `rebuildStreakCache` checks: if a day would break the streak (goal not met) but is in frozenDays, count it as goalMet=true for streak continuity but NOT for milestone progress tracking
- Freeze prompt: HomeScreen's loadData checks if yesterday was missed and a freeze is available
- Modal/alert asks user to confirm use of freeze

### Key Files

| File | Action |
|------|--------|
| `utils/storage.js` | Add useFreeze, frozenDays handling in rebuildStreakCache |
| `screens/HomeScreen.js` | Add freeze prompt on mount |
| `components/Heatmap.js` | Show frozen indicator |
| `__tests__/freeze.test.js` | New |

### References

- [Source: docs/planning-artifacts/epics-v2.md#24--streak-protection]
