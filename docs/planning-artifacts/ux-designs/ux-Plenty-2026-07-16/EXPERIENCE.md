---
status: final
created: 2026-07-16
updated: 2026-07-16
sources:
  - docs/planning-artifacts/architecture/architecture-Plenty-2026-07-15/ARCHITECTURE-SPINE.md
  - docs/planning-artifacts/ux-designs/ux-Plenty-2026-07-16/.memlog.md
  - docs/planning-artifacts/research/market-hydration-app-market-research-2026-07-15.md
  - constants/colors.js (existing palette)
---

# Plenty — Experience Spine

> Paired with `DESIGN.md`. Visual specs live there; this spine owns *how it works*.

## Foundation

Single-surface mobile, iOS + Android with behavioral parity. No UI system named — inherits platform conventions for navigation, native gestures, system font stack, dynamic type, and accessibility APIs. `DESIGN.md` is the visual identity reference; this spine is the experience.

**Form factor:** Phone portrait primary. No landscape-adaptive layouts in v1 — content scrolls rather than reflows. Android first (current user base), iOS parity targeted for Sprint 9.

**Paradigm:** Screen-based React Native with utility modules per the architecture spine (AD-1 through AD-13). No global state library. Theme via Context. AsyncStorage is the single persistence layer.

## Information Architecture

| Surface | Reached from | Purpose |
|---|---|---|
| Onboarding | Cold install (first launch) | 3-slide feature tour — mascot intro, set daily goal, set reminder interval |
| Home (tab 1) | Tab bar, or completed onboarding | Mascot hero, speech bubbles, daily progress, quick-log, reminder controls, weather banner |
| Log (tab 2) | Tab bar | Drink history list, weekly/monthly charts, collapsible reports, pattern analysis |
| Achievements (tab 3) | Tab bar | Trophy shelf — unlocked and locked achievement display |
| Settings (tab 4) | Tab bar | All app settings, theme toggle, data export/import, privacy policy link |
| Amount picker | Home quick-log long-press | Modal overlay — custom drink amount input |
| Achievement popup | Goal hit, achievement unlock | Modal overlay — celebration with confetti and mascot reaction |
| Toast | Triggered by log action | Transient top-of-screen confirmation — "250ml logged!" |

Bottom tab bar with exactly 4 entries. Modals are RN `<Modal>` overlays (not navigation destinations). Toast is a transient overlay.

## Voice and Tone

**Default tone: Buddy.** Friendly, casual, simple. Short sentences. The mascot talks to the user like a good friend reminding you to take care of yourself — never nagging, never clinical.

**Celebration tone: Buddy-with-a-dash-of-Silly.** At goal hits, streak milestones, and achievement unlocks, the mascot gets playful. Puns encouraged. Silliness is a reward for showing up.

| Do | Don't |
|---|---|
| "Time to drink up!" | "Your hydration levels are below optimal." |
| "Nice one!" | "250ml logged successfully." |
| "Hot one today — grab an extra glass!" | "Heat advisory detected. Increase fluid intake by 20%." |
| "7 days strong! You're a legend." | "7-day streak maintained. 87% of users quit after this point." |
| "Almost there — just 2 more glasses!" | "Goal progress: 75% complete." |
| Short, warm complete sentences. | Semicolons, bullet lists, percentages in speech. |

The speech bubble shows one line of text at a time. Multi-line messages scroll or split across two cycles (e.g., the mascot says one thing, blinks, then says the next).

## Component Patterns

Behavioral. Visual specs live in `DESIGN.md.Components`.

| Component | Surface | Behavioral rules |
|---|---|---|
| Mascot | Home | Renders current sprite composite. Reacts to weather, time, user action, and reminder state automatically (no tapping required). Tap still triggers an expression cycle. |
| Speech bubble | Home | Shows contextual message. Updates on: log action, weather change, time-of-day transition, reminder fire, escalation tier change. Never shows the same message twice in a row. |
| Quick-log button | Home | Tap → log 250ml, medium haptic, mascot happy reaction, progress bar animates, toast appears. Long-press → amount picker modal. Disabled state: none (always loggable). |
| Progress bar | Home | Animated width transition (600ms ease-out) on log. Re-renders from `getLogs()` aggregation — no live listener; pulls on foreground and after log action. |
| Glass fill | Achievement popup | Reanimated SVG wave. 3000ms full cycle. Appears on goal hit, fills completely, holds for 1.5s, drains over 2s. Triggered once per goal hit — not replayed. |
| Toast | Global overlay | Appears at top of screen on log action. "Xml logged!" with success color. Auto-dismiss after 2s. No action, no tap-to-dismiss (it fades). Single toast at a time — new one replaces pending. |
| PressableScale | Buttons, rows, toggles | Reanimated pressable. Scale to 0.96 on press-in, return on release. Medium haptic on primary actions (log, toggle reminder, unlock achievement). No haptic on navigation taps or repeated toggles. |
| Achievement trophy | Achievements | Shelf-display grid. Unlocked: full-color sprite. Locked: desaturated silhouette. Tap unlocked → brief celebration replay (confetti + mascot cameo). Tap locked → speech bubble hint ("Keep drinking!"). |
| Weather banner | Home | Conditionally rendered above mascot. Shows temperature and a brief advisory. Auto-hides after 8 seconds on first display per session. Collapsible by tap. |
| Reminder controls | Home | Compact row. Shows current interval. Start/stop toggle. Tap on interval opens the interval picker (a row of preset chips + custom input). |

