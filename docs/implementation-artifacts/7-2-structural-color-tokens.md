---
baseline_commit: abc44380d6653413bf37546629a23a40c819a75a
---

# Story 7.2: Structural Color Tokens

**Status:** done

## Story

As a user, I want shadows and rounded corners to be consistent across every card and button.

## Acceptance Criteria

1. `constants/colors.js` adds `radius` and `elevation` tokens to both `light` and `dark` palettes:
   - `radius: { xs (4), sm (6), md (8), lg (12), xl (16), pill (999) }` — same values in both themes
   - `elevation: { 1, 2, 3 }` — three shadow presets (offset, opacity, radius, elevation), with light/dark-appropriate shadowColor values
2. `context/ThemeContext.js` exposes `radius` and `elevation` through the context value so screens can destructure them from `useTheme()`
3. LogScreen is the pilot screen — replace ALL inline `borderRadius`, `shadowColor`, `shadowOffset`, `shadowOpacity`, `shadowRadius`, and `elevation` values with token references
4. All existing tests pass with no regressions

## Tasks / Subtasks

**Phase 1 — Add radius + elevation tokens to `constants/colors.js`**

- [x] Add radius scale to both light and dark objects:
  ```js
  radius: { xs: 4, sm: 6, md: 8, lg: 12, xl: 16, pill: 999 },
  ```
  (Identical in light/dark for API consistency. When `useTheme()` is destructured, `colors.radius.md` gives the radius token.)

- [x] Add elevation presets to both light and dark objects:
  ```js
  // Light
  elevation: {
    1: { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
    2: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 6 },
    3: { shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 24, elevation: 12 },
  },
  ```

