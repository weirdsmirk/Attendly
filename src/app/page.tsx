
import { getSubjects, getRecords, getTimetable } from './actions';
import { format, isToday, parseISO, getDay } from 'date-fns';
import { Plus, TrendingUp, CheckCircle2, AlertCircle, Zap } from 'lucide-react';
import AttendanceChart from '@/components/AttendanceChart';

import MarkAttendanceBtn from '@/components/MarkAttendanceBtn';

export default async function Dashboard() {
  const subjects = await getSubjects();
  const records = await getRecords();
  const timetable = await getTimetable();

  // Basic stats
  const initialConductedTotal = subjects.reduce((sum, s) => sum + s.initial_conducted, 0);
  const initialAttendedTotal = subjects.reduce((sum, s) => sum + s.initial_attended, 0);
  
  const recordsConducted = records.filter(r => r.status === 'Attended' || r.status === 'Skipped').length;
  const recordsAttended = records.filter(r => r.status === 'Attended').length;
  
  const totalConducted = recordsConducted + initialConductedTotal;
  const attendedCount = recordsAttended + initialAttendedTotal;
  const missedCount = records.filter(r => r.status === 'Skipped').length + (initialConductedTotal - initialAttendedTotal);
  
  const overallPercentage = totalConducted === 0 ? 100 : Math.round((attendedCount / totalConducted) * 100);

  // Today's classes
  const todayNum = getDay(new Date());
  const todaysClasses = timetable.filter(t => t.day_of_week === todayNum);

  return (
    <>
      <div className="mb-8">
        <div className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-2">
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
          Good morning, Alex <span className="text-yellow-400">✨</span>
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm">
          Keep your momentum going. You're on a <span className="font-semibold text-slate-900 dark:text-slate-200">3-day attendance streak</span>.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="card flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 font-medium">
              <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center"><TrendingUp size={14} /></div>
              Overall attendance
            </div>
            <span className="text-slate-400">?</span>
          </div>
          <div>
            <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">{overallPercentage}%</div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Across all subjects</span>
              <span className="text-emerald-500 font-medium">+2.4%</span>
            </div>
          </div>
        </div>

        <div className="card flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 font-medium">
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center"><CheckCircle2 size={14} /></div>
              Classes attended
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">{attendedCount}</div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">of {totalConducted} conducted</span>
              <span className="text-slate-500">This semester</span>
            </div>
          </div>
        </div>

        <div className="card flex flex-col justify-between border-amber-200 dark:border-amber-900/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-500 font-medium">
              <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center"><AlertCircle size={14} /></div>
              Classes missed
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">{missedCount}</div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Keep an eye on these</span>
              <span className="text-rose-500 font-medium">Review needed</span>
            </div>
          </div>
        </div>

        <div className="card flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 font-medium">
              <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center"><Zap size={14} /></div>
              Current streak
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">3 days</div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Your best is 8 days</span>
              <span className="text-emerald-500 font-medium">Keep it up</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Today's classes</h2>
              <p className="text-sm text-slate-500">{todaysClasses.length} scheduled</p>
            </div>
            <a href="/timetable" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">View timetable &gt;</a>
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
          <a href="/timetable" className="text-sm font-medium text-indigo-600 hover:text-indigo-700 mt-4 inline-block">View all classes &gt;</a>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Attendance trend</h2>
            <div className="text-sm font-medium text-indigo-600">30 days &gt;</div>
          </div>
          <div className="h-64 w-full">
             <AttendanceChart />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Subject overview</h2>
            <p className="text-sm text-slate-500">{subjects.length} subjects</p>
          </div>
          <a href="/subjects" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">Manage subjects &gt;</a>
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
                 
                 if (subPerc < sub.min_attendance_req) {
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
