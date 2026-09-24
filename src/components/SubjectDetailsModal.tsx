'use client';

import { useState } from 'react';
import { X, Trash2, Calendar as CalendarIcon, Plus } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { addRecord, deleteRecord, type Subject, type AttendanceRecord } from '@/app/actions';
import clsx from 'clsx';

export default function SubjectDetailsModal({ 
  subject, 
  records, 
  onClose 
}: { 
  subject: Subject, 
  records: AttendanceRecord[], 
  onClose: () => void 
}) {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [status, setStatus] = useState<'Attended' | 'Skipped' | 'Cancelled' | 'Holiday'>('Attended');
  const [loading, setLoading] = useState(false);

  const subRecords = records.filter(r => r.subject_id === subject.id);
  const subConducted = subRecords.length;
  const subAttended = subRecords.filter(r => r.status === 'Attended').length;
  const subPerc = subConducted === 0 ? 100 : Math.round((subAttended / subConducted) * 100);

  let safeSkips = 0;
  if (subConducted > 0) {
    const req = subject.min_attendance_req / 100;
    const maxTotalForCurrentAttended = Math.floor(subAttended / req);
    safeSkips = Math.max(0, maxTotalForCurrentAttended - subConducted);
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addRecord({
        subject_id: subject.id,
        date,
        status,
        notes: ''
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteRecord(id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="bg-slate-900 text-white rounded-2xl w-full max-w-lg overflow-hidden shadow-xl border border-slate-800">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">{subject.name}</h2>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
              <X size={20} />
            </button>
          </div>

          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="text-4xl font-bold mb-1">{subPerc}%</div>
              <div className="text-sm text-slate-400">{subAttended} attended of {subConducted} conducted</div>
            </div>
            <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl text-center border border-emerald-100">
              <div className="font-bold">{safeSkips} safe skips</div>
              <div className="text-xs">{subject.min_attendance_req}% requirement</div>
            </div>
          </div>

          <form onSubmit={handleAdd} className="flex gap-2 mb-8">
            <div className="relative flex-1">
              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="date" 
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-white [color-scheme:dark]"
                required
              />
            </div>
            <select 
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 w-32 text-white"
            >
              <option value="Attended">Attended</option>
              <option value="Skipped">Skipped</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Holiday">Holiday</option>
            </select>
            <button type="submit" disabled={loading} className="btn bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 gap-2 border-0">
              <Plus size={16} /> Add record
            </button>
          </form>

          <div className="space-y-1 max-h-64 overflow-y-auto pr-2 -mr-2">
            {subRecords.length === 0 ? (
              <div className="text-center text-slate-500 text-sm py-4">No records yet.</div>
            ) : (
              subRecords.map(record => {
                const dateStr = format(parseISO(record.date), 'EEE, MMM d');
                return (
                  <div key={record.id} className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0 group">
                    <div className="text-sm font-medium">{dateStr}</div>
                    <div className="flex items-center gap-4">
                      <div className={clsx(
                        "flex items-center gap-1.5 text-sm font-medium",
                        record.status === 'Attended' ? "text-emerald-500" :
                        record.status === 'Skipped' ? "text-rose-500" : "text-slate-400"
                      )}>
                        <span className={clsx(
                          "w-1.5 h-1.5 rounded-full",
                          record.status === 'Attended' ? "bg-emerald-500" :
                          record.status === 'Skipped' ? "bg-rose-500" : "bg-slate-400"
                        )}></span>
                        {record.status}
                      </div>
                      <button onClick={() => handleDelete(record.id)} className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-rose-900/30 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
