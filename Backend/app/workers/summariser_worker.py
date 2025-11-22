import argparse
import logging
import time

from app.core.redis_client import redis_client
from app.services.summariser import summarize_for_accessibility

logging.basicConfig(
    level=logging.INFO,
    format="[SUMMARISER] %(asctime)s - %(levelname)s - %(message)s",
)


def run_summariser_worker(session_id: str) -> None:
    transcript_key = f"transcript:session:{session_id}"
    summary_key = f"summary:session:{session_id}"
    last_id = "0-0"

    logging.info(f"Summariser worker started for session '{session_id}'")
    logging.info(f"Listening on Redis stream: {transcript_key}")

    rolling_buffer = ""

    MAX_CHARS = 2000  # roughly last 2–3 minutes depending on speech rate

    while True:
        try:
            resp = redis_client.xread({transcript_key: last_id}, count=10, block=5000)
            if not resp:
                continue

            _, messages = resp[0]
            for msg_id, fields in messages:
                last_id = msg_id
                text_bytes = fields.get(b"text")
                if not text_bytes:
                    continue

                new_text = text_bytes.decode("utf-8").strip()
                if not new_text:
                    continue

                # Update rolling buffer
                rolling_buffer = (rolling_buffer + " " + new_text).strip()
                if len(rolling_buffer) > MAX_CHARS:
                    rolling_buffer = rolling_buffer[-MAX_CHARS:]

                logging.info(
                    f"Summarising buffer for session {session_id} (len={len(rolling_buffer)})"
                )

                summary = summarize_for_accessibility(rolling_buffer)

                redis_client.xadd(
                    summary_key,
                    {
                        "simple_text": summary["simple_text"].encode("utf-8"),
                        "expanded_text": summary["expanded_text"].encode("utf-8"),
                        "notes_for_hearing": summary["notes_for_hearing"].encode("utf-8"),
                    },
                )

        except Exception as e:
            logging.exception(f"Error in summariser worker: {e}")
            time.sleep(2)


def main() -> None:
    parser = argparse.ArgumentParser(description="Summariser worker for EchoNotes")
    parser.add_argument(
        "--session-id",
        required=True,
        help="Session ID to process (must match frontend WebSocket session_id)",
    )
    args = parser.parse_args()
    run_summariser_worker(args.session_id)


if __name__ == "__main__":
    main()
