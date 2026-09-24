'use client';
import { Search, Moon, Bell } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();
  
  let pageName = 'Overview';
  if (pathname === '/history') pageName = 'History';
  if (pathname === '/timetable') pageName = 'Timetable';
  if (pathname === '/subjects') pageName = 'Subjects';

  return (
    <header className="flex items-center justify-between px-8 py-4 border-b border-slate-200 bg-white">
      <div className="text-sm font-medium text-slate-500">
        Workspace <span className="mx-2">&gt;</span> <span className="text-slate-900 font-bold">{pageName}</span>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Search subjects..." 
            className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64 transition-shadow"
          />
        </div>
        <button className="p-2.5 rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors">
          <Moon size={18} />
        </button>
        <button className="p-2.5 rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors relative">
          <Bell size={18} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm ml-2">
          AR
        </div>
      </div>
    </header>
  );
}
