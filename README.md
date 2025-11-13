<div align="center">

# Brain-Trails

Your AI-assisted studying workspace—flashcards, notes, quizzes, planner, and analytics in one modern experience.

</div>

## Highlights

- ✨ **Unified workspace**: polished Material-UI experience with responsive navigation, quick stats, and contextual actions.
- 🧠 **On-device AI**: Hugging Face transformers (`distilbart` for summaries, `t5` for quiz generation) run through the Flask backend—no paid APIs required.
- 🃏 **Flashcard studio**: deck management, inline editing, and supermemo-style spaced repetition reviews.
- 📝 **Note lab**: Markdown-friendly editing, tagging, and one-click AI summaries with clear loading states.
- 🧪 **Quiz builder**: generate assessments from notes, take quizzes inside the app, and store attempt breakdowns.
- 📅 **Study planner**: schedule focus blocks, log outcomes, and monitor streaks.
- 📊 **Progress insights**: charts for study momentum, due cards, focus averages, and weekly minutes.
- ✅ **Tests & tooling**: pytest coverage for critical Flask routes and a Jest smoke test for the new auth flow.

## Updated Architecture

```text
backend/
├── app/
│   ├── __init__.py            # Flask factory, CORS, error hooks
│   ├── ai/                    # Hugging Face summarizer & quiz generator
│   ├── extensions.py          # db, migrate, JWT instances
│   ├── models/                # User, decks, flashcards, notes, quizzes, planner
│   ├── routes/                # auth, flashcards, notes, quizzes, planner, stats
│   └── services/              # spaced repetition + analytics helpers
├── migrations/                # Alembic revisions (new schema patch included)
├── tests/                     # pytest suites for auth/flashcards/notes/quizzes
├── config.py                  # env-aware settings + AI defaults
└── wsgi.py                    # `flask --app wsgi run`

frontend/
├── src/
│   ├── api/                   # Axios client + typed helper modules
│   ├── components/            # Layout + shared UI (stat cards, loaders)
│   ├── context/AuthContext.jsx# JWT session management
│   ├── pages/                 # Dashboard, Flashcards, Notes, Quizzes, Planner, Progress, Auth
│   ├── theme/                 # Custom dark MUI theme
│   └── App.js / index.js      # React Router v6 + React Query bootstrap
└── package.json               # Material UI, React Query, Recharts, etc.
```

## Getting Started

### Requirements

- Python 3.10+ (recommended)
- Node.js 18+
- PostgreSQL 13+
- (Optional) CUDA-capable GPU for faster transformers inference

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r ../requirements.txt

# Environment
cp .env.example .env             # create your own if needed
# minimally set:
# FLASK_ENV=development
# FLASK_APP=wsgi.py
# SECRET_KEY=change_me
# JWT_SECRET_KEY=change_me
# DATABASE_URL=postgresql://user:pass@localhost:5432/brain_trails
# CORS_ORIGINS=http://localhost:3000
# SUMMARY_MODEL_NAME=sshleifer/distilbart-cnn-12-6
# QUESTION_MODEL_NAME=valhalla/t5-base-e2e-qg

flask db upgrade                 # applies new study-session/tag fields
flask --app wsgi run
```

### Frontend

```bash
cd frontend
npm install
npm start                        # http://localhost:3000
```

The React dev server proxies API calls to `http://localhost:5000/api`. To point elsewhere, set `REACT_APP_API_URL`.

## AI Workflows (Open-Source Only)

| Feature | Model | Entry Point | Notes |
|---------|-------|-------------|-------|
| Note summarization | `sshleifer/distilbart-cnn-12-6` | `backend/app/ai/summary.py` | Lazily loads transformer; falls back to heuristic summary if disabled (`AI_DISABLE_TRANSFORMERS=1`). |
| Quiz generation | `valhalla/t5-base-e2e-qg` | `backend/app/ai/quiz.py` | Produces Q/A pairs and synthesizes multiple-choice options; heuristic fallback keeps feature usable offline. |
| Spaced repetition | Internal SM-2 variant | `backend/app/services/spaced_repetition.py` | Schedules next review per quality rating (0–5). |

All AI helpers respect `AI_MAX_INPUT_CHARS` to keep inference lightweight.

## Testing

```bash
# Backend
cd backend
python -m pytest

# Frontend
cd frontend
npm test
```

> **Heads up:** Running backend tests (or the server) requires the Python dependencies from `requirements.txt`. Install them inside a virtual environment first.

## Roadmap

- Offline cache for React Query data + optimistic deck updates.
- Optional Markdown preview for notes.
- Additional analytics (streaks, XP) once supporting models expand.

## License

MIT © Brain-Trails contributors.
