import { useState, Suspense, lazy } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'
import AppleInput from '../components/ui/AppleInput'
import AppleButton from '../components/ui/AppleButton'
import { pageVariants } from '../lib/motion'

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
    await new Promise((r) => setTimeout(r, 700))

    if (form.email === 'assessor@ntro.gov.in' && form.password === 'worldmonitor2026') {
      localStorage.setItem('token', 'mock-jwt-token')
      navigate('/dashboard')
    } else {
      setError('Email or password is incorrect.')
    }
    setLoading(false)
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{ background: '#070C14' }}
    >
      <Suspense fallback={null}>
        <ParticleNetwork />
      </Suspense>

      <div className="relative z-10 w-full max-w-xs px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="glass-card p-8"
        >
          {/* Wordmark */}
          <div className="mb-8">
            <p
              className="text-[22px] font-bold leading-none"
              style={{ fontFamily: '"IBM Plex Mono", monospace', color: '#fff' }}
            >
              WM/SEC
            </p>
            <p className="text-[12px] mt-2" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: '"Inter",sans-serif' }}>
              Authorized access only — NTRO
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <AppleInput
              label="Email"
              type="email"
              name="email"
              placeholder="you@ntro.gov.in"
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
              <div
                className="flex items-start gap-2 px-3 py-2.5 rounded-[8px] text-[13px]"
                style={{
                  background: 'rgba(255,69,58,0.10)',
                  border: '1px solid rgba(255,69,58,0.20)',
                  color: '#FF453A',
                  fontFamily: '"Inter",sans-serif',
                }}
              >
                <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <AppleButton type="submit" size="lg" disabled={loading} className="mt-1 w-full">
              {loading ? 'Signing in…' : 'Sign in'}
            </AppleButton>
          </form>
        </motion.div>
      </div>
    </motion.div>
  )
}
