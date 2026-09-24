const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const dbDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
const db = new Database(path.join(dbDir, 'attendly.db'));

db.exec(`
    CREATE TABLE IF NOT EXISTS subjects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT NOT NULL,
      teacher TEXT,
      credits INTEGER DEFAULT 3,
      min_attendance_req INTEGER DEFAULT 75,
      color TEXT DEFAULT '#4F46E5',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS timetable (
      id TEXT PRIMARY KEY,
      subject_id TEXT NOT NULL,
      day_of_week INTEGER NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      room TEXT,
      type TEXT DEFAULT 'Lecture',
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS attendance_records (
      id TEXT PRIMARY KEY,
      subject_id TEXT NOT NULL,
      date TEXT NOT NULL,
      status TEXT NOT NULL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
    );
`);

const s1 = crypto.randomUUID();
const s2 = crypto.randomUUID();
const s3 = crypto.randomUUID();

db.exec(`
  INSERT OR IGNORE INTO subjects (id, name, code, teacher, credits, min_attendance_req, color) VALUES
  ('${s1}', 'Database Systems', 'CS302', 'Dr. Priya Nair', 4, 75, '#4F46E5'),
  ('${s2}', 'Human Computer Interaction', 'CS316', 'Prof. Aaron Lee', 3, 80, '#10B981'),
  ('${s3}', 'Applied Mathematics', 'MA201', 'Dr. Thomas Reed', 3, 75, '#EF4444');
`);

console.log('Seeded successfully');
