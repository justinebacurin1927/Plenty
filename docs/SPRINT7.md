# Sprint 7 — Animations & Design Revision

> **Goal:** Elevate the app from functional to delightful — a cohesive visual
> design pass plus meaningful motion. Hydration should *feel* rewarding, and the
> UI should read as intentional and premium, not default.
> **Status:** Planned (depends on Sprint 6 stability; establishes the design
> system that Sprint 9 later ports to iOS)

---

## Why This Sprint

Features are complete (Sprints 1–5) and the app is being hardened and shipped
(Sprint 6). What's missing is *feel*. The current UI is clean but static: the
progress bar is a flat fill, logging a drink gives a 50ms buzz, and screens cut
between each other with no transitions. There's a solid foundation to build on —
`constants/colors.js` tokens, dark mode, a `Mascot` with expressions, and an
`AchievementPopup` with confetti — but no shared motion layer and no formal
design system.

Doing this now (before adaptive UI in Sprint 8 and the iOS port in Sprint 9)
means the design tokens and animation primitives are defined once and reused
everywhere.

---

## Locked Decisions

- **Water-fill tech:** `react-native-svg` animated with `react-native-reanimated`
  (a wave `<Path>` whose amplitude/offset animate). No Skia, no Lottie.
- **Motion system:** Reanimated 3 is the one motion layer for all *new* animation.
  Existing legacy `Animated` code (`Mascot.js` bounce, `AchievementPopup.js`
  confetti) keeps working — RN `Animated` and Reanimated coexist. We migrate those
  two only if time allows (D3, E2), not as a requirement.
- **Haptics:** `expo-haptics` on tap feedback, gated by `Platform` + reduced-motion.
- **Design assets:** empty-state illustrations / layout mockups authored in Canva;
  the water animation is code-drawn (not an imported asset).

---

## Dependencies & Setup (do once, before Epic C)

| Package | Why | Install |
|---------|-----|---------|
| `react-native-reanimated` | Motion foundation (Epic B) | `npx expo install react-native-reanimated` |
| `react-native-svg` | Wave path for water-fill (Epic C) | `npx expo install react-native-svg` |
| `expo-haptics` | Tactile feedback (Epic D) | `npx expo install expo-haptics` |

- Verify the **Reanimated Babel plugin** is active (`babel-preset-expo` includes it
  in SDK 55 — confirm `babel.config.js`; add `react-native-reanimated/plugin` last
  if missing).
- These are **native** deps → requires a new dev-client / preview build. **Not OTA.**

---

## Epic A — Design System & Visual Audit

Make the look intentional and consistent before animating it.

| # | Task | Detail | Status |
|---|------|--------|--------|
| A1 | Screen-by-screen audit | Catalog spacing/type/color/shadow inconsistencies | ⬜ Planned |
| A2 | Type + spacing scale | Define and apply a type + spacing scale | ⬜ Planned |
| A3 | Structural color tokens | Add radius/elevation tokens (light + dark) | ⬜ Planned |
| A4 | Component consistency | Unify cards, chips, buttons, banners | ⬜ Planned |
| A5 | Empty & loading states | Designed empty states + skeleton loaders | ⬜ Planned |

**A1 — Screen-by-screen audit**
- *How:* Walk HomeScreen, LogScreen, SettingsScreen, AchievementsScreen. Log every raw
  spacing/radius/shadow value and off-token color. Screenshot annotations from Canva welcome.
- *Files:* none (produces `docs/DESIGN_AUDIT.md`).
- *Done when:* every inconsistency is catalogued with a proposed token.

**A2 — Type & spacing scale**
- *How:* Type scale (`display/title/heading/body/label/caption` with size + weight + lineHeight)
  and spacing scale (`xs 4, sm 8, md 12, lg 16, xl 24, 2xl 32`).
- *Files:* new `constants/typography.js`, `constants/spacing.js` (or a single `constants/tokens.js`); consume via `useTheme`.
- *Done when:* tokens exist and HomeScreen consumes them (pilot).

**A3 — Extend `colors.js` with structural tokens**
- *How:* Add `radius` (sm/md/lg/pill) and `elevation` (shadow presets 1–3 for light+dark); keep the light/dark split.
- *Files:* `constants/colors.js`, `context/ThemeContext.js`.
- *Done when:* shadows/radii come from tokens, not inline literals.

**A4 — Component consistency**
- *How:* Unify interval chips, progress card, escalation/weather banners, Settings rows onto the new tokens.
- *Files:* `screens/HomeScreen.js`, `screens/SettingsScreen.js`, `components/WeatherBanner.js`, `components/MonthlyReport.js`. (Optional: shared `components/Card.js`, `components/Chip.js`.)
- *Done when:* the same visual element looks identical everywhere.

