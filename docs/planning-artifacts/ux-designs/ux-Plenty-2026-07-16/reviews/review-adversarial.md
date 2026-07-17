# Adversarial Review — Plenty UX Spines

**Reviewer:** Dev A + Dev B (adversarial pair construction)
**Date:** 2026-07-16
**Sources:** DESIGN.md, EXPERIENCE.md, ARCHITECTURE-SPINE.md

---

## Finding 1 — DESIGN.md vs EXPERIENCE.md: Speech Bubble Line Count (DIRECT CONTRADICTION)

**Severity: HIGH | Type: Contradiction**

| Source | Statement |
|---|---|
| DESIGN.md (line 163) | "Contains **1-2 lines** of `display-mascot` text" |
| EXPERIENCE.md (line 54) | "The speech bubble shows **one line** of text at a time. Multi-line messages scroll or split across two cycles" |

**Dev A** builds a speech bubble container with dynamic height that accommodates 1-2 lines, rendering all text at once. The bubble shrinks/grows based on content.

**Dev B** builds a single-line speech bubble with fixed height. Multi-sentence messages get split: sentence one renders, then after a timed interval the bubble swaps to sentence two.

**Impact:** Different UI layout, different animation needs, different Dynamic Type behavior. If Dev A delivers a 2-line bubble but the copy is written assuming line-by-line cycling, the rhythm is broken. If Dev B delivers single-line but copy arrives as a single 2-line sentence, it gets truncated or clipped.

**Resolution needed:** Pick one. If single-line with cycling is the intent, update DESIGN.md. The `display-mascot` font is a rounded display font — single-line keeps it punchy, which aligns with the "punctuation mark" philosophy. Recommend adopting Dev B (EXPERIENCE.md).

---

## Finding 2 — "One Playful Moment at a Time" Violated by Flow 3

**Severity: HIGH | Type: Contradiction**

| Source | Statement |
|---|---|
| DESIGN.md Do/Don't (line 183) | "**One playful moment at a time** — mascot or WaterFill or achievement, not all three" |
| EXPERIENCE.md Flow 3 (lines 163-165) | "The Glass Fill animation triggers: a bottle outline fills with a rising water wave... **Mascot is in the corner of the animation doing a little dance.** **Confetti burst.**" |

**Dev A** reads DESIGN.md strictly: when WaterFill plays, the mascot goes neutral/absent. Confetti fires only after the mascot settles. Strict sequential ordering.

**Dev B** reads EXPERIENCE.md Flow 3: all three play simultaneously — glass fill rising, mascot dancing in the corner, confetti bursting. The Flow describes this as the "biggest celebration" moment.

**Impact:** A senior engineer reading both documents will flag the contradiction and call for clarification. If Dev A builds sequential but Dev B's implementation is reviewed, the reviewer might say "you're only doing one at a time, but the Flow says all three at once" (or vice versa).

**Resolution needed:** DESIGN.md either needs to carve out an exception for the goal-hit climax (where stacking is intentional) or EXPERIENCE.md needs to re-sequence the celebration so the mascot dance precedes the glass fill, which precedes the confetti.

---

## Finding 3 — Mascot State Machine: Within-Axis Priority Undefined

**Severity: HIGH | Type: Ambiguity**

The state machine defines three axes with cross-axis priority (User state > Weather > Time of day). But within the **User state** axis, multiple states can be true simultaneously:

| Scenario | Active User States | Behavior |
|---|---|---|
| User has 7-day streak AND hasn't logged in 5h | `streak` + `escalation` | Fire eyes (streak) + urgent wave (escalation)? Or does one win? |
| User just logged AND has a streak | `just-logged` + `streak` | Happy blink (just-logged) decays to fire eyes (streak)? Or does the happy blink fully override and then go to idle, losing the streak indicator? |

**Dev A** implements a stack: the highest-priority user state (by some internal ordering) wins the primary expression, but secondary states can modify it (e.g., fire eyes persist through `just-logged`). Priority within User state: `goal-hit` > `escalation` > `just-logged` > `streak` > `missed` > `idle`.

