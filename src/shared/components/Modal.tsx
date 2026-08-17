import { useEffect, useRef, type ReactNode } from 'react'
import { Icon } from './Icon'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  footer?: ReactNode
  maxWidth?: string
  /** When false, clicking the backdrop does not close (use for destructive confirms). Default true. */
  closeOnBackdrop?: boolean
}

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = '560px',
  closeOnBackdrop = true,
}: ModalProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!isOpen) return

    previouslyFocused.current = document.activeElement as HTMLElement | null

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }

      // Focus trap: keep Tab cycling inside the dialog.
      if (e.key === 'Tab' && containerRef.current) {
        const focusables = Array.from(
          containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
        ).filter((el) => el.offsetParent !== null)
        if (focusables.length === 0) return
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    // Move focus into the dialog once mounted.
    const focusTimer = window.setTimeout(() => {
      const target =
        containerRef.current?.querySelector<HTMLElement>(FOCUSABLE) ?? containerRef.current
      target?.focus()
    }, 0)

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
      window.clearTimeout(focusTimer)
      // Return focus to whatever opened the dialog.
      previouslyFocused.current?.focus?.()
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const titleId = title ? `ts-modal-title-${title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}` : undefined

  return (
    <div
      className="ts-modal-overlay"
      onClick={closeOnBackdrop ? onClose : undefined}
      role="presentation"
    >
      <div
        ref={containerRef}
        className="ts-modal-container"
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-label={title ? undefined : 'Dialog'}
        tabIndex={-1}
      >
        {title && (
          <div className="ts-modal-header">
            <h3 className="ts-modal-title" id={titleId}>{title}</h3>
            <button
              type="button"
              className="ts-modal-close-btn"
              onClick={onClose}
              aria-label="Close dialog"
              title="Close (Esc)"
            >
              <Icon name="x" size={18} />
            </button>
          </div>
        )}

        <div className="ts-modal-body">{children}</div>

        {footer && <div className="ts-modal-footer">{footer}</div>}
      </div>
    </div>
  )
}
