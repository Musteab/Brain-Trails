# Brain Trails Backend

Flask API backend for Brain Trails, providing AI-powered study features.

## Quick Start

```bash
# Create virtual environment
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# Run the server
python app.py
```

The server starts on `http://localhost:5000`.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check |
| `GET` | `/api` | API info and available endpoints |
| `POST` | `/api/ai/chat` | AI chat using Gemini API |

### POST `/api/ai/chat`

Send a study question to the AI assistant.

**Request:**
```json
{
  "message": "Summarize my notes",
  "noteContent": "Optional - the student's current note text for context"
}
```

**Response:**
```json
{
  "response": "AI-generated study assistance...",
  "model": "gemini-2.0-flash"
}
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GEMINI_API_KEY` | Google Gemini API key | Yes (for AI chat) |
| `GROQ_API_KEY` | Groq API key | No (reserved for future use) |
| `PORT` | Server port (default: 5000) | No |
| `FLASK_ENV` | `development` for debug mode | No |

## Testing

```bash
pytest tests/ -v
```

## Project Structure

```
backend/
├── app.py              # Flask application + routes
├── requirements.txt    # Python dependencies
├── .env               # Environment variables (not committed)
└── tests/
    └── test_api.py    # API endpoint tests
```
