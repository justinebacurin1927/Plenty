---
status: final
created: 2026-07-16
updated: 2026-07-16
colors:
  surface-base: '#E8F4FD'
  surface-raised: '#FFFFFF'
  surface-secondary: '#F5F9FF'
  ink-primary: '#1A3A5C'
  ink-secondary: '#6B8CAB'
  ink-muted: '#A0B8D0'
  brand: '#4A90D9'
  brand-light: '#A0C4E8'
  success: '#27AE60'
  warning: '#E67E22'
  error: '#E8596E'
  surface-base-dark: '#0D1B2A'
  surface-raised-dark: '#1B2838'
  surface-secondary-dark: '#23304A'
  ink-primary-dark: '#E0EAFF'
  ink-secondary-dark: '#8A9BB5'
  ink-muted-dark: '#5A6F8A'
  brand-dark: '#6BB5FF'
  brand-light-dark: '#4A7FA8'
  success-dark: '#4ADE80'
  warning-dark: '#F0A050'
  error-dark: '#FF6B6B'
  tab-active: '#4A90D9'
  tab-inactive: '#B8D0E8'
  tab-active-dark: '#6BB5FF'
  tab-inactive-dark: '#4A5F7A'
typography:
  body:
    note: 'Platform native — iOS Body · Android Body Large (SF Pro / Roboto)'
  label:
    note: 'Platform native — iOS Callout · Android Body Medium'
  caption:
    note: 'Platform native — iOS Footnote · Android Body Small'
  display-mascot:
    note: 'Custom rounded display font (e.g. Fredoka, Nunito, or similar) — used for speech bubbles, achievement titles, and the Plenty logo only'
rounded:
  sm: 6px
  md: 12px
  lg: 20px
  full: 9999px
spacing:
  '1': 4px
  '2': 8px
  '3': 12px
  '4': 16px
  '5': 24px
  '6': 32px
  '8': 48px
components:
  mascot-container:
    background: transparent
    height: 120px
  speech-bubble:
    background: '{colors.surface-raised}'
    text: '{colors.ink-primary}'
    radius: '{rounded.md}'
  progress-bar-track:
    background: '{colors.brand-light}'  # light; dark: '{colors.brand-light-dark}'
    radius: '{rounded.full}'
    height: 12px
  progress-bar-fill:
    background: '{colors.brand}'  # light; dark: '{colors.brand-dark}'
    radius: '{rounded.full}'
  quick-log-button:
    background: '{colors.brand}'
    foreground: '#FFFFFF'
    radius: '{rounded.md}'
    height: 56px
  glass-outline:
    stroke: '{colors.ink-secondary}'
    fill: transparent
    strokeWidth: 2px
  water-fill:
    color: '{colors.brand}'
    wave-speed: 3000ms
sources:
  - docs/planning-artifacts/architecture/architecture-Plenty-2026-07-15/ARCHITECTURE-SPINE.md
  - docs/planning-artifacts/ux-designs/ux-Plenty-2026-07-16/.memlog.md
---

# Plenty — Design Spine

## Brand & Style

Plenty is a friendly water reminder app built on the philosophy of **Balanced Charm** — the UI is clean and restrained so the mascot's personality and the celebration moments hit harder. The app treats hydration as a *habit worth celebrating*, not a chore to track. The visual language follows: cool friendly blues on clean white surfaces (light) or deep navy (dark), with the mascot as the sole source of chromatic playfulness. Utility chrome is quiet. Delight is concentrated in the mascot, the animated glass fill, and achievement moments.

The mascot is a classic water droplet with stubby limbs — playful and charming without being cartoonish. It is the heart of the brand identity and the primary vehicle for personality expression.

## Colors

The palette is centered on a friendly blue that reads as clean, calm, and approachable. It is not clinical — the light blue background (`#E8F4FD`) softens the experience from the first launch.

