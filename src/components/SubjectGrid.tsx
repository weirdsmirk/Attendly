import { useEffect, useMemo, useRef, useState } from 'react'
import { Plus, MoreHorizontal, Pencil, Trash2, Eye } from 'lucide-react'
import SubjectDetailsModal from './SubjectDetailsModal'
import AddSubjectModal from './AddSubjectModal'
import MarkAttendanceBtn from './MarkAttendanceBtn'
import { store, useStore } from '../lib/store'
import { summarizeSubject } from '../lib/attendance'
import type { Subject } from '../lib/types'
import { useToast } from './Toast'

export default function SubjectGrid({ query }: { query: string }) {
  const { subjects, records } = useStore()
  const toast = useToast()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpenMenuId(null)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenMenuId(null)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return subjects
    return subjects.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        (s.teacher ?? '').toLowerCase().includes(q),
    )
  }, [subjects, query])

  const handleDelete = (sub: Subject) => {
    setOpenMenuId(null)
    if (!confirm(`Delete "${sub.name}"? All attendance records and classes for it will be permanently lost.`)) return
    setDeletingId(sub.id)
    try {
      store.deleteSubject(sub.id)
      if (selectedId === sub.id) setSelectedId(null)
      if (editId === sub.id) setEditId(null)
      toast('Subject deleted.')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to delete subject.', 'error')
    } finally {
      setDeletingId(null)
    }
  }

  const editSubject = subjects.find((s) => s.id === editId)

  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-2">
            MANAGE YOUR COURSES
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Subjects</h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            Set individual attendance requirements and keep every class accountable.
          </p>
        </div>
        <button onClick={() => setIsAddOpen(true)} className="btn btn-primary gap-2 cursor-pointer">
          <Plus size={16} /> Add subject
        </button>
      </div>

      {query.trim() !== '' && (
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          {filtered.length} result{filtered.length === 1 ? '' : 's'} for “{query}”
        </p>
      )}

      {subjects.length === 0 ? (
        <div className="card text-center py-14">
          <p className="text-sm text-slate-500">No subjects yet.</p>
          <button onClick={() => setIsAddOpen(true)} className="btn btn-primary mt-4 cursor-pointer">
            <Plus size={16} /> Add your first subject
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((sub) => {
            const summary = summarizeSubject(sub, records)
            return (
              <div
                key={sub.id}
                onClick={() => setSelectedId(sub.id)}
                className="card relative group cursor-pointer transition-colors duration-150 hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 active:bg-indigo-50 dark:active:bg-indigo-950/30 active:border-indigo-500"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: sub.color }} />
                    <span className="text-xs font-semibold text-slate-500">{sub.code}</span>
                  </div>
                  <div className="relative" ref={openMenuId === sub.id ? menuRef : undefined}>
                    <button
                      className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation()
                        setOpenMenuId(openMenuId === sub.id ? null : sub.id)
                      }}
                      aria-label={`Options for ${sub.name}`}
                      aria-haspopup="menu"
                      aria-expanded={openMenuId === sub.id}
                    >
                      <MoreHorizontal size={16} />
                    </button>
                    {openMenuId === sub.id && (
                      <div
                        className="absolute right-0 top-9 z-30 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-1 overflow-hidden"
                        role="menu"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                          onClick={() => {
                            setOpenMenuId(null)
                            setSelectedId(sub.id)
                          }}
                          role="menuitem"
                        >
                          <Eye size={14} /> View details
                        </button>
                        <button
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                          onClick={() => {
                            setOpenMenuId(null)
                            setEditId(sub.id)
                          }}
                          role="menuitem"
                        >
                          <Pencil size={14} /> Edit subject
                        </button>
                        <button
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 cursor-pointer disabled:opacity-50"
                          disabled={deletingId === sub.id}
                          onClick={() => handleDelete(sub)}
                          role="menuitem"
                        >
                          <Trash2 size={14} /> {deletingId === sub.id ? 'Deleting…' : 'Delete'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* The card itself is mouse-clickable, so the subject name is the
                    real keyboard control for opening its details — nesting a button
                    inside a role="button" card would hide both from the a11y tree. */}
                <h3 className="mb-1 leading-tight">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedId(sub.id)
                    }}
                    className="text-left text-lg font-bold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 focus-visible:outline-none focus-visible:underline cursor-pointer"
                  >
                    {sub.name}
                  </button>
                </h3>
                <p className="text-xs text-slate-500 mb-6">
                  {sub.teacher || 'No teacher'} &middot; {sub.credits} credits
                </p>

                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-3xl font-bold text-slate-900 dark:text-white">{summary.percentage}%</span>
                  <span className="text-xs text-slate-500 font-medium">
                    of {sub.min_attendance_req}% required
                  </span>
                </div>

                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mb-4">
                  <div
                    className="h-1.5 rounded-full"
                    style={{
                      width: `${Math.min(100, summary.percentage)}%`,
                      backgroundColor: summary.onTrack ? sub.color : '#EF4444',
                    }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs pt-4 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">
                    {summary.attended} attended &middot; {summary.missed} missed
                  </span>
                  {summary.onTrack ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                      {summary.safeSkips} safe skip{summary.safeSkips === 1 ? '' : 's'}
                    </span>
                  ) : (
                    <span className="text-rose-600 dark:text-rose-400 font-medium">{summary.toRecover} to recover</span>
                  )}
                </div>
                <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                  <MarkAttendanceBtn subjectId={sub.id} compact />
                </div>
              </div>
            )
          })}

          <button
            onClick={() => setIsAddOpen(true)}
            className="card flex flex-col items-center justify-center text-center cursor-pointer transition-colors duration-150 hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 active:bg-indigo-50 dark:active:bg-indigo-950/30 border-dashed min-h-[220px]"
          >
            <span className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
              <Plus size={20} />
            </span>
            <span className="font-bold text-slate-900 dark:text-white">Add a subject</span>
            <span className="text-xs text-slate-500 mt-1">Track another course</span>
          </button>
        </div>
      )}

      {subjects.length > 0 && filtered.length === 0 && (
        <div className="text-center text-sm text-slate-500 py-10">No subjects match your search.</div>
      )}

      {selectedId && <SubjectDetailsModal subjectId={selectedId} onClose={() => setSelectedId(null)} />}
      {isAddOpen && <AddSubjectModal onClose={() => setIsAddOpen(false)} />}
      {editSubject && <AddSubjectModal onClose={() => setEditId(null)} initialData={editSubject} />}
    </>
  )
}
