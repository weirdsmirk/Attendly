'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ListOrdered, CalendarDays, BookOpen, Settings, HelpCircle, Zap, X, Download, Upload } from 'lucide-react';
import clsx from 'clsx';
import { useRef, useState } from 'react';
import { exportAllData, importAllData } from '@/app/actions';
import { useRouter } from 'next/navigation';

const navItems = [
  { name: 'Overview', href: '/', icon: LayoutDashboard },
  { name: 'Attendance log', href: '/history', icon: ListOrdered },
  { name: 'Timetable', href: '/timetable', icon: CalendarDays },
];

const manageItems = [
  { name: 'Subjects', href: '/subjects', icon: BookOpen },
];

type DayScope = 'week' | 'full';

const DAY_SCOPE_KEY = 'timetableDays';
const DAY_SCOPE_EVENT = 'attendly:timetable-days';

function readDayScope(): DayScope {
  return localStorage.getItem(DAY_SCOPE_KEY) === 'week' ? 'week' : 'full';
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [busy, setBusy] = useState<'export' | 'import' | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [dayScope, setDayScope] = useState<DayScope>('full');
  const fileRef = useRef<HTMLInputElement | null>(null);

  const handleDayScope = (value: DayScope) => {
    setDayScope(value);
    localStorage.setItem(DAY_SCOPE_KEY, value);
    window.dispatchEvent(new Event(DAY_SCOPE_EVENT));
  };

  const handleExport = async () => {
    setBusy('export');
    setMessage(null);
    try {
      const data = await exportAllData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendly-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setMessage('Backup downloaded.');
    } catch (e: unknown) {
      setMessage(e instanceof Error ? e.message : 'Export failed.');
    } finally {
      setBusy(null);
    }
  };

  const handleImportFile = async (file: File) => {
    setBusy('import');
    setMessage(null);
    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      await importAllData(payload);
      setMessage('Backup restored.');
      router.refresh();
    } catch (e: unknown) {
      setMessage(e instanceof Error ? e.message : 'Import failed. Please choose a valid backup file.');
    } finally {
      setBusy(null);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <>
      <div className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col h-full shrink-0">
        <div className="p-6 flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
            <Zap size={18} />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Attend<span className="text-indigo-600 dark:text-indigo-400">ly</span></span>
        </div>

        <div className="flex-1 px-4 space-y-8 overflow-y-auto mt-2">
          <div>
            <h3 className="px-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Workspace</h3>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={clsx(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 border-l-2 border-indigo-600'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200 border-l-2 border-transparent'
                    )}
                  >
                    <item.icon size={18} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div>
            <h3 className="px-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Manage</h3>
            <nav className="space-y-1">
              {manageItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={clsx(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 border-l-2 border-indigo-600'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200 border-l-2 border-transparent'
                    )}
                  >
                    <item.icon size={18} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-1">
          <button
            onClick={() => setShowHelp(true)}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200 transition-colors w-full cursor-pointer"
          >
            <HelpCircle size={18} />
            Help center
          </button>
          <button
            onClick={() => { setDayScope(readDayScope()); setShowSettings(true); setMessage(null); }}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200 transition-colors w-full cursor-pointer"
          >
            <Settings size={18} />
            Settings
          </button>
          <div className="mt-4 px-3 flex items-center gap-2 text-xs text-slate-500">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            Your data is stored locally
          </div>
        </div>
      </div>

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={() => setShowHelp(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md border border-slate-200 dark:border-slate-800 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Help center</h2>
              <button onClick={() => setShowHelp(false)} className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer" aria-label="Close help">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4 text-sm text-slate-600 dark:text-slate-300">
              <div>
                <div className="font-semibold text-slate-900 dark:text-white mb-1">Mark attendance</div>
                <p>Use the +1 button on the dashboard, subjects, or timetable to mark today as attended. Open a subject to add skipped, cancelled, or holiday records for any date.</p>
              </div>
              <div>
                <div className="font-semibold text-slate-900 dark:text-white mb-1">Manage subjects</div>
                <p>On the Subjects page, use the ••• menu on any card to view details, edit, or delete. Use “Add subject” to create a new course.</p>
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
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={() => setShowSettings(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md border border-slate-200 dark:border-slate-800 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Settings</h2>
              <button onClick={() => setShowSettings(false)} className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer" aria-label="Close settings">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Schedule</h3>
                <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  {([['week', 'Weekdays (Mon–Fri)'], ['full', 'Full week (Mon–Sun)']] as [DayScope, string][]).map(([value, label]) => (
                    <button
                      key={value}
                      onClick={() => handleDayScope(value)}
                      className={clsx(
                        'flex-1 px-3 py-2 text-xs font-medium rounded-lg cursor-pointer transition-colors',
                        dayScope === value
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Controls which days appear on your timetable.</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Data Management</h3>
                <div className="space-y-2">
                  <button
                    onClick={handleExport}
                    disabled={busy !== null}
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Download size={18} className="text-indigo-600 dark:text-indigo-400" />
                    <div>
                      <div className="text-sm font-medium text-slate-900 dark:text-white">{busy === 'export' ? 'Exporting…' : 'Export Data'}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">Download your attendance backup (JSON)</div>
                    </div>
                  </button>
                  <button
                    onClick={() => fileRef.current?.click()}
                    disabled={busy !== null}
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Upload size={18} className="text-indigo-600 dark:text-indigo-400" />
                    <div>
                      <div className="text-sm font-medium text-slate-900 dark:text-white">{busy === 'import' ? 'Importing…' : 'Import Data'}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">Restore from a backup file</div>
                    </div>
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="application/json,.json"
                    className="hidden"
                    onChange={e => {
                      const f = e.target.files?.[0];
                      if (f) handleImportFile(f);
                    }}
                  />
                  {message && (
                    <div className="text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2">
                      {message}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">About</h3>
                <div className="px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                  <div className="text-sm font-medium text-slate-900 dark:text-white mb-1">Attendly v1.0.0</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Local-first attendance tracker built with Next.js and SQLite. All data stays on your device.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