- **Sky Canvas (`#E8F4FD` light / `#0D1B2A` dark)** is the primary background. Light mode feels airy and open; dark mode is deep navy — restful for late-night use.
- **Droplet Blue (`#4A90D9` light / `#6BB5FF` dark)** is the brand color. Used for primary buttons, progress fill, active tabs, links, and the WaterFill animation.
- **White / Navy (`#FFFFFF` / `#1B2838`)** is the raised surface for cards, sheets, and containers. Distinguishes content from background without shadow.
- **Warm Amber (`#E67E22` light / `#F0A050` dark)** is the status accent for warnings, heat advisories, and "approaching goal" moments.
- **Green (`#27AE60` light / `#4ADE80` dark)** is success — goal reached, streak active, everything-is-fine green.
- **Red (`#E8596E` light / `#FF6B6B` dark)** is error and extreme weather. Used sparingly — the app is optimistic by default.

All visual data colors (chart bars, trend indicators) must be defined as theme tokens with light and dark variants. No standalone color constants outside the theme — AD-3. The `confetti` array is the only exception, as its colors are platform-ambient.

**Dark mode variant discipline:** Every color token has both a light and dark value. The dark palette shifts from warm blue-toned surfaces to cool navy, maintaining readability by raising text contrast on darker backgrounds. Warning/error colors shift lighter to maintain visibility against dark backgrounds.

## Typography

System fonts are the UI default — SF Pro on iOS, Roboto on Android. Dynamic type is honored at every level; all UI must remain legible at the largest accessibility setting without truncation.

| Role | Font | Used for |
|---|---|---|
| `body` | System (SF Pro / Roboto) | All functional text — buttons, labels, menu items, settings, log entries, chart labels, report text |
| `display-mascot` | Custom rounded display font (e.g. Fredoka, Nunito, B612 Rounded, or similar) | Mascot speech bubbles, achievement titles, the Plenty logo / app name in branding moments |

The rounded display font is a *punctuation mark*, not a default voice. It appears only in:
- The mascot's speech bubbles (daily greeting, reminders, encouragement)
- Achievement unlock titles ("7-Day Streak!")
- The Plenty logo on the onboarding screen

Everything else uses system fonts. This keeps the UI clean and accessible while letting the mascot's voice feel distinct and playful.

## Layout & Spacing

Scale: 4 / 8 / 12 / 16 / 24 / 32 / 48 px. Single-column always on phone. Home screen uses a vertical stack:

1. **Mascot hero** (centered, ~120px tall with speech bubble above) — the mascot sits here, animates, and speaks
2. **Progress bar** (~12px tall, full-width) — shows daily goal progress
3. **Goal text** — "6/8 glasses" centered below the bar
4. **Quick-log button** — 56px tall, full-width primary action button
5. **Reminder controls** — compact row with interval display and start/stop toggle
6. **Weather banner** (conditionally shown) — appears above the mascot if active

Mobile margins: 16px from screen edges. The mascot hero has 12px of internal breathing room. The speech bubble extends from the mascot's top left, overlapping the margin slightly — the one element allowed to break the grid.

## Elevation & Depth

Plenty uses tonal separation rather than shadows. Raised surfaces (cards, modals) are distinguished by `surface-raised` vs `surface-base` — lighter in light mode, lighter in dark mode. Shadows are reserved for:

- **Modals** (achievement popup, amount picker) — subtle shadow on `overlay` backdrop
- **Toast notifications** — brief elevation to call attention
- **Achievement trophy shelf** — each trophy has a soft shadow simulating shelf lighting

Tab bar sits at the same elevation as the surface behind it — no shadow, only a 1px `borderLight` top border.

## Shapes

- **`sm` (6px)** — inputs, configuration rows, small containers
- **`md` (12px)** — cards, the quick-log button, modals, the glass fill container
- **`lg` (20px)** — achievement trophy cards, shelf background panel
- **`full` (pill)** — the progress bar, badge indicators, mascot's rounded extremities

The mascot itself uses organic curves, not strict corner radii. All other elements use the rounded token scale. The glass fill outline matches `md` corners — it should read as a drinking vessel, not a beaker.

## Components

