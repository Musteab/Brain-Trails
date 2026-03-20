<p align="center">
  <img src="public/assets/icons/idr-coin.png" width="64" alt="Brain Trails" />
</p>

<h1 align="center">Brain Trails</h1>

<p align="center">
  <strong>A gamified study companion with an RPG soul.</strong><br/>
  Focus timers · Flashcards · Guilds · AI Tutoring · Cosmetics · Knowledge Paths<br/><br/>
  <em>Still in Beta — built with 💜</em>
</p>

---

## ✨ Features

| Module | What it does | Status |
|--------|-------------|--------|
| **Dashboard** | RPG-styled home with quest log, leaderboard, activity feed, and daily progress rings | ✅ Live |
| **Focus Garden** | Pomodoro timer with plant growth animation, session tracking, and XP/gold rewards | ✅ Live |
| **Spellbook** | Rich-text note editor (Tiptap) with slash commands, `.docx` import, auto-save | ✅ Live |
| **Spell Cards** | Flashcard decks with flip animation, shuffle, SM-2 spaced repetition | ✅ Live |
| **Trials** | Quiz engine with timed questions and XP rewards | ✅ Live |
| **Battle Arena** | Boss battles against AI using your studied material | ✅ Live |
| **AI Familiar** | Study assistant powered by Google Gemini — summarize, quiz, explain, parse syllabi | ✅ Live |
| **Guild Hall** | Create/join study guilds, real-time chat, co-op boss raids, weekly leaderboard | 🧪 Beta |
| **Knowledge Map** | Visual node-map skill trees with progress tracking and boss nodes | 🧪 Beta |
| **Cosmetics Shop** | Spend in-game gold on themes, avatar frames, titles, and backgrounds (4 rarity tiers) | ✅ Live |
| **Achievements** | 50+ unlockable badges across study, social, combat, exploration, and streak categories | ✅ Live |
| **Study Music** | Embedded Spotify player with curated playlists and custom playlist support | 🧪 Beta |
| **The Grand Archive** | Animated "about" experience with cinematic portal intro and lore pages | ✅ Live |
| **Weekly Report** | Analytics dashboard — focus time, XP, streak, daily activity chart | ✅ Live |
| **Support Center** | Bug reports and feature requests with Discord integration | ✅ Live |
| **Onboarding** | Guided setup wizard — upload syllabus (AI-parsed) or manually add subjects/topics/exams | ✅ Live |
| **Sun / Moon Theme** | Full light/dark mode with animated sky backgrounds and localStorage persistence | ✅ Live |

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router) · React 19 |
| **Styling** | Tailwind CSS 4 · Framer Motion |
| **Editor** | Tiptap (ProseMirror) |
| **State** | Zustand 5 (game store + UI store) |
| **Database** | Supabase (PostgreSQL + Row-Level Security) |
| **Auth** | Supabase Auth (email/password + Google OAuth) |
| **AI Backend** | Flask + Google Gemini API |
| **Realtime** | Supabase Realtime (guild chat, presence) |
| **Fonts** | Nunito + Quicksand (Google Fonts) |
| **Sounds** | Web Audio API oscillator synthesis |

## 🚀 Getting Started

### Prerequisites

- **Node.js 20+**
- **Python 3.12+** (for AI backend only)
- A **Supabase** project

### 1. Clone & Install

```bash
git clone https://github.com/Musteab/Brain-Trails.git
cd Brain-Trails/brain-trails
npm install
```

### 2. Environment Variables

Create `brain-trails/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Database Setup

Open the **Supabase SQL Editor** and run the contents of:

```
brain-trails/supabase/schema.sql
```

This creates all tables, RLS policies, and triggers for: `profiles`, `focus_sessions`, `notes`, `decks`, `cards`, `guilds`, `guild_members`, `guild_messages`, `cosmetics`, `user_cosmetics`, `achievements`, `user_achievements`, `knowledge_paths`, `knowledge_nodes`, `semesters`, `subjects`, `topics`, `exams`, and more.

### 4. Run the Frontend

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. Run the AI Backend (optional)

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux
pip install -r requirements.txt

echo GEMINI_API_KEY=your_key_here > .env
python app.py
```

Backend runs on [http://localhost:5000](http://localhost:5000).

## 📁 Project Structure

```
brain-trails/
├── app/                        # Next.js App Router pages
│   ├── layout.tsx              # Root layout (providers, SEO metadata)
│   ├── page.tsx                # Dashboard
│   ├── login/                  # Login
│   ├── register/               # Registration
│   ├── onboarding/             # New-user setup wizard
│   ├── focus/                  # Focus Garden (Pomodoro + Cram Mode)
│   ├── battle/                 # Boss Battle (Arcane Arena)
│   ├── knowledge/              # Knowledge Paths (visual node map)
│   ├── notes/                  # Spellbook (rich-text editor)
│   ├── flashcards/             # Spell Cards (flashcards)
│   ├── quiz/                   # Trials (quiz engine)
│   ├── guild/                  # Guild Hall (chat, raids, leaderboard)
│   ├── shop/                   # Cosmetics Shop
│   ├── achievements/           # Achievement Tracker
│   ├── about/                  # The Grand Archive (animated about page)
│   ├── report/                 # Weekly Analytics Report
│   ├── support/                # Support Center + Bug Reports
│   ├── settings/               # User Settings
│   └── admin/                  # Admin Panel
├── components/
│   ├── dashboard/              # StudyRoom, QuestLog, LeaderboardPodium, etc.
│   ├── focus/                  # FocusTimer, CramMode
│   ├── battle/                 # SkillTree, ResourcePanel, CardForge
│   ├── knowledge/              # KnowledgeMap, PathCreator
│   ├── notes/                  # SpellbookEditor, AIFamiliar, NotesSidebar
│   ├── guild/                  # GuildCreate, GuildChat, GuildRaid, MemberList
│   ├── layout/                 # TravelerHotbar, BackgroundLayer, Footer
│   └── ui/                     # ProfileHoverCard, AmbientPlayer, Toasts, etc.
├── stores/                     # Zustand state management
├── context/                    # AuthContext, ThemeContext
├── hooks/                      # useCardStyles, useAchievements, useSoundEffects
├── lib/                        # supabase.ts, database.types.ts, utilities
├── constants/                  # Game text configuration (RPG terminology)
├── styles/                     # background-atmosphere.css, editor styles
├── supabase/                   # schema.sql (full DB schema + RLS)
├── backend/                    # Flask + Gemini AI server
├── middleware.ts               # Auth + route protection
└── public/assets/              # Static images, icons, backgrounds
```

## 🧪 Testing

```bash
# Lint
npm run lint

# Production build (includes TypeScript checks)
npm run build

# Backend tests
cd backend && pytest tests/ -v
```

## 🎨 Design Philosophy

- **"Nintendo meets Notion"** — playful RPG theming with clean, functional UI
- **Premium glassmorphism** — frosted glass cards with subtle borders and backdrop blur
- **Animated backgrounds** — parallax moon/sun skies with particles, clouds, and stars
- **Rarity-tiered cosmetics** — Common → Rare → Epic → Legendary with escalating visual effects
- **Zustand over Redux** — lightweight stores, no boilerplate
- **Web Audio over audio files** — oscillator synthesis for UI sounds, zero `.mp3` assets
- **Supabase over custom backend** — auth, database, and realtime in one. Flask is AI-only

## 📜 License

MIT

---

<p align="center">
  <em>"Every quest completed brings you closer to mastery..." — Archie 🦉</em>
</p>
