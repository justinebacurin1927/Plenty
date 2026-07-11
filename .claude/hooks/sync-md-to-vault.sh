#!/bin/bash
# Sync .md files from Plenty project to Obsidian vault
# Runs automatically after tool use via Claude Code hook

PROJECT="/home/jaycee/Projects/Plenty"
VAULT="/home/jaycee/Documents/Obsidian Vault/Plenty"

# Name mapping: project filename → vault filename
declare -A MAP
MAP["SPRINT3.md"]="Sprint 3 - Gamification.md"
MAP["SPRINT4.md"]="Sprint 4 - Insights.md"
MAP["SPRINT5.md"]="Sprint 5 - Polish.md"
MAP["SPRINT3_EPIC_A_DEEP_DIVE.md"]="Sprint 3 - Epic A Deep Dive.md"

for md in "$PROJECT"/*.md; do
  f=$(basename "$md")
  [ -f "$md" ] || continue
  target="${MAP[$f]:-$f}"
  cp -u "$md" "$VAULT/$target"
done
