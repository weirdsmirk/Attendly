import { useEffect, useId, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * One dialog shell for the whole app. It owns the parts that were missing
 * everywhere before: dialog semantics for screen readers, Escape to close, a
 * focus trap, initial focus, and focus returned to whatever opened it.
 */
export default function Modal({
  title,
  onClose,
  children,
  footer,
  size = 'md',
}: {
  title: ReactNode
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
}) {
  const panelRef = useRef<HTMLDivElement | null>(null)
  const titleId = useId()
  // Callers pass an inline arrow, so `onClose` changes identity on every render.
  // Reading it through a ref keeps the mount-only effect below from re-running —
  // otherwise it re-focused the first control after every keystroke, which
  // silently swallowed all but the first character typed into a dialog.
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const panel = panelRef.current
    panel?.querySelector<HTMLElement>(FOCUSABLE)?.focus() ?? panel?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onCloseRef.current()
        return
      }
      if (e.key !== 'Tab' || !panel) return
      const items = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      )
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKey, true)
    return () => {
      document.removeEventListener('keydown', onKey, true)
      opener?.focus?.()
    }
  }, [])

  const width = size === 'sm' ? 'max-w-sm' : size === 'lg' ? 'max-w-lg' : 'max-w-md'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className={`bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-2xl w-full ${width} max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800`}
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <h2 id={titleId} className="text-lg font-bold">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto">{children}</div>
        {footer && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 shrink-0">{footer}</div>
        )}
      </div>
    </div>
  )
}
