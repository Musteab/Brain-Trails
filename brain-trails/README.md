# Brain Trails 🎮🌿

A **gamified study companion** with a cozy "Nintendo meets Notion" aesthetic. Track your learning journey through quests, grow plants while focusing, battle through skill trees, and take magical notes — all wrapped in an RPG adventure theme.

## ✨ Features

| Feature | Description | Status |
|---------|-------------|--------|
| 🏕️ **Dashboard** | RPG-styled overview with quest log, leaderboard, activity feed, streak heatmap | ✅ Live |
| 🌱 **Focus Garden** | Pomodoro timer with plant growth, subject/duration picker, session tracking | ✅ Live |
| ⚔️ **Arcane Archive** | Skill tree visualization for curriculum mastery | ✅ Live |
| 📜 **Spellbook** | Dual-page note editor (Tiptap), slash commands, .docx import | ✅ Live |
| 🃏 **Spell Cards** | Flashcard decks with flip cards, shuffle, mastery dots | ✅ Live |
| 🤖 **AI Familiar** | AI study assistant powered by Google Gemini (summarize, quiz, explain) | ✅ Live |
| 🌗 **Theme Toggle** | Sun/Moon mode with full app-wide propagation | ✅ Live |
| 💾 **Note Persistence** | Auto-save notes to localStorage with debounce | ✅ Live |
| 📤 **Export** | Export notes as HTML or Markdown | ✅ Live |

## 🛠️ Tech Stack

**Frontend:** Next.js 16 · React 19 · Tailwind CSS 4 · Framer Motion · Tiptap Editor · Spline 3D  
**Backend:** Flask · Google Gemini API · python-dotenv  
**CI/CD:** GitHub Actions (TypeScript check + build for frontend, flake8 + pytest for backend)

## 🚀 Getting Started

### Frontend

```bash
cd brain-trails
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Backend (for AI features)

```bash
cd brain-trails/backend
python -m venv venv
venv\Scripts\activate      # Windows
pip install -r requirements.txt

# Add your API key to .env
echo GEMINI_API_KEY=your_key_here > .env

python app.py
```

Backend runs on [http://localhost:5000](http://localhost:5000).

## 📁 Project Structure

```
brain-trails/
├── app/                    # Next.js pages
│   ├── page.tsx           # Dashboard (Camp)
│   ├── focus/             # Focus Garden
│   ├── battle/            # Arcane Archive
│   ├── notes/             # Spellbook
│   └── flashcards/        # Spell Cards
├── components/
│   ├── dashboard/         # Dashboard widgets
│   ├── focus/             # Focus timer
│   ├── notes/             # Editor, AI Familiar, sidebar
│   ├── layout/            # Hotbar, background
│   └── ui/                # Shared components
├── context/               # ThemeContext (sun/moon)
├── hooks/                 # useCardStyles
├── lib/                   # Utilities (notes storage, markdown export)
├── constants/             # Game text configuration
├── backend/               # Flask API server
│   ├── app.py            # Routes + Gemini AI integration
│   ├── tests/            # pytest test suite
│   └── requirements.txt
└── public/assets/         # Icons, backgrounds
```

## 🧪 Testing

```bash
# Frontend type check
cd brain-trails && npx tsc --noEmit

# Frontend build
npm run build

# Backend tests
cd backend && pytest tests/ -v
```

## 📄 License

MIT
