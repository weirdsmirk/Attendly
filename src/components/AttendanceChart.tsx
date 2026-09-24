import { useMemo, useSyncExternalStore } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { attendanceTrend } from '../lib/attendance'

function subscribeTheme(cb: () => void) {
  const observer = new MutationObserver(cb)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
  return () => observer.disconnect()
}

export default function AttendanceChart({ records }: { records: readonly unknown[] }) {
  const isDark = useSyncExternalStore(
    subscribeTheme,
    () => document.documentElement.classList.contains('dark'),
    () => false,
  )
  const data = useMemo(
    () => attendanceTrend(records as never[]),
    [records],
  )
  const isEmpty = data.length === 0

  const grid = isDark ? '#1e293b' : '#e2e8f0'
  const tick = isDark ? '#94a3b8' : '#64748b'
  const line = isDark ? '#818cf8' : '#4f46e5'
  const tipBg = isDark ? '#0f172a' : '#ffffff'
  const tipBorder = isDark ? '#334155' : '#e2e8f0'

  return (
    <div className="relative w-full h-full">
      {!isEmpty && (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 0, left: -25, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={grid} />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: tick }} dy={10} />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: tick }}
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              contentStyle={{ borderRadius: '8px', border: `1px solid ${tipBorder}`, background: tipBg }}
              labelStyle={{ color: tick, fontSize: '12px', marginBottom: '4px' }}
              formatter={(value) => [`${value}%`, 'Attendance']}
            />
            <Line type="monotone" dataKey="value" stroke={line} strokeWidth={2} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      )}
      {isEmpty && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs text-slate-500 dark:text-slate-400 bg-white/80 dark:bg-slate-900/80 px-2 py-1 rounded">
            Mark attendance to see your trend
          </span>
        </div>
      )}
    </div>
  )
}
