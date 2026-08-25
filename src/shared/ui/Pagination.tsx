import { pageWindow } from '@shared/utils/pagination'
import { Icon } from './Icon'
import { Button } from './Button'

export type PaginationVariant = 'loadMore' | 'numbered' | 'loadMore+numbered'

export interface PaginationProps {
  variant?: PaginationVariant
  page: number
  pageSize?: number
  total: number
  itemCount?: number
  totalPages?: number
  onPageChange?: (page: number) => void
  onLoadMore?: () => void
  isLoading?: boolean
  className?: string
}

export function Pagination({
  variant = 'numbered',
  page = 1,
  pageSize = 15,
  total = 0,
  itemCount,
  totalPages: propTotalPages,
  onPageChange,
  onLoadMore,
  isLoading = false,
  className = '',
}: PaginationProps) {
  const calculatedTotalPages = propTotalPages !== undefined ? propTotalPages : Math.max(1, Math.ceil(total / pageSize))
  const hasMore = page < calculatedTotalPages
  const displayedCount = itemCount !== undefined ? itemCount : Math.min(total, page * pageSize)
  const progressCount = Math.min(total, (page - 1) * pageSize + displayedCount)

  // Thuật toán cửa sổ trang ở @shared/utils/pagination — dùng chung với
  // AdminPagination, và có test cho các ca biên.
  const getPageNumbers = () => pageWindow({ page, totalPages: calculatedTotalPages })

  if (total <= 0) {
    return null
  }

  const showLoadMore = (variant === 'loadMore' || variant === 'loadMore+numbered') && hasMore
  const showNumbered = variant === 'numbered' || variant === 'loadMore+numbered'

  return (
    <div className={`ts-pagination ${className}`} aria-busy={isLoading}>
      {/* Progress counter */}
      <div className="ts-pagination__progress" aria-live="polite">
        <span className="ts-pagination__count tabular-nums">
          Showing <strong>{displayedCount}</strong> of <strong>{total}</strong> products
        </span>
        <div
          className="ts-pagination__bar"
          role="progressbar"
          aria-valuenow={progressCount}
          aria-valuemin={0}
          aria-valuemax={total}
        >
          <div
            className="ts-pagination__bar-fill"
            style={{ width: `${total > 0 ? (progressCount / total) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Load more button */}
      {showLoadMore && (
        <div className="ts-pagination__load-more-wrap">
          <Button
            variant="secondary"
            size="lg"
            onClick={onLoadMore}
            isLoading={isLoading}
            disabled={isLoading}
            className="ts-pagination__load-more-btn"
            trailingIcon={<Icon name="chevron-down" size={18} />}
            aria-label={`Load more products, showing ${displayedCount} of ${total}`}
          >
            {isLoading ? 'Loading more products…' : 'Load more products'}
          </Button>
        </div>
      )}

      {/* Numbered pagination */}
      {showNumbered && calculatedTotalPages > 1 && (
        <nav className="ts-pagination__nav" aria-label="Pagination Navigation">
          <button
            type="button"
            className="ts-pagination__btn ts-pagination__btn--prev"
            onClick={() => onPageChange?.(page - 1)}
            disabled={page <= 1 || isLoading}
            aria-label="Go to previous page"
          >
            <Icon name="chevron-left" size={16} />
            <span className="ts-pagination__btn-label">Previous</span>
          </button>

          <div className="ts-pagination__pages">
            {getPageNumbers().map((p, idx) => {
              if (p === 'ellipsis') {
                return (
                  <span key={`ellipsis-${idx}`} className="ts-pagination__ellipsis" aria-hidden="true">
                    …
                  </span>
                )
              }

              const isCurrent = p === page
              return (
                <button
                  type="button"
                  key={p}
                  className={`ts-pagination__page-btn tabular-nums ${isCurrent ? 'is-active' : ''}`}
                  onClick={() => onPageChange?.(p)}
                  disabled={isLoading}
                  aria-current={isCurrent ? 'page' : undefined}
                  aria-label={`Page ${p}`}
                >
                  {p}
                </button>
              )
            })}
          </div>

          <button
            type="button"
            className="ts-pagination__btn ts-pagination__btn--next"
            onClick={() => onPageChange?.(page + 1)}
            disabled={page >= calculatedTotalPages || isLoading}
            aria-label="Go to next page"
          >
            <span className="ts-pagination__btn-label">Next</span>
            <Icon name="chevron-right" size={16} />
          </button>
        </nav>
      )}
    </div>
  )
}
