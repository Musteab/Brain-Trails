# Brain Trails

A **gamified study companion** with a cozy "Nintendo meets Notion" aesthetic. Track your learning journey through quests, grow plants while focusing, battle through skill trees, and take magical notes -- all wrapped in an RPG adventure theme.

## Features

| Feature | Description | Status |
|---------|-------------|--------|
| **Dashboard** | RPG-styled overview with quest log, leaderboard, activity feed, streak heatmap | Live |
| **Focus Garden** | Pomodoro timer with plant growth, subject/duration picker, session tracking + rewards | Live |
| **Arcane Archive** | Skill tree visualization for curriculum mastery | Live |
| **Spellbook** | Dual-page note editor (Tiptap), slash commands, .docx import, auto-save to Supabase | Live |
| **Spell Cards** | Flashcard decks with flip cards, shuffle, SM-2 grading, mastery tracking | Live |
| **AI Familiar** | AI study assistant powered by Google Gemini (summarize, quiz, explain) | Live |
| **Theme Toggle** | Sun/Moon mode with localStorage persistence and full app-wide propagation | Live |
| **Sound Effects** | Web Audio API tone synthesis for UI interactions (toggle-able) | Live |
| **Game Store** | Centralized XP/level/gold/streak state management via Zustand | Live |
| **Toast Notifications** | Animated notification system for rewards and feedback | Live |
| **Error Boundary** | Graceful error recovery UI with RPG theming | Live |
| **Export** | Export notes as HTML or Markdown | Live |

## Tech Stack

**Frontend:** Next.js 16 - React 19 - Tailwind CSS 4 - Framer Motion - Tiptap Editor - Spline 3D - Zustand 5
**Backend:** Flask - Google Gemini API - python-dotenv
**Database:** Supabase (PostgreSQL) with Row Level Security
**Auth:** Supabase Auth (email/password + Google OAuth)
**CI/CD:** GitHub Actions (lint + build for frontend, flake8 + pytest for backend)

## Getting Started

### Prerequisites

- Node.js 20+
- Python 3.12+ (for backend)
- Supabase project (for database and auth)

### Frontend

```bash
cd brain-trails
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

Create `brain-trails/.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Backend (for AI features)

```bash
cd brain-trails/backend
python -m venv venv
source venv/bin/activate    # macOS/Linux
venv\Scripts\activate       # Windows
pip install -r requirements.txt

# Add your API key to .env
echo GEMINI_API_KEY=your_key_here > .env

python app.py
```

Backend runs on [http://localhost:5000](http://localhost:5000).

### Database Setup

Apply the schema to your Supabase project:

```bash
# Copy the contents of brain-trails/supabase/schema.sql
# and run it in the Supabase SQL Editor
```

The schema creates 7 tables with RLS policies: `profiles`, `focus_sessions`, `notes`, `decks`, `cards`, `adventure_log`, and `user_settings`.

## Project Structure

```
brain-trails/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx         # Root layout (providers, error boundary, toasts)
│   ├── page.tsx           # Dashboard (Camp)
│   ├── login/             # Login page
│   ├── register/          # Registration page
│   ├── focus/             # Focus Garden
│   ├── battle/            # Arcane Archive (skill tree)
│   ├── notes/             # Spellbook (dual-page editor)
│   └── flashcards/        # Spell Cards
├── components/
│   ├── dashboard/         # Dashboard widgets (QuestLog, AdventureLog, etc.)
│   ├── focus/             # FocusTimer
│   ├── battle/            # SkillTree, ResourcePanel, CardForge
│   ├── notes/             # SpellbookEditor, AIFamiliar, NotesSidebar
│   ├── layout/            # TravelerHotbar, SplineBackground, Footer
│   └── ui/                # ErrorBoundary, ToastContainer, ThemeToggle, etc.
├── stores/                # Zustand state management
│   ├── useGameStore.ts    # XP, level, gold, streak (synced with Supabase)
│   └── useUIStore.ts      # Modals, toasts, mobile nav
├── context/               # React Context providers
│   ├── AuthContext.tsx     # Supabase auth + profile management
│   └── ThemeContext.tsx    # Sun/moon theme with localStorage persistence
├── hooks/                 # Custom React hooks
│   ├── useCardStyles.ts   # Theme-aware glassmorphism styling
│   ├── usePerformanceTier.ts # Device capability detection
│   └── useSoundEffects.ts # Web Audio API sound effects
├── lib/                   # Utility libraries
│   ├── supabase.ts        # Supabase client
│   ├── htmlToMarkdown.ts  # HTML to Markdown converter
│   └── docxImport.ts      # .docx file import via mammoth
├── constants/             # Game text configuration (RPG terminology)
├── supabase/              # Database schema
│   └── schema.sql         # Full schema with RLS policies + triggers
├── backend/               # Flask API server
│   ├── app.py            # Routes + Gemini AI integration
│   ├── tests/            # pytest test suite
│   └── requirements.txt
├── middleware.ts          # Supabase SSR auth + route protection
└── public/assets/         # Static assets
```

## Testing

```bash
# Frontend lint
cd brain-trails && npm run lint

# Frontend build (includes type checking)
npm run build

# Backend tests
cd backend && pytest tests/ -v
```

## Architecture Decisions

- **Zustand over Redux**: Lightweight stores with no boilerplate. Game stats and UI state are separate stores.
- **Web Audio API over audio files**: Sound effects use oscillator synthesis, eliminating the need for .mp3 assets.
- **Supabase over custom backend**: Handles auth, database, and real-time subscriptions. The Flask backend is only used for AI (Gemini) integration.
- **Theme via Context, Game via Zustand**: Theme needs to wrap the entire component tree (Context). Game stats are accessed imperatively from auth callbacks (Zustand's `getState()`).

## License

MIT
