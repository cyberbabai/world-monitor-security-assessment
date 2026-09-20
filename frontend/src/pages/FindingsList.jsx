import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search } from 'lucide-react'
import { MOCK_FINDINGS } from '../lib/mockData'
import { getSeverityConfig } from '../lib/cvss'
import { pageVariants } from '../lib/motion'

const SEVERITY_FILTER = ['all', 'critical', 'high', 'medium', 'low']
const STATUS_FILTER = ['all', 'open', 'in-progress', 'fixed']

export default function FindingsList() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [severityFilter, setSeverityFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = MOCK_FINDINGS.filter((f) => {
    const matchSev = severityFilter === 'all' || f.severity === severityFilter
    const matchStatus = statusFilter === 'all' || f.status === statusFilter
    const matchSearch = !search ||
      f.title.toLowerCase().includes(search.toLowerCase()) ||
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
        <h1
          className="text-[28px] font-bold text-white leading-none"
          style={{ fontFamily: '"IBM Plex Mono", monospace' }}
        >
          Findings
        </h1>
        <p className="text-[13px] mt-2" style={{ color: 'rgba(255,255,255,0.40)', fontFamily: '"Inter",sans-serif' }}>
          {MOCK_FINDINGS.length} findings across all scans
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.30)' }} />
          <input
            type="text"
            placeholder="Search findings"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 rounded-[8px] text-[13px] text-white outline-none transition-colors duration-100"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.08)',
              fontFamily: '"Inter",sans-serif',
              width: 220,
            }}
          />
        </div>

        {/* Severity filter */}
        <div className="flex gap-1 p-1 rounded-[8px]" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          {SEVERITY_FILTER.map((s) => {
            const cfg = s !== 'all' ? getSeverityConfig(s) : null
            const active = severityFilter === s
            return (
              <button
                key={s}
                onClick={() => setSeverityFilter(s)}
                className="px-2.5 py-1 rounded-[6px] text-[12px] capitalize transition-colors duration-100"
                style={{
                  fontFamily: '"Inter",sans-serif',
                  fontWeight: 500,
                  background: active ? (cfg ? `${cfg.color}20` : 'rgba(255,255,255,0.10)') : 'transparent',
                  color: active ? (cfg?.color ?? '#fff') : 'rgba(255,255,255,0.40)',
                }}
              >
                {s}
              </button>
            )
          })}
        </div>

        {/* Status filter */}
        <div className="flex gap-1 p-1 rounded-[8px]" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          {STATUS_FILTER.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className="px-2.5 py-1 rounded-[6px] text-[12px] capitalize transition-colors duration-100"
              style={{
                fontFamily: '"Inter",sans-serif',
                fontWeight: 500,
                background: statusFilter === s ? 'rgba(255,255,255,0.10)' : 'transparent',
                color: statusFilter === s ? '#fff' : 'rgba(255,255,255,0.40)',
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        {/* Header — sentence case, not uppercase */}
        <div
          className="grid grid-cols-12 px-5 py-2.5 border-b text-[12px]"
          style={{
            borderColor: 'rgba(255,255,255,0.07)',
            color: 'rgba(255,255,255,0.35)',
            fontFamily: '"Inter",sans-serif',
            fontWeight: 500,
          }}
        >
          <div className="col-span-1">Sev</div>
          <div className="col-span-5">Title</div>
          <div className="col-span-1 text-center">Score</div>
          <div className="col-span-2">Category</div>
          <div className="col-span-2">OWASP</div>
          <div className="col-span-1">Status</div>
        </div>

        {filtered.map((f) => {
          const cfg = getSeverityConfig(f.severity)
          const statusColor = f.status === 'fixed' ? '#30D158' : f.status === 'in-progress' ? '#0A7CFF' : '#636366'
          return (
            <div
              key={f.id}
              onClick={() => navigate(`/findings/${f.id}`)}
              className="data-row grid grid-cols-12 items-center px-5 py-3.5 cursor-pointer"
            >
              <div className="col-span-1">
                <div className="w-2 h-2 rounded-full" style={{ background: cfg.color }} />
              </div>
              <div className="col-span-5">
                <p
                  className="text-[14px] font-medium text-white"
                  style={{ fontFamily: '"Inter",sans-serif' }}
                >
                  {f.title}
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: '"Inter",sans-serif' }}>
                  {f.endpoint}
                </p>
              </div>
              <div className="col-span-1 text-center">
                <span
                  className="text-[14px] font-bold"
                  style={{ color: cfg.color, fontFamily: '"IBM Plex Mono",monospace' }}
                >
                  {f.cvss}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-[13px]" style={{ color: 'rgba(255,255,255,0.55)', fontFamily: '"Inter",sans-serif' }}>
                  {f.category}
                </span>
              </div>
              <div className="col-span-2">
                <span
                  className="text-[12px]"
                  style={{ color: 'rgba(255,255,255,0.35)', fontFamily: '"IBM Plex Mono",monospace' }}
                >
                  {f.owasp}
                </span>
              </div>
              <div className="col-span-1">
                <span
                  className="text-[11px] px-2 py-0.5 rounded-full capitalize"
                  style={{
                    background: `${statusColor}18`,
                    color: statusColor,
                    fontFamily: '"Inter",sans-serif',
                    fontWeight: 500,
                  }}
                >
                  {f.status}
                </span>
              </div>
            </div>
          )
        })}

        {filtered.length === 0 && (
          <div className="py-16 text-center text-[14px]" style={{ color: 'rgba(255,255,255,0.25)', fontFamily: '"Inter",sans-serif' }}>
            No findings match your filters
          </div>
        )}
      </div>
    </motion.div>
  )
}
