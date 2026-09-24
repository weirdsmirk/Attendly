import { useRef, useState } from 'react'
import { LayoutDashboard, ListOrdered, CalendarDays, BookOpen, Settings, HelpCircle, Zap, Download, Upload, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import clsx from 'clsx'
import Modal from './Modal'
import { store, useStore } from '../lib/store'
import { settings as settingsStore, useSettings } from '../lib/settings'
import type { DayScope } from '../lib/settings'
import { useToast } from './Toast'

const sections = [
  {
    title: 'Workspace',
    items: [
      { name: 'Overview', page: 'overview', icon: LayoutDashboard },
      { name: 'Attendance log', page: 'history', icon: ListOrdered },
      { name: 'Timetable', page: 'timetable', icon: CalendarDays },
    ],
  },
  { title: 'Manage', items: [{ name: 'Subjects', page: 'subjects', icon: BookOpen }] },
]

export default function Sidebar({ page, onNavigate }: { page: string; onNavigate: (page: string) => void }) {
  const { subjects, timetable, records } = useStore()
  const { dayScope, sidebarCollapsed: collapsed } = useSettings()
  const toast = useToast()
  const [showSettings, setShowSettings] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement | null>(null)

  const handleExport = () => {
    const data = store.exportSnapshot()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `attendly-backup-${data.exportedAt.slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    setMessage('Backup downloaded.')
    toast('Backup downloaded.')
  }

  const handleImportFile = async (file: File) => {
    setMessage(null)
    try {
      const text = await file.text()
      const result = store.importSnapshot(text)
      setMessage(
        `Restored ${result.subjects} subjects, ${result.timetable} classes and ${result.records} records.`,
      )
      toast('Backup restored.')
    } catch (e) {
      const reason = e instanceof Error ? e.message : 'Import failed.'
      setMessage(`${reason} Your existing data was left untouched.`)
      toast(reason, 'error')
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <>
      <div
        className={clsx(
          'relative border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col h-full shrink-0 transition-[width] duration-200',
          collapsed ? 'w-[68px]' : 'w-64',
        )}
      >
        <button
          onClick={() => settingsStore.toggleSidebar()}
          className="absolute -right-3 top-6 z-10 h-6 w-6 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center justify-center cursor-pointer"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <PanelLeftOpen size={13} /> : <PanelLeftClose size={13} />}
        </button>

        <div className={clsx('flex items-center gap-2 mb-4', collapsed ? 'p-4 justify-center' : 'p-6')}>
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold shrink-0">
            <Zap size={18} />
          </div>
          {!collapsed && (
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Attend<span className="text-indigo-600 dark:text-indigo-400">ly</span>
            </span>
          )}
        </div>

        <div className={clsx('flex-1 space-y-8 overflow-y-auto mt-2', collapsed ? 'px-2' : 'px-4')}>
          {sections.map((section) => (
            <div key={section.title}>
              {!collapsed && (
                <h2 className="px-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  {section.title}
                </h2>
              )}
              <nav className="space-y-1">
                {section.items.map((item) => {
                  const isActive = page === item.page
                  return (
                    <button
                      key={item.page}
                      onClick={() => onNavigate(item.page)}
                      title={collapsed ? item.name : undefined}
                      aria-current={isActive ? 'page' : undefined}
                      className={clsx(
                        'flex w-full items-center rounded-lg text-sm font-medium transition-colors cursor-pointer',
                        collapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2.5',
                        isActive
                          ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 border-l-2 border-indigo-600'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200 border-l-2 border-transparent',
                      )}
                    >
                      <item.icon size={18} className="shrink-0" />
                      {!collapsed && item.name}
                    </button>
                  )
                })}
              </nav>
            </div>
          ))}
        </div>

        <div className={clsx('border-t border-slate-200 dark:border-slate-800 space-y-1', collapsed ? 'p-2' : 'p-4')}>
          <button
            onClick={() => setShowHelp(true)}
            title={collapsed ? 'Help center' : undefined}
            className={clsx(
              'flex w-full items-center rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200 transition-colors cursor-pointer',
              collapsed ? 'justify-center px-0 py-2' : 'gap-3 px-3 py-2',
            )}
          >
            <HelpCircle size={18} className="shrink-0" />
            {!collapsed && 'Help center'}
          </button>
          <button
            onClick={() => {
              setMessage(null)
              setShowSettings(true)
            }}
            title={collapsed ? 'Settings' : undefined}
            className={clsx(
              'flex w-full items-center rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200 transition-colors cursor-pointer',
              collapsed ? 'justify-center px-0 py-2' : 'gap-3 px-3 py-2',
            )}
          >
            <Settings size={18} className="shrink-0" />
            {!collapsed && 'Settings'}
          </button>
          {!collapsed && (
            <div className="mt-4 px-3 flex items-center gap-2 text-xs text-slate-500">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              Stored locally in your browser
            </div>
          )}
        </div>
      </div>

      {showHelp && (
        <Modal title="Help center" onClose={() => setShowHelp(false)}>
          <div className="p-5 space-y-4 text-sm text-slate-600 dark:text-slate-300">
            <div>
              <div className="font-semibold text-slate-900 dark:text-white mb-1">Mark attendance</div>
              <p>
                Use the + button on the dashboard, subjects or timetable to mark today as attended. One tap per
                subject per day — tapping again keeps a single record.
              </p>
            </div>
            <div>
              <div className="font-semibold text-slate-900 dark:text-white mb-1">Manage subjects</div>
              <p>
                On the Subjects page, use the ••• menu on any card to view details, edit or delete. Use “Add
                subject” to create a new course.
              </p>
            </div>
            <div>
              <div className="font-semibold text-slate-900 dark:text-white mb-1">Timetable</div>
              <p>Use “Add class” on any day to schedule a recurring class. Hover a class to remove it.</p>
            </div>
            <div>
              <div className="font-semibold text-slate-900 dark:text-white mb-1">Backup</div>
              <p>Open Settings to export a JSON backup or restore from a previous backup file.</p>
            </div>
          </div>
        </Modal>
      )}

      {showSettings && (
        <Modal title="Settings" onClose={() => setShowSettings(false)}>
          <div className="p-5 space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Schedule</h3>
              <div
                className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl"
                role="group"
                aria-label="Days shown on the timetable"
              >
                {(
                  [
                    ['week', 'Weekdays (Mon–Fri)'],
                    ['full', 'Full week (Mon–Sun)'],
                  ] as [DayScope, string][]
                ).map(([value, label]) => (
                  <button
                    key={value}
                    onClick={() => settingsStore.setDayScope(value)}
                    aria-pressed={dayScope === value}
                    className={clsx(
                      'flex-1 px-3 py-2 text-xs font-medium rounded-lg cursor-pointer transition-colors',
                      dayScope === value
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white',
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                Controls which days appear on your timetable.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Data Management</h3>
              <div className="space-y-2">
                <button
                  onClick={handleExport}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                >
                  <Download size={18} className="text-indigo-600 dark:text-indigo-400" />
                  <div>
                    <div className="text-sm font-medium text-slate-900 dark:text-white">Export Data</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {subjects.length} subjects · {timetable.length} classes · {records.length} records
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                >
                  <Upload size={18} className="text-indigo-600 dark:text-indigo-400" />
                  <div>
                    <div className="text-sm font-medium text-slate-900 dark:text-white">Import Data</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Restore from a backup file</div>
                  </div>
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="application/json,.json"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) void handleImportFile(f)
                  }}
                />
                {message && (
                  <div
                    role="status"
                    className="text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2"
                  >
                    {message}
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">About</h3>
              <div className="px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                <div className="text-sm font-medium text-slate-900 dark:text-white mb-1">Attendly v1.0.0</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Local-first attendance tracker. Your data stays in this browser.
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}
