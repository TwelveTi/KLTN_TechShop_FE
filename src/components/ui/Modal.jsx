import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

// Hộp thoại duy nhất của app. Escape để đóng, khoá cuộn nền, trả focus về
// chỗ vừa bấm, và bấm ra ngoài thì đóng.
export default function Modal({ open, onClose, title, size = 'md', children }) {
  const triggerRef = useRef(null)
  const panelRef = useRef(null)

  useEffect(() => {
    if (!open) return

    triggerRef.current = document.activeElement
    document.body.style.overflow = 'hidden'
    panelRef.current?.focus()

    function onKeyDown(event) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
      triggerRef.current?.focus?.()
    }
  }, [open, onClose])

  if (!open) return null

  const width = size === 'lg' ? 'max-w-3xl' : size === 'sm' ? 'max-w-md' : 'max-w-xl'

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-neutral-950/50 p-4 sm:p-8"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={`w-full ${width} rounded-lg border border-line bg-raised shadow-lg`}
      >
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 className="text-h4">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="rounded-xs p-1 text-muted hover:bg-sunken hover:text-heading"
          >
            <X size={18} aria-hidden />
          </button>
        </div>

        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}