- **Mascot container** — Fixed-height region on Home screen. Renders the active sprite layer composite (body + eyes + props + effects). Transitions between states via Reanimated crossfade or bounce (300ms default). Speech bubble rendered as a platform-native View with `rounded/md`, 12px padding, and the rounded display font.
- **Quick-log button** — Full-width, `brand` fill, white text. Reads "+250ml" by default. Tap logs water and triggers a mascot reaction (happy blink, brief celebration). Long-press opens the amount picker modal.
- **Progress bar** — Pill-shaped track (`brand-light` fill) with `brand` fill indicator. Animated via Reanimated width transition (600ms ease-out) on log. Current text reads "X/Y glasses" centered below.
- **Glass fill** — Shown as a goal celebration animation. An SVG bottle/glass outline with a Reanimated wave fill that rises from bottom to top (3000ms full cycle). Renders once on goal hit and empties over 2s after the celebration ends.
- **Speech bubble** — Clean white card ({colors.surface-raised}) with no outline. Points toward the mascot with a small triangular tail. Contains 1 line of {typography.display-mascot} text (truncated or cycled if longer). Updates on state change (log, weather, time, reminder).
- **Toast** — Small card appearing at the top of the screen. Confirms log actions ("250ml logged!") before fading. Uses `success` text color, no icon.
- **PressableScale** — Reanimated pressable wrapper. Scales to 0.96 on press-in, returns on release. Medium haptic on press for primary actions (log, achievement view, toggle). No haptic for repeated taps.
- **Achievement trophy** — Visual shelf display. Unlocked: full-color object illustration on a subtle shelf. Locked: grayed-out silhouette. Tap on unlocked shows a brief celebration replay.
- **Weather banner** — Conditional banner above the mascot hero. {colors.warning} fill (light) / {colors.warning-dark} fill (dark) with white text. {rounded.md} corners. 8px margin from screen edges. Contains weather icon + advisory text + dismiss button. Auto-dismisses after 8s on first display; collapsible by tap.
- **Reminder controls row** — Compact horizontal bar below quick-log. Interval value in {colors.ink-primary} weight 600, label in {colors.ink-secondary} weight 500. Toggle switch: track {rounded.full}, 48×28px, {colors.brand-light} when off / {colors.brand} when on (dark: {colors.brand-dark}). Thumb 24×24px white with 2px shadow, slides 20px on activate.
- **Amount picker modal** — Bottom sheet or centered modal. Overlay backdrop at {colors.overlay}. Picker surface at {colors.surface-raised}. Preset chips at {rounded.md} with {colors.brand} border when selected. Custom input field below presets.
- **Onboarding slide** — Full-screen panels. {colors.surface-base} background. Mascot centered in upper two-thirds. Title in {typography.display-mascot} (24px), body in system body. Pagination dots in {colors.ink-muted} with active dot in {colors.brand}. Skip link in {colors.ink-secondary}.
- **Log screen chart** — Weekly bar chart. Bars in {colors.brand-light} (light) / {colors.brand-light-dark} (dark) with today's bar in {colors.brand} (light) / {colors.brand-dark} (dark). Axis labels in {colors.ink-muted}. Bar height proportional to daily total / daily goal ratio. {rounded.sm} corner radius on bar tops.

## Mascot Expressions

The mascot composits from sprite layers (body + eyes + props + effects) per the modular approach. Below is the visual spec for every expression across the state machine's three axes.

### Weather expressions

| Expression | Body | Eyes | Props | Effects |
|---|---|---|---|---|
| `normal` | Droplet in {colors.brand}, highlight at 10% opacity | Open, {colors.ink-primary} fill, 3px radius | None | None |
| `hot` | Same, optional pink blush ({colors.error} at 12% opacity) | Squinting (half-height ellipses) | None | 2-3 sweat drops in {colors.brand-dark} (light mode) animating downward; wavy heat lines in {colors.warning} above head |
| `rainy` | Same | Open | Umbrella held in one arm (overlay sprite, {colors.brand-light} canopy, {colors.ink-primary} handle) | Subtle droplet collision effect on umbrella edge |
| `snowy` | Slightly compressed vertically | Closed / shivering line (horizontal dash) | Scarf (small overlay, {colors.success}) | Shiver lines (vertical zigzag, {colors.brand-light}, 1px stroke) |

