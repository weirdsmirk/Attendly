import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Initialize the database connection
// In a real local-first app, this could be stored in appData or a specific local directory.
// For development, we'll store it in the project root.
const dbDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}
const dbPath = path.join(dbDir, 'attendly.db');

const db = new Database(dbPath);

// Initialize schema
db.pragma('journal_mode = WAL');

const initSchema = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS subjects (
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

    CREATE TABLE IF NOT EXISTS timetable (
      id TEXT PRIMARY KEY,
      subject_id TEXT NOT NULL,
      day_of_week INTEGER NOT NULL, -- 0 (Sunday) to 6 (Saturday)
      start_time TEXT NOT NULL, -- HH:MM
      end_time TEXT NOT NULL, -- HH:MM
      room TEXT,
      type TEXT DEFAULT 'Lecture',
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS attendance_records (
      id TEXT PRIMARY KEY,
      subject_id TEXT NOT NULL,
      date TEXT NOT NULL, -- YYYY-MM-DD
      status TEXT NOT NULL, -- Attended, Skipped, Cancelled, Holiday
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
    );
  `);
};

initSchema();

export default db;
