import { motion } from 'framer-motion'
import { spring } from '../../lib/motion'

const VARIANTS = {
  primary:     'bg-[#0A84FF] text-white hover:bg-[#0070e0] shadow-[0_0_20px_rgba(10,132,255,0.3)]',
  ghost:       'bg-white/[0.08] text-white border border-white/10 hover:bg-white/[0.12]',
  destructive: 'bg-[#FF453A]/20 text-[#FF453A] border border-[#FF453A]/30 hover:bg-[#FF453A]/30',
  success:     'bg-[#30D158]/20 text-[#30D158] border border-[#30D158]/30 hover:bg-[#30D158]/30',
}

export default function AppleButton({
  children, variant = 'primary', className = '',
  disabled = false, onClick, type = 'button', size = 'md',
}) {
  const sizeClass = size === 'lg' ? 'px-8 py-3.5 text-[16px]' : size === 'sm' ? 'px-4 py-1.5 text-[13px]' : 'px-6 py-2.5 text-[15px]'

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: 1.02, transition: spring }}
      whileTap={{ scale: 0.97, transition: spring }}
      className={`
        inline-flex items-center justify-center gap-2 font-semibold rounded-[12px]
        transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed
        ${VARIANTS[variant]} ${sizeClass} ${className}
      `}
    >
      {children}
    </motion.button>
  )
}
