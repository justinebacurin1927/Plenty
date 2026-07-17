# Story 5.3: Notification Reliability

---
baseline_commit: NO_VCS
---

Status: done

## Story

As a user,
I want my reminders to survive app restarts and device reboots,
so I don't miss hydration even if my phone restarts.

## Acceptance Criteria

1. `remindersActive` flag persisted alongside `intervalMinutes` as source of truth
2. On app launch: if `remindersActive` but no scheduled reminder exists, reschedule from saved interval
3. Reboot survival: first-launch re-arm acts as safety net
4. Permission edge cases: denied/blocked state shows "Open settings" deep link, Home warning banner stays in sync
5. Cross-midnight quiet-hours math confirmed correct
6. Notification channels created once, sound setting respected

## Tasks / Subtasks

- [x] Add `remindersActive: false` to DEFAULT_SETTINGS (AC: 1)
- [x] Save `remindersActive: true` on start, `false` on stop (AC: 1)
- [x] Update startup check: re-arm reminders when flag says active but none scheduled (AC: 2, 3)
- [x] Add "Open Settings" button with Linking.openURL when permission denied (AC: 4)
- [x] Verify cross-midnight quiet hours math is correct (AC: 5)
- [x] Confirm ensureChannels is called once at permission time, not duplicated (AC: 6)

## Dev Notes

### Key Files

| File | Action |
|------|--------|
| `utils/storage.js` | Add `remindersActive: false` to DEFAULT_SETTINGS |
| `screens/HomeScreen.js` | Edit — save `remindersActive` on start/stop, re-arm on mount, permission deep-link |
| `utils/notifications.js` | Verify |

### References

- [Source: docs/planning-artifacts/epics-v2.md#53--notification-reliability]
