# Sprint 2 — Development Build & Notifications

> **Goal:** Ship a development build APK that enables real notification reminders (sound, vibration, repeat).
> **Target:** ETA 1–2 sessions

---

## Why Sprint 2 Exists

Sprint 1 delivered a working React Native app in Expo Go. The app logs drinks, shows history, and has settings — but **notifications are dead** because Expo Go on Android SDK 53+ dropped push notification support. The `expo-notifications` module can't initialize at all in that environment.

Sprint 2 moves the app out of Expo Go into a **development build**, where native modules run for real.

---

## Epics

### Epic A — Development Build (Prerequisite)

Everything else depends on this.

| Task | Detail |
|---|---|
| **A1. Install EAS CLI** | `npm install -g eas-cli` |
| **A2. Log in to Expo account** | `eas login` (user needs an Expo account — free) |
| **A3. Configure `eas.json`** | Create a build profile for Android development builds |
| **A4. Build dev APK** | `eas build --platform android --profile development` |
| **A5. Install on phone** | Download APK from Expo dashboard, sideload or scan QR |
| **A6. Verify dev build works** | `npx expo start --dev-client` — app loads, no Expo Go red screen |

**Acceptance criteria:**
- App opens from a locally installed APK (not Expo Go)
- `expo-notifications` initializes without errors

---

### Epic B — Notifications (Real)

Once the dev build is running, the current lazy-load code activates the real notification module.

| Task | Detail |
|---|---|
| **B1. Clean up lazy-load stubs** | Remove `isExpoGo` guards — they're dead code in dev builds |
| **B2. Test notification scheduling** | Start reminders → phone vibrates / plays sound at interval |
| **B3. Test quiet hours** | Schedule during quiet hours → no notification fires |
| **B4. Test tap-to-open** | Tapping a notification opens the app (optional — nice to have) |

**Acceptance criteria:**
- Notifications fire at the selected interval with sound + vibration
- "Start Reminders" toggle works
- Quiet hours suppress notifications correctly

---

### Epic C — Data Persistence (Optional — if AsyncStorage behaves differently in dev build)

| Task | Detail |
|---|---|
| **C1. Verify logs survive app restart** | Log a drink → kill app → reopen → Log tab still shows it |
| **C2. Verify settings survive restart** | Change interval/quiet hours → kill app → reopen → settings retained |

---

### Epic D — Polish (If time permits)

| Task | Detail |
|---|---|
| **D1. Empty-state illustrations** | Water drop graphic for Log screen when no drinks logged |
| **D2. Progress to daily goal** | Show e.g. "2 / 8 glasses" with a progress bar |
| **D3. Custom drink amounts** | Long-press "I drank water" → pick 100ml / 250ml / 500ml |
| **D4. Weekly stats on Log screen** | Bar chart or summary for the past 7 days |

---

## Not Doing (Future Sprints)

- Backend / cloud sync
- Push notifications from a server
- Multi-user or accounts
- iOS (unless you have a Mac)

---

## Risk Register

| Risk | Mitigation |
|---|---|
| EAS Build requires credit card even for free tier | Free tier exists — no card needed for development builds |
| APK sideloading blocked by phone settings | Enable "Install from unknown sources" in Android settings |
| `expo-notifications` behaves differently on real device vs. Expo Go | That's the point — we test on a real device build |

---

## Definition of Done

- Dev build APK installs and runs
- No red-screen errors at startup
- Notifications fire with sound and vibration at the chosen interval
- Drink logging and settings survive app restart
- Quiet hours work
- Dev Logs tab shows clean startup (no unexpected errors)
