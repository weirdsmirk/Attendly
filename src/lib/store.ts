import { useSyncExternalStore } from 'react'
import { fromDateInput, isValidDateInput, isValidTimeInput, minutesOfDay, todayInput } from './attendance'
import {
  ALLOWED_COLORS,
  CLASS_TYPES,
  RECORD_STATUSES,
  type AttendanceRecord,
  type ImportResult,
  type RecordStatus,
  type Snapshot,
  type Subject,
  type TimetableClass,
} from './types'

const STORAGE = 'attendly.store.v1'
const STORAGE_CORRUPT = 'attendly.store.v1.corrupt'
const MAX_STORAGE_BYTES = 8 * 1024 * 1024
const DB_ENDPOINT = '/__data/attendly'

const MAX_NAME = 120
const MAX_CODE = 40
const MAX_TEACHER = 120
const MAX_ROOM = 60
const MAX_NOTES = 2000
const MAX_COUNTS = 1_000_000

type State = {
  subjects: Subject[]
  timetable: TimetableClass[]
  records: AttendanceRecord[]
}

const EMPTY: State = { subjects: [], timetable: [], records: [] }

/* ---------- primitives ---------- */

function newId(): string {
  const c = globalThis.crypto
  if (c && typeof c.randomUUID === 'function') return c.randomUUID()
  // Fallback for environments without randomUUID (older jsdom).
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

function text(value: unknown, max: number): string {
  if (value == null) return ''
  return String(value).trim().slice(0, max)
}

function intInRange(value: unknown, min: number, max: number, fallback: number, label: string): number {
  if (value === undefined || value === null || value === '') return fallback
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < min || n > max) {
    throw new Error(`${label} must be a whole number between ${min} and ${max}.`)
  }
  return n
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function isHexColor(value: unknown): value is string {
  return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value)
}

export const defaultColor = () => ALLOWED_COLORS[0]

/* ---------- validation (throws user-facing errors) ---------- */

export type SubjectInput = {
  name?: unknown
  code?: unknown
  teacher?: unknown
  credits?: unknown
  min_attendance_req?: unknown
  color?: unknown
  initial_conducted?: unknown
  initial_attended?: unknown
}

export function validateSubject(input: unknown): Omit<Subject, 'id' | 'created_at'> {
  if (!isPlainObject(input)) throw new Error('Invalid subject data.')

  const name = text(input.name, MAX_NAME)
  if (!name) throw new Error('Subject name is required.')

  const code = text(input.code, MAX_CODE)
  if (!code) throw new Error('Subject code is required.')

  const teacherRaw = text(input.teacher, MAX_TEACHER)
  const credits = intInRange(input.credits, 1, 10, 3, 'Credits')
  const minReq = intInRange(input.min_attendance_req, 1, 100, 75, 'Minimum attendance')
  const initialConducted = intInRange(input.initial_conducted, 0, MAX_COUNTS, 0, 'Initial conducted')
  const initialAttended = intInRange(input.initial_attended, 0, MAX_COUNTS, 0, 'Initial attended')
  if (initialAttended > initialConducted) {
    throw new Error('Initial attended cannot exceed initial conducted.')
  }
  const color = isHexColor(input.color) ? input.color : defaultColor()

  return {
    name,
    code,
    teacher: teacherRaw === '' ? null : teacherRaw,
    credits,
    min_attendance_req: minReq,
    color,
    initial_conducted: initialConducted,
    initial_attended: initialAttended,
  }
}

export type ClassInput = {
  subject_id?: unknown
  day_of_week?: unknown
  start_time?: unknown
  end_time?: unknown
  room?: unknown
  type?: unknown
}

export function validateClass(input: unknown, subjectIds: ReadonlySet<string>): Omit<TimetableClass, 'id'> {
  if (!isPlainObject(input)) throw new Error('Invalid class data.')

  const subjectId = text(input.subject_id, 64)
  if (!subjectId) throw new Error('Please select a subject.')
  if (!subjectIds.has(subjectId)) throw new Error('That subject no longer exists.')

  const day = intInRange(input.day_of_week, 0, 6, 1, 'Day')
  if (!isValidTimeInput(input.start_time)) throw new Error('Start time must be a valid time (HH:MM).')
  if (!isValidTimeInput(input.end_time)) throw new Error('End time must be a valid time (HH:MM).')
  if (minutesOfDay(input.end_time) <= minutesOfDay(input.start_time)) {
    throw new Error('End time must be after start time.')
  }

  const type = text(input.type, 20) || 'Lecture'
  if (!CLASS_TYPES.includes(type)) throw new Error('Class type must be Lecture, Lab, or Tutorial.')

  const room = text(input.room, MAX_ROOM)
  return {
    subject_id: subjectId,
    day_of_week: day,
    start_time: input.start_time,
    end_time: input.end_time,
    room: room === '' ? null : room,
    type,
  }
}

