import { describe, expect, it } from 'vitest'
import {
  attendanceTrend,
  computeStreaks,
  fromDateInput,
  isValidDateInput,
  isValidTimeInput,
  summarizeAll,
  summarizeSubject,
  todaysClasses,
} from './attendance'
import type { AttendanceRecord, Subject } from './types'

const subject = (over: Partial<Subject> = {}): Subject => ({
  id: 's1',
  name: 'Database Systems',
  code: 'CS302',
  teacher: 'Dr. Priya',
  credits: 4,
  min_attendance_req: 75,
  color: '#4F46E5',
  initial_conducted: 0,
  initial_attended: 0,
  created_at: '2026-01-01T00:00:00.000Z',
  ...over,
})

const record = (over: Partial<AttendanceRecord> = {}): AttendanceRecord => ({
  id: 'r1',
  subject_id: 's1',
  date: '2026-09-20',
  status: 'Attended',
  notes: null,
  created_at: '2026-09-20T10:00:00.000Z',
  ...over,
})

describe('date validation', () => {
  it('accepts real calendar days', () => {
    expect(isValidDateInput('2026-09-24')).toBe(true)
    expect(isValidDateInput('2024-02-29')).toBe(true)
  })

  it('rejects rolled-over and malformed dates', () => {
    expect(isValidDateInput('2026-02-31')).toBe(false)
    expect(isValidDateInput('2026-13-01')).toBe(false)
    expect(isValidDateInput('2025-02-29')).toBe(false)
    expect(isValidDateInput('24-09-2026')).toBe(false)
    expect(isValidDateInput('')).toBe(false)
    expect(isValidDateInput(null)).toBe(false)
    expect(isValidDateInput(20260924)).toBe(false)
  })

  it('round-trips a parsed date to the same local day', () => {
    const ts = fromDateInput('2026-09-24')
    expect(ts).not.toBeNull()
    const d = new Date(ts!)
    expect(d.getFullYear()).toBe(2026)
    expect(d.getMonth()).toBe(8)
    expect(d.getDate()).toBe(24)
  })
})

describe('time validation', () => {
  it('accepts 24-hour HH:MM', () => {
    expect(isValidTimeInput('00:00')).toBe(true)
    expect(isValidTimeInput('23:59')).toBe(true)
    expect(isValidTimeInput('09:30')).toBe(true)
  })

  it('rejects impossible clock values', () => {
    expect(isValidTimeInput('24:00')).toBe(false)
    expect(isValidTimeInput('99:99')).toBe(false)
    expect(isValidTimeInput('09:60')).toBe(false)
    expect(isValidTimeInput('9:00')).toBe(false)
    expect(isValidTimeInput('0900')).toBe(false)
    expect(isValidTimeInput(900)).toBe(false)
  })
})

describe('summarizeSubject', () => {
  it('counts conducted, attended and missed', () => {
    const records = [record(), record({ id: 'r2', status: 'Skipped' }), record({ id: 'r3', status: 'Cancelled' })]
    const s = summarizeSubject(subject(), records)
    expect(s.conducted).toBe(2)
    expect(s.attended).toBe(1)
    expect(s.missed).toBe(1)
    expect(s.percentage).toBe(50)
  })

  it('folds in initial counts', () => {
    const s = summarizeSubject(subject({ initial_conducted: 10, initial_attended: 8 }), [])
    expect(s.conducted).toBe(10)
    expect(s.attended).toBe(8)
    expect(s.percentage).toBe(80)
  })

  it('treats a subject with no classes as complete', () => {
    const s = summarizeSubject(subject(), [])
    expect(s.percentage).toBe(100)
    expect(s.onTrack).toBe(true)
  })

  it('uses integer math for safe skips (68/99 leaves 1 skip)', () => {
    const records = Array.from({ length: 68 }, (_, i) => record({ id: `a${i}` }))
    const records2 = [...records, ...Array.from({ length: 31 }, (_, i) => record({ id: `b${i}`, status: 'Skipped' }))]
    const s = summarizeSubject(subject({ min_attendance_req: 68 }), records2)
    expect(s.conducted).toBe(99)
    expect(s.percentage).toBe(69)
    expect(s.safeSkips).toBe(1)
  })

  it('does not pass a requirement on rounded display alone (2/3 at 67%)', () => {
    const records = [record({ id: 'a' }), record({ id: 'b' }), record({ id: 'c', status: 'Skipped' })]
    const s = summarizeSubject(subject({ min_attendance_req: 67 }), records)
    expect(s.percentage).toBe(67)
    expect(s.onTrack).toBe(false)
    expect(s.toRecover).toBe(1)
  })

  it('computes recovery distance', () => {
    const records = Array.from({ length: 5 }, (_, i) => record({ id: `a${i}` }))
    records.push(...Array.from({ length: 3 }, (_, i) => record({ id: `s${i}`, status: 'Skipped' })))
    const s = summarizeSubject(subject({ min_attendance_req: 75 }), records)
    expect(s.onTrack).toBe(false)
    expect(s.toRecover).toBe(4)
  })

  it('never divides by zero at a 100% requirement', () => {
    const s = summarizeSubject(subject({ min_attendance_req: 100 }), [record({ status: 'Skipped' })])
    expect(Number.isFinite(s.safeSkips)).toBe(true)
    expect(Number.isFinite(s.toRecover)).toBe(true)
    expect(s.onTrack).toBe(false)
  })
})

