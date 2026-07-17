---
type: cross-reference-audit
reviewed: 2026-07-16
reviewer: Claude (automated)
documents:
  - DESIGN.md (visual spine)
  - EXPERIENCE.md (behavioral spine)
  - .memlog.md (decision log)
  - ARCHITECTURE-SPINE.md (architecture spine)
---

# Pair Review: DESIGN.md x EXPERIENCE.md

## Verdict: CONDITIONAL

6 of 10 checks pass. The core architectural and behavioral alignment is solid (memlog decisions all accounted for, architecture ADs respected, dark mode consistent, component mapping intact). However, there are significant gaps in visual coverage and cross-document referencing discipline. Both spines need follow-up work before handoff to implementation.

---

## Check Results

### 1. Every component named in DESIGN.md.Components has a corresponding behavioral entry in EXPERIENCE.md.Component Patterns — PASS

All 7 formally defined YAML components (mascot-container, speech-bubble, progress-bar-track, progress-bar-fill, quick-log-button, glass-outline, water-fill) map to behavioral entries in EXPERIENCE.md's Component Patterns. Additionally, the 3 prose-only components (Toast, PressableScale, Achievement trophy) also have corresponding behavioral entries. No orphans.

### 2. Every surface in EXPERIENCE.md.IA is visually spec'd in DESIGN.md — FAIL

EXPERIENCE.md defines 8 surfaces. DESIGN.md provides full visual specs for only 3 of them:

| Surface | DESIGN.md coverage | Status |
|---|---|---|
| Home (tab 1) | Layout stack, mascot, progress, quick-log, speech bubble, weather banner (layout mention), reminder controls (layout mention) | COVERED |
| Achievements (tab 3) | Trophy component spec | PARTIAL — no screen-level layout |
| Toast | Prose description | PARTIAL — no YAML token entry |
| **Onboarding** | Only "Plenty logo on the onboarding screen" mentioned | **MISSING** |
| **Log (tab 2)** | No visual treatment described | **MISSING** |
| **Settings (tab 4)** | No visual treatment described | **MISSING** |
| **Amount picker** | No visual treatment described | **MISSING** |
| **Achievement popup** | Only mentioned in elevation context | **MISSING** |

Design guidance: Each missing surface needs a visual spec — at minimum a layout description and token usage. The Log screen needs chart/data-visualization tokens. The Amount picker needs modal shape, input style, and preset chip tokens. Settings needs row/control component tokens.

### 3. EXPERIENCE.md references DESIGN.md tokens using {path.to.token} syntax where visual properties are needed — FAIL

EXPERIENCE.md never uses the `{path.to.token}` syntax established in DESIGN.md's YAML frontmatter. Where visual properties are mentioned in EXPERIENCE.md, they use plain language:
- Line 177: `` `brand-dark` (`#6BB5FF`) `` instead of `{colors.brand-dark}`
- Line 66: "Reanimated SVG wave. 3000ms full cycle" — hardcoded value, no token reference for `wave-speed`
- Line 69: "full-color sprite. Locked: desaturated silhouette" — no token reference

While EXPERIENCE.md is intentionally the behavioral spine (and its header states "Visual specs live there"), this breaks formal traceability. When a developer reads "the bar fill uses brand-dark" in EXPERIENCE.md, they can't navigate to DESIGN.md's token definition through a structured reference. The `{path.to.token}` convention was designed for exactly this.

**Recommendation:** Add token references in EXPERIENCE.md state pattern descriptions and component behavioral rules where visual outcomes are described. E.g., "Progress bar fill uses `{colors.brand}`" instead of loose color names.

### 4. The DESIGN.md tokens are used consistently in component specs — PASS

Every token reference in DESIGN.md's YAML frontmatter component definitions is valid:
- `{colors.surface-raised}`, `{colors.ink-primary}`, `{colors.brand-light}`, `{colors.brand}`, `{colors.ink-secondary}` — all reference existing color keys
- `{rounded.md}`, `{rounded.full}` — both reference existing rounded keys
- Dark mode annotations are present as comments (`# light; dark: '{colors.brand-dark}'`)

One minor inconsistency: the prose Components section (lines 159-167) describes visual properties using plain language ("brand fill", "rounded/md") rather than the YAML `{}` convention. This is acceptable for prose exposition but means the formal token references exist in two inconsistent formats within the same file.

### 5. Every memlog decision is reflected in at least one spine — PASS

All 13 memlog decisions are accounted for:

