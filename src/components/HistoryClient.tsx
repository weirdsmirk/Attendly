'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { Edit2, Trash2, Download, X } from 'lucide-react';
import { deleteRecord, updateRecord, type AttendanceRecord, type Subject } from '@/app/actions';
import clsx from 'clsx';

type Filter = 'All' | 'Attended' | 'Skipped';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function HistoryClient({ initialRecords, subjects }: { initialRecords: (AttendanceRecord & { subject: Subject })[]; subjects: Subject[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>('All');
  const [editing, setEditing] = useState<(AttendanceRecord & { subject: Subject }) | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editStatus, setEditStatus] = useState<'Attended' | 'Skipped' | 'Cancelled' | 'Holiday'>('Attended');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const filtered = useMemo(() => {
    if (filter === 'All') return initialRecords;
    if (filter === 'Attended') return initialRecords.filter(r => r.status === 'Attended');
    return initialRecords.filter(r => r.status === 'Skipped');
  }, [initialRecords, filter]);

  const openEdit = (record: AttendanceRecord & { subject: Subject }) => {
    setEditing(record);
    setEditDate(record.date);
    setEditStatus(record.status);
    setError(null);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setError(null);
    if (!editDate) {
      setError('Date is required.');
      return;
    }
    setSaving(true);
    try {
      await updateRecord(editing.id, {
        subject_id: editing.subject_id,
        date: editDate,
        status: editStatus,
        notes: editing.notes,
      });
      setEditing(null);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update record.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this attendance record?')) return;
    setDeletingId(id);
    try {
      await deleteRecord(id);
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const [{ exportAllData }] = await Promise.all([import('@/app/actions')]);
      const data = await exportAllData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendly-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <div className="mb-8 flex items-end justify-between">
        <div>
          <div className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-2">EVERY CLASS, ACCOUNTED FOR</div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Attendance log</h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm">Correct mistakes without losing the full history.</p>
        </div>
        <button onClick={handleExport} disabled={exporting} className="btn btn-secondary gap-2 border border-slate-200 dark:border-slate-800 cursor-pointer disabled:opacity-50">
          <Download size={16} /> {exporting ? 'Exporting…' : 'Export backup'}
        </button>
      </div>

      <div className="card w-full">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Recent records</h2>
            <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-semibold px-2 py-0.5 rounded-full">{filtered.length}</span>
          </div>
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            {(['All', 'Attended', 'Skipped'] as Filter[]).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={clsx(
                  'px-3 py-1 text-xs font-medium rounded-md cursor-pointer transition-colors',
                  filter === f
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                )}
              >
                {f === 'Skipped' ? 'Missed' : f}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          {filtered.length === 0 && (
            <div className="text-center text-slate-500 py-10">
              {initialRecords.length === 0 ? 'No attendance records found.' : `No ${filter === 'Skipped' ? 'missed' : filter.toLowerCase()} records found.`}
            </div>
          )}
          {filtered.map(record => {
            let day = record.date;
            let month = '';
            try {
              const dateStr = format(parseISO(record.date), 'dd MMM');
              [day, month] = dateStr.split(' ');
            } catch { /* keep raw */ }

            return (
              <div key={record.id} className="flex items-center justify-between py-3 px-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors group border-b border-slate-50 dark:border-slate-800/50 last:border-0">
                <div className="flex items-center gap-6">
                  <div className="flex flex-col items-center justify-center w-10">
                    <span className="text-lg font-bold text-slate-900 dark:text-white leading-none">{day}</span>
                    <span className="text-xs text-slate-500">{month}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full" style={{backgroundColor: record.subject.color}}></span>
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">{record.subject.name}</div>
                      <div className="text-xs text-slate-500">{record.subject.code} &middot; {record.date}</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-8">
                  {record.status === 'Attended' ? (
                    <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-500 text-sm font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Attended
                    </div>
                  ) : record.status === 'Skipped' ? (
                    <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-500 text-sm font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                      Skipped
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 text-sm font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                      {record.status}
                    </div>
                  )}

                  <div className="flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(record)} className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 cursor-pointer" aria-label="Edit record">
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(record.id)}
                      disabled={deletingId === record.id}
                      className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 cursor-pointer disabled:opacity-50"
                      aria-label="Delete record"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={() => setEditing(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm border border-slate-200 dark:border-slate-800 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Edit record</h2>
              <button onClick={() => setEditing(null)} className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer" aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="p-5 space-y-4">
              {error && <div className="text-sm text-rose-600 dark:text-rose-400">{error}</div>}
              <div>
                <div className="text-sm font-semibold text-slate-900 dark:text-white mb-1">{editing.subject.name}</div>
                <div className="text-xs text-slate-500">{editing.subject.code}</div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Date</label>
                <input type="date" required className="input" value={editDate} onChange={e => setEditDate(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Status</label>
                <select className="input" value={editStatus} onChange={e => setEditStatus(e.target.value as AttendanceRecord['status'])}>
                  <option value="Attended">Attended</option>
                  <option value="Skipped">Skipped</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="Holiday">Holiday</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setEditing(null)} className="flex-1 btn btn-ghost cursor-pointer">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 btn btn-primary cursor-pointer disabled:opacity-50">{saving ? 'Saving…' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
