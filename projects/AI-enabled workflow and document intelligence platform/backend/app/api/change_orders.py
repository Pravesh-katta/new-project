from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user_email
from app.db.session import get_db
from app.models.construction import ChangeOrder, Project
from app.schemas.construction import (
    ChangeOrderCreate,
    ChangeOrderRead,
    ChangeOrderUpdate,
)
from app.services.state_machines import (
    IllegalTransitionError,
    assert_change_order_transition,
)

router = APIRouter(prefix="/change-orders", tags=["change-orders"])


@router.get("", response_model=list[ChangeOrderRead])
def list_change_orders(
    project_id: str | None = Query(None),
    status_filter: str | None = Query(None, alias="status"),
    db: Session = Depends(get_db),
    _: str = Depends(get_current_user_email),
) -> list[ChangeOrder]:
    stmt = select(ChangeOrder).order_by(ChangeOrder.created_at.desc())
    if project_id:
        stmt = stmt.where(ChangeOrder.project_id == project_id)
    if status_filter:
        stmt = stmt.where(ChangeOrder.status == status_filter)
    return db.scalars(stmt).all()


@router.post("", response_model=ChangeOrderRead, status_code=status.HTTP_201_CREATED)
def create_change_order(
    payload: ChangeOrderCreate,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_user_email),
) -> ChangeOrder:
    if not db.get(Project, payload.project_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Project not found")
    co = ChangeOrder(**payload.model_dump())
    db.add(co)
    db.commit()
    db.refresh(co)
    return co


@router.get("/{co_id}", response_model=ChangeOrderRead)
def get_change_order(
    co_id: str,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_user_email),
) -> ChangeOrder:
    co = db.get(ChangeOrder, co_id)
    if not co:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Change order not found")
    return co


@router.patch("/{co_id}", response_model=ChangeOrderRead)
def update_change_order(
    co_id: str,
    payload: ChangeOrderUpdate,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_user_email),
) -> ChangeOrder:
    co = db.get(ChangeOrder, co_id)
    if not co:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Change order not found")

    updates = payload.model_dump(exclude_none=True)
    if "status" in updates:
        try:
            assert_change_order_transition(co.status, updates["status"])
        except IllegalTransitionError as exc:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc))
    for key, value in updates.items():
        setattr(co, key, value)
    db.commit()
    db.refresh(co)
    return co


@router.delete("/{co_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_change_order(
    co_id: str,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_user_email),
) -> None:
    co = db.get(ChangeOrder, co_id)
    if not co:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Change order not found")
    db.delete(co)
    db.commit()
