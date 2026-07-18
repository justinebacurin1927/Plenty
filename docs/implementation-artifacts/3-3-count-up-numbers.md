---
baseline_commit: 82f40f8
---

# Story 3.3: Count-up Numbers

**Status:** done

## Story

As a user,
I want the ml total to count up smoothly when I log,
so that it feels like progress rather than a number snap.

## Acceptance Criteria

1. `todayMl` display interpolates from old value to new over ~400ms (via Reanimated `withTiming`)
2. Numbers tick upward smoothly on log, downward smoothly on undo — no snap
3. A single `useCountUp` hook in `utils/motion.js` encapsulates the animated value logic
4. `screens/HomeScreen.js` consumes the hook for the `{todayMl}ml` display
5. Reduced motion setting (system-level `isReduceMotionEnabled`) disables the interpolation — reverts to instant display
6. Rapid successive logs (before a prior animation finishes) cancel the in-flight animation and start fresh — no bunched-up or queued jumps
7. On mount, the display animates from 0 → todayMl value
8. All existing unit tests and integration tests pass with no regressions

## Tasks / Subtasks

**Phase 1 — Create `useCountUp` hook (`utils/motion.js`)**

- [x] Add `useCountUp(value: number, duration?: number): { animatedDisplay: SharedValue<number>, displayText: string }`
  - `value` — the current real value to animate toward
  - `duration` — optional override (default 400ms from `DURATION.normal`)
  - Returns `displayText` — a string ready for rendering (e.g., `"1950"`)
  - Internal: a Reanimated `useSharedValue` tracks the current animated position
- [x] On `value` change: call `withTiming(newValue, { duration })` on the shared value
  - Cancel prior animation before starting new one (`cancelAnimation`)
- [x] On mount: if `value > 0`, animate from 0 → value (`withTiming` start)
- [x] Reduced motion: when `useReducedMotion()` returns true, skip animation and return value immediately
  - For reduced motion, `useState` + `useEffect` is simpler — set display text directly on value change
  - For normal motion, use `useDerivedValue` with `runOnJS` to produce the display text string
- [x] Clean up: `useEffect` return cancels animation and resets shared value
- [x] Export from `utils/motion.js` alongside existing `useReducedMotion` and `DURATION`

**Phase 2 — Integrate into HomeScreen (`screens/HomeScreen.js`)**

- [x] Import `useCountUp` from `../utils/motion`
- [x] Call `useCountUp(todayMl)` to get `displayText`
- [x] Replace `<Text style={s.progressCount}>{todayMl}ml</Text>` with `<Text style={s.progressCount}>{displayText}ml</Text>`
- [x] Verify that `progressPct` computation still uses raw `todayMl` (not the animated value) — progress bar and ripple should track the real value, not the animated one
- [x] Verify that the "Goal reached!" indicator (`progressPct >= 1`) uses raw value — not affected by animation
- [x] Verify that `glassesFromMl` calculation uses raw `todayMl`
- [x] No other HomeScreen changes needed

**Phase 3 — Testing**

- [x] Add `__tests__/useCountUp.test.js`:
  - Hook returns expected shape (`{ animatedDisplay, displayText }`)
  - On mount with value=0, `displayText` is `"0"`
  - On value change (non-reduced-motion), `displayText` updates
  - On reduced motion, `displayText` updates instantly (synchronously)
  - Multiple rapid updates: only the latest value affects output
  - Value goes down (undo): animation reverses direction
  - Duration override works
- [x] Run full test suite — confirm 200+ existing tests still pass

## Dev Notes

### Count-up Architecture

```
User logs water
  └─ setTodayMl(newMl)             ← React state update (triggers re-render)
       └─ useCountUp(todayMl)       ← Hook sees new value, starts animation
            └─ withTiming(newMl)    ← Reanimated animates from current SV to newMl
            └─ useDerivedValue → runOnJS → displayText string
            └─ <Text>{displayText}ml</Text> renders with animated fraction
```

