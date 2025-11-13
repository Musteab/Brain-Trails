import logging
import os
from functools import lru_cache
from typing import Optional

from config import get_config

logger = logging.getLogger(__name__)

try:
    from transformers import pipeline
except Exception:  # pragma: no cover - transformers optional fallback
    pipeline = None  # type: ignore
    logger.warning("Transformers not available. Falling back to heuristic summaries.")


def _transformers_disabled() -> bool:
    return os.getenv("AI_DISABLE_TRANSFORMERS", "0") == "1"


@lru_cache(maxsize=1)
def _get_summarizer():
    if _transformers_disabled() or pipeline is None:
        return None
    config = get_config(os.getenv("FLASK_ENV"))
    try:
        return pipeline(
            "summarization",
            model=config.SUMMARY_MODEL_NAME,
            tokenizer=config.SUMMARY_MODEL_NAME,
        )
    except Exception as exc:  # pragma: no cover - depends on env
        logger.warning("Falling back to heuristic summarizer: %s", exc)
        return None


def _truncate_text(text: str) -> str:
    config = get_config(os.getenv("FLASK_ENV"))
    limit = getattr(config, "AI_MAX_INPUT_CHARS", 4000)
    return text[:limit]


def generate_summary(text: str, max_sentences: int = 3) -> str:
    cleaned = (text or "").strip()
    if not cleaned:
        return ""
    cleaned = _truncate_text(cleaned)
    summarizer = _get_summarizer()
    if summarizer:
        try:
            summary = summarizer(
                cleaned,
                max_length=max(30, max_sentences * 40),
                min_length=max(15, max_sentences * 15),
                do_sample=False,
            )
            return summary[0]["summary_text"].strip()
        except Exception as exc:  # pragma: no cover - depends on env
            logger.warning("Summarizer failed, using heuristic fallback: %s", exc)
    return _heuristic_summary(cleaned, max_sentences)


def _heuristic_summary(text: str, max_sentences: int) -> str:
    sentences = [sentence.strip() for sentence in text.replace("!", ".").split(".")]
    sentences = [s for s in sentences if s]
    return ". ".join(sentences[:max_sentences])
