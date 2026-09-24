'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Trash2 } from 'lucide-react';
import { addSubject, updateSubject, deleteSubject, type Subject } from '@/app/actions';

const ALLOWED_COLORS = ['#4F46E5', '#10B981', '#EF4444', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4'];

export default function AddSubjectModal({ onClose, initialData }: { onClose: () => void, initialData?: Subject }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    code: initialData?.code || '',
    teacher: initialData?.teacher || '',
    credits: initialData?.credits ?? 3,
    min_attendance_req: initialData?.min_attendance_req ?? 75,
    initial_conducted: initialData?.initial_conducted ?? 0,
    initial_attended: initialData?.initial_attended ?? 0,
    color: initialData?.color || '#4F46E5'
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const setNum = (key: 'credits' | 'min_attendance_req' | 'initial_conducted' | 'initial_attended', raw: string) => {
    if (raw === '') {
      setFormData({ ...formData, [key]: 0 });
      return;
    }
    const n = Number(raw);
    setFormData({ ...formData, [key]: Number.isFinite(n) ? Math.floor(n) : 0 });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const name = formData.name.trim();
    const code = formData.code.trim();
    if (!name) {
      setError('Subject name is required.');
      return;
    }
    if (!code) {
      setError('Subject code is required.');
      return;
    }
    if (formData.credits < 1 || formData.credits > 10) {
      setError('Credits must be between 1 and 10.');
      return;
    }
    if (formData.min_attendance_req < 1 || formData.min_attendance_req > 100) {
      setError('Minimum attendance must be between 1 and 100.');
      return;
    }
    if (formData.initial_conducted < 0) {
      setError('Initial conducted cannot be negative.');
      return;
    }
    if (formData.initial_attended < 0) {
      setError('Initial attended cannot be negative.');
      return;
    }
    if (formData.initial_attended > formData.initial_conducted) {
      setError('Attended classes cannot exceed conducted classes.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name,
        code,
        teacher: formData.teacher.trim() === '' ? null : formData.teacher.trim(),
        credits: formData.credits,
        min_attendance_req: formData.min_attendance_req,
        initial_conducted: formData.initial_conducted,
        initial_attended: formData.initial_attended,
        color: formData.color,
      };
      if (initialData) {
        await updateSubject(initialData.id, payload);
      } else {
        await addSubject(payload);
      }
      router.refresh();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!initialData) return;
    if (!confirm('Are you sure you want to delete this subject? All attendance records and timetable classes for this subject will be permanently lost.')) return;

    setLoading(true);
    setError(null);
    try {
      await deleteSubject(initialData.id);
      router.refresh();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete subject.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-xl font-bold">{initialData ? 'Edit subject' : 'Add subject'}</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="text-sm font-medium text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-900/40 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Subject Name *</label>
            <input required type="text" className="input" placeholder="e.g. Database Systems" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Code *</label>
              <input required type="text" className="input" placeholder="e.g. CS302" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Teacher</label>
              <input type="text" className="input" placeholder="e.g. Dr. Priya" value={formData.teacher} onChange={e => setFormData({...formData, teacher: e.target.value})} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Credits</label>
              <input type="number" min="1" max="10" className="input" value={formData.credits} onChange={e => setNum('credits', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Min Attendance (%)</label>
              <input type="number" min="1" max="100" className="input" value={formData.min_attendance_req} onChange={e => setNum('min_attendance_req', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Initial Conducted</label>
              <input type="number" min="0" className="input" value={formData.initial_conducted} onChange={e => setNum('initial_conducted', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Initial Attended</label>
              <input type="number" min="0" className="input" value={formData.initial_attended} onChange={e => setNum('initial_attended', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Color Label</label>
            <div className="flex gap-2">
              {ALLOWED_COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({...formData, color})}
                  className={`w-8 h-8 rounded-full border-2 cursor-pointer ${formData.color === color ? 'border-slate-900 dark:border-white' : 'border-transparent'}`}
                  style={{ backgroundColor: color }}
                  aria-label={`Color ${color}`}
                />
              ))}
            </div>
          </div>
          <div className={`pt-4 mt-2 border-t border-slate-100 dark:border-slate-800 flex gap-2 ${initialData ? 'justify-between' : 'justify-end'}`}>
            {initialData && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="btn text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                title="Delete Subject"
              >
                <Trash2 size={18} />
              </button>
            )}
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="btn btn-ghost">Cancel</button>
              <button type="submit" disabled={loading} className="btn btn-primary">{loading ? 'Saving...' : (initialData ? 'Save Changes' : 'Add Subject')}</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
