import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

export default function CodeBlock({ code, label }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="glass-card-sm overflow-hidden">
      {label && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.07]">
          <span className="text-[12px] text-white/40 font-medium">{label}</span>
          <button
            onClick={handleCopy}
            className="text-white/30 hover:text-white/70 transition-colors"
          >
            {copied ? <Check size={14} className="text-[#30D158]" /> : <Copy size={14} />}
          </button>
        </div>
      )}
      <pre className="p-4 text-[13px] text-[#30D158] font-mono overflow-x-auto leading-relaxed whitespace-pre-wrap break-all">
        {code}
      </pre>
    </div>
  )
}
