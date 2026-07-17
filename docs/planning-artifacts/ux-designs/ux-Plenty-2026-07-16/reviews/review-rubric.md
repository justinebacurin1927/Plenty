# Plenty UX Spine Review — Rubric-Based Evaluation

**Review date:** 2026-07-16
**Reviewed files:**
- `DESIGN.md` (draft, updated 2026-07-16)
- `EXPERIENCE.md` (draft, updated 2026-07-16)
- `ARCHITECTURE-SPINE.md` (final, updated 2026-07-16)
- `.memlog.md` (updated 2026-07-16)

---

## DESIGN.md

### 1. Frontmatter tokens present and well-defined

**PASS.** All five token groups are present:

- `colors` — 30 tokens covering light and dark palettes (surface, ink, brand, semantic, tab)
- `typography` — 4 roles (body, label, caption, display-mascot), each stating platform-native conventions
- `rounded` — sm (6px), md (12px), lg (20px), full (9999px)
- `spacing` — 6 steps (4/8/12/16/24/32/48px)
- `components` — 7 component tokens (mascot-container, speech-bubble, progress-bar-track, progress-bar-fill, quick-log-button, glass-outline, water-fill) with color/radius/height references using `{token}` syntax and inline dark-mode variants

### 2. Brand & Style section captures the design philosophy

**PASS.** "Balanced Charm" is clearly stated and operationalized: "clean and restrained so the mascot's personality and the celebration moments hit harder." The rationale ties visual restraint to emotional impact — delight is concentrated, not diffused.

### 3. Colors described with intent, not just hex values

**PASS.** Each named color carries intent and usage context:

- Sky Canvas: "Light mode feels airy and open; dark mode is deep navy — restful for late-night use."
- Droplet Blue: "primary buttons, progress fill, active tabs, links, and the WaterFill animation"
- Warm Amber: "warnings, heat advisories, and 'approaching goal' moments"
- Green: "success — goal reached, streak active, everything-is-fine green"
- Red: "error and extreme weather. Used sparingly — the app is optimistic by default."

### 4. Typography has rationale for choices and platform conventions

**PASS.** Platform-native fonts (SF Pro / Roboto) declared as the UI default. Dynamic type honored. The rounded display font is positioned as "a punctuation mark, not a default voice" with explicit boundaries for its use (speech bubbles, achievement titles, logo). Accessibility constraint stated: "all UI must remain legible at the largest accessibility setting without truncation."

### 5. Layout & Spacing has concrete values and a clear system

**PASS.** Scale (4/8/12/16/24/32/48px), single-column constraint, explicit Home screen stack order (6 layers), margin values (16px), and internal spacing (12px). The speech bubble is the one element allowed to break the grid — noted as intentional.

### 6. Elevation & Depth addressed (or explicitly absent)

**PASS.** Explicit choice: "tonal separation rather than shadows." Raised surfaces distinguished by `surface-raised` vs `surface-base`. Shadows reserved for three specific contexts (modals, toasts, trophy shelf). Tab bar gets a 1px `borderLight` top border instead of shadow. This is a clear, bounded system.

### 7. Shapes defined with a clear system

**PASS.** Four-step token scale (sm 6px / md 12px / lg 20px / full 9999px) with concrete component mappings. Mascot uses organic curves as an intentional exception. Glass fill outline matches `md` corners "so it reads as a drinking vessel, not a beaker."

### 8. Components described with behavioral notes where needed

**PASS.** All component tokens include behavioral details:

- Mascot container: "Transitions between states via Reanimated crossfade or bounce (300ms default)"
- Quick-log button: long-press behavior, haptic rules, default amount
- Progress bar: "Animated via Reanimated width transition (600ms ease-out)"
- Glass fill: "3000ms full cycle... drains over 2s after the celebration ends"
- PressableScale: scale factor (0.96), haptic rules (medium on primary, none on repeated)

### 9. Do's and Don'ts specific and actionable

**PASS.** Eight pairs in table format. Each pair targets a specific, enforceable behavior:

