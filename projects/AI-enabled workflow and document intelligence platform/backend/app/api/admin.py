"""Local-only admin endpoints (seed demo data, drop demo data)."""

from datetime import date, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user_email
from app.db.session import get_db
from app.models.construction import (
    ChangeOrder,
    DailyReport,
    Project,
    RFI,
    Submittal,
)

router = APIRouter(prefix="/admin", tags=["admin"])


@router.post("/seed")
def seed_demo_data(
    db: Session = Depends(get_db),
    _: str = Depends(get_current_user_email),
) -> dict:
    """Create one demo project with RFIs, submittals, a CO, and a daily report.

    Idempotent: if a project with number 'DEMO-001' already exists, returns
    its current counts without re-seeding.
    """
    existing = db.scalar(select(Project).where(Project.number == "DEMO-001"))
    if existing:
        return _summary(db, existing, created=False)

    project = Project(
        number="DEMO-001",
        name="Downtown Tower",
        location="123 Main St, Springfield",
        owner="Acme Developments",
        status="active",
        description="20-story mixed-use tower; demo seed data.",
    )
    db.add(project)
    db.flush()

    today = date.today()

    db.add_all(
        [
            RFI(
                project_id=project.id,
                number="RFI-001",
                subject="Slab penetration size at gridline B-4",
                question="Confirm penetration diameter for plumbing chase.",
                spec_section="03 30 00",
                drawing_ref="S-201",
                from_party="Mechanical Sub",
                to_party="Architect",
                assignee="aoa@example.com",
                due_date=today + timedelta(days=5),
                status="open",
            ),
            RFI(
                project_id=project.id,
                number="RFI-002",
                subject="Curtain wall mullion finish discrepancy",
                question="Spec calls for clear anodized; drawing shows bronze. Which governs?",
                spec_section="08 44 13",
                drawing_ref="A-501",
                from_party="GC",
                to_party="Architect",
                assignee="aoa@example.com",
                due_date=today + timedelta(days=3),
                status="open",
            ),
            RFI(
                project_id=project.id,
                number="RFI-003",
                subject="Fire rating at egress stair shaft",
                question="2-hour shaft rating not shown on drawings; please confirm.",
                spec_section="07 84 00",
                drawing_ref="A-301",
                from_party="GC",
                to_party="Architect",
                assignee="aoa@example.com",
                due_date=today - timedelta(days=1),
                status="answered",
                answer="2-hour rating confirmed; see UL design U905.",
            ),
            Submittal(
                project_id=project.id,
                number="SUB-001",
                title="Concrete mix design - 5000 psi",
                spec_section="03 30 00",
                revision="0",
                submitted_by="ConcreteCo",
                reviewer="StructEng",
                status="under_review",
            ),
            Submittal(
                project_id=project.id,
                number="SUB-002",
                title="Curtain wall shop drawings",
                spec_section="08 44 13",
                revision="A",
                submitted_by="GlazingPro",
                reviewer="Architect",
                status="pending",
            ),
            ChangeOrder(
                project_id=project.id,
                number="CO-001",
                description="Add storefront door at retail entry",
                amount=14250.00,
                schedule_impact_days=0,
                reason="Owner requested second public entry",
                status="submitted",
            ),
            DailyReport(
                project_id=project.id,
                report_date=today,
                weather="Clear",
                temperature_f=68.0,
                crew_count=42,
                trades_on_site="Concrete, Steel, MEP",
                work_performed="L7 deck pour completed; column rebar L8 ongoing.",
                delays=None,
                author="Site Super",
            ),
        ]
    )
    db.commit()
    db.refresh(project)
    return _summary(db, project, created=True)


@router.post("/seed/reset")
def reset_demo_data(
    db: Session = Depends(get_db),
    _: str = Depends(get_current_user_email),
) -> dict:
    project = db.scalar(select(Project).where(Project.number == "DEMO-001"))
    if not project:
        return {"deleted": False}
    db.delete(project)
    db.commit()
    return {"deleted": True}


def _summary(db: Session, project: Project, *, created: bool) -> dict:
    def count(model) -> int:
        return len(
            db.scalars(select(model).where(model.project_id == project.id)).all()
        )

    return {
        "created": created,
        "project_id": project.id,
        "project_number": project.number,
        "counts": {
            "rfis": count(RFI),
            "submittals": count(Submittal),
            "change_orders": count(ChangeOrder),
            "daily_reports": count(DailyReport),
        },
    }
