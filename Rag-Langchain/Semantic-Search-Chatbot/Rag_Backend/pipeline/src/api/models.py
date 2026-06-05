from pydantic import BaseModel


class QueryRequest(BaseModel):
    question: str


class SourceItem(BaseModel):
    page: int | str | None = None
    type: str | None = None
    content: str | None = None


class QueryResponse(BaseModel):
    answer: str
    sources: list[SourceItem]


class HealthResponse(BaseModel):
    status: str
    chunks: int
    tables: int
    cache_size: int


class RetrieveRequest(BaseModel):
    question: str


class ChunkItem(BaseModel):
    page: int | str | None = None
    type: str | None = None
    content: str | None = None
    score: float | None = None


class RetrieveResponse(BaseModel):
    chunks: list[ChunkItem]
    total: int


class IngestResponse(BaseModel):
    message: str
    chunks: int
    tables: int
