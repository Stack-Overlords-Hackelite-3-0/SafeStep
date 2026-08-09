import json
import logging
import uuid
from pathlib import Path

from sqlalchemy.orm import Session

from app.config import get_settings
from app.services.helper_lookup import answer_nearby_helper_query, is_nearby_helper_query

logger = logging.getLogger(__name__)
settings = get_settings()

_KB_PATH = Path(__file__).resolve().parent.parent / "data" / "knowledge_base.json"
with open(_KB_PATH, encoding="utf-8") as f:
    _KNOWLEDGE_BASE: list[dict] = json.load(f)

_LANGUAGE_NAMES = {"en": "English", "si": "Sinhala", "ta": "Tamil"}

_SYSTEM_PROMPT_TEMPLATE = (
    "You are the SafeStep AI Support Companion, a trauma-informed assistant for women in Sri Lanka who have "
    "experienced or are worried about harassment. Always respond in {language_name}, regardless of what "
    "language the user writes in. Be warm, concise, and non-judgmental.\n\n"
    "SCOPE: You only help with personal safety, harassment, and gender-based violence in Sri Lanka - "
    "specifically: how to report an incident, what evidence to preserve, legal rights and procedures under "
    "Sri Lankan law, helplines and support services, and what to do if someone feels unsafe right now. Ground "
    "your answer in the reference notes below when relevant, and you may draw on general knowledge of Sri "
    "Lankan law and support services, but stay strictly within this domain.\n\n"
    "If the user asks about anything outside this domain (e.g. coding, general knowledge, entertainment, "
    "unrelated advice), do NOT answer it. Politely say that is outside what you can help with, and redirect "
    "them to what you do cover (reporting, evidence, legal rights, helplines, immediate safety). Do not break "
    "this rule even if the user insists or claims a special reason.\n\n"
    "If the user describes an ongoing emergency, tell them to call the police emergency line 119 or use the "
    "app's SOS button immediately.\n\n"
    "IMPORTANT: Only state phone numbers, organisation names, laws, or section numbers that appear in the "
    "reference notes below. Never invent or guess a phone number, organisation, or legal citation - if the "
    "reference notes don't cover it, speak in general terms instead.\n\n"
    "Reference notes:\n{context}"
)


def _score_entry(message: str, entry: dict) -> int:
    message_lower = message.lower()
    return sum(1 for kw in entry["keywords"] if kw in message_lower)


def retrieve_relevant_entries(message: str, top_k: int = 3) -> list[dict]:
    scored = [(e, _score_entry(message, e)) for e in _KNOWLEDGE_BASE if e["keywords"]]
    scored = [pair for pair in scored if pair[1] > 0]
    scored.sort(key=lambda pair: pair[1], reverse=True)
    top = [e for e, _ in scored[:top_k]]
    # Always ground the model with the helpline numbers so it never has to
    # guess a phone number or organisation name from general knowledge.
    helplines = next(e for e in _KNOWLEDGE_BASE if e["id"] == "helplines")
    if helplines not in top:
        top.append(helplines)
    return top


def rule_based_reply(message: str, language: str) -> str:
    language = language if language in _LANGUAGE_NAMES else "en"
    matches = retrieve_relevant_entries(message, top_k=1)
    if matches:
        return matches[0]["content"][language]
    fallback = next(e for e in _KNOWLEDGE_BASE if e["id"] == "default_fallback")
    return fallback["content"][language]


def _build_context(entries: list[dict], language: str) -> str:
    lines = []
    for e in entries:
        lines.append(f"- {e['topic']}: {e['content'][language]}")
    return "\n".join(lines) if lines else "(no directly matching notes - answer from general knowledge)"