**Dev B** implements an override model: whichever User state was triggered most recently wins completely. `just-logged` fully replaces the visual until it decays. All other User states are lost during the decay period.

**Impact:** The streak indicator might disappear for 2 seconds after every log (Dev B) or persist as a subtle modifier (Dev A). Inconsistent user perception of whether streaks are being tracked.

**Resolution needed:** Define within-axis priority for User states. Recommend: User states have an enumerated priority, but lower-priority states that are "ambient" (like streak) modify the expression rather than being fully suppressed.

---

## Finding 4 — Accessibility: Screen Reader User Misses the Entire Core Loop

**Severity: HIGH | Type: Gap**

Key accessibility gaps across the experience:

1. **Mascot state changes are invisible to screen readers.** When the mascot transitions from idle to hot (sweating, tongue out), the screen reader is never told. `accessibilityLiveRegion="polite"` is set on the speech bubble (good), but the mascot's visual expression — the primary feedback mechanism — has no accessibility label.

2. **Confetti burst, glass fill, mascot dance (Finding 2) are purely visual celebrations.** A screen reader user hits 8 glasses and gets... nothing audible. The speech bubble might update, but the timing of that update relative to the animation isn't specified. The magic moment is silent.

3. **Toast (2s auto-dismiss) likely gets missed.** Screen reader users navigate slowly and methodically. A 2-second toast that auto-dismisses without `accessibilityLiveRegion` is gone before they finish reading the current element. Recommend `accessibilityLiveRegion="polite"` on the toast, or don't auto-dismiss it until the user has acknowledged it.

4. **Focus order vs. visual order on Home.** EXPERIENCE.md (line 134) says "The quick-log button is the first focus target on Home." But the visual layout (DESIGN.md lines 129-135) is: (1) mascot hero, (2) progress bar, (3) goal text, (4) quick-log button. For a screen reader user, the first focus target is the quick-log button — they skip the mascot greeting and progress entirely until they navigate backward. The mascot greeting, logically, should be first so the user knows the app state on launch.

5. **Weather banner auto-hides after 8 seconds (EXPERIENCE.md line 70).** A screen reader user who is still exploring the top of the screen when the banner disappears will never know it existed. No mention of an accessible alternative.

**Dev A** adds `accessibilityLabel` to the mascot that updates reactively ("Plenty is hot and sweating"), announces confetti via `accessibilityLiveRegion="assertive"`, and makes toast persist until focus moves away.

**Dev B** only applies the spec's minimum (speech bubble live region, tap target sizes) and doesn't label the mascot's visual state because the spec doesn't require it.

**Resolution needed:** The spec doesn't address screen reader feedback for core emotional moments. Add accessibility requirements for: mascot state labels, celebration announcements, toast visibility, and weather banner accessible alternatives.

---

## Finding 5 — Loading States: The AsyncStorage Blindness

**Severity: MEDIUM | Type: Gap**

The architecture uses AsyncStorage for all persistence (AD-6, AD-8). AsyncStorage operations are asynchronous. Yet the state patterns table treats all reads as instantaneous:

| State (from EXPERIENCE.md) | What actually happens |
|---|---|
| Cold open (returning) — "Progress bar loads from today's logs" | `getLogs()` is async. For 100ms-500ms, the progress bar is empty. What does the user see? |
| Streak day — "Mascot has subtle fire eyes" | Streak is computed from logs. Async. Is there a flash of "no streak" before the streak data loads? |
| Empty log list — "No entries yet" | Reads logs to determine emptiness. Is there a spinner? A skeleton? |
| Weather banner — "shows cached data" | `getWeather()` reads from AsyncStorage. What does the banner render during the read? |

**Dev A** adds a brief shimmer/skeleton frame for the progress bar and mascot state, hiding the logical flash of default state before async data arrives. Provides a unified `useLoadedData()` pattern.

**Dev B** renders default state (0/8, idle mascot) immediately, then swaps to real data when the async call resolves. User sees a visual flash of "0/8" → "4/8" on every cold open.

