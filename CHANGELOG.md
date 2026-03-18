# Changelog

All notable changes to Brain Trails are documented in this file.

## [0.4.0] — 2026-03-18

### Phase 3: Quiz Creator
- **NEW** `/quiz` page with Create Quiz and Past Quizzes tabs
- **NEW** `QuizCreator` component — paste study material, configure settings (question count, difficulty, time limit, question types)
- **NEW** `QuizPlayer` component — RPG battle UI with boss HP bar, timer, animated transitions, MCQ/T-F/fill-blank/short-answer support
- **NEW** `QuizResults` component — grade (S/A/B/C/D), XP/gold rewards, expandable answer review
- **NEW** Flask `POST /api/ai/generate-quiz` endpoint using Gemini 2.0 Flash
- **NEW** `supabase/migrations/00011_create_quizzes.sql` — `quizzes` and `quiz_attempts` tables with RLS
- **NEW** Backend tests for quiz endpoint
- **UPDATED** TravelerHotbar — added "Trials" (📝) quiz shortcut

### Phase 4: Ambient Music Player
- **NEW** `AmbientPlayer` floating collapsible widget (bottom-left)
- **NEW** 2 audio stations: Space Drift (LFO pads + sub-bass) and Campfire (crackling + warm drone)
- **NEW** Canvas waveform visualizer
- **UPDATED** `useAmbientSound` hook — now supports 6 stations total

### Phase 5: Arcane Archive (Existing)
- Knowledge Map with tree layout, zoom/pan already implemented

### Phase 6: Daily Quests & Challenges
- **NEW** `useQuests` hook — generates 3 daily + 1 weekly + 1 monthly quest from templates
- **NEW** `supabase/migrations/00012_create_quests.sql` — `daily_quests` table with RLS
- **UPGRADED** `QuestLog` component — dynamic quests with progress bars, period badges, XP/gold rewards

### Phase 7: Study Analytics Dashboard
- **NEW** `StudyChart` component — reusable SVG bar and donut charts with Framer Motion
- **NEW** `StreakCalendar` component — GitHub-style 365-day heatmap
- **UPGRADED** Report page — activity breakdown donut chart and streak calendar

### Phase 8: Polish & Unique Extras
- **NEW** `StudyStreakWidget` — animated SVG fire that scales with streak, counter, motivational messaging
- **UPGRADED** `OwlCompanion` — speech bubble with 12 rotating motivational quotes and study tips
- **UPGRADED** `Dashboard` — StudyStreakWidget in left sidebar, AmbientPlayer floating widget
- **UPDATED** `database.types.ts` — added `quizzes`, `quiz_attempts`, `daily_quests` table types

### Phase 9: Documentation
- **NEW** `CHANGELOG.md` documenting all phases
- **UPDATED** Backend API version to 0.4.0
- **UPDATED** Health check includes `generate_quiz` feature flag

## [0.3.0] — Previous Release

- Initial Brain Trails application
- Dashboard with 3-column grid layout
- Tiptap-based Spellbook Editor with toggle lists, callouts, tables
- Notes Sidebar with folder tree, search, pin/star, tags
- Focus Timer (Pomodoro/Cram modes)
- Flashcard system with SRS
- Boss Battle system
- Knowledge Map with tree layout
- Guild system with raids and leaderboards
- Achievements and Cosmetics Shop
- Owl Companion with 4 moods
- Ambient sounds (rain, café, forest, lo-fi)
- Onboarding wizard
- Command palette
