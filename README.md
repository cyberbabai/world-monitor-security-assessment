# World Monitor — Security Assessment Platform

**Smart India Hackathon 2026 | NTRO Problem Statement**
**Team:** 7 Star Developers | **Theme:** Smart Automation

A full-stack security assessment dashboard for the World Monitor web/mobile platform. Runs automated vulnerability scans (nuclei, testssl.sh, header analysis), displays findings by CVSS severity, and generates PDF reports — all in a judge-ready Apple-dark UI with Three.js 3D scenes.

---

## Live Demo

| Credential | Value |
|---|---|
| Email | `assessor@ntro.gov.in` |
| Password | `worldmonitor2026` |

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  React 18 + Vite + Tailwind CSS + Three.js          │
│  Framer Motion · Recharts · @dnd-kit · IBM Plex Mono │
│  Hosted: AWS S3 + CloudFront (eu-north-1)           │
└────────────────────┬────────────────────────────────┘
                     │ REST API + SSE
┌────────────────────▼────────────────────────────────┐
│  Python FastAPI (JWT auth, scan runner, findings)   │
│  Scanner: nuclei · testssl.sh · httpx header checks │
│  Report export: WeasyPrint PDF + JSON               │
│  Hosted: AWS EC2 t3.small (eu-north-1)              │
└────────────────────┬────────────────────────────────┘
                     │ SQLAlchemy ORM
┌────────────────────▼────────────────────────────────┐
│  PostgreSQL (AWS RDS db.t3.micro, eu-north-1)       │
│  Tables: users · scans · scan_logs · findings       │
└─────────────────────────────────────────────────────┘
```

---

## Pages

| Page | Route | Description |
|---|---|---|
| Login | `/login` | Three.js particle network background, JWT auth |
| Dashboard | `/dashboard` | KPI cards, severity donut, 3D threat globe, recent scans |
| New Scan | `/scan/new` | Target URL, module selection, intensity (Quick/Standard/Full) |
| Scan Progress | `/scan/:id/progress` | Live SSE log stream, 3D radar ring, live finding counters |
| Findings List | `/findings` | Filterable table — severity, status, search |
| Finding Detail | `/findings/:id` | 3D CVSS ring, PoC HTTP request, remediation checklist |
| Report Export | `/report` | PDF / JSON / Evidence ZIP download |
| Tracker | `/tracker` | Kanban board — drag findings between Open → Fixed |

---

## Run Locally

### Frontend only (demo mode, no backend needed)

```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
# Open http://localhost:5173
# Login: assessor@ntro.gov.in / worldmonitor2026
```

### Full stack (frontend + backend + PostgreSQL)

```bash
# Requires Docker + Docker Compose
docker compose -f infra/docker-compose.yml up

# Frontend: http://localhost:5173
# API docs: http://localhost:8000/docs
```

### Backend only (SQLite, no Docker)

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# API: http://localhost:8000
# Docs: http://localhost:8000/docs
# Default user seeded: assessor@ntro.gov.in / worldmonitor2026
```

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/login` | Login → JWT token |
| `POST` | `/auth/register` | Create assessor account |
| `POST` | `/scans` | Start new scan (runs in background) |
| `GET` | `/scans` | List all scans with finding counts |
| `GET` | `/scans/:id/stream` | SSE live log stream |
| `GET` | `/findings` | List findings (filter by severity/status/search) |
| `PATCH` | `/findings/:id` | Update finding status |
| `GET` | `/findings/stats/summary` | Severity counts |
| `GET` | `/reports/:id/pdf` | Download PDF report |
| `GET` | `/reports/:id/json` | Download JSON report |

---

## Scanner Modules

| Module | Tools | What It Tests |
|---|---|---|
| `headers` | httpx | HSTS, CSP, X-Frame-Options, CORS, cookie flags |
| `tls` | testssl.sh | TLS versions, cipher suites, cert chain |
| `injection` | nuclei | CVEs, SQLi, XSS, SSRF, SSTI |
| `auth` | nuclei | Default logins, JWT issues, auth misconfigs |
| `recon` | nuclei | Exposures, information disclosure |

> **Note:** nuclei and testssl.sh must be installed and in PATH for live scanning. The frontend demo mode works fully offline with mock data.

---

## AWS Deployment (eu-north-1)

See `infra/setup_aws.sh` for the full one-shot provisioning script.

**Resources used:**
| Resource | Type | Cost (14 days) |
|---|---|---|
| App EC2 | t3.small | ~$10.50 |
| RDS PostgreSQL | db.t3.micro | ~$10.50 |
| S3 (frontend + reports) | ~5 GB | ~$0.12 |
| **Total** | | **~$21** |

**Deploy frontend to S3:**
```bash
cd frontend
npm run build
aws s3 sync dist/ s3://YOUR-BUCKET-NAME --delete --region eu-north-1
```

---

## Security Assessment Methodology

See [`plan.md`](plan.md) for the full 17-section assessment methodology including:
- OWASP Top 10 2021 + API Security Top 10 2023 mapping
- OWASP MASVS 2.0 mobile testing
- Phase-by-phase test cases with PoC commands
- 3 fully populated sample findings (IDOR, Stored XSS, Missing HSTS)
- Risk likelihood × impact matrix
- Smart Automation integration (nuclei + GitHub Actions + Claude AI triage)
- Post-engagement cleanup and evidence destruction certificate

---

## Tech Stack

**Frontend:** React 18 · Vite 5 · Tailwind CSS v4 · Framer Motion · Three.js · @react-three/fiber · Recharts · @dnd-kit · React Router v6 · Lucide React

**Backend:** Python 3.12 · FastAPI · SQLAlchemy 2 · Pydantic v2 · python-jose (JWT) · passlib (bcrypt) · sse-starlette · Jinja2 · WeasyPrint

**Infrastructure:** AWS EC2 t3.small · AWS RDS db.t3.micro (PostgreSQL) · AWS S3 · GitHub Actions CI/CD

---

*Authorized security assessment — NTRO. Testing confined to isolated AWS VPC (eu-north-1). No production users or data affected.*
