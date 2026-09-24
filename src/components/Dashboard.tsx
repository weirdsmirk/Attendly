import { useMemo } from 'react'
import { TrendingUp, CheckCircle2, AlertCircle, Zap, ArrowRight } from 'lucide-react'
import { useStore } from '../lib/store'
import {
  computeStreaks,
  summarizeAll,
  summarizeSubject,
  todaysClasses,
} from '../lib/attendance'
import AttendanceChart from './AttendanceChart'
import DashboardGreeting from './DashboardGreeting'
import MarkAttendanceBtn from './MarkAttendanceBtn'

const METRICS = [
  { key: 'overall', label: 'Overall attendance', Icon: TrendingUp, tint: 'emerald' },
  { key: 'attended', label: 'Classes attended', Icon: CheckCircle2, tint: 'blue' },
  { key: 'missed', label: 'Classes missed', Icon: AlertCircle, tint: 'amber' },
  { key: 'streak', label: 'Current streak', Icon: Zap, tint: 'violet' },
] as const

const TINTS: Record<string, { card: string; icon: string; value: string }> = {
  emerald: {
    card: 'bg-emerald-50/40 dark:bg-emerald-950/10 border-emerald-200/50 dark:border-emerald-900/40',
    icon: 'bg-emerald-500/85',
    value: 'text-emerald-600 dark:text-emerald-400',
  },
  blue: {
    card: 'bg-blue-50/40 dark:bg-blue-950/10 border-blue-200/50 dark:border-blue-900/40',
    icon: 'bg-blue-500/85',
    value: 'text-blue-600 dark:text-blue-400',
  },
  amber: {
    card: 'bg-amber-50/40 dark:bg-amber-950/10 border-amber-200/50 dark:border-amber-900/40',
    icon: 'bg-amber-500/85',
    value: 'text-amber-600 dark:text-amber-400',
  },
  violet: {
    card: 'bg-violet-50/40 dark:bg-violet-950/10 border-violet-200/50 dark:border-violet-900/40',
    icon: 'bg-violet-500/85',
    value: 'text-violet-600 dark:text-violet-400',
  },
}

