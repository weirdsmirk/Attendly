export const dynamic = 'force-dynamic';

import { getTimetable, getSubjects } from '../actions';
import TimetableGrid from '@/components/TimetableGrid';

export default async function Timetable() {
  const [timetable, subjects] = await Promise.all([getTimetable(), getSubjects()]);

  return <TimetableGrid timetable={timetable} subjects={subjects} />;
}