describe('summarizeAll', () => {
  it('aggregates across subjects', () => {
    const subjects = [subject(), subject({ id: 's2', name: 'Math', initial_conducted: 4, initial_attended: 3 })]
    const totals = summarizeAll(subjects, [record(), record({ id: 'r2', status: 'Skipped' })])
    expect(totals.conducted).toBe(6)
    expect(totals.attended).toBe(4)
    expect(totals.missed).toBe(2)
    expect(totals.percentage).toBe(67)
  })

  it('reports 100% with an empty app rather than dividing by zero', () => {
    expect(summarizeAll([], [])).toEqual({ conducted: 0, attended: 0, missed: 0, percentage: 100 })
  })
})

describe('computeStreaks', () => {
  const day = (offset: number) => {
    const d = new Date(2026, 8, 24)
    d.setDate(d.getDate() - offset)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }
  const now = new Date(2026, 8, 24, 12).getTime()

  it('counts a streak ending today', () => {
    const records = [record({ id: '1', date: day(0) }), record({ id: '2', date: day(1) }), record({ id: '3', date: day(2) })]
    expect(computeStreaks(records, now)).toEqual({ current: 3, best: 3 })
  })

  it('allows the streak to end yesterday when today has no classes', () => {
    const records = [record({ id: '1', date: day(1) }), record({ id: '2', date: day(2) })]
    expect(computeStreaks(records, now).current).toBe(2)
  })

  it('breaks the streak on a day with a skip', () => {
    const records = [
      record({ id: '1', date: day(0) }),
      record({ id: '2', date: day(1), status: 'Skipped' }),
      record({ id: '3', date: day(2) }),
    ]
    expect(computeStreaks(records, now).current).toBe(1)
  })

  it('breaks the streak on a gap', () => {
    const records = [record({ id: '1', date: day(0) }), record({ id: '2', date: day(2) })]
    expect(computeStreaks(records, now).current).toBe(1)
  })

  it('ignores cancelled and holiday rows', () => {
    const records = [
      record({ id: '1', date: day(0), status: 'Cancelled' }),
      record({ id: '2', date: day(1) }),
    ]
    expect(computeStreaks(records, now).current).toBe(1)
  })

  it('handles unsorted input and tracks the best streak anywhere', () => {
    const records = [
      record({ id: '3', date: day(2) }),
      record({ id: '1', date: day(0) }),
      record({ id: '4', date: day(5) }),
      record({ id: '5', date: day(6) }),
      record({ id: '6', date: day(7) }),
    ]
    const result = computeStreaks(records, now)
    expect(result.best).toBe(3)
    expect(result.current).toBe(1)
  })

  it('returns zero for no records', () => {
    expect(computeStreaks([], now)).toEqual({ current: 0, best: 0 })
  })
})

describe('attendanceTrend', () => {
  const now = new Date(2026, 8, 24, 12).getTime()

  it('returns an empty series when nothing is recorded, so the chart can show its empty state', () => {
    expect(attendanceTrend([], now)).toEqual([])
    expect(attendanceTrend([record({ status: 'Holiday' })], now)).toEqual([])
  })

  it('builds cumulative points that never exceed 100', () => {
    const points = attendanceTrend([record(), record({ id: 'r2' })], now)
    expect(points.length).toBeGreaterThan(0)
    for (const p of points) {
      expect(p.value).toBeGreaterThanOrEqual(0)
      expect(p.value).toBeLessThanOrEqual(100)
    }
  })
})

describe('todaysClasses', () => {
  it('returns only the current weekday, sorted by start time', () => {
    const today = new Date().getDay()
    const timetable = [
      { id: 'b', day_of_week: today, start_time: '11:00' },
      { id: 'a', day_of_week: today, start_time: '09:00' },
      { id: 'c', day_of_week: (today + 1) % 7, start_time: '09:00' },
    ]
    expect(todaysClasses(timetable).map((t) => t.id)).toEqual(['a', 'b'])
  })
})
