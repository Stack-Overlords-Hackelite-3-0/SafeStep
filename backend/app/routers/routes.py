from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database import get_db
from app.models.route import SafetyReport
from app.models.user import User
from app.schemas.route import VALID_CATEGORIES, SafetyReportCreate, SafetyReportResponse

router = APIRouter(prefix="/api/safety-reports", tags=["route-intelligence"])


@router.get("", response_model=list[SafetyReportResponse])
def list_safety_reports(
    min_lat: float | None = None,
    max_lat: float | None = None,
    min_lng: float | None = None,
    max_lng: float | None = None,
    db: Session = Depends(get_db),
):
    """Public read access powers the crowd-sourced heatmap; bounding box params keep payloads small on a live map."""
    query = db.query(SafetyReport)
    if min_lat is not None:
        query = query.filter(SafetyReport.latitude >= min_lat)
    if max_lat is not None:
        query = query.filter(SafetyReport.latitude <= max_lat)
    if min_lng is not None:
        query = query.filter(SafetyReport.longitude >= min_lng)
    if max_lng is not None:
        query = query.filter(SafetyReport.longitude <= max_lng)
    return query.order_by(SafetyReport.created_at.desc()).limit(2000).all()


@router.post("", response_model=SafetyReportResponse, status_code=status.HTTP_201_CREATED)
def create_safety_report(
    payload: SafetyReportCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if payload.category not in VALID_CATEGORIES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"category must be one of {sorted(VALID_CATEGORIES)}",
        )
    report = SafetyReport(user_id=current_user.id, **payload.model_dump())
    db.add(report)
    db.commit()
    db.refresh(report)
    return report
