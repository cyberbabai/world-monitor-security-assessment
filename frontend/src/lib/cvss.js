export const getSeverityFromScore = (score) => {
  if (score >= 9.0) return 'critical'
  if (score >= 7.0) return 'high'
  if (score >= 4.0) return 'medium'
  if (score >= 0.1) return 'low'
  return 'info'
}

export const SEVERITY_CONFIG = {
  critical: { label: 'Critical', color: '#FF453A', bg: 'rgba(255,69,58,0.15)', border: 'rgba(255,69,58,0.3)', dot: '🔴' },
  high:     { label: 'High',     color: '#FF9F0A', bg: 'rgba(255,159,10,0.15)', border: 'rgba(255,159,10,0.3)', dot: '🟠' },
  medium:   { label: 'Medium',   color: '#FFD60A', bg: 'rgba(255,214,10,0.15)', border: 'rgba(255,214,10,0.3)', dot: '🟡' },
  low:      { label: 'Low',      color: '#30D158', bg: 'rgba(48,209,88,0.15)',  border: 'rgba(48,209,88,0.3)',  dot: '🟢' },
  info:     { label: 'Info',     color: '#636366', bg: 'rgba(99,99,102,0.15)', border: 'rgba(99,99,102,0.3)', dot: '⚪' },
}

export const getSeverityConfig = (severity) =>
  SEVERITY_CONFIG[severity?.toLowerCase()] ?? SEVERITY_CONFIG.info
