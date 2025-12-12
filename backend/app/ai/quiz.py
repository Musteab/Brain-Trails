import json
import logging
import os
from typing import List

from google import genai

from config import get_config

logger = logging.getLogger(__name__)


def generate_quiz_items(text: str, num_questions: int = 5) -> List[dict]:
    cleaned = (text or "").strip()
    if not cleaned:
        return []
    limit = get_config(os.getenv("FLASK_ENV")).AI_MAX_INPUT_CHARS
    cleaned = cleaned[:limit]

    questions = _generate_with_gemini(cleaned, num_questions)
    return questions[:num_questions]


def _generate_with_gemini(text: str, num_questions: int) -> List[dict]:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is not configured")

    config = get_config(os.getenv("FLASK_ENV"))
    client = genai.Client(api_key=api_key)
    prompt = (
        "You are generating classroom-ready quiz questions that reward reasoning.\n"
        "Follow these rules:\n"
        "1. Mix question purposes: application, analysis, comparison, cause/effect, scenario-based.\n"
        "2. Avoid fill-in-the-blank or quote-completion prompts. Never copy wording verbatim.\n"
        "3. Every question must be contextual and require understanding, not rote recall.\n"
        "4. Provide exactly four answer choices per question. Wrong options should be plausible but clearly incorrect.\n"
        "5. Vary the stems (what/why/how/compare/predict) and difficulty.\n"
        "Return STRICT JSON:\n"
        "[{\"question\": \"...\", \"correct_answer\": \"...\", \"options\": [\"A\",\"B\",\"C\",\"D\"]}]\n"
        f"Create {num_questions} questions based on:\n{text}\n"
        "Do not include any extra commentary outside the JSON."
    )
    response = client.models.generate_content(
        model=config.GEMINI_MODEL_NAME,
        contents=prompt,
    )
    text_output = getattr(response, "text", None) or ""
    if not text_output and getattr(response, "candidates", None):
        candidate = response.candidates[0]
        parts = getattr(candidate, "content", {}).get("parts") if hasattr(candidate, "content") else None
        if parts:
            text_output = parts[0].get("text", "")
    return _parse_gemini_response(text_output)


def _parse_gemini_response(raw_text: str) -> List[dict]:
    if not raw_text:
        return []
    cleaned = raw_text.strip("` \n")
    if cleaned.lower().startswith("json"):
        cleaned = cleaned[4:].strip()
    try:
        parsed = json.loads(cleaned)
    except json.JSONDecodeError:
        logger.warning("Unable to parse Gemini JSON output: %s", cleaned)
        return []

    questions: List[dict] = []
    for item in parsed if isinstance(parsed, list) else []:
        question = (item.get("question") or "").strip()
        answer = (item.get("correct_answer") or "").strip()
        options = item.get("options") or []
        if not question or not answer or len(options) != 4:
            continue
        if answer not in options:
            options = [answer] + [opt for opt in options if opt != answer]
            options = options[:4]
        questions.append(
            {
                "question": question.rstrip("?") + "?",
                "correct_answer": answer,
                "options": options,
            }
        )
    return questions
