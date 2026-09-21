import asyncio
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sse_starlette.sse import EventSourceResponse

from database import get_db, SessionLocal
from models import Finding, Scan, ScanLog, ScanStatus
from routers.auth import get_current_user, User
from scanner.manual_checks import run_header_checks
from scanner.nuclei_runner import run_nuclei
from scanner.testssl_runner import run_testssl

router = APIRouter(prefix="/scans", tags=["scans"])

AVAILABLE_MODULES = [
    "recon",
    "auth",
    "authorization",
    "injection",
    "tls",
    "client-side",
    "api",
    "headers",
]


class ScanCreate(BaseModel):
    target: str
    modules: List[str] = AVAILABLE_MODULES
    intensity: str = "standard"


class ScanOut(BaseModel):
    id: int
    target: str
    modules: list
    intensity: str
    status: str
    started_at: datetime
    completed_at: Optional[datetime]
    finding_count: Optional[dict] = None

    class Config:
        from_attributes = True


@router.post("", response_model=ScanOut, status_code=201)
def create_scan(
    payload: ScanCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    scan = Scan(
        target=payload.target,
        modules=payload.modules,
        intensity=payload.intensity,
        user_id=user.id,
        status=ScanStatus.pending,
    )
    db.add(scan)
    db.commit()
    db.refresh(scan)
    background_tasks.add_task(_run_scan, scan.id, payload.target, payload.modules, payload.intensity)
    return scan


@router.get("", response_model=List[ScanOut])
def list_scans(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    scans = db.query(Scan).filter(Scan.user_id == user.id).order_by(Scan.started_at.desc()).all()
    result = []
    for scan in scans:
        s = ScanOut.model_validate(scan)
        counts = {"critical": 0, "high": 0, "medium": 0, "low": 0, "info": 0}
        for f in scan.findings:
            counts[f.severity.value] = counts.get(f.severity.value, 0) + 1
        s.finding_count = counts
        result.append(s)
    return result


@router.get("/{scan_id}", response_model=ScanOut)
def get_scan(scan_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    s = ScanOut.model_validate(scan)
    counts = {"critical": 0, "high": 0, "medium": 0, "low": 0, "info": 0}
    for f in scan.findings:
        counts[f.severity.value] = counts.get(f.severity.value, 0) + 1
    s.finding_count = counts
    return s


@router.get("/{scan_id}/stream")
async def stream_scan_logs(
    scan_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Server-Sent Events stream: yields log lines and finding notifications as the scan runs."""
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")

    async def event_generator():
        last_log_id = 0
        while True:
            db2 = SessionLocal()
            try:
                scan_row = db2.query(Scan).filter(Scan.id == scan_id).first()
                new_logs = (
                    db2.query(ScanLog)
                    .filter(ScanLog.scan_id == scan_id, ScanLog.id > last_log_id)
                    .order_by(ScanLog.id)
                    .all()
                )
                for log in new_logs:
                    last_log_id = log.id
                    yield {
                        "event": "log",
                        "data": f'{{"id":{log.id},"level":"{log.level}","message":{_json_str(log.message)},"ts":"{log.timestamp.isoformat()}"}}',
                    }
                if scan_row and scan_row.status in (ScanStatus.completed, ScanStatus.failed):
                    yield {"event": "done", "data": f'{{"status":"{scan_row.status.value}"}}'}
                    return
            finally:
                db2.close()
            await asyncio.sleep(1)

    return EventSourceResponse(event_generator())


def _json_str(s: str) -> str:
    import json
    return json.dumps(s)


async def _run_scan(scan_id: int, target: str, modules: list, intensity: str):
    db = SessionLocal()
    try:
        scan = db.query(Scan).filter(Scan.id == scan_id).first()
        scan.status = ScanStatus.running
        db.commit()

        def log(level: str, message: str):
            db.add(ScanLog(scan_id=scan_id, level=level, message=message))
            db.commit()

        def save_finding(data: dict):
            f = Finding(scan_id=scan_id, **data)
            db.add(f)
            db.commit()

        log("info", f"[scanner] scan {scan_id} started — target: {target}")
        log("info", f"[scanner] modules: {', '.join(modules)}")

        # Header / CORS / Cookie checks (always runs)
        if "headers" in modules or "client-side" in modules or "tls" in modules:
            log("info", "[headers] running security header checks...")
            try:
                findings = await run_header_checks(target)
                for f in findings:
                    save_finding(f)
                    log(f["severity"], f"[headers] {f['severity'].upper()}: {f['title']}")
                log("info", f"[headers] found {len(findings)} header issue(s)")
            except Exception as e:
                log("error", f"[headers] failed: {e}")

        # TLS audit
        if "tls" in modules:
            log("info", "[testssl] starting TLS audit...")
            try:
                async for event in run_testssl(target):
                    if event["type"] == "log":
                        log(event["level"], event["message"])
                    elif event["type"] == "finding":
                        save_finding(event["data"])
            except Exception as e:
                log("error", f"[testssl] failed: {e}")

        # Nuclei scan
        if any(m in modules for m in ["injection", "auth", "recon", "api"]):
            log("info", "[nuclei] starting vulnerability scan...")
            try:
                async for event in run_nuclei(target, intensity):
                    if event["type"] == "log":
                        log(event["level"], event["message"])
                    elif event["type"] == "finding":
                        save_finding(event["data"])
            except Exception as e:
                log("error", f"[nuclei] failed: {e}")

        # Count findings
        total = db.query(Finding).filter(Finding.scan_id == scan_id).count()
        log("info", f"[scanner] scan complete — {total} finding(s) recorded")

        scan = db.query(Scan).filter(Scan.id == scan_id).first()
        scan.status = ScanStatus.completed
        scan.completed_at = datetime.utcnow()
        db.commit()

    except Exception as e:
        db.rollback()
        scan = db.query(Scan).filter(Scan.id == scan_id).first()
        if scan:
            scan.status = ScanStatus.failed
            db.commit()
        db.add(ScanLog(scan_id=scan_id, level="error", message=f"[scanner] fatal error: {e}"))
        db.commit()
    finally:
        db.close()
