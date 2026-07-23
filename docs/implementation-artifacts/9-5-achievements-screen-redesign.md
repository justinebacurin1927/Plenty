---
baseline_commit: NO_VCS
---

# Story 9.5: AchievementsScreen Redesign (Greeting, Section Order, Icons, Share)

**Status:** done

## Story

As a user, I want the achievements screen to feel personal and polished — greeting me by name, showing achievements first, and using proper icons.

## Acceptance Criteria

1. Personalized subtitle "Hey [name]! This is all your achievements" at the top
2. Section order reversed — achievements grid comes FIRST, streak rewards scroll moves BELOW
3. All emoji in achievement cards replaced with proper icon components (MaterialCommunityIcons or Ionicons)
4. Share button uses an icon instead of text label (e.g. `share-social-outline` Ionicons)
5. Name loaded from settings (same `name` field added in Story 9.4)
6. All changes preserve existing functionality, dark mode, animations, and share functionality

## Tasks / Subtasks

**Phase 1 — Add personalized greeting**

- [ ] Change header from plain "Achievements" to include "Hey [name]! This is all your achievements"
- [ ] Load name from settings

**Phase 2 — Reorder sections**

- [ ] Move achievements grid to render before streak rewards
- [ ] Move streak rewards horizontal scroll below achievements
- [ ] Ensure all existing data loads correctly in new order

**Phase 3 — Replace emoji with icons**

- [ ] Map each achievement's `item.emoji` to an appropriate icon component
- [ ] Use MaterialCommunityIcons or Ionicons depending on best match
- [ ] Keep icon sizing and color consistent with card design

**Phase 4 — Share button icon**

- [ ] Replace text share button with icon-only button (e.g. `share-outline` or `share-social-outline`)
- [ ] Preserve all share functionality (captureAndRef, ShareCardForwardRef)

**Phase 5 — Verify**

- [ ] `npm test` passes
- [ ] Achievements screen renders with greeting, proper ordering, icons
- [ ] Share button works with icon
- [ ] All existing functionality preserved
