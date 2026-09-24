import { useSyncExternalStore } from 'react'

/**
 * Preferences live in one store instead of being read ad-hoc from localStorage
 * by four components and broadcast over custom window events. There is no
 * server rendering here, so the cache is read synchronously at module load and
 * every consumer simply subscribes.
 */

export type DayScope = 'week' | 'full'

export type Profile = {
  name: string
  initials: string
  course: string
  studentId: string
  semester: string
}

export const DEFAULT_PROFILE: Profile = {
  name: 'Alex Rivera',
  initials: 'AR',
  course: 'Computer Science · Year 2',
  studentId: 'CS2024-0042',
  semester: '4th Semester',
}

const STORAGE = 'attendly.settings.v1'
const MAX_FIELD = 120

type State = {
  profile: Profile
  theme: 'light' | 'dark'
  dayScope: DayScope
  sidebarCollapsed: boolean
}

const INITIAL: State = {
  profile: DEFAULT_PROFILE,
  theme: 'light',
  dayScope: 'full',
  sidebarCollapsed: false,
}

function field(value: unknown, max = MAX_FIELD): string {
  if (typeof value === 'string') return value.trim().slice(0, max)
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return ''
}

export function initialsFor(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return '?'
  if (words.length === 1) return (words[0][0] ?? '?').toUpperCase()
  return `${words[0][0] ?? ''}${words[1][0] ?? ''}`.toUpperCase() || '?'
}

/** Every field is coerced to a bounded string, so a hand-edited localStorage
 *  value can never crash `.trim()` during a save. */
export function normalizeProfile(raw: unknown): Profile {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return DEFAULT_PROFILE
  const r = raw as Record<string, unknown>
  const name = field(r.name) || DEFAULT_PROFILE.name
  return {
    name,
    initials: field(r.initials, 4) || initialsFor(name),
    course: field(r.course),
    studentId: field(r.studentId),
    semester: field(r.semester),
  }
}

function read(): State {
  try {
    const raw = localStorage.getItem(STORAGE)
    if (!raw) return INITIAL
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return INITIAL
    const s = parsed as Record<string, unknown>
    return {
      profile: normalizeProfile(s.profile),
      theme: s.theme === 'dark' ? 'dark' : 'light',
      dayScope: s.dayScope === 'week' ? 'week' : 'full',
      sidebarCollapsed: s.sidebarCollapsed === true,
    }
  } catch {
    return INITIAL
  }
}

const listeners = new Set<() => void>()
let cache = read()
let snapshot = cache

function applyTheme(theme: 'light' | 'dark') {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('dark', theme === 'dark')
  document.documentElement.style.colorScheme = theme
}

function commit(next: State) {
  cache = next
  snapshot = next
  for (const fn of [...listeners]) {
    try {
      fn()
    } catch (e) {
      console.error('[settings] subscriber failed', e)
    }
  }
  try {
    localStorage.setItem(STORAGE, JSON.stringify(next))
  } catch (e) {
    console.warn('[settings] persistence failed', e)
  }
  applyTheme(next.theme)
}

applyTheme(cache.theme)

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key !== STORAGE || e.newValue === null) return
    try {
      const parsed = JSON.parse(e.newValue)
      if (typeof parsed !== 'object' || parsed === null) return
      const next = read()
      if (JSON.stringify(next) !== JSON.stringify(cache)) commit(next)
    } catch {
      /* ignore malformed cross-tab payloads */
    }
  })
}

export function useSettings() {
  const settings = useSyncExternalStore(
    (fn) => {
      listeners.add(fn)
      return () => listeners.delete(fn)
    },
    () => snapshot,
    () => snapshot,
  )
  return settings
}

export const settings = {
  setProfile(profile: Profile) {
    const name = field(profile.name)
    if (!name) throw new Error('Name is required.')
    commit({
      ...cache,
      profile: {
        name,
        initials: initialsFor(name),
        course: field(profile.course),
        studentId: field(profile.studentId),
        semester: field(profile.semester),
      },
    })
  },

  toggleTheme() {
    commit({ ...cache, theme: cache.theme === 'dark' ? 'light' : 'dark' })
  },

  setDayScope(dayScope: DayScope) {
    commit({ ...cache, dayScope })
  },

  toggleSidebar() {
    commit({ ...cache, sidebarCollapsed: !cache.sidebarCollapsed })
  },
}

/** The pristine state, exported so specs can reset to a known baseline. */
export const INITIAL_SETTINGS_FOR_TEST = INITIAL

/** Test seam. */
export function __resetSettingsForTests(state: State = INITIAL_SETTINGS_FOR_TEST) {
  cache = state
  snapshot = state
  for (const fn of [...listeners]) fn()
}
