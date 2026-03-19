from datetime import datetime

from pydantic import BaseModel, ConfigDict


class DocumentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    workflow_id: str | None
    filename: str
    object_key: str
    status: str
    extracted_text: str | None
    created_at: datetime
    updated_at: datetime


class DocumentUploadResponse(BaseModel):
    document: DocumentRead
    task_id: str | None = None


class DocumentSearchResult(BaseModel):
    id: str
    filename: str
    score: float
    snippet: str | None
