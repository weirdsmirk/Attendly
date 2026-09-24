import { useState } from 'react'
import Modal from './Modal'
import { store, useStore } from '../lib/store'
import { useToast } from './Toast'

const DAYS: { label: string; value: number }[] = [
  { label: 'Monday', value: 1 },
  { label: 'Tuesday', value: 2 },
  { label: 'Wednesday', value: 3 },
  { label: 'Thursday', value: 4 },
  { label: 'Friday', value: 5 },
  { label: 'Saturday', value: 6 },
  { label: 'Sunday', value: 0 },
]

export default function AddClassModal({
  onClose,
  initialDay,
}: {
  onClose: () => void
  initialDay: number
}) {
  const { subjects } = useStore()
  const toast = useToast()
  const [formData, setFormData] = useState({
    subject_id: subjects[0]?.id ?? '',
    day_of_week: initialDay,
    start_time: '09:00',
    end_time: '10:00',
    room: '',
    type: 'Lecture',
  })
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (subjects.length === 0) {
    return (
      <Modal title="No subjects yet" onClose={onClose} size="sm">
        <p className="p-5 text-sm text-slate-500 dark:text-slate-400">
          You need to add at least one subject before you can create timetable classes.
        </p>
        <div className="px-5 pb-5">
          <button onClick={onClose} className="btn btn-primary w-full cursor-pointer">
            Okay
          </button>
        </div>
      </Modal>
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      store.addClass(formData)
      toast('Class added.')
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add class.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal title="Add class" onClose={onClose}>
      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        {error && (
          <div
            role="alert"
            className="text-sm font-medium text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-900/40 rounded-lg px-3 py-2"
          >
            {error}
          </div>
        )}
        <div>
          <label htmlFor="class-subject" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Subject *
          </label>
          <select
            id="class-subject"
            required
            className="input"
            value={formData.subject_id}
            onChange={(e) => setFormData((prev) => ({ ...prev, subject_id: e.target.value }))}
          >
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.code})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="class-day" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Day of week *
            </label>
            <select
              id="class-day"
              required
              className="input"
              value={formData.day_of_week}
              onChange={(e) => setFormData((prev) => ({ ...prev, day_of_week: Number(e.target.value) }))}
            >
              {DAYS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="class-type" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Type
            </label>
            <select
              id="class-type"
              className="input"
              value={formData.type}
              onChange={(e) => setFormData((prev) => ({ ...prev, type: e.target.value }))}
            >
              <option value="Lecture">Lecture</option>
              <option value="Lab">Lab</option>
              <option value="Tutorial">Tutorial</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="class-start" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Start Time *
            </label>
            <input
              id="class-start"
              required
              type="time"
              className="input"
              value={formData.start_time}
              onChange={(e) => setFormData((prev) => ({ ...prev, start_time: e.target.value }))}
            />
          </div>
          <div>
            <label htmlFor="class-end" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
              End Time *
            </label>
            <input
              id="class-end"
              required
              type="time"
              className="input"
              value={formData.end_time}
              onChange={(e) => setFormData((prev) => ({ ...prev, end_time: e.target.value }))}
            />
          </div>
        </div>

        <div>
          <label htmlFor="class-room" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Room
          </label>
          <input
            id="class-room"
            type="text"
            className="input"
            placeholder="e.g. Lab 2"
            value={formData.room}
            onChange={(e) => setFormData((prev) => ({ ...prev, room: e.target.value }))}
          />
        </div>

        <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn btn-ghost cursor-pointer">
            Cancel
          </button>
          <button type="submit" disabled={busy} className="btn btn-primary cursor-pointer">
            {busy ? 'Adding…' : 'Add Class'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