**Impact:** Dev B's approach causes a visible flicker on every cold open — especially noticeable on lower-end Android devices where AsyncStorage reads are slower. The app feels janky even though "the data loaded."

**Resolution needed:** Specify loading states for every async data dependency. The simplest approach: render nothing (or a muted placeholder) until all initial data resolves, then render everything at once. No flickering partial states.

---

## Finding 6 — Midnight Rollover: The Day Boundary Ambiguity

**Severity: MEDIUM | Type: Edge Case**

No state pattern or flow addresses what happens at the day boundary:

- **User logs at 11:58pm.** Bar shows 7/8. At 12:00am (while app is open), does it reset to 0/8 with a visible animation? Or does it reset on foreground?
- **User logs at 11:59pm and again at 12:01am.** Does the midnight rollover between these two taps cause the progress bar to reset and then immediately show 1/8? Or does it show 8/8 (counting both to today)?
- **Mascot time-of-day transition at midnight.** Does the mascot instantly switch from "night" to... still "night" (10pm-6am per EXPERIENCE.md)? The spec says nighttime is 10pm-6am, so midnight stays in night mode. OK. But what about the greeting? Does it change from "Last glass before bed?" to... the same thing?

**Dev A** resets on foreground only — the progress bar stays at 7/8 if the app is open at midnight. On next foreground, it recalculates.

**Dev B** resets on time change — at 12:00am, the progress bar animates from 7/8 to 0/8 with a 600ms ease-out, regardless of app state. If the app is in background, it resets on next foreground.

**Impact:** If the user is actively logging near midnight, Dev B could cause a confusing "my glass disappeared" moment. Dev A could let the user log a drink that gets attributed to the wrong day.

**Resolution needed:** Day boundary behavior must be explicit. Recommend: reset on foreground (Dev A) — simpler, matches the "pull on foreground" pattern from EXPERIENCE.md. Logs always timestamp with `Date.now()`, so the attribution is correct even if the progress bar display lags.

---

## Finding 7 — Weather Axis State Conflict: No Resolution Rule

**Severity: MEDIUM | Type: Ambiguity**

The state machine defines weather states `hot`, `rainy`, `snowy`, `normal` as a single axis. These appear to be mutually exclusive. However:

1. **Open-Meteo can return conditions that imply both heat AND precipitation** (e.g., 35°C + thunderstorm). The weather module needs to decide which state wins. The spec doesn't define this.

2. **Props conflict table** (EXPERIENCE.md lines 87-90) defines combos for `hot` (effects, not props), `rainy` (umbrella prop), and `snowy` (shiver — no props or effects listed). But it doesn't state that weather states are mutually exclusive. If a dev builds the weather axis as a bitmask (multiple states active), there's no resolution rule.

3. **`hot + rainy`:** Umbrella (rainy) vs. sweat drops + tongue out (hot). Which wins? The props table only says "umbrella wins" against hand-held expressions — but doesn't address how the *visual expression* resolves when two weather states disagree.

**Dev A** maps weather conditions to a single mutually exclusive state via a priority function: `rainy > snowy > hot > normal`. Rain always wins visually, but temperature modifies the speech bubble copy.

**Dev B** allows multiple weather states to composite (hot + rainy = sweating under umbrella, sweating and holding umbrella). This produces an incoherent visual (why is the mascot both hot and under an umbrella?).

**Resolution needed:** Declare weather states as **mutually exclusive** with a mapping function from Open-Meteo codes to the four states. Document the mapping thresholds (e.g., temperature > 30°C + clear = hot, precipitation > 0 = rainy unless temperature < 0°C, then snowy).

---

## Finding 8 — Amount Picker: Underspecified Input

**Severity: MEDIUM | Type: Ambiguity**

The amount picker (accessed by long-pressing the quick-log button) is listed in the IA but has no defined behavior beyond "custom drink amount input":

