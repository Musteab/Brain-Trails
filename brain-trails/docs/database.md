# Database Schema

Brain Trails uses PostgreSQL hosted on Supabase with 14 migrations defining the schema.

## Entity Relationship Diagram

```mermaid
erDiagram
    PROFILES ||--o{ FOCUS_SESSIONS : "has many"
    PROFILES ||--o{ ADVENTURE_LOG : "has many"
    PROFILES ||--o{ DAILY_QUESTS : "has many"
    PROFILES ||--o{ NOTES : "has many"
    PROFILES ||--o{ DECKS : "owns"
    PROFILES ||--o{ BOSS_BATTLES : "participates in"
    PROFILES }o--|| GUILDS : "belongs to"
    PROFILES ||--|| USER_SETTINGS : "has one"
    DECKS ||--o{ CARDS : "contains"
    SEMESTERS ||--o{ SUBJECTS : "contains"
    SUBJECTS ||--o{ TOPICS : "contains"
    SUBJECTS ||--o{ QUIZZES : "generates"
    QUIZZES ||--o{ QUIZ_QUESTIONS : "contains"

    PROFILES {
        uuid id PK
        text username
        text display_name
        text avatar_url
        int xp
        int level
        int gold
        int streak_days
        uuid guild_id FK
        text role
        text title
        text title_border
        text avatar_frame
    }

    FOCUS_SESSIONS {
        uuid id PK
        uuid user_id FK
        text subject
        int duration_minutes
        int xp_earned
        int gold_earned
    }

    ADVENTURE_LOG {
        uuid id PK
        uuid user_id FK
        text activity_type
        int xp_earned
        jsonb metadata
        timestamptz created_at
    }

    DAILY_QUESTS {
        uuid id PK
        uuid user_id FK
        text quest_type
        text title
        int target_value
        int current_value
        boolean is_completed
    }
```

## Tables by Domain

### 🎮 Core Profile
| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `profiles` | Central user hub, 1:1 with `auth.users` | `xp`, `level`, `gold`, `streak_days`, `guild_id`, `role`, `title`, `avatar_frame` |
| `user_settings` | User preferences (theme, sounds, notifications) | `theme`, `ambient_volume`, `sfx_enabled`, `study_reminder_time` |

### 📚 Study System
| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `focus_sessions` | Pomodoro session logs | `subject`, `duration_minutes`, `xp_earned`, `gold_earned` |
| `notes` | Rich text notes with persistence | `user_id`, `title`, `content`, `subject_id` |
| `decks` | Flashcard deck containers | `user_id`, `title`, `subject` |
| `cards` | Individual flashcards in a deck | `deck_id`, `front`, `back`, `difficulty` |
| `quizzes` | Auto-generated quizzes | `subject_id`, `title`, `question_count` |
| `quiz_questions` | Questions within a quiz | `quiz_id`, `question`, `options`, `correct_answer` |

### 🗺️ Syllabus & Knowledge
| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `semesters` | Top-level academic term | `name`, `user_id` |
| `subjects` | Courses within a semester | `semester_id`, `name`, `color` |
| `topics` | Individual topics within a subject | `subject_id`, `name`, `is_completed` |

### ⚔️ Game Systems
| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `daily_quests` | Daily/weekly/monthly objectives | `quest_type`, `target_value`, `current_value`, `is_completed` |
| `adventure_log` | Activity feed / event history | `activity_type`, `xp_earned`, `metadata` |
| `boss_battles` | Co-op Boss Raid encounters | `boss_name`, `hp`, `participants` |

## Security

- **RLS (Row Level Security)**: All tables enforce `auth.uid() = user_id` for writes. Public data (leaderboards, guilds) allows broader SELECT access.
- **Triggers**: `handle_new_user()` auto-creates `profiles` + `user_settings` rows on signup.
- **RPCs (Atomic Operations)**:
  - `increment_xp(amount, user_id)` — Atomically updates XP and recalculates level
  - `increment_gold(amount, user_id)` — Atomically updates gold balance
  - Prevents race conditions from concurrent requests (e.g., two quests completing simultaneously)

## Migration History

| # | File | What it does |
|---|------|-------------|
| 01 | `create_profiles` | Core profiles table |
| 02 | `create_focus_sessions` | Pomodoro logging |
| 03 | `create_notes` | Note persistence |
| 04 | `create_decks_and_cards` | Flashcard system |
| 05 | `create_boss_battles` | Co-op raids |
| 06 | `create_adventure_log` | Activity feed |
| 07 | `create_user_settings` | Preferences |
| 08 | `create_triggers_and_functions` | Auto-profile creation |
| 09 | `create_study_subjects` | Full syllabus hierarchy |
| 10 | `enhance_notes` | Rich note features |
| 11 | `create_quizzes` | Quiz system |
| 12 | `create_quests` | Daily quests |
| 13 | `final_polish` | Cosmetics, achievements, guilds |
| 14 | `atomic_increments` | Race-safe XP/gold RPCs |
