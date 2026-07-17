# Story 2.2: GitHub-Style Heatmap

---
baseline_commit: NO_VCS
---

Status: done

## Story

As a user,
I want to see my last 12 weeks of hydration at a glance on the Home screen,
so I can visually track my consistency and avoid breaking my streak.

## Acceptance Criteria

1. A contribution-grid component renders below the water animation, above the quick-log button
2. 12 weeks of day cells, each colored by goal status:
   - Empty/not tracked → transparent/light gray
   - Hit goal that day → teal-to-deep-blue gradient based on how much over goal
   - Missed goal but logged something → light fill
3. Scrolls left to reveal older weeks
4. Tapping a cell shows a tooltip with that day's total ml
5. Respects dark mode
6. Animated on first render (cells fade in row by row)
7. No external calendar library — implement with React Native Views + Reanimated
8. Unit test: correct cell count, correct color mapping

## Tasks / Subtasks

- [x] Create `components/Heatmap.js` with 12-week grid
- [x] Implement cell color mapping based on goal status (empty/hit/missed/over)
- [x] Add horizontal ScrollView for scrolling to older weeks
- [x] Add tap handler with tooltip showing total ml
- [x] Add fade-in animation on first render (staggered row by row)
- [x] Calculate heatmap data from `getStreakData().history` and `getDailyTotals()`
- [x] Integrate Heatmap into HomeScreen below water animation
- [x] Add dark mode color support
- [x] Create `__tests__/heatmap.test.js` — 7 tests for cell count, color mapping, ml reporting
- [x] Run `npm test` — 89 tests passing

## Dev Notes

### Approach

- Simple View-based grid, no SVG or external calendar library
- 12 columns (weeks) × 7 rows (days), with column labels "W -12" through "W -1"
- Each cell is ~12-14px square with 2px gap
- Compute cell data from streak data history, plus today's progress
- Colors: light teal `#A0D8B0` for goal hit, medium `#4A90D9` for hitting 150%+, dark `#1A5C8A` for 200%+
- Missed: `#F0A050` or light orange
- Empty/no data: `colors.surfaceTertiary` or equivalent

### Key Files

| File | Action |
|------|--------|
| `components/Heatmap.js` | New — grid component |
| `screens/HomeScreen.js` | Edit — integrate Heatmap below water |
| `__tests__/heatmap.test.js` | New — cell count + color tests |

### References

- [Source: docs/planning-artifacts/epics-v2.md#22--github-style-heatmap-on-home-screen]
