---
baseline_commit: abc44380d6653413bf37546629a23a40c819a75a
---

# Story 8.1: Store Listing Assets

**Status:** done

## Story

As a potential user browsing the Play Store, I want to see attractive screenshots and a clear description so I download the app.

## Acceptance Criteria

1. Feature graphic (1024 × 500 px) designed — in `assets/store/feature-graphic.png`
2. 4–6 phone screenshots showing key screens:
   - Home screen with water animation + streak heatmap
   - Quick-log flow
   - Achievements with rewards ladder
   - Onboarding screen
   - Settings screen
3. Short description (~80 chars): "Plenty helps you build a daily hydration habit with streaks, rewards, and a beautiful water animation."
4. Full description (~750 chars) covering: streak system, rewards ladder, water animation, goal calculator, weather-aware reminders, achievements, privacy (all local)

## Tasks / Subtasks

**Phase 1 — Create asset directory**

- [x] Create directory `assets/store/`

**Phase 2 — Feature Graphic**

- [x] Design feature graphic (1024 × 500 px) with:
  - Plenty branding (water drops, blue theme)
  - Tagline: "Build your hydration habit"
  - Clean, minimalist style matching app's design language
  - Save as `assets/store/feature-graphic.png`

**Phase 3 — Phone Screenshots**

- [x] Screenshot 1: Home screen with water animation, streak counter, streak flame
- [x] Screenshot 2: Quick-log flow (amount picker modal)
- [x] Screenshot 3: Achievements screen with rewards ladder
- [x] Screenshot 4: Onboarding screen
- [x] Screenshot 5: Settings screen (theme, notifications, data management)

**Phase 4 — Store Description**

- [x] Write short description (~80 chars)
- [x] Write full description (~750 chars) covering:
  - Streak system and heatmap
  - Rewards ladder with milestones
  - Water fill animation
  - Goal calculator (weight-based, activity boost)
  - Weather-aware reminders (Open-Meteo integration)
  - Achievement system
  - Privacy: all data stays on device, no accounts needed

**Phase 5 — Testing**

- [x] No code tests needed — verify assets exist at correct paths
- [x] Confirm feature graphic is 1024 × 500 px
- [x] Confirm descriptions meet character limits

## Dev Notes

### Asset Requirements

- **Feature graphic:** 1024 × 500 px, PNG format, no text cutoff at edges (Play Store crops 40px from sides)
- **Screenshots:** 1080 × 1920 px (portrait), PNG or JPEG, up to 8 per listing
- **Colors:** Use `#4A90D9` (primary blue) as brand accent, keep consistent with app's light theme palette
- **Typography:** Use system fonts (San Francisco for iOS equivalent, Roboto for Android equivalent in mockups)

### What NOT to do

- Don't include app screenshots that don't exist yet (no mockups of unbuilt features)
- Don't use screenshots from other apps — all visuals must be of Plenty
- Don't over-exaggerate features — descriptions must match reality

## Files to Create/Change

| File | Action | Purpose |
|------|--------|---------|
| `assets/store/` | **New directory** | Store listing assets |
| `assets/store/feature-graphic.png` | **New** | Play Store feature graphic |
| `assets/store/screenshot-1-home.png` | **New** | Home screen screenshot |
| `assets/store/screenshot-2-quick-log.png` | **New** | Quick-log flow screenshot |
| `assets/store/screenshot-3-achievements.png` | **New** | Achievements screenshot |
| `assets/store/screenshot-4-onboarding.png` | **New** | Onboarding screenshot |
| `assets/store/screenshot-5-settings.png` | **New** | Settings screenshot |
| `assets/store/play-store-listing.txt` | **New** | Store descriptions (short + full) |
| `scripts/generate_store_assets.py` | **New** | Asset generation script |

## Dependencies

- The app must be fully built to take real screenshots from a running instance
- Alternatively, use UI mockup tools (Figma, Canva) to compose screenshots from actual app renders

## Dev Agent Record

### Implementation Plan

1. Create `assets/store/` directory
2. Create feature graphic
3. Create phone screenshots (4–6)
4. Write short + full description

### Notes

This story is primarily a design/copywriting task — no code changes needed. Screenshots should be captured from a running app instance or composed from actual UI elements.

### Completion Notes

**2026-07-19** — All store listing assets created:

- **Phase 1** — Created `assets/store/` directory
- **Phase 2** — Designed feature graphic (1024×500 px) with Plenty branding, water drops on blue theme gradient, and "Build your hydration habit" tagline. Feature bullet highlights included.
- **Phase 3** — Created 5 phone screenshots (1080×1920 px) showing:
  - Home screen: water fill animation, streak flame (7 days), mascot bubble, glasses count, quick-log button, interval chips, heatmap grid
  - Quick-log flow: bottom sheet modal with amount options (100/200/250/500ml) and custom input
  - Achievements: mascot header, rewards ladder (Bronze/Silver/Gold/Diamond), achievement grid with unlocked/locked states
  - Onboarding: welcome page with water icon, feature cards, pagination dots
  - Settings: theme toggles (Light/Dark/Auto), notification message categories, data management section
- **Phase 4** — Wrote short description (80 chars) and full description (784 chars) covering streak system, rewards ladder, water animation, goal calculator, weather-aware reminders, achievements, and privacy
- **All assets verified at correct dimensions and paths**

## Change Log

| Date | Change |
|------|--------|
| 2026-07-19 | Created from Epic 8.1 definition — store listing assets |
| 2026-07-19 | Implemented: feature graphic (1024×500), 5 phone screenshots (1080×1920), short + full descriptions, all assets verified |
