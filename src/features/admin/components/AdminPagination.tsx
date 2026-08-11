import { Icon } from '../../../shared/components/Icon'

interface AdminPaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (size: number) => void
}

export function AdminPagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: AdminPaginationProps) {
  if (totalItems === 0) return null

  const startItem = Math.min((currentPage - 1) * pageSize + 1, totalItems)
  const endItem = Math.min(currentPage * pageSize, totalItems)

  const renderPageButtons = () => {
    const buttons = []
    const maxButtons = 5
    let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2))
    let endPage = Math.min(totalPages, startPage + maxButtons - 1)

    if (endPage - startPage + 1 < maxButtons) {
      startPage = Math.max(1, endPage - maxButtons + 1)
    }

    if (startPage > 1) {
      buttons.push(
        <button
          key={1}
          type="button"
          className="ts-admin-page-btn"
          onClick={() => onPageChange(1)}
        >
          1
        </button>,
      )
      if (startPage > 2) {
        buttons.push(
          <span key="dots-start" className="ts-admin-page-dots">
            …
          </span>,
        )
      }
    }

    for (let page = startPage; page <= endPage; page++) {
      buttons.push(
        <button
          key={page}
          type="button"
          className={`ts-admin-page-btn ${page === currentPage ? 'is-active' : ''}`}
          onClick={() => onPageChange(page)}
          aria-current={page === currentPage ? 'page' : undefined}
        >
          {page}
        </button>,
      )
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        buttons.push(
          <span key="dots-end" className="ts-admin-page-dots">
            …
          </span>,
        )
      }
      buttons.push(
        <button
          key={totalPages}
          type="button"
          className="ts-admin-page-btn"
          onClick={() => onPageChange(totalPages)}
        >
          {totalPages}
        </button>,
      )
    }

    return buttons
  }

  return (
    <div className="ts-admin-pagination">
      <div className="ts-admin-pagination__info">
        <span>
          Showing <strong className="ts-tabular">{startItem}</strong>–<strong className="ts-tabular">{endItem}</strong> of{' '}
          <strong className="ts-tabular">{totalItems}</strong> entries
        </span>

        {onPageSizeChange && (
          <div className="ts-admin-pagination__size-select">
            <span>Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              aria-label="Items per page"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        )}
      </div>

      <div className="ts-admin-pagination__controls">
        <button
          type="button"
          className="ts-admin-page-arrow"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          aria-label="Previous page"
        >
          <Icon name="chevron-left" size={16} />
        </button>

        <div className="ts-admin-pagination__pages">{renderPageButtons()}</div>

        <button
          type="button"
          className="ts-admin-page-arrow"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          aria-label="Next page"
        >
          <Icon name="chevron-right" size={16} />
        </button>
      </div>
    </div>
  )
}
