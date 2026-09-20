import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Layout from './components/layout/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import NewScan from './pages/NewScan'
import ScanProgress from './pages/ScanProgress'
import FindingsList from './pages/FindingsList'
import FindingDetail from './pages/FindingDetail'
import ReportExport from './pages/ReportExport'
import RemediationTracker from './pages/RemediationTracker'

function ProtectedLayout() {
  const token = localStorage.getItem('token')
  if (!token) return <Navigate to="/login" replace />
  return <Layout />
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'rgba(28,28,30,0.95)',
            border: '1px solid rgba(255,255,255,0.10)',
            borderRadius: '12px',
            color: '#fff',
            fontSize: '14px',
          },
        }}
      />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard"            element={<Dashboard />} />
          <Route path="/scan/new"             element={<NewScan />} />
          <Route path="/scan/:id/progress"    element={<ScanProgress />} />
          <Route path="/findings"             element={<FindingsList />} />
          <Route path="/findings/:id"         element={<FindingDetail />} />
          <Route path="/report"               element={<ReportExport />} />
          <Route path="/tracker"              element={<RemediationTracker />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
