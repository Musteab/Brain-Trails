"""
Brain Trails - Flask Backend API

Provides health checks and AI-powered study features via Gemini API.
"""

import os
import json
import re
import base64
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Enable CORS for frontend
CORS(app)


# ============================================
# Health Check Routes
# ============================================

@app.route("/api/health", methods=["GET"])
def health_check():
    """Health check endpoint for monitoring."""
    return jsonify({
        "status": "healthy",
        "version": "0.3.0",
        "features": {
            "ai_chat": True,
            "parse_syllabus": True,
            "health": True,
        }
    })


@app.route("/api", methods=["GET"])
def api_root():
    """API root with available endpoints."""
    return jsonify({
        "name": "Brain Trails API",
        "version": "0.3.0",
        "endpoints": {
            "health": "/api/health",
            "ai_chat": "/api/ai/chat [POST]",
            "parse_syllabus": "/api/ai/parse-syllabus [POST]",
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
# Syllabus Parsing Route (Gemini API)
# ============================================

SYLLABUS_SYSTEM_PROMPT = """You are an expert academic syllabus parser for Brain Trails, a gamified study app.

Your job is to extract structured data from a syllabus (text, PDF, or image). Return ONLY valid JSON with no markdown formatting, no code fences, and no extra text.

The JSON must follow this exact schema:
{
  "semester": "Fall 2026",
  "subjects": [
    {
      "name": "Physics 201",
      "code": "PHYS201",
      "emoji": "⚡",
      "color": "from-blue-500 to-cyan-600",
      "description": "Introductory electromagnetism and optics",
      "professor": "Dr. Smith",
      "credit_hours": 3,
      "topics": [
        { "name": "Coulomb's Law", "sort_order": 0 },
        { "name": "Electric Fields", "sort_order": 1 }
      ],
      "exams": [
        {
          "name": "Midterm 1",
          "exam_type": "exam",
          "exam_date": "2026-10-15T09:00:00Z",
          "weight_pct": 25,
          "duration_minutes": 90,
          "location": "Room 101"
        }
      ]
    }
  ]
}

Rules:
1. Pick an appropriate emoji for each subject (science=⚡🔬🧬, math=📐, history=🏛️, CS=💻, language=📖, art=🎨, etc.)
2. Pick a Tailwind gradient color for each subject from these options:
   - "from-violet-500 to-purple-600"
   - "from-emerald-500 to-teal-600"
   - "from-amber-500 to-orange-600"
   - "from-blue-500 to-cyan-600"
   - "from-rose-500 to-pink-600"
   - "from-indigo-500 to-blue-600"
   - "from-lime-500 to-green-600"
   - "from-fuchsia-500 to-pink-600"
3. Extract ALL topics/chapters mentioned. If a weekly schedule is given, each week's topic is a separate topic.
4. For exam_type, use one of: "exam", "quiz", "assignment", "project", "presentation", "other"
5. If a date year is not specified, assume the current or next academic year.
6. If you cannot determine a field, use sensible defaults (empty string for text, 0 for numbers).
7. If the content is not a syllabus or is unintelligible, return: {"semester": "", "subjects": []}
8. Always return valid JSON. Never include markdown code fences or explanatory text."""


@app.route("/api/ai/parse-syllabus", methods=["POST"])
def parse_syllabus():
    """Parse a syllabus using Gemini API."""
    data = request.get_json()
    if not data:
        return jsonify({"error": "Missing request body"}), 400

    file_type = data.get("file_type", "text")
    content = data.get("content", "")
    file_data = data.get("file_data", "")

    if file_type == "text" and not content.strip():
        return jsonify({"error": "Missing 'content' for text mode"}), 400

    if file_type in ("pdf", "image") and not file_data:
        return jsonify({"error": f"Missing 'file_data' for {file_type} mode"}), 400

    gemini_key = os.getenv("GEMINI_API_KEY")
    if not gemini_key:
        return jsonify({"error": "GEMINI_API_KEY not configured"}), 500

    response_text = ""

    try:
        import google.generativeai as genai

        genai.configure(api_key=gemini_key)
        model = genai.GenerativeModel("gemini-2.0-flash")

        if file_type == "text":
            prompt = (
                SYLLABUS_SYSTEM_PROMPT
                + "\n\nHere is the syllabus content to parse:\n---\n"
                + content[:8000]
                + "\n---\n\nReturn the JSON now."
            )
            response = model.generate_content(prompt)
        else:
            raw_bytes = base64.b64decode(file_data)
            mime_type = "application/pdf" if file_type == "pdf" else "image/png"
            response = model.generate_content([
                SYLLABUS_SYSTEM_PROMPT + "\n\nParse the attached syllabus document and return the JSON.",
                {"mime_type": mime_type, "data": raw_bytes},
            ])

        response_text = response.text.strip()
        response_text = re.sub(r"^```(?:json)?\s*", "", response_text)
        response_text = re.sub(r"\s*```$", "", response_text)

        parsed = json.loads(response_text)

        return jsonify({
            "data": parsed,
            "model": "gemini-2.0-flash"
        })

    except json.JSONDecodeError as e:
        return jsonify({
            "error": f"Failed to parse AI response as JSON: {str(e)}",
            "raw_response": response_text[:1000] if response_text else ""
        }), 500
    except ImportError:
        return jsonify({
            "error": "google-generativeai package not installed."
        }), 500
    except Exception as e:
        return jsonify({
            "error": f"Syllabus parsing failed: {str(e)}"
        }), 500


# ============================================
# Run Server
# ============================================

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    debug = os.getenv("FLASK_ENV") == "development"
    app.run(host="0.0.0.0", port=port, debug=debug)
