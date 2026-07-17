# Story 4.1: First-Run Detection

---
baseline_commit: NO_VCS
---

Status: done

## Story

As the app,
I want to detect first-time users and route them to onboarding,
so they don't land on an empty Home screen.

## Acceptance Criteria

1. `@plenty_onboarded` boolean flag in AsyncStorage
2. If flag is absent on app start → route to `OnboardingScreen`
3. If flag is present → route to main navigation (existing behavior)
4. `getSettings` merges the flag with `DEFAULT_SETTINGS`

## Tasks / Subtasks

- [x] Add `ONBOARDED: "@plenty_onboarded"` to `KEYS` in `utils/storage.js`
- [x] Add `onboarded: false` to `DEFAULT_SETTINGS` in `utils/storage.js`
- [x] Add `getOnboarded()` / `setOnboarded(val)` accessors to `utils/storage.js`
- [x] Create placeholder `OnboardingScreen.js` (just says "Welcome to Plenty")
- [x] Edit `App.js` — check `getOnboarded()` on mount, show OnboardingScreen or AppNavigator
- [x] Run `npm test` to confirm no regressions

## Dev Notes

### Approach

- Keep it simple: a single persisted boolean flag in AsyncStorage
- `getSettings` already merges with `DEFAULT_SETTINGS`, so adding `onboarded: false` means existing users (who have no `@plenty_onboarded` key) will get `false` → they'll see onboarding. **Fix:** use a separate key string, not buried in settings, so we can distinguish "never set" from "explicitly false".
- Better approach: store under `@plenty_onboarded` directly. Read it explicitly. If it doesn't exist → first run → show onboarding.
- `onboarded` is added to `DEFAULT_SETTINGS` with value `false` so that `getSettings` returns it — but the gate check in App.js reads `@plenty_onboarded` directly from AsyncStorage. If it doesn't exist → onboarding. Once onboarding completes → save `@plenty_onboarded = "true"` as a string.

### Key Files

| File | Action |
|------|--------|
| `utils/storage.js` | Add KEYS entry, DEFAULT_SETTINGS entry, getOnboarded/setOnboarded |
| `App.js` | Conditional routing — check flag, show OnboardingScreen if absent |
| `screens/OnboardingScreen.js` | New — placeholder screen with "Get Started" button |

### References

- [Source: docs/planning-artifacts/epics-v2.md#41--first-run-detection]