| Missing detail | Why it matters |
|---|---|
| Default value shown on open | If it shows 0, 250, or "enter amount" — three different UX feels |
| Preset options | Are there quick-select chips (100ml, 250ml, 500ml)? The quick-log already defaults to 250ml — is the picker free-form only? |
| Min / max validation | Can user enter 0? 1ml? 999999ml? |
| Unit display | "250" vs "250ml" — does the ml suffix auto-append? |
| Keyboard type | Numeric vs decimal pad? |
| Dismiss behavior | Tap outside to dismiss? Submit button? Hardware back? |

**Dev A** builds a bottom sheet with preset chips (100/200/250/500/750ml) + a custom input field with a maximum of 3000ml, numeric keyboard, "ml" auto-suffix.

**Dev B** builds a centered modal with a free-form text input, default "250", no presets, no max validation.

**Impact:** Completely different interaction quality. Dev B's picker is slower to use and error-prone.

**Resolution needed:** Specify presets, validation bounds, keyboard type, and dismissal behavior for the amount picker.

---

## Finding 9 — Haptic Spec Disagreement

**Severity: LOW-MEDIUM | Type: Variance**

| Source | Haptic rules |
|---|---|
| DESIGN.md (line 165) | "Medium haptic on press for primary actions (log, achievement view, toggle). **No haptic for repeated taps.**" |
| EXPERIENCE.md (lines 122-123) | "Medium haptic: on log action, goal hit, achievement unlock, **reminder toggle on**. No haptics on tab bar switches, scroll, or repeated rapid actions. **Light haptic: on speech bubble update**" |

Two differences:
1. DESIGN.md doesn't mention light haptic on speech bubble update. Dev A wouldn't implement it.
2. DESIGN.md says "no haptic for repeated taps" — does "repeated taps" mean rapid double-tapping, or does it mean the second time you log today you get no haptic? EXPERIENCE.md clarifies "repeated rapid actions" — but what's "rapid"? Within 1 second? 3 seconds?

**Impact:** Minor, but the speech bubble light haptic is a nice detail that DEV A would miss. And "rapid" is undefined — do we debounce at 500ms? 2000ms?

**Resolution needed:** Add the light haptic to DESIGN.md. Define "rapid" — suggest: no haptic for actions within 500ms of a previous action.

---

## Finding 10 — ShareCard: A Component Without a Home

**Severity: LOW | Type: Orphan**

ARCHITECTURE-SPINE lists `ShareCard.js` as a component (line 212) in the structural seed. It's never referenced in EXPERIENCE.md's IA table, never used in any flow, and has no access path.

- It's not in the Home screen component list (ARCHITECTURE-SPINE line 207: "HomeScreen → Mascot, WeatherBanner, AchievementPopup, ShareCard" — wait, it IS imported on Home, but never mentioned in EXPERIENCE.md).
- What triggers it? A share button? Streak milestone? Settings?

**Dev A** adds a share button to the achievement popup (reaching for the only celebration surface).
**Dev B** adds a share button to Settings (clean separation).

Each leads to different IA, different user expectations, and different review outcomes.

**Resolution needed:** Specify the trigger and access path for ShareCard, or remove it from the architecture until it's designed.

---

## Finding 11 — Platform Divergence: Unsafe Assumptions

**Severity: LOW-MEDIUM | Type: Gap**

EXPERIENCE.md says "behavioral parity" (line 18) but several unaddressed platform differences could break this:

| Concern | iOS | Android | Spec gap |
|---|---|---|---|
| Toast position | Must clear Dynamic Island / notch | Status bar height varies by OEM | "Top of screen" isn't the same Y coordinate |
| Navigation gestures | Swipe-back gesture can conflict with app UI | Back button dismisses modals | No mention of handling back navigation during modals |
| Tab bar style | Bottom tabs with translucent blur | Navigation bar + bottom tabs — pixel height differs | `@react-navigation/bottom-tabs` defaults differ per platform; the "exactly 4" spec doesn't account for visual differences |
| Notification interruption levels | iOS uses `interruptionLevel` (time-sensitive, critical) | Android uses channels + importance | Architecture defers this to Sprint 9 but the escalation state (warning at 2h / alert at 4h) is already designed; an alert-level notification won't behave the same on both platforms |
| Haptic feedback | `UIImpactFeedbackGenerator` — distinct medium/light | `VibrationEffect` — approximation only | "Medium haptic" won't feel the same |