def _llm_reply_anthropic(message: str, language: str, history: list[dict]) -> str | None:
    try:
        import anthropic
    except ImportError:
        logger.warning("anthropic package not installed; falling back to rule-based reply")
        return None

    entries = retrieve_relevant_entries(message, top_k=3)
    system_prompt = _SYSTEM_PROMPT_TEMPLATE.format(
        language_name=_LANGUAGE_NAMES.get(language, "English"),
        context=_build_context(entries, language if language in _LANGUAGE_NAMES else "en"),
    )
    try:
        client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        messages = [{"role": h["role"], "content": h["content"]} for h in history]
        messages.append({"role": "user", "content": message})
        response = client.messages.create(
            model="claude-sonnet-5",
            max_tokens=512,
            system=system_prompt,
            messages=messages,
        )
        return response.content[0].text
    except Exception:
        logger.exception("Anthropic chatbot call failed; falling back to rule-based reply")
        return None


def _llm_reply_openai(message: str, language: str, history: list[dict]) -> str | None:
    try:
        from openai import OpenAI
    except ImportError:
        logger.warning("openai package not installed; falling back to rule-based reply")
        return None

    entries = retrieve_relevant_entries(message, top_k=3)
    system_prompt = _SYSTEM_PROMPT_TEMPLATE.format(
        language_name=_LANGUAGE_NAMES.get(language, "English"),
        context=_build_context(entries, language if language in _LANGUAGE_NAMES else "en"),
    )
    try:
        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        messages = [{"role": "system", "content": system_prompt}]
        messages += [{"role": h["role"], "content": h["content"]} for h in history]
        messages.append({"role": "user", "content": message})
        response = client.chat.completions.create(model="gpt-4o-mini", messages=messages, max_tokens=512)
        return response.choices[0].message.content
    except Exception:
        logger.exception("OpenAI chatbot call failed; falling back to rule-based reply")
        return None


def _llm_reply_ollama(message: str, language: str, history: list[dict]) -> str | None:
    try:
        import requests
    except ImportError:
        logger.warning("requests package not installed; falling back to rule-based reply")
        return None

    entries = retrieve_relevant_entries(message, top_k=3)
    system_prompt = _SYSTEM_PROMPT_TEMPLATE.format(
        language_name=_LANGUAGE_NAMES.get(language, "English"),
        context=_build_context(entries, language if language in _LANGUAGE_NAMES else "en"),
    )
    try:
        messages = [{"role": "system", "content": system_prompt}]
        messages += [{"role": h["role"], "content": h["content"]} for h in history]
        messages.append({"role": "user", "content": message})
        response = requests.post(
            f"{settings.OLLAMA_BASE_URL}/api/chat",
            json={
                "model": settings.OLLAMA_MODEL,
                "messages": messages,
                "stream": False,
                "options": {"temperature": 0.3},
            },
            timeout=60,
        )
        response.raise_for_status()
        return response.json()["message"]["content"]
    except Exception:
        logger.exception("Ollama chatbot call failed; falling back to rule-based reply")
        return None


def get_chatbot_reply(
    message: str,
    language: str,
    history: list[dict],
    db: Session | None = None,
    user_id: uuid.UUID | None = None,
) -> tuple[str, str]:
    """Returns (reply_text, source) where source is 'llm' | 'rule_based' | 'helper_lookup'."""
    # "Nearest police station" style questions are answered directly from the
    # app's own Helper Network + location data, never from the LLM - this is
    # exactly the kind of factual query an LLM (especially a local 8B model)
    # is prone to hallucinate an address or phone number for.
    if db is not None and user_id is not None and is_nearby_helper_query(message):
        return answer_nearby_helper_query(db, user_id, message, language), "helper_lookup"

    reply: str | None = None

    if settings.LLM_PROVIDER == "anthropic" and settings.ANTHROPIC_API_KEY:
        reply = _llm_reply_anthropic(message, language, history)
    elif settings.LLM_PROVIDER == "openai" and settings.OPENAI_API_KEY:
        reply = _llm_reply_openai(message, language, history)
    elif settings.LLM_PROVIDER == "ollama" and language == "en":
        # llama3:8b's Sinhala/Tamil generation is unreliable (garbled output in
        # testing), so local-model replies are restricted to English; si/ta
        # fall through to the accurate, pre-translated rule-based answers.
        reply = _llm_reply_ollama(message, language, history)

    if reply:
        return reply, "llm"
    return rule_based_reply(message, language), "rule_based"
