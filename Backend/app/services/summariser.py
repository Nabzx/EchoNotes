import os
import json
from typing import Dict, Any

import requests
from dotenv import load_dotenv

load_dotenv()

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434/api/generate")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "phi3")


def build_prompt(transcript: str) -> str:
    return f"""
You are an AI assistant helping students with learning disabilities and hearing impairments understand university lectures.

Rewrite the provided transcript segment into the following JSON format ONLY:

{{
  "simple_text": "very simple explanation using short sentences and easy words (good for dyslexia).",
  "expanded_text": "step-by-step explanation with examples and slow pacing (good for dyscalculia).",
  "notes_for_hearing": "explain context, emphasis, and any information a hearing-impaired student might miss."
}}

Rules:
- Do NOT add extra keys.
- Do NOT output anything except valid JSON.
- No markdown.

Transcript:
{transcript}
""".strip()


def summarize_for_accessibility(transcript: str) -> Dict[str, str]:
    """
    Call the local Ollama model to get simplified + expanded + hearing notes.
    Expects Ollama to be running locally at OLLAMA_URL.
    """
    if not transcript.strip():
        return {
            "simple_text": "",
            "expanded_text": "",
            "notes_for_hearing": "",
        }

    prompt = build_prompt(transcript)

    payload: Dict[str, Any] = {
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "stream": False,
    }

    response = requests.post(OLLAMA_URL, json=payload, timeout=120)
    response.raise_for_status()
    data = response.json()

    # For /api/generate with stream=false, Ollama returns a "response" field
    raw = data.get("response", "").strip()

    try:
        parsed = json.loads(raw)
        simple_text = str(parsed.get("simple_text", "")).strip()
        expanded_text = str(parsed.get("expanded_text", "")).strip()
        notes_for_hearing = str(parsed.get("notes_for_hearing", "")).strip()
    except json.JSONDecodeError:
        # Fallback: if model didn't obey, just reuse transcript
        simple_text = transcript
        expanded_text = transcript
        notes_for_hearing = ""

    return {
        "simple_text": simple_text,
        "expanded_text": expanded_text,
        "notes_for_hearing": notes_for_hearing,
    }
