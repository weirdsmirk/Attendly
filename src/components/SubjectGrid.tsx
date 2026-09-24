'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { type Subject, type AttendanceRecord } from '@/app/actions';
import { Plus, MoreHorizontal, Pencil, Trash2, Eye } from 'lucide-react';
import SubjectDetailsModal from './SubjectDetailsModal';
import AddSubjectModal from './AddSubjectModal';
import MarkAttendanceBtn from './MarkAttendanceBtn';
import { deleteSubject } from '@/app/actions';
import { useRouter } from 'next/navigation';

function statsFor(sub: Subject, records: AttendanceRecord[]) {
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
     if (subPerc < sub.min_attendance_req && req < 1) {
       toRecover = Math.ceil((req * subConducted - subAttended) / (1 - req));
     }
  }
  return { subConducted, subAttended, subMissed, subPerc, safeSkips, toRecover };
}

export default function SubjectGrid({ subjects, records }: { subjects: Subject[], records: AttendanceRecord[] }) {
  const router = useRouter();
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editSubject, setEditSubject] = useState<Subject | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onSearch = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail ?? '';
      setQuery(detail.toLowerCase());
    };
    window.addEventListener('attendly:search', onSearch as EventListener);
    return () => window.removeEventListener('attendly:search', onSearch as EventListener);
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenMenuId(null);
    };
    window.addEventListener('mousedown', onClick);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onClick);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return subjects;
    return subjects.filter(s =>
      s.name.toLowerCase().includes(query) ||
      s.code.toLowerCase().includes(query) ||
      (s.teacher ?? '').toLowerCase().includes(query)
    );
  }, [subjects, query]);

  const handleDelete = async (sub: Subject) => {
    setOpenMenuId(null);
    if (!confirm(`Delete "${sub.name}"? All attendance records and timetable classes for this subject will be permanently lost.`)) return;
    setDeletingId(sub.id);
    try {
      await deleteSubject(sub.id);
      if (selectedSubject?.id === sub.id) setSelectedSubject(null);
      if (editSubject?.id === sub.id) setEditSubject(null);
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  };

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

      {query.trim() !== '' && (
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          {filtered.length} result{filtered.length === 1 ? '' : 's'} for “{query}”
          <button onClick={() => { setQuery(''); window.dispatchEvent(new CustomEvent('attendly:search:clear')); }} className="ml-2 text-indigo-600 hover:underline">Clear</button>
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filtered.map(sub => {
          const { subAttended, subMissed, subPerc, safeSkips, toRecover } = statsFor(sub, records);

          return (
            <div
              key={sub.id}
              onClick={() => setSelectedSubject(sub)}
              className="card relative group cursor-pointer transition-colors duration-150 hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 active:bg-indigo-50 dark:active:bg-indigo-950/30 active:border-indigo-500"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{backgroundColor: sub.color}}></span>
                  <span className="text-xs font-semibold text-slate-500">{sub.code}</span>
                </div>
                <div className="relative" ref={openMenuId === sub.id ? menuRef : undefined}>
                  <button
                    className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                    onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === sub.id ? null : sub.id); }}
                    aria-label={`Options for ${sub.name}`}
                    aria-haspopup="menu"
                    aria-expanded={openMenuId === sub.id}
                  >
                    <MoreHorizontal size={16} />
                  </button>
                  {openMenuId === sub.id && (
                    <div
                      className="absolute right-0 top-9 z-30 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-1 overflow-hidden"
                      role="menu"
                      onClick={e => e.stopPropagation()}
                    >
                      <button
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                        onClick={() => { setOpenMenuId(null); setSelectedSubject(sub); }}
                        role="menuitem"
                      >
                        <Eye size={14} /> View details
                      </button>
                      <button
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                        onClick={() => { setOpenMenuId(null); setEditSubject(sub); }}
                        role="menuitem"
                      >
                        <Pencil size={14} /> Edit subject
                      </button>
                      <button
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 cursor-pointer disabled:opacity-50"
                        disabled={deletingId === sub.id}
                        onClick={() => handleDelete(sub)}
                        role="menuitem"
                      >
                        <Trash2 size={14} /> {deletingId === sub.id ? 'Deleting…' : 'Delete'}
                      </button>
                    </div>
                  )}
                </div>
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
              <div className="mt-3" onClick={e => e.stopPropagation()}>
                <MarkAttendanceBtn subjectId={sub.id} compact />
              </div>
            </div>
          );
        })}

        <div
          onClick={() => setIsAddOpen(true)}
          className="card flex flex-col items-center justify-center text-center cursor-pointer transition-colors duration-150 hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 active:bg-indigo-50 dark:active:bg-indigo-950/30 border-dashed min-h-[220px]"
        >
          <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
            <Plus size={20} />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white">Add a subject</h3>
          <p className="text-xs text-slate-500 mt-1">Track another course</p>
        </div>
      </div>

      {filtered.length === 0 && subjects.length > 0 && (
        <div className="text-center text-sm text-slate-500 py-10">No subjects match your search.</div>
      )}

      {selectedSubject && (
        <SubjectDetailsModal
          subject={subjects.find(s => s.id === selectedSubject.id) ?? selectedSubject}
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
