'use server'

import db from '@/lib/db';
import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';

export type Subject = {
  id: string;
  name: string;
  code: string;
  teacher: string | null;
  credits: number;
  min_attendance_req: number;
  color: string;
  initial_conducted: number;
  initial_attended: number;
  created_at: string;
};

export type TimetableClass = {
  id: string;
  subject_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  room: string | null;
  type: string;
};

export type AttendanceRecord = {
  id: string;
  subject_id: string;
  date: string;
  status: 'Attended' | 'Skipped' | 'Cancelled' | 'Holiday';
  notes: string | null;
  created_at: string;
};

function revalidateAll() {
  revalidatePath('/');
  revalidatePath('/subjects');
  revalidatePath('/timetable');
  revalidatePath('/history');
}

const RECORD_STATUSES = ['Attended', 'Skipped', 'Cancelled', 'Holiday'] as const;



type SubjectInput = {
  name: string;
  code: string;
  teacher: string | null;
  credits: number;
  min_attendance_req: number;
  color: string;
  initial_conducted: number;
  initial_attended: number;
};

function sanitizeSubjectInput(data: SubjectInput): SubjectInput {
  const name = (data.name ?? '').toString().trim();
  const code = (data.code ?? '').toString().trim();
  const teacherRaw = data.teacher == null ? '' : data.teacher.toString().trim();
  const teacher = teacherRaw === '' ? null : teacherRaw;

  let credits = Number(data.credits);
  if (!Number.isFinite(credits)) credits = 3;
  credits = Math.round(credits);
  if (credits < 1) credits = 1;
  if (credits > 10) credits = 10;

  let minReq = Number(data.min_attendance_req);
  if (!Number.isFinite(minReq)) minReq = 75;
  minReq = Math.round(minReq);
  if (minReq < 1) minReq = 1;
  if (minReq > 100) minReq = 100;

  let conducted = Number(data.initial_conducted);
  if (!Number.isFinite(conducted)) conducted = 0;
  conducted = Math.max(0, Math.floor(conducted));

  let attended = Number(data.initial_attended);
  if (!Number.isFinite(attended)) attended = 0;
  attended = Math.max(0, Math.floor(attended));
  if (attended > conducted) attended = conducted;

  let color = (data.color ?? '#4F46E5').toString().trim();
  if (!/^#[0-9A-Fa-f]{6}$/.test(color)) color = '#4F46E5';

  if (!name) throw new Error('Subject name is required.');
  if (!code) throw new Error('Subject code is required.');

  return { name, code, teacher, credits, min_attendance_req: minReq, color, initial_conducted: conducted, initial_attended: attended };
}

// --- Subjects ---

export async function getSubjects(): Promise<Subject[]> {
  const stmt = db.prepare('SELECT * FROM subjects ORDER BY created_at ASC');
  return stmt.all() as Subject[];
}

export async function addSubject(data: Omit<Subject, 'id' | 'created_at'>) {
  const clean = sanitizeSubjectInput(data);
  const id = randomUUID();
  const stmt = db.prepare(`
    INSERT INTO subjects (id, name, code, teacher, credits, min_attendance_req, color, initial_conducted, initial_attended)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(id, clean.name, clean.code, clean.teacher, clean.credits, clean.min_attendance_req, clean.color, clean.initial_conducted, clean.initial_attended);
  revalidateAll();
  return id;
}

export async function updateSubject(id: string, data: Omit<Subject, 'id' | 'created_at'>) {
  if (!id) throw new Error('Subject id is required.');
  const existing = db.prepare('SELECT id FROM subjects WHERE id = ?').get(id) as { id: string } | undefined;
  if (!existing) throw new Error('Subject not found.');
  const clean = sanitizeSubjectInput(data);
  const stmt = db.prepare(`
    UPDATE subjects 
    SET name = ?, code = ?, teacher = ?, credits = ?, min_attendance_req = ?, color = ?, initial_conducted = ?, initial_attended = ?
    WHERE id = ?
  `);
  stmt.run(clean.name, clean.code, clean.teacher, clean.credits, clean.min_attendance_req, clean.color, clean.initial_conducted, clean.initial_attended, id);
  revalidateAll();
}



export async function deleteSubject(id: string) {
  if (!id) throw new Error('Subject id is required.');
  const txn = db.transaction((subjectId: string) => {
    db.prepare('DELETE FROM attendance_records WHERE subject_id = ?').run(subjectId);
    db.prepare('DELETE FROM timetable WHERE subject_id = ?').run(subjectId);
    db.prepare('DELETE FROM subjects WHERE id = ?').run(subjectId);
  });
  txn(id);
  revalidateAll();
}

// --- Timetable ---

type SubjectJoin = {
  s_name: string;
  s_code: string;
  s_teacher: string | null;
  s_credits: number;
  s_min_req: number;
  s_color: string;
  s_initial_conducted: number;
  s_initial_attended: number;
  s_created_at: string;
};

type TimetableRow = {
  id: string;
  subject_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  room: string | null;
  type: string;
} & SubjectJoin;

type RecordRow = {
  id: string;
  subject_id: string;
  date: string;
  status: AttendanceRecord['status'];
  notes: string | null;
  created_at: string;
} & SubjectJoin;

export async function getTimetable(): Promise<(TimetableClass & { subject: Subject })[]> {
  const stmt = db.prepare(`
    SELECT t.*, 
           s.name as s_name, s.code as s_code, s.teacher as s_teacher, s.credits as s_credits, s.min_attendance_req as s_min_req, s.color as s_color, s.initial_conducted as s_initial_conducted, s.initial_attended as s_initial_attended, s.created_at as s_created_at
    FROM timetable t
    JOIN subjects s ON t.subject_id = s.id
    ORDER BY t.day_of_week ASC, t.start_time ASC
  `);
  const rows = stmt.all() as TimetableRow[];
  return rows.map(r => ({
    id: r.id,
    subject_id: r.subject_id,
    day_of_week: r.day_of_week,
    start_time: r.start_time,
    end_time: r.end_time,
    room: r.room,
    type: r.type,
    subject: {
      id: r.subject_id,
      name: r.s_name,
      code: r.s_code,
      teacher: r.s_teacher,
      credits: r.s_credits,
      min_attendance_req: r.s_min_req,
      color: r.s_color,
      initial_conducted: r.s_initial_conducted,
      initial_attended: r.s_initial_attended,
      created_at: r.s_created_at
    }
  }));
}

function sanitizeClassInput(data: Omit<TimetableClass, 'id'>): Omit<TimetableClass, 'id'> {
  if (!data.subject_id) throw new Error('Subject is required.');
  const subjectExists = db.prepare('SELECT id FROM subjects WHERE id = ?').get(data.subject_id);
  if (!subjectExists) throw new Error('Selected subject does not exist.');

  const day = Number(data.day_of_week);
  if (!Number.isInteger(day) || day < 0 || day > 6) throw new Error('Day of week must be between 0 and 6.');

  const start = (data.start_time ?? '').toString().trim();
  const end = (data.end_time ?? '').toString().trim();
  if (!/^\d{2}:\d{2}$/.test(start)) throw new Error('Start time must be HH:MM.');
  if (!/^\d{2}:\d{2}$/.test(end)) throw new Error('End time must be HH:MM.');
  if (start >= end) throw new Error('End time must be after start time.');

  const roomRaw = data.room == null ? '' : data.room.toString().trim();
  const typeRaw = (data.type ?? 'Lecture').toString().trim() || 'Lecture';
  const type = ['Lecture', 'Lab', 'Tutorial'].includes(typeRaw) ? typeRaw : 'Lecture';

  return { subject_id: data.subject_id, day_of_week: day, start_time: start, end_time: end, room: roomRaw === '' ? null : roomRaw, type };
}

export async function addTimetableClass(data: Omit<TimetableClass, 'id'>) {
  const clean = sanitizeClassInput(data);
  const id = randomUUID();
  const stmt = db.prepare(`
    INSERT INTO timetable (id, subject_id, day_of_week, start_time, end_time, room, type)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(id, clean.subject_id, clean.day_of_week, clean.start_time, clean.end_time, clean.room, clean.type);
  revalidatePath('/timetable');
  revalidatePath('/');
  return id;
}

export async function deleteTimetableClass(id: string) {
  if (!id) throw new Error('Class id is required.');
  const stmt = db.prepare('DELETE FROM timetable WHERE id = ?');
  stmt.run(id);
  revalidatePath('/timetable');
  revalidatePath('/');
}

// --- Attendance Records ---

export async function getRecords(): Promise<(AttendanceRecord & { subject: Subject })[]> {
  const stmt = db.prepare(`
    SELECT a.*, 
           s.name as s_name, s.code as s_code, s.teacher as s_teacher, s.credits as s_credits, s.min_attendance_req as s_min_req, s.color as s_color, s.initial_conducted as s_initial_conducted, s.initial_attended as s_initial_attended, s.created_at as s_created_at
    FROM attendance_records a
    JOIN subjects s ON a.subject_id = s.id
    ORDER BY a.date DESC, a.created_at DESC
  `);
  const rows = stmt.all() as RecordRow[];
  return rows.map(r => ({
    id: r.id,
    subject_id: r.subject_id,
    date: r.date,
    status: r.status,
    notes: r.notes,
    created_at: r.created_at,
    subject: {
      id: r.subject_id,
      name: r.s_name,
      code: r.s_code,
      teacher: r.s_teacher,
      credits: r.s_credits,
      min_attendance_req: r.s_min_req,
      color: r.s_color,
      initial_conducted: r.s_initial_conducted,
      initial_attended: r.s_initial_attended,
      created_at: r.s_created_at
    }
  }));
}

function sanitizeRecordInput(data: Omit<AttendanceRecord, 'id' | 'created_at'>): Omit<AttendanceRecord, 'id' | 'created_at'> {
  if (!data.subject_id) throw new Error('Subject is required.');
  const subjectExists = db.prepare('SELECT id FROM subjects WHERE id = ?').get(data.subject_id);
  if (!subjectExists) throw new Error('Selected subject does not exist.');
  const date = (data.date ?? '').toString().trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Date must be YYYY-MM-DD.');
  const parsed = new Date(date + 'T00:00:00');
  if (Number.isNaN(parsed.getTime())) throw new Error('Invalid date.');
  if (!(RECORD_STATUSES as readonly string[]).includes(data.status)) throw new Error('Invalid status.');
  const notesRaw = data.notes == null ? '' : data.notes.toString().trim();
  return { subject_id: data.subject_id, date, status: data.status, notes: notesRaw === '' ? null : notesRaw };
}

export async function addRecord(data: Omit<AttendanceRecord, 'id' | 'created_at'>) {
  const clean = sanitizeRecordInput(data);
  const id = randomUUID();
  const stmt = db.prepare(`
    INSERT INTO attendance_records (id, subject_id, date, status, notes)
    VALUES (?, ?, ?, ?, ?)
  `);
  stmt.run(id, clean.subject_id, clean.date, clean.status, clean.notes);
  revalidateAll();
  return id;
}

export async function updateRecord(id: string, data: Omit<AttendanceRecord, 'id' | 'created_at'>) {
  if (!id) throw new Error('Record id is required.');
  const existing = db.prepare('SELECT id FROM attendance_records WHERE id = ?').get(id);
  if (!existing) throw new Error('Record not found.');
  const clean = sanitizeRecordInput(data);
  db.prepare('UPDATE attendance_records SET subject_id = ?, date = ?, status = ?, notes = ? WHERE id = ?')
    .run(clean.subject_id, clean.date, clean.status, clean.notes, id);
  revalidateAll();
}

export async function deleteRecord(id: string) {
  if (!id) throw new Error('Record id is required.');
  const stmt = db.prepare('DELETE FROM attendance_records WHERE id = ?');
  stmt.run(id);
  revalidateAll();
}

export async function addClass(data: Omit<TimetableClass, 'id'>) {
  return addTimetableClass(data);
}

export async function deleteClass(id: string) {
  return deleteTimetableClass(id);
}

// --- Backup / restore ---

export async function exportAllData() {
  const subjects = await getSubjects();
  const timetableStmt = db.prepare('SELECT * FROM timetable ORDER BY day_of_week ASC, start_time ASC');
  const recordsStmt = db.prepare('SELECT * FROM attendance_records ORDER BY date DESC');
  return {
    exportedAt: new Date().toISOString(),
    version: 1,
    subjects,
    timetable: timetableStmt.all(),
    records: recordsStmt.all(),
  };
}

type BackupSubject = { id?: unknown; name?: unknown; code?: unknown; teacher?: unknown; credits?: unknown; min_attendance_req?: unknown; color?: unknown; initial_conducted?: unknown; initial_attended?: unknown; created_at?: unknown };
type BackupClass = { id?: unknown; subject_id?: unknown; day_of_week?: unknown; start_time?: unknown; end_time?: unknown; room?: unknown; type?: unknown };
type BackupRecord = { id?: unknown; subject_id?: unknown; date?: unknown; status?: unknown; notes?: unknown; created_at?: unknown };
export async function importAllData(payload: { subjects?: BackupSubject[]; timetable?: BackupClass[]; records?: BackupRecord[] }) {
  if (!payload || typeof payload !== 'object') throw new Error('Invalid backup file.');
  const subjects = Array.isArray(payload.subjects) ? payload.subjects : [];
  const timetable = Array.isArray(payload.timetable) ? payload.timetable : [];
  const records = Array.isArray(payload.records) ? payload.records : [];

  const txn = db.transaction(() => {
    db.prepare('DELETE FROM attendance_records').run();
    db.prepare('DELETE FROM timetable').run();
    db.prepare('DELETE FROM subjects').run();

    const insertSubject = db.prepare(`
      INSERT INTO subjects (id, name, code, teacher, credits, min_attendance_req, color, initial_conducted, initial_attended, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const s of subjects) {
      try {
        const clean = sanitizeSubjectInput({
          name: (s.name as string) ?? '',
          code: (s.code as string) ?? '',
          teacher: (s.teacher as string | null) ?? null,
          credits: (s.credits as number) ?? 3,
          min_attendance_req: (s.min_attendance_req as number) ?? 75,
          color: (s.color as string) ?? '#4F46E5',
          initial_conducted: (s.initial_conducted as number) ?? 0,
          initial_attended: (s.initial_attended as number) ?? 0,
        });
        insertSubject.run(
          typeof s.id === 'string' && s.id ? s.id : randomUUID(),
          clean.name, clean.code, clean.teacher, clean.credits,
          clean.min_attendance_req, clean.color, clean.initial_conducted, clean.initial_attended,
          typeof s.created_at === 'string' && s.created_at ? s.created_at : new Date().toISOString()
        );
      } catch { /* skip invalid rows */ }
    }

    const subjectIds = new Set((db.prepare('SELECT id FROM subjects').all() as { id: string }[]).map(r => r.id));
    const insertClass = db.prepare(`
      INSERT INTO timetable (id, subject_id, day_of_week, start_time, end_time, room, type)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    for (const c of timetable) {
      if (!c || typeof c.subject_id !== 'string' || !subjectIds.has(c.subject_id)) continue;
      try {
        const clean = sanitizeClassInput({
          subject_id: c.subject_id as string,
          day_of_week: c.day_of_week as number,
          start_time: c.start_time as string,
          end_time: c.end_time as string,
          room: (c.room as string | null) ?? null,
          type: (c.type as string) ?? 'Lecture',
        });
        insertClass.run(typeof c.id === 'string' && c.id ? c.id : randomUUID(), clean.subject_id, clean.day_of_week, clean.start_time, clean.end_time, clean.room, clean.type);
      } catch { /* skip */ }
    }

    const insertRecord = db.prepare(`
      INSERT INTO attendance_records (id, subject_id, date, status, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    for (const r of records) {
      if (!r || typeof r.subject_id !== 'string' || !subjectIds.has(r.subject_id)) continue;
      try {
        const clean = sanitizeRecordInput({
          subject_id: r.subject_id as string,
          date: r.date as string,
          status: r.status as AttendanceRecord['status'],
          notes: (r.notes as string | null) ?? null,
        });
        insertRecord.run(
          typeof r.id === 'string' && r.id ? r.id : randomUUID(),
          clean.subject_id, clean.date, clean.status, clean.notes,
          typeof r.created_at === 'string' && r.created_at ? r.created_at : new Date().toISOString()
        );
      } catch { /* skip */ }
    }
  });
  txn();
  revalidateAll();
  return { subjects: subjects.length };
}
