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

// --- Subjects ---

export async function getSubjects(): Promise<Subject[]> {
  const stmt = db.prepare('SELECT * FROM subjects ORDER BY created_at ASC');
  return stmt.all() as Subject[];
}

export async function addSubject(data: Omit<Subject, 'id' | 'created_at'>) {
  const id = randomUUID();
  const stmt = db.prepare(`
    INSERT INTO subjects (id, name, code, teacher, credits, min_attendance_req, color)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(id, data.name, data.code, data.teacher, data.credits, data.min_attendance_req, data.color);
  revalidatePath('/');
  revalidatePath('/subjects');
  return id;
}

export async function deleteSubject(id: string) {
  const stmt = db.prepare('DELETE FROM subjects WHERE id = ?');
  stmt.run(id);
  revalidatePath('/');
  revalidatePath('/subjects');
  revalidatePath('/timetable');
  revalidatePath('/history');
}

// --- Timetable ---

export async function getTimetable(): Promise<(TimetableClass & { subject: Subject })[]> {
  const stmt = db.prepare(`
    SELECT t.*, 
           s.name as s_name, s.code as s_code, s.teacher as s_teacher, s.credits as s_credits, s.min_attendance_req as s_min_req, s.color as s_color, s.created_at as s_created_at
    FROM timetable t
    JOIN subjects s ON t.subject_id = s.id
    ORDER BY t.day_of_week ASC, t.start_time ASC
  `);
  const rows = stmt.all() as any[];
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
      created_at: r.s_created_at
    }
  }));
}

export async function addTimetableClass(data: Omit<TimetableClass, 'id'>) {
  const id = randomUUID();
  const stmt = db.prepare(`
    INSERT INTO timetable (id, subject_id, day_of_week, start_time, end_time, room, type)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(id, data.subject_id, data.day_of_week, data.start_time, data.end_time, data.room, data.type);
  revalidatePath('/timetable');
  return id;
}

export async function deleteTimetableClass(id: string) {
  const stmt = db.prepare('DELETE FROM timetable WHERE id = ?');
  stmt.run(id);
  revalidatePath('/timetable');
}

// --- Attendance Records ---

export async function getRecords(): Promise<(AttendanceRecord & { subject: Subject })[]> {
  const stmt = db.prepare(`
    SELECT a.*, 
           s.name as s_name, s.code as s_code, s.teacher as s_teacher, s.credits as s_credits, s.min_attendance_req as s_min_req, s.color as s_color, s.created_at as s_created_at
    FROM attendance_records a
    JOIN subjects s ON a.subject_id = s.id
    ORDER BY a.date DESC, a.created_at DESC
  `);
  const rows = stmt.all() as any[];
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
      created_at: r.s_created_at
    }
  }));
}

export async function addRecord(data: Omit<AttendanceRecord, 'id' | 'created_at'>) {
  const id = randomUUID();
  const stmt = db.prepare(`
    INSERT INTO attendance_records (id, subject_id, date, status, notes)
    VALUES (?, ?, ?, ?, ?)
  `);
  stmt.run(id, data.subject_id, data.date, data.status, data.notes);
  revalidatePath('/');
  revalidatePath('/history');
  revalidatePath('/subjects');
  return id;
}

export async function deleteRecord(id: string) {
  const stmt = db.prepare('DELETE FROM attendance_records WHERE id = ?');
  stmt.run(id);
  revalidatePath('/');
  revalidatePath('/history');
  revalidatePath('/subjects');
}