export type RecordInput = {
  subject_id?: unknown
  date?: unknown
  status?: unknown
  notes?: unknown
}

export function validateRecord(input: unknown, subjectIds: ReadonlySet<string>): Omit<AttendanceRecord, 'id' | 'created_at'> {
  if (!isPlainObject(input)) throw new Error('Invalid attendance data.')

  const subjectId = text(input.subject_id, 64)
  if (!subjectId) throw new Error('Please select a subject.')
  if (!subjectIds.has(subjectId)) throw new Error('That subject no longer exists.')

  if (!isValidDateInput(input.date)) throw new Error('Please choose a valid date.')
  if (!RECORD_STATUSES.includes(input.status as RecordStatus)) throw new Error('Please choose a valid status.')

  const notes = text(input.notes, MAX_NOTES)
  return {
    subject_id: subjectId,
    date: input.date,
    status: input.status as RecordStatus,
    notes: notes === '' ? null : notes,
  }
}

/* ---------- normalisation for untrusted stored/imported rows ---------- */

/**
 * Keep one record per (subject, day), newest wins. The old +1 button could be
 * clicked from several cards at once and every click inserted a row, so real
 * databases contain five "Attended" rows for one subject on one day.
 */
function dedupeRecords(records: AttendanceRecord[]): AttendanceRecord[] {
  const byKey = new Map<string, AttendanceRecord>()
  for (const r of records) {
    const key = `${r.subject_id}|${r.date}`
    const existing = byKey.get(key)
    if (!existing || existing.created_at < r.created_at) byKey.set(key, r)
  }
  return [...byKey.values()]
}

function normalizeSnapshot(raw: unknown): State {
  if (!isPlainObject(raw)) throw new Error('Not an Attendly backup — expected an object.')
  const subjectsRaw = raw.subjects
  const timetableRaw = raw.timetable
  const recordsRaw = raw.records
  if (!Array.isArray(subjectsRaw) || !Array.isArray(timetableRaw) || !Array.isArray(recordsRaw)) {
    throw new Error('Not an Attendly backup — subjects, timetable and records are required.')
  }
  if (subjectsRaw.length > 5000 || timetableRaw.length > 20000 || recordsRaw.length > 200000) {
    throw new Error('Backup is too large to import.')
  }

  const subjects: Subject[] = []
  const seenIds = new Set<string>()
  const seenCodes = new Set<string>()
  for (const row of subjectsRaw) {
    if (!isPlainObject(row)) throw new Error('Backup contains an invalid subject row.')
    const id = text(row.id, 64)
    if (!id || seenIds.has(id)) throw new Error('Backup contains a subject with a missing or duplicate id.')
    const clean = validateSubject(row)
    if (seenCodes.has(clean.code.toLowerCase())) {
      throw new Error(`Backup contains two subjects with the code ${clean.code}.`)
    }
    seenIds.add(id)
    seenCodes.add(clean.code.toLowerCase())
    subjects.push({
      id,
      ...clean,
      created_at: text(row.created_at, 40) || new Date().toISOString(),
    })
  }

  const subjectIds = new Set(subjects.map((s) => s.id))
  const timetable: TimetableClass[] = []
  const classIds = new Set<string>()
  for (const row of timetableRaw) {
    if (!isPlainObject(row)) throw new Error('Backup contains an invalid class row.')
    const id = text(row.id, 64)
    if (!id || classIds.has(id)) throw new Error('Backup contains a class with a missing or duplicate id.')
    timetable.push({ id, ...validateClass(row, subjectIds) })
    classIds.add(id)
  }

  const records: AttendanceRecord[] = []
  const recordIds = new Set<string>()
  for (const row of recordsRaw) {
    if (!isPlainObject(row)) throw new Error('Backup contains an invalid attendance row.')
    const id = text(row.id, 64)
    if (!id || recordIds.has(id)) throw new Error('Backup contains a record with a missing or duplicate id.')
    records.push({
      id,
      ...validateRecord(row, subjectIds),
      created_at: text(row.created_at, 40) || new Date().toISOString(),
    })
    recordIds.add(id)
  }

  return { subjects, timetable, records: dedupeRecords(records) }
}

/* ---------- persistence ---------- */

let localSnapshotPresent = false

