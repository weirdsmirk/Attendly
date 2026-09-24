'use client';
import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, parseISO, subDays } from 'date-fns';
import type { AttendanceRecord } from '@/app/actions';

export default function AttendanceChart({ records }: { records?: AttendanceRecord[] }) {
  const data = useMemo(() => {
    if (!records || records.length === 0) {
      return [
        { name: 'No data', value: 0 },
      ];
    }
    // Last 30 days, bucketed into up to 6 points: cumulative attendance % up to each bucket date
    const points: { name: string; value: number }[] = [];
    const sorted = [...records]
      .filter(r => r.status === 'Attended' || r.status === 'Skipped')
      .sort((a, b) => a.date.localeCompare(b.date));

    if (sorted.length === 0) return [{ name: 'No data', value: 100 }];

    const today = new Date();
    const buckets = 6;
    for (let i = buckets - 1; i >= 0; i--) {
      const cutoff = subDays(today, i * 5);
      const cutoffStr = format(cutoff, 'yyyy-MM-dd');
      const upTo = sorted.filter(r => r.date <= cutoffStr);
      if (upTo.length === 0) continue;
      const attended = upTo.filter(r => r.status === 'Attended').length;
      const pct = Math.round((attended / upTo.length) * 100);
      let label = cutoffStr;
      try {
        label = format(cutoff, 'MMM dd');
      } catch { /* keep raw */ }
      points.push({ name: label, value: pct });
    }

    if (points.length === 0) {
      const attended = sorted.filter(r => r.status === 'Attended').length;
      const pct = Math.round((attended / sorted.length) * 100);
      try {
        const lastDate = parseISO(sorted[sorted.length - 1].date);
        points.push({ name: format(lastDate, 'MMM dd'), value: pct });
      } catch {
        points.push({ name: 'Latest', value: pct });
      }
    }
    return points;
  }, [records]);

  const isEmpty = !records || records.length === 0;

  return (
    <div className="relative w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 0, left: -25, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tickFormatter={(val) => `${val}%`} />
          <Tooltip
            contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff' }}
            labelStyle={{ color: '#64748b', fontSize: '12px', marginBottom: '4px' }}
            formatter={(value) => [`${value}%`, 'Attendance']}
          />
          <Line type="monotone" dataKey="value" stroke="#4f46e5" strokeWidth={2} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
        </LineChart>
      </ResponsiveContainer>
      {isEmpty && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-xs text-slate-400 bg-white/80 dark:bg-slate-900/80 px-2 py-1 rounded">Mark attendance to see your trend</span>
        </div>
      )}
    </div>
  );
}
