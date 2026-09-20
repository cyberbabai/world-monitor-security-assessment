import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { SEVERITY_CONFIG } from '../../lib/cvss'

const RADIAN = Math.PI / 180
const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, value }) => {
  if (value === 0) return null
  const r = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + r * Math.cos(-midAngle * RADIAN)
  const y = cy + r * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central"
      fontSize={13} fontWeight={700} opacity={0.9}>
      {value}
    </text>
  )
}

export default function SeverityDonut({ counts = {} }) {
  const data = ['critical', 'high', 'medium', 'low', 'info']
    .map((s) => ({ name: SEVERITY_CONFIG[s].label, value: counts[s] ?? 0, color: SEVERITY_CONFIG[s].color }))
    .filter((d) => d.value > 0)

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-white/30 text-[14px]">
        No findings yet
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius="55%"
          outerRadius="80%"
          paddingAngle={3}
          dataKey="value"
          labelLine={false}
          label={renderLabel}
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color} opacity={0.9} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: 'rgba(28,28,30,0.95)',
            border: '1px solid rgba(255,255,255,0.10)',
            borderRadius: '10px',
            color: '#fff',
            fontSize: '13px',
          }}
          itemStyle={{ color: '#fff' }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
