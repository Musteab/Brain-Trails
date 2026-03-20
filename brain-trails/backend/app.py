"""
Brain Trails - Flask Backend API

Provides health checks and AI-powered study features via Groq (Llama) and Gemini APIs.
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

# ─── AI Client Setup ───────────────────────────────────────────

def get_groq_keys():
    """Return a list of Groq API keys from env (comma-separated or single)."""
    # Support comma-separated keys: GROQ_API_KEYS=key1,key2,key3
    multi = os.getenv("GROQ_API_KEYS", "")
    if multi.strip():
        return [k.strip() for k in multi.split(",") if k.strip()]
    # Fallback to single key
    single = os.getenv("GROQ_API_KEY", "")
    return [single] if single.strip() else []


def groq_chat(messages, temperature=0.7, max_tokens=1500):
    """Try each Groq key in order. Rotate on 401/429 errors."""
    from groq import Groq

    keys = get_groq_keys()
    if not keys:
        return None, "No GROQ_API_KEY(S) configured"

    last_error = None
    for key in keys:
        try:
            client = Groq(api_key=key)
            completion = client.chat.completions.create(
                model=GROQ_MODEL,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
            )
            return completion.choices[0].message.content, None
        except Exception as e:
            error_str = str(e)
            last_error = error_str
            # If it's an auth or rate limit error, try the next key
            if "401" in error_str or "429" in error_str or "invalid_api_key" in error_str.lower():
                continue
            # For other errors, don't retry with different keys
            return None, f"AI generation failed: {error_str}"

    return None, f"All {len(keys)} API key(s) failed. Last error: {last_error}"


def get_gemini_model():
    """Return a Gemini GenerativeModel if the key is configured."""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return None
    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        return genai.GenerativeModel("gemini-2.0-flash")
    except ImportError:
        return None


GROQ_MODEL = "llama-3.3-70b-versatile"



# ============================================
# Health Check Routes
# ============================================

@app.route("/api/health", methods=["GET"])
def health_check():
    """Health check endpoint for monitoring."""
    return jsonify({
        "status": "healthy",
        "version": "1.0.0.0",
        "ai_provider": "groq" if os.getenv("GROQ_API_KEY") else "gemini",
        "features": {
            "ai_chat": True,
            "parse_syllabus": True,
            "generate_quiz": True,
            "health": True,
        }
    })


@app.route("/api", methods=["GET"])
def api_root():
    """API root with available endpoints."""
    return jsonify({
        "name": "Brain Trails API",
        "version": "1.0.0.0",
        "endpoints": {
            "health": "/api/health",
            "ai_chat": "/api/ai/chat [POST]",
            "parse_syllabus": "/api/ai/parse-syllabus [POST]",
            "generate_quiz": "/api/ai/generate-quiz [POST]",
        }
    })


# ============================================
# AI Chat Route
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
    """AI chat endpoint using Groq (primary) or Gemini (fallback).

    Request body:
    {
        "message": "user's question or prompt",
        "noteContent": "optional - the user's current note content for context"
    }
    """
    data = request.get_json()
    if not data or "message" not in data:
        return jsonify({"error": "Missing 'message' in request body"}), 400

    user_message = data["message"]
    note_content = data.get("noteContent", "")

    # Build context
    user_prompt = ""
    if note_content:
        user_prompt += f"The student's current notes:\n---\n{note_content[:3000]}\n---\n\n"
    user_prompt += f"Student's question: {user_message}"

    # Try Groq (with key rotation)
    messages = [
        {"role": "system", "content": STUDY_SYSTEM_PROMPT},
        {"role": "user", "content": user_prompt},
    ]
    response_text, error = groq_chat(messages, temperature=0.7, max_tokens=1500)
    if response_text:
        return jsonify({"response": response_text, "model": GROQ_MODEL})

    # Fallback to Gemini
    gemini = get_gemini_model()
    if gemini:
        try:
            prompt = STUDY_SYSTEM_PROMPT + "\n\n" + user_prompt
            response = gemini.generate_content(prompt)
            return jsonify({"response": response.text, "model": "gemini-2.0-flash"})
        except Exception as e:
            return jsonify({"error": f"AI generation failed: {str(e)}"}), 500

    return jsonify({"error": error or "No AI provider configured"}), 500


# ============================================
# Syllabus Parsing Route
# ============================================

SYLLABUS_SYSTEM_PROMPT = """You are an expert academic syllabus parser for Brain Trails, a gamified study app.

