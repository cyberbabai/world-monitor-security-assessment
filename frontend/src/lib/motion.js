export const spring = { type: 'spring', stiffness: 400, damping: 30 }
export const springGentle = { type: 'spring', stiffness: 200, damping: 25 }

export const pageVariants = {
  initial: { opacity: 0, y: 20, filter: 'blur(8px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { ...spring, duration: 0.3 } },
  exit:    { opacity: 0, y: -10, filter: 'blur(4px)', transition: { duration: 0.15 } },
}

export const cardVariants = {
  initial: { opacity: 0, scale: 0.96, y: 10 },
  animate: (i = 0) => ({
    opacity: 1, scale: 1, y: 0,
    transition: { ...spring, delay: i * 0.05 },
  }),
}

export const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: spring },
}

export const hoverLift = {
  whileHover: { scale: 1.02, transition: spring },
  whileTap:   { scale: 0.98, transition: spring },
}