**Dev A** uses `Platform.select` throughout and tunes timing/position per platform.

**Dev B** builds once, uses `Platform.OS` only where absolutely required by the API, assumes parity.

**Impact:** Dev B's approach produces a sub-par experience on one platform (e.g., toast clipped by notch on iOS, or haptics that feel wrong on Android).

**Resolution needed:** Identify the top 3 platform divergence points and specify per-platform handling (toast y-offset, modal back-button behavior, and at least a note on haptic parity).

---

## Finding 12 — Rapid Tap Race Condition on AsyncStorage

**Severity: MEDIUM | Type: Edge Case**

EXPERIENCE.md's toast spec says "Single toast at a time — new one replaces pending" (line 67). But the problem is deeper than the toast:

When a user taps quick-log 5 times in 2 seconds:
1. Each tap calls `saveLog()` → `AsyncStorage.setItem()` 
2. `setItem` is async — concurrent writes to `@plenty_logs` can collide
3. The progress bar reads `getLogs()` and animates — but which snapshot does it read?
4. "Disabled state: none (always loggable)" (EXPERIENCE.md line 64) — no debounce

**Dev A** serializes writes with a queue/batch or debounces the button at 300ms.

**Dev B** fires all 5 writes in parallel. AsyncStorage may overwrite its own data, losing 2-3 entries.

**Impact:** Lost drink logs. The user thinks they logged 5 glasses (1250ml) when only 2-3 persisted (500-750ml). The app breaks trust.

**Resolution needed:** Specify write serialization or a debounce/throttle on the quick-log button. AD-6 must clarify that concurrent writes to the same key need coordination.

---

## Finding 13 — Achievements: "Speech Bubble Hint" Has No Surface

**Severity: LOW | Type: IA Gap**

EXPERIENCE.md (line 69): "Tap locked → speech bubble hint ('Keep drinking!')."

The Achievements screen (tab 3) has no Mascot component (ARCHITECTURE-SPINE, line 215: AchievementsScreen has no Mascot import). So where does this "speech bubble hint" render?

- If it's a tooltip on the trophy itself (not the mascot's speech bubble), it shouldn't be called a "speech bubble" — that term is specifically defined in DESIGN.md as the mascot's UI element with the `display-mascot` font.
- If it IS the mascot's speech bubble, then the mascot needs to be present on the Achievements screen, which contradicts the architecture.

**Dev A** adds a tooltip component on the trophy card using system font (confusingly named "speech bubble" in the spec).

