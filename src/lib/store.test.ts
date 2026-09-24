import { beforeEach, describe, expect, it } from 'vitest'
import { store, __resetStoreForTests, validateClass, validateRecord, validateSubject } from './store'
import { todayInput } from './attendance'

function seedSubject(over: Record<string, unknown> = {}) {
  return store.addSubject({ name: 'Database Systems', code: 'CS302', teacher: 'Dr. Priya', ...over } as never)
}

const emptyIds = new Set<string>()

beforeEach(() => {
  __resetStoreForTests()
})

describe('subject validation', () => {
  it('requires a name and a code', () => {
    expect(() => validateSubject({ name: '  ', code: 'CS1' })).toThrow(/name/i)
    expect(() => validateSubject({ name: 'Networks', code: '   ' })).toThrow(/code/i)
  })

  it('rejects non-numeric and out-of-range numbers instead of coercing them', () => {
    expect(() => validateSubject({ name: 'A', code: 'A1', credits: 'abc' })).toThrow(/credits/i)
    expect(() => validateSubject({ name: 'A', code: 'A1', credits: 99 })).toThrow(/credits/i)
    expect(() => validateSubject({ name: 'A', code: 'A1', credits: 1.5 })).toThrow(/credits/i)
    expect(() => validateSubject({ name: 'A', code: 'A1', min_attendance_req: 0 })).toThrow(/minimum attendance/i)
    expect(() => validateSubject({ name: 'A', code: 'A1', min_attendance_req: 101 })).toThrow(/minimum attendance/i)
  })

  it('rejects attended greater than conducted', () => {
    expect(() =>
      validateSubject({ name: 'A', code: 'A1', initial_conducted: 5, initial_attended: 9 }),
    ).toThrow(/cannot exceed/i)
  })

  it('trims, defaults the colour and caps the teacher length', () => {
    const clean = validateSubject({ name: '  Networks  ', code: ' CS304 ', teacher: 'x'.repeat(500) })
    expect(clean.name).toBe('Networks')
    expect(clean.code).toBe('CS304')
    expect(clean.teacher).toHaveLength(120)
    expect(clean.color).toMatch(/^#[0-9A-F]{6}$/i)
  })

  it('rejects a non-object payload', () => {
    expect(() => validateSubject(null as never)).toThrow(/invalid subject/i)
  })
})

describe('subject mutations', () => {
  it('adds and updates a subject', () => {
    const created = seedSubject()
    store.updateSubject(created.id, { name: 'DB Systems II', code: 'CS302', credits: 5 })
    const snapshot = store.exportSnapshot()
    expect(snapshot.subjects).toHaveLength(1)
    expect(snapshot.subjects[0].name).toBe('DB Systems II')
    expect(snapshot.subjects[0].credits).toBe(5)
  })

  it('refuses a duplicate subject code, case-insensitively', () => {
    seedSubject({ code: 'CS302' })
    expect(() => seedSubject({ code: 'cs302' })).toThrow(/already used/i)
  })

  it('lets a subject keep its own code when edited', () => {
    const created = seedSubject()
    expect(() => store.updateSubject(created.id, { name: 'Renamed', code: 'CS302' })).not.toThrow()
  })

  it('deletes a subject together with its classes and records', () => {
    const created = seedSubject()
    store.addClass({ subject_id: created.id, day_of_week: 1, start_time: '09:00', end_time: '10:00' })
    store.addRecord({ subject_id: created.id, date: '2026-09-20', status: 'Attended' })
    store.deleteSubject(created.id)
    const snapshot = store.exportSnapshot()
    expect(snapshot.subjects).toHaveLength(0)
    expect(snapshot.timetable).toHaveLength(0)
    expect(snapshot.records).toHaveLength(0)
  })

  it('reports a missing subject instead of silently doing nothing', () => {
    expect(() => store.deleteSubject('nope')).toThrow(/no longer exists/i)
    expect(() => store.updateSubject('nope', { name: 'A', code: 'A1' })).toThrow(/no longer exists/i)
  })
})

describe('class validation', () => {
  it('requires an existing subject', () => {
    expect(() => validateClass({ subject_id: 'ghost', day_of_week: 1, start_time: '09:00', end_time: '10:00' }, emptyIds)).toThrow(
      /no longer exists/i,
    )
  })

  it('requires the end time to be after the start time', () => {
    const ids = new Set(['s1'])
    expect(() => validateClass({ subject_id: 's1', day_of_week: 1, start_time: '10:00', end_time: '10:00' }, ids)).toThrow(
      /after start/i,
    )
    expect(() => validateClass({ subject_id: 's1', day_of_week: 1, start_time: '11:00', end_time: '10:00' }, ids)).toThrow(
      /after start/i,
    )
  })

  it('rejects impossible clock values and days', () => {
    const ids = new Set(['s1'])
    expect(() => validateClass({ subject_id: 's1', day_of_week: 1, start_time: '99:99', end_time: '10:00' }, ids)).toThrow(
      /valid time/i,
    )
    expect(() => validateClass({ subject_id: 's1', day_of_week: 9, start_time: '09:00', end_time: '10:00' }, ids)).toThrow(
      /day/i,
    )
  })

  it('accepts a valid class and defaults the room', () => {
    const subject = seedSubject()
    const cls = store.addClass({ subject_id: subject.id, day_of_week: 3, start_time: '09:00', end_time: '10:30' })
    expect(cls.room).toBeNull()
    expect(cls.type).toBe('Lecture')
    expect(store.exportSnapshot().timetable).toHaveLength(1)
  })
})

describe('record validation and idempotency', () => {
  it('rejects an impossible date and an unknown status', () => {
    const ids = new Set(['s1'])
    expect(() => validateRecord({ subject_id: 's1', date: '2026-02-31', status: 'Attended' }, ids)).toThrow(
      /valid date/i,
    )
    expect(() => validateRecord({ subject_id: 's1', date: '2026-09-20', status: 'Maybe' }, ids)).toThrow(
      /valid status/i,
    )
  })

  it('keeps one record per subject per day however many times you tap', () => {
    const subject = seedSubject()
    const today = todayInput()
    store.markPresent(subject.id, today)
    store.markPresent(subject.id, today)
    store.markPresent(subject.id, today)
    const records = store.exportSnapshot().records
    expect(records).toHaveLength(1)
    expect(records[0].status).toBe('Attended')
  })

  it('promotes an existing skip to attended instead of duplicating it', () => {
    const subject = seedSubject()
    const today = todayInput()
    store.addRecord({ subject_id: subject.id, date: today, status: 'Skipped' })
    store.markPresent(subject.id, today)
    const records = store.exportSnapshot().records
    expect(records).toHaveLength(1)
    expect(records[0].status).toBe('Attended')
  })

  it('allows a record on another subject the same day', () => {
    const a = seedSubject()
    const b = seedSubject({ code: 'CS316', name: 'HCI' })
    store.markPresent(a.id, '2026-09-20')
    store.markPresent(b.id, '2026-09-20')
    expect(store.exportSnapshot().records).toHaveLength(2)
  })

  it('edits and deletes records', () => {
    const subject = seedSubject()
    const created = store.addRecord({ subject_id: subject.id, date: '2026-09-20', status: 'Attended' })
    store.updateRecord(created.id, { subject_id: subject.id, date: '2026-09-21', status: 'Skipped' })
    const updated = store.exportSnapshot().records[0]
    expect(updated.date).toBe('2026-09-21')
    expect(updated.status).toBe('Skipped')
    store.deleteRecord(created.id)
    expect(store.exportSnapshot().records).toHaveLength(0)
  })

  it('collapses duplicate rows for one subject and day on import', () => {
    const subject = seedSubject()
    const snapshot = store.exportSnapshot()
    const dupe = {
      id: 'r-dup',
      subject_id: subject.id,
      date: '2026-09-20',
      status: 'Attended',
      notes: null,
      created_at: '2026-09-20T12:00:00.000Z',
    }
    const first = { ...dupe, id: 'r-first', created_at: '2026-09-20T09:00:00.000Z' }
    const result = store.importSnapshot(JSON.stringify({ ...snapshot, records: [dupe, first] }))
    expect(result.records).toBe(1)
  })
})

describe('import safety', () => {
  const valid = () => {
    const subject = seedSubject()
    store.addClass({ subject_id: subject.id, day_of_week: 1, start_time: '09:00', end_time: '10:00' })
    store.addRecord({ subject_id: subject.id, date: '2026-09-20', status: 'Attended' })
    return store.exportSnapshot()
  }

  it('round-trips a valid backup losslessly', () => {
    const before = valid()
    const json = JSON.stringify(before)
    const result = store.importSnapshot(json)
    expect(result).toEqual({ subjects: 1, timetable: 1, records: 1 })
    expect(store.exportSnapshot().subjects[0].name).toBe(before.subjects[0].name)
  })

  it('refuses an empty object instead of wiping the database', () => {
    const before = valid()
    expect(() => store.importSnapshot('{}')).toThrow(/required/i)
    expect(store.exportSnapshot().subjects).toHaveLength(1)
    expect(store.exportSnapshot().records).toHaveLength(before.records.length)
  })

  it('refuses a payload missing any table', () => {
    valid()
    expect(() => store.importSnapshot('{"subjects":[]}')).toThrow(/required/i)
    expect(() => store.importSnapshot('{"subjects":[],"timetable":[]}')).toThrow(/required/i)
    expect(() => store.importSnapshot('[]')).toThrow(/expected an object/i)
    expect(store.exportSnapshot().subjects).toHaveLength(1)
  })

  it('leaves data untouched when any row is invalid', () => {
    const before = valid()
    const poisoned = {
      ...before,
      subjects: [...before.subjects, { id: 'bad', name: '', code: '', created_at: '' }],
    }
    expect(() => store.importSnapshot(JSON.stringify(poisoned))).toThrow()
    expect(store.exportSnapshot().subjects).toHaveLength(1)
    expect(store.exportSnapshot().subjects[0].name).toBe(before.subjects[0].name)
  })

  it('rejects a record pointing at a subject that is not in the backup', () => {
    const before = valid()
    const orphan = {
      ...before,
      records: [{ id: 'x', subject_id: 'ghost', date: '2026-09-20', status: 'Attended', notes: null }],
    }
    expect(() => store.importSnapshot(JSON.stringify(orphan))).toThrow(/no longer exists/i)
    expect(store.exportSnapshot().records).toHaveLength(1)
  })

  it('rejects duplicate ids and duplicate codes', () => {
    const before = valid()
    expect(() =>
      store.importSnapshot(JSON.stringify({ ...before, subjects: [before.subjects[0], before.subjects[0]] })),
    ).toThrow(/duplicate id/i)
    const twin = { ...before.subjects[0], id: 'other' }
    expect(() => store.importSnapshot(JSON.stringify({ ...before, subjects: [before.subjects[0], twin] }))).toThrow(
      /two subjects with the code/i,
    )
  })

  it('rejects text that is not JSON at all', () => {
    valid()
    expect(() => store.importSnapshot('not json')).toThrow(/could not be read/i)
  })
})

describe('export', () => {
  it('produces a versioned snapshot with every table', () => {
    const subject = seedSubject()
    store.addClass({ subject_id: subject.id, day_of_week: 2, start_time: '10:00', end_time: '11:00' })
    const snapshot = store.exportSnapshot()
    expect(snapshot.version).toBe(1)
    expect(snapshot.subjects).toHaveLength(1)
    expect(snapshot.timetable).toHaveLength(1)
    expect(snapshot.records).toHaveLength(0)
  })
})
