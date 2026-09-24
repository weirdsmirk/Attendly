export const dynamic = 'force-dynamic';

import { getRecords, getSubjects } from '../actions';
import HistoryClient from '@/components/HistoryClient';

export default async function History() {
  const [records, subjects] = await Promise.all([getRecords(), getSubjects()]);

  return <HistoryClient initialRecords={records} subjects={subjects} />;
}
