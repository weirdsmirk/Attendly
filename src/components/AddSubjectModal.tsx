'use client';

import { useState } from 'react';
import { X, Trash2 } from 'lucide-react';
import { addSubject, updateSubject, deleteSubject, type Subject } from '@/app/actions';

export default function AddSubjectModal({ onClose, initialData }: { onClose: () => void, initialData?: Subject }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    code: initialData?.code || '',
    teacher: initialData?.teacher || '',
    credits: initialData?.credits || 3,
    min_attendance_req: initialData?.min_attendance_req || 75,
    initial_conducted: initialData?.initial_conducted || 0,
    initial_attended: initialData?.initial_attended || 0,
    color: initialData?.color || '#4F46E5'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (initialData) {
        await updateSubject(initialData.id, formData);
      } else {
        await addSubject(formData);
      }
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!initialData) return;
    if (!confirm('Are you sure you want to delete this subject? All attendance records and timetable classes for this subject will be permanently lost.')) return;
    
    setLoading(true);
    try {
      await deleteSubject(initialData.id);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4">
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-xl font-bold">{initialData ? 'Edit subject' : 'Add subject'}</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
              <input type="number" min="1" max="10" className="input" value={formData.credits} onChange={e => setFormData({...formData, credits: parseInt(e.target.value)})} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Min Attendance (%)</label>
              <input type="number" min="1" max="100" className="input" value={formData.min_attendance_req} onChange={e => setFormData({...formData, min_attendance_req: parseInt(e.target.value)})} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Initial Conducted</label>
              <input type="number" min="0" className="input" value={formData.initial_conducted} onChange={e => setFormData({...formData, initial_conducted: parseInt(e.target.value)})} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Initial Attended</label>
              <input type="number" min="0" className="input" value={formData.initial_attended} onChange={e => setFormData({...formData, initial_attended: parseInt(e.target.value)})} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Color Label</label>
            <div className="flex gap-2">
              {['#4F46E5', '#10B981', '#EF4444', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4'].map(color => (
                <button 
                  key={color} 
                  type="button"
                  onClick={() => setFormData({...formData, color})}
                  className={`w-8 h-8 rounded-full border-2 cursor-pointer ${formData.color === color ? 'border-slate-900 dark:border-white' : 'border-transparent'}`}
                  style={{ backgroundColor: color }}
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
