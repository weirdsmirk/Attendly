'use client';

import { useState } from 'react';
import { type Subject, type AttendanceRecord } from '@/app/actions';
import { Plus, MoreHorizontal } from 'lucide-react';
import SubjectDetailsModal from './SubjectDetailsModal';
import AddSubjectModal from './AddSubjectModal';
import MarkAttendanceBtn from './MarkAttendanceBtn';

export default function SubjectGrid({ subjects, records }: { subjects: Subject[], records: AttendanceRecord[] }) {
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editSubject, setEditSubject] = useState<Subject | null>(null);

  return (
    <>
      <div className="mb-8 flex items-end justify-between">
        <div>
          <div className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-2">MANAGE YOUR COURSES</div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Subjects</h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm">Set individual attendance requirements and keep every class accountable.</p>
        </div>
        <button onClick={() => setIsAddOpen(true)} className="btn btn-primary gap-2 cursor-pointer">
          <Plus size={16} /> Add subject
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {subjects.map(sub => {
          const subRecords = records.filter(r => r.subject_id === sub.id);
          const subConducted = subRecords.filter(r => r.status === 'Attended' || r.status === 'Skipped').length + sub.initial_conducted;
          const subAttended = subRecords.filter(r => r.status === 'Attended').length + sub.initial_attended;
          const subMissed = subRecords.filter(r => r.status === 'Skipped').length + (sub.initial_conducted - sub.initial_attended);
          const subPerc = subConducted === 0 ? 100 : Math.round((subAttended / subConducted) * 100);
          
          let safeSkips = 0;
          let toRecover = 0;
          if (subConducted > 0) {
             const req = sub.min_attendance_req / 100;
             const maxTotalForCurrentAttended = Math.floor(subAttended / req);
             safeSkips = Math.max(0, maxTotalForCurrentAttended - subConducted);
             if (subPerc < sub.min_attendance_req) {
               toRecover = Math.ceil((req * subConducted - subAttended) / (1 - req));
             }
          }

          return (
            <div 
              key={sub.id} 
              onClick={() => setSelectedSubject(sub)}
              className="card relative group cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:hover:shadow-[0_8px_30px_rgb(0,0,0,0.1)]"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{backgroundColor: sub.color}}></span>
                  <span className="text-xs font-semibold text-slate-500">{sub.code}</span>
                </div>
                <button 
                  className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors" 
                  onClick={(e) => { e.stopPropagation(); setEditSubject(sub); }}
                >
                  <MoreHorizontal size={16} />
                </button>
              </div>
              
              <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1 leading-tight">{sub.name}</h3>
              <p className="text-xs text-slate-500 mb-6">{sub.teacher || 'No teacher'} &middot; {sub.credits} credits</p>
              
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-3xl font-bold text-slate-900 dark:text-white">{subPerc}%</span>
                <span className="text-xs text-slate-500 font-medium">of {sub.min_attendance_req}% required</span>
              </div>
              
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mb-4">
                <div className="h-1.5 rounded-full" style={{width: `${Math.min(100, subPerc)}%`, backgroundColor: subPerc >= sub.min_attendance_req ? sub.color : '#EF4444'}}></div>
              </div>
              
              <div className="flex items-center justify-between text-xs pt-4 border-t border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">{subAttended} attended &middot; {subMissed} missed</span>
                {subPerc >= sub.min_attendance_req ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">{safeSkips} safe skips</span>
                ) : (
                  <span className="text-rose-600 dark:text-rose-400 font-medium">{toRecover} to recover</span>
                )}
              </div>
            </div>
          );
        })}
        
        <div 
          onClick={() => setIsAddOpen(true)}
          className="card flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-200 hover:-translate-y-1 border-2 border-dashed border-slate-200 dark:border-slate-700 min-h-[220px]"
        >
          <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
            <Plus size={20} />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white">Add a subject</h3>
          <p className="text-xs text-slate-500 mt-1">Track another course</p>
        </div>
      </div>

      {selectedSubject && (
        <SubjectDetailsModal 
          subject={selectedSubject} 
          records={records} 
          onClose={() => setSelectedSubject(null)} 
        />
      )}

      {isAddOpen && (
        <AddSubjectModal onClose={() => setIsAddOpen(false)} />
      )}

      {editSubject && (
        <AddSubjectModal onClose={() => setEditSubject(null)} initialData={editSubject} />
      )}
    </>
  );
}
