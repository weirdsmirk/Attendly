import '@testing-library/jest-dom/vitest'
import { afterAll, beforeAll, beforeEach } from 'vitest'

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

// The dev-only SQLite mirror must never be hit from a test.
const originalFetch = globalThis.fetch
beforeAll(() => {
  if (!globalThis.fetch) return
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : (input as Request).url
    if (url.includes('/__data/')) {
      return new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } })
    }
    return originalFetch(input as RequestInfo)
  }) as typeof fetch
})
afterAll(() => {
  globalThis.fetch = originalFetch
})
