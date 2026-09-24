import '@testing-library/jest-dom/vitest'
import { beforeEach } from 'vitest'

// In-memory localStorage, reset between tests.
const store = new Map<string, string>()
const localStorageMock = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => store.set(k, v),
  removeItem: (k: string) => store.delete(k),
  clear: () => store.clear(),
  key: (i: number) => [...store.keys()][i] ?? null,
  get length() {
    return store.size
  },
}
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true })

beforeEach(() => {
  store.clear()
  document.body.style.overflow = ''
})

if (typeof globalThis.requestAnimationFrame === 'undefined') {
  globalThis.requestAnimationFrame = ((cb: FrameRequestCallback) =>
    setTimeout(() => cb(Date.now()), 0)) as unknown as typeof requestAnimationFrame
  globalThis.cancelAnimationFrame = ((id: number) => clearTimeout(id)) as unknown as typeof cancelAnimationFrame
}

/**
 * The dev-only SQLite mirror is stubbed at module scope, not in `beforeAll`:
 * the store kicks off hydration as a side effect of being imported, which
 * happens before any hook runs. A previous `beforeAll` mock therefore arrived
 * too late and the real `fetch` was used during hydration.
 *
 * The stub answers with a *valid* empty snapshot, because `{}` is not a valid
 * snapshot and made hydration throw on every test run.
 */
const EMPTY_SNAPSHOT = {
  version: 1,
  exportedAt: '1970-01-01T00:00:00.000Z',
  subjects: [],
  timetable: [],
  records: [],
}

const realFetch = globalThis.fetch
globalThis.fetch = (async (input: RequestInfo | URL) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : (input as Request).url
  if (url.includes('/__data/')) {
    return new Response(JSON.stringify(EMPTY_SNAPSHOT), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  return realFetch(input as RequestInfo)
}) as typeof fetch

/** Lets a spec install a failing storage mock, e.g. a quota-exceeded test. */
export function __setLocalStorageImplementation(next: Partial<typeof localStorageMock>) {
  Object.assign(localStorageMock, next)
}
