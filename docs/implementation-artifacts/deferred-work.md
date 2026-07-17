# Deferred Work

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
