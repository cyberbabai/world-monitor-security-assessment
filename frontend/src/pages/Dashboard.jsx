import { Suspense, lazy } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AlertTriangle, Zap, TrendingUp, Activity } from 'lucide-react'
import KpiCard from '../components/dashboard/KpiCard'
import SeverityDonut from '../components/dashboard/SeverityDonut'
import { MOCK_FINDINGS, MOCK_SCANS, MOCK_COUNTS } from '../lib/mockData'
import { getSeverityConfig } from '../lib/cvss'
import { pageVariants } from '../lib/motion'

const ThreatGlobe = lazy(() => import('../components/three/ThreatGlobe'))

const KPI_CARDS = [
  { label: 'Total',    value: MOCK_COUNTS.total,    color: '#FFFFFF',  icon: Activity },
  { label: 'Critical', value: MOCK_COUNTS.critical, color: '#FF453A',  icon: AlertTriangle },
  { label: 'High',     value: MOCK_COUNTS.high,     color: '#FF9F0A',  icon: TrendingUp },
  { label: 'Medium',   value: MOCK_COUNTS.medium,   color: '#FFD60A',  icon: Zap },
]

export default function Dashboard() {
  const navigate = useNavigate()

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="p-8 space-y-6"
    >
      <div className="flex items-end justify-between">
        <div>
          <h1
            className="text-[28px] font-bold text-white leading-none"
            style={{ fontFamily: '"IBM Plex Mono", monospace' }}
          >
            Dashboard
          </h1>
          <p className="text-[13px] mt-2" style={{ color: 'rgba(255,255,255,0.40)', fontFamily: '"Inter", sans-serif' }}>
            World Monitor security assessment
          </p>
        </div>
        <button
          onClick={() => navigate('/scan/new')}
          className="px-4 py-2 rounded-[8px] text-[13px] font-medium transition-colors duration-100"
          style={{
            background: 'rgba(10,124,255,0.12)',
            color: '#0A7CFF',
            border: '1px solid rgba(10,124,255,0.20)',
            fontFamily: '"Inter", sans-serif',
          }}
        >
          New scan
        </button>
      </div>

      {/* KPI row — single stagger on mount, not repeated */}
      <div className="grid grid-cols-4 gap-3">
        {KPI_CARDS.map((card, i) => (
          <KpiCard key={card.label} {...card} index={i} />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="glass-card p-5 col-span-1">
          <h2
            className="text-[13px] font-semibold mb-4"
            style={{ fontFamily: '"IBM Plex Mono", monospace', color: 'rgba(255,255,255,0.70)' }}
          >
            Severity split
          </h2>
          <div className="h-48">
            <SeverityDonut counts={MOCK_COUNTS} />
          </div>
          <div className="mt-4 space-y-1.5">
            {['critical', 'high', 'medium', 'low'].map((s) => {
              const cfg = getSeverityConfig(s)
              return (
                <div key={s} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: cfg.color }} />
                  <span className="text-[12px]" style={{ color: 'rgba(255,255,255,0.50)', fontFamily: '"Inter",sans-serif' }}>
                    {cfg.label}
                  </span>
                  <span className="text-[12px] font-semibold ml-auto" style={{ color: cfg.color, fontFamily: '"IBM Plex Mono",monospace' }}>
                    {MOCK_COUNTS[s]}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="glass-card p-5 col-span-2 flex flex-col">
          <h2
            className="text-[13px] font-semibold mb-1"
            style={{ fontFamily: '"IBM Plex Mono", monospace', color: 'rgba(255,255,255,0.70)' }}
          >
            Threat origin map
          </h2>
          <p className="text-[12px] mb-3" style={{ color: 'rgba(255,255,255,0.30)', fontFamily: '"Inter",sans-serif' }}>
            Simulated attack source geography
          </p>
          <div className="flex-1" style={{ minHeight: 240 }}>
            <Suspense fallback={
              <div className="h-full flex items-center justify-center text-[13px]" style={{ color: 'rgba(255,255,255,0.20)' }}>
                Loading globe…
              </div>
            }>
              <ThreatGlobe />
            </Suspense>
          </div>
        </div>
      </div>

      {/* Recent scans — clean table, no card treatment per row */}
      <div className="glass-card overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06]">
          <h2
            className="text-[13px] font-semibold"
            style={{ fontFamily: '"IBM Plex Mono", monospace', color: 'rgba(255,255,255,0.70)' }}
          >
            Recent scans
          </h2>
        </div>
        {MOCK_SCANS.map((scan) => (
          <div
            key={scan.id}
            onClick={() => navigate('/findings')}
            className="data-row flex items-center justify-between px-5 py-3.5 cursor-pointer"
          >
            <div>
              <p className="text-[14px] font-medium text-white" style={{ fontFamily: '"Inter",sans-serif' }}>
                {scan.target}
              </p>
              <p className="text-[12px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: '"Inter",sans-serif' }}>
                {scan.modules.join(', ')} · {new Date(scan.startedAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex gap-3">
                {Object.entries(scan.findingCount).filter(([, v]) => v > 0).slice(0, 3).map(([s, v]) => {
                  const cfg = getSeverityConfig(s)
                  return (
                    <span key={s} className="text-[12px] font-semibold" style={{ color: cfg.color, fontFamily: '"IBM Plex Mono",monospace' }}>
                      {v} {cfg.label}
                    </span>
                  )
                })}
              </div>
              <span
                className="text-[11px] px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(48,209,88,0.12)', color: '#30D158', fontFamily: '"Inter",sans-serif' }}
              >
                Done
              </span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
