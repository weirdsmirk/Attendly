'use client';

import { useState } from 'react';
import { addRecord } from '@/app/actions';
import { Plus } from 'lucide-react';
import { format } from 'date-fns';

export default function MarkAttendanceBtn({ subjectId }: { subjectId: string }) {
  const [loading, setLoading] = useState(false);

  const handleMark = async () => {
    setLoading(true);
    try {
      await addRecord({
        subject_id: subjectId,
        date: format(new Date(), 'yyyy-MM-dd'),
        status: 'Attended',
        notes: ''
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleMark}
      disabled={loading}
      className="btn btn-secondary text-indigo-600 hover:text-indigo-700 gap-1 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 disabled:opacity-50"
    >
      <Plus size={16} /> {loading ? '...' : '+1'}
    </button>
  );
}
