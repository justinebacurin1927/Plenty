---
baseline_commit: NO_VCS
---

# Story 9.1: Font Migration (Bitrank + Creamy Chicken Zips)

**Status:** done

## Story

As a user, I want the app to use the new custom fonts — Bitrank for big titles and Creamy Chicken Zips for headers — so the app feels more unique and friendly.

## Acceptance Criteria

1. `Bitrank.otf` loaded at boot from `assets/fonts/Bitrank/Bitrank.otf`
2. `Creamy_Chicken.otf` loaded at boot from `assets/fonts/Creamy_Chicken/Creamy_Chicken.otf`
3. `constants/typography.js` updated:
   - `display`, `title` → use `"Bitrank"` (single-weight, uses fontWeight of the OTF)
   - `heading` → use `"Creamy_Chicken"` (single-weight)
   - `body`, `label`, `caption`, `small` → remain Poppins (unchanged)
4. `App.js` font loading updated:
   - Remove `@expo-google-fonts/fredoka` and `@expo-google-fonts/poppins` imports
   - Load local OTF fonts via `useFonts` using `require()` paths
5. App boots cleanly with no font errors — all screens render with new fonts

## Tasks / Subtasks

**Phase 1 — Verify fonts are extracted**

- [x] Extract `bitrank.zip` → `assets/fonts/Bitrank/Bitrank.otf`
- [x] Extract `creamy_chicken.zip` → `assets/fonts/Creamy_Chicken/Creamy_Chicken.otf`

**Phase 2 — Update App.js**

- [ ] Remove Fredoka + Poppins google-font imports
- [ ] Replace with local `require()` for both OTF files
- [ ] Assign fontFamily keys: `"Bitrank"`, `"Creamy_Chicken"`, and keep Poppins google-fonts for body/label/caption/small

**Phase 3 — Update typography.js**

- [ ] `display` → `fontFamily: "Bitrank"`
- [ ] `title` → `fontFamily: "Bitrank"`
- [ ] `heading` → `fontFamily: "Creamy_Chicken"`
- [ ] Leave `body`, `label`, `caption`, `small` as Poppins

**Phase 4 — Verify**

- [ ] `npm test` passes
- [ ] App boots via `npx expo start` — no font loading errors
- [ ] All screens render with new fonts applied to titles/headings
