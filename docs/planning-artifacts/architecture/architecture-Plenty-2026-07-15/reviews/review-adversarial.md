# Adversarial Review — Architecture Spine for Plenty

**Reviewer:** Adversarial agent (two concurrent divergent units)
**Reviewed spine:** `ARCHITECTURE-SPINE.md` (2026-07-15, draft)
**Date:** 2026-07-15
**Method:** Two independent developers (Dev A, Dev B) are given the same spine and asked to build new Sprint 8 features. Each obeys every AD literally. Their implementations collide at five distinct fault lines.

---

## The Two Units Under Test

### Unit A — Hydration Insights Dashboard
**Goal:** Show rolling 7-day hydration trends, day-of-week patterns, and comparative charts.
**Adds:**
- `utils/trends.js` — computes daily averages, peak periods, day-of-week stats from `@plenty_logs`
- `components/TrendChart.js` — Reanimated + SVG line chart with color-coded bands (optimal, marginal, dehydrated)
- `@plenty_trends_cache` in AsyncStorage — cached trend computation so the chart doesn't re-aggregate on every render
- `LogScreen.js` extended — adds a collapsible "Trends" section below the existing history
- `@plenty_settings` key `trends.showOnHome` — a boolean toggle

### Unit B — Smart Nudge Engine
**Goal:** Detect lulls in user drinking and adapt notification timing, with escalating encouragement.
**Adds:**
- `utils/adaptive-scheduler.js` — observes log timestamps, computes lull periods, adjusts reminder interval
- `utils/nudge-profile.js` — builds user activity profile (typical wake hour, common lull windows, responsiveness)
- `components/LullBanner.js` — subtle banner when user has been quiet >90 minutes
- `@plenty_settings` keys `nudge.activityProfile` (nested object with wake hour, lull windows), `nudge.mode` (`'gentle'|'normal'|'aggressive'`)
- HomeScreen.js integration — passes a `onLullDetected` callback to the nudge engine that may reschedule reminders

---

## Finding 1 — AD-6: AsyncStorage shape divergence on shared keys (HIGH)

**The AD says:** "All persistent state uses three AsyncStorage keys… `@plenty_settings` — settings object (merged with DEFAULT_SETTINGS on read). Writes use the save*/get* helpers in utils/storage.js."

**The gap:** The spine defines *which* keys exist but not *who owns their shape*. The `DEFAULT_SETTINGS` constant has no canonical home — nothing prevents two files from defining overlapping defaults. The "flat key-value object" convention is a prose note with no enforcement.

**How the units diverge:**

| Aspect | Dev A (Trends) | Dev B (Nudge) |
|---|---|---|
| Settings key added | `trends.showOnHome: boolean` | `nudge.activityProfile: { wakeHour, lullWindows[], responsiveness }` and `nudge.mode: string` |
| Shape convention | Plain boolean — respects "flat" | Nested object — violates "flat" prose rule, but no code enforces flatness. Dev B argues "it's namespaced under 'nudge', it won't collide." |
| DEFAULT_SETTINGS home | Adds `DEFAULT_TRENDS_SETTINGS` inside utils/trends.js, uses it in a custom `getTrendSettings()` that reads from `@plenty_settings` and merges with its own default | Adds `NUDGE_DEFAULTS` inside utils/adaptive-scheduler.js. Reads `@plenty_settings` directly, merges with its own default — bypassing any canonical `DEFAULT_SETTINGS` |
| storage.js helpers | Adds `getTrendsCache()`, `saveTrendsCache()` | Would add `getNudgeProfile()`, `saveNudgeProfile()` |

**Result:** `@plenty_settings` accumulates keys from two sources with no schema registry. Dev A reads settings with `const settings = await getSettings()` then accesses `settings.trends.showOnHome`. Dev B reads the same object but expects `settings.nudge.mode`. If Dev A's merge function doesn't preserve unrecognized keys (e.g., only spreads known defaults), Dev B's nudge settings are silently dropped. The AD provides no mechanism — not even a convention — to prevent this.

