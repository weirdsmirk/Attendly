export type RecordStatus = 'Attended' | 'Skipped' | 'Cancelled' | 'Holiday'

export type Subject = {
  id: string
  name: string
  code: string
  teacher: string | null
  credits: number
  min_attendance_req: number
  color: string
  initial_conducted: number
  initial_attended: number
  created_at: string
}

export type TimetableClass = {
  id: string
  subject_id: string
  /** 0 = Sunday … 6 = Saturday (JS Date#getDay convention). */
  day_of_week: number
  /** 24-hour HH:MM. */
  start_time: string
  end_time: string
  room: string | null
  type: string
}

export type AttendanceRecord = {
  id: string
  subject_id: string
  /** Local calendar day as YYYY-MM-DD. */
  date: string
  status: RecordStatus
  notes: string | null
  created_at: string
}

export type AttendanceRecordWithSubject = AttendanceRecord & { subject: Subject }

export type Snapshot = {
  version: 1
  exportedAt: string
  subjects: Subject[]
  timetable: TimetableClass[]
  records: AttendanceRecord[]
}

export type ImportResult = {
  subjects: number
  timetable: number
  records: number
}

export const RECORD_STATUSES: readonly RecordStatus[] = ['Attended', 'Skipped', 'Cancelled', 'Holiday']
export const CLASS_TYPES: readonly string[] = ['Lecture', 'Lab', 'Tutorial']
export const ALLOWED_COLORS: readonly string[] = [
  '#4F46E5',
  '#10B981',
  '#EF4444',
  '#F59E0B',
  '#8B5CF6',
  '#EC4899',
  '#06B6D4',
]
