import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

export default function AppleInput({
  label, type = 'text', placeholder, value, onChange,
  error, className = '', required = false, name,
}) {
  const [showPwd, setShowPwd] = useState(false)
  const inputType = type === 'password' ? (showPwd ? 'text' : 'password') : type

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-[13px] font-medium text-white/60 pl-1">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          name={name}
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          className={`
            w-full px-4 py-3 rounded-[12px] text-[15px] text-white placeholder-white/30
            bg-white/[0.07] border transition-all duration-200 outline-none
            focus:bg-white/[0.10] focus:border-[#0A84FF]/50 focus:ring-1 focus:ring-[#0A84FF]/20
            ${error ? 'border-[#FF453A]/50' : 'border-white/10'}
            ${type === 'password' ? 'pr-11' : ''}
          `}
        />
        {type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPwd(!showPwd)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
          >
            {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {error && <p className="text-[12px] text-[#FF453A] pl-1">{error}</p>}
    </div>
  )
}
