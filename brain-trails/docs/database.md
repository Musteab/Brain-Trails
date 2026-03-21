# Database Schema

Brain Trails uses PostgreSQL hosted on Supabase. Below are the key tables and their relationships.

## Core Tables

### 1. `profiles`
The central hub for every user. Linked 1:1 with `auth.users`.
- **Columns**: `id`, `username`, `display_name`, `avatar_url`, `xp`, `level`, `gold`, `streak_days`, `guild_id`, `role`, `title`, `title_border`, `avatar_frame`.
- **RLS**: Users can only update their own profiles. Public profiles are readable by everyone (needed for leaderboards).

### 2. `focus_sessions`
Logs user focus sessions (Pomodoros).
- **Columns**: `id`, `user_id`, `subject`, `duration_minutes`, `xp_earned`, `gold_earned`.
- **Relationship**: `user_id` -> `profiles(id)`.
- Used to calculate daily study goals and progress.

### 3. `adventure_log`
A detailed history of all actions a user takes (the Activity Feed).
- **Columns**: `id`, `user_id`, `activity_type`, `xp_earned`, `metadata`, `created_at`.
- Triggers on: focus completion, flashcard review, quest completion, etc.

### 4. `subjects` & `topics` & `semesters`
The syllabus structure.
- **Hierarchy**: `semesters` -> `subjects` -> `topics`.
- This powers the SyllabusWidget on the dashboard.

### 5. `daily_quests`
Generated daily or weekly tasks.
- **Columns**: `id`, `user_id`, `quest_type`, `title`, `target_value`, `current_value`, `is_completed`.

## Security & Triggers

- **RLS (Row Level Security)**: All tables have strict RLS. Users can only SELECT and INSERT/UPDATE their own data (e.g., `auth.uid() = user_id`), unless the data is public (like guilds, leaderboards, or achievements).
- **Triggers**:
  - `handle_new_user()`: Automatically creates a `profiles` and `user_settings` row whenever a new user registers in `auth.users`.
- **RPCs**:
  - `increment_xp(amount, user_id)`: Atomically updates a user's XP and recalculates their level without race conditions.
