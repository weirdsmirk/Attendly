import { useMemo, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { store, useStore } from '../lib/store'
import { useSettings } from '../lib/settings'
import MarkAttendanceBtn from './MarkAttendanceBtn'
import AddClassModal from './AddClassModal'
import { useToast } from './Toast'

const DAYS: { name: string; num: number }[] = [
  { name: 'Monday', num: 1 },
  { name: 'Tuesday', num: 2 },
  { name: 'Wednesday', num: 3 },
  { name: 'Thursday', num: 4 },
  { name: 'Friday', num: 5 },
  { name: 'Saturday', num: 6 },
  { name: 'Sunday', num: 0 },
]

export default function TimetableGrid() {
  const { timetable, subjects } = useStore()
  const { dayScope } = useSettings()
  const toast = useToast()
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [selectedDay, setSelectedDay] = useState(1)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const visibleDays = dayScope === 'week' ? DAYS.filter((d) => d.num >= 1 && d.num <= 5) : DAYS

  // Classes join their subject here, once, rather than in every day column.
  const rows = useMemo(() => {
    const byId = new Map(subjects.map((s) => [s.id, s]))
    return timetable
      .filter((t) => byId.has(t.subject_id))
      .map((t) => ({ ...t, subject: byId.get(t.subject_id)! }))
  }, [timetable, subjects])

  const openAddForDay = (dayNum: number) => {
    setSelectedDay(dayNum)
    setIsAddOpen(true)
  }

  const handleDelete = (id: string) => {
    if (!confirm('Remove this class from the timetable?')) return
    setDeletingId(id)
    try {
      store.deleteClass(id)
      toast('Class removed.')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to remove class.', 'error')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-2">
            YOUR WEEKLY RHYTHM
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Timetable</h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm">Recurring classes, ready for one-tap attendance.</p>
        </div>
        <button onClick={() => openAddForDay(1)} className="btn btn-primary gap-2 cursor-pointer">
          <Plus size={16} /> Add class
        </button>
      </div>

      {subjects.length === 0 ? (
        <div className="card text-center py-14">
          <p className="text-sm text-slate-500">Add a subject before scheduling classes.</p>
        </div>
      ) : (
        <div
          className={
            dayScope === 'week'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4'
              : 'flex gap-4 overflow-x-auto pb-4'
          }
        >
          {visibleDays.map(({ name: dayName, num: dayNum }) => {
            const classes = rows
              .filter((t) => t.day_of_week === dayNum)
              .sort((a, b) => a.start_time.localeCompare(b.start_time))

            return (
              <div key={dayName} className={dayScope === 'week' ? 'min-w-0' : 'flex-1 min-w-[280px]'}>
                <div className="flex items-center justify-between mb-4 border-b-2 border-indigo-600 pb-2">
                  <h2 className="font-bold text-slate-900 dark:text-white">{dayName}</h2>
                  <span className="text-xs text-slate-500 font-medium">
                    {classes.length} class{classes.length === 1 ? '' : 'es'}
                  </span>
                </div>

                <div className="space-y-4">
                  {classes.map((cls) => (
                    <div
                      key={cls.id}
                      className="card relative group p-5 rounded-2xl overflow-hidden transition-colors duration-150 hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20"
                    >
                      <div
                        className="absolute top-0 right-0 w-3 h-3 rounded-bl-xl"
                        style={{ backgroundColor: cls.subject.color }}
                      />
                      <button
                        onClick={() => handleDelete(cls.id)}
                        disabled={deletingId === cls.id}
                        className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 transition-opacity cursor-pointer z-10 disabled:opacity-50"
                        title="Remove from timetable"
                        aria-label={`Remove ${cls.subject.name} on ${dayName}`}
                      >
                        <Trash2 size={14} />
                      </button>

                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                          {cls.start_time}
                        </span>
                        <span className="text-xs text-slate-400">{cls.end_time}</span>
                        {cls.type && (
                          <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                            {cls.type}
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-slate-900 dark:text-white mb-1 pr-6">{cls.subject.name}</h3>
                      <p className="text-xs text-slate-500 mb-4">{cls.room || 'No room set'}</p>

                      <MarkAttendanceBtn subjectId={cls.subject_id} />
                    </div>
                  ))}

                  <button
                    onClick={() => openAddForDay(dayNum)}
                    className="w-full py-4 border border-dashed border-slate-200/70 dark:border-slate-800/70 rounded-2xl text-slate-300 dark:text-slate-600 hover:text-indigo-500 dark:hover:text-indigo-400 hover:border-indigo-300/70 dark:hover:border-indigo-900/40 hover:bg-indigo-50/40 dark:hover:bg-indigo-900/10 transition-colors flex flex-col items-center justify-center gap-1.5 text-sm font-medium cursor-pointer"
                  >
                    <Plus size={14} />
                    Add class
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {isAddOpen && <AddClassModal initialDay={selectedDay} onClose={() => setIsAddOpen(false)} />}
    </>
  )
}
