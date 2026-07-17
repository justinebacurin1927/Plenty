# Story 2.7: Streak-Aware Notifications

---
baseline_commit: NO_VCS
---

Status: done

## Story

As a user, I want reminders that reference my streak when I have one going, so they feel personal and make me want to protect it.

## Acceptance Criteria

1. When streak >= 3 days, notification messages switch to streak-aware variants from a new `streak` message category
2. Three streak message tiers exist:
   - **short** (3–6 days): encouraging, protect-the-streak tone — "Don't break your X-day streak!"
   - **established** (7–29 days): proud, keep-it-going tone — "You're on a X-day streak — keep it going!"
   - **long** (30+ days): awe/celebration tone — "X days! You're on fire!"
3. Messages include the current streak count (inserted as `{streak}` in the template text)
4. At milestone boundaries (day 6→7, 29→30), a one-shot celebration notification fires immediately when the streak milestone is logged, distinct from the repeating reminder
5. Milestone celebration notifications are not repeated — they fire exactly once per milestone crossing
6. Tone subtly changes at the 7-day mark (short → established tier), verified by separate message pools
7. Existing time-of-day (morning/evening) and goal-proximity message selection continues to work — streak-awareness is an additional filter, not a replacement
8. Milestone celebration is gated by a persisted `lastCelebratedMilestone` value to prevent re-triggering on app restart / cache rebuild
9. If streak is 1–2 days, behavior is unchanged (no streak-aware messages)
10. Tests verify streak message selection, milestone celebration gating, and backward compatibility with existing message selection

## Tasks / Subtasks

**Phase 1 — Add Streak Message Pool**

- [x] Add streak-aware messages to `utils/messages.js` in a new `streak` category with tier sub-categories:
  - `streak-short` (3–6 days): 3–4 messages with `{streak}` placeholder
  - `streak-established` (7–29 days): 3–4 messages with `{streak}` placeholder
  - `streak-long` (30+ days): 2–3 messages with `{streak}` placeholder
- [x] Update `pickMessage()` to accept `streak` parameter and prefer streak messages when streak >= 3
- [x] Streak message selection should layer on top of existing time/urgency selection — if a streak message is available for the current tier, promote it over generic messages
- [x] Add `pickMilestoneMessage()` export — returns a celebration notification content for milestone boundaries (7 and 30 days)

**Phase 2 — Wire Streak Data Through Notification Scheduling**

- [x] Update `_scheduleWaterReminder()` in `utils/notifications.js` to fetch streak data via `getStreakData()` and pass streak to `pickMessage()`
- [x] Import `getStreakData` from storage.js (already exists, module already imported in notifications.js)
- [x] Ensure streak data fetch is efficient (already cached in-memory by streak engine)

**Phase 3 — Milestone Celebration Notifications**

- [x] Add `scheduleMilestoneCelebration()` to `utils/notifications.js` — schedules a one-shot (non-repeating) notification for milestone events
- [x] Add `lastCelebratedMilestone` to `DEFAULT_SETTINGS` in `utils/storage.js` — persists as a number (7 or 30) indicating the last milestone that was celebrated
- [x] Wire milestone check into the existing `loadData()` / log path in `HomeScreen.js` — after logging, check if current streak just crossed a milestone boundary that hasn't been celebrated

**Phase 4 — Testing**

- [x] Create `__tests__/streak-notifications.test.js` with tests covering:
  - `pickMessage` with streak >= 3 returns a streak-aware message
  - `pickMessage` with streak 1–2 returns normal messages (unchanged)
  - `pickMessage` with streak >= 7 returns established-tier messages
  - `pickMessage` with streak >= 30 returns long-tier messages
  - `pickMessage` still respects time-of-day (morning/evening category filtering)
  - `pickMessage` still respects goal-proximity priority
  - `pickMilestoneMessage` returns content for streak=7 and streak=30
  - `pickMilestoneMessage` returns null for non-milestone streaks (1, 8, 31)
  - `scheduleMilestoneCelebration` gating via `lastCelebratedMilestone`
- [x] Run full test suite — confirm no regressions (141 tests, 12 suites, all passing)

## Dev Notes

### Architecture Context

**Data flow for streak-aware reminders:**
```
_scheduleWaterReminder()  [notifications.js]
  → gets settings (goal, enabledCategories)
  → gets todayLogs (goalProgress calculation)
  → gets streakData.current via getStreakData(dailyGoal)  [storage.js]
  → calls pickMessage({ ..., streak })  [messages.js]
    → if streak >= 3: filter streak tier pool, promote over generic
    → else: existing behavior
  → builds notification content
  → schedules repeating reminder
```

