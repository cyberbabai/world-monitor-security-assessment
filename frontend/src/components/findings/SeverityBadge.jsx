import { getSeverityConfig } from '../../lib/cvss'

export default function SeverityBadge({ severity, size = 'sm' }) {
  const cfg = getSeverityConfig(severity)
  const padding = size === 'lg' ? 'px-3 py-1 text-[13px]' : 'px-2 py-0.5 text-[11px]'

  return (
    <span
      className={`inline-flex items-center gap-1 font-semibold rounded-full ${padding}`}
      style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
    >
      {cfg.label}
    </span>
  )
}
