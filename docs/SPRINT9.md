# Sprint 9 — iOS Parity

> **Goal:** Bring the Android-first app to iOS with true feature parity and an
> App Store presence — notifications, a home-screen widget, platform polish,
> and TestFlight → App Store distribution.
> **Status:** Planned (depends on Sprint 6 shipping Android + a green test suite;
> scheduled after the Sprint 7 design revision so the design system ports once)

---

## Why This Sprint

The app is built with Expo/React Native, so the JS runs on iOS already — but the
*native* surfaces are Android-only: the widget is Kotlin (`modules/plenty-widget`),
notifications are tuned around Android channels/escalation, and feedback uses
`Vibration`. iOS has no notification channels (it uses interruption levels), needs
a WidgetKit widget in Swift, and expects haptics over raw vibration. By this point
the design system (Sprint 7) and adaptive engine (Sprint 8) are settled, so this
sprint is a clean platform port rather than a moving target.

**Gate:** requires an Apple Developer Program account ($99/yr) and a Mac or
EAS cloud build for the iOS binary.

---

## Epic A — iOS Notifications

| # | Task | Detail | Status |
|---|------|--------|--------|
| A1 | Permission + foreground handler | Verify `expo-notifications` request flow and the foreground handler behave on iOS | ⬜ Planned |
| A2 | Categories / action buttons | Confirm "I drank!" / "Snooze 15m" actions render and fire on iOS | ⬜ Planned |
| A3 | Channels → interruption levels | Map the Android escalation channel concept to iOS interruption levels / sounds | ⬜ Planned |
| A4 | Repeating trigger behavior | Validate `timeInterval` repeats + the dedupe serialization on iOS | ⬜ Planned |
| A5 | Quiet hours + badge | Quiet-hours math and badge/sound behavior verified on device | ⬜ Planned |

---

## Epic B — iOS Home-Screen Widget (WidgetKit)

Parity with the Android widget: progress (ml), glasses, streak, progress bar.

| # | Task | Detail | Status |
|---|------|--------|--------|
| B1 | WidgetKit extension scaffold | Swift widget target via an Expo config plugin (mirrors `withPlentyWidget`) | ⬜ Planned |
| B2 | Shared storage bridge | App Group + UserDefaults bridge so JS can push data (parallels `utils/widget.js`) | ⬜ Planned |
| B3 | Timeline provider | Render current ml / goal / streak; refresh on log | ⬜ Planned |
| B4 | Widget sizes + theming | Small/medium layouts, light/dark | ⬜ Planned |

---

## Epic C — Platform UI Polish

| # | Task | Detail | Status |
|---|------|--------|--------|
| C1 | Haptics | Use `expo-haptics` on iOS where Android uses `Vibration` (via `Platform.select`) | ⬜ Planned |
| C2 | Safe areas + status bar | Verify notch/Dynamic Island insets and status-bar style across screens | ⬜ Planned |
| C3 | Dynamic Type + contrast | Respect iOS text sizing; dark-mode contrast check | ⬜ Planned |
| C4 | Share sheet | Confirm `expo-sharing` streak/share-card flow feels native on iOS | ⬜ Planned |

---

## Epic D — App Store Readiness

| # | Task | Detail | Status |
|---|------|--------|--------|
| D1 | Apple account + bundle id | Enroll in Apple Developer Program; register `com.justine7417.plenty` | ⬜ Planned |
| D2 | App Store Connect listing | Name, subtitle, description, keywords, category | ⬜ Planned |
| D3 | Screenshots | 6.7" / 6.5" (and any required) device sizes | ⬜ Planned |
| D4 | Privacy nutrition labels | Location for weather, no data collected/shared | ⬜ Planned |
| D5 | TestFlight → submit | `eas build -p ios` → TestFlight → App Store review submission | ⬜ Planned |

---

## Epic E — Cross-Platform QA

| # | Task | Detail | Status |
|---|------|--------|--------|
| E1 | `Platform.select` audit | Find Android-only assumptions and branch correctly | ⬜ Planned |
| E2 | Test matrix | Core flows verified on iOS + Android (physical devices) | ⬜ Planned |
| E3 | `expo-doctor` + config | Config/plugin health for both platforms | ⬜ Planned |

---

## Success Criteria

- Every feature that works on Android works on iOS (reminders, actions, widget, sharing, dark mode).
- iOS home-screen widget shows live progress and refreshes on log.
- Haptics/feedback feel native per platform.
- The Sprint 7 design system renders correctly on iOS with no visual regressions.
- Build is live on TestFlight and submitted to App Store review.

## Out of Scope

- New features — this is a platform port.
- iPad-optimized layouts beyond `supportsTablet`.
- Apple Health integration (Health Connect was intentionally removed; no health sync planned).