**Data flow for milestone celebration (one-shot):**
```
logDrink()  [HomeScreen.js]
  → addLog()
  → check milestone: getStreakData().current === 7 or 30
  → compare with settings.lastCelebratedMilestone
  → if not celebrated: scheduleMilestoneCelebration()
    → saves lastCelebratedMilestone = milestone
    → schedules one-shot notification with delaySeconds = 1 (fires immediately)
```

### Current State

The notification system already:
- Has 30 messages in 7 categories (encouraging, funny, urgent, fact, morning, evening, goal-proximity)
- Has `pickMessage()` which selects based on hour, goalProgress, enabledCategories, lastMessageId
- Has `_scheduleWaterReminder()` which fetches settings + todayLogs, picks a message, schedules the repeating reminder
- Has `getStreakData()` in storage.js returning `{ current, longest, history, ... }`
- Has `DEFAULT_SETTINGS` in storage.js with all config keys
- Is governed by AD-4 (HomeScreen owns notification state) and AD-5 (single repeating trigger)

### Streak Message Tiers

| Tier | Streak Range | Tone | Example Message |
|------|-------------|------|-----------------|
| short | 3–6 days | Encouraging, protective | "Don't break your {streak}-day streak! 🏆" |
| established | 7–29 days | Proud, momentum | "You're on a {streak}-day streak — keep it going!" |
| long | 30+ days | Awe, celebration | "🔥 {streak} days! You're unstoppable!" |

### Milestone Celebration Boundaries

Two milestone boundaries are tracked for celebration notifications:
- **Day 6→7:** Fires when streak hits exactly 7 (first major milestone)
- **Day 29→30:** Fires when streak hits exactly 30 (month milestone)

These are distinct from the reward unlocks in story 2.3 (which handle the achievement badge system). The celebration notification is an additional one-shot notification sent to the device to celebrate the moment.

### Milestone Gating Logic

```javascript
async function shouldCelebrateMilestone(currentStreak, lastCelebrated) {
  // currentStreak is the display streak (includes frozen days)
  // lastCelebrated is the persisted milestone ID (7 or 30)
  if (currentStreak === 7 && lastCelebrated < 7) return 7;
  if (currentStreak === 30 && lastCelebrated < 30) return 30;
  return null; // no celebration needed
}
```

### Key Files

| File | Action |
|------|--------|
| `utils/messages.js` | Edit — add streak message pool, update `pickMessage()` for streak-awareness, add `pickMilestoneMessage()` |
| `utils/notifications.js` | Edit — pass streak to `pickMessage()`, add `scheduleMilestoneCelebration()`, check milestone in log path |
| `utils/storage.js` | Edit — add `lastCelebratedMilestone` to `DEFAULT_SETTINGS` |
| `screens/HomeScreen.js` | Edit — check milestone after logDrink, trigger celebration |
| `__tests__/streak-notifications.test.js` | New |

### Testing

- Mock streak data alongside existing AsyncStorage mock
- Test `pickMessage` with various streak values (0, 1, 3, 7, 30) — verify correct tier selection
- Test that goal-proximity messages still take priority over streak messages when goalProgress >= 80
- Test that time-of-day (morning/evening) messages still appear
- Test milestone gating: `shouldCelebrateMilestone(7, 0)` → celebrate, `shouldCelebrateMilestone(7, 7)` → no
- Test milestone celebration notification content structure
- Run full suite: `npx jest --forceExit` (123+ tests across 11+ suites)

## Change Log

| Date | Change |
|------|--------|
| 2026-07-18 | Created from Epic 2.7 definition — streak-aware messaging and milestone celebrations |
| 2026-07-18 | Implemented — streak message pool (3 tiers), pickMessage updated with streak param, milestone celebration with gating, full test suite |
| 2026-07-18 | Code review — 16 findings (6 real, 3 false positives, 7 low), 5 patches applied |

## Senior Developer Review (AI)

**Outcome:** Approved (with changes)
**Review date:** 2026-07-18
**Reviewer:** AI Code Review workflow (parallel bug/arch/test lenses + adversarial verification)

### Summary

- **Total findings:** 16
- **Real issues:** 6 (2 high, 4 medium)
- **False positives:** 3
- **Low severity:** 7
- **Patches applied:** 5 (all high/medium)

### Action Items

#### High Severity (3 — all resolved)

| # | Finding | Resolution |
|---|---------|------------|
| 1 | Monotonic `lastCelebratedMilestone` gate prevents milestone re-celebration after streak break/rebuild | **Fixed** — replaced scalar with per-milestone tracking via dedicated `@plenty_milestones` AsyncStorage key (`getCelebratedMilestones` / `saveCelebratedMilestone` in `utils/storage.js`). Gate now checks `celebratedMilestones.includes(milestone)` instead of `currentStreak > lastCelebrated`. |
| 2 | Race condition: `scheduleWaterReminder` and `scheduleMilestoneCelebration` both call `saveSettings()` on the same key via non-atomic read-modify-write | **Fixed** — milestone data stored on separate `@plenty_milestones` key, eliminating settings contention. |
| 3 | Flaky test: streak=1/2 test asserts `not.toMatch(/streak/i)` but pre-existing message e1 "Keep the streak alive!" contains "streak" text (≈8.5% CI-breaker) | **Fixed** — changed assertions to check `result.categories` instead of `result.text` for streak absence. |