Your job is to extract structured data from a syllabus. Return ONLY valid JSON with no markdown formatting, no code fences, and no extra text.

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
    """Parse a syllabus using Groq (text) or Gemini (files)."""
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

    response_text = ""

    try:
        # For text input, prefer Groq
        if file_type == "text":
            messages = [
                {"role": "system", "content": SYLLABUS_SYSTEM_PROMPT},
                {"role": "user", "content": f"Parse this syllabus and return JSON:\n---\n{content[:8000]}\n---"},
            ]
            result, groq_err = groq_chat(messages, temperature=0.3, max_tokens=4000)
            if result:
                response_text = result.strip()
            else:
                # Fallback to Gemini for text
                gemini = get_gemini_model()
                if not gemini:
                    return jsonify({"error": "No AI provider configured"}), 500
                prompt = SYLLABUS_SYSTEM_PROMPT + "\n\nHere is the syllabus content to parse:\n---\n" + content[:8000] + "\n---\n\nReturn the JSON now."
                response = gemini.generate_content(prompt)
                response_text = response.text.strip()
        else:
            raw_bytes = base64.b64decode(file_data)

            if file_type == "pdf":
                # Extract text from PDF using PyPDF2, then send to Groq
                import io
                try:
                    from PyPDF2 import PdfReader
                    reader = PdfReader(io.BytesIO(raw_bytes))
                    pdf_text = "\n".join(page.extract_text() or "" for page in reader.pages)
                except Exception as pdf_err:
                    return jsonify({"error": f"Failed to read PDF: {str(pdf_err)}"}), 400

                if not pdf_text.strip():
                    return jsonify({"error": "Could not extract text from this PDF. Try pasting the text manually."}), 400

                messages = [
                    {"role": "system", "content": SYLLABUS_SYSTEM_PROMPT},
                    {"role": "user", "content": f"Parse this syllabus and return JSON:\n---\n{pdf_text[:8000]}\n---"},
                ]
                result, groq_err = groq_chat(messages, temperature=0.3, max_tokens=4000)
                if result:
                    response_text = result.strip()
                else:
                    return jsonify({"error": groq_err or "Failed to parse PDF text"}), 500
            else:
                # For images, try Gemini (multimodal) as last resort
                gemini = get_gemini_model()
                if not gemini:
                    return jsonify({"error": "Image parsing requires Gemini API. Try uploading a PDF or pasting text instead."}), 400
                response = gemini.generate_content([
                    SYLLABUS_SYSTEM_PROMPT + "\n\nParse the attached syllabus document and return the JSON.",
                    {"mime_type": "image/png", "data": raw_bytes},
                ])
                response_text = response.text.strip()

        # Clean markdown fences
        response_text = re.sub(r"^```(?:json)?\s*", "", response_text)
        response_text = re.sub(r"\s*```$", "", response_text)

        parsed = json.loads(response_text)

        return jsonify({
            "data": parsed,
            "model": GROQ_MODEL if file_type == "text" else "gemini-2.0-flash",
        })

    except json.JSONDecodeError as e:
        return jsonify({
            "error": f"Failed to parse AI response as JSON: {str(e)}",
            "raw_response": response_text[:1000] if response_text else ""
        }), 500
    except Exception as e:
        return jsonify({
            "error": f"Syllabus parsing failed: {str(e)}"
        }), 500


# ============================================
# Quiz Generation Route
# ============================================

QUIZ_SYSTEM_PROMPT = """You are a quiz generator for Brain Trails, a gamified study app.

Generate quiz questions from the provided study content. Return ONLY valid JSON with no markdown formatting, no code fences, and no extra text.

The JSON must follow this exact schema:
{
  "questions": [
    {
      "type": "mcq",
      "question": "What is...?",
      "options": ["A", "B", "C", "D"],
      "correct_answer": "A",
      "explanation": "Because..."
    },
    {
      "type": "true_false",
      "question": "The sky is blue.",
      "options": ["True", "False"],
      "correct_answer": "True",
      "explanation": "Because..."
    },
    {
      "type": "fill_blank",
      "question": "The powerhouse of the cell is the ___.",
      "correct_answer": "mitochondria",
      "explanation": "Because..."
    },
    {
      "type": "short_answer",
      "question": "Explain photosynthesis briefly.",
      "correct_answer": "The process by which plants convert sunlight into energy.",
      "explanation": "Key points to include..."
    }
  ]
}

Rules:
1. Generate exactly the requested number of questions.
2. Match the requested difficulty level.
3. Only use requested question types.
4. MCQ must always have exactly 4 options.
5. True/False must have options ["True", "False"].
6. Fill-blank questions should use ___ for the blank.
7. Always include a brief explanation for each answer.
8. Questions should test understanding, not just memorization.
9. Always return valid JSON. Never include markdown code fences."""