## State Patterns

### Mascot State Machine

The mascot's visual state is determined by three independent axes that combine:

| Axis | States | Priority |
|---|---|---|
| **Weather** | `hot` (sweat, tongue out), `rainy` (umbrella), `snowy` (shiver), `normal` (no weather modifier) | High — overrides time-of-day when active |
| **Time of day** | `morning` (yawn, stretch), `day` (alert, idle), `night` (sleepy, pajamas) | Medium — overridden by weather when weather is active |
| **User state** | `idle` (blinking, small bounce), `just-logged` (happy blink, thumbs up), `goal-hit` (celebration dance), `streak` (fire eyes), `missed` (slight encouragement), `escalation` (urgent wave) | Highest — overrides both weather and time on trigger, then decays back |

**Priority resolution:** User state > Weather > Time of day. When the user logs a drink, the mascot plays the `just-logged` reaction for 2 seconds, then decays to weather + time composite. When weather is `hot`, the sweat/tongue expression is the base — user actions play on top (e.g., happy blink *while* sweating).

**User-state within-axis priority** (when multiple user states are true simultaneously):
1. `goal-hit` — highest, 3s duration, overrides all other user states
2. `escalation` — 5s or until cleared by log action, overrides streak/missed
3. `streak` — 1.5s, overrides missed/just-logged
4. `just-logged` — 2s, overrides missed
5. `missed` — 3s decay
6. `idle` — base state, always running when no other user state is active

If a higher-priority state triggers while a lower one is decaying, the lower is discarded and the higher plays. Exception: `just-logged` while `escalation` = the log action clears escalation entirely (user responded), then `just-logged` plays.

**Axes that don't combine with weather props:**
- `rainy` (umbrella) — mascot holds umbrella in one hand. Props conflict with other hand-held expressions (e.g., coffee). Umbrella wins when rainy.
- `hot` (sweat drops + tongue out) — sweat drops are effects, not props. These composite cleanly with any expression.
- `night` (pajamas) — pajamas are a body overlay, not a prop. Composites cleanly with weather effects (e.g., hot + night = sweat drops + pajamas).

**Idle behavior:** The mascot blinks every 4-6 seconds (randomized). A subtle bounce animation (Reanimated, 2s cycle, ~6px vertical) runs continuously. The speech bubble updates on a timer — a new contextual message every 60-120 seconds if the user is idle, cycling through encouragement and weather-based advice.

### State Patterns by Surface

