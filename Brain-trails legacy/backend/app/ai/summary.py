import logging
import os
from functools import lru_cache
from typing import Optional

import requests

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
    strategies = (_generate_with_groq, _generate_with_transformer)
    for strategy in strategies:
        try:
            summary = strategy(cleaned, max_sentences)
        except Exception as exc:  # pragma: no cover - defensive
            logger.warning("%s failed: %s", strategy.__name__, exc)
            summary = None
        if summary:
            return summary
    return _heuristic_summary(cleaned, max_sentences)


def _generate_with_groq(text: str, max_sentences: int) -> Optional[str]:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return None
    config = get_config(os.getenv("FLASK_ENV"))
    model = os.getenv("GROQ_SUMMARY_MODEL", config.GROQ_MODEL_NAME)
    payload = {
        "model": model,
        "messages": [
            {
                "role": "system",
                "content": "You are a concise assistant that writes clear study summaries.",
            },
            {
                "role": "user",
                "content": f"Summarize the following in {max_sentences} sentences or fewer:\n\n{text}",
            },
        ],
        "temperature": 0.2,
        "max_tokens": max(80, max_sentences * 60),
    }
    response = requests.post(
        "https://api.groq.com/openai/v1/chat/completions",
        headers={"Authorization": f"Bearer {api_key}"},
        json=payload,
        timeout=30,
    )
    response.raise_for_status()
    data = response.json()
    choices = data.get("choices") or []
    if not choices:
        return None
    content = choices[0]["message"]["content"].strip()
    return content


def _generate_with_transformer(text: str, max_sentences: int) -> Optional[str]:
    summarizer = _get_summarizer()
    if not summarizer:
        return None
    summary = summarizer(
        text,
        max_length=max(30, max_sentences * 40),
        min_length=max(15, max_sentences * 15),
        do_sample=False,
    )
    return summary[0]["summary_text"].strip()


def _heuristic_summary(text: str, max_sentences: int) -> str:
    sentences = [sentence.strip() for sentence in text.replace("!", ".").split(".")]
    sentences = [s for s in sentences if s]
    return ". ".join(sentences[:max_sentences])
