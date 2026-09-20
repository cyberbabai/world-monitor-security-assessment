import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Plus, AlertTriangle,
  FileText, CheckSquare, LogOut,
} from 'lucide-react'

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/scan/new',  icon: Plus,            label: 'New Scan' },
  { to: '/findings',  icon: AlertTriangle,   label: 'Findings' },
  { to: '/report',    icon: FileText,        label: 'Report' },
  { to: '/tracker',   icon: CheckSquare,     label: 'Tracker' },
]

export default function Sidebar() {
  const handleLogout = () => {
    localStorage.removeItem('token')
    window.location.href = '/login'
  }

  return (
    <aside className="glass-sidebar w-56 min-h-screen flex flex-col py-7 shrink-0">
      <div className="px-5 mb-8">
        <p
          className="text-[17px] font-bold tracking-tight leading-none"
          style={{ fontFamily: '"IBM Plex Mono", monospace', color: '#fff' }}
        >
          WM/SEC
        </p>
        <p className="text-[11px] mt-1.5" style={{ color: 'rgba(255,255,255,0.30)', fontFamily: '"Inter", sans-serif' }}>
          Assessment Platform
        </p>
      </div>

      <nav className="flex-1 px-3 flex flex-col gap-0.5">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-[8px] text-[13px] transition-colors duration-100
              ${isActive
                ? 'bg-[#0A7CFF]/12 text-[#0A7CFF]'
                : 'text-white/40 hover:text-white/80 hover:bg-white/[0.04]'
              }`
            }
            style={{ fontFamily: '"Inter", sans-serif', fontWeight: 500 }}
          >
            <Icon size={14} className="shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-[8px] text-[13px] w-full
            text-white/25 hover:text-[#FF453A] hover:bg-[#FF453A]/08 transition-colors duration-100"
          style={{ fontFamily: '"Inter", sans-serif', fontWeight: 500 }}
        >
          <LogOut size={14} className="shrink-0" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
