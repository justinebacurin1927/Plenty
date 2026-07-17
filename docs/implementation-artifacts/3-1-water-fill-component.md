---
baseline_commit: NO_VCS
---

# Story 3.1: Animated SVG Wave (WaterFill Component)

**Status:** review

## Story

As a user, I want to see a moving water wave instead of a flat progress bar, so the app feels alive and premium.

## Acceptance Criteria

1. `WaterFill` component renders an SVG wave with two layers (sine wave paths)
2. Each layer has independent horizontal phase offset, speed, and opacity → creates depth illusion from the overlapping layers
3. `fill` prop (0–1) drives the wave's vertical position via a `react-native-reanimated` shared value
4. Continuous wave motion even when idle — the wave never stops flowing
5. Smooth animated transition when `fill` changes (e.g., 0.4 → 0.5) — no snap jumps
6. Pure worklet-based UI-thread animation maintaining 60fps (no JS-thread `Animated.timing`)
7. Respects dark mode colors — wave gradient adapts via `useTheme()`
8. Wave path math is in `utils/wave.js` as pure functions — unit-testable independently of React

## Tasks / Subtasks

**Phase 1 — Install Dependencies**

- [x] Install `react-native-svg` via `npx expo install react-native-svg`
- [x] Install `react-native-reanimated` via `npx expo install react-native-reanimated`
- [x] Add `react-native-reanimated/plugin` to Babel config in `babel.config.js`
- [x] Update `jest.config.js` transformIgnorePatterns if needed for `react-native-reanimated` and `react-native-svg`
- [x] Verify both install cleanly and the app still builds in Expo Go / dev client

**Phase 2 — Wave Math (`utils/wave.js`)**

- [x] Create `utils/wave.js` with pure functions:
  - `sineY(t, amplitude, frequency, phase)` — returns y for a given x using `A * sin(f * x + phase) + baseline`
  - `buildWavePath(width, height, fillRatio, amplitude, frequency, phase)` — returns an SVG path string for the water surface
  - `LAYER_CONFIG` constant: 2 layers with different amplitudes, frequencies, phases, and opacities (layer 1: amplitude=8, speed=1x, opacity=0.85; layer 2: amplitude=12, speed=0.7x, opacity=0.4)
- [x] Pure functions only — no React, no hooks, no side effects
- [x] Unit tests in `__tests__/wave.test.js`

**Phase 3 — WaterFill Component (`components/WaterFill.js`)**

- [x] Create `components/WaterFill.js` — a `react-native-reanimated` + `react-native-svg` component
- [x] Two `<Path>` layers using the SVG path from `buildWavePath()`:
  - Layer 1 (front): faster, sharper, higher opacity → the visible surface
  - Layer 2 (back): slower, wider amplitude, lower opacity → depth illusion
- [x] `fill` prop (number 0–1) drives vertical position via `useSharedValue` + `useAnimatedProps`
- [x] Animated horizontal scrolling via `useAnimatedProps` on each layer's path — loops indefinitely using `withRepeat(withTiming(...))` or a modulo-driven shared value
- [x] Wave fills the container width and sits at the bottom of the container (water rises from the bottom)
- [x] The area below the wave surface is filled with the wave color (the "water body" behind/below the wave line)
- [x] Use `useTheme()` to pick wave gradient colors from `constants/colors.js`:
  - Light mode: primary `#4A90D9` for wave body, with lighter/darker variants for gradient depth
  - Dark mode: primary `#6BB5FF` for wave body
  - The droplet mascot SVGs use a teal-green gradient (`#7FE0BE` → `#3FBE92` → `#0F6E56`) — the WaterFill wave should use the app's brand blue palette (`primary`) for consistency with the existing UI, not the droplet teal (which belongs to the mascot)
- [x] Clips content inside the container bounds

**Phase 4 — Dark Mode Support**

- [x] Wave colors switch with theme via `useTheme()` → `colors.primary` and `colors.primaryLight`
- [x] Reanimated values don't need restarting — colors update declaratively via animated props
- [x] Test by rendering WaterFill in both light and dark theme contexts

**Phase 5 — Edge Cases**

- [x] `fill=0`: wave sits at bottom of container (empty glass)
- [x] `fill=1`: wave covers full container (full glass) — wave crest still barely visible at top
- [x] `fill=0.5`: wave at midpoint
- [x] Handle container resize (orientation change, dynamic height)
- [x] Animated props clean up on unmount (cancel animations)

**Phase 6 — Testing**

- [x] Create `__tests__/wave.test.js` with tests covering:
  - `sineY` returns correct values for known inputs
  - `buildWavePath` produces valid SVG path string
  - `buildWavePath` path length changes with width/fillRatio
  - `LAYER_CONFIG` has exactly 2 entries with expected keys
- [x] Create `__tests__/WaterFill.test.js` with basic rendering test (mock reanimated + svg)
- [x] Run full test suite — confirm no regressions

## Dev Notes

### SVG Wave Architecture

