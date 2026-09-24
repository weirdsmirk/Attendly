import { useState } from 'react'
import { Plus, Check } from 'lucide-react'
import { store, useStore } from '../lib/store'
import { todayInput } from '../lib/attendance'
import { useToast } from './Toast'

/**
 * One tap marks today present. Idempotent by (subject, day): tapping again, or
 * a second card for the same subject, updates the existing row instead of
 * inserting a duplicate that would inflate every statistic in the app.
 */
export default function MarkAttendanceBtn({ subjectId, compact }: { subjectId: string; compact?: boolean }) {
  const { records } = useStore()
  const toast = useToast()
  const [busy, setBusy] = useState(false)
  const today = todayInput()
  const marked = records.some(
    (r) => r.subject_id === subjectId && r.date === today && r.status === 'Attended',
  )

  const handleMark = () => {
    if (busy || marked) return
    setBusy(true)
    try {
      store.markPresent(subjectId)
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not mark attendance.', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      onClick={handleMark}
      disabled={busy || marked}
      title={marked ? 'Already marked present today' : 'Mark present for today'}
      aria-label={marked ? 'Present today' : 'Mark present'}
      className={`btn btn-secondary text-indigo-600 hover:text-indigo-700 gap-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 dark:text-indigo-300 disabled:opacity-60 disabled:cursor-default disabled:hover:bg-indigo-50 dark:disabled:hover:bg-indigo-500/10 ${compact ? 'w-full h-9' : ''}`}
    >
      {marked ? <Check size={16} /> : <Plus size={16} />}
    </button>
  )
}
