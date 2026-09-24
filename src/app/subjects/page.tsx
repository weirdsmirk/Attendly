
import { getSubjects, getRecords } from '../actions';
import { Plus } from 'lucide-react';
import SubjectGrid from '@/components/SubjectGrid';

export default async function Subjects() {
  const subjects = await getSubjects();
  const records = await getRecords();

  return (
    <>
      <SubjectGrid subjects={subjects} records={records} />
    </>
  );
}
