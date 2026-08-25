import { useEffect } from 'react'
import { Icon } from '@shared/ui/Icon'
import { Button } from '@shared/ui/Button'
import { FilterSidebar, type FilterSidebarProps } from './FilterSidebar'

export interface FilterDrawerProps extends FilterSidebarProps {
  isOpen: boolean
  totalCount: number
  onClose: () => void
  onApply: () => void
}

export function FilterDrawer({
  selectedSlug,
  isOpen,
  totalCount,
  onClose,
  onApply,
  ...sidebarProps
}: FilterDrawerProps) {
  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Escape key closes drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) {
    return null
  }

  return (
    <div className="ts-filter-drawer-portal" role="dialog" aria-modal="true" aria-label="Filters Panel">
      {/* Backdrop */}
      <div className="ts-filter-drawer__backdrop" onClick={onClose} aria-hidden="true" />

      {/* Drawer Container */}
      <div className="ts-filter-drawer__sheet">
        {/* Header */}
        <div className="ts-filter-drawer__header">
          <div className="ts-filter-drawer__title-wrap">
            <Icon name="sliders-horizontal" size={18} />
            <h2 className="ts-filter-drawer__title">Filter & Refine</h2>
          </div>
          <button
            type="button"
            className="ts-filter-drawer__close-btn"
            onClick={onClose}
            aria-label="Close filters drawer"
          >
            <Icon name="x" size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="ts-filter-drawer__content">
          <FilterSidebar
      selectedSlug={selectedSlug} {...sidebarProps} className="ts-filter-sidebar--drawer" />
        </div>

        {/* Sticky Footer */}
        <div className="ts-filter-drawer__footer">
          <Button
            variant="secondary"
            size="md"
            onClick={sidebarProps.onClearFilters}
            className="ts-filter-drawer__reset-btn"
          >
            Clear all
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() => {
              onApply()
              onClose()
            }}
            className="ts-filter-drawer__apply-btn"
          >
            Show {totalCount} {totalCount === 1 ? 'result' : 'results'}
          </Button>
        </div>
      </div>
    </div>
  )
}
