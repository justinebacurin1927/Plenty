# Story 5.2: Regression Tests for Sprint 5 Bugs

---
baseline_commit: NO_VCS
---

Status: done

## Story

As a developer,
I want automated regression tests for both production bugs,
so they never come back.

## Acceptance Criteria

1. Interval persistence regression test: save interval → reload → assert same value
2. Notification dedup regression test: concurrent `scheduleWaterReminder` calls assert one scheduled reminder

## Tasks / Subtasks

- [x] Verify regression tests exist in `__tests__/regression.test.js`
- [x] Confirm they pass with the new jest-expo infrastructure
- [x] Fix test assertion semantics (Promise return values vs. order tracking)

## Dev Notes

The regression tests were written during Stories 1.1 and 1.2 but couldn't run because jest-expo wasn't configured. With Story 5.1 complete, they now execute as part of `npm test`.

The schedule-chain test had an incorrect assertion — it expected Promise return values ("scheduled-1") in the execution-order array, but only explicitly pushed items appear there. Fixed to use `simulateStep` for both cancel and schedule phases.

## References

- `__tests__/regression.test.js` — 7 tests covering interval persistence + notification dedup
