# Story 2.5: Streak Flame Animation

---
baseline_commit: NO_VCS
---

Status: done

## Story

As a user, I want the streak badge to feel alive — a flame that burns hotter as my streak grows.

## Acceptance Criteria

1. A small animated flame component renders next to the streak count on the Home screen
2. Flame appearance and animation intensity scales with streak length:
   - 0–6 days: no flame (streak count only)
   - 7–29 days: small flame, gentle flicker
   - 30–99 days: medium flame, visible flicker
   - 100+ days: full flame, constant shimmer
3. Pure RN Animated API effect (no imported GIF, image asset, or Reanimated dependency)
4. Flame comprises 2–3 overlapping animated shapes (circles/ellipses) with opacity and scale transforms
5. Colors shift from cool (coral/yellow at 7d) to hot (orange/white core at 100+d)
6. Flicker uses looping `Animated.loop` with `Animated.sequence` of rapid timing animations
7. Reduced-motion setting is respected (AccessibilityInfo `isReduceMotionEnabled`) — static rendering with no animation loop
8. The flame sits adjacent to the streak number in the streak badge area of HomeScreen
9. Component can run standalone in tests (no external dependencies on HomeScreen state)

## Tasks / Subtasks

- [x] Create `components/StreakFlame.js` — animated flame with tier-based appearance
- [x] Export helper `getFlameTier(streakLength)` returning `{tier, color, size, animSpeed}` for testability
- [x] Implement tier-based rendering: 0–6 → null, 7–29 → small, 30–99 → medium, 100+ → large
- [x] Build flame visual from 2–3 `Animated.View` shapes with looping opacity/scale
- [x] Add color shift per tier (coral → orange → white-hot)
- [x] Respect `isReduceMotionEnabled` — disable animation loop, show static flame
- [x] Integrate StreakFlame into HomeScreen next to streak count in `loadData()`
- [x] Create `__tests__/streak-flame.test.js` — tier mapping, reduce motion, render smoke test
- [x] Run `npm test` — confirm no regressions

## Dev Notes

### Approach

- **No Reanimated, no GIFs, no external assets.** Use React Native's `Animated` API with `Animated.loop` and `Animated.sequence` for the flicker effect.
- **Flame visual:** 2–3 overlapping `Animated.View` circles with `borderRadius: 50%`:
  - **Core** (inner circle) — white/yellow, animated scale pulsing quickly
  - **Mid** (middle circle) — orange/coral, animated opacity oscillating
  - **Outer glow** (largest circle) — semi-transparent warm color, slow pulse
- **Tier helper** (`getFlameTier`): pure function returning config object `{tier: 0-3, baseColor, innerColor, size, opacitySpeed, scaleSpeed}`. Testable without rendering.
- **Color scheme by tier:**
  - Tier 1 (7–29): `#FF8C42` (coral), size 24
  - Tier 2 (30–99): `#FF6B35` (orange), size 32
  - Tier 3 (100+): `#FFD700` fading to white core, size 40
- **Reduce motion:** On mount, check `AccessibilityInfo.isReduceMotionEnabled()`. If true, render static flame shapes with no `Animated.loop`.
- **Animation pattern:**
  ```
  Animated.loop(
    Animated.sequence([
      Animated.timing(opacity, { toValue: 0.6, duration: 200 }),
      Animated.timing(opacity, { toValue: 1, duration: 150 }),
      Animated.timing(opacity, { toValue: 0.8, duration: 180 }),
      Animated.timing(opacity, { toValue: 1, duration: 120 }),
    ])
  ).start()
  ```
  Each shape gets a slightly different sequence/delay for organic flicker.

### Key Files

| File | Action |
|------|--------|
| `components/StreakFlame.js` | New — animated flame component |
| `screens/HomeScreen.js` | Edit — import StreakFlame, render in streak badge |
| `__tests__/streak-flame.test.js` | New |

### Testing

- `getFlameTier(0)` → `{tier: 0}`, `getFlameTier(7)` → `{tier: 1}`, `getFlameTier(30)` → `{tier: 2}`, `getFlameTier(100)` → `{tier: 3}`
- Edge: `getFlameTier(NaN)`, `getFlameTier(-1)` → all return tier 0 (no flame)
- Reduce motion: mock `AccessibilityInfo.isReduceMotionEnabled` returns true → component renders static views, no animated values
- Smoke test: component renders without crashing at each tier

