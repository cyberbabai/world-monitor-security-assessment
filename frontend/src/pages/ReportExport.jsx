import { useState } from 'react'
import { motion } from 'framer-motion'
import { FileText, Code2, Archive, Download, Check } from 'lucide-react'
import SeverityDonut from '../components/dashboard/SeverityDonut'
import { MOCK_COUNTS, MOCK_FINDINGS } from '../lib/mockData'
import { getSeverityConfig } from '../lib/cvss'
import { pageVariants, cardVariants } from '../lib/motion'

const EXPORT_FORMATS = [
  { id: 'pdf',      label: 'PDF Report',      icon: FileText, desc: 'Executive + technical full report' },
  { id: 'json',     label: 'JSON Export',     icon: Code2,    desc: 'Machine-readable findings data' },
  { id: 'evidence', label: 'Evidence Bundle', icon: Archive,  desc: 'Screenshots + raw tool output ZIP' },
]

export default function ReportExport() {
  const [includeSev, setIncludeSev] = useState({ critical: true, high: true, medium: true, low: true, info: false })
  const [downloaded, setDownloaded] = useState({})

  const handleDownload = (format) => {
    if (format === 'json') {
      const filtered = MOCK_FINDINGS.filter((f) => includeSev[f.severity])
      const blob = new Blob([JSON.stringify({
        meta: { generated: new Date().toISOString(), project: 'World Monitor Security Assessment', organization: 'NTRO' },
        summary: MOCK_COUNTS,
        findings: filtered,
      }, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `world-monitor-findings-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
    }
    setDownloaded((prev) => ({ ...prev, [format]: true }))
    setTimeout(() => setDownloaded((prev) => ({ ...prev, [format]: false })), 3000)
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="p-8 space-y-6 max-w-3xl"
    >
      <div>
        <h1 className="text-[34px] font-bold text-white">Report Export</h1>
        <p className="text-[15px] text-white/50 mt-1">Generate and download assessment reports</p>
      </div>

      <motion.div variants={cardVariants} initial="initial" animate="animate" custom={0} className="glass-card p-6 space-y-4">
        <h2 className="text-[15px] font-semibold text-white">Include Severity Levels</h2>
        <div className="flex flex-wrap gap-2">
          {['critical', 'high', 'medium', 'low', 'info'].map((s) => {
            const cfg = getSeverityConfig(s)
            const on = includeSev[s]
            return (
              <button
                key={s}
                onClick={() => setIncludeSev((prev) => ({ ...prev, [s]: !prev[s] }))}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all duration-150 capitalize"
                style={on ? {
                  background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
                } : {
                  background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: on ? cfg.color : 'rgba(255,255,255,0.2)' }} />
                {cfg.label} ({MOCK_COUNTS[s] ?? 0})
              </button>
            )
          })}
        </div>
      </motion.div>

      <div className="grid grid-cols-3 gap-4">
        {EXPORT_FORMATS.map((fmt, i) => {
          const Icon = fmt.icon
          const done = downloaded[fmt.id]
          return (
            <motion.button
              key={fmt.id}
              variants={cardVariants}
              initial="initial"
              animate="animate"
              custom={i + 1}
              whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(10,132,255,0.15)' }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleDownload(fmt.id)}
              className="glass-card p-5 flex flex-col items-center gap-3 cursor-pointer
                border hover:border-[#0A84FF]/30 transition-all duration-150"
            >
              <div className={`w-12 h-12 rounded-[14px] flex items-center justify-center transition-all duration-300
                ${done ? 'bg-[#30D158]/20' : 'bg-[#0A84FF]/15'}`}>
                {done
                  ? <Check size={22} className="text-[#30D158]" />
                  : <Icon size={22} className="text-[#0A84FF]" />
                }
              </div>
              <div className="text-center">
                <p className="text-[14px] font-semibold text-white">{fmt.label}</p>
                <p className="text-[12px] text-white/40 mt-0.5">{fmt.desc}</p>
              </div>
              <div className="flex items-center gap-1.5 text-[12px] text-[#0A84FF]">
                <Download size={12} />
                {done ? 'Downloaded' : 'Download'}
              </div>
            </motion.button>
          )
        })}
      </div>

      <motion.div variants={cardVariants} initial="initial" animate="animate" custom={4} className="glass-card p-6">
        <h2 className="text-[15px] font-semibold text-white mb-4">Report Preview</h2>
        <div className="glass-card-sm p-5 bg-white/[0.03]">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-[16px] font-bold text-white">World Monitor Security Assessment Report</p>
              <p className="text-[13px] text-white/50 mt-1">NTRO · {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long' })}</p>
            </div>
            <div className="text-right">
              <p className="text-[12px] text-white/40">CONFIDENTIAL</p>
              <p className="text-[12px] text-white/40">Authorized use only</p>
            </div>
          </div>
          <div className="flex items-center gap-6 py-4 border-y border-white/[0.07] mb-4">
            {['critical', 'high', 'medium', 'low'].map((s) => {
              const cfg = getSeverityConfig(s)
              return (
                <div key={s} className="text-center">
                  <p className="text-[24px] font-bold" style={{ color: cfg.color }}>{MOCK_COUNTS[s]}</p>
                  <p className="text-[11px] text-white/40">{cfg.label}</p>
                </div>
              )
            })}
            <div className="ml-auto h-20 w-20">
              <SeverityDonut counts={MOCK_COUNTS} />
            </div>
          </div>
          <div className="space-y-1">
            {MOCK_FINDINGS.filter((f) => includeSev[f.severity]).slice(0, 4).map((f) => {
              const cfg = getSeverityConfig(f.severity)
              return (
                <div key={f.id} className="flex items-center gap-3 py-1.5 text-[13px]">
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: cfg.color }} />
                  <span className="text-white/70 flex-1">{f.title}</span>
                  <span className="font-bold" style={{ color: cfg.color }}>{f.cvss}</span>
                  <span className="text-white/30 text-[11px]">{f.owasp}</span>
                </div>
              )
            })}
            {MOCK_FINDINGS.filter((f) => includeSev[f.severity]).length > 4 && (
              <p className="text-[12px] text-white/30 pl-5 pt-1">
                + {MOCK_FINDINGS.filter((f) => includeSev[f.severity]).length - 4} more findings…
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
