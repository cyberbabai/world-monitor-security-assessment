# Routes — World Monitor Security Assessment

## Route Map

| Path | Page Component | Auth Required | Description |
|---|---|---|---|
| `/login` | `pages/Login.jsx` | No | Login form with Three.js particle background |
| `/dashboard` | `pages/Dashboard.jsx` | Yes | Risk summary KPIs, severity donut, threat globe, recent scans |
| `/scan/new` | `pages/NewScan.jsx` | Yes | Configure target URL and scan modules, start scan |
| `/scan/:id/progress` | `pages/ScanProgress.jsx` | Yes | Live scan progress with Three.js radar ring, terminal log feed |
| `/findings` | `pages/FindingsList.jsx` | Yes | Filterable table of all findings (severity, status, search) |
| `/findings/:id` | `pages/FindingDetail.jsx` | Yes | Full finding detail: CvssRing3D, description, PoC, remediation |
| `/report` | `pages/ReportExport.jsx` | Yes | Export PDF / JSON / Evidence ZIP |
| `/tracker` | `pages/RemediationTracker.jsx` | Yes | Kanban board (Open → In Progress → Fixed → Accepted) |
| `/` | → redirect `/dashboard` | Yes | Root redirects to dashboard |
| `*` | → redirect `/dashboard` | — | Catch-all |

## Auth Pattern

```jsx
// ProtectedLayout in App.jsx
function ProtectedLayout() {
  const token = localStorage.getItem('token')
  if (!token) return <Navigate to="/login" replace />
  return <Layout />
}
```
Mock credentials: `assessor@ntro.gov.in` / `worldmonitor2026` → stores `mock-jwt-token` in localStorage.

## Router

React Router v6 `BrowserRouter`, `AnimatePresence` wrapping `Outlet` in `Layout.jsx` for page transitions.
