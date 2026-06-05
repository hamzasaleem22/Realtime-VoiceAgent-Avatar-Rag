# RAG Backend — Microsoft 2025 Annual Report

![Status: Planned](https://img.shields.io/badge/status-Planned-blue)
AIzaSyCp3yTkYnRK_FfnSeYFaLTYrfLQn1WnAew
## Architecture Overview

```
Data Source (PDF)
     ↓
PyMuPDFLoader
     ↓
RecursiveCharacterTextSplitter (chunk_size=1000, overlap=200)
     ↓
HuggingFace Embeddings (all-MiniLM-L6-v2)
     ↓
FAISS Vector Store
     ↓
MMR Retrieval (top-10)
     ↓
CrossEncoder Reranker (top-5)
     ↓
Gemini 2.0 Flash (LLM)
     ↓
Answer + Sources
     ↓
FastAPI Endpoints ← Frontend
```

## 1. Data Source

- **File**: `Microsoft 2025 Annual Report.pdf` (65 pages)
- **Format**: Structured annual report with sections (Shareholder Letter, Financial Review, Business Segments, etc.)

## 2. Loader

- **Library**: `langchain-community` → `PyMuPDFLoader` (narrative text)
- **Library**: `camelot-py[cv]` → `Camelot` (table extraction)
- **Packages**: `pymupdf` + `camelot-py[cv]` + `ghostscript`
- **Strategy**:
  - `PyMuPDFLoader` extracts full text with page metadata
  - `Camelot` extracts tables as structured DataFrames
  - Tables are formatted into readable text chunks with headers preserved
- **Output**: List of LangChain `Document` objects with `page_content` and `metadata` (page number, source, type: "text"|"table")

## 3. Document Processing & Chunking

- **Splitter**: `RecursiveCharacterTextSplitter`
- **Parameters**:
  - `chunk_size`: 1000 characters
  - `chunk_overlap`: 200 characters
  - `separators`: `["\n\n", "\n", ".", " "]`
- **Estimated Output**: ~280 chunks

## 4. Embeddings

- **Model**: `sentence-transformers/all-MiniLM-L6-v2`
- **Library**: `langchain-huggingface` → `HuggingFaceEmbeddings`
- **Dimension**: 384
- **Device**: CPU (Colab default)

## 5. Vector Database

- **Store**: FAISS (`faiss-cpu`)
- **Index type**: L2 (Euclidean distance) — default
- **Save path**: `/content/faiss_index/`
- **Persistence**: `FAISS.save_local()` / `FAISS.load_local()`

## 6. Retrieval

- **Type**: MMR (Maximal Marginal Relevance)
- **Parameters**:
  - `k`: 10 (initial fetch)
  - `fetch_k`: 20 (diversity pool)
  - `lambda_mult`: 0.5 (balance relevance vs diversity)

## 7. Reranking

- **Model**: `cross-encoder/ms-marco-MiniLM-L-6-v2`
- **Library**: `sentence-transformers` → `CrossEncoder`
- **Count**: Re-rank top-10 → keep top-5
- **Purpose**: Improve precision by scoring query-chunk relevance

## 8. LLM Generation

- **Model**: `gemini-2.0-flash`
- **Library**: `langchain-google-genai` → `ChatGoogleGenerativeAI`
- **Parameters**:
  - `temperature`: 0.2
  - `top_p`: 0.9
  - `max_output_tokens`: 1024
- **Prompt**: System prompt instructs Gemini to answer based ONLY on provided context, with source citations

## 9. API Layer (FastAPI)

| Endpoint | Method | Request | Response |
|----------|--------|---------|----------|
| `/health` | GET | — | `{"status": "ok"}` |
| `/ingest` | POST | — | `{"message": "Ingested successfully", "chunks": <count>}` |
| `/query` | POST | `{"question": "string"}` | `{"answer": "string", "sources": [{"page": int, "content": "..."}]}` |

- FastAPI runs in the Colab notebook thread
- Exposed via `colab_tunnel` / `ngrok` for frontend access
- Uses `nest-asyncio` to allow async in Jupyter

## 10. Chain (LangChain LCEL)

```
rag_chain = (
    {"context": retriever | rerank_sources, "question": RunnablePassthrough()}
    | prompt
    | llm
    | StrOutputParser()
)
```

## Packages

| Package | Version | Purpose |
|---------|---------|---------|
| langchain | latest | Core framework |
| langchain-community | latest | FAISS, loaders |
| langchain-google-genai | latest | Gemini LLM |
| langchain-huggingface | latest | HuggingFace embeddings |
| pymupdf | latest | PDF text loading |
| camelot-py[cv] | latest | PDF table extraction |
| ghostscript | system | Camelot dependency |
| faiss-cpu | latest | Vector database |
| sentence-transformers | latest | Embeddings + CrossEncoder |
| google-generativeai | latest | Gemini SDK |
| fastapi | latest | API layer |
| uvicorn | latest | ASGI server |
| nest-asyncio | latest | Async in Jupyter |
| python-dotenv | latest | API key management |

## Evaluation

- **Qualitative**: Manual spot-check with 5-10 sample questions
- **Metrics**: Relevancy of returned chunks, answer accuracy, latency
- **Monitor**: Log query times, chunk counts, and source pages

langchain
langchain-community
langchain-google-genai
langchain-huggingface
pymupdf
faiss-cpu






I've reviewed your code. It's a solid foundation, but here's a comprehensive breakdown of what's lacking for production:

---

## 🔴 Critical Issues

### 1. Model reloads on every `--query` run
```python
# PROBLEM: Every CLI run re-loads embeddings + reranker + LLM from scratch
# because Python process exits after each query

# FIX: Use the FastAPI server instead — models load once at startup
# via lifespan(), then stay in memory for all requests
```
**Action:** Stop using `--query` flag. Always use `--server` + curl/requests.

---

### 2. Wrong Gemini model name
```python
# PROBLEM:
model="gemini-3-flash-preview"  # this model doesn't exist

# FIX:
model="gemini-1.5-flash"        # or "gemini-1.5-pro"
```

---

### 3. Global mutable state — not thread-safe
```python
# PROBLEM: All these are module-level globals
embeddings = None
vectorstore = None
retriever = None
reranker_model = None
llm = None
chunks = []
table_docs = []

# Under concurrent requests, these can be overwritten mid-request
# FIX: Wrap in a singleton class
class RAGService:
    def __init__(self):
        self.embeddings = None
        self.vectorstore = None
        self.retriever = None
        self.reranker = None
        self.llm = None

rag_service = RAGService()
```

---

### 4. No error handling anywhere
```python
# PROBLEM: Any failure crashes silently or with unhandled exception
def rag_pipeline(question):
    retrieved = retriever.invoke(question)  # crashes if retriever is None
    ...

# FIX:
def rag_pipeline(question):
    if retriever is None:
        raise RuntimeError("Retriever not initialized. Run ingestion first.")
    try:
        retrieved = retriever.invoke(question)
        top_docs = rerank_docs(question, retrieved, top_k=5)
        ...
    except Exception as e:
        logger.error(f"RAG pipeline failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
```

---

### 5. API key exposed in code path
```python
# PROBLEM: Key passed directly to constructor
llm = ChatGoogleGenerativeAI(
    google_api_key=GEMINI_API_KEY,  # if .env missing, this is empty string ""
)

# FIX: Validate at startup
if not GEMINI_API_KEY:
    raise EnvironmentError("GOOGLE_GEMINI_API_KEY not set in environment")
```

---

## 🟡 Major Gaps

### 6. No logging — only print statements
```python
# PROBLEM: print() has no timestamps, levels, or log rotation
print("Reranker model loaded")

# FIX: Replace all prints with proper logging
import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    handlers=[
        logging.FileHandler("rag.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

logger.info("Reranker model loaded")
```

---

### 7. No input validation or sanitization
```python
# PROBLEM: Any string goes straight to the LLM
class QueryRequest(BaseModel):
    question: str  # no length limit, no empty check

# FIX:
from pydantic import validator

class QueryRequest(BaseModel):
    question: str

    @validator("question")
    def validate_question(cls, v):
        v = v.strip()
        if not v:
            raise ValueError("Question cannot be empty")
        if len(v) > 2000:
            raise ValueError("Question too long (max 2000 chars)")
        return v
```

---

### 8. No rate limiting
```python
# PROBLEM: /query endpoint is completely open
# Anyone can spam your Gemini API and drain your quota

# FIX: Add slowapi
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@app.post("/query")
@limiter.limit("10/minute")
async def query(request: Request, body: QueryRequest):
    ...
```

---

### 9. Camelot table extraction is fragile
```python
# PROBLEM: Falls back silently, no accuracy check
tables = camelot.read_pdf(PDF_PATH, pages="all", flavor="lattice")
if tables.n == 0:
    tables = camelot.read_pdf(PDF_PATH, pages="all", flavor="stream")

# FIX: Check accuracy score per table
for table in tables:
    accuracy = table.parsing_report["accuracy"]
    if accuracy < 80:
        logger.warning(f"Low accuracy table on page {table.parsing_report['page']}: {accuracy}%")
        continue  # skip bad tables
    table_docs.append(...)
```

---

### 10. `/ingest` endpoint has no authentication
```python
# PROBLEM: Anyone can POST /ingest and trigger a full re-index
@app.post("/ingest")
async def ingest():
    result = ingest_pipeline()  # expensive, destructive operation

# FIX: Add API key auth
from fastapi.security import APIKeyHeader

API_KEY = os.getenv("INGEST_API_KEY")
api_key_header = APIKeyHeader(name="X-API-Key")

@app.post("/ingest")
async def ingest(key: str = Depends(api_key_header)):
    if key != API_KEY:
        raise HTTPException(status_code=403, detail="Forbidden")
    ...
```

---

## 🟢 Nice-to-Have Improvements

### 11. No async in pipeline — blocks the event loop
```python
# PROBLEM: retriever.invoke() and llm.invoke() are synchronous
# They block FastAPI's async event loop under load

# FIX: Use async versions
async def rag_pipeline(question):
    retrieved = await retriever.ainvoke(question)
    response = await llm.ainvoke(messages)
```

---

### 12. No caching for repeated queries
```python
# FIX: Cache with TTL
from functools import lru_cache
import hashlib

query_cache = {}

def rag_pipeline(question):
    cache_key = hashlib.md5(question.encode()).hexdigest()
    if cache_key in query_cache:
        logger.info("Cache hit")
        return query_cache[cache_key]
    
    result = ... # run pipeline
    query_cache[cache_key] = result
    return result
```

---

### 13. No health check details
```python
# PROBLEM: /health doesn't tell you if models are actually ready
@app.get("/health")
async def health():
    return {"status": "ok"}  # says ok even if LLM failed to load

# FIX:
@app.get("/health")
async def health():
    return {
        "status": "ok",
        "vectorstore_ready": vectorstore is not None,
        "reranker_ready": reranker_model is not None,
        "llm_ready": llm is not None,
        "indexed_chunks": vectorstore.index.ntotal if vectorstore else 0,
    }
```

---

## Summary Checklist

| # | Issue | Severity |
|---|---|---|
| 1 | Models reload every CLI run | 🔴 Critical |
| 2 | Wrong Gemini model name | 🔴 Critical |
| 3 | Global state not thread-safe | 🔴 Critical |
| 4 | No error handling | 🔴 Critical |
| 5 | API key not validated | 🔴 Critical |
| 6 | No structured logging | 🟡 Major |
| 7 | No input validation | 🟡 Major |
| 8 | No rate limiting | 🟡 Major |
| 9 | Fragile table extraction | 🟡 Major |
| 10 | Unprotected /ingest endpoint | 🟡 Major |
| 11 | Sync calls block event loop | 🟢 Nice-to-have |
| 12 | No query caching | 🟢 Nice-to-have |
| 13 | Weak health check | 🟢 Nice-to-have |

---

Want me to rewrite the full `rag_pipeline.py` with all these fixes applied?