**Trigger scenario:** `DEFAULT_SETTINGS` in `utils/storage.js` only knows about `intervalMinutes, dailyGoal, themeMode, weatherUnit, tempScale`. A `getSettings()` call that merges only these keys will strip `trends.*` and `nudge.*` on every write. Each unit ends up doing its own raw `AsyncStorage.getItem` to avoid data loss — violating AD-6's "direct AsyncStorage calls outside storage.js are a code-review catch."

**Recommendation:** Add either (a) a schema registry in storage.js that any module can register defaults with, or (b) a rule that `getSettings()` delegates unknown keys through to a composable resolver. At minimum, mandate that ALL settings key additions go through storage.js, not individual utils.

---

## Finding 2 — AD-3: Parallel color system emerges outside Theme context (HIGH)

**The AD says:** "Every visual component consumes colors from useTheme(). Raw hex values are banned outside constants/colors.js."

**The gap:** "Hex values banned outside colors.js" does not equal "every color choice comes from the theme." Devs can — and will — add semantically meaningful colors to colors.js as named constants that bypass the dark/light theme system. The AD doesn't address *semantic* color tokens that represent data states, not UI chrome.

**How the units diverge:**

Dev A's TrendChart needs data-visualization colors:
```js
// Dev A adds to constants/colors.js
export const TREND_COLORS = {
  optimal: '#27AE60',
  marginal: '#F39C12',
  dehydrated: '#E74C3C',
  chartGrid: '#ECF0F1',
  chartLine: '#3498DB',
};
```
TrendChart uses them directly — passes `useTheme()` check because they're not hex literals, they're named exports from colors.js. But in dark mode, the chart renders a green/red/blue palette designed for a white background against a charcoal surface. Result: invisible grid lines, washed-out markers.

Dev B's LullBanner needs urgency colors:
```js
// Dev B adds to constants/colors.js
export const NUDGE_COLORS = {
  gentle: '#F39C12',
  normal: '#E67E22',
  urgent: '#C0392B',
  info: '#2980B9',
};
```
LullBanner also passes the hex-ban check. But its "gentle" yellow was picked for light backgrounds; on a dark theme it's unreadable.

**Result:** Two parallel color systems, neither touched by `ThemeContext`. Dark mode is broken for both features. Neither developer violated a single written rule — they obeyed the literal text ("no raw hex outside colors.js") while subverting the intent ("all visual elements should respond to theme").

**Trigger scenario:** A third developer, merging both features, sees `TREND_COLORS` and `NUDGE_COLORS` in colors.js and adds `HOME_SCREEN_ACCENTS`. Now there are three rogue palettes. Attempting to move them into the theme later requires touching every consumer — a refactor nobody will prioritize.

**Recommendation:** Strengthen AD-3 to require that ANY color value — including data-visualization and semantic colors — be defined as theme tokens in both light and dark palettes. Add a section to colors.js that maps semantic names to theme tokens. Or accept that the spine needs a "semantic colors" pattern and define one before Sprint 8.

---

## Finding 3 — AD-4/AD-5: Notification ownership erosion via function proliferation (HIGH)

**The AD says:** "Only HomeScreen can trigger scheduleWaterReminder() or cancelAllReminders(). Notification scheduling logic lives entirely in utils/notifications.js — screens never call expo-notifications APIs directly."

**The gap:** The AD names exactly two functions as restricted. It does not restrict:
- New notification-related functions added to utils/notifications.js
- Non-repeating notifications (e.g., "your weekly trend is ready")
- Internal rescheduling that adapts the existing single-trigger's timing

**How the units diverge:**

Dev B's Smart Nudge Engine needs to adjust reminder timing when it detects the user is in a lull or approaching their daily goal. Dev B cannot call `scheduleWaterReminder()` from adaptive-scheduler.js (that would violate AD-4). So Dev B adds to `utils/notifications.js`:

```js
// Dev B adds to notifications.js — a new public export
export function adaptReminderInterval(newIntervalMinutes) {
  // Cancel existing and re-schedule at new interval
  // NOT scheduleWaterReminder — a new function that does the same thing
}
```

