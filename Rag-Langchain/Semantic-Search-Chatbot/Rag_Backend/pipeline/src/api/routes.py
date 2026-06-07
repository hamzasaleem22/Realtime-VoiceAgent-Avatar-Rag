import logging
from fastapi import APIRouter, HTTPException
from src.cache import cache
from src.pipeline import ingest, query, retrieve_only, is_indexed
from src.api.models import (
    QueryRequest,
    QueryResponse,
    RetrieveRequest,
    RetrieveResponse,
    ChunkItem,
    HealthResponse,
    IngestResponse,
    SourceItem,
)

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health():
    from src.pipeline import is_indexed, get_vectorstore

    if is_indexed():
        vs = get_vectorstore()
        chunk_count = vs.index.ntotal
    else:
        chunk_count = 0

    return HealthResponse(
        status="ok",
        chunks=chunk_count,
        tables=0,
        cache_size=cache.size,
    )


@router.post("/ingest", response_model=IngestResponse)
async def ingest_endpoint():
    try:
        result = ingest()
        return IngestResponse(message="Ingested successfully", **result)
    except Exception as e:
        logger.exception("Ingestion failed")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/retrieve", response_model=RetrieveResponse)
async def retrieve_endpoint(request: RetrieveRequest):
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")
    if not is_indexed():
        raise HTTPException(status_code=400, detail="No index found. Run ingestion first.")
    try:
        result = retrieve_only(request.question)
        return RetrieveResponse(
            chunks=[ChunkItem(**c) for c in result],
            total=len(result),
        )
    except Exception as e:
        logger.exception("Retrieve failed")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/query", response_model=QueryResponse)
async def query_endpoint(request: QueryRequest):
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")
    if not is_indexed():
        raise HTTPException(status_code=400, detail="No index found. Run ingestion first.")
    try:
        result = query(request.question)
        return QueryResponse(
            answer=result["answer"],
            sources=[SourceItem(**s) for s in result["sources"]],
        )
    except Exception as e:
        logger.exception("Query failed")
        raise HTTPException(status_code=500, detail=str(e))
