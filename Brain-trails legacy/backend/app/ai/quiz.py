"""Enhanced quiz generation with AI."""
import json
import logging
import os
from typing import List, Optional, Dict, Any
from enum import Enum

from google import genai

from config import get_config

logger = logging.getLogger(__name__)


class QuizDifficulty(str, Enum):
    """Quiz difficulty levels."""
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class QuestionType(str, Enum):
    """Types of quiz questions."""
    MCQ = "mcq"  # Multiple choice
    TRUE_FALSE = "true_false"
    SHORT_ANSWER = "short_answer"


# Default quiz generation settings
DEFAULT_SETTINGS = {
    "difficulty": QuizDifficulty.MEDIUM,
    "question_count": 5,
    "question_types": [QuestionType.MCQ],
    "include_explanations": True,
}


def generate_quiz_items(text: str, num_questions: int = 5) -> List[dict]:
    """
    Generate quiz items from text (backward compatible).
    """
    return generate_quiz_v2(
        text=text,
        question_count=num_questions,
        difficulty=QuizDifficulty.MEDIUM,
        question_types=[QuestionType.MCQ],
        include_explanations=False,
    )


def generate_quiz_v2(
    text: str,
    question_count: int = 5,
    difficulty: QuizDifficulty = QuizDifficulty.MEDIUM,
    question_types: Optional[List[QuestionType]] = None,
    include_explanations: bool = True,
    focus_topics: Optional[List[str]] = None,
) -> List[dict]:
    """
    Enhanced quiz generation with full customization.
    
    Args:
        text: Source text to generate questions from
        question_count: Number of questions to generate (1-20)
        difficulty: easy/medium/hard
        question_types: List of question types (mcq, true_false, short_answer)
        include_explanations: Whether to include explanations for answers
        focus_topics: Optional list of specific topics to focus questions on
        
    Returns:
        List of question dictionaries with question, answer, options, and explanation
    """
    cleaned = (text or "").strip()
    if not cleaned:
        return []
    
    limit = get_config(os.getenv("FLASK_ENV")).AI_MAX_INPUT_CHARS
    cleaned = cleaned[:limit]
    
    # Normalize inputs
    question_count = max(1, min(20, question_count))
    question_types = question_types or [QuestionType.MCQ]
    
    questions = _generate_with_gemini_v2(
        text=cleaned,
        num_questions=question_count,
        difficulty=difficulty,
        question_types=question_types,
        include_explanations=include_explanations,
        focus_topics=focus_topics,
    )
    
    return questions[:question_count]


def _get_difficulty_instructions(difficulty: QuizDifficulty) -> str:
    """Get prompting instructions based on difficulty level."""
    if difficulty == QuizDifficulty.EASY:
        return """
DIFFICULTY: EASY
- Questions should test basic recall and understanding
- Use straightforward language
- Make the correct answer clearly distinguishable
- Avoid tricky wording or edge cases
- Focus on main concepts, not details
"""
    elif difficulty == QuizDifficulty.HARD:
        return """
DIFFICULTY: HARD
- Questions should require deep analysis and synthesis
- Include scenario-based and application questions
- Wrong answers should be very plausible
- Test nuanced understanding and edge cases
- Require connecting multiple concepts
"""
    else:  # MEDIUM
        return """
DIFFICULTY: MEDIUM
- Balance recall with understanding
- Include some application questions
- Wrong answers should be somewhat plausible
- Test both main concepts and supporting details
"""


def _get_question_type_instructions(question_types: List[QuestionType]) -> str:
    """Get instructions for generating specific question types."""
    instructions = []
    
    if QuestionType.MCQ in question_types:
        instructions.append("""
MCQ (Multiple Choice):
- Provide exactly 4 options labeled A, B, C, D
- One correct answer, three plausible distractors
- Format: {"type": "mcq", "question": "...", "correct_answer": "...", "options": ["A", "B", "C", "D"]}
""")
    
    if QuestionType.TRUE_FALSE in question_types:
        instructions.append("""
TRUE/FALSE:
- Statement must be definitively true or false
- Avoid ambiguous statements
- Format: {"type": "true_false", "question": "...", "correct_answer": "True" or "False", "options": ["True", "False"]}
""")
    
    if QuestionType.SHORT_ANSWER in question_types:
        instructions.append("""
SHORT ANSWER:
- Question should have a brief, specific answer (1-3 words or a short phrase)
- Include acceptable variations in the answer
- Format: {"type": "short_answer", "question": "...", "correct_answer": "...", "acceptable_answers": ["...", "..."]}
""")
    
    return "\n".join(instructions)