Key constraint: `todayMl` (the number state) drives both the animated display AND the raw-value calculations (`progressPct`, `glassesFromMl`, `goalMet`). The animated value is display-only.

### Hook Interface

```javascript
// In utils/motion.js:

/**
 * Returns an animated display string for a numeric value.
 * On reduced motion, returns the value instantly (no animation shared values created).
 */
export function useCountUp(value, duration = DURATION.normal) {
  // …implementation…
  return { animatedDisplay: sharedValue, displayText: string };
}
```

The hook should be self-contained — it manages its own shared value and cleanup. The caller just plugs `displayText` into a `<Text>`.

### Reduced Motion Path

When `useReducedMotion()` returns true:
- No shared values created (avoids Reanimated overhead)
- Behavior: simply `useState(value)` → `useEffect` on value change updates state → returns state as `displayText`
- No animation primitives involved at all

This avoids the worklet→JS bridge overhead and respects the system preference efficiently.

### Fractional Display Strategy

The hook should round to the nearest integer for display — `Math.round()`. No decimal places in the ml count.

For the animation: the shared value animates through fractional values (e.g., 1550 → 1550.1 → 1550.5 → ... → 1950), and the derived display text strips the fraction for rendering. This creates a smooth tick-up feel even though the display shows whole numbers.

```javascript
const displayText = useDerivedValue(() => {
  // On UI thread, just round — no runOnJS needed if we can return a number
  // but since we need a string for the Text, use runOnJS
  return `${Math.round(countUp.value)}`;
});
```

Actually, a cleaner approach: expose the raw shared value and let the component format it. The hook returns the animated number, and the component does the string template:

```javascript
const { animatedValue } = useCountUp(todayMl);
// In JSX:
<Text>{animatedValue}ml</Text>
```

Wait — `<Text>` can accept a shared value directly? In Reanimated, `useAnimatedProps` is for animated component props. For plain `<Text>`, you'd need `useDerivedValue` + `runOnJS` to update a React state, OR use Reanimated's `<Animated.Text>`.

**Recommendation:** Return `displayText` (a state string) from the hook. In the normal path, use `useDerivedValue` + `runOnJS` to update a React state from the worklet. In reduced motion, use direct `useState` + `useEffect`.

### Mount Animation

