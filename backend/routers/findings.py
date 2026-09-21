from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from models import Finding, FindingStatus, Severity
from routers.auth import get_current_user, User

router = APIRouter(prefix="/findings", tags=["findings"])


class FindingOut(BaseModel):
    id: int
    scan_id: int
    title: str
    description: str
    severity: str
    cvss_score: float
    cvss_vector: str
    category: str
    owasp: str
    cwe: str
    endpoint: str
    steps_to_reproduce: list
    poc_request: str
    poc_response: str
    business_impact: str
    remediation: list
    references: list
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class FindingUpdate(BaseModel):
    status: Optional[FindingStatus] = None
    description: Optional[str] = None
    remediation: Optional[list] = None
    poc_request: Optional[str] = None
    poc_response: Optional[str] = None


@router.get("", response_model=List[FindingOut])
def list_findings(
    severity: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    scan_id: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = db.query(Finding)
    if severity:
        q = q.filter(Finding.severity == severity)
    if status:
        q = q.filter(Finding.status == status)
    if scan_id:
        q = q.filter(Finding.scan_id == scan_id)
    if search:
        q = q.filter(
            Finding.title.ilike(f"%{search}%") |
            Finding.category.ilike(f"%{search}%") |
            Finding.endpoint.ilike(f"%{search}%")
        )
    return q.order_by(Finding.cvss_score.desc()).all()


@router.get("/{finding_id}", response_model=FindingOut)
def get_finding(
    finding_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    f = db.query(Finding).filter(Finding.id == finding_id).first()
    if not f:
        raise HTTPException(status_code=404, detail="Finding not found")
    return f


@router.patch("/{finding_id}", response_model=FindingOut)
def update_finding(
    finding_id: int,
    payload: FindingUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    f = db.query(Finding).filter(Finding.id == finding_id).first()
    if not f:
        raise HTTPException(status_code=404, detail="Finding not found")
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(f, field, value)
    f.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(f)
    return f


@router.get("/stats/summary")
def findings_summary(
    scan_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = db.query(Finding)
    if scan_id:
        q = q.filter(Finding.scan_id == scan_id)
    findings = q.all()
    counts = {"total": len(findings), "critical": 0, "high": 0, "medium": 0, "low": 0, "info": 0}
    for f in findings:
        counts[f.severity.value] = counts.get(f.severity.value, 0) + 1
    return counts
