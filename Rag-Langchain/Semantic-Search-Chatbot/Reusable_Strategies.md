# RAG Pipeline — Reusable Strategies for Accurate Answers

## 1. Chunking Strategy

### Recursive Character Text Splitting
- **Chunk Size:** 1500 characters (avoids mid-sentence/paragraph truncation)
- **Chunk Overlap:** 250 characters (smooth boundary coverage for figures that span splits)
- **Separators (priority order):** `\n\n` → `\n` → `.` → ` ` (preserves natural paragraph/sentence boundaries)

### Table Cleaning Before Chunking
- Remove timestamp rows (`5/31/26, 11:20 PM`)
- Remove page header/footer artifacts (`Microsoft 2025 Annual Report`, URLs)
- Drop completely empty rows and noise-only rows
- Suppress DataFrame column indices (`header=False` in `to_string()`)
- Skip tables that become empty after cleaning

## 2. Multi-Modal Document Extraction

- **Text:** `PyMuPDFLoader` — extracts narrative content page-by-page
- **Tables:** `Camelot` with lattice → stream fallback — converts table cells to structured text
- Merge both types into a unified document list before chunking
- Tag each document's metadata with `type: text` or `type: table` for downstream routing

## 3. Embedding & Vector Store

- **Model:** `sentence-transformers/all-MiniLM-L6-v2` (384-dim, fast, local)
- **Normalization:** `normalize_embeddings=True` (cosine similarity compatible)
- **Index:** FAISS (CPU) — fast approximate nearest neighbor search
- **Device:** CPU (no GPU dependency)

## 4. Retrieval Strategy

### MMR (Maximum Marginal Relevance)
- **k=10** (initial fetch)
- **fetch_k=20** (candidate pool)
- **lambda_mult=0.5** (balance of relevance vs diversity)
- Prevents duplicate/similar chunks from flooding the context window

### Cross-Encoder Reranking
- **Model:** `cross-encoder/ms-marco-MiniLM-L-6-v2`
- Re-ranks top 10 → top 5 with precise query-document relevance scoring
- Acts as a second-pass filter after fast embedding retrieval

## 5. Generation Strategy

### LLM Configuration
- **Model:** Gemini (configurable provider)
- **Temperature:** 0.2 (low — favors factual extraction over creativity)
- **top_p:** 0.9
- **max_output_tokens:** 4096

### Prompt Design
- **System prompt:** Strict instruction to answer ONLY from provided context
- **Fallback:** "I cannot find this information in the document" when answer is absent
- **Source citation:** Request page numbers from metadata
- **Context formatting:** Each source tagged with `[Source N] (Page X, Type: Y)` for traceability

## 6. Caching

- **Backend:** In-memory (configurable to diskcache)
- **TTL:** 3600 seconds
- **Max size:** 100 entries
- Avoids redundant LLM calls for repeated queries

## 7. Monitoring & Debugging

- Top-5 retrieval can run **without LLM API keys** (all local — embeddings + reranker)
- Source-level output shows page, type, and content for each retrieved chunk
- Health endpoint exposes chunk count and table count

## 8. Parameter Configuration

All tunable parameters live in `config.yaml`:
- `chunking.chunk_size`, `chunking.chunk_overlap`
- `embeddings.model`, `embeddings.device`
- `retriever.k`, `retriever.fetch_k`, `retriever.lambda_mult`
- `reranker.model`, `reranker.top_k`
- `llm.model`, `llm.temperature`, `llm.max_output_tokens`
- `cache.ttl_seconds`, `cache.max_size`

## 9. Best Practices Verified

- Larger chunk size (1500) prevents mid-fact truncation
- Table noise filtering prevents garbage-in-garbage-out
- MMR + reranker combination outperforms plain similarity search
- Low temperature (0.2) forces factual adherence in generation
- Explicit "I cannot find this" fallback prevents hallucination