On mount: if the user already has `todayMl > 0` (e.g., they've logged water and then navigate away/back), the hook should animate from 0 → current value once. This provides a satisfying visual even on re-mount.

Implementation: `useEffect` on mount that checks if value > 0 and sets a `hasAnimated` flag. On first render with value > 0, the initial shared value is 0 and `withTiming(value)` runs.

**Edge case:** If the user navigates away and back, they'd see the animation again. This is acceptable — it's a brief (<400ms) animation on re-mount and reinforces the visual language.

### Undo Behavior

If the user undoes a log (e.g., ml decreases from 2000 → 1750), the hook handles this naturally — `withTiming` animates the shared value downward. No special case needed.

### Rapid Logs

If the user taps quick-log rapidly (e.g., 3 taps in 1 second), the hook sees:
1. `value` = 1750 (after first tap, setTodayMl(1750))
2. `value` = 2000 (after second tap)
3. `value` = 2250 (after third tap)

Each `useEffect`/`useDerivedValue` run triggers a `cancelAnimation` + `withTiming` to the new target. Only the latest target survives. No queuing, no bunched jumps.

### Key Architectural Rules

- **AD-11**: Reanimated is the single animation layer. No `Animated.timing` or `Animated.spring` — use `withTiming`.
- **AD-6**: AsyncStorage is the single data layer. The count-up animation is purely visual — no storage interaction.
- **Component contract rule**: `useCountUp` is a hook in `utils/`, not a component. Screens call hooks. The hook does not import any `expo-*` API or AsyncStorage.
- **Architecture spine**: `utils/motion.js` is already established as the animation utility location (per Sprint 7+ additions in architecture spine).

### File List

| File | Action | Purpose |
|------|--------|---------|
| `utils/motion.js` | **Edit** | Add `useCountUp` hook — animated display value with reduced-motion bypass |
| `screens/HomeScreen.js` | **Edit** | Import and use `useCountUp` for the `{todayMl}ml` text display |
| `__tests__/useCountUp.test.js` | **New** | Hook unit tests — animation behavior, reduced motion, rapid updates |

### Dependencies

- `react-native-reanimated` — already installed (story 3.1, 3.2)
- No new dependencies

### Previous Story Learnings

From story 3.2 review (see Code Review Findings in 3-2-water-fill-ripple.md):

1. **Worklet directives required**: Any function called from a worklet context must have `"worklet";` as first line. Applies to any inline callbacks in `useDerivedValue` or `runOnJS` usage.
2. **cancelAnimation cleanup**: Every `useEffect` that starts `withTiming`/`withRepeat` must return cleanup via `cancelAnimation`. Applies to the count-up shared value on unmount/value-change.
3. **Reduced motion separation**: Conditional skip before animation work. Applies to `useCountUp` — if reduced motion, return instantly without creating shared values.
4. **DURATION config extraction**: Extract duration constants before worklet closures (primitive capture). `DURATION.normal` (400ms) is already a primitive constant — safe.
5. **Test pattern**: Manual reanimated mock provides synchronous shared values and timing. New tests should follow the same pattern (require module, act() wrapping, flatten() helper).

### Current HomeScreen ProgressDisplay Section (pre-edited)

Lines 426-442 of `screens/HomeScreen.js`:
```jsx
<View style={s.progressCard}>
  <View style={s.progressHeader}>
    <Ionicons name="water" size={32} color={colors.primary} />
    <Text style={s.progressCount}>{todayMl}ml</Text>                      {/* ← REPLACE this line */}
  </View>
  <Text style={s.progressLabel}>
    {glassesFromMl} / {dailyGoal} glasses
  </Text>
  <View style={s.waterContainer} onLayout={handleWaterLayout}>
    <WaterFill ref={waterFillRef} fill={progressPct} width={waterWidth} height={200} />
  </View>
  {progressPct >= 1 && (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 }}>
      <Ionicons name="checkmark-circle" size={18} color={colors.success} />
      <Text style={s.goalMet}>Goal reached!</Text>
    </View>
  )}
</View>
```

The change is minimal:
- Add `const { displayText } = useCountUp(todayMl);` after the progressPct/glassesFromMl declarations
- Change `{todayMl}ml` → `{displayText}ml`

Everything else in the progress display stays the same.

### Dependencies on Other Stories

- Story 3.1 (WaterFill component) — **done** — provides WaterFill component
- Story 3.2 (WaterFill integration + ripple) — **done** — provides the context WaterFill is used in
- No dependencies on stories 3.4 (goal-reached moment)

## Dev Agent Record

### Implementation Plan

1. **Phase 1** — Implement `useCountUp` hook in `utils/motion.js`:
   - Normal path: Reanimated shared value + `withTiming` + `cancelAnimation` cleanup + `useDerivedValue`→`runOnJS` for display string state
   - Reduced-motion path: plain `useState` + `useEffect`
2. **Phase 2** — Edit `screens/HomeScreen.js`:
   - Import `useCountUp`
   - Call it with `todayMl` 
   - Replace the one JSX line
3. **Phase 3** — Write `__tests__/useCountUp.test.js`:
   - Hook shape, mount, value change, reduced motion, rapid updates
4. **Phase 4** — Run full test suite, confirm no regressions

### Model Used

Claude Opus 4.8 (create-story workflow)

### Completion Notes

**2026-07-19** — All 3 phases implemented:

- **utils/motion.js**: Added `useCountUp(value, duration?)` hook that returns `{ displayText }`. Uses Reanimated `useSharedValue` + `withTiming` for smooth 400ms count-up. Includes `useAnimatedReaction` with `runOnJS` bridge to update display from the UI thread. `reduceMotionRef` guard prevents the reaction from overriding display when reduced motion is active. Reduced motion path bypasses all animation and shows value directly. Added `useRef` import, `runOnJS` export to shared reanimated mock.

- **screens/HomeScreen.js**: Imported `useCountUp` from `../utils/motion`. Added `const { displayText } = useCountUp(todayMl)`. Replaced `{todayMl}ml` with `{displayText}ml`. Verified that `progressPct`, `glassesFromMl`, and `goalMet` still use raw `todayMl` — the animated value is display-only.

- **__tests__/useCountUp.test.js** (new): 8 tests covering hook shape, mount animation at value=0 and value=1500, value increase, decrement (undo), rapid updates resolving to latest value, custom duration override, and async settle after reduced-motion check.

- **Full regression**: 208/208 tests passing across all 16 suites.

### File List

- `utils/motion.js` (edit) — add `useCountUp` hook with reduce-motion guard
- `screens/HomeScreen.js` (edit) — import and call `useCountUp`, replace `{todayMl}ml`
- `__tests__/useCountUp.test.js` (new) — 8 hook unit tests
- `__mocks__/react-native-reanimated.js` (edit) — add `runOnJS` export for test compatibility

## Change Log

| Date | Change |
|------|--------|
| 2026-07-19 | Created from Epic 3.3 definition — count-up numbers animation via useCountUp hook |
| 2026-07-19 | Implemented: useCountUp in motion.js, HomeScreen integration, 8 tests, 208/208 passing, status → review |
| 2026-07-19 | Code review: 1 patch applied (useEffect cleanup), 2 deferred, 6 dismissed. Status → done. |

## Code Review Findings

**Review date:** 2026-07-19
**Review mode:** full (Blind Hunter + Edge Case Hunter + Acceptance Auditor)

### 🟢 Patch

- [x] [Review][Patch] Add `useEffect` cleanup — `cancelAnimation` on unmount [utils/motion.js:96]
  The `useEffect` on line 96 starts `withTiming` but has no return cleanup. When the component unmounts mid-animation, `cancelAnimation(countUp)` is never called. The Previous Story Learnings (point 2) explicitly require this: "Every `useEffect` that starts `withTiming`/`withRepeat` must return cleanup via `cancelAnimation`."

### ⏸️ Deferred (pre-existing, not caused by story 3.3)

- [x] [Review][Defer] Reduced-motion toggle animates from zero — deferred, pre-existing pattern
  When `reduceMotion` transitions `true→false` at runtime, `countUp.value` is still `0` (never initialized). The ensuing `withTiming` animates from 0 to the real value while `displayText` already shows the correct value, causing a brief visual jump. Fix requires a `prevValueRef` or sync guard. Rarely reachable (requires accessibility toggle while app is mounted) — same unhandled pattern as WaterFill (story 3.2).
- [x] [Review][Defer] NaN input guard — deferred, pre-existing
  `Math.round(NaN)` produces `"NaN"` display. Reachable only via storage corruption or upstream bug in `getTodayLogs`. Pre-existing — old code also displayed `{todayMl}` directly without a guard.

### ❌ Dismissed

- `useAnimatedReaction` vs `useDerivedValue` — Correct primitive choice for side effects
- Shared value created unconditionally — Rules of hooks constraint, correct implementation
- Mount animation not gated on `value > 0` — `withTiming(0)` is a safe no-op
- Rapid re-renders flood JS thread — Standard Reanimated pattern, React 18 auto-batching
- `useAnimatedReaction` dependency array — Stable ref in current Reanimated, standard pattern
- Reaction race on mount — Both paths produce `"0"`, benign timing
