# Realtime Voice Agent + Avatar + RAG
An enterprise-grade real-time voice AI agent with a photorealistic avatar, powered by **LiveKit Agents**, with a **RAG knowledge base** for intelligent document Q&A.


<img width="715" height="447" alt="Screenshot From 2026-06-07 13-24-45" src="https://github.com/user-attachments/assets/4104ee38-fb38-4488-aa5a-8543887a06fd" />



---

## Overview

This project combines three powerful components into one integrated system:

- **Voice Agent** — A real-time conversational AI agent with voice-in/voice-out using LiveKit, supporting interruptions, turn detection, noise cancellation, and a Tavus photorealistic avatar.
- **RAG Knowledge Base** — A Retrieval-Augmented Generation pipeline that ingests PDF documents (text + tables), builds a FAISS vector index, retrieves relevant chunks with cross-encoder reranking, and answers via LLM.
- **Modern Frontend** — A Next.js 15 app with real-time audio visualizers, video/screen-sharing support, and a polished UI with dark/light themes.

---

## Features

### Voice Agent
- **Real-time voice conversation** — talk naturally with the agent using Deepgram STT + Cartesia TTS + GPT-4.1
- **Photorealistic avatar** — Tavus AI avatar renders a lifelike face synced to the agent's speech
- **Intelligent turn-taking** — multilingual turn detection with adaptive interruption handling
- **Noise cancellation** — Krisp/BVC noise suppression for clean audio in any environment
- **RAG-enhanced responses** — automatically retrieves relevant document context for informed answers
- **Pre-connect audio buffer** — instant audio playback while the agent loads
- **Thinking sounds** — background audio cues during processing for a natural feel

### RAG Pipeline
- **PDF ingestion** — text extraction via PyMuPDF, table extraction via Camelot
- **Semantic chunking** — configurable chunk size/overlap with RecursiveCharacterTextSplitter
- **Vector search** — FAISS index with MMR retrieval for diverse, relevant results
- **Cross-encoder reranking** — Sentence-Transformers CrossEncoder for precision ranking
- **LLM-powered answers** — Google Gemini or OpenAI models with source citations
- **Query caching** — in-memory cache for repeated queries
- **FastAPI REST API** — health, ingest, and query endpoints with CORS support

### Frontend
- **5 audio visualizer styles** — bar, grid, radial, wave, and aura
- **Camera & screen sharing** — full video and screen capture support
- **Dark/light themes** — system preference detection with manual toggle
- **Agent dispatch** — connects to the correct agent via LiveKit's agent dispatch
- **Customizable branding** — colors, logos, text, and accents via config

---

## Tech Stack

