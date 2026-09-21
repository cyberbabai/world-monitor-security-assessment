import json
import os
from datetime import datetime
from io import BytesIO

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import JSONResponse, Response
from jinja2 import Environment, FileSystemLoader
from sqlalchemy.orm import Session

from database import get_db
from models import Finding, Scan
from routers.auth import get_current_user, User

router = APIRouter(prefix="/reports", tags=["reports"])

TEMPLATES_DIR = os.path.join(os.path.dirname(__file__), "..", "templates")

SEV_COLOR = {
    "critical": "#FF453A",
    "high": "#FF9F0A",
    "medium": "#FFD60A",
    "low": "#30D158",
    "info": "#636366",
}
SEV_BG = {
    "critical": "rgba(255,69,58,0.15)",
    "high": "rgba(255,159,10,0.15)",
    "medium": "rgba(255,214,10,0.15)",
    "low": "rgba(48,209,88,0.15)",
    "info": "rgba(99,99,102,0.15)",
}


def _get_scan_and_findings(scan_id: int, severities: list[str], db: Session):
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    q = db.query(Finding).filter(Finding.scan_id == scan_id)
    if severities:
        q = q.filter(Finding.severity.in_(severities))
    findings = q.order_by(Finding.cvss_score.desc()).all()
    counts = {"total": len(findings), "critical": 0, "high": 0, "medium": 0, "low": 0, "info": 0}
    for f in findings:
        counts[f.severity.value] += 1
    return scan, findings, counts


@router.get("/{scan_id}/json")
def export_json(
    scan_id: int,
    severities: list[str] = Query(default=["critical", "high", "medium", "low"]),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    scan, findings, counts = _get_scan_and_findings(scan_id, severities, db)
    payload = {
        "report_generated": datetime.utcnow().isoformat() + "Z",
        "assessor": user.email,
        "scan": {
            "id": scan.id,
            "target": scan.target,
            "modules": scan.modules,
            "intensity": scan.intensity,
            "status": scan.status.value,
            "started_at": scan.started_at.isoformat() if scan.started_at else None,
            "completed_at": scan.completed_at.isoformat() if scan.completed_at else None,
        },
        "summary": counts,
        "findings": [
            {
                "id": f.id,
                "title": f.title,
                "severity": f.severity.value,
                "cvss_score": f.cvss_score,
                "cvss_vector": f.cvss_vector,
                "category": f.category,
                "owasp": f.owasp,
                "cwe": f.cwe,
                "endpoint": f.endpoint,
                "status": f.status.value,
                "description": f.description,
                "steps_to_reproduce": f.steps_to_reproduce,
                "poc_request": f.poc_request,
                "poc_response": f.poc_response,
                "business_impact": f.business_impact,
                "remediation": f.remediation,
                "references": f.references,
            }
            for f in findings
        ],
    }
    return JSONResponse(
        content=payload,
        headers={"Content-Disposition": f'attachment; filename="wmsec-report-{scan_id}.json"'},
    )


@router.get("/{scan_id}/pdf")
def export_pdf(
    scan_id: int,
    severities: list[str] = Query(default=["critical", "high", "medium", "low"]),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    scan, findings, counts = _get_scan_and_findings(scan_id, severities, db)

    env = Environment(loader=FileSystemLoader(TEMPLATES_DIR), autoescape=True)
    template = env.get_template("report.html")
    html_content = template.render(
        scan=scan,
        findings=findings,
        counts=counts,
        assessor=user.email,
        date=datetime.utcnow().strftime("%Y-%m-%d"),
        sev_color=SEV_COLOR,
        sev_bg=SEV_BG,
    )

    try:
        from weasyprint import HTML
        pdf_bytes = HTML(string=html_content).write_pdf()
    except ImportError:
        # WeasyPrint not installed — return HTML for now
        return Response(
            content=html_content.encode(),
            media_type="text/html",
            headers={"Content-Disposition": f'attachment; filename="wmsec-report-{scan_id}.html"'},
        )

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="wmsec-report-{scan_id}.pdf"'},
    )