function read(): State {
  try {
    const raw = localStorage.getItem(STORAGE)
    if (!raw) return EMPTY
    if (raw.length > MAX_STORAGE_BYTES) {
      localStorage.setItem(STORAGE_CORRUPT, raw.slice(0, 20000))
      localStorage.removeItem(STORAGE)
      console.warn('[store] local data exceeded the storage limit, reset safely')
      return EMPTY
    }
    const state = normalizeSnapshot(JSON.parse(raw))
    localSnapshotPresent = true
    return state
  } catch {
    try {
      const raw = localStorage.getItem(STORAGE) ?? ''
      localStorage.setItem(STORAGE_CORRUPT, raw.slice(0, 20000))
      localStorage.removeItem(STORAGE)
      localSnapshotPresent = false
      console.warn('[store] local data corrupted, backed up')
    } catch {
      /* nothing else to try */
    }
    return EMPTY
  }
}

const listeners = new Set<() => void>()
let cache = read()
let snapshot = cache

/* ---------- dev-only SQLite mirror ---------- */

let hydrating = true
let mutatedDuringHydration = false
let pendingMirror: string | null = null
let mirrorRunning = false

const hydratedListeners = new Set<() => void>()

export function subscribeHydrated(cb: () => void): () => void {
  if (!hydrating) {
    cb()
    return () => {}
  }
  hydratedListeners.add(cb)
  return () => hydratedListeners.delete(cb)
}

function mirrorToSqlite(state: State) {
  if (hydrating) {
    mutatedDuringHydration = true
    return
  }
  try {
    if (typeof fetch !== 'function') return
    pendingMirror = JSON.stringify(state)
    if (mirrorRunning) return
    mirrorRunning = true
    void (async () => {
      while (pendingMirror !== null) {
        const body = pendingMirror
        pendingMirror = null
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 8000)
        try {
          const res = await fetch(DB_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body,
            signal: controller.signal,
          })
          if (!res.ok) console.warn(`[store] SQLite mirror rejected snapshot (${res.status})`)
        } catch (e) {
          console.warn('[store] SQLite mirror unavailable', e)
        } finally {
          clearTimeout(timeout)
        }
      }
      mirrorRunning = false
    })()
  } catch {
    /* a synchronously-throwing fetch must never break UI updates */
  }
}

function commit(next: State) {
  cache = next
  snapshot = next
  // Notify first: the UI must reflect the write even if persistence throws.
  for (const fn of [...listeners]) {
    try {
      fn()
    } catch (e) {
      console.error('[store] subscriber failed', e)
    }
  }
  try {
    localStorage.setItem(STORAGE, JSON.stringify(next))
    localSnapshotPresent = true
  } catch (e) {
    console.warn('[store] local persistence failed', e)
  }
  mirrorToSqlite(next)
}

void (async () => {
  if (typeof fetch !== 'function') {
    hydrating = false
    return
  }
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 2500)
    const res = await fetch(DB_ENDPOINT, { signal: controller.signal }).catch(() => null)
    clearTimeout(timer)
    const contentType = res?.headers.get('content-type') ?? ''
    if (res && res.ok && contentType.includes('application/json')) {
      const fromDisk = normalizeSnapshot(await res.json().catch(() => null))
      const diskHasData = fromDisk.subjects.length > 0
      if (diskHasData && !localSnapshotPresent && !mutatedDuringHydration) {
        commit(fromDisk)
      } else if (localSnapshotPresent) {
        // Browser storage is authoritative; re-seed the mirror if it is empty.
        mirrorToSqlite(cache)
      }
    } else if (localSnapshotPresent || cache.subjects.length > 0) {
      mirrorToSqlite(cache)
    }
  } catch {
    /* static build or offline — stay on localStorage alone */
  } finally {
    hydrating = false
    for (const fn of [...hydratedListeners]) fn()
    hydratedListeners.clear()
    if (mutatedDuringHydration) mirrorToSqlite(cache)
  }
})()

/* ---------- cross-tab sync ---------- */

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key !== STORAGE) return
    if (e.newValue === null) {
      commit(EMPTY)
      return
    }
    try {
      const next = normalizeSnapshot(JSON.parse(e.newValue))
      if (JSON.stringify(next) !== JSON.stringify(cache)) commit(next)
    } catch {
      /* ignore malformed cross-tab payloads */
    }
  })
}

/* ---------- public API ---------- */

export function useStore() {
  const state = useSyncExternalStore(
    (fn) => {
      listeners.add(fn)
      return () => listeners.delete(fn)
    },
    () => snapshot,
    () => snapshot,
  )
  return {
    ...state,
    subjectIds: new Set(state.subjects.map((s) => s.id)),
  }
}

const subjectIdSet = (subjects: readonly Subject[]) => new Set(subjects.map((s) => s.id))