| State | Surface | Treatment |
|---|---|---|
| Cold open (first launch) | Onboarding | 3-slide feature tour introduced by the mascot. After completion → Home. |
| Cold open (returning) | Home | Mascot greets based on time of day ("Morning!" / "Hey!" / "Drink up!"). Progress bar loads from today's logs. |
| Loading (AsyncStorage read) | Home | Skeleton placeholder: progress bar track shows at 0% width, mascot in `idle` state, speech bubble shows "Loading…" in {colors.ink-muted}. Transitions to full state when data resolves (<100ms typical). |
| Empty log (no entries today) | Home | Speech bubble: "Let's get started! One tap = 250ml." |
| Goal hit | Home | Speech bubble: celebration message. Progress bar hits 100%. Glass fill animation triggers (once per goal hit). Achievement popup screens if a new achievement unlocked. |
| Streak day | Home | Mascot has subtle fire eyes. Speech bubble acknowledges the streak. |
| Hot weather | Home | Weather banner appears (auto-dismisses after 8s first time). Mascot displays hot expression (sweat, tongue out). Speech bubble: heat advice. |
| Rainy weather | Home | Mascot holds umbrella. Speech bubble: "Stay cozy!" or similar. |
| Nighttime (10pm–6am) | Home | Mascot wears pajamas. Speech bubble: quiet, encourages last glass before sleep. Quick-log button unchanged (drinking water at night is still fine). |
| Reminder overdue | Home (on open) | Mascot moves to escalation state if time since last drink >2h. Speech bubble gets more urgent tone. |
| Notification permission denied | Home | Subtle banner below mascot (not blocking). "Reminders need permission. Open Settings?" |
| Location denied | Weather banner | Falls back gracefully — no banner shown. Settings offers manual city/zip input. |
| Loading (history/reports) | Log | Skeleton rows (4-6 pulsing bars matching chart shape). Chart area shows empty canvas with axis labels. Reports section shows collapsed skeleton placeholder. |
| Empty log list | Log | Single line: "No entries yet — start logging on the Home screen." |
| Loading (achievement data) | Achievements | Trophies grid rendered as 12 skeleton placeholders (rounded rects matching trophy shape, pulsing). |
| Empty achievements | Achievements | All 12 trophies displayed as locked silhouettes. Speech bubble hint on first tap. |
| Dark mode toggled | Global (immediate) | Mascot outfit swaps to sunglasses or nightcap based on current time. All surfaces re-theme immediately. |
| Limited connectivity (weather fetch) | Home | Weather banner shows cached data with "Updated X ago." No error state — the mascot stays on its previous expression. |
| All data reset | Settings (danger action) | Confirm dialog. On confirm: cleared to cold state — on next launch, onboarding plays again. |

## Interaction Primitives

- **Tap** to log, toggle, navigate, open. Primary interaction.
- **Long-press** on quick-log button → amount picker modal. Only long-press in the app.
- **Swipe-to-delete** on log entry rows (native platform pattern, confirm sheet).
- **Pull-to-refresh** on Log screen only (recalculates reports/patterns).
- **PressableScale** wrapper (Reanimated) on all tappable elements. Scale 0.96 on press-in, spring back on release.
- **Medium haptic** (`expo-haptics`): on log action, goal hit, achievement unlock, reminder toggle on. No haptics on tab bar switches, scroll, or repeated rapid actions.
- **Light haptic** (`expo-haptics`): on speech bubble update (subtle tap when the mascot says something new).
- **Banned everywhere:** carousels, hero animations on cold open, badge counts on tab bar icons, push notification re-engagement, infinite scroll (paginate or capped lists), hover-only affordances.

## Accessibility Floor

Behavioral. Visual contrast lives in `DESIGN.md` (existing palette verified for WCAG AA compliance in both themes).

- **VoiceOver / TalkBack:** Every interactive element labeled with role + state. The mascot's speech bubble content is announced on update — `accessibilityLiveRegion="polite"`. Mascot expression changes (weather, time, user-action reactions) are announced as companion text: "Mascot is sweating — it's hot out." Confetti bursts and toast confirmations are announced via `accessibilityLiveRegion="polite"` as well — "Goal reached! All 8 glasses." "250ml logged." The quick-log button reads as "Log 250ml. Double-tap to log." and updates its accessibility label to "Log 250ml — 4 of 8 glasses today." after each log. Achievement popup announces its title and unlock status on appearance.
- **Dynamic type:** Honored through system font stack at every level. UI must remain legible at largest accessibility setting — no truncation on buttons, no clipped speech bubbles.
- **Reduce Motion:** Skip all Reanimated transitions (mascot bounce, progress bar animation, toast fade, WaterFill wave, confetti). Speech bubble still updates content instantly. Haptic feedback suppressed when system reduce motion / reduce vibration is active. Per `utils/motion.js` from the architecture spine (AD-11).
- **Tap targets:** ≥ 44pt (iOS) / 48dp (Android) — the quick-log button is 56px by design. All chip-style targets (interval picker, settings rows) meet this.
- **Focus traversal:** Matches reading order on every surface — left-to-right, top-to-bottom. The quick-log button is the first focus target on Home.
- **Notification permission denied:** App never blocks. A non-blocking banner informs the user. The quick-log and progress features work without notifications — the app is usable as a manual tracker.
- **Contrast theme:** Dark mode is the contrast-friendly theme by default (light text on dark background meets higher contrast ratios). The `ThemeContext` respects OS-level accessibility contrast preferences.

## Key Flows

### Flow 1 — First Run (Jamie, college student, downloaded from Play Store)

