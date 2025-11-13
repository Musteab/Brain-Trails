import logging
import os
import random
from functools import lru_cache
from typing import List

from config import get_config

logger = logging.getLogger(__name__)

try:
    from transformers import AutoModelForSeq2SeqLM, AutoTokenizer, pipeline
except Exception:  # pragma: no cover - transformers optional
    AutoModelForSeq2SeqLM = None  # type: ignore
    AutoTokenizer = None  # type: ignore
    pipeline = None  # type: ignore
    logger.warning("Transformers not available. Falling back to heuristic quiz generation.")


def _transformers_disabled() -> bool:
    return os.getenv("AI_DISABLE_TRANSFORMERS", "0") == "1"


@lru_cache(maxsize=1)
def _get_qg_pipeline():
    if _transformers_disabled() or pipeline is None or AutoTokenizer is None:
        return None
    model_name = get_config(os.getenv("FLASK_ENV")).QUESTION_MODEL_NAME
    try:
        model = AutoModelForSeq2SeqLM.from_pretrained(model_name)
        tokenizer = AutoTokenizer.from_pretrained(model_name)
        return pipeline("text2text-generation", model=model, tokenizer=tokenizer)
    except Exception as exc:  # pragma: no cover - depends on env
        logger.warning("Question generation fallback triggered: %s", exc)
        return None


def generate_quiz_items(text: str, num_questions: int = 5) -> List[dict]:
    cleaned = (text or "").strip()
    if not cleaned:
        return []
    limit = get_config(os.getenv("FLASK_ENV")).AI_MAX_INPUT_CHARS
    cleaned = cleaned[:limit]

    questions = _generate_with_transformers(cleaned, num_questions)
    if not questions:
        questions = _fallback_questions(cleaned, num_questions)
    return questions[:num_questions]


def _generate_with_transformers(text: str, num_questions: int) -> List[dict]:
    qg = _get_qg_pipeline()
    if not qg:
        return []
    try:
        prompt = f"generate {num_questions} question answer pairs: {text}"
        generations = qg(prompt, max_length=512, do_sample=False)
        raw_output = generations[0]["generated_text"]
    except Exception as exc:  # pragma: no cover - env specific
        logger.warning("Transformer quiz generation failed: %s", exc)
        return []
    return _parse_generated_output(raw_output)


def _parse_generated_output(output: str) -> List[dict]:
    chunks = [chunk.strip() for chunk in output.replace("<sep>", "\n").split("\n") if chunk.strip()]
    questions = []
    pool_answers = []
    for chunk in chunks:
        lower = chunk.lower()
        question = None
        answer = None
        if "question:" in lower and "answer:" in lower:
            try:
                q_part, a_part = chunk.split("answer:")
                question = q_part.split("question:")[-1].strip(" ?")
                answer = a_part.strip()
            except ValueError:
                continue
        elif "?" in chunk:
            parts = chunk.split("?")
            question = parts[0].strip()
            answer = parts[1].replace("answer", "").strip(": .")
        if question and answer:
            pool_answers.append(answer)
            questions.append(
                {
                    "question": question + "?",
                    "correct_answer": answer,
                    "options": [],  # filled later
                }
            )
    if not questions:
        return []
    for item in questions:
        item["options"] = _build_options(item["correct_answer"], pool_answers)
    return questions


def _fallback_questions(text: str, num_questions: int) -> List[dict]:
    sentences = [s.strip() for s in text.replace("?", ".").split(".") if s.strip()]
    questions = []
    pool = sentences[: num_questions * 2]
    for sentence in pool:
        if len(questions) >= num_questions:
            break
        words = sentence.split()
        if len(words) < 6:
            continue
        answer = words[-1].strip(",")
        stem = " ".join(words[:-1])
        question = f"What word best completes: {stem} ___ ?"
        questions.append(
            {
                "question": question,
                "correct_answer": answer,
                "options": _build_options(answer, [w.split()[-1] for w in pool if w != sentence]),
            }
        )
    return questions


def _build_options(correct_answer: str, pool: List[str]) -> List[str]:
    unique = []
    for candidate in pool:
        candidate = candidate.strip().strip(".")
        if candidate and candidate.lower() != correct_answer.lower():
            unique.append(candidate)
        if len(unique) >= 3:
            break
    options = [correct_answer] + unique[:3]
    filler_index = 1
    while len(options) < 4:
        options.append(f"Option {filler_index}")
        filler_index += 1
    rng = random.Random(len(correct_answer))
    rng.shuffle(options)
    return options
