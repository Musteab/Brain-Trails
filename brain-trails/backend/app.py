"""
Brain Trails - Flask Backend API

Provides health checks and AI-powered study features via Gemini API.
"""

import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Enable CORS for frontend
CORS(app, resources={
    r"/api/*": {
        "origins": [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ]
    }
})


# ============================================
# Health Check Routes
# ============================================

@app.route("/api/health", methods=["GET"])
def health_check():
    """Health check endpoint for monitoring."""
    return jsonify({
        "status": "healthy",
        "version": "0.2.0",
        "features": {
            "ai_chat": True,
            "health": True,
        }
    })


@app.route("/api", methods=["GET"])
def api_root():
    """API root with available endpoints."""
    return jsonify({
        "name": "Brain Trails API",
        "version": "0.2.0",
        "endpoints": {
            "health": "/api/health",
            "ai_chat": "/api/ai/chat [POST]",
        }
    })


# ============================================
# AI Chat Route (Gemini API)
# ============================================

STUDY_SYSTEM_PROMPT = """You are an AI study companion called the "AI Familiar" in Brain Trails, 
a gamified study app. You help students with their notes by:
- Summarizing content concisely
- Generating quiz questions from their notes
- Explaining difficult concepts clearly
- Rewriting content for exam preparation
- Suggesting study strategies

Keep responses concise, friendly, and helpful. Use a slightly magical/RPG tone 
that fits the app's cozy adventure theme. Use emojis sparingly but effectively."""


@app.route("/api/ai/chat", methods=["POST"])
def ai_chat():
    """AI chat endpoint using Google Gemini API.

    Request body:
    {
        "message": "user's question or prompt",
        "noteContent": "optional - the user's current note content for context"
    }

    Returns:
    {
        "response": "AI response text",
        "model": "gemini model used"
    }
    """
    data = request.get_json()
    if not data or "message" not in data:
        return jsonify({"error": "Missing 'message' in request body"}), 400

    user_message = data["message"]
    note_content = data.get("noteContent", "")

    gemini_key = os.getenv("GEMINI_API_KEY")
    if not gemini_key:
        return jsonify({"error": "GEMINI_API_KEY not configured"}), 500

    try:
        import google.generativeai as genai

        genai.configure(api_key=gemini_key)
        model = genai.GenerativeModel("gemini-2.0-flash")

        # Build the prompt with note context if available
        prompt_parts = [STUDY_SYSTEM_PROMPT]

        if note_content:
            prompt_parts.append(
                f"\n\nThe student's current notes:\n---\n{note_content[:3000]}\n---"
            )

        prompt_parts.append(f"\n\nStudent's question: {user_message}")

        response = model.generate_content("".join(prompt_parts))

        return jsonify({
            "response": response.text,
            "model": "gemini-2.0-flash"
        })

    except ImportError:
        return jsonify({
            "error": "google-generativeai package not installed. Run: pip install google-generativeai"
        }), 500
    except Exception as e:
        return jsonify({
            "error": f"AI generation failed: {str(e)}"
        }), 500


# ============================================
# Run Server
# ============================================

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    debug = os.getenv("FLASK_ENV") == "development"
    app.run(host="0.0.0.0", port=port, debug=debug)
