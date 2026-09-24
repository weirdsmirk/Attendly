'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { addRecord } from '@/app/actions';
import { Plus } from 'lucide-react';
import { format } from 'date-fns';

export default function MarkAttendanceBtn({ subjectId, compact }: { subjectId: string; compact?: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleMark = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await addRecord({
        subject_id: subjectId,
        date: format(new Date(), 'yyyy-MM-dd'),
        status: 'Attended',
        notes: ''
      });
      router.refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleMark}
      disabled={loading}
      title="Mark present for today"
      aria-label="Mark present"
      className={`btn btn-secondary text-indigo-600 hover:text-indigo-700 gap-1 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 disabled:opacity-50 cursor-pointer ${compact ? 'w-full h-9' : ''}`}
    >
      <Plus size={16} className={loading ? 'opacity-60' : ''} />
    </button>
  );
}
