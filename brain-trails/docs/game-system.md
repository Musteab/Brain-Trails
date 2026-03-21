# Game System

The core loop of Brain Trails turns studying into a cohesive RPG experience.

## XP & Leveling

- **Gaining XP**: Everything grants XP. Completing a focus session (+50 XP), reviewing a flashcard (+10 XP), completing a quest (+100 XP).
- **Level Formula**: Levels are fixed intervals. Every 1,000 XP = 1 Level.
- **Why?**: A linear formula (`Math.floor(xp / 1000) + 1`) makes the math trivial for the UI and DB to calculate independently, and players never feel "stuck" in a huge level grind.

## Gold Economy

- **Earning**: Gold is earned alongside XP but at a lower rate (usually 1/5th to 1/10th the rate).
- **Sinks**: Gold is spent in the Shop (`/shop`) to buy cosmetics like Avatar Frames, Background Themes, and Titles.

## Streaks

- Streaks increment when a user completes a meaningful action (like a focus session) on a new day.
- A missed day resets the streak to 0.

## Quests

- Quests are daily, weekly, or monthly objectives.
- Tracked in `daily_quests` table. When `current_value >= target_value`, they mark as `is_completed: true` and award the player their XP/Gold bounty.

## Activity Feed (Adventure Log)

- The `adventure_log` table acts as the unified feed. Any time the player gains XP or completes an action, an entry is added here. This drives the dashboard's "Adventure Feed" and GitHub-style heatmaps.