**A5 — Empty & loading states**
- *How:* Designed empty states for Log (no drinks) and Achievements (none unlocked), plus skeletons while loading. Illustrations from Canva → `assets/`.
- *Files:* `screens/LogScreen.js`, `screens/AchievementsScreen.js`, new `components/EmptyState.js`, `components/Skeleton.js`.
- *Done when:* no screen shows a bare/blank area during load or when empty.

---

## Epic B — Motion Foundation

Set up the animation layer once, accessibly.

| # | Task | Detail | Status |
|---|------|--------|--------|
| B1 | Add Reanimated | Install/configure; rebuild dev client | ⬜ Planned |
| B2 | Motion utilities | Shared spring/timing presets + hooks | ⬜ Planned |
| B3 | Reduced-motion support | Respect OS "reduce motion" | ⬜ Planned |
| B4 | Performance guardrails | UI-thread animations, 60fps, no jank | ⬜ Planned |

**B1 — Add Reanimated**
- *How:* Install, enable Babel plugin, rebuild dev client, smoke-test a trivial `withSpring`.
- *Files:* `package.json`, `babel.config.js`.
- *Done when:* a test animation runs on device at 60fps.

**B2 — Motion utilities**
- *How:* Central presets — `springs` (gentle/bouncy), `timings` (fast 150 / base 250 / slow 400), reusable hooks (`usePressScale`, `useCountUp`).
- *Files:* new `utils/motion.js`.
- *Done when:* components import presets instead of hand-tuning per animation.

**B3 — Reduced-motion support**
- *How:* Read `AccessibilityInfo.isReduceMotionEnabled()` + subscribe; expose `useReducedMotion()`. When on, animations resolve instantly.
- *Files:* `utils/motion.js` (hook), consumed by C/D/E.
- *Done when:* toggling OS "reduce motion" removes non-essential motion.

**B4 — Performance guardrails**
- *How:* Keep animated values on the UI thread (worklets); prefer transform/opacity over layout; verify with the perf monitor.
- *Files:* review across animated components.
- *Done when:* logging a drink + goal celebration hold 60fps on a mid-range device.

---

## Epic C — Signature Water Animation  ⭐ (the hero)

The one thing users should screenshot.

| # | Task | Detail | Status |
|---|------|--------|--------|
| C1 | `WaterFill` component | Animated SVG wave, data-driven fill | ⬜ Planned |
| C2 | Integrate + ripple on log | Replace flat bar; ripple on drink | ⬜ Planned |
| C3 | Count-up numbers | Animate the ml total | ⬜ Planned |
| C4 | Goal-reached moment | Overflow/shimmer at 100% | ⬜ Planned |

**C1 — `WaterFill` component (animated SVG wave)**
- *How:* SVG with a clipped wave `<Path>`. `fill` prop (0–1) drives the wave's vertical position; a Reanimated shared value animates a horizontal `phase` offset for continuous motion. Two overlaid waves (different speed/opacity) read as depth.
- *Files:* new `components/WaterFill.js`; pure wave-path math in `utils/wave.js` (unit-testable — ties to Sprint 6).
- *Done when:* a standalone `WaterFill fill={0.37}` renders a moving 37% water level.

**C2 — Integrate into Home + pour/ripple on log**
- *How:* Replace the flat `barBg`/`barFill` in HomeScreen with `WaterFill` driven by `progressPct`. On `logDrink`, trigger a one-shot bump/ripple (amplitude spike that settles).
- *Files:* `screens/HomeScreen.js` (progress card), `components/WaterFill.js`.
- *Done when:* the level animates up and ripples the moment a drink is logged.

**C3 — Count-up numbers**
- *How:* `useCountUp` interpolates the `todayMl` display old→new over ~400ms.
- *Files:* `utils/motion.js`, `screens/HomeScreen.js` (the `{todayMl}ml` text).
- *Done when:* the ml total counts up instead of snapping.

**C4 — Goal-reached moment**
- *How:* At 100%, water "overflows" (brief overshoot + shimmer) and "Goal reached!" animates in; reuse confetti sparingly.
- *Files:* `screens/HomeScreen.js`, `components/WaterFill.js`.
- *Done when:* crossing 100% gives a distinct, satisfying beat.

---

## Epic D — Micro-interactions & Transitions

| # | Task | Detail | Status |
|---|------|--------|--------|
| D1 | Button + tap feedback | Press scale + haptics | ⬜ Planned |
| D2 | Screen / tab transitions | Smooth modal/tab transitions | ⬜ Planned |
| D3 | Mascot motion upgrade | Idle bob + smoother reactions | ⬜ Planned |
| D4 | Streak flame | Flame intensifies with streak | ⬜ Planned |

