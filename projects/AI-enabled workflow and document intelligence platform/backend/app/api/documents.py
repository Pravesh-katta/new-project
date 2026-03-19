from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user_email
from app.db.session import get_db
from app.models.document import Document
from app.models.workflow import Workflow
from app.schemas.document import DocumentRead, DocumentSearchResult, DocumentUploadResponse
from app.services.search import SearchService
from app.services.storage import StorageService
from app.tasks.document_tasks import parse_and_index_document


router = APIRouter(prefix="/documents", tags=["documents"])


@router.post("/upload", response_model=DocumentUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    workflow_id: str | None = None,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_user_email),
) -> DocumentUploadResponse:
    if workflow_id:
        workflow = db.get(Workflow, workflow_id)
        if not workflow:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workflow not found")

    content = await file.read()
    if not content:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded file is empty")

    storage = StorageService()
    object_key = storage.save_bytes(file.filename, content)
    document = Document(
        workflow_id=workflow_id,
        filename=file.filename,
        object_key=object_key,
        status="uploaded",
    )
    db.add(document)
    db.commit()
    db.refresh(document)

    task_result = parse_and_index_document.delay(document.id)
    return DocumentUploadResponse(document=document, task_id=task_result.id)


@router.get("", response_model=list[DocumentRead])
def list_documents(
    workflow_id: str | None = None,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_user_email),
) -> list[Document]:
    stmt = select(Document).order_by(Document.created_at.desc())
    if workflow_id:
        stmt = stmt.where(Document.workflow_id == workflow_id)
    return db.scalars(stmt).all()


@router.get("/search/query", response_model=list[DocumentSearchResult])
def search_documents(
    query: str = Query(..., min_length=2),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    _: str = Depends(get_current_user_email),
) -> list[DocumentSearchResult]:
    search = SearchService()
    hits = search.search(query, limit=limit)
    if hits:
        return [DocumentSearchResult(**item) for item in hits]

    # DB text fallback for local/dev if OpenSearch is not configured.
    rows = db.scalars(
        select(Document)
        .where(Document.extracted_text.is_not(None))
        .where(Document.extracted_text.ilike(f"%{query}%"))
        .order_by(Document.updated_at.desc())
        .limit(limit)
    ).all()
    result: list[DocumentSearchResult] = []
    for row in rows:
        snippet = None
        if row.extracted_text:
            idx = row.extracted_text.lower().find(query.lower())
            if idx >= 0:
                start = max(0, idx - 40)
                end = min(len(row.extracted_text), idx + len(query) + 40)
                snippet = row.extracted_text[start:end]
        result.append(DocumentSearchResult(id=row.id, filename=row.filename, score=1.0, snippet=snippet))
    return result


@router.get("/{document_id}", response_model=DocumentRead)
def get_document(
    document_id: str,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_user_email),
) -> Document:
    document = db.get(Document, document_id)
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    return document


@router.post("/{document_id}/reindex", status_code=status.HTTP_202_ACCEPTED)
def reindex_document(
    document_id: str,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_user_email),
) -> dict:
    document = db.get(Document, document_id)
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    task_result = parse_and_index_document.delay(document_id)
    return {"message": "Reindex queued", "task_id": task_result.id}
