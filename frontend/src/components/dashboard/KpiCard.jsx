import { motion } from 'framer-motion'
import { cardVariants } from '../../lib/motion'

export default function KpiCard({ label, value, color, icon: Icon, index = 0 }) {
  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
      custom={index}
      className="glass-card p-5 flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <span className="text-[13px] text-white/50 font-medium">{label}</span>
        {Icon && (
          <div className="w-8 h-8 rounded-[8px] flex items-center justify-center"
            style={{ background: `${color}20` }}>
            <Icon size={15} style={{ color }} />
          </div>
        )}
      </div>
      <span
        className="text-[42px] font-bold leading-none"
        style={{ color: color ?? '#FFFFFF' }}
      >
        {value}
      </span>
    </motion.div>
  )
}
