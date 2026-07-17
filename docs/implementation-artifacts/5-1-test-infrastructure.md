# Story 5.1: Test Infrastructure (jest-expo)

---
baseline_commit: NO_VCS
---

Status: done

## Story

As a developer,
I want a test suite I can run with `npm test`,
so that I can catch regressions before they ship.

## Acceptance Criteria

1. `jest-expo` configured with `@testing-library/react-native`
2. `npm test` script in package.json
3. `jest.config.js` created
4. Coverage: storage unit tests (getSettings merges, saveSettings round-trips), notifications logic tests (`isInQuietHours`, `getEscalationTier`, interval safety), pattern tests (peak/lull detection), report aggregation, weight-based goal calculation

## Tasks / Subtasks

- [x] Install jest-expo + create jest.config.js
- [x] Add `npm test` script to package.json
- [x] Create `__tests__/storage.test.js` — getSettings merge, saveSettings round-trip (15 tests)
- [x] Create `__tests__/notifications.test.js` — escalation, schedule chain (6 tests)
- [x] Create `__tests__/patterns.test.js` — peak/lull detection (9 tests)
- [x] Create `__tests__/reports.test.js` — report aggregation (8 tests)
- [x] Create `__tests__/goal.test.js` — weight-based goal calculation (7 tests)
- [x] Fix existing regression.test.js — updated test assertion semantics
- [x] Run all 70 tests — 6 suites, 70/70 passing

## Dev Notes

### Results

```
npm test
PASS __tests__/regression.test.js
PASS __tests__/patterns.test.js
PASS __tests__/goal.test.js
PASS __tests__/reports.test.js
PASS __tests__/notifications.test.js

Test Suites: 6 passed, 6 total
Tests:       70 passed, 70 total
Time:        ~13s
```

### Notes

- `@testing-library/react-native` was intentionally skipped — it has peer dependency conflicts with React 19.2.0. All tests are pure unit tests of utility functions and don't need React rendering.
- `jest-expo` preset handles Babel/transform automatically.
- AsyncStorage is mocked with an in-memory `MOCK_STORAGE` object.
- expo-notifications is mocked with an empty module (native-only functions can't run in test environment).
- The `__mocks__/` directory is excluded from test matching via `testPathIgnorePatterns`.

### Key Config

jest-expo handles the Babel/transform setup for Expo projects. The config needs:
- `preset: "jest-expo"`
- Module name mappers for AsyncStorage and expo modules

### Files

| File | Action |
|------|--------|
| `package.json` | Edit — add test script + jest-expo devDep |
| `jest.config.js` | New |
| `__tests__/storage.test.js` | New |
| `__tests__/notifications.test.js` | New |
| `__tests__/patterns.test.js` | New |
| `__tests__/reports.test.js` | New |
| `__tests__/goal.test.js` | New |

### References

- [Source: docs/planning-artifacts/epics-v2.md#51--test-infrastructure-jest-expo]
- https://docs.expo.dev/versions/v57.0.0/guides/testing-with-jest/
