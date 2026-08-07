import { useEffect } from 'react'
import type { ReactNode } from 'react'
import './toast.css'

export type ToastType = 'success' | 'info' | 'error'

type ToastProps = {
  type?: ToastType
  message: string
  onClose: () => void
  duration?: number
}

const TITLES: Record<ToastType, string> = {
  success: 'Success',
  info: 'Notice',
  error: 'Something went wrong',
}

const ICONS: Record<ToastType, ReactNode> = {
  success: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  ),
  info: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5" />
      <path d="M12 8h.01" />
    </svg>
  ),
  error: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m18 6-12 12" />
      <path d="m6 6 12 12" />
    </svg>
  ),
}

export function Toast({ type = 'info', message, onClose, duration = 5000 }: ToastProps) {
  useEffect(() => {
    const timer = window.setTimeout(onClose, duration)
    return () => window.clearTimeout(timer)
  }, [onClose, duration])

  return (
    <div className={`toast toast--${type}`} role="status" aria-live="polite">
      <span className="toast__icon" aria-hidden="true">
        {ICONS[type]}
      </span>
      <div className="toast__body">
        <p className="toast__title">{TITLES[type]}</p>
        <p className="toast__message">{message}</p>
      </div>
      <button type="button" className="toast__close" onClick={onClose} aria-label="Dismiss notification">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m18 6-12 12" />
          <path d="m6 6 12 12" />
        </svg>
      </button>
    </div>
  )
}