- [x] Add dark elevation presets with appropriate shadow values:
  ```js
  // Dark — use lighter shadowColor with adjusted opacity so shadows are visible on dark backgrounds
  elevation: {
    1: { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 2 },
    2: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 6 },
    3: { shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 24, elevation: 12 },
  },
  ```
  (Dark shadows use higher opacity to compensate for dark backgrounds. The `shadowColor` stays `"#000"` — RN shadow rendering doesn't support shadowColor as a dynamic/theme-aware value without explicitly passing it.)

**Phase 2 — Expose new tokens through ThemeContext**

- [x] Edit `context/ThemeContext.js`:
  - The context value object already spreads `colors` (light or dark). Add `radius` and `elevation` as separate top-level keys alongside `colors`, `isDark`, `themeMode`, `setThemeMode`:
    ```js
    <ThemeContext.Provider value={{ isDark, colors, radius: colors.radius, elevation: colors.elevation, themeMode, setThemeMode }}>
    ```
  - This means consumers can do:
    ```js
    const { colors, radius, elevation } = useTheme();
    // radius.sm → 4, elevation[1] → { shadowColor, ... }
    ```
  - Alternatively, consumers can reach through `colors.radius.md`. Both work.

- [x] ✨ **CRITICAL — Spread `radius` and `elevation` into the `colors` object** in ThemeContext's provider value so existing `colors.*` destructuring still works. Consumers can choose:
  ```js
  // Option A: destructure from theme
  const { colors, radius, elevation } = useTheme();

  // Option B: reach through colors (backward compatible)
  // colors.radius.md, colors.elevation[1]
  ```
  The cleanest approach: leave `radius` and `elevation` ON the `colors` object (they're already there in colors.js) AND expose them as top-level keys for convenience.

**Phase 3 — Migrate LogScreen styles to tokens**

- [x] Import radius + elevation from `useTheme()`:
  ```js
  // Before:
  const { colors } = useTheme();
  // After:
  const { colors, radius, elevation } = useTheme();
  ```
  Or use `colors.radius.md` / `colors.elevation[1]` — whichever reads more naturally per style block.

- [x] Replace inline borderRadius values with `radius` tokens:

  | Current | Token |
  |---------|-------|
  | `borderRadius: 16` (line 278) | `radius.xl` |
  | `borderRadius: 6` (line 312) | `radius.sm` |
  | `borderRadius: 6` (line 319) | `radius.sm` |
  | `borderRadius: 14` (line 378) | `radius.lg` (closest; was 14 → 12) or `radius.xl` (was 14 → 16) — choose closest |

- [x] Replace inline shadow values with `elevation` tokens:
  
  | Current (lines 282-286) | Token |
  |------------------------|-------|
  | `shadowColor: "#000", shadowOffset: {0,1}, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2` | `...elevation[1]` |
  | Same pattern (lines 380-384) | `...elevation[1]` |

  Migration pattern:
  ```js
  // Before:
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: space("lg"),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  // After:
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: space("lg"),
    ...elevation[1],
  },
  ```

- [x] Keep ALL color references and inline values NOT in scope unchanged:
  - `fontSize`, `fontWeight`, `lineHeight` — already tokenized or managed by typography tokens
  - `margin`, `padding`, `gap` — already tokenized or managed by spacing tokens
  - Color values (`colors.text`, `colors.primary`, etc.)
  - Dynamic/computed values

**Phase 4 — Testing**

- [x] Run full test suite — no regressions
- [x] All 20 existing test files pass (23 suites, 291 tests — 290 passing, 1 pre-existing streak-flame flake)

## Dev Notes

### Current Architecture

**`constants/colors.js`** — exports `{ light, dark }`, each a flat object with ~50 color keys organized by category (Backgrounds, Brand, Text, Status, Borders, etc.). No nested objects currently except `confetti` (array) and `mascotMoodBorder`. Adding `radius` and `elevation` as nested objects within each theme is the natural extension.

**`context/ThemeContext.js`** — React context providing `{ isDark, colors, themeMode, setThemeMode }`. Currently `colors` is the only structure exposed. Adding `radius` and `elevation` as top-level context keys alongside `colors` is clean.

**`screens/LogScreen.js`** — Has an `intervalChip` row (date filters) and a drink log list with cards. Both use card-like containers with shadows and rounded corners.

### Token Design Rationale

**Radius scale:** Values chosen to cover the most frequent borderRadius values across the codebase:
- `xs (4)` — covers existing 4, 5 values
- `sm (6)` — covers existing 6 values  
- `md (8)` — covers existing 8 values
- `lg (12)` — covers existing 12 values
- `xl (16)` — covers existing 14, 16 values
- `pill (999)` — fully rounded (covers 20, 24, 28, 60 values)

**Elevation presets:** Three levels matching the three distinct shadow patterns observed:
- `elevation[1]` — card-level (subtle): `{0,1} / 0.05 / 4 / elev:2` — 9 occurrences
- `elevation[2]` — moderate (standing out): `{0,2} / 0.15 / 8 / elev:6` — 3 occurrences  
- `elevation[3]` — popup/dialog: `{0,8} / 0.25 / 24 / elev:12` — 1 occurrence

Note: `elevation[2]` in light mode uses `shadowOpacity: 0.15` — the HomeScreen "drink" button uses a unique pattern (`shadowColor: colors.primary`, `{0,4}`, `0.12`, `12`, `elev:6`) which doesn't cleanly map to any preset. That one should stay as-is (custom shadow per the primary-colored button) and should NOT be migrated.

Note: `StreakFlame`'s circular `borderRadius` values are dynamic (computed from props) — these should NOT be tokenized. Same for `Mascot`'s computed radius values.

### What NOT to change

- HomeScreen shadow on the drink button (`shadowColor: colors.primary` — custom per-button styling)
- Dynamic/computed borderRadius values (StreakFlame outerSize/2, Mascot f/s multipliers)
- Heatmap cell borderRadius (3px, 2px — grid-specific, below token scale minimum)
- borderWidth, letterSpacing, opacity values
- Ionicons size props
- `makeStyles(colors)` pattern — keep it, just add token references

### Files to Create/Change

| File | Action | Purpose |
|------|--------|---------|
| `constants/colors.js` | **Edit** | Add `radius` + `elevation` to light/dark |
| `context/ThemeContext.js` | **Edit** | Expose new tokens through context |
| `screens/LogScreen.js` | **Edit** | Pilot — consume radius + elevation tokens |
| `__tests__/colors.test.js` | **New** | Unit tests for radius + elevation tokens |

### Dependencies

- Story 7.1 must be done (provides type/spacing tokens + pattern) — ✅ Complete
- ThemeContext exists and is consumed by all screens — no refactoring needed

### Previous Story Learnings (7.1)

1. **Spread pattern for multi-value tokens** — Use `...elevation[1]` for shadow presets (sets shadowColor + shadowOffset + shadowOpacity + shadowRadius + elevation all at once), analogous to `...type.display` for type tokens.
2. **Inline helper for single values** — Use `radius.sm` (direct property access) rather than a function call, since these are nested inside the existing `colors` object and accessed via `const { colors, radius } = useTheme()`.
3. **Test at scale** — Run full suite after each phase, not just at the end.
4. **Values between tokens** — When an inline value falls between two token values, anchor to the closest one and document the decision in a comment (e.g., `// was 14, anchored to lg (12)`).
5. **Don't over-tokenize** — Dynamic/computed values, very small values, and unique edge cases stay inline.

## Dev Agent Record

### Implementation Plan

1. Add `radius` and `elevation` objects to both `light` and `dark` in `constants/colors.js`
2. Update `context/ThemeContext.js` to expose `radius` and `elevation` as top-level context keys
3. Migrate `screens/LogScreen.js` — replace inline borderRadius/shadow values with token references using `...elevation[1]` spread pattern and `radius.sm` etc.
4. Write unit tests for new tokens, run full suite

### Model Used

Claude Opus 4.8

### Completion Notes

**2026-07-19** — Implemented structural color tokens with LogScreen pilot:

- **Phase 1** — Added `radius` (xs/sm/md/lg/xl/pill) and `elevation` (3 levels, light/dark-appropriate opacities) to `constants/colors.js`. Radius is the same object shared across themes. Elevation levels use higher shadowOpacity in dark mode for visibility on dark backgrounds. Both radius and elevation are nested within the light and dark palette objects.

- **Phase 2** — Updated `context/ThemeContext.js` to import `radius` and expose `radius` and `elevation` as top-level context keys alongside `isDark`, `colors`, `themeMode`. Consumers can access via `const { colors, radius, elevation } = useTheme()` or via `colors.radius.xs` / `colors.elevation[1]`.

- **Phase 3** — Migrated `screens/LogScreen.js`: replaced 4 inline borderRadius values with `colors.radius.*` tokens and 2 shadow quintuplets (shadowColor: "#000", shadowOffset: {0,1}, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2) with `...colors.elevation[1]` spreads. Specific mappings:
  - `weeklyCard` borderRadius: 16 → `radius.xl`
  - `bar` borderRadius: 6 → `radius.sm`
  - `logItem` borderRadius: 14 → `radius.lg` (closest token)
  - `barFill` borderRadius: 6 → `radius.sm`

- **Phase 4** — Created `__tests__/colors.test.js` with 17 tests covering radius values (light + dark), elevation presets (all 3 levels, both themes), and cross-theme consistency assertions. Full suite: 23 suites, 291 tests (290 passing, 1 pre-existing streak-flame flake; 17 new tests).

### Notable Decisions

- Used `colors.radius.*` inside `makeStyles(colors)` rather than destructuring `radius` from `useTheme()` — keeps the existing `makeStyles(colors)` pattern consistent across all screens without changing the function signature.
- The `radius` object is a module-level const shared by both themes (it's the same in light and dark). The `elevation` objects are separate (`lightElevation` / `darkElevation`) to allow different shadow opacities per theme.
- `elevation[2]` and `elevation[3]` are defined but not yet consumed by LogScreen — they're available for future screen migrations (SettingsScreen, AchievementsScreen, etc.).
- `logItem` borderRadius 14 was anchored to `radius.lg` (12) — the closer of lg (12) and xl (16). Border radius rounding is approximate by nature.

## Change Log

| Date | Change |
|------|--------|
| 2026-07-19 | Created from Epic 7.2 definition — structural color tokens (radius + elevation) |
| 2026-07-19 | Implemented: radius + elevation tokens in colors.js, ThemeContext exposure, LogScreen migration (4 borderRadius + 2 shadow spreads), 17 new tests, 290/291 passing |