Dev B then calls `adaptReminderInterval()` from adaptive-scheduler.js. The function isn't `scheduleWaterReminder`. It isn't `cancelAllReminders`. The AD doesn't name it. Dev B passes code review because the AD only gates those two specific names.

Meanwhile, Dev A's Hydration Insights wants a once-a-week notification: "Your hydration trends are ready." Dev A adds to notifications.js:

```js
// Dev A adds to notifications.js
export function scheduleWeeklyTrendDigest() { ... }
```

Called from HomeScreen (technically satisfying AD-4). But now notifications.js has three scheduling entry points, each bypassing the "one repeating trigger" rule of AD-5. The dedupe guard (cancel before schedule) in `scheduleWaterReminder` doesn't know about `adaptReminderInterval`'s scheduling or `scheduleWeeklyTrendDigest`'s scheduling. Result: racing notifications, duplicate alerts, undismissable reminders.

**Trigger scenario:** The user has a baseline reminder at 60min, an adaptive lull reschedule at 30min, and a weekly digest notification. All three fire independently because AD-5's dedupe guard only protects `scheduleWaterReminder`, not the two new scheduling functions. The "single repeating trigger" invariant is broken without a single AD being violated.

**Recommendation:** Replace the narrow name-based restriction ("only scheduleWaterReminder / cancelAllReminders") with a broader invariant: "All notification scheduling must go through a single orchestration function in notifications.js that owns the entire schedule." Define the orchestration interface. Add an AD-5 companion requiring that any new notification function in notifications.js be reviewed for interaction with existing schedules.

---

## Finding 4 — screens/ vs components/ boundary: no behavioral contract (MEDIUM)

**The AD says:** "screens import components, components import utils. Named exports for utils and components. Default export for screens."

**The gap:** The spine defines *directory and naming conventions* but not *behavioral contracts*. Nothing prevents a component from:
- Having side effects (notifications, storage writes)
- Importing storage.js directly and fetching its own data
- Managing its own state in ways that conflict with its parent screen

**How the units diverge:**

Dev A builds TrendChart as a "smart component":
```js
// components/TrendChart.js — Dev A's approach
import { getLogs } from '../utils/storage.js';
import { computeDailyAverages } from '../utils/trends.js';

export function TrendChart({ days = 7 }) {
  const [data, setData] = useState([]);
  useEffect(() => {
    getLogs().then(logs => setData(computeDailyAverages(logs, days)));
  }, [days]);
  // ...render chart
}
```

LogScreen.js imports TrendChart and renders it. But LogScreen ALSO calls `getLogs()` to display the history list. Now `getLogs()` fires twice — once for LogScreen's list, once for TrendChart's computation. No deduplication. No shared cache state. Performance impact on a mobile device.

Dev B builds LullBanner with side effects:
```js
// components/LullBanner.js — Dev B's approach
import { scheduleWaterReminder } from '../utils/notifications.js';

export function LullBanner({ onLullEnd }) {
  useEffect(() => {
    // Reset reminder interval when lull ends
    scheduleWaterReminder(60);
  }, []);
  // ...render banner
}
```

LullBanner calls `scheduleWaterReminder` directly. Dev B argues: "AD-4 says only HomeScreen can trigger scheduleWaterReminder, but our component is used BY HomeScreen — it's part of HomeScreen's rendering tree, so the intent holds." Code review passes. But now the notification trigger is buried in a component that could be imported by ANY screen, and the assumption of "only HomeScreen calls it" is technically false — LullBanner calls it.

**Trigger scenario:** A future developer sees LullBanner's pattern and adds another component with side effects. Eventually, three components across two screens can all schedule notifications. The original AD-4 invariant ("one screen owns scheduling") is fully dissolved, but no single change violated a written rule.

**Recommendation:** Add a behavioral contract to the conventions table: "Components are presentational or compositive. They may read data via props or context only — never via direct util/import side effects. Screens are the sole layer that wires data fetching to components." Or, if smart components are intentional, explicitly carve out permitted exceptions (e.g., "ErrorBoundary and Toast may have side effects; all others must remain pure").

---

## Finding 5 — AD-10: No landing zone for new screen-scale features (MEDIUM)

