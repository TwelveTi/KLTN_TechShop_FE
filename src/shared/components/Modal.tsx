import { useEffect, type ReactNode } from 'react'
import { Icon } from './Icon'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  footer?: ReactNode
  maxWidth?: string
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = '560px',
}: ModalProps) {
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const titleId = title ? `ts-modal-title-${title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}` : undefined

  return (
    <div className="ts-modal-overlay" onClick={onClose} role="presentation">
      <div
        className="ts-modal-container"
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-label={title ? undefined : 'Dialog'}
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
