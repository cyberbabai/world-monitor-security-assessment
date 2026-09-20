import { motion } from 'framer-motion'

export default function ModuleToggle({ label, description, enabled, onToggle, action }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 rounded-[12px] bg-white/[0.04] border border-white/[0.07]">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggle}
          className="relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0"
          style={{ background: enabled ? '#0A84FF' : 'rgba(255,255,255,0.12)' }}
        >
          <motion.div
            animate={{ x: enabled ? 20 : 2 }}
            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
          />
        </button>
        <div>
          <p className="text-[14px] font-medium text-white">{label}</p>
          {description && <p className="text-[12px] text-white/40">{description}</p>}
        </div>
      </div>
      {action && <div className="ml-4">{action}</div>}
    </div>
  )
}