**The AD says:** "@react-navigation/bottom-tabs with exactly 4 entries: Home, Log, Achievements, Settings."

**The gap:** "Exactly 4 entries" is a hard constraint, but Sprint 6 already softens it (Onboarding routed conditionally before tabs). The spine provides no migration path for a 5th screen-scale feature. If both Units A and B produce something too large for a component or a section within an existing screen, where does it go?

**How the units diverge:**

Dev A's Trends Dashboard is substantial — multi-tab charts, date range picker, export of trend data. Squeezing it into LogScreen makes LogScreen a monster (600+ lines, two distinct responsibilities). Dev A is stuck: no 5th tab allowed, no nested navigator allowed. Options:
1. Make it a modal — violates AD-10's "modals are achievement popup/amount picker" intent (a full dashboard isn't a lightweight overlay)
2. Put it in LogScreen as a deeply nested sub-section — stretches the screen definition
3. Hide it behind a "see trends" button that swaps LogScreen content entirely — no navigation API needed, but it's clearly a screen acting as a screen

Dev B's Nudge Engine is configuration-heavy — threshold sliders, quiet hours picker, activity profile viewer. Squeezing it into SettingsScreen makes SettingsScreen a zoo. Same dead end.

**Result:** Both features end up in suboptimal homes. Dev A chooses option 3 (state-based view swapping in LogScreen) and Dev B chooses a modal-based nudge config. The result is inconsistent UX — some "screens" are screen-level views, some are modals, some are inline sections. The "exactly 4" rule is followed to the letter but the user experience degrades.

**Recommendation:** Either (a) explicitly permit a 5th tab with a rule about when it's warranted, (b) define a component-level pattern for "tab-content-with-depth" that lets a screen manage sub-views without being a navigation destination, or (c) add a "sub-screen" convention (e.g., `screens/sub/` or screens with internal routing state). The current vacuum forces inconsistent workarounds.

---

## Finding 6 — Deferred Zustand store: ungoverned state migration vector (MEDIUM)

**The deferred section says:** "If a feature ever needs to share cross-screen state beyond what's already there (e.g., a live widget counter that updates from Log and Home), add a lightweight Zustand store rather than migrating to Redux or adding context for it."

**The gap:** This is a one-sentence permission slip with zero governance. It doesn't specify:
- How a Zustand store relates to AsyncStorage (cache? write-through? authoritative source?)
- Whether there should be one store or many
- Whether stores can call utils or only hold state
- How stores interact (can store A read store B?)
- Whether stores replace the "screens wire data" pattern or supplement it

**How the units diverge:**

Dev A adds Zustand for trend cache:
```js
// Dev A's useTrendStore
const useTrendStore = create((set) => ({
  dailyAverages: [],
  weekOverWeek: null,
  lastComputed: 0,
  computeTrends: async () => {
    const logs = await getLogs();  // store calls utils directly
    const trends = computeAverages(logs);
    set({ dailyAverages: trends, lastComputed: Date.now() });
    await saveTrendsCache(trends);  // store writes to AsyncStorage
  },
}));
```

Dev B adds Zustand for nudge state:
```js
// Dev B's useNudgeStore
const useNudgeStore = create((set) => ({
  currentLull: null,
  nudgeLevel: 0,
  detectLull: () => {
    const profile = getNudgeProfile();  // direct util call
    // ...computation in store
  },
}));
```

Both stores mix state, logic, AsyncStorage I/O, and util imports in different proportions. Neither pattern is "wrong" — the spine gave no pattern to follow. A component importing both stores now has two different conventions for how state is read, written, and persisted. If both try to read/write `@plenty_settings` independently, they hit Finding 1's divergence all over again — but now through store middleware instead of direct storage calls.

**Recommendation:** If Zustand is deferred, defer it completely — remove the one-sentence permission slip. If it's a real option, define a minimal pattern: "Zustand stores (in `stores/`) are derived state caches. AsyncStorage remains the single source of truth. Stores may not write to AsyncStorage — only utils may persist. Stores read from utils on init and are invalidated by screen-level orchestrators." Otherwise, remove the mention entirely to prevent premature adoption.

