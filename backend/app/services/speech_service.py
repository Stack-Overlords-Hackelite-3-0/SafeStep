import logging
import tempfile
from functools import lru_cache
from pathlib import Path

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

# Whisper's language codes match SafeStep's (en/si/ta), so no mapping needed.
_SUPPORTED_LANGUAGES = {"en", "si", "ta"}


@lru_cache
def _get_model():
    from faster_whisper import WhisperModel

    return WhisperModel(
        settings.WHISPER_MODEL_SIZE,
        device=settings.WHISPER_DEVICE,
        compute_type=settings.WHISPER_COMPUTE_TYPE,
    )


def transcribe_audio(audio_bytes: bytes, filename: str, language: str) -> str:
    """Transcribes an uploaded audio clip to text using a local Whisper model."""
    model = _get_model()
    language = language if language in _SUPPORTED_LANGUAGES else None

    suffix = Path(filename).suffix or ".webm"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(audio_bytes)
        tmp_path = tmp.name

    try:
        segments, _info = model.transcribe(tmp_path, language=language)
        return " ".join(segment.text.strip() for segment in segments).strip()
    finally:
        Path(tmp_path).unlink(missing_ok=True)
