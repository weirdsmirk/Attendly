import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import Modal from './Modal'
import { store } from '../lib/store'
import { ALLOWED_COLORS, type Subject } from '../lib/types'
import { useToast } from './Toast'

const empty = {
  name: '',
  code: '',
  teacher: '',
  credits: 3,
  min_attendance_req: 75,
  initial_conducted: 0,
  initial_attended: 0,
  color: ALLOWED_COLORS[0],
}

export default function AddSubjectModal({ onClose, initialData }: { onClose: () => void; initialData?: Subject }) {
  const toast = useToast()
  const [formData, setFormData] = useState(
    initialData
      ? {
          name: initialData.name,
          code: initialData.code,
          teacher: initialData.teacher ?? '',
          credits: initialData.credits,
          min_attendance_req: initialData.min_attendance_req,
          initial_conducted: initialData.initial_conducted,
          initial_attended: initialData.initial_attended,
          color: initialData.color,
        }
      : empty,
  )
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const setNum = (key: 'credits' | 'min_attendance_req' | 'initial_conducted' | 'initial_attended', raw: string) => {
    setFormData((prev) => ({ ...prev, [key]: raw === '' ? 0 : Math.max(0, Math.trunc(Number(raw) || 0)) }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!formData.name.trim()) return setError('Subject name is required.')
    if (!formData.code.trim()) return setError('Subject code is required.')
    setBusy(true)
    try {
      if (initialData) {
        store.updateSubject(initialData.id, formData)
        toast('Subject updated.')
      } else {
        store.addSubject(formData)
        toast('Subject added.')
      }
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = () => {
    if (!initialData) return
    if (!confirm(`Delete "${initialData.name}"? All attendance records and classes for it will be permanently lost.`)) return
    setBusy(true)
    try {
      store.deleteSubject(initialData.id)
      toast('Subject deleted.')
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete subject.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal title={initialData ? 'Edit subject' : 'Add subject'} onClose={onClose}>
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
          <label htmlFor="subject-name" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Subject Name *
          </label>
          <input
            id="subject-name"
            required
            type="text"
            className="input"
            placeholder="e.g. Database Systems"
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="subject-code" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Code *
            </label>
            <input
              id="subject-code"
              required
              type="text"
              className="input"
              placeholder="e.g. CS302"
              value={formData.code}
              onChange={(e) => setFormData((prev) => ({ ...prev, code: e.target.value }))}
            />
          </div>
          <div>
            <label htmlFor="subject-teacher" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Teacher
            </label>
            <input
              id="subject-teacher"
              type="text"
              className="input"
              placeholder="e.g. Dr. Priya"
              value={formData.teacher}
              onChange={(e) => setFormData((prev) => ({ ...prev, teacher: e.target.value }))}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="subject-credits" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Credits
            </label>
            <input
              id="subject-credits"
              type="number"
              min="1"
              max="10"
              className="input"
              value={formData.credits}
              onChange={(e) => setNum('credits', e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="subject-min" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Min Attendance (%)
            </label>
            <input
              id="subject-min"
              type="number"
              min="1"
              max="100"
              className="input"
              value={formData.min_attendance_req}
              onChange={(e) => setNum('min_attendance_req', e.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="subject-conducted" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Initial Conducted
            </label>
            <input
              id="subject-conducted"
              type="number"
              min="0"
              className="input"
              value={formData.initial_conducted}
              onChange={(e) => setNum('initial_conducted', e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="subject-attended" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Initial Attended
            </label>
            <input
              id="subject-attended"
              type="number"
              min="0"
              className="input"
              value={formData.initial_attended}
              onChange={(e) => setNum('initial_attended', e.target.value)}
            />
          </div>
        </div>
        <div>
          <span className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2" id="subject-color-label">
            Color Label
          </span>
          <div className="flex gap-2" role="group" aria-labelledby="subject-color-label">
            {ALLOWED_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, color }))}
                aria-label={`Color ${color}`}
                aria-pressed={formData.color === color}
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
              disabled={busy}
              className="btn text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20"
              title="Delete Subject"
              aria-label="Delete subject"
            >
              <Trash2 size={18} />
            </button>
          )}
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="btn btn-ghost">
              Cancel
            </button>
            <button type="submit" disabled={busy} className="btn btn-primary">
              {busy ? 'Saving…' : initialData ? 'Save Changes' : 'Add Subject'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