1. Jamie opens Plenty for the first time. The mascot waves on a clean screen.
2. **Slide 1:** "Hi! I'm Plenty — your water buddy. I'll help you stay hydrated." Mascot waves. Tap to continue.
3. **Slide 2:** "How much water do you want each day?" A picker with preset amounts (6/8/10 glasses) + custom input. Default: 8. Jamie picks 8. Tap to continue.
4. **Slide 3:** "How often should I remind you?" Interval picker with common presets (30min, 1h, 2h). Notification permission dialog is *primed* — "I'll remind you to drink. Is that okay?" Before the OS prompt. Jamie taps "Sure!" → OS prompt → grants.
5. **Climax:** Jamie lands on Home. The mascot says "Ready to go! One tap = 250ml." The progress bar is at 0/8. Quick-log button is big and inviting. He taps it once — medium haptic, progress bar animates to 1/8, mascot does a happy blink, toast appears "250ml logged!" He smiles. The habit has a first win in under 90 seconds.

Failure: notification permission denied → No alert. The mascot says "No worries — you can still log anytime." A small banner appears below the mascot: "Reminders need permission. Open Settings?" Jamie ignores it and takes another sip. The app works perfectly as a manual tracker.

### Flow 2 — Daily Use (Jamie, two weeks in, hot afternoon)

1. Jamie opens Plenty around 3pm. It's 34°C outside.
2. Weather banner appears at the top: "34°C — hot one! Drink extra water." Auto-dismisses after 8 seconds.
3. The mascot is sweating slightly, tongue out. Speech bubble: "Phew! Grab a cold one."
4. Jamie's progress bar shows 3/8. The mascot adds: "5 to go — you've got this."
5. He taps quick-log once. Medium haptic. Mascot blinks happily. Progress bar sweeps to 4/8. Toast: "250ml logged!"
6. **Climax:** He's halfway. The mascot does a small bounce and the speech bubble switches to "Halfway there!" No fanfare, no confetti — just a buddy acknowledging the milestone. Jamie puts the phone down and actually drinks more water.
7. He returns later in the evening. At 10pm, the mascot is now in pajamas, sleepy-eyed. Speech bubble: "Last glass before bed?" He logs one more and closes the app.

Failure: weather fetch fails (no signal) → Mascot stays on normal weather expression. No banner. Cached data used if available. Jamie sees nothing broken — the app just uses the last known weather state or defaults.

### Flow 3 — Goal Hit + Achievement (Jamie, one-tap Sunday, all 8 glasses done)

> **Note:** This flow is the *one explicit exception* to the "one playful moment at a time" rule. Goal-hit deliberately stacks mascot dance + WaterFill animation + confetti as a crescendo moment. This stacking is reserved exclusively for the once-per-day goal hit and must not be used for routine actions or replayed on same-day extra logs.

1. Jamie logs his 8th glass of the day. Progress bar hits 100% with a full-width sweep animation.
2. The Glass Fill animation triggers: a bottle outline fills with a rising water wave (3000ms cycle). Mascot is in the corner of the animation doing a little dance.
3. **Climax:** Confetti burst. The mascot's biggest celebration — arms up, bouncing. Speech bubble: "8 glasses! You're a hydration hero! 🎉" Medium haptic. Jamie feels a genuine moment of accomplishment from a water reminder.
4. The Glass Fill drains over 2 seconds. Confetti fades. Mascot settles back to idle.
5. If this was also the 7th day of a streak, the achievement popup triggers next: "7-Day Streak!" on the trophy shelf visual. Mascot cameo. Another haptic.
6. Jamie taps "Nice!" on the achievement popup. He's on Home again. Progress bar starts fresh at 0/8. Mascot: "New day, new water! Let's go!"

Failure: goal already hit earlier → No celebration replay for logging additional water beyond the goal. Progress bar stays at 100% (shows "Goal met!"). The mascot simply acknowledges the extra log quietly.

### Flow 4 — Dark Mode Transition (Jamie, late-night check)

1. Jamie opens Plenty at 11:30pm in bed. His phone is in dark mode.
2. The app surfaces in dark mode — deep navy background, cool blue accents. The mascot wears a starry nightcap with sleepy eyes. Speech bubble: "Hey night owl. One last glass?"
3. Jamie's progress bar shows 6/8 in the dark theme. The bar fill uses `{colors.brand-dark}` (`#6BB5FF`), readable against the dark track.
4. **Climax:** The transition is seamless — no flash, no reload. Jamie's phone switches between light and dark throughout the day, and Plenty follows without breaking the mascot's emotional continuity.

Failure: user manually toggles theme in Settings → Immediate re-theme, no flash. Mascot outfit swaps instantly with a 300ms Reanimated crossfade so the transition feels considered, not jarring.

### Flow 5 — Escalation & Re-engagement (Jamie, forgot to drink all afternoon)

