import { Suspense, lazy } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AlertTriangle, Zap, TrendingUp, Activity, ChevronRight } from 'lucide-react'
import KpiCard from '../components/dashboard/KpiCard'
import SeverityDonut from '../components/dashboard/SeverityDonut'
import { MOCK_FINDINGS, MOCK_SCANS, MOCK_COUNTS } from '../lib/mockData'
import { getSeverityConfig } from '../lib/cvss'
import { pageVariants } from '../lib/motion'

const ThreatGlobe = lazy(() => import('../components/three/ThreatGlobe'))

const KPI_CARDS = [
  { label: 'Total Findings', value: MOCK_COUNTS.total, color: '#FFFFFF', icon: Activity },
  { label: 'Critical',        value: MOCK_COUNTS.critical, color: '#FF453A', icon: AlertTriangle },
  { label: 'High',            value: MOCK_COUNTS.high,     color: '#FF9F0A', icon: TrendingUp },
  { label: 'Medium',          value: MOCK_COUNTS.medium,   color: '#FFD60A', icon: Zap },
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
      <div>
        <h1 className="text-[34px] font-bold text-white">Dashboard</h1>
        <p className="text-[15px] text-white/50 mt-1">World Monitor — Security Assessment Overview</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {KPI_CARDS.map((card, i) => (
          <KpiCard key={card.label} {...card} index={i} />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="glass-card p-5 col-span-1">
          <h2 className="text-[15px] font-semibold text-white mb-4">Severity Distribution</h2>
          <div className="h-52">
            <SeverityDonut counts={MOCK_COUNTS} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {['critical', 'high', 'medium', 'low'].map((s) => {
              const cfg = getSeverityConfig(s)
              return (
                <div key={s} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: cfg.color }} />
                  <span className="text-[12px] text-white/60">{cfg.label}</span>
                  <span className="text-[12px] font-semibold ml-auto" style={{ color: cfg.color }}>
                    {MOCK_COUNTS[s]}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="glass-card p-5 col-span-2 flex flex-col">
          <h2 className="text-[15px] font-semibold text-white mb-1">Threat Origins</h2>
          <p className="text-[12px] text-white/40 mb-3">Simulated attack source geography</p>
          <div className="flex-1" style={{ minHeight: 240 }}>
            <Suspense fallback={
              <div className="h-full flex items-center justify-center text-white/20 text-[13px]">
                Loading 3D globe…
              </div>
            }>
              <ThreatGlobe />
            </Suspense>
          </div>
        </div>
      </div>

      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[15px] font-semibold text-white">Recent Scans</h2>
          <button
            onClick={() => navigate('/scan/new')}
            className="text-[13px] text-[#0A84FF] hover:text-[#0A84FF]/80 transition-colors font-medium"
          >
            + New Scan
          </button>
        </div>
        <div className="space-y-2">
          {MOCK_SCANS.map((scan) => {
            const total = Object.values(scan.findingCount).reduce((a, b) => a + b, 0)
            return (
              <motion.div
                key={scan.id}
                whileHover={{ x: 4, transition: { type: 'spring', stiffness: 400, damping: 30 } }}
                onClick={() => navigate('/findings')}
                className="flex items-center justify-between px-4 py-3 rounded-[12px]
                  bg-white/[0.04] border border-white/[0.07] cursor-pointer
                  hover:bg-white/[0.07] hover:border-[#0A84FF]/20 transition-all duration-150"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-[14px] font-medium text-white">{scan.target}</span>
                  <span className="text-[12px] text-white/40">
                    {scan.modules.join(' · ')} · {new Date(scan.startedAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex gap-2">
                    {Object.entries(scan.findingCount).filter(([, v]) => v > 0).slice(0, 3).map(([s, v]) => {
                      const cfg = getSeverityConfig(s)
                      return (
                        <span key={s} className="text-[12px] font-semibold" style={{ color: cfg.color }}>
                          {v} {cfg.label.slice(0, 4)}
                        </span>
                      )
                    })}
                  </div>
                  <span className="text-[12px] px-2 py-0.5 rounded-full bg-[#30D158]/15 text-[#30D158] border border-[#30D158]/20">
                    Completed
                  </span>
                  <ChevronRight size={14} className="text-white/20" />
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}
