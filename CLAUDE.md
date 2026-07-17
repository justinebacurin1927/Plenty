@AGENTS.md

# Plenty 💧 — Water Reminder App

Canonical project context in `docs/project-context.md`. Keep that in sync — BMAD skills reference it.

## BMad Method Installed

This project has the full BMad Method lifecycle: `_bmad/` with config, scripts, and per-skill override files in `_bmad/custom/`.

**Config:**
- `_bmad/config.toml` — installer-owned base
- `_bmad/custom/config.toml` — team overrides (committed)
- `_bmad/custom/config.user.toml` — personal overrides (gitignored)

**Artifact paths:**
- Planning: `docs/planning-artifacts/` (PRDs, UX, architecture, epics, brainstorms)
- Implementation: `docs/implementation-artifacts/` (sprints, stories, retrospectives)
- Knowledge: `docs/` (project-context.md, docs/)

## Development
- Test via Expo Go: `npx expo start`
- All local, no backend
- Latest SDK: Expo 55 / RN 0.83.6