```
WaterFill
  ├── Svg (container, clips to bounds)
  │   ├── Rect (water body fill — below wave line)
  │   ├── Path (layer 2 — back, slower, more transparent)
  │   └── Path (layer 1 — front, faster, more opaque)
  └── Reanimated (drives phaseX shared values → animated SVG props)
```

The wave surface is a sine curve across the container width. Two layers with different frequencies and speeds create a parallax-like depth effect. The entire area below the wave curve is filled with the wave color to make it look like the container is "filled" with water.

### Wave Math

```
y(x) = A * sin(2π * f * x + phase) + baseline

Where:
  A = amplitude (pixels of wave height)
  f = frequency (waves per container width)
  phase = horizontal offset (animated → continuous scroll)
  baseline = container height * (1 - fillRatio) — the "resting" water level
```

The phase is animated continuously:
- Layer 1: phase increases at ~0.02 rad/frame (speed 1x)
- Layer 2: phase increases at ~0.014 rad/frame (speed 0.7x), started at π/2 offset

### Colors from Theme

The WaterFill uses the app's existing `colors.primary` and `colors.primaryLight` tokens (brand blue). The droplet mascot SVGs use a separate teal-green gradient (`#7FE0BE` → `#3FBE92` → `#0F6E56`) that belongs to the mascot character — the wave component uses brand colors for consistency.

```javascript
// Light mode:  primary=#4A90D9, primaryLight=#A0C4E8
// Dark mode:   primary=#6BB5FF, primaryLight=#4A7FA8
```

### Reanimated Worklet Pattern

```javascript
const phase1 = useSharedValue(0);
const phase2 = useSharedValue(Math.PI / 2); // offset start

// Continuous animation
useEffect(() => {
  phase1.value = withRepeat(withTiming(2 * Math.PI, { duration: 3000 }), -1, false);
  phase2.value = withRepeat(withTiming(2 * Math.PI + Math.PI / 2, { duration: 4200 }), -1, false);
}, []);

// Use useDerivedValue to compute path string at 60fps
const path1 = useDerivedValue(() => {
  return buildWavePath(width, height, fill.value, LAYER_CONFIG[0].amplitude, LAYER_CONFIG[0].frequency, phase1.value);
});
```

Note: `withRepeat` with `-1` loops forever. For the wave effect, we want the phase to increase linearly, not `withTiming` from 0 to 2π which repeats by resetting (causing a visible jump). Instead, use a single `useAnimatedProps` pattern:

```javascript
const animatedProps1 = useAnimatedProps(() => {
  const currentPhase = (phase1.value % (2 * Math.PI));
  const d = buildWavePath(width, height, fill.value, LAYER_CONFIG[0].amplitude, LAYER_CONFIG[0].frequency, currentPhase);
  return { d };
});
```

### Dark Mode

