# Deferred Work

## Deferred from: code review of story 6.3-screen-transitions-toast (2026-07-19)

- Reduced-motion 2s auto-dismiss may violate WCAG timing guidelines [components/AchievementPopup.js:49] — Users with cognitive disabilities may need more time than 2s to read achievement content. Pre-existing design decision in story spec; no adjustable-timing framework exists. Out of scope for this story.

## Deferred from: code review of story 3.3-count-up-numbers (2026-07-19)

- Reduced-motion toggle animates from zero [utils/motion.js:92-106] — When `reduceMotion` transitions `true→false` at runtime, `countUp.value` is still `0` and the ensuing `withTiming` animates from 0 to the real value, causing a brief visual jump. Requires accessibility toggle while app is mounted. Same unhandled pattern as WaterFill.
- NaN input guard [utils/motion.js:99,105] — `Math.round(NaN)` produces `"NaN"` display. Reachable only via storage corruption or upstream bug. Pre-existing.

## Deferred from: code review of 1-1-fix-interval-persistence (2026-07-16)

- Redundant `getSettings()` after `saveSettings()` [screens/HomeScreen.js:197-198] — `saveSettings` already returns the merged object. Calling `getSettings()` immediately after is redundant. Not a bug — minor code smell, deferred from story 1.1 scope.

## Deferred from: code review of story 2.5-streak-flame (2026-07-18)

- Dead code: `flickerAnimation` `reduceMotion` parameter always passed as `false`; guard is redundant with calling effect. Code hygiene only.
- Negative streak silently returns null from `getFlameTier`. Data validation concern outside story scope.
- Reduce-motion test: doesn't verify animation was actually suppressed (only checks render output exists). Minor test completeness issue.
- streak=0 hides entire streak badge (flame + count). AC says count should show without flame. Pre-existing UX decision.

## Deferred from: code review of 2-6-streak-on-widget (2026-07-18)

- SURFACE_BASE constant defined but never used in PlentyAppWidget.kt companion object. Pre-existing.
- getIdentifier() runtime resource lookup used instead of compile-safe R.id imports. Pre-existing pattern.
- No localization — widget strings hardcoded in English. Pre-existing (Plenty has no localization framework).
- XML background hardcoded to white; programmatic override for dark mode would be invisible if suppressed. Pre-existing fallback.
- Fire emoji in RemoteViews has inconsistent rendering across API levels and OEM launchers. Pre-existing design choice.
- isDarkMode() treats UI_MODE_NIGHT_UNDEFINED as light mode. Edge case on devices with undetermined theme.
- Color.parseColor called from scratch on every widget update. Pre-computing as Int constants would be more efficient. Low impact since widget updates are rare.
- JS formatWidgetStreak doesn't include fire emoji while Kotlin version does. By design — JS is test utility, Kotlin renders on widget.
- Infinity streak passes formatWidgetStreak type guards. Not reachable in practice (getStreak returns bounded ints).

## Deferred from: code review of story 3.2-water-fill-ripple (2026-07-18)

- NaN interval in re-arm effect on fresh install [screens/HomeScreen.js:317] — `settings.intervalMinutes * 60` produces NaN when intervalMinutes is undefined
- Cross-platform Linking.openURL uses iOS-only scheme [screens/HomeScreen.js:598] — Android users can't open notification settings
- No error feedback when freeze application fails [screens/HomeScreen.js:211] — Modal stays open silently on useFreeze returning false
- Rapid-fire storage writes on custom interval keystroke [screens/HomeScreen.js:546] — saveSettings called on every keystroke
- Fire-and-forget scheduleMilestoneCelebration with no caller error boundary [screens/HomeScreen.js:295] — No try/catch or .catch() in caller
- checkMissedDay exception silently disables freeze feature [screens/HomeScreen.js:171] — Empty catch block hides errors
- loadData races when called multiple times [screens/HomeScreen.js:170] — No abort/mount-guard for concurrent async calls
- addWater callback stale closure over todayMl/dailyGoal [screens/HomeScreen.js:280] — Classic React stale-closure race
- Inconsistent ref creation style (useRef vs React.useRef) [screens/HomeScreen.js:88,91] — waterFillRef uses useRef, streakCardRef uses React.useRef

## Deferred from: code review of story 3.4-goal-reached-moment (2026-07-19)

- Celebration gate may re-fire on navigation remount [HomeScreen.js:380-417] — `goalHitRef` re-initializes to false on each mount; the reset effect's `todayMl === 0` check runs on mount (clearing the gate), then `loadData` restores `todayMl` and the gate fires again. Only affects navigation away/back within the same day — unlikely during a drinking session. Pre-existing mount-guard design limitation not new to this story.

## Deferred from: code review of story 6.1-mascot-idle-animation (2026-07-19)

- Idle bob doesn't pause on tap/expression cycling [Mascot.js:94-104] — AC 1: "no bob when tapped/cycling expressions". The `floatAnim` effect has no mechanism to pause during tap interaction. Pre-existing behavior not addressed by this story scope. Pre-existing design gap.
- Blink cycle setTimeout leak on unmount [Mascot.js:107-125] — Inner `setTimeout` in `setIsBlinking(false)` is not stored/cleaned up on unmount. Pre-existing, not introduced by this diff.
- streakToExpression returns "happier" — external callers unaware [Mascot.js:45-48] — Exported function now returns a new string value. No known external consumers. Contract change with potential for silent mismatches.

## Deferred from: code review of story 6.2-press-feedback-haptics (2026-07-19)

- No animation cleanup on unmount [PressableScale.js:15-33] — Animated.spring `.start()` on pressIn/pressOut with no `.stop()` on unmount. Follows existing project convention (Mascot.js, grandfathered Animated API per AD-11). Pre-existing pattern, not introduced by this story.
- disabled mid-animation edge case [PressableScale.js:18,27] — If `disabled` flips to `true` while a spring animation is mid-flight, the animation continues; on re-enable the next press starts from a stale scale. Speculative — no known trigger in current usage.
- Scope creep (3.4 carryover in working tree) — The uncommitted working tree includes story 3.4 goal-reached animation code alongside 6.2 changes. Pre-existing, not introduced by this story.
