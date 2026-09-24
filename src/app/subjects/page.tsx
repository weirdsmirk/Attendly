export const dynamic = 'force-dynamic';

import { getSubjects, getRecords } from '../actions';
import SubjectGrid from '@/components/SubjectGrid';

export default async function Subjects() {
  const [subjects, records] = await Promise.all([getSubjects(), getRecords()]);

  return <SubjectGrid subjects={subjects} records={records} />;
}
