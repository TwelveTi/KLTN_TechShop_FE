import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Icon, type IconName } from './Icon'
import {
  ToastContext,
  type ToastAction,
  type ToastOptions,
  type ToastVariant,
} from './toastContext'

/* -----------------------------------------------------------------
 * Toast — single source of truth for transient notifications.
 *
 * Replaces the four hand-rolled, inline-styled toast blocks that used
 * to live in HomePage / CatalogPage / ProductDetailPage / CartPage.
 * Timers are owned here and always cleared, so no "setState after
 * unmount" leaks from page components.
 * ----------------------------------------------------------------- */

interface ToastRecord extends Required<Omit<ToastOptions, 'action'>> {
  id: number
  message: string
  action?: ToastAction
}

const VARIANT_ICON: Record<ToastVariant, IconName> = {
  success: 'check-circle',
  error: 'x-circle',
  info: 'info',
  warning: 'alert-triangle',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([])
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>())
  const idSeq = useRef(0)

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
  }, [])

  const showToast = useCallback(
    (message: string, options: ToastOptions = {}) => {
      const id = ++idSeq.current
      const record: ToastRecord = {
        id,
        message,
        variant: options.variant ?? 'success',
        duration: options.duration ?? 3200,
        action: options.action,
      }

      setToasts((prev) => {
        // Cap the stack so a burst of actions can't fill the screen.
        const next = [...prev, record]
        return next.length > 4 ? next.slice(next.length - 4) : next
      })

      if (record.duration > 0) {
        const timer = setTimeout(() => dismissToast(id), record.duration)
        timers.current.set(id, timer)
      }

      return id
    },
    [dismissToast],
  )

  // Clear every outstanding timer when the provider itself unmounts.
  useEffect(() => {
    const timerMap = timers.current
    return () => {
      timerMap.forEach((timer) => clearTimeout(timer))
      timerMap.clear()
    }
  }, [])

  const value = useMemo(() => ({ showToast, dismissToast }), [showToast, dismissToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="ts-toast-viewport" role="region" aria-label="Notifications">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`ts-toast ts-toast--${toast.variant}`}
            role={toast.variant === 'error' ? 'alert' : 'status'}
            aria-live={toast.variant === 'error' ? 'assertive' : 'polite'}
          >
            <span className="ts-toast__icon" aria-hidden="true">
              <Icon name={VARIANT_ICON[toast.variant]} size={18} />
            </span>
            <span className="ts-toast__message">{toast.message}</span>
            {toast.action && (
              <button
                type="button"
                className="ts-toast__action"
                onClick={() => {
                  toast.action?.onClick()
                  dismissToast(toast.id)
                }}
              >
                {toast.action.label}
              </button>
            )}
            <button
              type="button"
              className="ts-toast__close"
              onClick={() => dismissToast(toast.id)}
              aria-label="Dismiss notification"
            >
              <Icon name="x" size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
