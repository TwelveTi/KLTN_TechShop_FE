import { useState, useRef, useEffect, type ReactNode } from 'react'

export interface DropdownItem {
  id: string
  label: string
  icon?: ReactNode
  danger?: boolean
  onClick: () => void
}

export interface DropdownProps {
  trigger: ReactNode
  items: DropdownItem[]
  align?: 'left' | 'right'
}

export function Dropdown({ trigger, items, align = 'right' }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  return (
    <div className="ts-dropdown-wrap" ref={menuRef}>
      <div onClick={() => setIsOpen((prev) => !prev)} role="presentation">
        {trigger}
      </div>

      {isOpen && (
        <div
          className={`ts-dropdown-menu ts-dropdown-menu--${align}`}
          role="menu"
        >
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`ts-dropdown-item ${item.danger ? 'ts-dropdown-item--danger' : ''}`}
              onClick={() => {
                setIsOpen(false)
                item.onClick()
              }}
              role="menuitem"
            >
              {item.icon && <span className="ts-dropdown-item__icon">{item.icon}</span>}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
