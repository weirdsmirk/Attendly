import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, type Plugin } from 'vite'
import type { Database, SqlJsStatic } from 'sql.js'

const root = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(root, 'data')
const DB_PATH = path.join(DATA_DIR, 'attendly.db')
const ENDPOINT = '/__data/attendly'

/**
 * Schema for the on-disk mirror. `subjects.code` is unique and
 * `(subject_id, date)` is indexed, so a repeated +1 can never inflate the
 * statistics. Index creation is best-effort: a pre-existing database written
 * before the constraints existed may hold duplicates, and failing to start the
 * dev server over that would be worse than the missing index.
 */
const SCHEMA = `
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
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS timetable (
  id TEXT PRIMARY KEY,
  subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  room TEXT,
  type TEXT DEFAULT 'Lecture'
);
CREATE TABLE IF NOT EXISTS attendance_records (
  id TEXT PRIMARY KEY,
  subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  status TEXT NOT NULL,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
`

const INDEXES = `
CREATE UNIQUE INDEX IF NOT EXISTS idx_subjects_code ON subjects(code);
CREATE INDEX IF NOT EXISTS idx_records_subject_date ON attendance_records(subject_id, date);
CREATE INDEX IF NOT EXISTS idx_records_date ON attendance_records(date);
CREATE INDEX IF NOT EXISTS idx_timetable_subject ON timetable(subject_id);
`

type Row = Record<string, string | number | null>

function str(value: unknown, max = 200): string {
  return typeof value === 'string' ? value.slice(0, max) : String(value ?? '').slice(0, max)
}

function num(value: unknown, fallback = 0): number {
  const n = Number(value)
  return Number.isFinite(n) ? Math.trunc(n) : fallback
}

/** Dev-only mirror between the browser store and data/attendly.db.
 *  Mirrors CineTrack: the app works entirely from localStorage in a static
 *  production build; this endpoint only exists under `vite dev`. */
function dataMirror(): Plugin {
  return {
    name: 'attendly-data-mirror',
    apply: 'serve',
    configureServer(server) {
      let sqlReady: Promise<SqlJsStatic> | null = null
      const require = createRequire(import.meta.url)
      const loadSql = () => {
        sqlReady ??= import('sql.js').then((mod) =>
          mod.default({ locateFile: (file: string) => require.resolve(`sql.js/dist/${file}`) }),
        )
        return sqlReady
      }

      const open = async (SQL: SqlJsStatic) => {
        if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
        const db = existsSync(DB_PATH) ? new SQL.Database(readFileSync(DB_PATH)) : new SQL.Database()
        db.run('PRAGMA foreign_keys = ON;')
        db.run(SCHEMA)
        try {
          db.run(INDEXES)
        } catch {
          // Legacy duplicates — the client store dedupes on load.
        }
        return db
      }

      const query = (db: Database, sql: string): Row[] => {
        const result = db.exec(sql)
        if (!result.length) return []
        const { columns, values } = result[0]
        return values.map((row) => Object.fromEntries(columns.map((c, i) => [c, row[i]]))) as Row[]
      }

      server.middlewares.use(ENDPOINT, (req, res) => {
        const send = (status: number, body: unknown) => {
          res.statusCode = status
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(body))
        }

        void (async () => {
          try {
            const SQL = await loadSql()
            const db = await open(SQL)

            if (req.method === 'GET') {
              send(200, {
                version: 1,
                subjects: query(db, 'SELECT * FROM subjects ORDER BY created_at ASC'),
                timetable: query(db, 'SELECT * FROM timetable ORDER BY day_of_week ASC, start_time ASC'),
                records: query(db, 'SELECT * FROM attendance_records ORDER BY date DESC, created_at DESC'),
              })
              db.close()
              return
            }

            if (req.method === 'POST') {
              const chunks: Buffer[] = []
              for await (const chunk of req) chunks.push(chunk as Buffer)
              const raw = Buffer.concat(chunks).toString('utf8')
              if (raw.length > 20 * 1024 * 1024) {
                send(413, { error: 'Snapshot too large' })
                db.close()
                return
              }
              let payload: Record<string, unknown>
              try {
                payload = JSON.parse(raw) as Record<string, unknown>
              } catch {
                send(400, { error: 'Invalid JSON' })
                db.close()
                return
              }

              const subjects = Array.isArray(payload.subjects) ? payload.subjects : []
              const timetable = Array.isArray(payload.timetable) ? payload.timetable : []
              const records = Array.isArray(payload.records) ? payload.records : []
              const subjectIds = new Set<string>()

              db.run('BEGIN')
              try {
                db.run('DELETE FROM attendance_records; DELETE FROM timetable; DELETE FROM subjects;')
                for (const s of subjects) {
                  const row = s as Row
                  const id = str(row.id, 64)
                  if (!id) continue
                  subjectIds.add(id)
                  db.run(
                    `INSERT INTO subjects (id, name, code, teacher, credits, min_attendance_req, color, initial_conducted, initial_attended, created_at)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                      id,
                      str(row.name, 120),
                      str(row.code, 40),
                      row.teacher == null ? null : str(row.teacher, 120),
                      num(row.credits, 3),
                      num(row.min_attendance_req, 75),
                      str(row.color, 7),
                      num(row.initial_conducted),
                      num(row.initial_attended),
                      str(row.created_at, 40) || new Date().toISOString(),
                    ],
                  )
                }
                for (const t of timetable) {
                  const row = t as Row
                  const subjectId = str(row.subject_id, 64)
                  if (!subjectIds.has(subjectId)) continue
                  db.run(
                    `INSERT INTO timetable (id, subject_id, day_of_week, start_time, end_time, room, type)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [
                      str(row.id, 64),
                      subjectId,
                      num(row.day_of_week),
                      str(row.start_time, 5),
                      str(row.end_time, 5),
                      row.room == null ? null : str(row.room, 60),
                      str(row.type, 20) || 'Lecture',
                    ],
                  )
                }
                for (const r of records) {
                  const row = r as Row
                  const subjectId = str(row.subject_id, 64)
                  if (!subjectIds.has(subjectId)) continue
                  db.run(
                    `INSERT INTO attendance_records (id, subject_id, date, status, notes, created_at)
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [
                      str(row.id, 64),
                      subjectId,
                      str(row.date, 10),
                      str(row.status, 16),
                      row.notes == null ? null : str(row.notes, 2000),
                      str(row.created_at, 40) || new Date().toISOString(),
                    ],
                  )
                }
                db.run('COMMIT')
              } catch (e) {
                db.run('ROLLBACK')
                send(422, { error: e instanceof Error ? e.message : 'Rejected snapshot' })
                db.close()
                return
              }

              // Atomic write: a crash mid-write must not corrupt the mirror.
              const tmp = `${DB_PATH}.tmp`
              writeFileSync(tmp, Buffer.from(db.export()))
              renameSync(tmp, DB_PATH)
              db.close()
              send(200, { ok: true })
              return
            }

            send(405, { error: 'Method not allowed' })
            db.close()
          } catch (e) {
            send(500, { error: e instanceof Error ? e.message : 'Data mirror failed' })
          }
        })()
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), dataMirror()],
})
