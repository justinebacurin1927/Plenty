---
baseline_commit: NO_VCS
---

# Story 9.2: DrinkSizePicker Icon Refresh (Accurate Water Containers)

**Status:** done

## Story

As a user, I want the drink size picker to show icons that actually look like the drink containers I use, so the visual matches reality.

## Acceptance Criteria

1. All 6 drink options get accurate MaterialCommunityIcons instead of generic Ionicons
2. Icon mapping clearly communicates the container shape:
   - 100ml → `cup-water` (small glass)
   - 200ml → `glass-mug` (mug)
   - 250ml → `bottle-tonic` (standard glass)
   - 330ml → `bottle-soda` (can-shaped)
   - 500ml → `glass-tulip` (water bottle)
   - 750ml → `kettle` (large carafe)
3. Import changed from `@expo/vector-icons/Ionicons` to `@expo/vector-icons/MaterialCommunityIcons`
4. All sizes, colors, and badge behavior preserved — visual change only

## Tasks / Subtasks

**Phase 1 — Update import**

- [ ] Change `import { Ionicons }` to `import { MaterialCommunityIcons }` in DrinkSizePicker.js
- [ ] Update JSX usage from `<Ionicons>` to `<MaterialCommunityIcons>`

**Phase 2 — Replace icon names**

- [ ] `cafe-outline` → `cup-water` (100ml)
- [ ] `water-outline` → `glass-mug` (200ml)
- [ ] `water` → `bottle-tonic` (250ml)
- [ ] `flask-outline` → `bottle-soda` (330ml)
- [ ] `wine-outline` → `glass-tulip` (500ml)
- [ ] `flask` → `kettle` (750ml)

**Phase 3 — Verify**

- [ ] `npm test` passes
- [ ] DrinkSizePicker modal renders all 6 icons correctly
- [ ] Icons accurately represent their container names
