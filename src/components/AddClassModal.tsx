'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { addClass, type Subject } from '@/app/actions';

export default function AddClassModal({ onClose, subjects, initialDay }: { onClose: () => void, subjects: Subject[], initialDay: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    subject_id: subjects.length > 0 ? subjects[0].id : '',
    day_of_week: initialDay,
    start_time: '09:00',
    end_time: '10:00',
    room: '',
    type: 'Lecture'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!formData.subject_id) {
      setError('Please select a subject.');
      return;
    }
    if (formData.start_time >= formData.end_time) {
      setError('End time must be after start time.');
      return;
    }
    setLoading(true);
    try {
      await addClass({
        ...formData,
        room: formData.room.trim() === '' ? null : formData.room.trim(),
      });
      router.refresh();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add class.');
    } finally {
      setLoading(false);
    }
  };

  if (subjects.length === 0) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4" onClick={onClose}>
        <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-2xl w-full max-w-sm overflow-hidden border border-slate-200 dark:border-slate-800 p-6 text-center" onClick={e => e.stopPropagation()}>
          <h2 className="text-xl font-bold mb-2">No subjects yet</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">You need to add at least one subject before you can create timetable classes.</p>
          <button onClick={onClose} className="btn btn-primary w-full cursor-pointer">Okay</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-xl font-bold">Add class</h2>
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
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Subject *</label>
            <select
              required
              className="input"
              value={formData.subject_id}
              onChange={e => setFormData({...formData, subject_id: e.target.value})}
            >
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Day of week *</label>
              <select
                required
                className="input"
                value={formData.day_of_week}
                onChange={e => setFormData({...formData, day_of_week: parseInt(e.target.value)})}
              >
                <option value={1}>Monday</option>
                <option value={2}>Tuesday</option>
                <option value={3}>Wednesday</option>
                <option value={4}>Thursday</option>
                <option value={5}>Friday</option>
                <option value={6}>Saturday</option>
                <option value={0}>Sunday</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Type</label>
              <select
                className="input"
                value={formData.type}
                onChange={e => setFormData({...formData, type: e.target.value})}
              >
                <option value="Lecture">Lecture</option>
                <option value="Lab">Lab</option>
                <option value="Tutorial">Tutorial</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Start Time *</label>
              <input required type="time" className="input" value={formData.start_time} onChange={e => setFormData({...formData, start_time: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">End Time *</label>
              <input required type="time" className="input" value={formData.end_time} onChange={e => setFormData({...formData, end_time: e.target.value})} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Room</label>
            <input type="text" className="input" placeholder="e.g. Lab 2" value={formData.room} onChange={e => setFormData({...formData, room: e.target.value})} />
          </div>

          <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="btn btn-ghost cursor-pointer">Cancel</button>
            <button type="submit" disabled={loading} className="btn btn-primary cursor-pointer">{loading ? 'Adding...' : 'Add Class'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
