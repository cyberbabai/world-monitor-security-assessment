import { Suspense, lazy, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, CheckSquare, Square, ExternalLink } from 'lucide-react'
import SeverityBadge from '../components/findings/SeverityBadge'
import CodeBlock from '../components/findings/CodeBlock'
import { MOCK_FINDINGS } from '../lib/mockData'
import { pageVariants, cardVariants } from '../lib/motion'

const CvssRing3D = lazy(() => import('../components/three/CvssRing3D'))

const STATUS_OPTIONS = ['open', 'in-progress', 'fixed', 'accepted']
const STATUS_COLORS = { open: '#636366', 'in-progress': '#0A84FF', fixed: '#30D158', accepted: '#FF9F0A' }

export default function FindingDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const finding = MOCK_FINDINGS.find((f) => f.id === id) ?? MOCK_FINDINGS[0]
  const [status, setStatus] = useState(finding.status)
  const [checkedItems, setCheckedItems] = useState([])

  const toggleCheck = (i) =>
    setCheckedItems((prev) => prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i])

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="p-8 space-y-6"
    >
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/findings')}
          className="text-white/40 hover:text-white transition-colors flex items-center gap-1.5 text-[14px]"
        >
          <ArrowLeft size={15} />
          Back
        </button>
        <span className="text-white/20">/</span>
        <span className="text-[14px] text-white/60 truncate max-w-xs">{finding.title}</span>
        <div className="ml-auto">
          <SeverityBadge severity={finding.severity} size="lg" />
        </div>
      </div>

      <h1 className="text-[28px] font-bold text-white">{finding.title}</h1>

      <div className="grid grid-cols-5 gap-6">
        <div className="col-span-2 space-y-4">
          <div className="glass-card p-5">
            <div className="h-52">
              <Suspense fallback={
                <div className="h-full flex items-center justify-center text-white/20 text-[13px]">
                  Loading…
                </div>
              }>
                <CvssRing3D score={finding.cvss} severity={finding.severity} />
              </Suspense>
            </div>

            <div className="space-y-2 mt-4">
              <div className="flex justify-between text-[13px]">
                <span className="text-white/40">CVSS Score</span>
                <span className="font-bold text-white">{finding.cvss} / 10</span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="text-white/40">Vector</span>
                <span className="text-white/60 font-mono text-[11px] text-right max-w-32 break-all">
                  {finding.cvssVector.replace('CVSS:3.1/', '')}
                </span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="text-white/40">CWE</span>
                <span className="text-white/60">{finding.cwe}</span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="text-white/40">OWASP</span>
                <span className="text-white/60">{finding.owasp}</span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="text-white/40">Category</span>
                <span className="text-white/60">{finding.category}</span>
              </div>
            </div>
          </div>

          <div className="glass-card-sm p-4">
            <p className="text-[12px] text-white/40 mb-2">Status</p>
            <div className="flex flex-wrap gap-1.5">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className="px-3 py-1.5 rounded-full text-[12px] font-medium capitalize transition-all duration-150"
                  style={status === s ? {
                    background: `${STATUS_COLORS[s]}20`,
                    color: STATUS_COLORS[s],
                    border: `1px solid ${STATUS_COLORS[s]}40`,
                  } : {
                    background: 'rgba(255,255,255,0.05)',
                    color: 'rgba(255,255,255,0.35)',
                    border: '1px solid rgba(255,255,255,0.07)',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="glass-card-sm p-4 space-y-2">
            <p className="text-[12px] text-white/40 mb-3">Discovered</p>
            <p className="text-[13px] text-white/70">
              {new Date(finding.discoveredAt).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="col-span-3 space-y-5">
          <div className="glass-card p-5 space-y-3">
            <h2 className="text-[16px] font-semibold text-white">Description</h2>
            <p className="text-[14px] text-white/70 leading-relaxed">{finding.description}</p>
          </div>

          <div className="glass-card p-5 space-y-3">
            <h2 className="text-[16px] font-semibold text-white">Steps to Reproduce</h2>
            <ol className="space-y-2">
              {finding.steps.map((step, i) => (
                <li key={i} className="flex gap-3 text-[14px] text-white/70">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-[#0A84FF]/15 text-[#0A84FF] text-[11px] font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          <div className="space-y-3">
            <h2 className="text-[16px] font-semibold text-white px-1">Proof of Concept</h2>
            <CodeBlock code={finding.request} label="HTTP Request" />
            <CodeBlock code={finding.response} label="HTTP Response" />
          </div>

          <div className="glass-card p-5 space-y-3">
            <h2 className="text-[16px] font-semibold text-white">Business Impact</h2>
            <p className="text-[14px] text-white/70 leading-relaxed">{finding.impact}</p>
          </div>

          <div className="glass-card p-5 space-y-3">
            <h2 className="text-[16px] font-semibold text-white">Remediation</h2>
            <div className="space-y-2">
              {finding.remediation.map((item, i) => (
                <button
                  key={i}
                  onClick={() => toggleCheck(i)}
                  className="flex items-start gap-3 w-full text-left group"
                >
                  {checkedItems.includes(i)
                    ? <CheckSquare size={15} className="text-[#30D158] shrink-0 mt-0.5" />
                    : <Square size={15} className="text-white/30 group-hover:text-white/50 shrink-0 mt-0.5 transition-colors" />
                  }
                  <span className={`text-[14px] transition-colors ${checkedItems.includes(i) ? 'text-white/40 line-through' : 'text-white/70'}`}>
                    {item}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="glass-card-sm p-4 space-y-2">
            <h2 className="text-[14px] font-semibold text-white mb-3">References</h2>
            {finding.references.map((ref, i) => (
              <a
                key={i}
                href={ref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-[13px] text-[#0A84FF] hover:text-[#0A84FF]/80 transition-colors"
              >
                <ExternalLink size={12} />
                <span className="truncate">{ref}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
