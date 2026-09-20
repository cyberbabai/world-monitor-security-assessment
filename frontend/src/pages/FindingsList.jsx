import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, ChevronRight, Filter } from 'lucide-react'
import SeverityBadge from '../components/findings/SeverityBadge'
import { MOCK_FINDINGS } from '../lib/mockData'
import { getSeverityConfig } from '../lib/cvss'
import { pageVariants, cardVariants } from '../lib/motion'

const SEVERITY_FILTER = ['all', 'critical', 'high', 'medium', 'low']

export default function FindingsList() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [severityFilter, setSeverityFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = MOCK_FINDINGS.filter((f) => {
    const matchSev = severityFilter === 'all' || f.severity === severityFilter
    const matchStatus = statusFilter === 'all' || f.status === statusFilter
    const matchSearch = !search || f.title.toLowerCase().includes(search.toLowerCase()) ||
      f.category.toLowerCase().includes(search.toLowerCase())
    return matchSev && matchStatus && matchSearch
  })

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="p-8 space-y-6"
    >
      <div>
        <h1 className="text-[34px] font-bold text-white">Findings</h1>
        <p className="text-[15px] text-white/50 mt-1">{MOCK_FINDINGS.length} total findings across all scans</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            placeholder="Search findings…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-[12px] text-[14px] text-white placeholder-white/30
              bg-white/[0.07] border border-white/10 outline-none focus:border-[#0A84FF]/40 transition-colors"
          />
        </div>

        <div className="flex gap-1 glass-card-sm p-1">
          {SEVERITY_FILTER.map((s) => {
            const cfg = s !== 'all' ? getSeverityConfig(s) : null
            return (
              <button
                key={s}
                onClick={() => setSeverityFilter(s)}
                className={`px-3 py-1.5 rounded-[8px] text-[12px] font-medium transition-all duration-150 capitalize
                  ${severityFilter === s ? 'text-white' : 'text-white/40 hover:text-white/70'}`}
                style={severityFilter === s ? {
                  background: cfg ? `${cfg.color}25` : 'rgba(255,255,255,0.10)',
                  color: cfg?.color ?? '#fff',
                } : {}}
              >
                {s}
              </button>
            )
          })}
        </div>

        <div className="flex gap-1 glass-card-sm p-1">
          {['all', 'open', 'in-progress', 'fixed'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-[8px] text-[12px] font-medium transition-all duration-150 capitalize
                ${statusFilter === s ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="grid grid-cols-12 px-5 py-3 border-b border-white/[0.07] text-[12px] font-medium text-white/30 uppercase tracking-wide">
          <div className="col-span-1">Sev</div>
          <div className="col-span-5">Title</div>
          <div className="col-span-1 text-center">CVSS</div>
          <div className="col-span-2">Category</div>
          <div className="col-span-2">OWASP</div>
          <div className="col-span-1">Status</div>
        </div>

        <div>
          {filtered.map((f, i) => {
            const cfg = getSeverityConfig(f.severity)
            const statusColor = f.status === 'fixed' ? '#30D158' : f.status === 'in-progress' ? '#0A84FF' : '#636366'
            return (
              <motion.div
                key={f.id}
                variants={cardVariants}
                initial="initial"
                animate="animate"
                custom={i}
                onClick={() => navigate(`/findings/${f.id}`)}
                className="grid grid-cols-12 items-center px-5 py-3.5 border-b border-white/[0.05]
                  cursor-pointer hover:bg-white/[0.04] transition-all duration-150 group
                  hover:border-l-2 hover:border-l-[#0A84FF] last:border-b-0"
              >
                <div className="col-span-1">
                  <div className="w-2 h-2 rounded-full" style={{ background: cfg.color }} />
                </div>
                <div className="col-span-5">
                  <p className="text-[14px] font-medium text-white group-hover:text-[#0A84FF] transition-colors">
                    {f.title}
                  </p>
                  <p className="text-[12px] text-white/40 mt-0.5">{f.endpoint}</p>
                </div>
                <div className="col-span-1 text-center">
                  <span className="text-[14px] font-bold" style={{ color: cfg.color }}>{f.cvss}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-[13px] text-white/60">{f.category}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-[12px] text-white/40 font-mono">{f.owasp}</span>
                </div>
                <div className="col-span-1 flex items-center justify-between">
                  <span
                    className="text-[11px] font-medium capitalize px-2 py-0.5 rounded-full"
                    style={{ background: `${statusColor}20`, color: statusColor }}
                  >
                    {f.status}
                  </span>
                  <ChevronRight size={13} className="text-white/20 group-hover:text-white/50 transition-colors" />
                </div>
              </motion.div>
            )
          })}
        </div>

        {filtered.length === 0 && (
          <div className="py-16 text-center text-white/30 text-[14px]">
            No findings match your filters
          </div>
        )}
      </div>
    </motion.div>
  )
}