**D1 — Button + tap feedback**
- *How:* A `Pressable` wrapper scaling to ~0.96 (spring back) + `Haptics.impactAsync` on key actions (log, start/stop, amount picker). Gated by reduced-motion + `Platform`.
- *Files:* new `components/PressableScale.js`, applied in HomeScreen/SettingsScreen.
- *Done when:* primary buttons feel tactile; no haptics when reduced-motion is on.

**D2 — Screen / tab transitions**
- *How:* Tasteful transitions for modals (amount picker, achievement popup) and, where supported, tab-switch fade/slide. Subtle.
- *Files:* `App.js` (navigator options), modal components.
- *Done when:* navigation no longer hard-cuts.

**D3 — Mascot motion upgrade**
- *How:* Gentle idle bob + smoother reaction transitions. Optionally port the existing `Animated` loop to Reanimated.
- *Files:* `components/Mascot.js`.
- *Done when:* the mascot feels alive at rest.

**D4 — Streak flame**
- *How:* Animate the streak-badge flame (flicker/scale) intensifying with streak length.
- *Files:* `screens/HomeScreen.js` (streak badge), maybe new `components/StreakFlame.js`.
- *Done when:* longer streaks visibly burn hotter.

---

## Epic E — Delight & Feedback States

| # | Task | Detail | Status |
|---|------|--------|--------|
| E1 | Log confirmation toast | Animated toast on each log | ⬜ Planned |
| E2 | Achievement polish | Refine popup entrance/confetti | ⬜ Planned |
| E3 | Pull-to-refresh | Animated refresh on Log/Home | ⬜ Planned |
| E4 | Chart entrance | Weekly bars animate in | ⬜ Planned |

**E1 — Log confirmation toast**
- *How:* Lightweight animated toast ("+250ml logged") sliding in on each log, auto-dismiss.
- *Files:* new `components/Toast.js`, triggered from `HomeScreen.logDrink`.
- *Done when:* every log gives clear, non-blocking confirmation.

**E2 — Achievement polish**
- *How:* Refine `AchievementPopup` entrance easing/confetti; optionally migrate to Reanimated. Visual only.
- *Files:* `components/AchievementPopup.js`.
- *Done when:* the unlock moment feels premium, not abrupt.

**E3 — Pull-to-refresh**
- *How:* Animated refresh control on Log (and Home if useful) to re-pull today's data.
- *Files:* `screens/LogScreen.js`, `screens/HomeScreen.js`.
- *Done when:* pulling down refreshes with smooth feedback.

**E4 — Chart entrance animation**
- *How:* The Last-7-Days bars grow from 0 to value on mount/focus, staggered.
- *Files:* `screens/LogScreen.js` (the `chartRow`/bar render).
- *Done when:* the weekly chart animates in instead of appearing static.

---

## Suggested Build Order

1. **A2 + A3 + B1** — tokens + Reanimated installed (foundation; unblocks everything).
2. **B2 + B3** — motion presets + reduced-motion (every later task depends on these).
3. **C1 → C4** — the hero water-fill (highest user impact).
4. **A4 + A5** — roll tokens across components + empty/loading states.
5. **D1 → D4** — micro-interactions.
6. **E1 → E4** — delight states.
7. **A1** audit is a scouting pass done first, executed throughout.

---

## Testing Hooks (ties to Sprint 6)

Animations are hard to unit-test, but the **pure logic** is not — cover:
- `utils/wave.js` — wave-path point generation for a given fill/phase.
- `useCountUp` interpolation math (old→new over duration).
- `useReducedMotion` gating (returns instant values when enabled).
Component/interaction correctness is verified on-device (Sprint 6 test matrix).

---

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Reanimated Babel plugin misconfig → cryptic crashes | Verify plugin first (B1) before any animation work |
| Water-fill perf on low-end Android | Cap wave points, transform-only animation, test early (B4) |
| Scope creep (a design revision can be endless) | Must-haves = tokens + hero water-fill + haptics; D/E are "nice to have" |
| Two motion systems coexisting | Allowed; migrating Mascot/Popup is optional, not blocking |
| Native rebuild required | Batch all three installs before building once |

---

## Success Criteria

- A documented design system (type scale, spacing, color/elevation tokens) applied across all screens.
- A signature animated water-fill that reacts when the user logs a drink.
- Key interactions have tactile feedback (motion + haptics) and smooth transitions.
- All motion respects the OS reduced-motion setting and holds 60fps.
- No functional regressions — this is a visual/motion layer over existing features.

## Out of Scope

- iOS-specific polish and haptics tuning (Sprint 9).
- New product features or reminder-logic changes (Sprint 8).
- A full rebrand — this refines the existing identity, it doesn't replace it.
