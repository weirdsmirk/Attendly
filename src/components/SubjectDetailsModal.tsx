import { useState } from 'react'
import { Trash2, Calendar as CalendarIcon, Plus } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import clsx from 'clsx'
import Modal from './Modal'
import { store, useStore } from '../lib/store'
import { summarizeSubject, todayInput } from '../lib/attendance'
import type { RecordStatus } from '../lib/types'
import { useToast } from './Toast'

export default function SubjectDetailsModal({ subjectId, onClose }: { subjectId: string; onClose: () => void }) {
  const { subjects, records } = useStore()
  const toast = useToast()
  const [date, setDate] = useState(todayInput())
  const [status, setStatus] = useState<RecordStatus>('Attended')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const subject = subjects.find((s) => s.id === subjectId)
  if (!subject) return null

  const subRecords = records
    .filter((r) => r.subject_id === subject.id)
    .sort((a, b) => b.date.localeCompare(a.date))
  const summary = summarizeSubject(subject, records)

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      store.addRecord({ subject_id: subject.id, date, status, notes: '' })
      toast('Record added.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add record.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = (id: string) => {
    if (!confirm('Delete this attendance record?')) return
    setDeletingId(id)
    try {
      store.deleteRecord(id)
      toast('Record deleted.')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to delete record.', 'error')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <Modal title={subject.name} onClose={onClose} size="lg">
      <div className="p-5">
        <p className="text-xs text-slate-500 mt-1 mb-6">
          {subject.code}
          {subject.teacher ? ` · ${subject.teacher}` : ''}
        </p>

        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="text-4xl font-bold mb-1">{summary.percentage}%</div>
            <div className="text-sm text-slate-500 dark:text-slate-400">
              {summary.attended} attended of {summary.conducted} conducted
            </div>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-4 py-2 rounded-xl text-center border border-emerald-100 dark:border-emerald-500/20">
            <div className="font-bold">{summary.safeSkips} safe skips</div>
            <div className="text-xs">{subject.min_attendance_req}% requirement</div>
          </div>
        </div>

        <form onSubmit={handleAdd} className="flex gap-2 mb-2">
          <div className="relative flex-1 min-w-0">
            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="date"
              aria-label="Record date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input pl-9"
              required
            />
          </div>
          <select
            aria-label="Record status"
            value={status}
            onChange={(e) => setStatus(e.target.value as RecordStatus)}
            className="input w-36 shrink-0"
          >
            <option value="Attended">Attended</option>
            <option value="Skipped">Skipped</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Holiday">Holiday</option>
          </select>
          <button type="submit" disabled={loading} className="btn btn-primary gap-2 border-0 cursor-pointer shrink-0">
            <Plus size={16} /> {loading ? 'Adding…' : 'Add'}
          </button>
        </form>
        {error && (
          <div role="alert" className="text-sm text-rose-600 dark:text-rose-400 mb-4">
            {error}
          </div>
        )}

        <div className="space-y-1 max-h-56 sm:max-h-64 overflow-y-auto overscroll-contain pr-2 -mr-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
          {subRecords.length === 0 ? (
            <div className="text-center text-slate-500 text-sm py-4">No records yet.</div>
          ) : (
            subRecords.map((record) => {
              let dateLabel = record.date
              try {
                dateLabel = format(parseISO(record.date), 'EEE, MMM d')
              } catch {
                /* keep raw */
              }
              return (
                <div
                  key={record.id}
                  className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0 group"
                >
                  <div className="text-sm font-medium">{dateLabel}</div>
                  <div className="flex items-center gap-4">
                    <div
                      className={clsx(
                        'flex items-center gap-1.5 text-sm font-medium',
                        record.status === 'Attended'
                          ? 'text-emerald-600 dark:text-emerald-500'
                          : record.status === 'Skipped'
                            ? 'text-rose-600 dark:text-rose-500'
                            : 'text-slate-500 dark:text-slate-400',
                      )}
                    >
                      <span
                        className={clsx(
                          'w-1.5 h-1.5 rounded-full',
                          record.status === 'Attended'
                            ? 'bg-emerald-500'
                            : record.status === 'Skipped'
                              ? 'bg-rose-500'
                              : 'bg-slate-400',
                        )}
                      />
                      {record.status}
                    </div>
                    <button
                      onClick={() => handleDelete(record.id)}
                      disabled={deletingId === record.id}
                      className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/30 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 transition-opacity cursor-pointer disabled:opacity-50"
                      aria-label={`Delete record ${dateLabel}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </Modal>
  )
}
