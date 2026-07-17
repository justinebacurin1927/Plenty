# Story 4.2: Onboarding Screen (3-Swipe Intro)

---
baseline_commit: NO_VCS
---

Status: done

## Story

As a new user,
I want a quick, friendly welcome that sets up my goal and reminders,
so I can start using Plenty immediately.

## Acceptance Criteria

1. Three-screen swipeable/flat-list flow:
   - **Screen 1 — What Plenty does:** Short visual intro with mascot: "Plenty helps you drink enough water every day. No fuss, no accounts."
   - **Screen 2 — Set your daily goal:** Weight-based goal calculator card. Enter weight → see recommended ml. Can accept or set custom. Optional activity level toggle.
   - **Screen 3 — Set interval + permission:** Choose reminder frequency (30m/1h/2h/custom). Before OS permission prompt, explain *why* notifications are needed. Graceful path if denied ("You can enable in Settings later").
2. Dot indicators at bottom showing current screen (3 of 3)
3. "Skip" link in top corner (goes to defaults)
4. "Get Started" button on screen 3
5. On completion: save goal + interval + `remindersActive: true` + `@plenty_onboarded: true`, then route to Home
6. Onboarding choices persist — user lands on Home ready to go

## Tasks / Subtasks

- [x] Replace placeholder OnboardingScreen with full 3-screen FlatList/pager
- [x] Screen 1: mascot/icon + heading + short description
- [x] Screen 2: weight input → recompute goal + activity toggle + custom override
- [x] Screen 3: interval picker (30m/1h/2h) + permission explanation + request
- [x] Dot indicators (3 dots, active highlighted)
- [x] "Skip" button top-right on screens 1-2
- [x] "Get Started" button on screen 3 saves all settings
- [x] On complete: save goal, interval, remindersActive=true, onboarded=true
- [x] Run `npm test` to confirm no regressions

## Dev Notes

### Approach

- Use a FlatList with `pagingEnabled` and horizontal direction for swipe between screens
- Each screen is a separate component to keep code organized
- OnboardingScreen manages state: weight, interval, goalOverride, activityLevel
- Screen 2: weight-based goal via existing `weightBasedGoal()` from storage.js
- Screen 3: after "Get Started", request notification permission via `requestPermission()` from notifications.js
- On skip: save defaults (250ml, 30min interval, remindersActive: false, onboarded: true)
- Existing `getOnboarded`/`setOnboarded` from storage.js used for the flag
- Save settings with `saveSettings()` for goal/interval/remindersActive

### Key Files

| File | Action |
|------|--------|
| `screens/OnboardingScreen.js` | Replace — full 3-screen onboarding |
| `utils/storage.js` | Already has getOnboarded/setOnboarded, weightBasedGoal, lbsToKg |
| `utils/notifications.js` | Use requestPermission for screen 3 |

### References

- [Source: docs/planning-artifacts/epics-v2.md#42--onboarding-screen-3-swipe-intro]