| Do | Don't |
|---|---|
| One playful moment at a time | Stack chrome and animation competing for attention |
| System fonts for all functional text | Use the rounded display font for body copy |
| Clean surfaces, tonal separation over shadows | Gradient backgrounds, heavy drop shadows, glassmorphism |
| Quick-log as the primary action, always one tap away | Hide the action behind menus or secondary screens |

No vague items. Every pair translates directly to a code-review catch.

### 10. Dark mode handled explicitly

**PASS.** Dark-mode palette values in frontmatter (14 `*-dark` tokens). Dedicated "Dark Mode Visuals" section covering mascot outfit swaps (sunglasses for daytime, starry nightcap for nighttime) as sprite-layer swaps. WaterFill uses `brand-dark`. Palette discipline statement: "Every color token has both a light and dark value."

---

**DESIGN.md verdict: PASS** (10/10)

---

## EXPERIENCE.md

### 1. Foundation names the form-factor and UI system

**PASS.** "Single-surface mobile, iOS + Android with behavioral parity," "Phone portrait primary," "Screen-based React Native with utility modules per the architecture spine (AD-1 through AD-13)." No ambiguity about what is being built and on what stack.

### 2. Information Architecture complete — every stated need has a surface

**PASS.** Eight surfaces defined in the IA table. Surface-pairing maps to every stated product need: onboarding (first-run tour), home (daily tracking), log (history/charts), achievements (trophy shelf), settings (app config), plus three overlays (amount picker, achievement popup, toast). Bottom-tab constraint of exactly 4 entries is stated.

### 3. Voice and Tone specific and actionable (do/don't pairs)

**PASS.** Two tones defined (Default: "Buddy," Celebration: "Buddy-with-a-dash-of-Silly"). Six do/don't pairs with concrete dialog examples. Additional rules: "one line of text at a time," "multi-line messages scroll or split across two cycles." Never nagging, never clinical — actionable guidelines.

### 4. Component Patterns cover behavioral rules, not visual specs

**PASS.** All 10 components have dedicated rows with surface mapping and behavioral rules. Examples of behavioral (not visual) content:

- Speech bubble: "Never shows the same message twice in a row."
- Quick-log: "Disabled state: none (always loggable)."
- Glass fill: "Triggered once per goal hit — not replayed."
- Toast: "Single toast at a time — new one replaces pending."

The header directly defers visual specs to `DESIGN.md.Components`.

### 5. State Patterns cover all surfaces and edge cases

**PASS.** Mascot State Machine covers three axes (Weather, Time of day, User state) with priority resolution (User state > Weather > Time of day). Propagation rules for compositing are specified (e.g., "hot + night = sweat drops + pajamas"). Idle behaviors (blink interval, bounce animation, speech bubble rotation) are quantified. The surface-level state table covers 15+ combinations including failure paths (notification denied, location denied, limited connectivity, data reset).

### 6. Interaction Primitives concrete

**PASS.** Six defined primitives (tap, long-press, swipe-to-delete, pull-to-refresh, PressableScale wrapper, haptics) with specific behaviors (scale factor, haptic intensity, platform patterns). Six banned interactions listed with rationale (carousels, hero animations on cold open, badge counts, push re-engagement, infinite scroll, hover affordances).

### 7. Accessibility Floor covers behavioral requirements

**PASS.** Six areas addressed: VoiceOver/TalkBack labeling + live region for speech bubble, dynamic type legibility at max setting, reduce motion suppression per `utils/motion.js` (AD-11), tap targets >= 44pt/48dp, focus traversal ordering, notification-permission-denied graceful handling. Contrast is correctly deferred to DESIGN.md. Dark mode identified as contrast-friendly by default.

### 8. Key Flows are named-protagonist journeys with a climax beat

**PASS.** Five flows each with "Jamie" as protagonist. Each has a clear climax:

