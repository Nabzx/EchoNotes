import asyncio
import os
from typing import List

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.core.redis_client import redis_client
from app.models import UserSettings

ALLOWED_ORIGINS_ENV = os.getenv("ALLOWED_ORIGINS", "*")

app = FastAPI(title="EchoNotes Backend", version="0.1.0")

# CORS (for Next.js frontend)
origins: List[str]
if ALLOWED_ORIGINS_ENV == "*":
    origins = ["*"]
else:
    origins = [o.strip() for o in ALLOWED_ORIGINS_ENV.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    try:
        redis_client.ping()
        redis_ok = True
    except Exception:
        redis_ok = False
    return {"status": "ok", "redis": redis_ok}


@app.post("/settings/{session_id}")
async def set_settings(session_id: str, settings: UserSettings):
    key = f"settings:session:{session_id}"
    mapping = {
        "difficulty": settings.difficulty,
        "profile": ",".join(settings.profile),
    }
    redis_client.hset(key, mapping=mapping)
    return {"status": "ok"}


@app.get("/settings/{session_id}")
async def get_settings(session_id: str):
    key = f"settings:session:{session_id}"
    data = redis_client.hgetall(key)
    if not data:
        raise HTTPException(status_code=404, detail="Settings not found")

    decoded = {k.decode("utf-8"): v.decode("utf-8") for k, v in data.items()}
    profile_str = decoded.get("profile", "")
    profile_list = [p for p in profile_str.split(",") if p]

    return {
        "difficulty": decoded.get("difficulty", "simple"),
        "profile": profile_list,
    }


@app.websocket("/ws/audio/{session_id}")
async def audio_websocket(websocket: WebSocket, session_id: str):
    """
    Receives binary audio chunks from the frontend and pushes them to Redis.
    Frontend should send small chunks as binary (ArrayBuffer).
    """
    await websocket.accept()
    stream_key = f"audio:session:{session_id}"

    try:
        while True:
            audio_bytes = await websocket.receive_bytes()
            redis_client.xadd(stream_key, {"chunk": audio_bytes})
    except WebSocketDisconnect:
        # Client disconnected
        pass
    except Exception:
        # Non-websocket error; just close connection
        await websocket.close()


@app.websocket("/ws/summary/{session_id}")
async def summary_websocket(websocket: WebSocket, session_id: str):
    """
    Streams accessibility-focused summaries to the frontend as JSON:
    {
      "simple_text": "...",
      "expanded_text": "...",
      "notes_for_hearing": "..."
    }
    """
    await websocket.accept()
    stream_key = f"summary:session:{session_id}"
    last_id = "0-0"

    try:
        while True:
            # Run blocking Redis xread in a thread
            resp = await asyncio.to_thread(
                redis_client.xread,
                {stream_key: last_id},
                10,      # count
                5000,    # block (ms)
            )

            if not resp:
                continue

            _, messages = resp[0]
            for msg_id, fields in messages:
                last_id = msg_id
                try:
                    payload = {
                        "simple_text": fields[b"simple_text"].decode("utf-8"),
                        "expanded_text": fields[b"expanded_text"].decode("utf-8"),
                        "notes_for_hearing": fields[b"notes_for_hearing"].decode("utf-8"),
                    }
                except KeyError:
                    # Skip malformed entries
                    continue

                await websocket.send_json(payload)

    except WebSocketDisconnect:
        pass
    except Exception:
        await websocket.close()

