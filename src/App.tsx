import { Suspense, lazy, useCallback, useEffect, useState } from 'react'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import Spinner from './components/Spinner'

// Split the heavier views (the dashboard pulls in the charting library) so the
// shell paints before they load.
const Dashboard = lazy(() => import('./components/Dashboard'))
const SubjectGrid = lazy(() => import('./components/SubjectGrid'))
const TimetableGrid = lazy(() => import('./components/TimetableGrid'))
const HistoryClient = lazy(() => import('./components/HistoryClient'))

const PAGES = ['overview', 'history', 'timetable', 'subjects'] as const
type Page = (typeof PAGES)[number]

function pageFromHash(): Page {
  const hash = window.location.hash.replace(/^#\/?/, '')
  return (PAGES as readonly string[]).includes(hash) ? (hash as Page) : 'overview'
}

export default function App() {
  const [page, setPage] = useState<Page>(pageFromHash)
  // One search value for the whole app: typing in the header navigates to
  // Subjects, and the grid filters on the same state — no event bus, so the
  // first keystroke can no longer be lost on navigation.
  const [query, setQuery] = useState('')

  useEffect(() => {
    const onHash = () => setPage(pageFromHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const navigate = useCallback((next: string) => {
    const target = (PAGES as readonly string[]).includes(next) ? (next as Page) : 'overview'
    if (target === 'overview') {
      history.pushState(null, '', `${window.location.pathname}${window.location.search}`)
    } else {
      history.pushState(null, '', `${window.location.pathname}${window.location.search}#/${target}`)
    }
    setPage(target)
  }, [])

  return (
    <div className="flex h-screen overflow-hidden">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[80] focus:m-3 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-slate-900 dark:focus:bg-slate-900 dark:focus:text-white focus:border focus:border-slate-200"
      >
        Skip to main content
      </a>
      <Sidebar page={page} onNavigate={navigate} />
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50 dark:bg-slate-950">
        <Header page={page} query={query} onQueryChange={setQuery} onNavigate={navigate} />
        <main id="main" tabIndex={-1} className="flex-1 overflow-y-auto p-6 lg:p-10 outline-none">
          <Suspense
            fallback={
              <div className="flex min-h-[40vh] items-center justify-center">
                <Spinner size={28} />
              </div>
            }
          >
            {page === 'overview' && <Dashboard onNavigate={navigate} />}
            {page === 'subjects' && <SubjectGrid query={query} />}
            {page === 'timetable' && <TimetableGrid />}
            {page === 'history' && <HistoryClient />}
          </Suspense>
        </main>
      </div>
    </div>
  )
}