| Memlog decision | Reflected in |
|---|---|
| Mascot style: classic droplet with stubby limbs | DESIGN.md lines 92-93 |
| Mascot rendering: sprite-based + Reanimated | DESIGN.md line 159, EXPERIENCE.md line 62 |
| Visual language: 'Balanced Charm' | DESIGN.md line 90 |
| WaterFill: animated SVG wave | DESIGN.md lines 78-80, EXPERIENCE.md line 66 |
| Home layout C: mascot-led stack | DESIGN.md lines 128-135, EXPERIENCE.md IA |
| Mascot states: weather/time/user/escalation/idle | EXPERIENCE.md lines 79-91 (detailed state machine) |
| WaterFill as goal celebration | EXPERIENCE.md line 66 |
| Achievements: trophy shelf | DESIGN.md line 166-167, EXPERIENCE.md line 69 |
| Typography: system + rounded display | DESIGN.md lines 110-123 |
| Onboarding: 3-slide feature tour | EXPERIENCE.md lines 142-148 (Flow 1) |
| Dark mode outfits: sunglasses/nightcap | DESIGN.md lines 171-175, EXPERIENCE.md line 111 |
| Haptics: medium intensity | EXPERIENCE.md lines 122-123 |
| Mascot voice: Buddy tone | EXPERIENCE.md lines 41-53 |

### 6. Architecture spine ADs respected and not contradicted — PASS

| AD | Relevant UX content | Status |
|---|---|---|
| AD-3 (Theme via Context) | DESIGN.md line 105 explicitly cites AD-3. All tokens have dark variants. | OK |
| AD-4 (Home owns notification state) | EXPERIENCE.md IA places reminder controls on Home. No other surface schedules reminders. | OK |
| AD-6 (AsyncStorage) | EXPERIENCE.md line 22: "AsyncStorage is the single persistence layer" | OK |
| AD-10 (4-tab navigation, Modal overlays) | EXPERIENCE.md line 36-37: "exactly 4 entries", "Modals are RN `<Modal>` overlays" | OK |
| AD-11 (Reanimated) | EXPERIENCE.md references Reanimated in 5 component patterns. DESIGN.md line 159 references it. | OK |

No contradictions found.

### 7. The mascot state machine in EXPERIENCE.md has a visual counterpart in DESIGN.md — FAIL

EXPERIENCE.md defines a 3-axis state machine with distinct visual expressions per state (lines 79-91):

| Axis | State | Visual expression | DESIGN.md visual spec |
|---|---|---|---|
| Weather | hot | sweat drops, tongue out | **Missing** |
| Weather | rainy | umbrella prop | **Missing** |
| Weather | snowy | shiver | **Missing** |
| Time | morning | yawn, stretch | **Missing** |
| Time | night | sleepy, pajamas | Partial (nightcap in dark mode, no pajamas overlay) |
| User | idle | blinking, bounce | DESIGN.md prose line 159 mentions transitions |
| User | just-logged | happy blink, thumbs up | **Missing** |
| User | goal-hit | celebration dance | **Missing** |
| User | streak | fire eyes | **Missing** |
| User | escalation | urgent wave | **Missing** |
| User | missed | slight encouragement | **Missing** |
| Dark mode + day | — | sunglasses | DESIGN.md lines 171-172 |
| Dark mode + night | — | starry nightcap, sleepy eyes | DESIGN.md lines 173-174 |

Only 2 of 13 expressions have explicit visual specs in DESIGN.md (sunglasses, nightcap). The compositing architecture is described (sprite layers, Reanimated transitions) but the specific visual output for each state is not. A developer implementing the mascot from DESIGN.md alone would not know what "sweat drops + tongue out" looks like visually.

**Recommendation:** Add a state → visual lookup table to DESIGN.md, mapping each EXPERIENCE.md state to its sprite layer composition rules.

### 8. No visual token in DESIGN.md goes unused by EXPERIENCE.md — PASS (with note)

All DESIGN.md tokens could be referenced by EXPERIENCE.md if it adopted the `{path.to.token}` convention (see check 3). The token set is complete enough to support EXPERIENCE.md's behavioral patterns. However, within DESIGN.md's own component specs, several defined tokens are unreferenced:

- `colors.surface-secondary` / `surface-secondary-dark` — not used in any component or prose spec
- `colors.ink-muted` / `ink-muted-dark` — not used
- `colors.tab-active` / `tab-inactive` / dark variants — not used
- `colors.success-dark` — not used
- `rounded.sm` (6px) — described in prose but not used in YAML
- `rounded.lg` (20px) — same
- `spacing.*` — all 6 values defined, none referenced in any component spec
- `quick-log-button.foreground` — defined as `#FFFFFF` (a raw hex) rather than as a token reference

These are minor — tokens are often defined for developer use even when not explicitly referenced in formal specs — but the `spacing.*` tokens' total absence from component references is notable.

