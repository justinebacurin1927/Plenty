---
baseline_commit: NO_VCS
---

# Story 3.2: Integrate WaterFill + Ripple on Log

**Status:** done

## Story

As a user, I want the water to ripple when I log a drink, so there's a satisfying visual reward for every tap.

## Acceptance Criteria

1. The flat progress bar on HomeScreen (`barBg`/`barFill`) is replaced with `WaterFill`, using the same container width and showing the daily goal progress as a body of water
2. On `logDrink`, the water level animates up smoothly (the `fill` prop changes and WaterFill's built-in `withTiming` does the interpolation)
3. A brief amplitude spike (ripple) animates through the wave and settles back to normal (~600ms)
4. The ripple is a one-shot animation triggered on each log, layered on top of the continuous wave idle animation
5. The ripple does NOT interrupt the continuous horizontal phase animation — both run in parallel
6. The ripple amplitude decays smoothly: spike at t=0, decays over ~600ms back to the configured layer amplitude
7. Respects reduced-motion setting — no ripple animation when reduced motion is enabled
8. The "X / Y glasses" label and todayMl count still display above or beside the WaterFill (existing text/icon layout is preserved)
9. "Goal reached!" indicator (`progressPct >= 1`) still shows below the WaterFill after goal hit
10. Full test suite passes with no regressions

## Tasks / Subtasks

**Phase 1 — Add ripple animation mechanism to WaterFill (`components/WaterFill.js`)**

- [x] Add `rippleAmplitude` shared value (initialized to 0, driven by a `withTiming` spike on trigger)
- [x] Add `triggerRipple()` function exported or callback-based that:
  - If reduced motion, returns immediately
  - Sets `rippleAmplitude.value` to a spike value (e.g., 20px for layer 0, 30px for layer 1)
  - Animates back to 0 over ~600ms with ease-out
- [x] Add `ripplePhase` shared value that captures the current phase as the ripple center
- [x] Modify `buildWavePath` calls in `useAnimatedProps` to add the ripple amplitude:
  - Ripple contribution = `rippleAmplitude * gaussian(x - rippleCenter, sigma)` where gaussian decays from the center
  - This creates a localized amplitude bulge that moves with the phase
- [x] Cancel ripple animation on unmount via cleanup (consistent with existing `cancelAnimation` pattern)
- [x] The ripple must not reset or interfere with continuous phase animations

**Phase 2 — Integrate WaterFill into HomeScreen (`screens/HomeScreen.js`)**

- [x] Import `WaterFill` from `../components/WaterFill`
- [x] Replace the `barBg`/`barFill` View pair with `<WaterFill>` inside the `progressCard`:
  - Set `fill` prop to `progressPct`
  - Set `width` prop to a known container width (use `useWindowDimensions` or `onLayout`)
  - Set `height` prop appropriate for the water display area (~200px for the new water container, replacing the 12px bar)
- [x] Keep the `progressHeader` (water icon + todayMl) and `progressLabel` (glasses count) above the WaterFill
- [x] Keep the "Goal reached!" indicator below the WaterFill
- [x] Store a ref to WaterFill (or use a callback prop) to trigger the ripple on each log
- [x] In the `logDrink` handler, after the state updates, call the ripple trigger
- [x] Handle edge case: ripple triggers but WaterFill is not visible (e.g., reduced motion)

**Phase 3 — Ripple animation math (`utils/wave.js`)**

- [x] Add `rippleY(x, center, amplitude, sigma)` pure function:
  - Returns `amplitude * Math.exp(-((x - center) ** 2) / (2 * sigma ** 2))`
  - This is a Gaussian bump centered at `center` with height `amplitude` and width controlled by `sigma`
- [x] Add `RIPPLE_CONFIG` constant: `{ spikeAmplitude: 20, sigma: 60, duration: 600 }`
- [x] Update `buildWavePath` to accept an optional `rippleFn` parameter:
  - `rippleFn(x)` returns the additional y-offset at position x (0 when no ripple active)
  - Add the ripple offset to `sineY` result for each point on the curve
- [x] Update all existing call sites that lack `rippleFn` to use `() => 0` default
- [x] Unit tests for `rippleY` in `__tests__/wave.test.js`

**Phase 4 — WaterFill container layout**

- [x] The WaterFill container on HomeScreen needs a defined height. Create a water display area that:
  - Is visually distinct from the flat bar (taller, shows the wave)
  - Has rounded corners matching the `progressCard` style (borderRadius 20)
  - Clips to bounds so the wave doesn't overflow
  - Shows the water body + wave layers within
- [x] Use `onLayout` on the water container to get the exact width for WaterFill's `width` prop
- [x] Use `Svg` clipping at the container level — the existing `water-clip` clipPath handles this (from story 3.1)

**Phase 5 — Edge Cases**

- [x] Fill=0 → empty container with wave at bottom (existing WaterFill behavior, verify in context)
- [x] Fill=1 → full container, wave crest barely visible at top (existing)
- [x] Rapid successive logs → each log triggers a new ripple. If a ripple is already active, the new one replaces it (don't queue)
- [x] Ripple during reduced motion → no-op (guarded at triggerRipple)
- [x] WaterFill container width change (orientation, split-screen) → `onLayout` fires, width prop updates
- [x] Component unmount during ripple → cancelAnimation in cleanup prevents leaks

**Phase 6 — Testing**

- [x] Write `__tests__/WaterFillRipple.test.js` with:
  - WaterFill renders inside HomeScreen layout context (mock reanimated + svg, use existing mock pattern)
  - Verify rippleY returns 0 when amplitude=0
  - Verify rippleY returns amplitude at center (x === center)
  - Verify rippleY decays to near-0 at distance (x = center ± 5*sigma)
  - Verify RIPPLE_CONFIG has expected keys
- [x] Add ripple tests to `__tests__/wave.test.js` (pure function tests for `rippleY`)
- [x] Run full test suite — confirm 178+ existing tests still pass, new tests pass

## Dev Notes

### Ripple Architecture

```
logDrink()
  └─ setTodayMl(newMl)            ← React state update (drives progressPct)
  └─ waterFillRef.triggerRipple() ← One-shot amplitude spike
       └─ rippleAmplitude.value = 20 (withTiming decay to 0, 600ms)
       └─ (continuous phase animation continues uninterrupted)
```

The ripple is a **localized amplitude spike** — not a separate animation layer. Instead of adding a third path layer, the ripple modifies the existing wave paths by adding a Gaussian bump centered at the ripple position.

```
Ripple shape at t=0:
  ~~~~/\~~~~  ← sine wave with Gaussian bump
     /  \
    /    \
   /      \   ← amplitude = 20px, sigma = 60px

Ripple at t=600ms:
  ~~~~~~~~~~  ← back to normal sine wave (amplitude decayed to 0)
```

The Gaussian bump is parameterized by:
- `amplitude` — height of the ripple (decays from 20 → 0 over 600ms)
- `sigma` — width/spread of the ripple (30–60px, constant during decay)
- `center` — the x-coordinate of the ripple peak (driven by current phase)

### Implementation Design

**Triggering the ripple:**

The simplest approach is a `useImperativeHandle` ref. WaterFill exposes a `triggerRipple()` method that the parent calls.

Alternatively, add an `onRipple` callback prop and use a `rippleKey` counter prop — each increment triggers one ripple. The ref approach is simpler and doesn't require a new prop wire.

**Ripple in the animated props:**

```javascript
// Inside WaterFill's useAnimatedProps for each layer:
const gaussian = (x, center, amplitude, sigma) => {
  'worklet';
  if (amplitude < 0.5) return 0; // skip when negligible
  return amplitude * Math.exp(-((x - center) ** 2) / (2 * sigma ** 2));
};

// In waveProps1:
gaussian(x, rippleCenter, rippleAmplitude, RIPPLE_CONFIG.sigma)
  + sineY(x, LAYER_CONFIG[0].amplitude, ...)

// In waveProps2:
gaussian(x, rippleCenter, rippleAmplitude * 0.7, RIPPLE_CONFIG.sigma * 1.2)
  + sineY(x, LAYER_CONFIG[1].amplitude, ...)
```

The `rippleCenter` is computed from the current phase:
```javascript
const rippleCenter = (phase1.value % (2 * Math.PI)) / (2 * Math.PI) * containerWidth.value;
```

This places the ripple at the current wave crest. The `gaussian` function is a worklet-compatible pure function.

**Cancelling the ripple on new trigger:**
If a ripple is already animating and a new log comes in, call `cancelAnimation(rippleAmplitude)` then restart it. This prevents ripple buildup.

### Ripple Config

| Parameter | Value | Note |
|-----------|-------|------|
| `spikeAmplitude` | 20 | px — peak height of the Gaussian bump |
| `sigma` | 60 | px — spread of the bump (~1/5 of container width) |
| `duration` | 600 | ms — decay time from spike to 0 |
| `layerScale` (back) | 0.7 | multiplier for back layer amplitude (maintains depth) |

### WaterFill Container on HomeScreen

The current progress card layout (lines 414–431 of HomeScreen.js):
```
[progressHeader]  ← water icon + todayMl
[progressLabel]   ← "X / Y glasses"
[barBg / barFill] ← 12px tall flat bar   ← REPLACE with WaterFill
[goalMet]         ← "Goal reached!" when >= 100%
```

The replacement:
```
[progressHeader]  ← water icon + todayMl (UNCHANGED)
[progressLabel]   ← "X / Y glasses" (UNCHANGED)
[WaterFill]       ← 200px tall animated wave (NEW, replaces barBg/barFill)
[goalMet]         ← "Goal reached!" (UNCHANGED)
```

Container styles for the WaterFill wrapper:
```jsx
<View style={waterContainerStyle}>
  <WaterFill fill={progressPct} width={containerWidth} height={200} />
</View>
```

Water container style:
```javascript
waterContainer: {
  width: '100%',
  height: 200,
  borderRadius: 12,
  overflow: 'hidden',
  marginTop: 12,
}
```

The `containerWidth` should be captured from `onLayout` on the `progressCard` or water container itself, accounting for the 32px horizontal padding (16px card margin × 2 + 32px paddingHorizontal = 64px subtracted from screen width).

### Ripple on Reduced Motion

When reduced motion is enabled:
- `triggerRipple()` returns immediately (no amplitude spike)
- Continuous wave animation is also skipped (existing behavior from 3.1 review fix)
- The WaterFill still renders and responds to `fill` prop changes

### Ripple in Tests

The manual reanimated mock (`__mocks__/react-native-reanimated.js`) already supports:
- `useSharedValue` — synchronous value get/set
- `withTiming` — returns target value immediately
- `cancelAnimation` — no-op

For ripple tests, mock `triggerRipple` by checking that `rippleAmplitude` shared value is set when called. Since the mock's `withTiming` is synchronous, the amplitude will be set and immediately decay to 0 in tests — but the test can verify the amplitude was set at all (which confirms the trigger path fires).

### Key Files

| File | Action | Purpose |
|------|--------|---------|
| `components/WaterFill.js` | **Edit** | Add ripple animation + `triggerRipple` via `useImperativeHandle` |
| `utils/wave.js` | **Edit** | Add `rippleY` pure function, `RIPPLE_CONFIG`, update `buildWavePath` signature |
| `screens/HomeScreen.js` | **Edit** | Replace `barBg`/`barFill` with `WaterFill`, trigger ripple on log |
| `__tests__/wave.test.js` | **Edit** | Add `rippleY` and `RIPPLE_CONFIG` unit tests |
| `__tests__/WaterFillRipple.test.js` | **New** | Ripple integration tests |
| `__mocks__/react-native-reanimated.js` | **No change needed** | Existing mock covers `cancelAnimation`, `useSharedValue`, `withTiming`, `createAnimatedComponent` |

### Dependencies

- `react-native-reanimated` (already installed — story 3.1)
- `react-native-svg` (already installed — story 3.1)
- No new dependencies

### Previous Story Learnings

From story 3.1 review (see Senior Developer Review section in 3-1-water-fill-component.md):

1. **cancelAnimation pattern** — Every `useEffect` that starts infinite `withRepeat` must return cleanup. Apply to any new animation shared values (rippleAmplitude).
2. **LAYER_CONFIG extraction** — Extract config values before worklet closures. Apply to any new configs (RIPPLE_CONFIG).
3. **Test patterns** — The manual reanimated mock in `__mocks__/react-native-reanimated.js` provides synchronous shared values and timing. New tests should follow the same pattern (require module, act() wrapping, flatten() helper for tree walking).
4. **Dark mode** — Colors are already handled by `useTheme()` in WaterFill. The ripple is a path modification (not a color change), so dark mode is automatically handled.

## Dev Agent Record

### Implementation Plan

1. **Phase 1** — Create `rippleY()` function and `RIPPLE_CONFIG` in `utils/wave.js`. Write pure-function tests in `__tests__/wave.test.js`.
2. **Phase 2** — Add `useImperativeHandle` + ripple shared values to `WaterFill.js`. Modify `useAnimatedProps` callbacks to include Gaussian bump. Add cleanup.
3. **Phase 3** — Create `__tests__/WaterFillRipple.test.js` with ripple trigger and structure tests.
4. **Phase 4** — Edit `screens/HomeScreen.js` to replace `barBg`/`barFill` with `WaterFill`, wire ripple trigger to `logDrink`.
5. **Phase 5** — Run full test suite, confirm 179+ tests pass with no regressions.

### Completion Notes

**2026-07-18** — All 6 phases implemented:

- **utils/wave.js**: Added `rippleY()` pure function (Gaussian bump), `RIPPLE_CONFIG` constant, and optional `rippleFn` parameter on `buildWavePath`. Default rippleFn is `() => 0` for backward compatibility.
- **components/WaterFill.js**: Wrapped with `forwardRef` and added `useImperativeHandle` to expose `triggerRipple()`. Added `rippleAmplitude` shared value initialized to 0. In each `useAnimatedProps` callback, computes ripple center from current wave phase and applies Gaussian bump via rippleFn. `cancelAnimation` cleanup on unmount for the ripple shared value. Reduced motion guard returns immediately.
- **screens/HomeScreen.js**: Imported WaterFill, replaced the 12px `barBg`/`barFill` flat bar with a 200px `waterContainer` holding `<WaterFill>`. Added `waterFillRef` (useRef) and `waterWidth` state with `onLayout` handler for responsive width. `logDrink` calls `waterFillRef.current?.triggerRipple()` after state updates. Removed `barBg`/`barFill` style definitions, added `waterContainer` style.
- **__tests__/wave.test.js**: Added 10 new tests covering `rippleY` (zero amp, center peak, symmetry, sigma default), `RIPPLE_CONFIG` (keys, values), and `buildWavePath` with `rippleFn`.
- **__tests__/WaterFillRipple.test.js** (new): 10 tests covering component structure, triggerRipple via ref (at various fill levels, multiple calls, no ref), unmount after ripple, and reduced motion guard.

**Test results**: 200/200 tests passing across 15 suites (up from 179).

### Known Limitations

- The ripple is a Gaussian bump, not a fluid simulation. It looks good but isn't physically accurate.
- The ripple center is tied to the wave phase, so the ripple always originates at the current wave crest position. This is deliberate — it looks natural — but means the ripple doesn't appear at a fixed position on the container.
- Rapid successive logs: each new log cancels the prior ripple and starts fresh. No queuing.

### Key Technical Decisions

- **useImperativeHandle ref** — Simplest wire from HomeScreen to WaterFill. Avoids adding a new prop that changes every log.
- **Gaussian bump** — Simple, worklet-compatible math (just `exp`). No physics simulation needed.
- **Modify existing paths rather than add a third layer** — The ripple is a temporary amplitude modification, not a separate visual layer. No additional SVG element.
- **Ripple center from phase** — The ripple appears at the current wave crest, not a fixed x-position. This looks organic.

### Dependencies

- `react-native-reanimated` — already installed
- `react-native-svg` — already installed

## Change Log

| Date | Change |
|------|--------|
| 2026-07-20 | Created from Epic 3.2 definition — WaterFill integration + ripple on log |
| 2026-07-18 | All 6 phases implemented — 200/200 tests pass, status → review |
| 2026-07-18 | Code review: 4 patches applied (+worklet directives, waterWidth init, layout guard, sigma guard). 9 items deferred. Status → done |

## Code Review Findings

**Review date:** 2026-07-18
**Review outcome:** Approved with patches applied
**Review mode:** full (Blind Hunter + Acceptance Auditor + Edge Case Hunter)

### 🟢 Patch (Story 3.2)

- [x] [Review][Patch] Add `"worklet";` directives to `sineY`, `buildWavePath`, and `rippleY` [utils/wave.js]
  Functions called from `useAnimatedProps` closures need `"worklet";` for guaranteed UI-thread execution.
- [x] [Review][Patch] Use better initial width for WaterFill to avoid 200px→real width jump [screens/HomeScreen.js:433]
  `waterWidth` now initialized from `Dimensions.get("window").width - 48` instead of 0; `|| 200` fallback removed.
- [x] [Review][Patch] Guard `handleWaterLayout` against same-width re-renders [screens/HomeScreen.js:84]
  `setWaterWidth` now uses updater function to skip when width hasn't changed.
- [x] [Review][Patch] Guard `rippleY` against sigma=0 to avoid silent invisible ripple [utils/wave.js:111]
  `safeSigma = Math.max(sigma, 1)` added; `"worklet";` directive added.

### ⏸️ Deferred (pre-existing, not caused by story 3.2)

- [x] [Review][Defer] NaN interval in re-arm effect on fresh install [screens/HomeScreen.js:317] — pre-existing
- [x] [Review][Defer] Cross-platform Linking.openURL uses iOS-only scheme [screens/HomeScreen.js:598] — pre-existing
- [x] [Review][Defer] No error feedback when freeze application fails [screens/HomeScreen.js:211] — pre-existing
- [x] [Review][Defer] Rapid-fire storage writes on custom interval keystroke [screens/HomeScreen.js:546] — pre-existing
- [x] [Review][Defer] Fire-and-forget scheduleMilestoneCelebration with no caller error boundary [screens/HomeScreen.js:295] — pre-existing
- [x] [Review][Defer] checkMissedDay exception silently disables freeze feature [screens/HomeScreen.js:171] — pre-existing
- [x] [Review][Defer] loadData races when called multiple times [screens/HomeScreen.js:170] — pre-existing
- [x] [Review][Defer] addWater callback stale closure over todayMl/dailyGoal [screens/HomeScreen.js:280] — pre-existing
- [x] [Review][Defer] Inconsistent ref creation style (useRef vs React.useRef) [screens/HomeScreen.js:88,91] — pre-existing

### ❌ Dismissed

- Gaussian worklet closure captures RIPPLE_CONFIG.sigma — Primitive value captured correctly
- Reduced motion ripple vs milestone notification — Separate systems, not inconsistent
- rippleFn extreme values distort Bezier control points — Ripple amplitude capped at 20px, theoretical
- cp1y naming for Q command — Valid naming for quadratic bezier control point

## Change Log

## File List

- `components/WaterFill.js` (edit) — add ripple animation + `useImperativeHandle` ref
- `utils/wave.js` (edit) — add `rippleY` function and `RIPPLE_CONFIG`
- `screens/HomeScreen.js` (edit) — replace flat progress bar with WaterFill
- `__tests__/wave.test.js` (edit) — add ripple math unit tests
- `__tests__/WaterFillRipple.test.js` (new) — ripple trigger and integration tests
