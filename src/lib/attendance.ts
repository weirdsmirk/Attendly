import type { AttendanceRecord, Subject } from './types'

/* ---------- date + time helpers ---------- */

/** Timestamp → yyyy-mm-dd in *local* time (toISOString would shift the day). */
export function toDateInput(ts: number): string {
  const d = new Date(ts)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export const todayInput = (now: number = Date.now()) => toDateInput(now)

/**
 * Strict yyyy-mm-dd → timestamp at local midday.
 * Rejects malformed strings *and* rolled-over dates (Feb 30, 2026-02-31) by
 * checking that the parsed date round-trips to the exact same components.
 */
export function fromDateInput(value: unknown): number | null {
  if (typeof value !== 'string') return null
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!m) return null
  const y = Number(m[1])
  const mo = Number(m[2])
  const d = Number(m[3])
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null
  const ts = new Date(y, mo - 1, d, 12).getTime()
  if (!Number.isFinite(ts)) return null
  const check = new Date(ts)
  if (check.getFullYear() !== y || check.getMonth() !== mo - 1 || check.getDate() !== d) return null
  return ts
}

export function isValidDateInput(value: unknown): value is string {
  return fromDateInput(value) !== null
}

/** Strict HH:MM, 24-hour. Rejects 99:99, 24:00, 9:00, and non-strings. */
export function isValidTimeInput(value: unknown): value is string {
  if (typeof value !== 'string') return false
  const m = /^(\d{2}):(\d{2})$/.exec(value)
  if (!m) return false
  return Number(m[1]) <= 23 && Number(m[2]) <= 59
}

export const minutesOfDay = (hhmm: string): number => {
  const m = /^(\d{2}):(\d{2})$/.exec(hhmm)
  return m ? Number(m[1]) * 60 + Number(m[2]) : Number.NaN
}

/* ---------- per-subject attendance ---------- */

export type SubjectSummary = {
  conducted: number
  attended: number
  missed: number
  /** Display value: 0–100. A subject with no classes yet reports 100. */
  percentage: number
  /** Compared without display rounding, so 2/3 never passes a 67% bar. */
  onTrack: boolean
  /** Additional classes that can be missed while still meeting the requirement. */
  safeSkips: number
  /** Consecutive attendances needed to climb back to the requirement. */
  toRecover: number
}

/**
 * One definition of a subject's numbers, shared by the dashboard, subject grid,
 * details modal and notifications — the four copies this replaced disagreed on
 * rounding and could each drift again.
 *
 * All comparisons use integer arithmetic: `68 attended / 99 conducted` must
 * report 1 safe skip, which floating point division rounded down to 0.
 */
export function summarizeSubject(subject: Subject, records: readonly AttendanceRecord[]): SubjectSummary {
  let conducted = subject.initial_conducted
  let attended = subject.initial_attended
  for (const r of records) {
    if (r.subject_id !== subject.id) continue
    if (r.status === 'Attended') {
      conducted += 1
      attended += 1
    } else if (r.status === 'Skipped') {
      conducted += 1
    }
  }

  const req = Math.min(100, Math.max(1, Math.trunc(subject.min_attendance_req)))
  if (conducted <= 0) {
    return { conducted: 0, attended: 0, missed: 0, percentage: 100, onTrack: true, safeSkips: 0, toRecover: 0 }
  }

  const missed = conducted - attended
  const percentage = Math.round((attended * 100) / conducted)
  const onTrack = attended * 100 >= conducted * req
  const safeSkips = Math.max(0, Math.floor((attended * 100) / req) - conducted)
  const toRecover =
    onTrack || req >= 100 ? 0 : Math.ceil((req * conducted - attended * 100) / (100 - req))

  return { conducted, attended, missed, percentage, onTrack, safeSkips, toRecover }
}

/* ---------- streaks ---------- */

export type Streaks = { current: number; best: number }

/**
 * Consecutive days whose attendance contains at least one class and no skips.
 * `now` is injectable so the behaviour is deterministic under test.
 */