---

## Finding 7 — Utils module interdependency with no ordering guarantees (LOW-MEDIUM)

**The ADs do not address:** The dependency graph among utils modules themselves. The spine shows `utils --> AsyncStorage` and `screens --> utils`, but utils modules can (and will) import each other.

**How the units diverge:**

Dev A's `utils/trends.js` imports `utils/storage.js` and `utils/reports.js` (to reuse monthly aggregation logic).

Dev B's `utils/adaptive-scheduler.js` imports `utils/notifications.js`, `utils/patterns.js` (to reuse lull detection from the existing patterns module), and `utils/weather.js` (to factor heat into nudge timing).

Now `utils/notifications.js` is imported by both `screens/HomeScreen.js` and `utils/adaptive-scheduler.js`. The spine doesn't say whether `utils/` modules can import each other, nor does it define a loading/initialization order. If notifications.js has side effects at module scope (e.g., setting up a notification handler), importing it from a utils module vs a screen could produce different behavior depending on import order.

**Trigger scenario:** `patterns.js` (originally consumed only by `reports.js`) is now imported by adaptive-scheduler.js. Sprint 9 refactors `patterns.js` to have a breaking dependency on `storage.js` initialization order. The refactor passes all existing tests (which only tested patterns.js through reports.js) but breaks adaptive-scheduler.js because import order differs. No rule was violated — the spine simply didn't anticipate cross-util dependencies.

**Recommendation:** Add a convention: "Utils modules are consumers, not providers, of other utils — they may import storage.js, constants, and context only. Cross-util imports between domain utils (notifications.js importing patterns.js) must be reviewed for dependency cycles and load-order sensitivity. A utils module must not produce side effects at module scope."

---

## Summary Matrix

| # | Finding | AD(s) | Severity | Root cause |
|---|---|---|---|---|
| 1 | AsyncStorage shape drift on shared keys | AD-6 | HIGH | No schema registry or key ownership model |
| 2 | Parallel color system outside theme | AD-3 | HIGH | "Hex ban" doesn't equal "all colors come from theme" |
| 3 | Notification ownership erosion via new functions | AD-4, AD-5 | HIGH | Name-based restriction too narrow; broader invariants unstated |
| 4 | No behavioral contract for components vs screens | (conventions) | MEDIUM | Directory structure defined; responsibility boundary undefined |
| 5 | No landing zone for screen-scale features beyond 4 tabs | AD-10 | MEDIUM | Hard count with no migration path or sub-screen pattern |
| 6 | Zustand store pattern ungoverned in deferred section | (Deferred) | MEDIUM | Permission slip without shape; invites premature adoption |
| 7 | Cross-util dependencies with no ordering guarantees | (none) | LOW-MEDIUM | Dependency graph only covers top-level; internal utils graph ignored |

---

## Verdict

**Conditional pass.** The spine is sound for today's surface area and Sprint 6's additions. But it will begin producing diverging implementations starting in Sprint 7-8 unless:

1. **AD-6 gains a schema registry** — The "three keys" model needs a mechanism that prevents silent shape drift on `@plenty_settings` as new features add settings keys. Without this, two developers adding settings in the same release will silently overwrite each other or produce partial-reads that drop data.

2. **AD-3 is tightened to cover semantic colors** — The "no raw hex" rule is necessary but insufficient. The spine needs to either mandate that ALL color values be theme tokens (with light/dark variants) or explicitly define a "semantic palette" within the theme that Sprint 7-8 features can extend.

3. **AD-4/AD-5 adopt invariant-level guards instead of name-level restrictions** — The narrow naming of two restricted functions invites arbitrary expansion via new function names. Replace with a broader invariant: "notifications.js owns the complete notification schedule; any new scheduling path requires review for deduplication with existing triggers."

4. **The screens/components boundary gets a behavioral rule** — Components need a documented responsibility boundary (presentational vs stateful vs side-effect-bearing) so that Dev A and Dev B don't make opposite choices.

5. **The Zustand deferred item is either removed or given a pattern** — The one-sentence permission slip is worse than silence: it opens a door without defining the room behind it.
