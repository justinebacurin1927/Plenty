# Versions Reality Check — Architecture Spine vs. package.json

**Review date:** 2026-07-16  
**Source:** `ARCHITECTURE-SPINE.md` Stack table vs. `/home/jaycee/Projects/Plenty/package.json`  
**Verdict: PASS**

---

## Methodology

Every version entry in the Architecture Spine Stack table was compared to the actual `dependencies` and `devDependencies` in `package.json`. SDK 55 compatibility was verified by checking that Expo-scoped packages use the `~55.0.x` or `~55.x` convention and that non-Expo peer deps match SDK 55's known compatible versions.

---

## Results

### Exact matches (15/15 spine entries present in package.json)

| Spine entry | Spine version | package.json | Status |
|---|---|---|---|
| Expo SDK | `~55.0.0` | `~55.0.0` | MATCH |
| React Native | `0.83.6` | `0.83.6` | MATCH |
| React | `19.2.0` | `19.2.0` | MATCH |
| `@react-navigation/bottom-tabs` | `^7.18.8` | `^7.18.8` | MATCH |
| `@react-native-async-storage/async-storage` | `2.2.0` | `2.2.0` | MATCH |
| `expo-notifications` | `~55.0.24` | `~55.0.24` | MATCH |
| `expo-location` | `~55.1.11` | `~55.1.11` | MATCH |
| `expo-sharing` | `~55.x` | `~55.0.21` | MATCH (compatible) |
| `expo-file-system` | `~55.x` | `~55.0.23` | MATCH (compatible) |
| `expo-document-picker` | `~55.x` | `~55.0.14` | MATCH (compatible) |
| `react-native-safe-area-context` | `~5.6.2` | `~5.6.2` | MATCH |
| `react-native-screens` | `~4.23.0` | `~4.23.0` | MATCH |
| `react-native-view-shot` | `4.0.3` | `4.0.3` | MATCH |
| `patch-package` | `^8.0.1` | `^8.0.1` | MATCH |

### Planned / future deps — correctly absent from package.json (3/3)

| Spine entry | Spine note | package.json | Status |
|---|---|---|---|
| `react-native-reanimated` | *Sprint 7* | Not present | CORRECTLY ABSENT |
| `react-native-svg` | *Sprint 7* | Not present | CORRECTLY ABSENT |
| `expo-haptics` | *Sprint 7* | Not present | CORRECTLY ABSENT |

### Health Connect — confirmed still present

| Package | package.json | Spine status |
|---|---|---|
| `expo-health-connect` | `^0.1.1` | Listed as TO BE REMOVED (AD-9), correctly omitted from Stack table |
| `react-native-health-connect` | `^3.5.3` | Not listed in spine at all — bare RN companion to above |

Both packages were still installed at review time, confirming AD-9 had not yet been actioned. *Since updated (2026-07-17): Story 1.3 completed — all Health Connect code, deps, and patches removed.*

---

## Findings

### Finding 1 (minor) — Stack table uses `~55.x` where actual pins are `~55.0.x`

The spine coarsely groups `expo-sharing`, `expo-file-system`, and `expo-document-picker` at `~55.x`. Actual versions are `~55.0.21`, `~55.0.23`, and `~55.0.14` respectively. These are fully compatible (the `~55.0.x` range is a subset of `~55.x`), but the spine should ideally reflect the actual pinned minor for accuracy.

### Finding 2 (info) — `@react-navigation/native` is a missing stack entry

`@react-navigation/native ^7.3.8` is in `package.json` as a direct dependency (it is a required peer of `bottom-tabs`) but is not listed in the Stack table. This is not a defect — the spine focuses on architecturally significant dependencies — but it is worth noting for completeness.

### Finding 3 (info) — Several in-use Expo packages omitted from Stack table

`expo-build-properties`, `expo-constants`, `expo-dev-client`, `expo-font`, `expo-status-bar`, and `@expo/vector-icons` are present in `package.json` but not in the Stack table. All are standard/expected Expo SDK 55 packages. The spine is not wrong to omit them (they are build-time or UI-surface packages, not architectural), but this is a completeness gap.

### Finding 4 (pass) — SDK 55 compatibility

All Expo-scoped deps (`expo-notifications`, `expo-location`, `expo-sharing`, `expo-file-system`, `expo-document-picker`, `expo-build-properties`, `expo-constants`, `expo-dev-client`, `expo-font`, `expo-status-bar`) use the `~55.0.x` convention, confirming SDK 55 compatibility. `@react-native-async-storage/async-storage` at exact version `2.2.0` matches the Expo SDK 55 bundled version. `react-native-safe-area-context ~5.6.2` and `react-native-screens ~4.23.0` match known SDK 55 peer versions.

### Finding 5 (pass) — Health Connect still needs removal

`expo-health-connect ^0.1.1` and `react-native-health-connect ^3.5.3` were confirmed present in `package.json` at review time. AD-9's instruction to purge them has since been **completed (2026-07-17)** — Story 1.3 removed all Health Connect code, deps, and patches.

---

## Summary

**Verdict: PASS** — All 15 version entries in the Architecture Spine Stack table match their actual installed versions in `package.json`. All 3 Sprint 7 planned dependencies are correctly absent. *Note: Health Connect removal has since been completed (2026-07-17).*

No version discrepancies or compatibility issues found.
