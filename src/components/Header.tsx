import { useMemo, useState } from 'react'
import { Search, Moon, Sun, Bell, X } from 'lucide-react'
import Modal from './Modal'
import { useStore } from '../lib/store'
import { useSettings, settings as settingsStore } from '../lib/settings'
import { summarizeSubject, todaysClasses } from '../lib/attendance'
import { useToast } from './Toast'

const PAGE_NAMES: Record<string, string> = {
  overview: 'Overview',
  history: 'Attendance log',
  timetable: 'Timetable',
  subjects: 'Subjects',
}

export default function Header({
  page,
  query,
  onQueryChange,
  onNavigate,
}: {
  page: string
  query: string
  onQueryChange: (value: string) => void
  onNavigate: (page: string) => void
}) {
  const { subjects, timetable, records } = useStore()
  const { profile, theme } = useSettings()
  const toast = useToast()
  const [showProfile, setShowProfile] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [draft, setDraft] = useState(profile)
  const [profileError, setProfileError] = useState<string | null>(null)

  const notifications = useMemo(() => {
    const items: { title: string; detail: string; tone: 'rose' | 'indigo' | 'emerald' }[] = []
    const byId = new Map(subjects.map((s) => [s.id, s]))
    const today = todaysClasses(timetable)
      .filter((t) => byId.has(t.subject_id))
      .map((t) => ({ ...t, subject: byId.get(t.subject_id)! }))
    if (today.length > 0) {
      items.push({
        title: `${today.length} class${today.length === 1 ? '' : 'es'} today`,
        detail: today.map((c) => c.subject.name).join(', '),
        tone: 'indigo',
      })
    }
    for (const subject of subjects) {
      const summary = summarizeSubject(subject, records)
      if (!summary.onTrack) {
        items.push({
          title: `${subject.name} is below target`,
          detail: `${summary.percentage}% of ${subject.min_attendance_req}% · ${summary.toRecover} to recover`,
          tone: 'rose',
        })
      }
    }
    if (items.length === 0) {
      items.push({ title: 'All clear', detail: 'No classes today and every subject is on track.', tone: 'emerald' })
    }
    return items.slice(0, 6)
  }, [subjects, timetable, records])

  const alertCount = notifications.filter((n) => n.tone === 'rose').length

  const openProfile = () => {
    setDraft(profile)
    setProfileError(null)
    setShowProfile(true)
  }

  const saveProfile = (e: React.FormEvent) => {
    e.preventDefault()
    if (!draft.name.trim()) {
      setProfileError('Name is required.')
      return
    }
    try {
      settingsStore.setProfile(draft)
      toast('Profile saved.')
      setIsEditingProfile(false)
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Could not save your profile.')
    }
  }

  return (
    <>
      <header className="flex items-center justify-between gap-4 px-6 lg:px-10 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
          Workspace
          <span aria-hidden className="text-slate-300 dark:text-slate-600">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </span>
          <span className="text-slate-900 dark:text-white font-semibold">{PAGE_NAMES[page] ?? 'Overview'}</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="search"
              aria-label="Search subjects"
              placeholder="Search subjects…"
              value={query}
              onChange={(e) => {
                onQueryChange(e.target.value)
                if (e.target.value.trim()) onNavigate('subjects')
              }}
              className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 w-56"
            />
          </div>

          <button
            onClick={() => settingsStore.toggleTheme()}
            className="p-2.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <div className="relative">
            <button
              onClick={() => setShowNotifications((v) => !v)}
              className="p-2.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              aria-label={`Notifications${alertCount > 0 ? `, ${alertCount} at risk` : ''}`}
              aria-expanded={showNotifications}
            >
              <Bell size={18} />
              {alertCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 border-2 border-white dark:border-slate-800" />
              )}
            </button>
            {showNotifications && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowNotifications(false)} />
                <div
                  className="absolute right-0 top-12 z-40 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden"
                  role="region"
                  aria-label="Notifications"
                >
                  <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 font-semibold text-sm text-slate-900 dark:text-white">
                    Notifications
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.map((n, i) => (
                      <div
                        key={`${n.title}-${i}`}
                        className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0 flex gap-3"
                      >
                        <span
                          className={
                            n.tone === 'rose'
                              ? 'mt-1 w-2 h-2 rounded-full bg-rose-500 shrink-0'
                              : n.tone === 'indigo'
                                ? 'mt-1 w-2 h-2 rounded-full bg-indigo-500 shrink-0'
                                : 'mt-1 w-2 h-2 rounded-full bg-emerald-500 shrink-0'
                          }
                        />
                        <div>
                          <div className="text-sm font-medium text-slate-900 dark:text-white">{n.title}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">{n.detail}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <button
            onClick={openProfile}
            className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-semibold cursor-pointer"
            title="Profile"
            aria-label="Open profile"
          >
            {profile.initials}
          </button>
        </div>
      </header>

      {showProfile && (
        <Modal
          title="Profile"
          onClose={() => {
            setShowProfile(false)
            setIsEditingProfile(false)
          }}
          size="sm"
        >
          {!isEditingProfile ? (
            <div className="p-5">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 flex items-center justify-center font-bold text-xl border border-purple-200 dark:border-purple-800">
                  {profile.initials}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{profile.name}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{profile.course || 'No course set'}</p>
                </div>
              </div>
              <div className="space-y-3 mb-6">
                {[
                  ['Student ID', profile.studentId],
                  ['Semester', profile.semester],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800"
                  >
                    <span className="text-sm text-slate-500 dark:text-slate-400">{label}</span>
                    <span className="text-sm font-medium text-slate-900 dark:text-white">{value || '—'}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => {
                  setDraft(profile)
                  setIsEditingProfile(true)
                }}
                className="w-full btn btn-secondary cursor-pointer"
              >
                Edit Profile
              </button>
            </div>
          ) : (
            <form onSubmit={saveProfile} className="p-5 space-y-4">
              {profileError && (
                <div
                  role="alert"
                  className="text-sm font-medium text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-900/40 rounded-lg px-3 py-2"
                >
                  {profileError}
                </div>
              )}
              <div>
                <label htmlFor="profile-name" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Name *
                </label>
                <input
                  id="profile-name"
                  className="input"
                  value={draft.name}
                  onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label htmlFor="profile-course" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Course
                </label>
                <input
                  id="profile-course"
                  className="input"
                  value={draft.course}
                  onChange={(e) => setDraft((prev) => ({ ...prev, course: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="profile-id" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Student ID
                  </label>
                  <input
                    id="profile-id"
                    className="input"
                    value={draft.studentId}
                    onChange={(e) => setDraft((prev) => ({ ...prev, studentId: e.target.value }))}
                  />
                </div>
                <div>
                  <label htmlFor="profile-semester" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Semester
                  </label>
                  <input
                    id="profile-semester"
                    className="input"
                    value={draft.semester}
                    onChange={(e) => setDraft((prev) => ({ ...prev, semester: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="flex-1 btn btn-ghost cursor-pointer"
                >
                  <X size={14} /> Cancel
                </button>
                <button type="submit" className="flex-1 btn btn-primary cursor-pointer">
                  Save
                </button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </>
  )
}