**Dev B** adds the mascot to the Achievements screen (violating the architecture spine's assumption that Mascot is Home-only).

**Resolution needed:** Clarify whether the locked-trophy hint is (a) a tooltip on the trophy card, using system font, or (b) the mascot's speech bubble, requiring the mascot to be imported on Achievements.

---

## Finding 14 — Midnight + Hot Weather: Mascot Wears Pajamas AND Sweats?

**Severity: LOW | Type: Edge Case**

EXPERIENCE.md (line 90): "hot + night = sweat drops + pajamas" — this is explicitly documented. But:

- **Rainy + night** — umbrella + pajamas? Umbrella conflicts with "hand-held expressions" (EXPERIENCE.md line 88). Pajamas are a body overlay, not hand-held. So visually: pajama-wearing mascot holding an umbrella. The spec doesn't mention this combo. It's probably fine, but unstated.
- **Snowy + night** — shivering in pajamas? Completely unaddressed.
- **Streak + night** — fire eyes + sleepy eyes? Which expression wins? The state machine's within-axis priority Issue (Finding 3) kicks in.

**Dev A** composites all three: streak fire eyes + pajamas + weather effects. The fire eyes override the sleepy eyes because streak is a User state (highest priority).

**Dev B** composites only two: the weather/User state winner + time of day. If streak is active, fire eyes replace sleepy eyes entirely — no compounding.

**Impact:** Minor visual differences, but the mascot's emotional coherence suffers in Dev B's interpretation (why is the mascot sleepy and excited at the same time?).

**Resolution needed:** Document which expressions composite and which replace. For the streak + night case, recommend: the mascot can be excited about the streak while wearing pajamas (body overlay independent of expression), but fire eyes replace sleepy eyes.

---

## Finding 15 — Voice & Tone: Unmeasurable Guidelines

**Severity: LOW | Type: Gap**

The Voice and Tone section (EXPERIENCE.md lines 40-53) gives good examples but several terms are too subjective for a developer to review against:

| Term | The problem |
|---|---|
| "Short sentences" | Is 8 words short? 12? 5? |
| "A-dash-of-Silly" | One dev's pun is another dev's cringe. Where's the line? |
| "Concerned, not punitive" (escalation) | "Been a while!" is mild. "Your body needs water." crosses into clinical (the Don't column). But what about "Hey! 4 hours is a long time!"? Friendly? Nagging? |
| "Quiet" (nighttime) | Lowercase? Shorter text? No exclamation marks? Or is this a visual instruction? |
| "Never shows the same message twice" | What's the deduplication window? Entire session? Last N messages? Forever? |

**Dev A** builds a message pool that never repeats within a session, with each message explicitly approved by a copywriter. Messages are short (under 60 chars), lowercase at night, and the escalation tier adds urgency through structure ("Hey! 4h. Drink?" vs "Hey, it's been a while — grab some water?").

**Dev B** writes messages on the fly, uses full sentences at all times, and deduplicates only against the immediately previous message.

**Resolution needed:** Add concrete constraints: max character count per message, nighttime tone rule (lowercase? 20% shorter? no `!`?), deduplication scope (per session or per period), and a defined set of approved escalation messages with tone calibration.

---

## Summary of Findings by Severity

| # | Finding | Severity | Type |
|---|---|---|---|
| 1 | Speech bubble: 1-2 lines vs 1 line | HIGH | Contradiction |
| 2 | "One playful moment" vs Flow 3 stacking | HIGH | Contradiction |
| 3 | Within-axis User state priority undefined | HIGH | Ambiguity |
| 4 | Screen reader misses core feedback loop | HIGH | Gap |
| 5 | Missing loading states for async data | MEDIUM | Gap |
| 6 | Midnight day-boundary rollover | MEDIUM | Edge case |
| 7 | Weather axis state conflict resolution | MEDIUM | Ambiguity |
| 8 | Amount picker underspecified | MEDIUM | Ambiguity |
| 9 | Haptic spec variance (speech bubble) | LOW-MEDIUM | Variance |
| 10 | ShareCard orphaned component | LOW | Orphan |
| 11 | Platform divergence assumptions | LOW-MEDIUM | Gap |
| 12 | Rapid-tap race condition (AsyncStorage) | MEDIUM | Edge case |
| 13 | "Speech bubble hint" on Achievements | LOW | IA gap |
| 14 | Composite mascot expressions | LOW | Edge case |
| 15 | Unmeasurable Voice & Tone guidelines | LOW | Gap |

---

## Verdict

**CONDITIONAL** — The spines are structurally sound but have 3 high-severity findings (contradictions in speech bubble line count and celebration stacking, plus the undefined user-state priority) that will produce divergent implementations. The accessibility and loading-state gaps are systemic rather than specific — they indicate a mindset that needs to be applied consistently rather than fixed with one edit.

**To pass, resolve in order:**
1. Reconcile DESIGN.md vs EXPERIENCE.md on speech bubble line count (Finding 1)
2. Carve out a celebration-stacking exception or re-sequence Flow 3 (Finding 2)
3. Define within-axis User state priority — how streak, escalation, and just-logged interact (Finding 3)
4. Add loading state specifications for all async data dependencies (Finding 5)
5. Specify the weather-state-to-mascot mapping function and mutual exclusivity rule (Finding 7)
