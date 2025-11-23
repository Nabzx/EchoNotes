# EchoNotes

EchoNotes is a real-time accessibility tool that helps students with dyslexia, dysgraphia, dyscalculia, and hearing impairments understand lectures better.

## Features

- **Live Transcription**: Uses browser's Web Speech API to transcribe speech in real-time
- **Simple Text**: Simplified explanations for students with dyslexia
- **Detailed Steps**: Step-by-step explanations for students with dyscalculia
- **Hearing Support**: Context and notes for students with hearing impairments
- **Accessibility Customization**: Font sizes, colors, overlays, and more

## Architecture

- **Frontend**: Next.js with Web Speech API for browser-side transcription
- **Backend**: FastAPI with WebSocket endpoints for real-time communication
- **Worker**: Python worker that listens to Redis streams and calls Ollama for summarization
- **Storage**: Redis streams for transcript and summary data

## Prerequisites

- Python 3.11+ with virtual environment
- Node.js 18+ and npm/pnpm/yarn
- Redis running locally (default: localhost:6379)
- Ollama running locally with a model (default: phi3 at http://localhost:11434)

## Setup

### 1. Backend Setup

```bash
# Activate virtual environment
source venv/bin/activate

# Install dependencies
cd Backend
pip install -r requirements.txt
```

### 2. Frontend Setup

```bash
cd Frontend
npm install  # or pnpm install / yarn install
```

### 3. Environment Variables (Optional)

Create `Frontend/.env.local` if you need to customize backend URLs:

```env
NEXT_PUBLIC_BACKEND_WS=ws://localhost:8000
NEXT_PUBLIC_BACKEND_HTTP=http://localhost:8000
```

Backend environment variables (in `.env` at project root or Backend/):

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
OLLAMA_URL=http://localhost:11434/api/generate
OLLAMA_MODEL=phi3
ALLOWED_ORIGINS=http://localhost:3000
```

## Running the Application

### 1. Start Redis

```bash
redis-server
```

### 2. Start Ollama

Make sure Ollama is running with your model:

```bash
ollama serve
# In another terminal, pull the model if needed:
ollama pull phi3
```

### 3. Start Backend

```bash
source venv/bin/activate
cd Backend
uvicorn app.main:app --reload
```

The backend will be available at `http://localhost:8000`

### 4. Start Summariser Worker

In a new terminal:

```bash
source venv/bin/activate
cd Backend
python -m app.workers.summariser_worker --session-id demo
```

### 5. Start Frontend

In another terminal:

```bash
cd Frontend
npm run dev
```

The frontend will be available at `http://localhost:3000`

## Usage

1. Open `http://localhost:3000` in **Chrome** or **Edge** (Web Speech API support required)
2. Click "Start Live Notes"
3. Allow microphone access when prompted
4. Start speaking (or have someone speak)
5. Watch as:
   - Live transcript appears in real-time
   - Simple text summaries update for dyslexia-friendly reading
   - Detailed step-by-step explanations appear for dyscalculia support
   - Context notes appear for hearing impairment support

## Architecture Details

### WebSocket Endpoints

- `ws://localhost:8000/ws/transcript/{session_id}` - Receives text chunks from frontend
- `ws://localhost:8000/ws/summary/{session_id}` - Sends summaries to frontend

### Redis Streams

- `transcript:session:{session_id}` - Stores transcript text chunks
- `summary:session:{session_id}` - Stores generated summaries

### Data Flow

1. Browser uses Web Speech API → transcribes speech to text
2. Frontend sends text chunks → Backend WebSocket → Redis stream
3. Summariser worker reads transcript stream → calls Ollama → writes summaries to Redis
4. Backend WebSocket reads summaries → sends to frontend
5. Frontend displays summaries in real-time

## Development Notes

- The old audio transcription pipeline (Whisper) has been deprecated
- `Backend/app/services/transcriber.py` and `Backend/app/workers/transcription_worker.py` are marked as unused
- All transcription now happens in the browser using Web Speech API
- The summariser worker maintains a rolling buffer (last 2000 characters) for context

## Troubleshooting

- **Web Speech API not working**: Make sure you're using Chrome or Edge
- **Microphone permission denied**: Check browser settings and allow microphone access
- **No summaries appearing**: Check that the summariser worker is running and Ollama is accessible
- **WebSocket connection errors**: Verify backend is running and CORS is configured correctly

## License

This is a hackathon project.
