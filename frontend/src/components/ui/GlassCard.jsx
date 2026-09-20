import { motion } from 'framer-motion'
import { cardVariants } from '../../lib/motion'

export default function GlassCard({ children, className = '', index = 0, hover = false, onClick, small = false }) {
  const base = small ? 'glass-card-sm' : 'glass-card'
  const hoverCls = hover ? 'cursor-pointer transition-all duration-200 hover:bg-white/[0.09] hover:shadow-[0_16px_48px_rgba(0,0,0,0.5)]' : ''

  return (
    <motion.div
      className={`${base} ${hoverCls} ${className}`}
      variants={cardVariants}
      initial="initial"
      animate="animate"
      custom={index}
      onClick={onClick}
    >
      {children}
    </motion.div>
  )
}