### 9. No behavioral pattern in EXPERIENCE.md has no visual counterpart in DESIGN.md — FAIL

Two components in EXPERIENCE.md's Component Patterns lack visual specs in DESIGN.md:

| Component | EXPERIENCE.md behavior | DESIGN.md visual coverage |
|---|---|---|
| **Weather banner** | Lines 69: conditionally rendered, shows temperature + advisory, auto-hides after 8s, collapsible | Layout mention only (line 135: "appears above the mascot if active") — no tokens, no shape, no spacing |
| **Reminder controls** | Lines 70-71: compact row, interval display, start/stop toggle, interval picker chips | Layout mention only (line 133: "compact row with interval display and start/stop toggle") — no tokens, no chip shape, no toggle style |

Additionally, state-specific visual expressions (see check 7) are behavioral patterns in EXPERIENCE.md that lack DESIGN.md visual specs.

### 10. Dark mode handling is consistent between both spines — PASS

Both documents agree on all dark-mode details:
- **Palette:** Navy-based dark theme (surface-base-dark `#0D1B2A`) — DESIGN.md frontmatter, EXPERIENCE.md Flow 4
- **Mascot daytime:** Sunglasses — DESIGN.md lines 171-172, EXPERIENCE.md line 111
- **Mascot nighttime:** Nightcap + sleepy eyes — DESIGN.md lines 173-174 (starry nightcap), EXPERIENCE.md line 176
- **Progress fill:** Uses brand-dark (`#6BB5FF`) — DESIGN.md line 177 comment, EXPERIENCE.md line 177
- **Re-theme behavior:** Immediate, no flash — DESIGN.md (implied by theme context architecture), EXPERIENCE.md line 111, Flow 4
- **WaterFill:** Uses brand-dark — DESIGN.md line 67 comment
- **Accessibility:** Dark mode as contrast-friendly default — EXPERIENCE.md line 136, DESIGN.md line 108

Minor naming variance: DESIGN.md says "mascot wears tiny dark sunglasses" and "starry nightcap"; EXPERIENCE.md says "sunglasses" and "nightcap". Consistent enough for handoff.

---

## Summary of Findings

### Finding 1 (High severity) — Visual coverage gap for 5 of 8 surfaces
Onboarding, Log, Settings, Amount picker, and Achievement popup are defined as navigation surfaces in EXPERIENCE.md's IA but have zero visual specification in DESIGN.md. The Log screen is particularly critical — it needs chart/data-visualization color tokens and chart container specs. Without these, implementation has no visual target.

### Finding 2 (High severity) — Mascot state machine visually underspecified
EXPERIENCE.md defines 13 distinct visual expressions across 3 axes. Only 2 (sunglasses, nightcap) have explicit visual specs in DESIGN.md. The remaining 11 (sweat drops, tongue out, umbrella, shiver, yawn/stretch, pajamas, happy blink, celebration dance, fire eyes, urgent wave, encouragement) have no DESIGN.md counterpart. A sprite-layer composition table mapping each state to its asset requirements is needed.

### Finding 3 (Medium severity) — No cross-document token reference syntax
EXPERIENCE.md uses plain-language color names and hex values rather than the `{path.to.token}` syntax established in DESIGN.md. This creates a brittle reference chain — there is no way to programmatically verify that an EXPERIENCE.md behavior uses the correct visual token. A review convention or enforced syntax would resolve this.

### Finding 4 (Medium severity) — Weather banner and Reminder controls lack visual specs
These are first-class components in EXPERIENCE.md's behavioral patterns but are only mentioned in passing in DESIGN.md's layout description. No tokens, no shape specs, no spacing values. They need full entries in DESIGN.md's component YAML and prose sections.

### Finding 5 (Low severity) — Unused tokens and token fragments
`spacing.*` tokens are defined but never referenced in any component spec. `colors.surface-secondary`, `colors.ink-muted`, `colors.tab-*`, `rounded.sm`, `rounded.lg`, and several dark-mode variants are defined but unused in DESIGN.md's own component specs. Consider either removing them or adding component specs that use them.

---

## Files reviewed

- `/home/jaycee/Projects/Plenty/docs/planning-artifacts/ux-designs/ux-Plenty-2026-07-16/DESIGN.md`
- `/home/jaycee/Projects/Plenty/docs/planning-artifacts/ux-designs/ux-Plenty-2026-07-16/EXPERIENCE.md`
- `/home/jaycee/Projects/Plenty/docs/planning-artifacts/ux-designs/ux-Plenty-2026-07-16/.memlog.md`
- `/home/jaycee/Projects/Plenty/docs/planning-artifacts/architecture/architecture-Plenty-2026-07-15/ARCHITECTURE-SPINE.md`
