# Sprint 8 — Smarter Reminders v2

> **Goal:** Make reminders adapt to real behavior instead of firing on a fixed
> interval — pace the user toward their goal, suppress noise, and stay
> transparent and controllable.
> **Status:** Planned (depends on Sprint 6 test foundation; benefits from the
> pattern data the app already collects)

---

## Why This Sprint

A fixed interval is a blunt instrument: it nags when you just drank and stays
quiet when you're far behind. The app already computes rich behavior data —
peak hours and lull periods (`utils/patterns.js`), daily goals, and logs — but
none of it feeds the reminder engine. Sprint 8 turns that data into an adaptive
scheduler, while keeping everything local (no backend) and giving the user a
clear off-switch and explanation.

**Design guardrails:** stays local-only; adaptive mode is opt-in; the user can
always fall back to the simple fixed interval from Sprint 5/6.

---

## Epic A — Adaptive Interval Engine

| # | Task | Detail | Status |
|---|------|--------|--------|
| A1 | "Pace to goal" model | Compute interval from glasses remaining vs. time left in the active day | ⬜ Planned |
| A2 | Pattern-weighted scheduling | Bias reminders toward the user's historical peak drinking hours | ⬜ Planned |
| A3 | Bounds + safety | Never below a sane floor or above a ceiling; respect quiet hours | ⬜ Planned |
| A4 | Engine unit tests | Deterministic tests over the pacing/bounds logic (uses Sprint 6 jest setup) | ⬜ Planned |

---

## Epic B — Context Suppression

| # | Task | Detail | Status |
|---|------|--------|--------|
| B1 | Recent-log suppression | Skip/reschedule if the user logged within the last N minutes | ⬜ Planned |
| B2 | Goal-met suppression | Stop nagging once the daily goal is reached | ⬜ Planned |
| B3 | Lull awareness | Soften cadence during detected inactive/sleep windows | ⬜ Planned |

---

## Epic C — Time-of-Day Profiles

| # | Task | Detail | Status |
|---|------|--------|--------|
| C1 | Segment the day | Morning / afternoon / evening cadence bands | ⬜ Planned |
| C2 | Front-load option | Optionally push more reminders earlier so goals aren't back-loaded | ⬜ Planned |
| C3 | Peak-hour alignment | Line profiles up with `getPeakHours` output | ⬜ Planned |

---

## Epic D — Smart Snooze & Do-Not-Disturb

| # | Task | Detail | Status |
|---|------|--------|--------|
| D1 | Adaptive snooze | Snooze length scales with how far behind the goal you are | ⬜ Planned |
| D2 | Auto-quiet on inactivity | Back off automatically when the app/phone looks idle for long stretches | ⬜ Planned |
| D3 | Manual DND window | One-tap "pause reminders for 2h" | ⬜ Planned |

---

## Epic E — Transparency & Control

| # | Task | Detail | Status |
|---|------|--------|--------|
| E1 | Adaptive on/off toggle | Settings switch; off = the simple fixed interval | ⬜ Planned |
| E2 | Aggressiveness setting | Gentle / balanced / persistent presets | ⬜ Planned |
| E3 | "Why this reminder?" | Short explainer on the notification / a debug panel | ⬜ Planned |
| E4 | Migration + defaults | Existing users keep current behavior until they opt in | ⬜ Planned |

---

## Success Criteria

- Adaptive mode measurably reduces "reminder while I just drank" and "silent when behind" cases.
- No reminders after the daily goal is met (unless the user opts in).
- Everything runs locally; adaptive mode is opt-in and fully reversible to fixed interval.
- The engine is covered by deterministic unit tests.

## Out of Scope

- Any cloud/ML backend — heuristics run on-device.
- New notification content/messaging system (already exists from Sprint 3/4).