def _generate_with_gemini_v2(
    text: str,
    num_questions: int,
    difficulty: QuizDifficulty,
    question_types: List[QuestionType],
    include_explanations: bool,
    focus_topics: Optional[List[str]] = None,
) -> List[dict]:
    """Generate questions using Gemini with enhanced prompting."""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is not configured")

    config = get_config(os.getenv("FLASK_ENV"))
    client = genai.Client(api_key=api_key)
    
    # Build comprehensive prompt
    difficulty_instructions = _get_difficulty_instructions(difficulty)
    type_instructions = _get_question_type_instructions(question_types)
    
    focus_section = ""
    if focus_topics:
        focus_section = f"\nFOCUS ON THESE TOPICS: {', '.join(focus_topics)}\n"
    
    explanation_instruction = ""
    if include_explanations:
        explanation_instruction = """
EXPLANATIONS:
- Include an "explanation" field for each question
- Explain WHY the correct answer is right
- Briefly mention why other options are wrong (for MCQ)
- Keep explanations concise but educational (2-3 sentences)
"""
    
    # Distribution of question types
    type_distribution = []
    questions_per_type = num_questions // len(question_types)
    remainder = num_questions % len(question_types)
    for i, qt in enumerate(question_types):
        count = questions_per_type + (1 if i < remainder else 0)
        if count > 0:
            type_distribution.append(f"- {count} {qt.value} questions")
    
    prompt = f"""You are an expert educational content creator generating high-quality quiz questions.

{difficulty_instructions}

QUESTION TYPES TO GENERATE:
{chr(10).join(type_distribution)}

{type_instructions}

{explanation_instruction}

{focus_section}

CRITICAL RULES:
1. Questions must test UNDERSTANDING, not just memorization
2. Never copy text verbatim from the source
3. Vary question stems (what/why/how/compare/predict/apply)
4. Each question should test a different concept
5. All content must be factually accurate to the source material

SOURCE MATERIAL:
{text}

Generate exactly {num_questions} questions. Return ONLY valid JSON array:
[{{"type": "...", "question": "...", "correct_answer": "...", "options": [...], "explanation": "..."}}]

No additional text or markdown, just the JSON array.
"""

    try:
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
        
        return _parse_gemini_response_v2(text_output, include_explanations)
    
    except Exception as e:
        logger.error(f"Gemini API error: {e}")
        # Retry once with simplified prompt
        return _fallback_generate(text, num_questions)


def _parse_gemini_response_v2(raw_text: str, include_explanations: bool) -> List[dict]:
    """Parse enhanced Gemini response."""
    if not raw_text:
        return []
    
    cleaned = raw_text.strip("` \n")
    if cleaned.lower().startswith("json"):
        cleaned = cleaned[4:].strip()
    
    # Try to extract JSON from response
    try:
        # Find JSON array in response
        start_idx = cleaned.find('[')
        end_idx = cleaned.rfind(']') + 1
        if start_idx != -1 and end_idx > start_idx:
            cleaned = cleaned[start_idx:end_idx]
        
        parsed = json.loads(cleaned)
    except json.JSONDecodeError:
        logger.warning("Unable to parse Gemini JSON output: %s", cleaned[:500])
        return []

    questions: List[dict] = []
    for item in parsed if isinstance(parsed, list) else []:
        question_type = item.get("type", "mcq")
        question = (item.get("question") or "").strip()
        answer = (item.get("correct_answer") or "").strip()
        options = item.get("options") or []
        explanation = (item.get("explanation") or "").strip() if include_explanations else ""
        acceptable_answers = item.get("acceptable_answers", [])
        
        if not question or not answer:
            continue
        
        # Validate based on question type
        if question_type == "mcq":
            if len(options) < 2:
                continue
            # Ensure answer is in options
            if answer not in options:
                options = [answer] + [opt for opt in options if opt != answer]
                options = options[:4]
        elif question_type == "true_false":
            options = ["True", "False"]
            if answer not in ["True", "False"]:
                answer = "True" if answer.lower() in ["true", "yes", "correct"] else "False"
        elif question_type == "short_answer":
            options = []  # Short answer has no options
        
        result = {
            "type": question_type,
            "question": question.rstrip("?") + "?",
            "correct_answer": answer,
            "options": options,
        }
        
        if include_explanations and explanation:
            result["explanation"] = explanation
        
        if acceptable_answers:
            result["acceptable_answers"] = acceptable_answers
        
        questions.append(result)
    
    return questions


def _fallback_generate(text: str, num_questions: int) -> List[dict]:
    """Fallback to simpler generation if main method fails."""
    return _generate_with_gemini(text, num_questions)


def _generate_with_gemini(text: str, num_questions: int) -> List[dict]:
    """Original generation method (backward compatible)."""
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
    """Original parsing (backward compatible)."""
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


def regenerate_single_question(
    original_question: dict,
    source_text: str,
    difficulty: QuizDifficulty = QuizDifficulty.MEDIUM,
) -> Optional[dict]:
    """
    Regenerate a single question, creating a new variation.
    
    Args:
        original_question: The question to regenerate
        source_text: Original source material
        difficulty: Difficulty level for new question
        
    Returns:
        New question dict or None if generation fails
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is not configured")
    
    config = get_config(os.getenv("FLASK_ENV"))
    client = genai.Client(api_key=api_key)
    
    question_type = original_question.get("type", "mcq")
    original_q = original_question.get("question", "")
    
    prompt = f"""Generate a DIFFERENT question about the same topic as this one:
Original question: {original_q}

Create a new {question_type} question that:
1. Tests a similar concept but from a different angle
2. Is NOT the same question reworded
3. Has difficulty level: {difficulty.value}

Source material: {source_text[:2000]}

Return ONLY valid JSON:
{{"type": "{question_type}", "question": "...", "correct_answer": "...", "options": [...], "explanation": "..."}}
"""
    
    try:
        response = client.models.generate_content(
            model=config.GEMINI_MODEL_NAME,
            contents=prompt,
        )
        text_output = getattr(response, "text", None) or ""
        
        # Parse single question
        cleaned = text_output.strip("` \n")
        if cleaned.lower().startswith("json"):
            cleaned = cleaned[4:].strip()
        
        parsed = json.loads(cleaned)
        if isinstance(parsed, dict) and parsed.get("question"):
            return parsed
    except Exception as e:
        logger.error(f"Failed to regenerate question: {e}")
    
    return None
