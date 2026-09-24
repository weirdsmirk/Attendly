export const dynamic = 'force-dynamic';

import { getSubjects, getRecords, getTimetable } from './actions';
import { getDay } from 'date-fns';
import { TrendingUp, CheckCircle2, AlertCircle, Zap, ArrowRight } from 'lucide-react';
import AttendanceChart from '@/components/AttendanceChart';
import DashboardGreeting from '@/components/DashboardGreeting';

import MarkAttendanceBtn from '@/components/MarkAttendanceBtn';

function computeStreaks(records: { date: string; status: string }[]) {
  const byDate = new Map<string, { attended: number; skipped: number }>();
  for (const r of records) {
    if (r.status !== 'Attended' && r.status !== 'Skipped') continue;
    const entry = byDate.get(r.date) ?? { attended: 0, skipped: 0 };
    if (r.status === 'Attended') entry.attended += 1;
    else entry.skipped += 1;
    byDate.set(r.date, entry);
  }
  const dates = [...byDate.keys()].sort();
  const isGoodDay = (d: string) => {
    const e = byDate.get(d)!;
    return e.attended > 0 && e.skipped === 0;
  };

  // Best streak anywhere
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const d of dates) {
    const curr = new Date(d + 'T00:00:00');
    if (prev) {
      const p = new Date(prev + 'T00:00:00');
      const diff = Math.round((curr.getTime() - p.getTime()) / 86400000);
      if (diff !== 1) run = 0;
    }
    if (isGoodDay(d)) {
      run += 1;
      best = Math.max(best, run);
    } else {
      run = 0;
    }
    prev = d;
  }

  // Current streak: consecutive good days ending today or yesterday
  let current = 0;
  const cursor = new Date();
  // If today has no records at all, allow streak to start from yesterday
  const todayStr = cursor.toISOString().split('T')[0];
  // Use local date instead of UTC for correctness
  const localToday = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const localStr = (dt: Date) => `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
  const c = new Date(localToday);
  if (!byDate.has(localStr(c))) {
    c.setDate(c.getDate() - 1);
  }
  while (true) {
    const key = localStr(c);
    if (byDate.has(key) && isGoodDay(key)) {
      current += 1;
      c.setDate(c.getDate() - 1);
    } else {
      break;
    }
    if (current > 365) break;
  }
  void todayStr;

  return { current, best };
}

export default async function Dashboard() {
  const [subjects, records, timetable] = await Promise.all([getSubjects(), getRecords(), getTimetable()]);

  // Basic stats
  const initialConductedTotal = subjects.reduce((sum, s) => sum + s.initial_conducted, 0);
  const initialAttendedTotal = subjects.reduce((sum, s) => sum + s.initial_attended, 0);

  const recordsConducted = records.filter(r => r.status === 'Attended' || r.status === 'Skipped').length;
  const recordsAttended = records.filter(r => r.status === 'Attended').length;

  const totalConducted = recordsConducted + initialConductedTotal;
  const attendedCount = recordsAttended + initialAttendedTotal;
  const missedCount = records.filter(r => r.status === 'Skipped').length + (initialConductedTotal - initialAttendedTotal);

  const overallPercentage = totalConducted === 0 ? 100 : Math.round((attendedCount / totalConducted) * 100);

  const { current: streak, best: bestStreak } = computeStreaks(records);

  const atRisk = subjects.filter(sub => {
    const subRecords = records.filter(r => r.subject_id === sub.id);
    const conducted = subRecords.filter(r => r.status === 'Attended' || r.status === 'Skipped').length + sub.initial_conducted;
    const attended = subRecords.filter(r => r.status === 'Attended').length + sub.initial_attended;
    if (conducted === 0) return false;
    return Math.round((attended / conducted) * 100) < sub.min_attendance_req;
  }).length;

  // Today's classes
  const todayNum = getDay(new Date());
  const todaysClasses = timetable.filter(t => t.day_of_week === todayNum);

  return (
    <>
      <div className="mb-8">
        <DashboardGreeting />
        <p className="text-slate-600 dark:text-slate-400 text-sm">
          {streak > 0 ? (
            <>Keep your momentum going. You&apos;re on a <span className="font-semibold text-slate-900 dark:text-slate-200">{streak}-day attendance streak</span>.</>
          ) : (
            <>Mark today&apos;s classes to start a new attendance streak.</>
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
        <div className="card p-7 rounded-2xl">
          <div className="flex items-center gap-3 mb-7">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center"><TrendingUp size={18} strokeWidth={2.2} /></div>
            <span className="text-[13px] font-semibold tracking-tight text-slate-700 dark:text-slate-300">Overall attendance</span>
          </div>
          <div className="text-[42px] font-black tracking-tight text-slate-900 dark:text-white leading-none mb-3">{overallPercentage}%</div>
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-slate-500 dark:text-slate-400">Across all subjects</span>
            <span className="font-medium text-slate-600 dark:text-slate-400">{attendedCount}/{totalConducted} classes</span>
          </div>
        </div>

        <div className="card p-7 rounded-2xl">
          <div className="flex items-center gap-3 mb-7">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center"><CheckCircle2 size={18} strokeWidth={2.2} /></div>
            <span className="text-[13px] font-semibold tracking-tight text-slate-700 dark:text-slate-300">Classes attended</span>
          </div>
          <div className="text-[42px] font-black tracking-tight text-slate-900 dark:text-white leading-none mb-3">{attendedCount}</div>
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-slate-500 dark:text-slate-400">of {totalConducted} conducted</span>
            <span className="text-slate-500 dark:text-slate-400">This semester</span>
          </div>
        </div>

        <div className="card p-7 rounded-2xl border-amber-200/70 dark:border-amber-900/40">
          <div className="flex items-center gap-3 mb-7">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center"><AlertCircle size={18} strokeWidth={2.2} /></div>
            <span className="text-[13px] font-semibold tracking-tight text-amber-700 dark:text-amber-400">Classes missed</span>
          </div>
          <div className="text-[42px] font-black tracking-tight text-slate-900 dark:text-white leading-none mb-3">{missedCount}</div>
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-slate-500 dark:text-slate-400">Keep an eye on these</span>
            <span className="text-rose-600 dark:text-rose-400 font-semibold bg-rose-50 dark:bg-rose-900/20 px-2.5 py-1 rounded-full text-xs">{atRisk > 0 ? `${atRisk} at risk` : 'On track'}</span>
          </div>
        </div>

        <div className="card p-7 rounded-2xl">
          <div className="flex items-center gap-3 mb-7">
            <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center"><Zap size={18} strokeWidth={2.2} /></div>
            <span className="text-[13px] font-semibold tracking-tight text-slate-700 dark:text-slate-300">Current streak</span>
          </div>
          <div className="text-[42px] font-black tracking-tight text-slate-900 dark:text-white leading-none mb-3">{streak} day{streak === 1 ? '' : 's'}</div>
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-slate-500 dark:text-slate-400">Your best is {bestStreak} day{bestStreak === 1 ? '' : 's'}</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1 rounded-full text-xs">Keep it up</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Today&apos;s classes</h2>
              <p className="text-sm text-slate-500">{todaysClasses.length} scheduled</p>
            </div>
            <a href="/timetable" className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700">View timetable <ArrowRight size={14} /></a>
          </div>

          <div className="space-y-4">
            {todaysClasses.length === 0 ? (
              <div className="text-sm text-slate-500 text-center py-8">No classes today.</div>
            ) : (
              todaysClasses.map(cls => (
                <div key={cls.id} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <div className="flex items-start gap-4">
                    <div className="text-sm font-semibold text-slate-900 dark:text-white w-12 pt-1">{cls.start_time}</div>
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{backgroundColor: cls.subject.color}}></span>
                        {cls.subject.name}
                      </div>
                      <div className="text-xs text-slate-500">{cls.room} &middot; {cls.subject.teacher}</div>
                    </div>
                  </div>
                  <MarkAttendanceBtn subjectId={cls.subject_id} />
                </div>
              ))
            )}
          </div>
          <a href="/timetable" className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700 mt-4">View all classes <ArrowRight size={14} /></a>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Attendance trend</h2>
            <div className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600">30 days <ArrowRight size={14} /></div>
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
          <a href="/subjects" className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700">Manage subjects <ArrowRight size={14} /></a>
        </div>

        <div className="w-full">
          <div className="grid grid-cols-12 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 px-4">
            <div className="col-span-4">Subject</div>
            <div className="col-span-2">Attendance</div>
            <div className="col-span-3">Progress</div>
            <div className="col-span-2 text-right">Safe Skips</div>
            <div className="col-span-1 text-right">Action</div>
          </div>

          <div className="space-y-4">
            {subjects.length === 0 && (
              <div className="text-sm text-slate-500 text-center py-8">No subjects yet. <a href="/subjects" className="text-indigo-600 hover:underline">Add your first subject</a>.</div>
            )}
            {subjects.map(sub => {
              const subRecords = records.filter(r => r.subject_id === sub.id);
              const subConducted = subRecords.filter(r => r.status === 'Attended' || r.status === 'Skipped').length + sub.initial_conducted;
              const subAttended = subRecords.filter(r => r.status === 'Attended').length + sub.initial_attended;
              const subPerc = subConducted === 0 ? 100 : Math.round((subAttended / subConducted) * 100);

              // Math for safe skips
              // safe = attended / (min/100) - conducted
              // e.g. 75%. Needs attended / total >= 0.75 => attended >= 0.75 * total => total <= attended / 0.75
              // safe skips = floor(attended / 0.75) - total
              let safeSkips = 0;
              let toRecover = 0;
              if (subConducted > 0) {
                 const req = sub.min_attendance_req / 100;
                 const maxTotalForCurrentAttended = Math.floor(subAttended / req);
                 safeSkips = Math.max(0, maxTotalForCurrentAttended - subConducted);

                 if (subPerc < sub.min_attendance_req && req < 1) {
                   // how many contiguous to attend to hit req?
                   // (attended + X) / (total + X) = req
                   // attended + X = req * total + req * X
                   // X - req*X = req*total - attended
                   // X (1 - req) = req*total - attended
                   // X = (req*total - attended) / (1 - req)
                   toRecover = Math.ceil((req * subConducted - subAttended) / (1 - req));
                 }
              }

              return (
                <div key={sub.id} className="grid grid-cols-12 items-center px-4 py-3 border border-slate-100 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="col-span-4">
                    <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{backgroundColor: sub.color}}></span>
                      {sub.name}
                    </div>
                    <div className="text-xs text-slate-500">{sub.code} &middot; {sub.teacher}</div>
                  </div>

                  <div className="col-span-2">
                    <div className="font-bold text-slate-900 dark:text-white">{subPerc}% <span className="text-xs font-normal text-slate-500">/{sub.min_attendance_req}%</span></div>
                  </div>

                  <div className="col-span-3 pr-8">
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                      <div className="h-2 rounded-full transition-all" style={{width: `${Math.min(100, subPerc)}%`, backgroundColor: subPerc >= sub.min_attendance_req ? sub.color : '#EF4444'}}></div>
                    </div>
                  </div>

                  <div className="col-span-2 text-right">
                    {subPerc >= sub.min_attendance_req ? (
                      <span className="text-emerald-500 font-medium text-sm">{safeSkips} safe skips</span>
                    ) : (
                      <span className="text-rose-500 font-medium text-sm">{toRecover} to recover</span>
                    )}
                  </div>

                  <div className="col-span-1 text-right">
                    <MarkAttendanceBtn subjectId={sub.id} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