export default function Dashboard({ onNavigate }: { onNavigate: (page: string) => void }) {
  const { subjects, records, timetable, subjectIds } = useStore()

  const totals = useMemo(() => summarizeAll(subjects, records), [subjects, records])
  const streaks = useMemo(() => computeStreaks(records), [records])
  const atRisk = useMemo(
    () => subjects.filter((s) => !summarizeSubject(s, records).onTrack).length,
    [subjects, records],
  )
  const today = useMemo(() => todaysClasses(timetable), [timetable])
  const todaysClassesWithSubject = useMemo(() => {
    const byId = new Map(subjects.map((s) => [s.id, s]))
    return today
      .filter((t) => subjectIds.has(t.subject_id))
      .map((t) => ({ ...t, subject: byId.get(t.subject_id)! }))
  }, [today, subjects, subjectIds])

  const values: Record<(typeof METRICS)[number]['key'], string> = {
    overall: `${totals.percentage}%`,
    attended: String(totals.attended),
    missed: String(totals.missed),
    streak: `${streaks.current} day${streaks.current === 1 ? '' : 's'}`,
  }

  return (
    <>
      <div className="mb-8">
        <DashboardGreeting />
        <p className="text-slate-600 dark:text-slate-400 text-sm">
          {streaks.current > 0 ? (
            <>
              Keep your momentum going. You&apos;re on a{' '}
              <span className="font-semibold text-slate-900 dark:text-slate-200">
                {streaks.current}-day attendance streak
              </span>
              .
            </>
          ) : (
            <>Mark today&apos;s classes to start a new attendance streak.</>
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
        {METRICS.map(({ key, label, Icon, tint }) => {
          const t = TINTS[tint]
          return (
            <div key={key} className={`card p-7 rounded-2xl ${t.card}`}>
              <div className="flex items-center gap-3 mb-7">
                <div className={`w-10 h-10 rounded-xl ${t.icon} text-white flex items-center justify-center`}>
                  <Icon size={18} strokeWidth={2.2} />
                </div>
                <span className="text-[13px] font-semibold tracking-tight text-slate-700 dark:text-slate-300">
                  {label}
                </span>
              </div>
              <div className={`text-[42px] font-black tracking-tight leading-none mb-3 ${t.value}`}>
                {values[key]}
              </div>
              <div className="flex items-center justify-between text-[13px]">
                {key === 'overall' && (
                  <>
                    <span className="font-medium text-slate-600 dark:text-slate-300">Across all subjects</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                      {totals.attended}/{totals.conducted} classes
                    </span>
                  </>
                )}
                {key === 'attended' && (
                  <>
                    <span className="font-medium text-slate-600 dark:text-slate-300">
                      of {totals.conducted} conducted
                    </span>
                    <span className="text-slate-600 dark:text-slate-300">This semester</span>
                  </>
                )}
                {key === 'missed' && (
                  <>
                    <span className="font-medium text-slate-600 dark:text-slate-300">Keep an eye on these</span>
                    <span className="text-rose-700 dark:text-rose-300 font-semibold bg-rose-100 dark:bg-rose-900/30 px-2.5 py-1 rounded-full text-xs">
                      {atRisk > 0 ? `${atRisk} at risk` : 'On track'}
                    </span>
                  </>
                )}
                {key === 'streak' && (
                  <>
                    <span className="font-medium text-slate-600 dark:text-slate-300">
                      Your best is {streaks.best} day{streaks.best === 1 ? '' : 's'}
                    </span>
                    <span className="text-emerald-700 dark:text-emerald-300 font-semibold bg-emerald-100 dark:bg-emerald-900/30 px-2.5 py-1 rounded-full text-xs">
                      Keep it up
                    </span>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Today&apos;s classes</h2>
              <p className="text-sm text-slate-500">{todaysClassesWithSubject.length} scheduled</p>
            </div>
            <button
              onClick={() => onNavigate('timetable')}
              className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700 cursor-pointer"
            >
              View timetable <ArrowRight size={14} />
            </button>
          </div>

          <div className="space-y-4">
            {todaysClassesWithSubject.length === 0 ? (
              <div className="text-sm text-slate-500 text-center py-8">No classes today.</div>
            ) : (
              todaysClassesWithSubject.map((cls) => (
                <div
                  key={cls.id}
                  className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0"
                >
                  <div className="flex items-start gap-4">
                    <div className="text-sm font-semibold text-slate-900 dark:text-white w-12 pt-1">
                      {cls.start_time}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cls.subject.color }} />
                        {cls.subject.name}
                      </div>
                      <div className="text-xs text-slate-500">
                        {cls.room} &middot; {cls.subject.teacher}
                      </div>
                    </div>
                  </div>
                  <MarkAttendanceBtn subjectId={cls.subject_id} />
                </div>
              ))
            )}
          </div>
          <button
            onClick={() => onNavigate('timetable')}
            className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700 mt-4 cursor-pointer"
          >
            View all classes <ArrowRight size={14} />
          </button>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Attendance trend</h2>
            <div className="text-sm font-medium text-slate-500">Last 30 days</div>
          </div>
          <div className="h-64 w-full">
            <AttendanceChart records={records} />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Subject overview</h2>
            <p className="text-sm text-slate-500">{subjects.length} subjects</p>
          </div>
          <button
            onClick={() => onNavigate('subjects')}
            className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700 cursor-pointer"
          >
            Manage subjects <ArrowRight size={14} />
          </button>
        </div>

        <div className="w-full">
          <div className="grid grid-cols-12 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-4">
            <div className="col-span-4">Subject</div>
            <div className="col-span-2">Attendance</div>
            <div className="col-span-3">Progress</div>
            <div className="col-span-2 text-right">Safe Skips</div>
            <div className="col-span-1 text-right">Action</div>
          </div>

          <div className="space-y-4">
            {subjects.length === 0 && (
              <div className="text-sm text-slate-500 text-center py-8">
                No subjects yet.{' '}
                <button onClick={() => onNavigate('subjects')} className="text-indigo-600 hover:underline cursor-pointer">
                  Add your first subject
                </button>
              </div>
            )}
            {subjects.map((sub) => {
              const summary = summarizeSubject(sub, records)
              return (
                <div
                  key={sub.id}
                  className="grid grid-cols-12 items-center px-4 py-3 border border-slate-100 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="col-span-4">
                    <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: sub.color }} />
                      {sub.name}
                    </div>
                    <div className="text-xs text-slate-500">
                      {sub.code} &middot; {sub.teacher}
                    </div>
                  </div>

                  <div className="col-span-2">
                    <div className="font-bold text-slate-900 dark:text-white">
                      {summary.percentage}%{' '}
                      <span className="text-xs font-normal text-slate-500">/{sub.min_attendance_req}%</span>
                    </div>
                  </div>

                  <div className="col-span-3 pr-8">
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, summary.percentage)}%`,
                          backgroundColor: summary.onTrack ? sub.color : '#EF4444',
                        }}
                      />
                    </div>
                  </div>

                  <div className="col-span-2 text-right">
                    {summary.onTrack ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium text-sm">
                        {summary.safeSkips} safe skips
                      </span>
                    ) : (
                      <span className="text-rose-600 dark:text-rose-400 font-medium text-sm">
                        {summary.toRecover} to recover
                      </span>
                    )}
                  </div>

                  <div className="col-span-1 text-right">
                    <MarkAttendanceBtn subjectId={sub.id} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}
