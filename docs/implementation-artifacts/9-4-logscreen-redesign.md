---
baseline_commit: NO_VCS
---

# Story 9.4: LogScreen Redesign (Greeting, Date Header, Space-Filling Chart, Pagination)

**Status:** done

## Story

As a user, I want the log screen to feel personal and show my data efficiently — greeting me by name, filling the space well, and giving me control over the log list.

## Acceptance Criteria

1. Personalized greeting "Hello, [name]! This is your progress" at the top (name loaded from settings)
2. Current date displayed on the left side of the header (reference: header(design).jpeg)
3. Last 7 Days bar graph redesigned to fill available space — taller bars, better spacing (reference: tracker.jpeg)
4. Streak fire banner redesigned — clean look without raw emoji in text
5. Streak history table corrected — proper spacing, aligned cells
6. Log list gets pagination/dropdown — show 10/25/50 entries at a time
7. `name` field added to `DEFAULT_SETTINGS` in `utils/storage.js`
8. All changes preserve dark mode, animations, and existing data display

## Tasks / Subtasks

**Phase 1 — Add name field to storage**

- [ ] Add `name: ""` to `DEFAULT_SETTINGS` in `utils/storage.js`

**Phase 2 — Header redesign**

- [ ] Change from plain "Your Log" to personalized greeting + date
- [ ] Hello [name] on left, date on right (matching header(design).jpeg)
- [ ] Load name from settings context

**Phase 3 — Bar graph redesign**

- [ ] Increase bar height to fill available vertical space
- [ ] Improve spacing between bars
- [ ] Match design from tracker.jpeg reference
- [ ] Keep animated entrance (barAnims)

**Phase 4 — Streak banner redesign**

- [ ] Replace fire emoji in text with FireStreak or StreakFlame component
- [ ] Clean up streak display to match app's visual language

**Phase 5 — Pagination/dropdown for log list**

- [ ] Add a picker/dropdown to select items per page (10 / 25 / 50)
- [ ] Paginate the FlatList data accordingly
- [ ] Show current page info

**Phase 6 — Verify**

- [ ] `npm test` passes
- [ ] Log screen renders with personalized greeting
- [ ] Bar graph renders tall and well-spaced
- [ ] Pagination controls work correctly
