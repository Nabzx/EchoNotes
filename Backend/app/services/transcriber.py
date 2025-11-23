"""
DEPRECATED: This module is no longer used.
We have switched from server-side audio transcription (Whisper) to browser-side transcription (Web Speech API).
This file is kept for reference but is not imported or used anywhere in the active codebase.
"""

import os
import tempfile
# from faster_whisper import WhisperModel  # Commented out - no longer needed
from dotenv import load_dotenv

load_dotenv()

WHISPER_MODEL_SIZE = os.getenv("WHISPER_MODEL_SIZE", "small")

# DEPRECATED: Model loading removed - we no longer use Whisper
# model = WhisperModel(WHISPER_MODEL_SIZE, device="cpu", compute_type="int8")


def transcribe_chunk(audio_bytes: bytes) -> str:
    """
    Transcribe a chunk of audio bytes using faster-whisper.

    For simplicity, we assume the frontend sends small WAV/WEBM chunks.
    We dump bytes to a temp file and transcribe that.
    """
    if not audio_bytes:
        return ""

    with tempfile.NamedTemporaryFile(suffix=".wav", delete=True) as tmp:
        tmp.write(audio_bytes)
        tmp.flush()
        segments, _ = model.transcribe(tmp.name, beam_size=1)
        text_parts = [seg.text.strip() for seg in segments if seg.text.strip()]
        return " ".join(text_parts).strip()