The wave path itself is just a path string — Reanimated drives it on the UI thread regardless of colors. For theme changes:
- Pass colors as props or consume `useTheme()` in the component
- On theme change, the SVG `fill` prop updates (it's a standard prop, not animated)
- The phase animations don't need restarting

### Integration with HomeScreen

Story 3.2 will replace the current `ProgressBar` in HomeScreen with `WaterFill`. For now, `WaterFill` is a standalone component that receives `fill` (0–1) and renders the animated wave. The integration can be verified by rendering it in isolation.

### Key Files

| File | Action | Purpose |
|------|--------|---------|
| `utils/wave.js` | **New** | Pure wave math functions (`sineY`, `buildWavePath`, `LAYER_CONFIG`) |
| `components/WaterFill.js` | **New** | Reanimated SVG water wave component |
| `utils/motion.js` | **New** | Reusable `useReducedMotion` hook and animation presets |
| `__tests__/wave.test.js` | **New** | Unit tests for wave math |
| `__tests__/WaterFill.test.js` | **New** | Component render test |
| `babel.config.js` | Edit | Add `react-native-reanimated/plugin` |
| `jest.config.js` | Edit | Update transform ignore patterns |

### Dependency Changes

- Add `react-native-svg` (approximate recent version, compatible with Expo SDK 55 / RN 0.83.6)
- Add `react-native-reanimated` (approximate recent v3.x, compatible with Expo SDK 55 / RN 0.83.6)

### Reference: Mascot Droplet SVGs

The project root contains 3 SVG mascot character files:
- `floating_droplet_slime.svg` — idle droplet character with teal gradient body
- `floating_droplet_tap_to_talk.svg` — droplet with tap-to-talk mouth animation
- `floating_droplet_talking.svg` — droplet with open mouth animation

These define the water droplet mascot's visual identity (gradient: `#7FE0BE→#3FBE92→#0F6E56`, glossy highlight, shadow: `#0C447C`). These are separate from the WaterFill wave — the mascot is a character, the wave is the water level indicator. Both share the water theme but use different color palettes for visual distinction.

## Dev Agent Record

### Implementation Plan

1. **Phase 1** — Install dependencies: `react-native-reanimated@4.2.1`, `react-native-svg@15.15.3`, create `babel.config.js` with reanimated plugin, update `jest.config.js`.
2. **Phase 2** — Create `utils/wave.js` with pure `sineY`, `buildWavePath`, `LAYER_CONFIG`. Write `__tests__/wave.test.js` (15 tests). Create `utils/motion.js` with `useReducedMotion` and `DURATION`.
3. **Phase 3** — Build `components/WaterFill.js` with two SVG wave layers driven by Reanimated `useSharedValue`, `useAnimatedProps`, `withRepeat`/`withTiming`. `fill` prop (0–1) animated smoothly. Continuous wave motion via phase cycling.
4. **Phase 4** — Dark mode via `useTheme()`: `isDark ? colors.primary : colors.primaryLight` for back layer, `colors.primary` always for front layer and water body.
5. **Phase 5** — Edge cases: fill=0 (empty), fill=1 (full), negative/over-1 values, container resize via shared value sync, reduced motion disables animation.
6. **Phase 6** — Write `__tests__/WaterFill.test.js` (17 tests covering structure, fill props, dark mode, default props). Create `__mocks__/react-native-reanimated.js` manual mock to bypass reanimated native modules in jsdom.

### Key Technical Decisions

- **Manual reanimated mock**: Created `__mocks__/react-native-reanimated.js` providing synchronous mock implementations of `useSharedValue`, `useAnimatedProps`, `withTiming`, `withRepeat`, `createAnimatedComponent`, and SVG components. This avoids native module crashes in jsdom test environment.
- **wave.js worklet compatibility**: Pure functions with no closure state — callable from both worklet and JS contexts.
- **Phase cycling**: `withRepeat(withTiming(2π, { duration: 3000, easing: Easing.linear }), -1, false)` — phase resets from 2π→0 are visually invisible because `sin(θ+2π) = sin(θ)`.
- **Layout resize**: Width/height synced to shared values via `useEffect` so `useAnimatedProps` callbacks work with layout changes.

### Known Limitations

- Does not include `LinearGradient` DOM-based SVG gradient (not supported by react-native-svg in the Fabric architecture without custom native components).
- The manual reanimated mock in `__mocks__/react-native-reanimated.js` is specific to this project's test setup and may need updating with future reanimated releases.

### Completion Notes

All 6 phases complete. Component renders animated SVG wave with two layers, smooth `fill` transitions, dark mode support, and reduced motion respect. Full test suite: **178 tests passing** across 14 suites.

## Change Log

| Date | Change |
|------|--------|
| 2026-07-19 | Created from Epic 3.1 definition — animated SVG wave component |
| 2026-07-19 | Phases 1–6 complete — WaterFill component, wave math, motion presets, tests (178/178) |

## File List

- `utils/wave.js` (new) — pure wave math functions (`sineY`, `buildWavePath`, `LAYER_CONFIG`)
- `components/WaterFill.js` (new) — Reanimated + SVG wave component with two-layer animation
- `utils/motion.js` (new) — `useReducedMotion` hook and `DURATION` presets
- `__mocks__/react-native-reanimated.js` (new) — manual jest mock for reanimated native modules
- `__tests__/wave.test.js` (new) — 15 unit tests for wave math functions
- `__tests__/WaterFill.test.js` (new) — 18 component tests (structure, fill, dark mode, defaults, lifecycle)
- `babel.config.js` (new) — add `react-native-reanimated/plugin`
- `jest.config.js` (edit) — extend `transformIgnorePatterns` for reanimated + worklets

## Senior Developer Review (AI)

**Review date:** 2026-07-19
**Review outcome:** Approved with fixes applied
**Review mode:** full (Blind Hunter + Acceptance Auditor + Edge Case Hunter)

### Findings Summary

| Severity | Count | Status |
|----------|-------|--------|
| 🔴 HIGH | 1 | Fixed |
| 🟡 MEDIUM | 3 | Fixed |
| 🔵 LOW | 6 | Fixed (5/6) |

### Action Items

- [x] **HIGH** — Add `cancelAnimation` on unmount to prevent infinite Reanimated animation leaks across navigation cycles (`WaterFill.js:59-85`)
- [x] **MEDIUM** — Replace `useReducedMotion` stub with real `AccessibilityInfo.isReduceMotionEnabled()` API (`motion.js:19-42`)
- [x] **MEDIUM** — Restore dark mode depth illusion by using `primaryLight` for back wave layer in all color schemes (`WaterFill.js:144`)
- [x] **MEDIUM** — Add lifecycle cleanup test for unmount behavior (`WaterFill.test.js:170-178`)
- [x] **LOW** — Fix Q-curve control point math to pass through sine midpoint (`wave.js:48-62`)
- [x] **LOW** — Guard against zero-width degenerate SVG paths (`wave.js:44`)
- [x] **LOW** — Initialize `animatedFill` from `fill` prop to avoid fill-from-empty on remount (`WaterFill.js:41`)
- [x] **LOW** — Extract `LAYER_CONFIG` values before worklet closures for better Reanimated compatibility (`WaterFill.js:100-102`)
- [ ] **LOW** — (Noted) Theoretical one-frame desync between SVG viewBox and animated shared values — not addressed as fix would overcomplicate component for no observable benefit
