'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ListOrdered, CalendarDays, BookOpen, Settings, HelpCircle, Zap } from 'lucide-react';
import clsx from 'clsx';

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

  return (
    <div className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col h-full shrink-0">
      <div className="p-6 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
          <Zap size={18} />
        </div>
        <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Attendly</span>
      </div>

      <div className="px-6 py-4">
        <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold text-sm">
            AR
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-slate-900 dark:text-white">Alex Rivera</span>
            <span className="text-xs text-slate-500">Computer Science - Year 2</span>
          </div>
        </div>
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
        <Link href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200 transition-colors">
          <HelpCircle size={18} />
          Help center
        </Link>
        <Link href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200 transition-colors">
          <Settings size={18} />
          Settings
        </Link>
        <div className="mt-4 px-3 flex items-center gap-2 text-xs text-slate-500">
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          Your data is stored locally
        </div>
      </div>
    </div>
  );
}
