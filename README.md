# BrainTrails  
_Turn studying into an adventure._

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](#license)
[![Built with React & Flask](https://img.shields.io/badge/stack-React%20%2B%20Flask-lightgrey.svg)](#tech-stack)

BrainTrails is a cozy, gamified study companion that mixes productivity with playful vibes—flashcards, pomodoros, boss fights, pets, and ambient rooms all inside one app.  
_Demo screenshot coming soon!_

---

## What is BrainTrails?
BrainTrails makes studying feel like leveling up in your favorite game. Power through sessions with a pomodoro timer that grows lush trees, keep a tiny study pet motivated, fight intimidating exam “bosses,” swap between themed study rooms, and stay focused with brainrot split-screen videos, interactive flashcards, quizzes, and AI assistance. Your progress fuels streaks, XP, and daily rewards.

## Features
- 📝 **Notion-like notes** with rich text editor and slash commands.
- 🧠 **Generate quizzes from notes** (no copy-paste needed!).
- 🌳 **Animated pomodoro garden** that grows plants as you focus.
- 🎮 **Boss battle study mode**—deal damage by completing real tasks.
- 🐾 **Adopt a study pet** and watch it react to your habits.
- 🎨 **Five themed study rooms** like Forest Treehouse and Space Station.
- 📺 **Brainrot split-screen mode** with Subway Surfers-style videos.
- 🃏 **Interactive 3D flashcards** with flips, swipes, shuffle, and stats.
- 🧠 **AI-powered quiz generation & study insights** fueled by Gemini/Groq.
- 📅 **Planner with streaks, rituals, and drag & drop tasks.**
- 🎁 **Daily rewards, XP & leveling** with streak multipliers.
- 🎵 **Spotify Web Playback + YouTube fallback** for study playlists.

## Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL (or SQLite for development)

### Backend Setup
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r ../requirements.txt

# Create .env file with:
# DATABASE_URL=sqlite:///braintrails.db (or your PostgreSQL URL)
# SECRET_KEY=your-secret-key
# JWT_SECRET_KEY=your-jwt-secret
# GEMINI_API_KEY=your-gemini-api-key
# CORS_ORIGINS=http://localhost:3000

# Run migrations
flask db upgrade

# Start backend
flask --app wsgi run --port 5000
```

### Frontend Setup
```bash
cd frontend
npm install

# Create .env file with:
# REACT_APP_API_URL=http://localhost:5000/api

# Start frontend
npm start
```

### Database Migrations
When pulling new changes that include database schema updates:
```bash
cd backend
flask db upgrade
```

To create a new migration after model changes:
```bash
flask db migrate -m "Description of changes"
flask db upgrade
```

### Running Tests
```bash
# Backend tests
cd backend
PYTHONPATH=. pytest

# Frontend tests
cd frontend
npm test
```

## Tech Stack
React · Flask · PostgreSQL · TipTap Editor · Hugging Face transformers · Gemini AI

## Screenshots
_Add yours once you grab them—drop a few hero/dashboard shots here._

## Contributing
PRs welcome! Check the issues tab for ideas or improvements to tackle.

## License
MIT © BrainTrails contributors