## Change Log

| Date | Change |
|------|--------|
| 2026-07-17 | Created from Epic 2.5 definition |
| 2026-07-18 | Verified implementation — 12/12 tests passing, 110/110 full suite no regressions |

## File List

- `components/StreakFlame.js` (new) — animated flame component with tier-based appearance, RN Animated API
- `__tests__/streak-flame.test.js` (new) — 12 tests covering tier mapping, rendering, reduce motion
- `screens/HomeScreen.js` (edit) — import StreakFlame, render in streak badge next to streak count

## Review Findings

### Decision Needed

- [x] [Review][Decision] **Animation intensity does not vary by tier** — AC 2 specifies "gentle flicker" (7-29d) → "visible flicker" (30-99d) → "constant shimmer" (100+d), but all tiers use identical `BASE_DURATIONS`. Only size and color scale. Should animation speed/delay increase with each tier? This is a design choice — the correct fix depends on your intent.
  **Resolution:** Applied tier-based speed multiplier (1× tier 1, 1.5× tier 2, 2.5× tier 3).

### Patches

- [x] [Review][Patch] **useEffect dependency `[config, reduceMotion]` causes animation restart on every render** [`components/StreakFlame.js:76`] — `getFlameTier()` returns a new object literal on every call. Even when `streakLength` hasn't changed, every parent re-render creates a new `config` reference, triggering the effect cleanup (stops all 3 animations) then restart. Results in visible flame flicker/hitch on every HomeScreen state update. **Fix:** change dependency to `[streakLength, reduceMotion]` and derive `config` inside the effect (or memoize with `useMemo`).
- [x] [Review][Patch] **Reduce-motion race condition on mount** [`components/StreakFlame.js:42`] — `reduceMotion` defaults to `false`. On first render, all animation loops start before the async `AccessibilityInfo.isReduceMotionEnabled()` resolves. On reduce-motion devices, flame flickers briefly then freezes. **Fix:** initialize `reduceMotion` as `null`, gate render until value is known (`if (reduceMotion === null) return null`).

### Deferred

- [x] [Review][Defer] **Dead code: `flickerAnimation` `reduceMotion` parameter** [`components/StreakFlame.js:27,57-59`] — Always passed as `false`, guard is redundant with calling effect. Deferred, pre-existing code hygiene.
- [x] [Review][Defer] **Negative streak silently returns null** [`components/StreakFlame.js:9`] — `getFlameTier(-1)` returns same as `getFlameTier(0)`. Deferred, data validation concern outside story scope.
- [x] [Review][Defer] **Reduce-motion test: doesn't verify animation was suppressed** [`__tests__/streak-flame.test.js:93`] — Only checks `toJSON() !== null`, not that `Animated.timing` was never called. Minor test completeness.
- [x] [Review][Defer] **streak=0 hides badge entirely** [`screens/HomeScreen.js:359`] — AC 2 says "0-6 days: no flame (streak count only)" but badge is hidden entirely at streak=0. Pre-existing UX decision.

## Dev Agent Record

### Implementation Plan

Story already implemented prior to this dev session. Verified that the component, tests, and integration all match the acceptance criteria.

### Completion Notes

- `components/StreakFlame.js` renders an animated flame with 3 layers (outer glow, mid flame, core) using pure RN `Animated` API
- `getFlameTier` exported as pure function, handles all tiers (0–6 null, 7–29 tier 1, 30–99 tier 2, 100+ tier 3)
- Color shift: coral (`#FF8C42`) → orange (`#FF6B35`) → white-hot (`#FFD700`/`#FFF8DC`)
- Size scaling: 24 → 32 → 40px base
- Flicker uses `Animated.loop` with `Animated.sequence` of rapid timing animations, native driver enabled
- `AccessibilityInfo.isReduceMotionEnabled` respected — renders static shapes with no loop when true
- Integrated into `screens/HomeScreen.js` — rendered inside `streakBadge` next to streak count
- 12 tests pass in streak-flame.test.js, full suite 110/110 no regressions
