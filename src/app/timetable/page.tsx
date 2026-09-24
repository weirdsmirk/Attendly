
import { getTimetable } from '../actions';
import { Plus } from 'lucide-react';
import MarkAttendanceBtn from '@/components/MarkAttendanceBtn';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export default async function Timetable() {
  const timetable = await getTimetable();

  return (
    <>
      <div className="mb-8 flex items-end justify-between">
        <div>
          <div className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-2">YOUR WEEKLY RHYTHM</div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Timetable</h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm">Recurring classes, ready for one-tap attendance.</p>
        </div>
        <button className="btn btn-primary gap-2">
          <Plus size={16} /> Add class
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {DAYS.map((dayName, idx) => {
          const dayNum = idx + 1; // 1 to 5
          const classes = timetable.filter(t => t.day_of_week === dayNum).sort((a, b) => a.start_time.localeCompare(b.start_time));
          
          return (
            <div key={dayName} className="flex-1 min-w-[280px]">
              <div className="flex items-center justify-between mb-4 border-b-2 border-indigo-600 pb-2">
                <h3 className="font-bold text-slate-900 dark:text-white">{dayName}</h3>
                <span className="text-xs text-slate-500 font-medium">{classes.length} classes</span>
              </div>
              
              <div className="space-y-4">
                {classes.map(cls => (
                  <div key={cls.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-2 h-2 rounded-bl-lg" style={{backgroundColor: cls.subject.color}}></div>
                    
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-indigo-600 dark:text-indigo-400 font-bold text-sm">{cls.start_time}</span>
                      <span className="text-xs text-slate-400">{cls.end_time}</span>
                    </div>
                    
                    <h4 className="font-bold text-slate-900 dark:text-white mb-1">{cls.subject.name}</h4>
                    <p className="text-xs text-slate-500 mb-4">{cls.room || 'No room set'}</p>
                    
                    <MarkAttendanceBtn subjectId={cls.subject_id} />
                  </div>
                ))}
                
                <button className="w-full py-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 hover:text-indigo-600 hover:border-indigo-300 dark:hover:border-indigo-900/50 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-colors flex flex-col items-center justify-center gap-1 text-sm font-medium">
                  <Plus size={16} />
                  Add class
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
