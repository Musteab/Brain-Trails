# Brain-Trails: Your AI-Powered Studying App

Brain-Trails is a full-stack studying application that combines traditional study tools with AI features to enhance your learning experience.

## Features

- **User Authentication**: Secure login and registration.
- **Flashcards**: Create, edit, and review flashcards with spaced repetition.
- **Quizzes**: Generate and take quizzes based on your study materials.
- **Notes**: Take and organize notes with AI-powered summarization.
- **Study Planner**: Schedule study sessions and set reminders.
- **Progress Tracking**: Monitor your learning progress over time.
- **AI Features**:
  - Smart quiz generation
  - Personalized study plans
  - Summarization of notes
  - Question generation from study materials

## Tech Stack

- **Frontend**: React.js
- **Backend**: Flask (Python)
- **Database**: PostgreSQL
- **AI/ML**: PyTorch, Transformers, NLTK, scikit-learn
- **Testing**: pytest
- **Development**: black, flake8, isort

## Getting Started

### Prerequisites

- Python 3.8+
- Node.js 14+
- PostgreSQL

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/Brain-Trails.git
   cd Brain-Trails
   ```

2. Set up the backend:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. Set up the frontend:
   ```bash
   cd frontend
   npm install
   ```

4. Configure environment variables:
   - Create a `.env` file in the backend directory with the following variables:
     ```
     FLASK_APP=app
     FLASK_ENV=development
     DATABASE_URL=postgresql://username:password@localhost:5432/brain_trails
     SECRET_KEY=your_secret_key
     ```

5. Run the application:
   - Backend:
     ```bash
     flask run
     ```
   - Frontend:
     ```bash
     cd frontend
     npm start
     ```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
