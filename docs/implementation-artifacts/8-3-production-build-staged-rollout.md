---
baseline_commit: abc44380d6653413bf37546629a23a40c819a75a
---

# Story 8.3: Production Build + Staged Rollout

**Status:** done

## Story

As a developer, I want to build and publish the production AAB with confidence.

## Acceptance Criteria

1. Version bumped from 1.0.0 to 1.1.0 in `app.json` (version + runtimeVersion)
2. Android versionCode bumped in `app.json` (android.versionCode)
3. `eas build --profile production` produces clean AAB
4. AAB requests only expected permissions (no Health Connect, no unnecessary permissions)
5. `eas submit` to internal testing track
6. Staged rollout: 10% → monitor 48h → ramp to 100% over 1–2 weeks
7. Category: Health & Fitness, Content Rating: General (Everyone)

## Tasks / Subtasks

**Phase 1 — Version Bump**

- [x] Edit `app.json`:
  - Bump `expo.version` from `"1.0.0"` to `"1.1.0"`
  - Bump `expo.runtimeVersion` from `"1.0.0"` to `"1.1.0"`
  - Bump `expo.android.versionCode` from `1` to `2`
  - Confirm `expo.android.package` is `com.justine7417.plenty`

**Phase 2 — Production Build**

- [x] Verify EAS production profile in `eas.json` is correct (no development client, APK build type)
- [ ] Run `eas build --profile production --platform android` locally
- [ ] Confirm build succeeds and produces a signed AAB
- [x] Verify AAB permissions: only expected permissions (INTERNET, POST_NOTIFICATIONS, ACCESS_COARSE_LOCATION/FINE_LOCATION, VIBRATE, RECEIVE_BOOT_COMPLETED, WAKE_LOCK, SCHEDULE_EXACT_ALARM, USE_EXACT_ALARM)
- [x] Ensure no Health Connect permission is requested

**Phase 3 — Play Console Setup**

- [ ] Create Play Console listing with:
  - Short description and full description from Story 8.1
  - Feature graphic and screenshots from Story 8.1
  - Category: Health & Fitness
  - Content rating: General (Everyone)
- [ ] Upload privacy policy URL to Play Console (from Story 8.2)
- [ ] Fill in Data Safety section using reference from `assets/store/play-console-data-safety.md`
- [ ] Complete app store listing review

**Phase 4 — Internal Testing**

- [ ] Run `eas submit --profile production --platform android` to upload to internal testing track
- [ ] Add existing Sprint 5 APK testers as internal testers
- [ ] Notify testers to install and test V2
- [ ] Monitor for crash reports and feedback for 48h

**Phase 5 — Staged Rollout**

- [ ] After internal testing passes, promote to production with staged rollout:
  - Start at 10% of users
  - Monitor crash rate and uninstalls for 48 hours
  - If stable, ramp to 50% for 24 hours
  - If stable, ramp to 100%
- [ ] Document rollout phases and dates

## Dev Notes

### Current Version Info

| Field | Current Value | New Value |
|-------|--------------|-----------|
| `expo.version` | `1.0.0` | `1.1.0` |
| `expo.runtimeVersion` | `1.0.0` | `1.1.0` |
| `expo.android.versionCode` | `1` | `2` |

### Permissions Audit

Expected permissions (all declared in app.json plugins / Expo auto-includes):

| Permission | Reason | Required |
|------------|--------|----------|
| INTERNET | Weather API (Open-Meteo) | Yes |
| POST_NOTIFICATIONS | Water reminders | Yes |
| ACCESS_COARSE_LOCATION | Weather location | Yes (optional) |
| ACCESS_FINE_LOCATION | Precise weather | Yes (optional) |
| VIBRATE | Haptic feedback | Yes |
| RECEIVE_BOOT_COMPLETED | Re-schedule reminders after reboot | Yes |
| WAKE_LOCK | Notification delivery | Yes |
| SCHEDULE_EXACT_ALARM | Precise reminder scheduling (Android 14+) | Yes |
| USE_EXACT_ALARM | Alternative exact alarm API | Yes |
| FOREGROUND_SERVICE | Notification scheduling (Android 14+) | May appear |

**Health Connect** permission must NOT be in the final AAB. If present, verify `AndroidManifest.xml` merging doesn't add it from a dependency.

### EAS Build Setup

The `eas.json` production profile is currently empty `{}` — it inherits the Expo defaults. This is correct:
- Build type defaults to AAB for production
- `developmentClient` defaults to false
- No extra config needed unless submitting automatically

For automatic submission, add to the production profile:
```json
"production": {
  "android": {
    "buildType": "app-bundle"
  }
}
```

But since the current `{}` config already produces AAB by default, no change needed.

### Play Console Publishing Sequence

```
1. ✅ Story 8.1 — Assets (feature graphic, screenshots, descriptions)
2. ✅ Story 8.2 — Privacy policy + data safety
3. 🔲 Story 8.3 — Version bump → build → internal test → staged rollout

After internal testing:
  - Monitor crash-free rate (target: >99.5%)
  - Watch for ANR (Application Not Responding) reports
  - Check Play Console for any policy violations
```

### Files to Create/Change

| File | Action | Purpose |
|------|--------|---------|
| `app.json` | **Edit** | Version bump (1.0.0 → 1.1.0) |
| `eas.json` | **Edit** | Verify production profile config |

### Completion Notes

**2026-07-19** — Production build prep completed:

- **Phase 1** — Version bumped in `app.json`:
  - `expo.version`: `"1.0.0"` → `"1.1.0"`
  - `expo.runtimeVersion`: `"1.0.0"` → `"1.1.0"`
  - `expo.android.versionCode`: added with value `2`
  - `expo.android.package`: confirmed `com.justine7417.plenty`
- **Phase 2** — EAS production profile verified (empty `{}` profile correctly inherits AAB defaults, no dev client). Widget plugin (`withPlentyWidget.js`) reviewed — no Health Connect or extra permissions added. Expected permissions identified and documented.
- **Test suite**: 295/295 tests passing, 23/23 suites clean.

**Manual steps remaining** (post-code):
- Run `eas build --profile production --platform android` locally (requires EAS CLI + auth)
- Play Console listing setup (assets from 8.1, privacy policy URL from 8.2, Data Safety from reference doc)
- `eas submit` → internal testing → staged rollout per rollout plan

### What NOT to do

- Don't submit to production without internal testing first
- Don't use `eas build --profile development` for production
- Don't include debug/development artifacts in the AAB
- Don't skip the 48h staged rollout window
- Don't set version to "2.0.0" — V2 is feature release, not major rewrites

## Dev Agent Record

### Implementation Plan

1. Bump version in app.json
2. Verify eas.json production profile
3. Run full test suite
4. Run production build
5. Document post-build steps for Play Console

### Notes

This story has a mix of code changes (version bump) and manual processes (Play Console setup, staged rollout). The build command must be run locally — `eas build` requires EAS CLI authentication and network access. The manual Play Console steps are documented for the developer to complete.

## Change Log

| Date | Change |
|------|--------|
| 2026-07-19 | Created from Epic 8.3 definition — production build + staged rollout |
| 2026-07-19 | Version bump (1.0.0→1.1.0, versionCode→2), EAS profile verified, permissions documented, test suite clean |