### Time-of-day expressions

| Expression | Body | Eyes | Props | Effects |
|---|---|---|---|---|
| `morning` | Same | Half-open (sleepy), slightly lower y-position | None per se — small yawn mouth arc | Faint stretch lines (upward arcs above the drop, {colors.ink-muted}) |
| `day` | Same | Open, occasional blink cycle (4-6s interval) | None | Subtle float animation (6px vertical, 2s cycle) |
| `night` | Same | Sleepy (half-height ellipses) | Pajama overlay (light blue one-piece with small star pattern) | Zzz effect (3 floating bubbles in {colors.ink-muted}, drift upward and fade) |

### User-state expressions

| Expression | Priority | Body | Eyes | Props | Effects |
|---|---|---|---|---|---|
| `idle` | Base | Normal | Open, blinks every 4-6s | None | Float animation |
| `just-logged` | Override (2s decay) | Slight bounce (scale 1.05 y, 300ms) | Happy squint (closed arc ^_^) | None | Brief scale pulse |
| `goal-hit` | Override (3s decay) | Jump upward (40px y, 500ms spring) + idle dance (gentle side-to-side sway) | Wide open, sparkle overlay | None | Confetti particles (per {colors.confetti}); glass fill animation triggers |
| `streak` | Override (1.5s decay) | Normal idle | Fire eyes — orange/red flame overlay sprite over eye area | None | Subtle flame flicker animation |
| `missed` | Override (3s decay) | Slight droop (tilt 3°, 500ms ease) | Soft downward gaze (pupil shifts down 2px) | None | None — gentle, not punishing |
| `escalation` | Override (5s decay or cleared by log) | Rapid small bounce (3px, 300ms cycle) | Wide open, eyebrows angled inward (concern) | One arm making a small wave | Pulsing outline (1px {colors.warning} stroke, 1s pulse) |

### Dark mode expressions

| Condition | Outfit |
|---|---|
| Dark mode + daytime | Sunglasses overlay (black, small aviator shape) over eyes |
| Dark mode + nighttime | Nightcap overlay (navy with white star dots, small pom-pom) replaces pajama cap |

Each expression decays to the weather + time composite after its override duration. The default idle state for any (weather × time) combination is: weather expression as primary base, time-of-day modifiers layered on top, with the idle float animation running continuously unless overridden.

## Dark Mode Visuals

In dark mode, the palette shifts to cool navy foundations. The mascot wears a context-appropriate outfit:

- **Dark mode + daytime:** The mascot wears tiny dark sunglasses. Casual "cool mode" look.
- **Dark mode + nighttime:** The mascot wears a starry nightcap with sleepy eyes. Cozy bedtime look.

These are implemented as sprite layer swaps — no additional rendering complexity beyond the modular sprite system.

The WaterFill animation uses `brand-dark` (`#6BB5FF`) instead of `brand` to maintain visual brightness against the dark surface.

## Do's and Don'ts

| Do | Don't |
|---|---|
| One playful moment at a time during routine use — mascot animated OR WaterFill OR achievement, not all three | Stack chrome and animation competing for attention |
| **Exception:** goal-hit celebration stacks mascot + WaterFill + confetti as a deliberate crescendo (once per goal hit, not replayed) | Use the stacking exception for routine log actions |
| System fonts for all functional text | Use the rounded display font for body copy, labels, or data |
| Clean surfaces, tonal separation over shadows | Gradient backgrounds, heavy drop shadows, glassmorphism |
| Let the mascot carry the personality | Add personality to buttons, charts, or utility chrome |
| Dark mode outfit swaps on the mascot (sunglasses / nightcap) | Different color palette per theme variant beyond the defined tokens |
| Quick-log as the primary action, always one tap away | Hide the action behind menus or secondary screens |
| Medium haptics on goal hit and achievements only | Haptics on every tap, scroll, or toggle |
