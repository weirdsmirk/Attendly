import { Component, StrictMode, type ErrorInfo, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { ToastProvider } from './components/Toast'

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null; errorId: string | null }> {
  state = { error: null, errorId: null }

  static getDerivedStateFromError(error: Error) {
    const suffix = Math.random().toString(36).slice(2, 8)
    return { error, errorId: `AT-${Date.now().toString(36)}-${suffix}` }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Attendly Error:', error, info)
  }

  render() {
    if (this.state.error) {
      const err = this.state.error as Error
      const isDev = import.meta.env.DEV
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 text-slate-900 dark:text-slate-100">
          <div className="max-w-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 rounded-2xl">
            <h1 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">Something went wrong</h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              {isDev
                ? err.message
                : 'The app hit an unexpected error. Try again, or reload the page.'}
            </p>
            {isDev && err.stack && (
              <pre className="mt-4 max-h-40 overflow-auto bg-slate-100 dark:bg-slate-800 p-3 text-[10px] text-slate-600 dark:text-slate-400 rounded-lg">
                {err.stack}
              </pre>
            )}
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => this.setState({ error: null, errorId: null })}
                className="btn btn-primary cursor-pointer"
              >
                Try Again
              </button>
              <button onClick={() => window.location.reload()} className="btn btn-secondary cursor-pointer">
                Reload Page
              </button>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-slate-500">
              Error ID: <span>{this.state.errorId}</span>. Your data is still saved in this browser — export a
              backup from Settings before clearing site data.
            </p>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <App />
      </ToastProvider>
    </ErrorBoundary>
  </StrictMode>,
)
