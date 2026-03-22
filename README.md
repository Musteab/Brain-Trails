<p align="center">
  <img src="brain-trails/public/assets/icons/idr-coin.png" width="80" alt="Brain Trails Logo" />
</p>

<h1 align="center">Brain Trails 🧠✨</h1>

<p align="center">
  <strong>A gamified study companion with an RPG soul.</strong><br/>
  Focus timers 🍄 · Flashcards 🃏 · Guilds 🏰 · AI Tutoring 🤖 · Cosmetics 💎 · Knowledge Paths 📜
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Status-Beta-blueviolet?style=for-the-badge" alt="Status" />
  <img src="https://img.shields.io/badge/License-MIT-success?style=for-the-badge" alt="License" />
  <img src="https://img.shields.io/badge/PRs-Welcome-brightgreen?style=for-the-badge" alt="PRs Welcome" />
</p>

---

## 📊 Project Activity 📈

<p align="center">
  <img src="https://github-readme-stats.vercel.app/api/pin/?username=Musteab&repo=Brain-Trails&theme=tokyonight&bg_color=1A1B27&hide_border=true" alt="Brain Trails Repo Card" />
</p>

## 🛠 Tech Stack ⚒️

**Frontend & Design 🎨** 
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-0055FF?style=for-the-badge&logo=framer&logoColor=white)
![Canvas Confetti](https://img.shields.io/badge/Canvas_Confetti-FF6B6B?style=for-the-badge&logo=canvas&logoColor=white)

**Backend, Data & AI 🗄️🧠** 
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-000000?style=for-the-badge&logo=flask&logoColor=white)
![Gemini AI](https://img.shields.io/badge/Google_Gemini-8E75B2?style=for-the-badge&logo=google&logoColor=white)

**State & Architecture 🏗️** 
![Zustand](https://img.shields.io/badge/Zustand-443E38?style=for-the-badge&logo=react&logoColor=white)
![Tiptap](https://img.shields.io/badge/Tiptap-000000?style=for-the-badge&logo=editorconfig&logoColor=white)

---

## ✨ Features 🌟

| Module 🧩 | What it does 📋 | Status 🔖 |
|--------|-------------|--------|
| **Dashboard** 🏰 | RPG-styled home with quest log, leaderboard, activity feed, and daily progress rings | ✅ Live |
| **Focus Garden** 🌻 | Pomodoro timer with plant growth animation, session tracking, and XP/gold block rewards | ✅ Live |
| **Spellbook** 📖 | Rich-text note editor (Tiptap) with slash commands, `.docx` import, auto-save | ✅ Live |
| **Spell Cards** 🃏 | Flashcard decks with flip animation, shuffle, SM-2 spaced repetition | ✅ Live |
| **Trials** ⚔️ | Quiz engine with timed questions and XP rewards | ✅ Live |
| **Arcane Archive** 📚 | Subject-centric learning hub with knowledge paths, mastery gates, and UI polish | ✅ Live |
| **Grimoire Sidebar** 📚✨ | Enhanced note organization with folders, search, pins, and color coding | ✅ Live |
| **Ornate Flashcards** 🃏✨ | Card-reading stand UI with glowing effects, ornate borders, and magical styling | ✅ Live |
| **Arcane Archive Map** 🗺️ | Interactive canvas showing subject connections with glowing nodes | ✅ Live |
| **Confetti Celebrations** 🎉 | Performance-scaled celebration effects on quiz completion | ✅ Live |
| **Battle Arena** 🐉 | Boss battles against AI using your studied material | ✅ Live |
| **AI Familiar** 🧚 | Study assistant powered by Google Gemini — summarize, quiz, explain, parse syllabi | ✅ Live |
| **Guild Hall** 🛡️ | Create/join study guilds, real-time chat, co-op boss raids, weekly leaderboard | 🧪 Beta |
| **Skill Trees** 🌳 | Visual node-map skill trees with progress tracking and boss nodes | 🧪 Beta |
| **Cosmetics Shop** 🛍️ | Spend in-game gold on themes, avatar frames, titles, and backgrounds (4 rarity tiers) | ✅ Live |
| **Achievements** 🏆 | 50+ unlockable badges across study, social, combat, exploration, and streak categories | ✅ Live |
| **Study Music** 🎵 | Embedded Spotify player with curated playlists and custom playlist support | 🧪 Beta |
| **The Grand Archive** 🏛️ | Animated "about" experience with cinematic portal intro and lore pages | ✅ Live |
| **Weekly Report** 📜 | Analytics dashboard — focus time, XP, streak, daily activity chart | ✅ Live |
| **Support Center** 🛠️ | Bug reports and feature requests with Discord integration | ✅ Live |
| **Onboarding** 🎒 | Guided setup wizard — upload syllabus (AI-parsed) or manually add subjects/topics/exams | ✅ Live |
| **Sun / Moon Theme** ☀️🌙| Full light/dark mode with animated sky backgrounds and localStorage persistence | ✅ Live |

---

## 📚 The Arcane Archive - Subject-Centric Learning 🧙‍♂️

The **Arcane Archive** revolutionizes how you organize your learning journey:

### 🎯 Core Concept
Instead of separate global notes, flashcards, and quizzes, everything is now organized by **subjects**. Create a subject (e.g., "Biology", "Spanish", "Calculus") and all your study materials are contained within it.

### 🏗️ Architecture
```
Arcane Archive (Hub)
└── Subject 1 (e.g., Biology)
    ├── Spellbook (Notes) 📖
    │   └── Enhanced with Grimoire Sidebar
    ├── Spell Cards (Flashcards) 🃏
    │   └── Ornate card-reading stand UI
    └── Trials (Quizzes) ⚔️
        └── Locked until mastery thresholds reached
└── Subject 2 (e.g., Spanish)
    └── [Same structure]
```

### 🎨 UI Features
- **Grimoire Sidebar**: Magical note organization with folder hierarchy, search, pins, and color tags
- **Ornate Flashcards**: Card-reading stand theme with glassmorphic effects, ornate borders, and serif typography
- **Arcane Archive Map**: Interactive canvas visualization of subject connections with glowing nodes and hover effects
- **Mastery System**: Quizzes unlock when you reach ≥30% notes + ≥40% card mastery (dual-gate system)
- **Confetti Celebrations**: Performance-scaled particle effects on quiz completion with theme-aware colors

### 🔗 Quick Navigation
- **Archive Hub**: `/arcane-archive` — View all your subjects
- **Subject Overview**: `/arcane-archive/[subjectId]` — Choose study mode
- **Notes**: `/arcane-archive/[subjectId]/spellbook` — Write notes for this subject
- **Flashcards**: `/arcane-archive/[subjectId]/flashcards` — Practice cards for this subject
- **Quiz**: `/arcane-archive/[subjectId]/quiz` — Take quizzes (if mastery unlocked)

For detailed implementation info, see [ARCANE_ARCHIVE_REFACTORING.md](./ARCANE_ARCHIVE_REFACTORING.md) 📖

---

### Prerequisites 🎒

- **Node.js 20+** 🟢
- **Python 3.12+** 🐍 (for AI backend only)
- A **Supabase** project ⚡

### 1. Clone & Install 📥

```bash
git clone https://github.com/Musteab/Brain-Trails.git
cd Brain-Trails/brain-trails
npm install
```

### 2. Environment Variables 🔑

Create `brain-trails/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Database Setup 💾

Open the **Supabase SQL Editor** and run the contents of:

```bash
brain-trails/supabase/schema.sql
```
This creates all necessary tables, RLS policies, and triggers.

### 4. Run the Frontend 🌐

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. Run the AI Backend (optional) 🧠

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

---

## 📁 Project Structure 🏗️

```plaintext
brain-trails/
├── app/                       # Next.js App Router pages
│   ├── arcane-archive/        # Subject-centric learning hub
│   │   ├── page.tsx           # Archive hub with all subjects
│   │   └── [subjectId]/       # Subject-specific routes
│   │       ├── layout.tsx      # Shared "Wizard's Desk" layout
│   │       ├── page.tsx        # Subject overview
│   │       ├── spellbook/      # Subject notes with Grimoire sidebar
│   │       ├── flashcards/     # Subject flashcards with ornate UI
│   │       └── quiz/           # Subject quizzes with mastery gate
│   ├── battle/                # Boss Battle (Arcane Arena)
│   ├── focus/                 # Focus Garden (Pomodoro + Cram Mode)
│   ├── guild/                 # Guild Hall (chat, raids, leaderboard)
│   ├── knowledge/             # Knowledge Paths (visual node map)
│   └── notes/                 # Legacy Spellbook (backward compatible)
├── backend/                   # Flask + Gemini AI server
├── components/
│   ├── arcane-archive/        # Archive-specific components (Map)
│   ├── notes/                 # Spellbook components (GrimoireSidebar)
│   ├── quiz/                  # Quiz components (ConfettiCelebration)
│   └── ...                    # Other modular React components
├── constants/                 # Game text configuration (RPG terminology)
├── context/                   # AuthContext, ThemeContext
├── hooks/                     # Custom hooks (e.g., useAchievements)
├── lib/                       # Utilities and Supabase clients
├── public/assets/             # Static images, icons, backgrounds
├── stores/                    # Zustand state management
├── styles/                    # Global and atmosphere CSS
└── supabase/                  # DB schema and configurations
```
*(Abridged for readability)*

---

## 🧪 Testing 🎮

```bash
npm run lint                    # Linting
npm run build                   # Production build (includes TS checks)
cd backend && pytest tests/ -v  # Backend tests
```

---

## 🎨 Design Philosophy ✨

- **"Nintendo meets Notion"** 🍄 — playful RPG theming with clean, functional UI.
- **Premium glassmorphism** 💎 — frosted glass cards with subtle borders and backdrop blur.
- **Animated backgrounds** 🌌 — parallax moon/sun skies with particles, clouds, and stars.
- **Rarity-tiered cosmetics** 🎁 — Common ⚪ → Rare 🔵 → Epic 🟣 → Legendary 🟡 with escalating visual effects.
- **Zustand over Redux** ⚡ — lightweight stores, no boilerplate.
- **Web Audio over audio files** 🎶 — oscillator synthesis for UI sounds, zero `.mp3` assets.
- **Supabase over custom backend** 🗄️ — auth, database, and realtime in one. Flask is AI-only.

---

## 🤝 Contributing (The Developer's Quest Log) 🛡️

Want to help make Brain Trails truly legendary? We'd love your help! 🌟

- **Find a Quest 📜:** Check out the Issues tab for bugs or feature requests. Drop a comment if you want to take one on!
- **Gear Up ⚔️:** Fork the repo, clone it locally, and set up your `.env` variables (see Getting Started).
- **Slay the Code 🐉:** Create a new branch (`git checkout -b feature/your-feature`). Keep your code clean and try to match the existing "Nintendo meets Notion" design style.
- **Submit for Review 🚩:** Push your branch and open a Pull Request. Include screenshots if you changed the UI!

*Please ensure your code passes `npm run build` and `npm run lint` before submitting.*

---

## 📜 License 🕊️

Distributed under the **MIT License**.

<br />
<p align="center">
<em>"Every quest completed brings you closer to mastery..." — Archie 🦉</em>
</p>
