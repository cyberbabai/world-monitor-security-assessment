from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine, SessionLocal
from models import User
from routers import auth, findings, reports, scans
from routers.auth import hash_password


def _seed_default_user():
    """Create the default NTRO assessor account on first run."""
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == "assessor@ntro.gov.in").first()
        if not existing:
            db.add(User(
                email="assessor@ntro.gov.in",
                hashed_password=hash_password("worldmonitor2026"),
                name="NTRO Assessor",
            ))
            db.commit()
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    _seed_default_user()
    yield


app = FastAPI(
    title="World Monitor — Security Assessment API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(scans.router)
app.include_router(findings.router)
app.include_router(reports.router)


@app.get("/health")
def health():
    return {"status": "ok", "service": "wmsec-api"}