- Flow 1: First tap — first win in under 90 seconds
- Flow 2: Halfway milestone — a buddy acknowledging progress, not fanfare
- Flow 3: Goal hit + confetti + streak achievement — full emotional payoff
- Flow 4: Seamless dark-mode transition — thematic continuity
- Flow 5: Escalation resolves with a single tap — concerned, not punitive

Each flow also describes a graceful failure mode.

### 9. Inspiration & Anti-patterns section present and earned

**PASS.** Three influences explicitly cited with reasoning (Tamagotchi's reactivity inverted, Duolingo's celebration without punishment, WaterMinder's quick-log speed). Four explicit rejections with rationale: no streak decay, no IAP/premium gating (citing AD-1, AD-2), no social/leaderboards (citing AD-1), no AI-suggested schedules (citing privacy and predictability).

### 10. Every surface in IA is covered by at least one flow

**FAIL.** The IA defines 8 surfaces. Coverage:

| Surface | Covered by flow? |
|---|---|
| Onboarding | Flow 1 (First Run) |
| Home (tab 1) | Flows 1, 2, 3, 4, 5 |
| Log (tab 2) | **Not covered** |
| Achievements (tab 3) | Flow 3 (Goal Hit + Achievement) |
| Settings (tab 4) | **Not covered** — only mentioned in Flow 4 failure mode |
| Amount picker (modal) | **Not covered** — only mentioned in component pattern (long-press behavior) |
| Achievement popup (modal) | Flow 3 |
| Toast (overlay) | Flow 1 (epilogue), Flow 2 |

**Gap:** The Log screen (history, weekly/monthly charts, reports, pattern analysis) has no key flow demonstrating its purpose, interaction, or emotional beat. The Settings screen has no flow at all — the theme toggle in Flow 4 is a passive OS-level event, not the user visiting Settings. The Amount picker is described in component patterns but never appears in a narrative flow.

---

**EXPERIENCE.md verdict: CONDITIONAL PASS** (9/10 — item 10 fails)

---

## Overall Cross-Spine Rubric

### 11. No orphan references — every surface, component, and pattern referenced in one spine exists in the other

**CONDITIONAL PASS.** Most cross-references are sound:

- Weather banner and Reminder controls exist as layout items in DESIGN.md (lines 133-134) even though they lack dedicated frontmatter component tokens. Sufficient for cross-reference purposes.
- All component patterns in EXPERIENCE.md have corresponding visual descriptions somewhere in DESIGN.md.

**One confirmed orphan:**
- `glass-outline` is a frontmatter component token in DESIGN.md (line 75) but is never referenced or described in EXPERIENCE.md. It is implicitly part of the "Glass fill" / WaterFill component in EXPERIENCE.md but has no dedicated row or pattern entry. This is a minor orphan — either add an EXPERIENCE.md pattern entry for the glass outline container or remove the token from DESIGN.md if it is purely internal to the WaterFill SVG.

### 12. No contradictions between DESIGN.md and EXPERIENCE.md

**PASS.** Spot-check of every shared detail:

| Detail | DESIGN.md | EXPERIENCE.md | Match? |
|---|---|---|---|
| Quick-log default amount | "+250ml by default" | "Tap -> log 250ml" | Match |
| Progress bar timing | "600ms ease-out" | "600ms ease-out" | Match |
| WaterFill timing | "3000ms full cycle... drains over 2s" | "3000ms full cycle... drains over 2s" | Match |
| PressableScale factor | "0.96 on press-in" | "Scale 0.96 on press-in" | Match |
| Haptic on primary actions | "Medium haptic on press for primary actions" | "Medium haptic on primary actions" | Match |
| No haptic on repeated taps | "No haptic for repeated taps" | "No haptic on navigation taps or repeated toggles" | Match (compatible) |
| Toast color | "success text color, no icon" | "success color" | Match |
| Mascot hero height | "~120px tall" | (not specified) | Compatible — no contradiction |
| Speech bubble style | "surface-raised with no outline" | "Clean white card (surface-raised)" | Match (no outline implied) |
| Bottom tab constraint | (not explicitly stated) | "Bottom tab bar with exactly 4 entries" | Compatible — AD-10 |

No contradictions found.

### 13. Architecture spine ADs respected

**PASS.** All four cross-cutting ADs confirmed:

- **AD-3 (Theme via Context):** DESIGN.md states "All visual data colors... must be defined as theme tokens with light and dark variants. No standalone color constants outside the theme — AD-3." Confetti is noted as the sole exception.
- **AD-6 (AsyncStorage):** EXPERIENCE.md Foundation: "AsyncStorage is the single persistence layer."
- **AD-10 (4-tab navigation):** EXPERIENCE.md IA: "Bottom tab bar with exactly 4 entries. Modals are RN `<Modal>` overlays (not navigation destinations)."
- **AD-11 (Reanimated):** DESIGN.md references Reanimated for mascot transitions and progress bar. EXPERIENCE.md references Reanimated for PressableScale and SVG wave.

### 14. Memlog decisions reflected in at least one spine

**PASS.** All 13 memlog decisions tracked:

| Memlog decision | Spine location |
|---|---|
| Droplet with stubby limbs | DESIGN.md Brand & Style |
| Sprite-based + Reanimated | DESIGN.md Components (mascot container) |
| Balanced Charm | DESIGN.md Brand & Style |
| WaterFill SVG wave | DESIGN.md Components (glass fill, water-fill) |
| Home screen layout C | DESIGN.md Layout & Spacing |
| Mascot states (3 axes) | EXPERIENCE.md State Patterns |
| WaterFill as goal celebration | DESIGN.md Components (glass fill) |
| Trophy shelf achievements | DESIGN.md Components (achievement trophy) |
| System + custom display fonts | DESIGN.md Typography |
| 3-slide onboarding | EXPERIENCE.md IA |
| Dark mode outfit swaps | DESIGN.md Dark Mode Visuals |
| Medium haptics | EXPERIENCE.md Interaction Primitives |
| Buddy tone | EXPERIENCE.md Voice and Tone |

---

## Summary

| Category | Result |
|---|---|
| DESIGN.md (criteria 1-10) | **PASS** (10/10) |
| EXPERIENCE.md (criteria 1-10) | **CONDITIONAL PASS** (9/10 — Log and Settings surfaces missing from key flows) |
| Cross-spine (criteria 11-14) | **CONDITIONAL PASS** (minor orphan `glass-outline`; ADs and memlog fully respected) |

### Overall verdict: CONDITIONAL PASS

### Findings (ordered by severity)

1. **Log and Settings screens lack key flows (EXPERIENCE.md, criterion 10).** The IA declares 8 surfaces but only 4 appear in narrative key flows. The Log screen — which provides history, charts, reports, and pattern analysis — has zero flow coverage. Settings appears only as a passive failure-mode mention. The Amount picker modal is described in component patterns but never shown in a user journey. These surfaces need at least one dedicated flow each to demonstrate their purpose, interaction pattern, and emotional beat.

2. **EXPERIENCE.md uses backtick syntax for design token references (`brand-dark` at line 178, `surface-raised` at line 63, others) instead of `{path.to.token}` syntax (`{colors.brand-dark}`, `{colors.surface-raised}`).** Zero occurrences of `{path.to.token}` syntax were found in EXPERIENCE.md. Per criterion 11, all design decisions in EXPERIENCE.md that reference DESIGN.md tokens should use the documented path syntax to maintain a clean, resolvable link between the two spines.

3. **Orphan component token: `glass-outline` in DESIGN.md frontmatter (line 75) has no corresponding entry in EXPERIENCE.md.** It is implicitly part of the WaterFill/Glass fill component but lacks its own pattern entry or behavioral rules in EXPERIENCE.md Component Patterns. Either promote it to an EXPERIENCE.md component pattern entry or document that it is an internal detail of the WaterFill SVG (in which case the token belongs in WaterFill's own definition, not as a standalone component).

### File

`/home/jaycee/Projects/Plenty/docs/planning-artifacts/ux-designs/ux-Plenty-2026-07-16/reviews/review-rubric.md`
