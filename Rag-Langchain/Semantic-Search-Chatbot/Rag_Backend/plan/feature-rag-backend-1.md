---
goal: Build RAG Backend for Microsoft 2025 Annual Report
version: 1.0
date_created: 2026-06-02
status: 'In progress'
tags: feature, rag, backend
---

# Introduction

![Status: In progress](https://img.shields.io/badge/status-In%20progress-yellow)

Build a complete RAG backend for the Microsoft 2025 Annual Report PDF using LangChain, Google Gemini 2.0 Flash (LLM), HuggingFace all-MiniLM-L6-v2 (embeddings), FAISS (vector store), CrossEncoder (reranker), and Camelot (table extraction). Exposed via FastAPI endpoints for frontend consumption.

## 1. Requirements & Constraints

- **REQ-001**: Must ingest Microsoft 2025 Annual Report.pdf (65 pages)
- **REQ-002**: Must extract both narrative text and financial tables
- **REQ-003**: Must use Google Gemini 2.0 Flash as the LLM
- **REQ-004**: Must use HuggingFace sentence-transformers/all-MiniLM-L6-v2 for embeddings
- **REQ-005**: Must use FAISS as the vector database
- **REQ-006**: Must use MMR search for retrieval diversity
- **REQ-007**: Must use CrossEncoder reranker to improve precision
- **REQ-008**: Must expose FastAPI endpoints for frontend integration
- **REQ-009**: All code in a single Colab-compatible notebook (Rag_Backend.ipynb)

## 2. Implementation Steps

### Implementation Phase 1: Notebook Setup & Dependencies

- GOAL-001: Set up the Colab notebook with all required dependencies

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-001 | Create Rag_Backend.ipynb with installation cell (pip installs + apt-get for ghostscript) | | |
| TASK-002 | Add imports cell (langchain, FAISS, Gemini, HF, FastAPI, etc.) | | |
| TASK-003 | Add environment setup cell (GEMINI_API_KEY, paths) | | |

### Implementation Phase 2: PDF Ingestion

- GOAL-002: Load and process the PDF — both text and tables

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-004 | PyMuPDFLoader cell — extract narrative text with page metadata | | |
| TASK-005 | Camelot cell — extract tables, convert to readable text with headers | | |
| TASK-006 | Combine text + table documents into single Document list | | |
| TASK-007 | RecursiveCharacterTextSplitter cell — chunk all documents | | |

### Implementation Phase 3: Embeddings & Vector Store

- GOAL-003: Create FAISS index from chunked documents

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-008 | Initialize HuggingFaceEmbeddings with all-MiniLM-L6-v2 | | |
| TASK-009 | Create FAISS index from document chunks | | |
| TASK-010 | Save FAISS index locally | | |

### Implementation Phase 4: Reranker

- GOAL-004: Set up CrossEncoder reranker

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-011 | Initialize CrossEncoder with ms-marco-MiniLM-L-6-v2 | | |
| TASK-012 | Create rerank function that takes query + chunks → scored + sorted chunks | | |

### Implementation Phase 5: LLM & RAG Chain

- GOAL-005: Build the RAG generation chain with Gemini

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-013 | Initialize ChatGoogleGenerativeAI (gemini-2.0-flash, temp=0.2) | | |
| TASK-014 | Create RAG prompt template (system + context + question) | | |
| TASK-015 | Build LCEL chain: context → retriever → rerank → prompt → llm → output | | |

### Implementation Phase 6: FastAPI Endpoints

- GOAL-006: Expose API for frontend

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-016 | Create FastAPI app with /health endpoint | | |
| TASK-017 | Create /ingest endpoint (triggers ingestion pipeline) | | |
| TASK-018 | Create /query endpoint (question → answer + sources) | | |
| TASK-019 | Add CORS middleware for frontend access | | |
| TASK-020 | Start uvicorn server with tunnel for external access | | |

### Implementation Phase 7: Testing

- GOAL-007: Verify end-to-end functionality

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-021 | Test narrative question (e.g., "What did Satya say about AI?") | | |
| TASK-022 | Test table question (e.g., "What was Azure revenue and growth?") | | |
| TASK-023 | Test /health endpoint | | |
| TASK-024 | Test /query endpoint with sample curl | | |

## 3. Alternatives

- **ALT-001**: PDFPlumberLoader instead of PyMuPDFLoader — better for tables but slower
- **ALT-002**: ChromaDB instead of FAISS — simpler persistence but slower at scale
- **ALT-003**: No reranker — simpler but lower precision on financial queries

## 4. Dependencies

- **DEP-001**: Google Gemini API key (set as GEMINI_API_KEY environment variable)
- **DEP-002**: Internet connection (Colab runtime) for downloading models
- **DEP-003**: ghostscript system package (for Camelot)

## 5. Files

- **FILE-001**: `Pipeline/Rag_Backend.ipynb` — Main Colab notebook
- **FILE-002**: `plan.md` — Architecture design document
- **FILE-003**: `plan/feature-rag-backend-1.md` — Implementation plan

## 6. Testing

- **TEST-001**: Verify PDF loads and chunks correctly (check chunk count ~280)
- **TEST-002**: Verify FAISS index saves/loads correctly
- **TEST-003**: Verify CrossEncoder returns scored results
- **TEST-004**: Verify Gemini generates coherent answers from context
- **TEST-005**: Verify FastAPI endpoints return correct JSON responses

## 7. Risks & Assumptions

- **RISK-001**: Camelot may fail on some PDF pages if tables lack clear borders — fallback to text-only extraction
- **RISK-002**: Colab may disconnect during long-running ingestion — add checkpoint/resume logic
- **RISK-003**: Free Colab GPU memory may be insufficient for CrossEncoder + embeddings — use CPU where possible
- **ASSUMPTION-001**: Google Gemini API key is available and has quota

## 8. Related Specifications

- See `plan.md` for full architecture design
