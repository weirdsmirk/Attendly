/* eslint-disable @typescript-eslint/no-require-imports */
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const dbDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
const db = new Database(path.join(dbDir, 'attendly.db'));

db.exec(`
    DROP TABLE IF EXISTS attendance_records;
    DROP TABLE IF EXISTS timetable;
    DROP TABLE IF EXISTS subjects;

    CREATE TABLE subjects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT NOT NULL,
      teacher TEXT,
      credits INTEGER DEFAULT 3,
      min_attendance_req INTEGER DEFAULT 75,
      color TEXT DEFAULT '#4F46E5',
      initial_conducted INTEGER DEFAULT 0,
      initial_attended INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE timetable (
      id TEXT PRIMARY KEY,
      subject_id TEXT NOT NULL,
      day_of_week INTEGER NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      room TEXT,
      type TEXT DEFAULT 'Lecture',
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
    );

    CREATE TABLE attendance_records (
      id TEXT PRIMARY KEY,
      subject_id TEXT NOT NULL,
      date TEXT NOT NULL,
      status TEXT NOT NULL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
    );
`);

const s1 = crypto.randomUUID(); // DB
const s2 = crypto.randomUUID(); // HCI
const s3 = crypto.randomUUID(); // Math
const s4 = crypto.randomUUID(); // CN

db.exec(`
  INSERT INTO subjects (id, name, code, teacher, credits, min_attendance_req, color) VALUES
  ('${s1}', 'Database Systems', 'CS302', 'Dr. Priya Nair', 4, 75, '#4F46E5'),
  ('${s2}', 'Human Computer Interaction', 'CS316', 'Prof. Aaron Lee', 3, 80, '#10B981'),
  ('${s3}', 'Applied Mathematics', 'MA201', 'Dr. Thomas Reed', 3, 75, '#EF4444'),
  ('${s4}', 'Computer Networks', 'CS304', 'Dr. Maya Shah', 4, 75, '#F59E0B');
`);

// Add Timetable
const todayDayOfWeek = new Date().getDay(); // 0-6

db.exec(`
  INSERT INTO timetable (id, subject_id, day_of_week, start_time, end_time, room) VALUES
  ('${crypto.randomUUID()}', '${s1}', ${todayDayOfWeek}, '09:00', '10:00', 'B-204'),
  ('${crypto.randomUUID()}', '${s2}', ${todayDayOfWeek}, '11:00', '12:00', 'A-110'),
  ('${crypto.randomUUID()}', '${s4}', ${todayDayOfWeek}, '14:00', '15:00', 'Lab 2'),
  
  ('${crypto.randomUUID()}', '${s1}', ${(todayDayOfWeek + 1) % 7}, '09:00', '10:00', 'B-204'),
  ('${crypto.randomUUID()}', '${s3}', ${(todayDayOfWeek + 2) % 7}, '10:00', '11:00', 'C-104')
`);

// Add Attendance Records (mock some history)
const generateRecords = (subjectId, conducted, missedDates) => {
  for (let i = 0; i < conducted; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (conducted - i) * 2); // Spread out over past days
    const dateStr = d.toISOString().split('T')[0];
    const status = missedDates.includes(i) ? 'Skipped' : 'Attended';
    db.exec(`INSERT INTO attendance_records (id, subject_id, date, status) VALUES ('${crypto.randomUUID()}', '${subjectId}', '${dateStr}', '${status}')`);
  }
}

generateRecords(s1, 6, [4]); // DB: 5/6 = 83%
generateRecords(s2, 5, [2]); // HCI: 4/5 = 80%
generateRecords(s3, 3, []);  // Math: 3/3 = 100%
generateRecords(s4, 4, [1, 3]); // CN: 2/4 = 50%

console.log('Database seeded with rich demo data.');
