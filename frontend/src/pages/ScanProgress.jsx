import { useState, useEffect, useRef, Suspense, lazy } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getSeverityConfig } from '../lib/cvss'
import AppleButton from '../components/ui/AppleButton'
import { pageVariants } from '../lib/motion'

const ScanRadar = lazy(() => import('../components/three/ScanRadar'))

const LOG_SEQUENCE = [
  { delay: 500,  text: '→ Initializing scan engine...', type: 'info' },
  { delay: 1200, text: '✓ Target reachable — 200 OK on https://worldmonitor.ntro.gov.in', type: 'success' },
  { delay: 2000, text: '→ Phase 1/6: Reconnaissance & Fingerprinting', type: 'phase' },
  { delay: 3000, text: '  nmap -sV -p- --min-rate 5000 — 23 open ports discovered', type: 'info' },
  { delay: 4200, text: '  Technology stack: React 18, FastAPI 0.100, PostgreSQL 15, nginx/1.25', type: 'info' },
  { delay: 5500, text: '  ffuf: 312 endpoints enumerated (/api/v1/*, /graphql, /admin/*)', type: 'info' },
  { delay: 6800, text: '✓ Phase 1 complete — 0 findings', type: 'success' },
  { delay: 7500, text: '→ Phase 2/6: Authentication & Session Testing', type: 'phase' },
  { delay: 8800, text: '  Testing JWT implementation...', type: 'info' },
  { delay: 10000, text: '⚠ CRITICAL: JWT alg:none bypass — /api/auth/verify accepts unsigned tokens', type: 'critical', severity: 'critical' },
  { delay: 11500, text: '  Testing OAuth redirect_uri validation...', type: 'info' },
  { delay: 12800, text: '✓ OAuth: redirect_uri properly validated', type: 'success' },
  { delay: 14000, text: '✓ Phase 2 complete — 1 critical finding', type: 'success' },
  { delay: 14800, text: '→ Phase 3/6: Authorization & Access Control', type: 'phase' },
  { delay: 16000, text: '  Testing IDOR on /api/users/{id}/profile...', type: 'info' },
  { delay: 17500, text: '⚠ HIGH: IDOR — user profile accessible without ownership check (id enumeration)', type: 'high', severity: 'high' },
  { delay: 19000, text: '  Testing vertical privilege escalation...', type: 'info' },
  { delay: 20500, text: '✓ Vertical privilege escalation: not found', type: 'success' },
  { delay: 21500, text: '→ Phase 4/6: Injection Testing', type: 'phase' },
  { delay: 23000, text: '  Running sqlmap on all input parameters...', type: 'info' },
  { delay: 25000, text: '⚠ CRITICAL: SQL Injection — /api/search?q= time-based blind (SLEEP(5) confirmed)', type: 'critical', severity: 'critical' },
  { delay: 26500, text: '  Testing XSS in alert name field...', type: 'info' },
  { delay: 28000, text: '⚠ HIGH: Stored XSS — /api/alerts name field (CSP not configured)', type: 'high', severity: 'high' },
  { delay: 29500, text: '→ Phase 5/6: TLS & Secure Communication', type: 'phase' },
  { delay: 31000, text: '  testssl.sh — TLS 1.3 supported, TLS 1.0/1.1 disabled ✓', type: 'success' },
  { delay: 32500, text: '⚠ MEDIUM: Missing HSTS header — SSL-stripping risk on public networks', type: 'medium', severity: 'medium' },
  { delay: 34000, text: '→ Phase 6/6: Client-Side & API Security', type: 'phase' },
  { delay: 35500, text: '  GraphQL introspection check...', type: 'info' },
  { delay: 37000, text: '⚠ MEDIUM: GraphQL introspection enabled in production — full schema exposed', type: 'medium', severity: 'medium' },
  { delay: 38500, text: '  CORS configuration check...', type: 'info' },
  { delay: 39500, text: '✓ CORS: properly configured with allowlist', type: 'success' },
  { delay: 40500, text: '──────────────────────────────────────────', type: 'divider' },
  { delay: 41000, text: '✓ Scan complete — 6 findings: 2 Critical · 2 High · 2 Medium', type: 'complete' },
]

const PHASES = ['Recon', 'Auth', 'Authorization', 'Injection', 'TLS', 'Client-Side / API']

