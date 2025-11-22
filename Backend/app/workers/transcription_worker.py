import argparse
import logging
import time

from app.core.redis_client import redis_client
from app.services.transcriber import transcribe_chunk

logging.basicConfig(
    level=logging.INFO,
    format="[TRANSCRIPTION] %(asctime)s - %(levelname)s - %(message)s",
)


def run_transcription_worker(session_id: str) -> None:
    stream_key = f"audio:session:{session_id}"
    out_key = f"transcript:session:{session_id}"
    last_id = "0-0"

    logging.info(f"Transcription worker started for session '{session_id}'")
    logging.info(f"Listening on Redis stream: {stream_key}")

    while True:
        try:
            # Block up to 5 seconds for new messages
            resp = redis_client.xread({stream_key: last_id}, count=10, block=5000)
            if not resp:
                continue

            _, messages = resp[0]
            for msg_id, fields in messages:
                last_id = msg_id

                audio_bytes = fields.get(b"chunk")
                if not audio_bytes:
                    continue

                text = transcribe_chunk(audio_bytes)
                if not text:
                    continue

                logging.info(f"Transcribed chunk for session {session_id}: {text[:80]}...")

                redis_client.xadd(
                    out_key,
                    {"text": text.encode("utf-8")},
                )

        except Exception as e:
            logging.exception(f"Error in transcription worker: {e}")
            time.sleep(2)


def main() -> None:
    parser = argparse.ArgumentParser(description="Transcription worker for EchoNotes")
    parser.add_argument(
        "--session-id",
        required=True,
        help="Session ID to process (must match frontend WebSocket session_id)",
    )
    args = parser.parse_args()
    run_transcription_worker(args.session_id)


if __name__ == "__main__":
    main()
