from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.document import Document
from app.services.search import SearchService
from app.services.storage import StorageService
from app.tasks.celery_app import celery_app


@celery_app.task(name="app.tasks.document_tasks.parse_and_index_document")
def parse_and_index_document(document_id: str) -> dict:
    db: Session = SessionLocal()
    try:
        document = db.get(Document, document_id)
        if not document:
            return {"status": "not_found", "document_id": document_id}

        document.status = "indexing"
        db.commit()

        storage = StorageService()
        raw = storage.read_bytes(document.object_key)
        text = raw.decode("utf-8", errors="ignore")

        document.extracted_text = text[:200000]
        search = SearchService()
        indexed = search.index_document(
            document_id=document.id,
            filename=document.filename,
            workflow_id=document.workflow_id,
            content=document.extracted_text,
        )
        document.status = "indexed" if indexed or not search.enabled else "index_failed"
        db.commit()

        return {"status": document.status, "document_id": document.id}
    except Exception:
        document = db.get(Document, document_id)
        if document:
            document.status = "failed"
            db.commit()
        return {"status": "failed", "document_id": document_id}
    finally:
        db.close()
