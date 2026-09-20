import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Play, Globe, Upload } from 'lucide-react'
import AppleButton from '../components/ui/AppleButton'
import AppleInput from '../components/ui/AppleInput'
import ModuleToggle from '../components/scan/ModuleToggle'
import { pageVariants } from '../lib/motion'

const MODULES = [
  { id: 'recon',    label: 'Reconnaissance & Fingerprinting', description: 'nmap, ffuf, gobuster, Wappalyzer' },
  { id: 'auth',     label: 'Authentication & Session',        description: 'JWT, OAuth, brute-force, MFA bypass' },
  { id: 'authz',    label: 'Authorization & Access Control',  description: 'IDOR, BOLA, privilege escalation' },
  { id: 'inject',   label: 'Injection (SQL, XSS, XXE, SSTI)', description: 'sqlmap, Burp Scanner, nuclei' },
  { id: 'tls',      label: 'TLS & Secure Communication',      description: 'testssl.sh, cipher suite analysis' },
  { id: 'client',   label: 'Client-Side Security',            description: 'CSP, CORS, cookies, SRI checks' },
  { id: 'mobile',   label: 'Mobile APK Analysis',             description: 'MobSF, apktool, Frida', optional: true },
  { id: 'graphql',  label: 'GraphQL / API Security',          description: 'Introspection, batching, complexity', optional: true },
]

const INTENSITIES = [
  { id: 'quick',    label: 'Quick',    duration: '~15 min' },
  { id: 'standard', label: 'Standard', duration: '~1 hr' },
  { id: 'full',     label: 'Full',     duration: '~4 hr' },
]

export default function NewScan() {
  const navigate = useNavigate()
  const [url, setUrl] = useState('')
  const [modules, setModules] = useState(
    Object.fromEntries(MODULES.map((m) => [m.id, !m.optional]))
  )
  const [intensity, setIntensity] = useState('standard')

  const toggleModule = (id) => setModules((prev) => ({ ...prev, [id]: !prev[id] }))

  const handleStart = () => {
    navigate('/scan/demo/progress')
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="p-8 max-w-2xl"
    >
      <h1 className="text-[34px] font-bold text-white mb-1">New Scan</h1>
      <p className="text-[15px] text-white/50 mb-8">Configure and launch a security assessment</p>

      <div className="glass-card p-6 space-y-6">
        <div>
          <label className="text-[13px] font-medium text-white/60 block mb-2 pl-1">Target URL</label>
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Globe size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://worldmonitor.ntro.gov.in"
                className="w-full pl-10 pr-4 py-3 rounded-[12px] text-[15px] text-white placeholder-white/30
                  bg-white/[0.07] border border-white/10 outline-none transition-all duration-200
                  focus:bg-white/[0.10] focus:border-[#0A84FF]/50 focus:ring-1 focus:ring-[#0A84FF]/20"
              />
            </div>
            <AppleButton variant="ghost" size="md">Verify</AppleButton>
          </div>
        </div>

        <div>
          <p className="text-[13px] font-medium text-white/60 mb-3 pl-1">Scan Modules</p>
          <div className="space-y-2">
            {MODULES.map((mod) => (
              <ModuleToggle
                key={mod.id}
                label={mod.label}
                description={mod.description}
                enabled={modules[mod.id]}
                onToggle={() => toggleModule(mod.id)}
                action={mod.id === 'mobile' && modules[mod.id] ? (
                  <button className="flex items-center gap-1.5 text-[12px] text-white/40 hover:text-white/70 transition-colors">
                    <Upload size={13} />
                    Upload APK
                  </button>
                ) : null}
              />
            ))}
          </div>
        </div>

        <div>
          <p className="text-[13px] font-medium text-white/60 mb-3 pl-1">Scan Intensity</p>
          <div className="flex gap-2">
            {INTENSITIES.map((item) => (
              <button
                key={item.id}
                onClick={() => setIntensity(item.id)}
                className={`flex-1 py-3 rounded-[12px] text-[14px] font-medium transition-all duration-150 border
                  ${intensity === item.id
                    ? 'bg-[#0A84FF]/15 text-[#0A84FF] border-[#0A84FF]/30'
                    : 'bg-white/[0.04] text-white/50 border-white/[0.07] hover:bg-white/[0.07] hover:text-white/80'
                  }`}
              >
                <div>{item.label}</div>
                <div className="text-[11px] opacity-60 mt-0.5">{item.duration}</div>
              </button>
            ))}
          </div>
        </div>

        <AppleButton size="lg" className="w-full" onClick={handleStart}>
          <Play size={16} />
          Start Scan
        </AppleButton>
      </div>
    </motion.div>
  )
}