export function computeStreaks(records: readonly AttendanceRecord[], now: number = Date.now()): Streaks {
  const byDate = new Map<string, { attended: number; skipped: number }>()
  for (const r of records) {
    if (r.status !== 'Attended' && r.status !== 'Skipped') continue
    const entry = byDate.get(r.date) ?? { attended: 0, skipped: 0 }
    if (r.status === 'Attended') entry.attended += 1
    else entry.skipped += 1
    byDate.set(r.date, entry)
  }
  const isGoodDay = (d: string) => {
    const e = byDate.get(d)
    return !!e && e.attended > 0 && e.skipped === 0
  }

  let best = 0
  let run = 0
  let prev: string | null = null
  for (const d of [...byDate.keys()].sort()) {
    if (prev) {
      const gap = Math.round(
        (new Date(`${d}T00:00:00`).getTime() - new Date(`${prev}T00:00:00`).getTime()) / 86_400_000,
      )
      if (gap !== 1) run = 0
    }
    run = isGoodDay(d) ? run + 1 : 0
    best = Math.max(best, run)
    prev = d
  }

  // The current streak may end today, or yesterday when today has no classes yet.
  const cursor = new Date(now)
  if (!byDate.has(toDateInput(cursor.getTime()))) cursor.setDate(cursor.getDate() - 1)
  let current = 0
  // No cap needed: the walk ends as soon as a day has no good record, so it can
  // never exceed the number of recorded days.
  for (;;) {
    const key = toDateInput(cursor.getTime())
    if (!byDate.has(key) || !isGoodDay(key)) break
    current += 1
    cursor.setDate(cursor.getDate() - 1)
  }

  return { current, best }
}

/* ---------- chart series ---------- */

export type ChartPoint = { name: string; value: number }

/**
 * Cumulative attendance % across the trailing `days`, bucketed into six points.
 * Returns `[]` when nothing has been recorded, so the chart can show its empty
 * state instead of drawing a flat 100% line through no data.
 */
export function attendanceTrend(records: readonly AttendanceRecord[], now: number = Date.now(), buckets = 6): ChartPoint[] {
  const counted = records.filter((r) => r.status === 'Attended' || r.status === 'Skipped')
  if (counted.length === 0) return []

  const cutoff = toDateInput(now - (buckets - 1) * 5 * 86_400_000)
  const inWindow = counted.filter((r) => r.date >= cutoff)
  const points: ChartPoint[] = []
  for (let i = buckets - 1; i >= 0; i--) {
    const day = new Date(now - i * 5 * 86_400_000)
    const key = toDateInput(day.getTime())
    const upTo = counted.filter((r) => r.date <= key)
    if (upTo.length === 0) continue
    const attended = upTo.filter((r) => r.status === 'Attended').length
    points.push({ name: key.slice(5).replace('-', '/'), value: Math.round((attended / upTo.length) * 100) })
  }
  if (points.length === 0) {
    const attended = inWindow.filter((r) => r.status === 'Attended').length
    points.push({
      name: toDateInput(now).slice(5).replace('-', '/'),
      value: Math.round((attended / Math.max(1, inWindow.length)) * 100),
    })
  }
  return points
}

/* ---------- whole-dataset totals ---------- */

export type Totals = { conducted: number; attended: number; missed: number; percentage: number }

export function summarizeAll(subjects: readonly Subject[], records: readonly AttendanceRecord[]): Totals {
  let conducted = 0
  let attended = 0
  for (const s of subjects) {
    const sum = summarizeSubject(s, records)
    conducted += sum.conducted
    attended += sum.attended
  }
  const missed = Math.max(0, conducted - attended)
  const percentage = conducted === 0 ? 100 : Math.round((attended * 100) / conducted)
  return { conducted, attended, missed, percentage }
}

/** Today's classes from the timetable, using the 0=Sunday convention. */
export function todaysClasses<T extends { day_of_week: number; start_time: string }>(
  timetable: readonly T[],
  now: number = Date.now(),
): T[] {
  const today = new Date(now).getDay()
  return timetable
    .filter((t) => t.day_of_week === today)
    .sort((a, b) => a.start_time.localeCompare(b.start_time))
}
