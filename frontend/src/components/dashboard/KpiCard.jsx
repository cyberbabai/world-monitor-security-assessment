import { motion } from 'framer-motion'
import { cardVariants } from '../../lib/motion'

export default function KpiCard({ label, value, color, icon: Icon, index = 0 }) {
  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
      custom={index}
      className="glass-card p-5"
    >
      <div className="flex items-center justify-between mb-3">
        <span
          className="text-[12px]"
          style={{ color: 'rgba(255,255,255,0.45)', fontFamily: '"Inter",sans-serif', fontWeight: 500 }}
        >
          {label}
        </span>
        {Icon && (
          <Icon size={14} style={{ color: color === '#FFFFFF' ? 'rgba(255,255,255,0.30)' : `${color}80` }} />
        )}
      </div>
      <span
        className="text-[40px] font-bold leading-none block"
        style={{ color: color ?? '#FFFFFF', fontFamily: '"IBM Plex Mono", monospace' }}
      >
        {value}
      </span>
    </motion.div>
  )
}
