'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { addSubject } from '@/app/actions';

export default function AddSubjectModal({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    teacher: '',
    credits: 3,
    min_attendance_req: 75,
    color: '#4F46E5'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addSubject(formData);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl border border-slate-200">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900">Add subject</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-100">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Subject Name *</label>
            <input required type="text" className="input" placeholder="e.g. Database Systems" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Code *</label>
              <input required type="text" className="input" placeholder="e.g. CS302" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Teacher</label>
              <input type="text" className="input" placeholder="e.g. Dr. Priya" value={formData.teacher} onChange={e => setFormData({...formData, teacher: e.target.value})} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Credits</label>
              <input type="number" min="1" max="10" className="input" value={formData.credits} onChange={e => setFormData({...formData, credits: parseInt(e.target.value)})} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Min Attendance (%)</label>
              <input type="number" min="1" max="100" className="input" value={formData.min_attendance_req} onChange={e => setFormData({...formData, min_attendance_req: parseInt(e.target.value)})} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Color Label</label>
            <div className="flex gap-2">
              {['#4F46E5', '#10B981', '#EF4444', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4'].map(color => (
                <button 
                  key={color} 
                  type="button"
                  onClick={() => setFormData({...formData, color})}
                  className={`w-8 h-8 rounded-full border-2 ${formData.color === color ? 'border-slate-900' : 'border-transparent'}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
          <div className="pt-4 mt-2 border-t border-slate-100 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="btn btn-ghost">Cancel</button>
            <button type="submit" disabled={loading} className="btn btn-primary">{loading ? 'Saving...' : 'Add Subject'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