export default function ScanProgress() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isDemo = id === 'demo'

  const [logs, setLogs] = useState([])
  const [progress, setProgress] = useState(0)
  const [findings, setFindings] = useState([])
  const [done, setDone] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const logRef = useRef(null)
  const timerRef = useRef(null)

  // Demo mode: replay the static LOG_SEQUENCE
  useEffect(() => {
    if (!isDemo) return
    timerRef.current = setInterval(() => setElapsed((t) => t + 1), 1000)
    const timeouts = LOG_SEQUENCE.map((entry, i) =>
      setTimeout(() => {
        setLogs((prev) => [...prev, entry])
        setProgress(Math.round(((i + 1) / LOG_SEQUENCE.length) * 100))
        if (entry.severity) setFindings((prev) => [...prev, { severity: entry.severity }])
        if (i === LOG_SEQUENCE.length - 1) { setDone(true); clearInterval(timerRef.current) }
      }, entry.delay)
    )
    return () => { timeouts.forEach(clearTimeout); clearInterval(timerRef.current) }
  }, [isDemo])

  // Live mode: consume SSE stream from the real API
  useEffect(() => {
    if (isDemo) return
    timerRef.current = setInterval(() => setElapsed((t) => t + 1), 1000)
    const token = localStorage.getItem('token')
    const apiBase = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'
    const es = new EventSource(`${apiBase}/scans/${id}/stream?token=${token}`)

    es.addEventListener('log', (e) => {
      const data = JSON.parse(e.data)
      const sevKeys = ['critical', 'high', 'medium', 'low']
      setLogs((prev) => [...prev, { text: data.message, type: data.level }])
      if (sevKeys.includes(data.level)) setFindings((prev) => [...prev, { severity: data.level }])
      setProgress((p) => Math.min(p + 2, 95))
    })
    es.addEventListener('done', (e) => {
      const data = JSON.parse(e.data)
      setDone(true)
      setProgress(100)
      clearInterval(timerRef.current)
      es.close()
    })
    es.onerror = () => es.close()

    return () => { es.close(); clearInterval(timerRef.current) }
  }, [id, isDemo])

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [logs])

  const formatTime = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0')
    const sec = (s % 60).toString().padStart(2, '0')
    return `00:${m}:${sec}`
  }

  const currentPhase = Math.min(Math.floor(progress / (100 / 6)), 5)
  const counts = findings.reduce((acc, f) => {
    acc[f.severity] = (acc[f.severity] ?? 0) + 1
    return acc
  }, {})

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="p-8 space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[34px] font-bold text-white">Scan in Progress</h1>
          <p className="text-[15px] text-white/50 mt-1">https://worldmonitor.ntro.gov.in</p>
        </div>
        {done && (
          <AppleButton onClick={() => navigate('/findings')}>
            View Findings →
          </AppleButton>
        )}
      </div>

      <div className="glass-card p-2 overflow-hidden" style={{ height: 320 }}>
        <Suspense fallback={
          <div className="h-full flex items-center justify-center text-white/20 text-[13px]">
            Loading radar…
          </div>
        }>
          <ScanRadar progress={progress} findings={findings} />
        </Suspense>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="glass-card-sm px-4 py-3 flex flex-col gap-1">
          <span className="text-[12px] text-white/40">Phase</span>
          <span className="text-[14px] font-semibold text-white">{PHASES[currentPhase]} ({currentPhase + 1}/6)</span>
        </div>
        <div className="glass-card-sm px-4 py-3 flex flex-col gap-1">
          <span className="text-[12px] text-white/40">Elapsed</span>
          <span className="text-[14px] font-mono font-semibold text-white">{formatTime(elapsed)}</span>
        </div>
        <div className="glass-card-sm px-4 py-3 flex flex-col gap-1">
          <span className="text-[12px] text-white/40">Live Findings</span>
          <div className="flex gap-3">
            {['critical', 'high', 'medium'].map((s) => {
              const cfg = getSeverityConfig(s)
              return (
                <span key={s} className="text-[14px] font-semibold" style={{ color: cfg.color }}>
                  {cfg.dot} {counts[s] ?? 0}
                </span>
              )
            })}
          </div>
        </div>
      </div>

      <div className="glass-card p-1 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2 border-b border-white/[0.07]">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#FF453A]/60" />
            <div className="w-3 h-3 rounded-full bg-[#FF9F0A]/60" />
            <div className="w-3 h-3 rounded-full bg-[#30D158]/60" />
          </div>
          <span className="text-[12px] text-white/30 ml-2 font-mono">scan-log — bash</span>
          <div className="ml-auto flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${done ? 'bg-[#30D158]' : 'bg-[#0A84FF] animate-pulse-glow'}`} />
            <span className="text-[11px] text-white/30">{done ? 'Completed' : 'Running'}</span>
          </div>
        </div>
        <div
          ref={logRef}
          className="h-64 overflow-y-auto p-4 font-mono text-[13px] leading-relaxed space-y-1"
        >
          {logs.map((log, i) => {
            const color =
              log.type === 'critical' ? '#FF453A' :
              log.type === 'high'     ? '#FF9F0A' :
              log.type === 'medium'   ? '#FFD60A' :
              log.type === 'success'  ? '#30D158' :
              log.type === 'complete' ? '#30D158' :
              log.type === 'phase'    ? '#0A84FF' :
              log.type === 'divider'  ? 'rgba(255,255,255,0.15)' :
              'rgba(255,255,255,0.55)'
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
                style={{ color }}
              >
                {log.text}
              </motion.div>
            )
          })}
          {!done && (
            <span className="text-[#0A84FF] animate-pulse-glow">▌</span>
          )}
        </div>
      </div>
    </motion.div>
  )
}
