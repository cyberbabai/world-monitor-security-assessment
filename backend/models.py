from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, JSON, Enum
from sqlalchemy.orm import relationship
import enum

from database import Base


class ScanStatus(str, enum.Enum):
    pending = "pending"
    running = "running"
    completed = "completed"
    failed = "failed"


class FindingStatus(str, enum.Enum):
    open = "open"
    in_progress = "in-progress"
    fixed = "fixed"
    accepted = "accepted"


class Severity(str, enum.Enum):
    critical = "critical"
    high = "high"
    medium = "medium"
    low = "low"
    info = "info"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    name = Column(String, default="Assessor")
    created_at = Column(DateTime, default=datetime.utcnow)

    scans = relationship("Scan", back_populates="user")


class Scan(Base):
    __tablename__ = "scans"

    id = Column(Integer, primary_key=True, index=True)
    target = Column(String, nullable=False)
    modules = Column(JSON, default=list)
    intensity = Column(String, default="standard")  # quick / standard / full
    status = Column(Enum(ScanStatus), default=ScanStatus.pending)
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"))

    user = relationship("User", back_populates="scans")
    findings = relationship("Finding", back_populates="scan", cascade="all, delete")
    logs = relationship("ScanLog", back_populates="scan", cascade="all, delete")


class ScanLog(Base):
    __tablename__ = "scan_logs"

    id = Column(Integer, primary_key=True, index=True)
    scan_id = Column(Integer, ForeignKey("scans.id"), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    level = Column(String, default="info")  # info / warning / critical / error
    message = Column(Text, nullable=False)

    scan = relationship("Scan", back_populates="logs")


class Finding(Base):
    __tablename__ = "findings"

    id = Column(Integer, primary_key=True, index=True)
    scan_id = Column(Integer, ForeignKey("scans.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, default="")
    severity = Column(Enum(Severity), nullable=False)
    cvss_score = Column(Float, nullable=False)
    cvss_vector = Column(String, default="")
    category = Column(String, default="")
    owasp = Column(String, default="")
    cwe = Column(String, default="")
    endpoint = Column(String, default="")
    steps_to_reproduce = Column(JSON, default=list)
    poc_request = Column(Text, default="")
    poc_response = Column(Text, default="")
    business_impact = Column(Text, default="")
    remediation = Column(JSON, default=list)
    references = Column(JSON, default=list)
    status = Column(Enum(FindingStatus), default=FindingStatus.open)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    scan = relationship("Scan", back_populates="findings")
