# Project: Microsoft Report Voice Agent + RAG

## Project Structure
```
Microsof_Report_VoiceAgent_Rag/
├── Rag-Langchain/
│   └── Semantic-Search-Chatbot/
│       ├── Rag_Backend/pipeline/       # RAG server (FastAPI + LangChain)
│       │   ├── src/
│       │   │   ├── api/                # FastAPI routes (routes.py, server.py, models.py)
│       │   │   ├── ingestion/          # PDF loading, chunking, FAISS index
│       │   │   ├── retrieval/          # MMR retriever, CrossEncoder reranker
│       │   │   ├── generation/         # LLM client + prompt templates
│       │   │   ├── pipeline.py         # Query/ingest orchestrator
│       │   │   ├── cache.py            # LRU query cache
│       │   │   ├── config.py           # Pydantic config from config.yaml
│       │   │   └── cli.py              # --server, --query, --ingest, --repl
│       │   ├── config.yaml             # Runtime config (LLM, embeddings, server)
│       │   ├── faiss_index/            # Pre-built FAISS vector index (534 chunks)
│       │   ├── pyproject.toml          # Dependencies
│       │   └── .env                    # API keys
│       └── Rag_Frontend/               # Next.js RAG chatbot frontend
├── Voice-Agent/
│   ├── Backend/
│   │   ├── agent.py                    # LiveKit voice agent (DefaultAgent)
│   │   ├── pyproject.toml              # livekit-agents deps
│   │   ├── .env.local                  # LiveKit, Tavus, RAG API keys
│   │   └── livekit.toml                # LiveKit project config
│   ├── Frontend/                       # Next.js voice agent frontend
│   └── livekit-plugins-krisp/          # Custom noise cancellation plugin
├── Microsoft 2025 Annual Report.pdf    # Source document (1.6MB, 167 pages)
├── memory.md                           # Previous project memory (read-only)
├── final-plan.md                       # Implementation plan
└── opencode.md                         # This file (session memory)
```

## RAG Server Status
- **Running**: PID 31677, port 8000
- **FAISS Index**: 534 vectors from Microsoft 2025 Annual Report
- **LLM**: OpenAI-compatible at `http://localhost:20128/v1` (model: `cx/gpt-5.5`)
- **Embeddings**: `sentence-transformers/all-MiniLM-L6-v2` (CPU)
- **Reranker**: `cross-encoder/ms-marco-MiniLM-L-6-v2`

### API Endpoints
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Health check (chunks, cache size) |
| `/ingest` | POST | Rebuild FAISS index from PDF |
| `/retrieve` | POST | Return relevant chunks only (no LLM) |
| `/query` | POST | Full RAG answer with LLM |

### Config (config.yaml)
- Chunk size: 1500, overlap: 250
- Retriever: MMR (k=10, fetch_k=20, lambda_mult=0.5)
- Reranker top_k: 5
- Server: 0.0.0.0:8000
- Prompt: voice-optimized (1-3 sentence answers)

## Voice Agent Config
- STT: Deepgram Nova-3
- LLM: OpenAI GPT-4.1-nano
- TTS: Cartesia Sonic-3
- VAD: Silero VAD
- Avatar: Tavus
- Noise Cancellation: BVC

## Architecture: Two-Tier RAG
1. **Tier 1 (Fast)**: `on_user_turn_completed` -> `POST /retrieve` -> context injection (~160ms)
2. **Tier 2 (Deep)**: `@function_tool query_documents` -> `POST /query` -> full RAG (~1-2s)

## Common Commands
```bash
# Start RAG server
cd Rag-Langchain/Semantic-Search-Chatbot/Rag_Backend/pipeline
python3 -m src.cli --server

# Run ingestion manually
python3 -m src.cli --ingest

# Query via CLI
python3 -m src.cli --query "What was Microsoft revenue in 2025?"

# Start Voice Agent
cd Voice-Agent/Backend
uv run agent.py dev
```

## Issues Found & Fixed
- **Broken PDF symlink**: symlink pointed to old path `/home/hamza/Desktop/Voice-Avator-Agent/...` - fixed to point to `/home/hamza/Desktop/Microsof_Report_VoiceAgent_Rag/Microsoft 2025 Annual Report.pdf`

## Notes
- `python` command not available, use `python3` (Python 3.14.4)
- RAG server takes ~30s to start (downloads embedding/reranker models on first run)
- The `.env` file has OPENAI_API_KEY set for the local LLM endpoint
- Session 2026-06-07: Server started and verified (health, retrieve, query all working)
