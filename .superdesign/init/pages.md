# Pages — World Monitor Security Assessment

## pages/Login.jsx
**Route:** `/login` | **Auth:** public
**Dependencies:**
- `components/ui/AppleInput`
- `components/ui/AppleButton`
- `components/three/ParticleNetwork` (lazy)
- `lib/motion` (pageVariants)
- `framer-motion`, `react-router-dom`, `lucide-react` (AlertTriangle)

**Key UI:** Full-screen #070C14 bg, Three.js particle network behind glass-card login form. Wordmark "WM/SEC" in IBM Plex Mono. Email + password fields. Error banner with AlertTriangle icon.

---

## pages/Dashboard.jsx
**Route:** `/dashboard` | **Auth:** required
**Dependencies:**
- `components/dashboard/KpiCard` (×4 cards: Total, Critical, High, Medium)
- `components/dashboard/SeverityDonut`
- `components/three/ThreatGlobe` (lazy)
- `lib/mockData` (MOCK_FINDINGS, MOCK_SCANS, MOCK_COUNTS)
- `lib/cvss` (getSeverityConfig)
- `lib/motion` (pageVariants)

**Key UI:** 2-col header (title + "New scan" button), 4 KPI cards in grid-cols-4, severity donut + threat globe side-by-side, recent scans table (.data-row rows).

---

## pages/FindingsList.jsx
**Route:** `/findings` | **Auth:** required
**Dependencies:**
- `lib/mockData` (MOCK_FINDINGS — 47 findings)
- `lib/cvss` (getSeverityConfig)
- `lib/motion` (pageVariants)
- `lucide-react` (Search)

**Key UI:** Title + count, search input + severity filter pills + status filter pills. Glass-card table with 12-col grid: Sev dot | Title+endpoint | CVSS score | Category | OWASP | Status badge. Filter: severity (all/critical/high/medium/low) and status (all/open/in-progress/fixed).

---

## pages/FindingDetail.jsx
**Route:** `/findings/:id` | **Auth:** required
**Dependencies:**
- `components/three/CvssRing3D` (lazy)
- `components/findings/CodeBlock`
- `lib/mockData` (MOCK_FINDINGS — find by id)
- `lib/cvss` (getSeverityConfig, getSeverityFromScore)

**Key UI:** 2-col layout. Left (40%): CvssRing3D 3D ring, CVSS vector string, CWE, OWASP, API mapping, Status selector. Right (60%): Description, Steps to Reproduce, HTTP Request/Response CodeBlock, Business Impact, Remediation checklist.

---

## pages/NewScan.jsx
**Route:** `/scan/new` | **Auth:** required
**Dependencies:**
- `components/scan/ModuleToggle`
- `components/ui/AppleButton`
- `components/ui/AppleInput`
- `lib/motion` (pageVariants)

**Key UI:** Centered glass-card. Target URL input + Verify button. Module list (8 scan modules as glass toggle rows). Intensity radio: Quick / Standard / Full. Start Scan CTA button.

---

## pages/ScanProgress.jsx
**Route:** `/scan/:id/progress` | **Auth:** required
**Dependencies:**
- `components/three/ScanRadar` (lazy)
- `lib/motion` (pageVariants)

**Key UI:** Three.js ScanRadar ring at top (sweep arc tracks %). Target/phase/elapsed meta row. Live finding counters by severity (count up). Terminal log glass-card with `.terminal-text` (green mono), cursor blink.

---

## pages/ReportExport.jsx
**Route:** `/report` | **Auth:** required
**Dependencies:**
- `lib/mockData` (MOCK_FINDINGS, MOCK_COUNTS)
- `lib/motion` (pageVariants)
- `components/dashboard/SeverityDonut` (preview)

**Key UI:** Severity filter checkboxes. Three export format buttons (PDF / JSON / Evidence ZIP) as glass cards. Report preview panel (scaled mock showing summary + mini chart).

---

## pages/RemediationTracker.jsx
**Route:** `/tracker` | **Auth:** required
**Dependencies:**
- `@dnd-kit/core` (DndContext, DragOverlay, etc.)
- `lib/mockData` (MOCK_FINDINGS)
- `lib/cvss` (getSeverityConfig)
- `lib/motion` (pageVariants)

**Key UI:** 4-column Kanban board: Open | In Progress | Fixed | Accepted Risk. Finding cards as draggable items (dnd-kit). Card shows: severity dot, title, CVSS score, category. Column headers show count badges.
