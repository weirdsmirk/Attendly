'use client';
import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { type TimetableClass, type Subject, deleteClass } from '@/app/actions';
import MarkAttendanceBtn from './MarkAttendanceBtn';
import AddClassModal from './AddClassModal';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export default function TimetableGrid({ timetable, subjects }: { timetable: (TimetableClass & { subject: Subject })[], subjects: Subject[] }) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState(1);

  const openAddForDay = (dayNum: number) => {
    setSelectedDay(dayNum);
    setIsAddOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to remove this class from the timetable?')) {
      await deleteClass(id);
    }
  };

  return (
    <>
      <div className="mb-8 flex items-end justify-between">
        <div>
          <div className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-2">YOUR WEEKLY RHYTHM</div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Timetable</h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm">Recurring classes, ready for one-tap attendance.</p>
        </div>
        <button onClick={() => openAddForDay(1)} className="btn btn-primary gap-2 cursor-pointer">
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
                  <div key={cls.id} className="card relative group p-4 border border-slate-200 dark:border-slate-800 transition-all duration-200 hover:-translate-y-1 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:hover:shadow-[0_8px_30px_rgb(0,0,0,0.1)]">
                    <div className="absolute top-0 right-0 w-2 h-2 rounded-bl-lg" style={{backgroundColor: cls.subject.color}}></div>
                    
                    <button 
                      onClick={() => handleDelete(cls.id)}
                      className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10"
                      title="Remove from timetable"
                    >
                      <Trash2 size={14} />
                    </button>
                    
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-indigo-600 dark:text-indigo-400 font-bold text-sm">{cls.start_time}</span>
                      <span className="text-xs text-slate-400">{cls.end_time}</span>
                    </div>
                    
                    <h4 className="font-bold text-slate-900 dark:text-white mb-1 pr-6">{cls.subject.name}</h4>
                    <p className="text-xs text-slate-500 mb-4">{cls.room || 'No room set'}</p>
                    
                    <MarkAttendanceBtn subjectId={cls.subject_id} />
                  </div>
                ))}
                
                <button 
                  onClick={() => openAddForDay(dayNum)}
                  className="w-full py-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 hover:text-indigo-600 hover:border-indigo-300 dark:hover:border-indigo-900/50 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-colors flex flex-col items-center justify-center gap-1 text-sm font-medium cursor-pointer"
                >
                  <Plus size={16} />
                  Add class
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {isAddOpen && (
        <AddClassModal 
          subjects={subjects} 
          initialDay={selectedDay}
          onClose={() => setIsAddOpen(false)} 
        />
      )}
    </>
  );
}