@app.route("/api/ai/generate-quiz", methods=["POST"])
def generate_quiz():
    """Generate a quiz or flashcards from study content or a subject/topic."""
    data = request.get_json()
    if not data:
        return jsonify({"error": "Missing request body"}), 400

    content = data.get("content", "")
    subject = data.get("subject", "")
    topic = data.get("topic", "")
    gen_type = data.get("type", "quiz")  # "quiz" or "flashcard"
    count = data.get("count", data.get("num_questions", 10))
    difficulty = data.get("difficulty", "medium")
    question_types = data.get("question_types", ["mcq"])

    # Build the user prompt based on what was provided
    if gen_type == "flashcard":
        if subject and topic:
            user_prompt = (
                f"Generate exactly {count} flashcard-style question and answer pairs about "
                f"the topic '{topic}' within the subject '{subject}'.\n"
                f"Each item MUST have a 'question' field and an 'answer' field.\n"
                f"Questions should test understanding, not trivial facts.\n"
                f"Return JSON: {{\"questions\": [{{\"question\": \"...\", \"answer\": \"...\"}}]}}\n"
                "Return the JSON now."
            )
        elif subject:
            user_prompt = (
                f"Generate exactly {count} flashcard-style question and answer pairs about "
                f"the subject '{subject}'.\n"
                f"Each item MUST have a 'question' field and an 'answer' field.\n"
                f"Cover the most important concepts a student should know.\n"
                f"Return JSON: {{\"questions\": [{{\"question\": \"...\", \"answer\": \"...\"}}]}}\n"
                "Return the JSON now."
            )
        else:
            return jsonify({"error": "Flashcard generation requires at least a subject"}), 400
    else:
        # Original quiz generation
        if not content.strip() and not subject:
            return jsonify({"error": "Missing 'content' or 'subject' in request body"}), 400

        types_str = ", ".join(question_types)
        if content.strip():
            user_prompt = (
                f"Generate {count} {difficulty} difficulty questions.\n"
                f"Use these question types: {types_str}\n\n"
                f"Study content:\n---\n{content[:6000]}\n---\n\n"
                "Return the JSON now."
            )
        else:
            user_prompt = (
                f"Generate {count} {difficulty} difficulty questions about '{subject}"
                + (f" - {topic}" if topic else "") + f"'.\n"
                f"Use these question types: {types_str}\n\n"
                "Return the JSON now."
            )

    response_text = ""

    try:
        # Try Groq (with key rotation)
        messages = [
            {"role": "system", "content": QUIZ_SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ]
        result, groq_err = groq_chat(messages, temperature=0.5, max_tokens=4000)
        if result:
            response_text = result.strip()
        else:
            # Fallback to Gemini
            gemini = get_gemini_model()
            if not gemini:
                return jsonify({"error": groq_err or "No AI provider configured"}), 500
            prompt = QUIZ_SYSTEM_PROMPT + "\n\n" + user_prompt
            response = gemini.generate_content(prompt)
            response_text = response.text.strip()

        # Clean markdown fences
        response_text = re.sub(r"^```(?:json)?\s*", "", response_text)
        response_text = re.sub(r"\s*```$", "", response_text)

        parsed = json.loads(response_text)

        return jsonify({
            "questions": parsed.get("questions", []),
            "model": GROQ_MODEL,
        })

    except json.JSONDecodeError as e:
        return jsonify({
            "error": f"Failed to parse AI response as JSON: {str(e)}",
            "raw_response": response_text[:1000] if response_text else ""
        }), 500
    except Exception as e:
        return jsonify({
            "error": f"Quiz generation failed: {str(e)}"
        }), 500


# ============================================
# Run Server
# ============================================

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    debug = os.getenv("FLASK_ENV") == "development"
    app.run(host="0.0.0.0", port=port, debug=debug)
