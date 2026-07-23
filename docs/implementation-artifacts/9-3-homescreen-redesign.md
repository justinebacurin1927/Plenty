---
baseline_commit: NO_VCS
---

# Story 9.3: HomeScreen Redesign (Mascot Spacing, Glass Shape, Banners, CTA)

**Status:** done

## Story

As a user, I want the home screen to look tighter and more polished — mascot closer to the dialogue, a slimmer glass, refined banners, and the drink button centered.

## Acceptance Criteria

1. Mascot and title/dialogue are brought closer together — reduce vertical gap between the mascot area and the title/description text
2. Glass SVG path is slimmed — narrower top-to-bottom silhouette (currently top margin 16%, bottom margin 26%)
3. Fire streak on glass redesigned — current doesn't look right, make it integrate better with the glass shape
4. Warning (red) banner redesigned — no longer looks like a system error; app-grade design using Plenty's visual language
5. Average/goal suggestion banner redesigned to match other banners visually (consistent styling)
6. "I drank water" button centered horizontally (currently not centered)
7. All changes preserve dark mode, reduced-motion, and existing functionality
8. No functionality broken — drink logging, reminders, streak display all work as before

## Tasks / Subtasks

**Phase 1 — Mascot spacing adjustment**

- [ ] Reduce padding/margin between mascot container and title/dialogue area
- [ ] Adjust layout to bring them visually closer

**Phase 2 — Glass shape refinement**

- [ ] Adjust SVG path control points in glass shape rendering
- [ ] Slim the glass (reduce top margin, narrow waist)
- [ ] Verify it still wraps WaterFill correctly

**Phase 3 — Fire streak redesign**

- [ ] Redesign how the fire streak integrates with the glass
- [ ] Ensure it looks cohesive with the glass shape

**Phase 4 — Banner redesigns**

- [ ] Warning (red) banner: app-grade redesign — use colored background with icon + text, not system-alert styling
- [ ] Average/goal suggestion banner: match banner styling of other banners for consistency

**Phase 5 — Center CTA button**

- [ ] Move "I drank water" button layout to be horizontally centered
- [ ] Keep PressableScale behavior, haptics, and all existing functionality

**Phase 6 — Verify**

- [ ] `npm test` passes
- [ ] HomeScreen renders correctly in light and dark mode
- [ ] Drink logging works end-to-end
- [ ] Banners display correctly in all states (no banner, warning, suggestion)
