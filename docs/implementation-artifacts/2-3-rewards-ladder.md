# Story 2.3: Rewards Ladder + Streak UI

---
baseline_commit: NO_VCS
---

Status: done

## Story

As a user,
I want to see my streak milestones and unlock rewards,
so I have something concrete to work toward beyond the number itself.

## Acceptance Criteria

1. Achievements screen gains a "Streak" section showing 6 milestone tiers:
   - 7 days → Badge: "Dedicated Droplet"
   - 30 days → Unlock custom water color theme
   - 60 days → Mascot outfit unlock
   - 100 days → Gold water wave animation
   - 365 days → "Century Club" permanent flame icon
2. Each unreached milestone shows as locked with "X days to go"
3. Reward is applied immediately when streak crosses threshold
4. 365-day "Century Club" reward is permanent even if streak breaks
5. A "Rewards Vault" view shows upcoming milestones and what you'd unlock at each
6. Rewards state is persisted (milestones reached stored in streaks data)

## Tasks / Subtasks

- [x] Create `constants/rewards.js` — milestone definitions with tier, name, emoji, description
- [x] Add milestone checking to `rebuildStreakCache()` — compare longest streak vs thresholds
- [x] Add `checkMilestones()` helper that returns newly-unlocked milestones
- [x] Add "Streak Rewards" section to AchievementsScreen above existing achievements
- [x] Show locked milestones with "X days to go" countdown
- [x] Add unlock animation (scale-in + color change) for newly-reached milestones
- [x] Run `npm test` — 89 tests passing, no regressions

## Dev Notes

### Approach

- Rewards are simple data in `constants/rewards.js` — no new storage key
- Milestones are tracked via `milestonesReached` array in the streak cache
- `rebuildStreakCache` checks `longest >= threshold` for each milestone and updates the array
- AchievementsScreen loads streak data alongside achievement data
- Layout: Streak Rewards section at top (horizontal scroll of milestone cards), then existing achievements grid below

### Key Files

| File | Action |
|------|--------|
| `constants/rewards.js` | New — milestone definitions |
| `utils/storage.js` | Edit — milestone checking in rebuildStreakCache |
| `screens/AchievementsScreen.js` | Edit — add streak rewards section |

### References

- [Source: docs/planning-artifacts/epics-v2.md#23--rewards-ladder--streak-ui]