1. Jamie opened Plenty at 9am, logged one glass, then got busy and closed the app.
2. It's now 2pm — 5 hours since his last log.
3. The notification system fires a reminder (AD-5). `getEscalationTier()` returns `warning` (2h+) then `alert` (4h+). The alert notification reads: "Hey — 4 hours! Your body needs water. Log one now?" with a "Log 250ml" action button.
4. Jamie taps the notification action → app opens directly. The mascot is in escalation state — waving a bit more urgently. Speech bubble: "Been a while! Let's get a glass in you."
5. He taps quick-log. The mascot relaxes back to idle. Speech bubble: "There we go. Feels good."
6. **Climax:** The escalation state is the mascot being *concerned*, not *punitive*. Jamie feels gently nudged, not shamed. He gets back on track with one tap.

Failure: Jamie opens the app without logging → Mascot stays in escalation state. Speech bubble: "Still time — one glass." The banner on Home persists as a gentle visual nudge. No guilt. The state only clears when a log happens.

### Flow 6 — Reviewing Weekly Patterns (Jamie, Sunday evening, checking his week)

1. Jamie opens Plenty on Sunday evening and taps the Log tab.
2. The Log screen loads: his drink history is listed chronologically, most recent first. At the top, a weekly bar chart shows his Monday-through-Sunday totals. The mascot is not here — this is a data surface, quiet and functional.
3. He notices Wednesday's bar is noticeably shorter — he only logged 3 glasses that day. The bar chart uses {colors.brand-light} for most days with today (Sunday) highlighted in {colors.brand}. The axis is clean, no decoration.
4. Below the chart, a collapsible "This Week" report card shows: average daily intake, most consistent drinking hour (peak), and a "lull" period. These are generated by `utils/reports.js` and `utils/patterns.js`.
5. He taps the report card to expand it. More detail: day-of-week breakdown comparing this week to his average.
6. **Climax:** Jamie spots the pattern — Wednesdays are consistently low because he has back-to-back meetings mid-afternoon. The data didn't shame him; it showed him something useful. He decides to keep his water bottle on his desk during meetings next week.
7. He swipes down to refresh the data (pull-to-refresh recalculates patterns). The chart animates briefly as the bars re-render. No mascot, no fanfare — just clean utility that respects his attention.

Failure: no data yet (first week) → The Log screen shows an empty chart frame with axis labels but no bars. The report card reads "Not enough data yet — check back after a few days." The history list is empty with the empty-state message.

### Flow 7 — Changing Settings & Exporting Data (Jamie, backing up before switching phones)

1. Jamie taps the Settings tab. The screen shows grouped settings rows.
2. He scrolls past the notification interval, daily goal, and quiet hours sections.
3. He taps "Data Export" — a modal lists CSV and JSON options. He picks JSON (for re-import later).
4. **Climax:** The file saves to his device via expo-file-system. A toast confirms: "Backup saved!" No mascot commentary — this is utility, not delight. The settings screen is purely functional.
5. He scrolls to the bottom and finds the Privacy Policy link (per Sprint 6 Epic D). He opens it in a browser. Satisfied, he closes Settings and goes back to Home.

Failure: export fails (storage full) → Error dialog with message: "Couldn't save backup. Free up space and try again." The mascot is absent — errors on utility screens use platform-native error patterns.

## Inspiration & Anti-patterns

- **Lifted from Tamagotchi / virtual pets:** The mascot's needs-based reactivity (weather, time, user action). It's not a pet you *take care of* — it's a buddy that takes care of *you*. The reactivity pattern is the same, but the relationship is reversed.
- **Lifted from Duolingo:** The streak celebration and achievement popups. Duolingo proved that gamification drives habit retention. Plenty adapts this but strips the *punishment* — no streak decay, no "you lost your streak." The mascot never guilt-trips.
- **Lifted from WaterMinder:** Quick-log as the primary action. One tap to log. WaterMinder's core interaction is the fastest in the category — Plenty matches that speed while adding personality.
- **Rejected — Streak counters with decay:** Plenty celebrates streaks but never shows a "you lost your X-day streak" message. The mascot says "Let's start a new streak!" instead. Punishment mechanics reduce long-term retention for habit apps.
- **Rejected — In-app purchases / premium gating:** AD-1 and AD-2. No paywall for features, no premium mascot skins. The mascot's outfit variety comes from context (weather, time, dark mode), not purchase.
- **Rejected — Social features / leaderboards:** Single-user, all-local. No competition, no sharing required for full feature use.
- **Rejected — AI-suggested drinking schedule:** The mascot's advice is rule-based (weather, time, escalation tier, pattern analysis). Predictable, local, private. No AI inference on device or server.
