
import { getRecords, deleteRecord } from '../actions';
import { format, parseISO } from 'date-fns';
import { Edit2, Trash2, Download } from 'lucide-react';

export default async function History() {
  const records = await getRecords();

  return (
    <>
      <div className="mb-8 flex items-end justify-between">
        <div>
          <div className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-2">EVERY CLASS, ACCOUNTED FOR</div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Attendance log</h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm">Correct mistakes without losing the full history.</p>
        </div>
        <button className="btn btn-secondary gap-2 border border-slate-200 dark:border-slate-800">
          <Download size={16} /> Export backup
        </button>
      </div>

      <div className="card w-full">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Recent records</h2>
            <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-semibold px-2 py-0.5 rounded-full">{records.length}</span>
          </div>
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            <button className="px-3 py-1 text-xs font-medium bg-white dark:bg-slate-900 shadow-sm rounded-md text-slate-900 dark:text-white">All</button>
            <button className="px-3 py-1 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">Attended</button>
            <button className="px-3 py-1 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">Missed</button>
          </div>
        </div>

        <div className="space-y-1">
          {records.length === 0 && (
            <div className="text-center text-slate-500 py-10">No attendance records found.</div>
          )}
          {records.map(record => {
            const dateStr = format(parseISO(record.date), 'dd MMM');
            const [day, month] = dateStr.split(' ');
            
            return (
              <div key={record.id} className="flex items-center justify-between py-3 px-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors group border-b border-slate-50 dark:border-slate-800/50 last:border-0">
                <div className="flex items-center gap-6">
                  <div className="flex flex-col items-center justify-center w-10">
                    <span className="text-lg font-bold text-slate-900 dark:text-white leading-none">{day}</span>
                    <span className="text-xs text-slate-500">{month}</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full" style={{backgroundColor: record.subject.color}}></span>
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">{record.subject.name}</div>
                      <div className="text-xs text-slate-500">{record.subject.code} &middot; {record.date}</div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-8">
                  {record.status === 'Attended' ? (
                    <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-500 text-sm font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Attended
                    </div>
                  ) : record.status === 'Skipped' ? (
                    <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-500 text-sm font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                      Skipped
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 text-sm font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                      {record.status}
                    </div>
                  )}
                  
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20">
                      <Edit2 size={16} />
                    </button>
                    <form action={async () => {
                      'use server';
                      await deleteRecord(record.id);
                    }}>
                      <button className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20">
                        <Trash2 size={16} />
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
