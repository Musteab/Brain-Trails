#  Brain Trails

**Your AI-Powered Study Copilot**

Brain Trails is an intelligent study companion that leverages AI to transform how you learn. It combines smart note-taking, AI-generated quizzes, adaptive flashcards, and gamification to create a personalized learning experience.

---

##  AI-Powered Features

###  Intelligent Content Generation
- **AI Quiz Generation** - Automatically generate quizzes from your notes using Google Gemini or Groq LLaMA
- **Smart Summaries** - Get AI-powered summaries of complex topics
- **Adaptive Questions** - Questions tailored to your learning level and progress

###  Smart Learning Analytics
- **Spaced Repetition** - Scientifically-proven algorithm optimizes review timing
- **Performance Insights** - AI analyzes your strengths and weaknesses
- **Study Recommendations** - Personalized suggestions for what to study next

---

##  Core Features

###  AI-Enhanced Notes
- Rich text editor with markdown support
- AI-assisted summarization
- Tag organization with color coding
- Folder structure for organization

###  Intelligent Quizzes
- AI-generated questions from your content
- Multiple choice, true/false, and short answer
- Timed assessments with explanations
- Performance tracking over time

###  Smart Flashcards
- Create decks from notes or AI suggestions
- Spaced repetition scheduling
- Confidence-based learning
- Import/export capabilities

###  Gamification System
- Experience points and leveling
- Achievement badges and rewards
- Virtual pet companions
- Study streaks and daily goals

###  Focus Tools
- Pomodoro timer with customization
- Brainrot Mode - Background videos for focus
- Ambient sounds and themes
- Session tracking

###  Progress Analytics
- Study time heatmaps
- Performance trends
- Weekly/monthly reports
- Goal tracking

---

##  Tech Stack

### Backend
- **Framework:** Flask 3.x
- **Database:** SQLAlchemy ORM with SQLite
- **Authentication:** Flask-JWT-Extended
- **AI Providers:** Google Gemini API, Groq API

### Frontend
- **Framework:** React 18
- **State Management:** TanStack Query v5
- **UI Library:** Material-UI v5
- **Routing:** React Router v6

---

##  Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- API keys for AI features (Gemini or Groq)

### Backend Setup

cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
flask db upgrade
flask run

### Frontend Setup

cd frontend
npm install
npm start

The app will be available at http://localhost:3000

---

##  Project Structure

Brain-Trails/
 backend/
    app/
       ai/           # AI integration (quiz, summary)
       models/       # Database models
       routes/       # API endpoints
       services/     # Business logic
    migrations/       # Database migrations
    tests/            # Backend tests

 frontend/
    src/
        api/          # API client
        components/   # Reusable components
        context/      # React contexts
        hooks/        # Custom hooks
        pages/        # Page components
        theme/        # MUI theming

 requirements.txt

---

##  API Endpoints

### Authentication
- POST /api/auth/register - Create account
- POST /api/auth/login - Get JWT token
- GET /api/auth/me - Get current user

### AI Features
- POST /api/quizzes/generate - Generate AI quiz from notes
- POST /api/summaries/generate - Generate AI summary

### Core Resources
- GET/POST /api/flashcards - Flashcard management
- GET/POST /api/quizzes - Quiz management
- GET/POST /api/planner - Study planner

---

##  Contributing

1. Fork the repository
2. Create a feature branch (git checkout -b feature/amazing-feature)
3. Commit your changes (git commit -m 'Add amazing feature')
4. Push to the branch (git push origin feature/amazing-feature)
5. Open a Pull Request

---

##  License

This project is licensed under the MIT License.

---

Brain Trails - Study smarter with AI 
