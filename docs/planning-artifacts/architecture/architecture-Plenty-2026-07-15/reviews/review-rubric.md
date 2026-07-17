# Architecture Spine Rubric Review

**File:** `docs/planning-artifacts/architecture/architecture-Plenty-2026-07-15/ARCHITECTURE-SPINE.md`
**Review date:** 2026-07-15
**Reviewer:** Automated rubric review
**Verdict:** **Conditional pass** — 4 issues to resolve before the spine is ready to bind downstream work.

---

## Checklist 1: Divergence coverage — PASS (with note)

The spine fixes 13 real divergence points (AD-1 through AD-13). These cover the major axes where independent work could produce incompatible results: backend vs local, single-user vs multi-user, navigation structure, animation framework, notification ownership, data persistence engine, native module approach, and future Sprint additions.

**One dimension is silent:** Testing strategy. The capability map lists `__tests__/ (Sprint 6)` with no governing AD, no convention, and no deferred entry. At the "feature" altitude this spine targets, testing framework choice (Jest vs Detox, React Native Testing Library vs bare render, snapshot strategy) is a genuine divergence point. Add either an AD-14 for testing, a convention row, or a Deferred entry.

---

## Checklist 2: Enforceability of AD Rules — PASS (2 minor concerns)

Every AD's Rule is worded as a concrete, review-enforceable constraint. No rule is aspirational or uncheckable.

**Minor concern — AD-4:** The rule says "Only HomeScreen can trigger scheduleWaterReminder() or cancelAllReminders()." SettingsScreen likely needs a way to cancel reminders when the user toggles notifications off. The AD doesn't clarify whether Settings routes through HomeScreen or reads/writes a storage flag that HomeScreen polls. This is a narrow gap for a single-dev project but would cause friction on team handoff.

**Minor concern — AD-9:** The Rule says "Remove [health modules]" but the codebase *currently* still has all of them (`modules/plenty-health/`, `utils/health.js`, `expo-health-connect ^0.1.1`, `react-native-health-connect ^3.5.3`). The rule is enforceable once executed but the spine does not ratify the current state — it describes a future state. The Stack table should list these deps with a "TO BE REMOVED (AD-9)" annotation so the gap is visible. *Since the review: AD-9 completed (2026-07-17) — all Health Connect code removed.*

---

## Checklist 3: Deferred section — PASS

No deferred item could let two units diverge. Every deferred item either:
- Has its shape already fixed by an AD (AD-12 → adaptive heuristic, AD-7/AD-13 → iOS widget), or
- Prescribes a specific tool and trigger condition (Zustand for state management upgrade), or
- Is explicitly out of scope (desktop/web port).

The Catalyst/iPad note ("design system should accommodate tablet layouts if reached") is mildly vague but unlikely to cause real divergence during Sprints 6-9.

---

## Checklist 4: Tech version accuracy — FAIL (2 omissions, 1 stale claim)

Cross-checked against `/home/jaycee/Projects/Plenty/package.json`.

### Missing from Stack table (in package.json, not in spine):

| Dependency | Version | Severity |
|---|---|---|
| `@react-navigation/native` | ^7.3.8 | **HIGH** — bottom tabs require it; spine lists tabs but not the core nav package |
| `expo-dev-client` | ~55.0.36 | **MEDIUM** — spine says "Requires dev-client for native deps" but doesn't list it |
| `expo-constants` | ~55.0.16 | LOW — ubiquitous Expo dep |
| `expo-build-properties` | ~55.0.15 | LOW |
| `expo-font` | ~55.0.8 | LOW |
| `expo-status-bar` | ~55.0.6 | LOW |
| `@expo/vector-icons` | ^15.0.2 | LOW — used in App.js tab icons |
| `qrcode` | ^1.5.4 | LOW (devDep) |

### Missing annotations:
- `expo-health-connect ^0.1.1` and `react-native-health-connect ^3.5.3` — both were present in package.json and on disk at review time. AD-9 says to remove them. Since addressed (2026-07-17): both deps removed from package.json and all files deleted.

### Stale claim:
- `babel.config.js` — Listed in structural seed but **does not exist** on disk. The spine claims a file that isn't there.

### Verified correct:
All 11 entries that are in both the Stack table and package.json match exactly (Expo ~55.0.0, RN 0.83.6, React 19.2.0, async-storage 2.2.0, bottom-tabs ^7.18.8, etc.).

---

## Checklist 5: Brownfield ratification — CONDITIONAL FAIL

The spine largely matches the actual source tree at `/home/jaycee/Projects/Plenty/`. All 26 source files in the structural seed exist on disk.

### Ratification gaps:

1. **`babel.config.js` listed but absent** — Structural seed says it exists; it doesn't. Either remove it or add it.

2. **`modules/plenty-health/` on disk but omitted from structural seed** — Understandable given AD-9 intent, but the spine should acknowledge current state. Adding `utils/health.js` as "[TO BE REMOVED AD-9]" is good; doing the same for the module directory would be consistent. *Since resolved (2026-07-17): both `modules/plenty-health/` and `utils/health.js` removed.*

3. **`<SafeAreaProvider>` in App.js not reflected** — The dependency graph (`graph TD` in Design Paradigm) shows `App --> ErrorBoundary --> ThemeProvider --> TabNavigator` but the actual `App.js` wraps `SafeAreaProvider` around `ErrorBoundary`. The graph is missing this layer.

4. **`NavigationContainer` not in any diagram** — `App.js` wraps tabs inside `<NavigationContainer>` from `@react-navigation/native`. The dependency graph and C4 diagrams don't show it.

5. **No `__tests__/` directory** — The capability map says "(Sprint 6)" for testing, which is consistent with the directory not existing yet. This is the one case where a missing item is correctly accounted for.

---

## Checklist 6: Dimension completeness — PASS

All dimensions appropriate to "feature" altitude are either decided (13 ADs + conventions), deferred (9 entries with clear triggers), or implicitly scoped out. The one unowned dimension (testing strategy) is covered in Checklist 1 above.

Internationalization (i18n) and accessibility are not addressed. For a Play Store publication app these may be relevant, but they are defensible omissions at the feature-altitude spine — the spine does not claim to cover them. They could be added as Deferred entries for visibility.

---

## Summary of Required Fixes

1. **[HIGH] Missing `@react-navigation/native` in Stack table** — Add row. Without it the bottom-tabs entry is incomplete.
2. **[MEDIUM] Missing `expo-dev-client` in Stack table** — Spine itself says "Requires dev-client for native deps." The dep must be listed.
3. **[MEDIUM] `babel.config.js` listed but absent** — Either create the file or remove the structural seed entry.
4. **[MEDIUM] AD-9 current-state gap** — Stack table and structural seed should acknowledge Health Connect deps as "TO BE REMOVED" rather than omitting them, since the codebase still carries them. *(Resolved 2026-07-17: Health Connect purge complete.)*

## Post-Review Notes

## Recommended but not required

- Add testing strategy as AD-14 or a Deferred entry (prevents framework fragmentation in Sprint 6+).
- Add `<SafeAreaProvider>` and `<NavigationContainer>` to the dependency graph for accuracy.
- Clarify AD-4's Settings ↔ notification cancellation routing.