### Voice Agent
| Layer | Technology |
|-------|-----------|
| Agent Framework | [LiveKit Agents](https://github.com/livekit/agents) |
| Speech-to-Text | Deepgram Nova-3 (multi-language) |
| LLM | OpenAI GPT-4.1 Nano |
| Text-to-Speech | Cartesia Sonic 3 |
| Voice Activity Detection | Silero VAD |
| Turn Detection | MultilingualModel |
| Noise Cancellation | Krisp BVC / LiveKit Plugins |
| Avatar | [Tavus](https://www.tavus.io) (photorealistic AI avatar) |

### RAG Pipeline
| Component | Technology |
|-----------|-----------|
| Document Loading | PyMuPDF, Camelot |
| Embeddings | Sentence-Transformers (all-MiniLM-L6-v2) |
| Vector Store | FAISS (MMR retrieval) |
| Reranker | Cross-Encoder (ms-marco-MiniLM-L6-v2) |
| LLM | Google Gemini 3 Flash / OpenAI Codex |
| API Framework | FastAPI, Uvicorn |

### Frontend
| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (Turbopack) |
| UI Library | React 19, shadcn/ui, Radix UI |
| Styling | Tailwind CSS v4, Motion |
| LiveKit SDK | @livekit/components-react, livekit-client |
| Agents UI | @agents-ui (audio visualizers, controls, chat) |
| Build Tool | pnpm |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser (Next.js 15)                      │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │ Audio Viz    │  │ Chat/Control │  │ Video / Avatar    │  │
│  └─────────────┘  └──────────────┘  └───────────────────┘  │
└─────────────────────────┬───────────────────────────────────┘
                          │ WebRTC
          ┌───────────────▼───────────────────────────┐
          │          LiveKit Cloud / Server            │
          └───────────────┬───────────────────────────┘
                          │
          ┌───────────────▼───────────────────────────┐
          │         Voice Agent (Python)               │
          │                                           │
          │  STT (Deepgram) → LLM (GPT-4.1) → TTS     │
          │        → Tavus Avatar (video)              │
          │                   │                        │
          │         ┌─────────▼──────────┐            │
          │         │   RAG Client       │            │
          │         └─────────┬──────────┘            │
          └───────────────────┼───────────────────────┘
                              │ HTTP
          ┌───────────────────▼───────────────────────┐
          │     RAG Pipeline (FastAPI)                 │
          │                                           │
          │  FAISS → MMR → Reranker → LLM (Gemini)    │
          │                                           │
          │  PDF: Microsoft 2025 Annual Report         │
          └───────────────────────────────────────────┘
```

---

## Project Structure

```
├── Voice-Agent/
│   ├── Backend/
│   │   ├── agent.py              # Voice agent entry point
│   │   ├── Dockerfile            # Container build
│   │   ├── pyproject.toml        # Python dependencies
│   │   ├── uv.lock               # Lock file (uv)
│   │   ├── livekit.toml          # LiveKit project config
│   │   └── .env.local            # Environment variables
│   ├── Frontend/
│   │   ├── app/                  # Next.js pages & API routes
│   │   ├── components/           # React components (agents-ui, ui, app)
│   │   ├── app-config.ts         # App branding & feature config
│   │   └── package.json          # Node dependencies
│   └── livekit-plugins-krisp/    # Krisp noise cancellation plugin
│
├── Rag-Langchain/
│   └── Semantic-Search-Chatbot/
│       ├── Rag_Backend/
│       │   └── pipeline/
│       │       ├── rag_pipeline.py       # Standalone RAG server
│       │       ├── src/                  # Modular RAG pipeline
│       │       │   ├── ingestion/        # PDF loading, chunking, vectorstore
│       │       │   ├── retrieval/        # Embeddings, retriever, reranker
│       │       │   ├── generation/       # LLM + prompts
│       │       │   └── api/              # FastAPI routes & server
│       │       ├── config.yaml
│       │       └── faiss_index/          # Pre-built vector index
│       └── Rag_Frontend/                # TanStack React chat UI
│
├── Microsoft 2025 Annual Report.pdf     # Source document for RAG
└── README.md
```

---

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- pnpm (for frontend)
- uv (for Python dependency management, optional)
- [LiveKit Cloud](https://cloud.livekit.io) account (or self-hosted server)
- API keys for: Deepgram, OpenAI, Tavus, Google Gemini

### 1. RAG Pipeline (Knowledge Base)

```bash
# Navigate to the RAG backend
cd Rag-Langchain/Semantic-Search-Chatbot/Rag_Backend/pipeline

# Create a virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure API keys
cp .env.example .env
# Edit .env with your GOOGLE_GEMINI_API_KEY

# Start the server (auto-ingests PDF on first run)
python3 -m src.cli --server
```

The RAG API runs at `http://localhost:8000`.

### 2. Voice Agent Backend

```bash
cd Voice-Agent/Backend

# Copy and configure environment
cp .env.local.example .env.local
# Fill in your LiveKit, Tavus, and RAG_API_URL credentials

# Install dependencies (using uv)
uv sync

# Start the voice agent
uv run agent.py start
```

### 3. Frontend

```bash
cd Voice-Agent/Frontend

# Install dependencies
pnpm install

# Configure environment
cp .env.example .env.local
# Fill in your LiveKit credentials

# Start development server
pnpm dev
```

Open `http://localhost:3000` in your browser — click "Start call" to begin a conversation.

---

## Environment Variables

### Voice Agent (`.env.local`)
```env
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_api_secret
TAVUS_API_KEY=your_tavus_api_key
RAG_API_URL=http://localhost:8000
```

### RAG Pipeline (`.env`)
```env
GOOGLE_GEMINI_API_KEY=your_gemini_api_key
HF_TOKEN=your_huggingface_token   # optional
```

---

## Deployment

The voice agent backend includes a production-ready Dockerfile:

```bash
cd Voice-Agent/Backend
docker build -t voice-agent .
docker run -it --env-file .env.local voice-agent
```

---

# After all Depenedies and setup installed to run this project :

## Common Commands
```bash
### Start RAG server
cd Rag-Langchain/Semantic-Search-Chatbot/Rag_Backend/pipeline
python3 -m src.cli --server

### Run ingestion manually
python3 -m src.cli --ingest

### Query via CLI
python3 -m src.cli --query "What was Microsoft revenue in 2025?"

### Start Voice Agent
cd Voice-Agent/Backend
uv run agent.py dev

### RUn Voice AGent Frotend:
uv run agent.py dev


it run directly on lviekti cloud . 

to permanently depolyed ot olivekit cloud run this commands 
 lk depoly agent 
```

## License

MIT — built with [LiveKit](https://livekit.io), [LiveKit Agents](https://docs.livekit.io/agents), and open-source libraries.
