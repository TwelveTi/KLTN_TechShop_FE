import { pageRange, pageWindow } from '@shared/utils/pagination'
import { Icon } from '@shared/ui/Icon'

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

  const { from: startItem, to: endItem } = pageRange({
    page: currentPage,
    pageSize,
    total: totalItems,
  })

  // Thuật toán cửa sổ trang ở @shared/utils/pagination — dùng chung với
  // shared/ui/Pagination, và có test cho các ca biên (trước GĐ5 mỗi component
  // tự tính, và hai bản cho kết quả khác nhau ở biên).
  const renderPageButtons = () =>
    pageWindow({ page: currentPage, totalPages }).map((token, index) =>
      token === 'ellipsis' ? (
        <span key={`dots-${index}`} className="ts-admin-page-dots">
          …
        </span>
      ) : (
        <button
          key={token}
          type="button"
          className={`ts-admin-page-btn ${token === currentPage ? 'is-active' : ''}`}
          onClick={() => onPageChange(token)}
          aria-current={token === currentPage ? 'page' : undefined}
        >
          {token}
        </button>
      ),
    )

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
