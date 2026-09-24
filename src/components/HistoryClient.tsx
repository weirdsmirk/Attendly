import { useMemo, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { Edit2, Trash2 } from 'lucide-react'
import clsx from 'clsx'
import Modal from './Modal'
import { store, useStore } from '../lib/store'
import type { AttendanceRecordWithSubject, RecordStatus } from '../lib/types'
import { useToast } from './Toast'

type Filter = 'All' | 'Attended' | 'Skipped'

export default function HistoryClient() {
  const { subjects, records } = useStore()
  const toast = useToast()
  const [filter, setFilter] = useState<Filter>('All')
  const [editing, setEditing] = useState<AttendanceRecordWithSubject | null>(null)
  const [editDate, setEditDate] = useState('')
  const [editStatus, setEditStatus] = useState<RecordStatus>('Attended')
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const rows = useMemo<AttendanceRecordWithSubject[]>(() => {
    const byId = new Map(subjects.map((s) => [s.id, s]))
    return records
      .filter((r) => byId.has(r.subject_id))
      .map((r) => ({ ...r, subject: byId.get(r.subject_id)! }))
      .sort((a, b) => b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at))
  }, [subjects, records])

  const filtered = useMemo(() => {
    if (filter === 'All') return rows
    return rows.filter((r) => r.status === filter)
  }, [rows, filter])

  const openEdit = (record: AttendanceRecordWithSubject) => {
    setEditing(record)
    setEditDate(record.date)
    setEditStatus(record.status)
    setError(null)
  }

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editing) return
    setError(null)
    try {
      store.updateRecord(editing.id, {
        subject_id: editing.subject_id,
        date: editDate,
        status: editStatus,
        notes: editing.notes,
      })
      toast('Record updated.')
      setEditing(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update record.')
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
    <>
      <div className="mb-8">
        <div className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-2">
          EVERY CLASS, ACCOUNTED FOR
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Attendance log</h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm">Correct mistakes without losing the full history.</p>
      </div>

      <div className="card w-full">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Recent records</h2>
            <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-semibold px-2 py-0.5 rounded-full">
              {filtered.length}
            </span>
          </div>
          <div
            className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg"
            role="group"
            aria-label="Filter records"
          >
            {(['All', 'Attended', 'Skipped'] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                aria-pressed={filter === f}
                className={clsx(
                  'px-3 py-1 text-xs font-medium rounded-md cursor-pointer transition-colors',
                  filter === f
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white',
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
              {rows.length === 0
                ? 'No attendance records yet.'
                : `No ${filter === 'Skipped' ? 'missed' : filter.toLowerCase()} records found.`}
            </div>
          )}
          {filtered.map((record) => {
            let day = record.date
            let month = ''
            try {
              ;[day, month] = format(parseISO(record.date), 'dd MMM').split(' ')
            } catch {
              /* keep raw */
            }
            return (
              <div
                key={record.id}
                className="flex items-center justify-between py-3 px-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors group border-b border-slate-50 dark:border-slate-800/50 last:border-0"
              >
                <div className="flex items-center gap-6">
                  <div className="flex flex-col items-center justify-center w-10">
                    <span className="text-lg font-bold text-slate-900 dark:text-white leading-none">{day}</span>
                    <span className="text-xs text-slate-500">{month}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: record.subject.color }} />
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">{record.subject.name}</div>
                      <div className="text-xs text-slate-500">
                        {record.subject.code} &middot; {record.date}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-8">
                  <div
                    className={clsx(
                      'flex items-center gap-1.5 text-sm font-medium',
                      record.status === 'Attended'
                        ? 'text-emerald-600 dark:text-emerald-500'
                        : record.status === 'Skipped'
                          ? 'text-rose-600 dark:text-rose-500'
                          : 'text-slate-600 dark:text-slate-400',
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

                  <div className="flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEdit(record)}
                      className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 cursor-pointer"
                      aria-label={`Edit ${record.subject.name} record from ${record.date}`}
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(record.id)}
                      disabled={deletingId === record.id}
                      className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 cursor-pointer disabled:opacity-50"
                      aria-label={`Delete ${record.subject.name} record from ${record.date}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {editing && (
        <Modal title="Edit record" onClose={() => setEditing(null)} size="sm">
          <form onSubmit={handleUpdate} className="p-5 space-y-4">
            {error && (
              <div role="alert" className="text-sm text-rose-600 dark:text-rose-400">
                {error}
              </div>
            )}
            <div>
              <div className="text-sm font-semibold text-slate-900 dark:text-white mb-1">{editing.subject.name}</div>
              <div className="text-xs text-slate-500">{editing.subject.code}</div>
            </div>
            <div>
              <label htmlFor="edit-date" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Date
              </label>
              <input
                id="edit-date"
                type="date"
                required
                className="input"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="edit-status" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Status
              </label>
              <select
                id="edit-status"
                className="input"
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as RecordStatus)}
              >
                <option value="Attended">Attended</option>
                <option value="Skipped">Skipped</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Holiday">Holiday</option>
              </select>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setEditing(null)} className="flex-1 btn btn-ghost cursor-pointer">
                Cancel
              </button>
              <button type="submit" className="flex-1 btn btn-primary cursor-pointer">
                Save
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}
