---
baseline_commit: abc44380d6653413bf37546629a23a40c819a75a
---

# Story 7.1: Type + Spacing Tokens

**Status:** done

## Story

As a developer, I want a shared type and spacing scale so every screen uses consistent sizing.

## Acceptance Criteria

1. Type scale exported from `constants/typography.js` with tokens: `display / title / heading / body / label / caption / small` — each with size, weight, lineHeight
2. Spacing scale exported from `constants/spacing.js` with tokens: `xs (4) / sm (8) / md (12) / lg (16) / xl (24) / 2xl (32)` plus intermediate values `xxs (2) / xsm (6) / smd (10) / lgm (14) / lgx (20) / 3xl (40)`
3. Both modules follow the same pattern as `constants/colors.js` — plain JS objects, exported as named constants
4. HomeScreen (pilot screen) consumes new tokens — replace inline font-size, margin, padding, gap, and borderRadius values with token references
5. ThemeContext does NOT need modification — tokens are plain JS exports, not theme-dependent (font size and spacing are the same in light/dark)
6. All existing tests pass with no regressions

## Tasks / Subtasks

**Phase 1 — Create `constants/typography.js`**

- [x] Define type scale tokens as named constants:
  ```js
  export const type = {
    display: { fontSize: 36, fontWeight: "800", lineHeight: 44 },
    title:   { fontSize: 28, fontWeight: "700", lineHeight: 36 },
    heading: { fontSize: 22, fontWeight: "700", lineHeight: 28 },
    body:    { fontSize: 16, fontWeight: "400", lineHeight: 24 },
    label:   { fontSize: 15, fontWeight: "600", lineHeight: 22 },
    caption: { fontSize: 13, fontWeight: "600", lineHeight: 18 },
    small:   { fontSize: 12, fontWeight: "400", lineHeight: 16 },
  };
  ```
- [x] Export named helper: `fontSize(token)` returns `type[token].fontSize`, for inline use in StyleSheet
- [x] Export named helper: `lineHeight(token)` returns `type[token].lineHeight`

**Phase 2 — Create `constants/spacing.js`**

- [x] Define spacing tokens:
  ```js
  export const spacing = {
    xxs: 2, xs: 4, xsm: 6, sm: 8, smd: 10,
    md: 12, lgm: 14, lg: 16, lgx: 20,
    xl: 24, 2xl: 32, 3xl: 40,
  };
  ```
- [x] Export named helper: `space(token)` returns `spacing[token]`, for inline use in StyleSheet

**Phase 3 — Migrate HomeScreen styles to tokens**

- [x] Import `{ type, fontSize, lineHeight }` from `../constants/typography` and `{ spacing, space }` from `../constants/spacing` in `screens/HomeScreen.js`
- [x] Replace ALL inline `fontSize` values with `fontSize("token")` calls
- [x] Replace ALL inline `marginTop`, `marginBottom`, `marginLeft`, `marginRight`, `marginVertical`, `marginHorizontal`, `paddingVertical`, `paddingHorizontal`, `gap`, `borderRadius`, `width`, `height`, `top`, `bottom`, `left`, `right`, `paddingTop`, `paddingBottom`, `paddingLeft`, `paddingRight` values with `space("token")` calls, EXCEPT:
  - Values < 2 (like `1`, `1.5`) — keep inline (borderWidth, opacity, etc.)
  - Dynamic values computed from props (like `height: MAX_BAR`) — keep dynamic
  - Percentage values (like `width: "100%"`) — keep as-is
  - Icon sizes passed as props to Ionicons — keep as-is
- [x] Keep all color references unchanged — color tokens are managed by ThemeContext
- [x] Keep `fontWeight` and `lineHeight` values inline UNLESS using the type token shorthand

**Phase 4 — Testing**

- [x] Create `__tests__/typography.test.js`:
  - Exports expected type tokens
  - fontSize() helper returns correct values
  - lineHeight() helper returns correct values
- [x] Create `__tests__/spacing.test.js`:
  - Exports expected spacing tokens
  - space() helper returns correct values
- [x] Run full test suite — no regressions (274/274 passing)

## Dev Notes

### Current Architecture

**`constants/` directory** — currently has two files:
- `colors.js` — light/dark theme palettes (exported `{ light, dark }`)
- `rewards.js` — streak milestone definitions

**Pattern to follow:** New token files follow the same `constants/` convention — plain JS modules exporting named constants. No classes, no objects with methods.

**Theme separation:** Font sizes and spacing values are NOT theme-dependent. They're the same in light and dark mode. So they don't go into ThemeContext — they're plain imports.

### HomeScreen Inline Values to Migrate

**Font sizes found in HomeScreen:**
| Current | Token |
|---------|-------|
| 36 | display |
| 28 | title |
| 22 | heading |
| 18 | body (bold variant) |
| 16 | body |
| 15 | label |
| 14 | caption (weight 600 is label) |
| 13 | caption |
| 12 | small |

