import { useState, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Shield, AlertTriangle } from 'lucide-react'
import { lazy } from 'react'
import AppleInput from '../components/ui/AppleInput'
import AppleButton from '../components/ui/AppleButton'
import { pageVariants, cardVariants } from '../lib/motion'

const ParticleNetwork = lazy(() => import('../components/three/ParticleNetwork'))

export default function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    await new Promise((r) => setTimeout(r, 800))

    if (form.email === 'assessor@ntro.gov.in' && form.password === 'worldmonitor2026') {
      localStorage.setItem('token', 'mock-jwt-token')
      navigate('/dashboard')
    } else {
      setError('Invalid credentials. Use assessor@ntro.gov.in / worldmonitor2026')
    }
    setLoading(false)
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black"
    >
      <Suspense fallback={null}>
        <ParticleNetwork />
      </Suspense>

      <div className="relative z-10 w-full max-w-sm px-4">
        <motion.div
          variants={cardVariants}
          initial="initial"
          animate="animate"
          custom={0}
          className="glass-card p-8"
        >
          <div className="flex flex-col items-center gap-2 mb-8">
            <div className="w-14 h-14 rounded-[16px] bg-[#0A84FF] flex items-center justify-center shadow-[0_0_40px_rgba(10,132,255,0.5)] mb-2">
              <Shield size={28} className="text-white" />
            </div>
            <h1 className="text-[22px] font-bold text-white">World Monitor</h1>
            <p className="text-[14px] text-white/50">Security Assessment Platform</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <AppleInput
              label="Email"
              type="email"
              name="email"
              placeholder="assessor@ntro.gov.in"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
            <AppleInput
              label="Password"
              type="password"
              name="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2 px-3 py-2.5 rounded-[10px] bg-[#FF453A]/10 border border-[#FF453A]/20 text-[13px] text-[#FF453A]"
              >
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                {error}
              </motion.div>
            )}

            <AppleButton
              type="submit"
              size="lg"
              disabled={loading}
              className="mt-2 w-full"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </AppleButton>
          </form>

          <p className="text-center text-[12px] text-white/25 mt-6">
            ⚠ Authorized personnel only — NTRO Internal
          </p>
        </motion.div>
      </div>
    </motion.div>
  )
}
