
import { getSubjects, getRecords } from '../actions';
import { Plus } from 'lucide-react';
import SubjectGrid from '@/components/SubjectGrid';

export default async function Subjects() {
  const subjects = await getSubjects();
  const records = await getRecords();

  return (
    <>
      <div className="mb-8 flex items-end justify-between">
        <div>
          <div className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-2">MANAGE YOUR COURSES</div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Subjects</h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm">Set individual attendance requirements and keep every class accountable.</p>
        </div>
        <button className="btn btn-primary gap-2">
          <Plus size={16} /> Add subject
        </button>
      </div>

      <SubjectGrid subjects={subjects} records={records} />
    </>
  );
}
