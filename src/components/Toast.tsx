import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import clsx from 'clsx'

type Tone = 'success' | 'error'
type Toast = { id: number; message: string; tone: Tone }

const ToastContext = createContext<((message: string, tone?: Tone) => void) | null>(null)

/** Feedback for every mutation, so a failed save is never silent. */
export function useToast() {
  const show = useContext(ToastContext)
  if (!show) throw new Error('useToast must be used inside <ToastProvider>')
  return show
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(1)

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const show = useCallback(
    (message: string, tone: Tone = 'success') => {
      const id = nextId.current++
      setToasts((prev) => [...prev.slice(-2), { id, message, tone }])
      setTimeout(() => dismiss(id), 4000)
    },
    [dismiss],
  )

  const value = useMemo(() => show, [show])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="fixed bottom-4 right-4 z-[70] flex flex-col gap-2"
        role="status"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <button
            key={t.id}
            onClick={() => dismiss(t.id)}
            className={clsx(
              'flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium text-left cursor-pointer',
              t.tone === 'error'
                ? 'bg-rose-50 dark:bg-rose-950/80 border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100',
            )}
          >
            <span
              className={clsx(
                'w-1.5 h-1.5 rounded-full shrink-0',
                t.tone === 'error' ? 'bg-rose-500' : 'bg-emerald-500',
              )}
            />
            {t.message}
          </button>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
