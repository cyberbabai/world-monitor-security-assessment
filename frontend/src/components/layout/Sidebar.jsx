import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, Plus, AlertTriangle,
  FileText, CheckSquare, Shield, LogOut,
} from 'lucide-react'

const NAV_ITEMS = [
  { to: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/scan/new',   icon: Plus,            label: 'New Scan' },
  { to: '/findings',   icon: AlertTriangle,   label: 'Findings' },
  { to: '/report',     icon: FileText,        label: 'Report' },
  { to: '/tracker',    icon: CheckSquare,     label: 'Tracker' },
]

export default function Sidebar() {
  const handleLogout = () => {
    localStorage.removeItem('token')
    window.location.href = '/login'
  }

  return (
    <motion.aside
      initial={{ x: -80, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="glass-sidebar w-64 min-h-screen flex flex-col py-6 shrink-0"
    >
      <div className="px-6 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[10px] bg-[#0A84FF] flex items-center justify-center shadow-[0_0_20px_rgba(10,132,255,0.4)]">
            <Shield size={18} className="text-white" />
          </div>
          <div>
            <p className="text-[15px] font-semibold text-white leading-tight">World Monitor</p>
            <p className="text-[11px] text-white/40">Security Assessment</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 flex flex-col gap-1">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `
              flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[14px] font-medium
              transition-all duration-150 group
              ${isActive
                ? 'bg-[#0A84FF]/15 text-[#0A84FF] border border-[#0A84FF]/20'
                : 'text-white/50 hover:text-white hover:bg-white/[0.07]'
              }
            `}
          >
            <Icon size={16} className="shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 mt-4">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[14px] font-medium
            text-white/30 hover:text-[#FF453A] hover:bg-[#FF453A]/10 w-full transition-all duration-150"
        >
          <LogOut size={16} className="shrink-0" />
          Sign Out
        </button>
      </div>
    </motion.aside>
  )
}
