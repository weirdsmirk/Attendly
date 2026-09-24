'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ListOrdered, CalendarDays, BookOpen, Settings, HelpCircle, Zap, X, Download, Upload } from 'lucide-react';
import clsx from 'clsx';
import { useState } from 'react';

const navItems = [
  { name: 'Overview', href: '/', icon: LayoutDashboard },
  { name: 'Attendance log', href: '/history', icon: ListOrdered },
  { name: 'Timetable', href: '/timetable', icon: CalendarDays },
];

const manageItems = [
  { name: 'Subjects', href: '/subjects', icon: BookOpen },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [showSettings, setShowSettings] = useState(false);

  return (
    <>
      <div className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col h-full shrink-0">
        <div className="p-6 flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
            <Zap size={18} />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Attendly</span>
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
          <button className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200 transition-colors w-full cursor-pointer">
            <HelpCircle size={18} />
            Help center
          </button>
          <button 
            onClick={() => setShowSettings(true)}
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

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={() => setShowSettings(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md border border-slate-200 dark:border-slate-800 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Settings</h2>
              <button onClick={() => setShowSettings(false)} className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Data Management</h3>
                <div className="space-y-2">
                  <button className="flex items-center gap-3 w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer">
                    <Download size={18} className="text-indigo-600 dark:text-indigo-400" />
                    <div>
                      <div className="text-sm font-medium text-slate-900 dark:text-white">Export Data</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">Download your attendance database</div>
                    </div>
                  </button>
                  <button className="flex items-center gap-3 w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer">
                    <Upload size={18} className="text-indigo-600 dark:text-indigo-400" />
                    <div>
                      <div className="text-sm font-medium text-slate-900 dark:text-white">Import Data</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">Restore from a backup file</div>
                    </div>
                  </button>
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