export const store = {
  /** Unique across current subjects; case-insensitive like a course code. */
  addSubject(input: SubjectInput): Subject {
    const clean = validateSubject(input)
    if (cache.subjects.some((s) => s.code.toLowerCase() === clean.code.toLowerCase())) {
      throw new Error(`The code ${clean.code} is already used by another subject.`)
    }
    const subject: Subject = { id: newId(), ...clean, created_at: new Date().toISOString() }
    commit({ ...cache, subjects: [...cache.subjects, subject] })
    return subject
  },

  updateSubject(id: string, input: SubjectInput): void {
    const index = cache.subjects.findIndex((s) => s.id === id)
    if (index === -1) throw new Error('That subject no longer exists.')
    const clean = validateSubject(input)
    if (
      cache.subjects.some(
        (s) => s.id !== id && s.code.toLowerCase() === clean.code.toLowerCase(),
      )
    ) {
      throw new Error(`The code ${clean.code} is already used by another subject.`)
    }
    const subjects = [...cache.subjects]
    subjects[index] = { ...subjects[index], ...clean }
    commit({ ...cache, subjects })
  },

  /** Subjects own their classes and records; both go with them. */
  deleteSubject(id: string): void {
    if (!cache.subjects.some((s) => s.id === id)) throw new Error('That subject no longer exists.')
    commit({
      subjects: cache.subjects.filter((s) => s.id !== id),
      timetable: cache.timetable.filter((t) => t.subject_id !== id),
      records: cache.records.filter((r) => r.subject_id !== id),
    })
  },

  addClass(input: ClassInput): TimetableClass {
    const clean = validateClass(input, subjectIdSet(cache.subjects))
    const cls: TimetableClass = { id: newId(), ...clean }
    commit({ ...cache, timetable: [...cache.timetable, cls] })
    return cls
  },

  deleteClass(id: string): void {
    if (!cache.timetable.some((t) => t.id === id)) throw new Error('That class no longer exists.')
    commit({ ...cache, timetable: cache.timetable.filter((t) => t.id !== id) })
  },

  addRecord(input: RecordInput): AttendanceRecord {
    const clean = validateRecord(input, subjectIdSet(cache.subjects))
    const record: AttendanceRecord = { id: newId(), ...clean, created_at: new Date().toISOString() }
    commit({ ...cache, records: [record, ...cache.records] })
    return record
  },

  updateRecord(id: string, input: RecordInput): void {
    const index = cache.records.findIndex((r) => r.id === id)
    if (index === -1) throw new Error('That record no longer exists.')
    const clean = validateRecord(input, subjectIdSet(cache.subjects))
    const records = [...cache.records]
    records[index] = { ...records[index], ...clean }
    commit({ ...cache, records: dedupeRecords(records.filter((r, i) => i !== index || r.id === id)) })
  },

  deleteRecord(id: string): void {
    if (!cache.records.some((r) => r.id === id)) throw new Error('That record no longer exists.')
    commit({ ...cache, records: cache.records.filter((r) => r.id !== id) })
  },

  /**
   * One tap marks today present for a subject — idempotent. Tapping again, or
   * tapping a second card for the same subject, updates the existing row
   * instead of inflating every statistic in the app.
   */
  markPresent(subjectId: string, date: string = todayInput()): void {
    if (!isValidDateInput(date)) throw new Error('Please choose a valid date.')
    const existing = cache.records.find((r) => r.subject_id === subjectId && r.date === date)
    if (existing) {
      if (existing.status === 'Attended') return
      const records = cache.records.map((r) => (r.id === existing.id ? { ...r, status: 'Attended' as const } : r))
      commit({ ...cache, records })
      return
    }
    store.addRecord({ subject_id: subjectId, date, status: 'Attended', notes: '' })
  },

  /** Marking state for a given day, so buttons can show "done" instead of "+". */
  isPresent(subjectId: string, date: string = todayInput()): boolean {
    return cache.records.some((r) => r.subject_id === subjectId && r.date === date && r.status === 'Attended')
  },

  exportSnapshot(): Snapshot {
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      subjects: cache.subjects,
      timetable: cache.timetable,
      records: cache.records,
    }
  },

  /**
   * Validates the whole payload *before* touching state, so a corrupt file can
   * never leave a half-restored database: either every row is good and the
   * store is replaced, or the old data is left exactly as it was.
   */
  importSnapshot(text_: string): ImportResult {
    if (text_.length > 20 * 1024 * 1024) throw new Error('File too large — max 20 MB.')
    let parsed: unknown
    try {
      parsed = JSON.parse(text_)
    } catch {
      throw new Error('Not an Attendly backup — the file could not be read.')
    }
    const next = normalizeSnapshot(parsed)
    commit(next)
    return {
      subjects: next.subjects.length,
      timetable: next.timetable.length,
      records: next.records.length,
    }
  },
}

/** Test seam: drops the in-memory cache so each spec starts clean. */
export function __resetStoreForTests(state: State = EMPTY) {
  cache = state
  snapshot = state
  localSnapshotPresent = false
  for (const fn of [...listeners]) fn()
}

export { fromDateInput }