**Spacing values found in HomeScreen:**
| Current | Token |
|---------|-------|
| 2 | xxs |
| 4 | xs |
| 6 | xsm |
| 8 | sm |
| 10 | smd |
| 12 | md |
| 14 | lgm |
| 16 | lg |
| 20 | lgx |
| 24 | xl |
| 28 | xl (close) / migrate to xl+4 manually |
| 32 | 2xl |
| 40 | 3xl |

### Migration Strategy

Before:
```js
title: {
  fontSize: 36,
  fontWeight: "700",
  color: colors.text,
  letterSpacing: 1,
},
```

After:
```js
title: {
  ...type.display,
  color: colors.text,
  letterSpacing: 1,
},
```

Before:
```js
marginTop: 16,
paddingHorizontal: 24,
```

After:
```js
marginTop: space("lg"),
paddingHorizontal: space("xl"),
```

### What NOT to change

- Color values (`colors.text`, `colors.primary`, etc.) — managed by ThemeContext
- `fontWeight` — it's fine inline, the type spread handles it
- `lineHeight` — the type spread handles it
- Dynamic values (computed from props or state)
- Percentage values
- Very small values (< 2) used for borders, shadows, etc.
- Icon sizes passed to `<Ionicons size={...}>`

### Files to Create/Change

| File | Action | Purpose |
|------|--------|---------|
| `constants/typography.js` | **New** | Type scale tokens + helpers |
| `constants/spacing.js` | **New** | Spacing scale tokens + helpers |
| `screens/HomeScreen.js` | **Edit** | Pilot — consume type + spacing tokens |
| `__tests__/typography.test.js` | **New** | Unit tests for typography tokens |
| `__tests__/spacing.test.js` | **New** | Unit tests for spacing tokens |

### Dependencies

- None — new files reference no external dependencies

### Previous Story Learnings (Epic 6)

1. **Plain JS export pattern** — `constants/colors.js` and `constants/rewards.js` both export plain JS objects. Follow this pattern — no classes or factories.
2. **Test pattern** — Create focused unit tests for the new modules, run full suite after.
3. **Don't break existing patterns** — The `makeStyles(colors)` pattern in screens stays. Just replace inline values with token references.
4. **Review-recommended patch patterns** — Use `space("token")` and `fontSize("token")` inline rather than object spreads for single-value properties. Use spread for type blocks that set fontSize + fontWeight + lineHeight together.

## Dev Agent Record

### Implementation Plan

1. Create `constants/typography.js` with 7 type tokens + `fontSize()` / `lineHeight()` helpers
2. Create `constants/spacing.js` with 12 spacing tokens + `space()` helper
3. Migrate `screens/HomeScreen.js` `makeStyles()` — replace inline fontSize/space values with token references
4. Write unit tests for both new modules, run full suite

### Model Used

Claude Opus 4.8

### Completion Notes

**2026-07-19** — Implemented type and spacing token system with HomeScreen pilot:

- **Phase 1** — Created `constants/typography.js` with 7 tokens (display/title/heading/body/label/caption/small) + `fontSize()` and `lineHeight()` helpers
- **Phase 2** — Created `constants/spacing.js` with 12 tokens (xxs → 3xl) + `space()` helper
- **Phase 3** — Migrated HomeScreen's entire `makeStyles()` function (~60 styles): all fontSize values replaced with `fontSize("token")` or `...type.token` spreads, all spacing values replaced with `space("token")` calls. Excluded values < 2, dynamic values, percentages, icon sizes, and values outside the scale (80, 26, 42, 200, 340, 360, etc.)
- **Phase 4** — Created `__tests__/typography.test.js` (14 tests) and `__tests__/spacing.test.js` (16 tests). Full suite: 22 suites, 274/274 passing (no regressions)

### Notable Decisions

- Used `...type.token` spread for styles that set fontSize + fontWeight together (title → `...type.display`, streakText → `...type.label`, progressCount → `...type.display`, goalMet → `...type.label`), which also adds lineHeight consistency
- Used `fontSize("token")` inline for styles that only set fontSize (subtitle, peakHintText, escalationText, etc.)
- Values with no token match (80 scroll padding, 26 share btn, 42 freeze emoji, 200 water height, 340/360 maxWidths) kept as inline literals
- 28 → `space("xl") + 4` per spec guidance
- freezeDesc uses `lineHeight("label")` which returns 22 — same as original value

## Change Log

| Date | Change |
|------|--------|
| 2026-07-19 | Created from Epic 7.1 definition — type + spacing tokens |
| 2026-07-19 | Implemented: typography.js (7 tokens), spacing.js (12 tokens), HomeScreen migration (60+ style replacements), 30 new tests, 274/274 passing |