#### Medium Severity (4 — all resolved)

| # | Finding | Resolution |
|---|---------|------------|
| 4 | Tests don't verify message tier identity via categories — a short-tier message with `{streak}` replaced by 7 would pass the streak=7 test | **Fixed** — added `expect(result.categories).toContain('streak-short/established/long')` to streak=3/7/30 tests. |
| 5 | Missing boundary value tests for streak tier selection (streak=6 upper bound of short, streak=29 upper bound of established) | **Fixed** — added boundary tests for streak=6 (expects `streak-short`) and streak=29 (expects `streak-established`). |
| 6 | Evening+streak combination untested; morning+streak test too weak (only asserts `toBeDefined`/`toBeTruthy`) | **Fixed** — strengthened morning test to verify `morning` or `streak` category; added evening test with hour=21. |

#### Low Severity (7 — all addressed)

| # | Finding | Resolution |
|---|---------|------------|
| 7 | Milestone celebration records success even when notification scheduling fails | **Accepted** — `getN()` dynamic import fails in test env/Expo Go, so save-on-failure is necessary to prevent indefinite re-triggering. Per-milestone tracking ensures celebration fires again after streak break+rebuild. |
| 8 | Redundant `.catch(() => {})` on HomeScreen.js | **Fixed** — removed redundant wrapper. Function has internal error handling. |
| 9 | `getAvailableCategories` test name is misleading | **Fixed** — renamed to "excludes streak sub-categories from returned categories". |
| 10 | AD-4 deduplication guard not referenced by `scheduleMilestoneCelebration` | **Fixed** — added inline comment explaining intentional AD-5 bypass (one-shot notification, routing through gate would cancel repeating reminder). |
| 11 | No test for `pickMessage` with null/undefined streak | **Fixed** — added test with `streak: null`, `streak: undefined`, and omitted streak. |
| 12 | Morning test too weak (overlaps with finding #6) | **Addressed** — strengthened in finding #6 resolution. |
| 13 | No integration test for streak data flow through `_scheduleWaterReminder` | **Deferred** — requires partial native module mocking beyond current scope. |

#### False Positives (3 — dismissed)

| # | Finding | Reason |
|---|---------|--------|
| 14 | Streak messages bypass `enabledCategories` filter | **Intentional design** — streak sub-categories are excluded by `getAvailableCategories` (not user-togglable). The fallback pattern (always produces some notification) applies the same logic. |
| 15 | AD-5 gate bypass in `scheduleMilestoneCelebration` | **Intentional design** — one-shot notification (repeats: false) with 1s delay cannot cause the problems AD-5 prevents (duplicate reminders, schedule fragmentation). Routing through the gate would be destructive (calls `cancelAllReminders()`). |
| 16 | Goal reached/overachiever boundaries not tested with streak | **Structural independence** — goal-proximity (gp4/gp5) and streak paths are mutually exclusive via `goalProgress < 80` gate. Testing with streak adds zero new information. |

### Files Modified During Review

- `utils/storage.js` — added `MILESTONES` key, `getCelebratedMilestones()`, `saveCelebratedMilestone()`; removed `lastCelebratedMilestone` from DEFAULT_SETTINGS
- `utils/notifications.js` — rewrote `scheduleMilestoneCelebration()` with per-milestone gating; added AD-5 bypass documentation
- `__tests__/streak-notifications.test.js` — 5 new tests (boundary, evening, null streak, re-celebration gate), fixed flaky assertions, added tier verification, renamed test
- `screens/HomeScreen.js` — removed redundant `.catch(() => {})`

### Verification

- Full test suite: **146 tests, 12 suites, all passing**
- No regressions introduced

## File List

- `utils/messages.js` (edit) — streak message pool (11 messages, 3 tiers), updated `pickMessage()` with streak param, `pickMilestoneMessage()`
- `utils/notifications.js` (edit) — streak data fetch in `_scheduleWaterReminder()`, `scheduleMilestoneCelebration()` with per-milestone gating
- `utils/storage.js` (edit) — `lastCelebratedMilestone` in `DEFAULT_SETTINGS` (reverted), added `MILESTONES` key, `getCelebratedMilestones()`, `saveCelebratedMilestone()`
- `screens/HomeScreen.js` (edit) — milestone check after `logDrink()`
- `__tests__/streak-notifications.test.js` (new) — 23 tests covering pickMessage with streak, pickMilestoneMessage, milestone gating, boundaries, time-of-day+streak
