import type { ViewMode } from '../types'

export interface CatalogSkeletonProps {
  count?: number
  view?: ViewMode
}

export function CatalogSkeleton({ count = 8, view = 'grid' }: CatalogSkeletonProps) {
  const items = Array.from({ length: count }, (_, i) => i)

  return (
    <div
      className={`ts-catalog-skeleton ${view === 'list' ? 'ts-catalog-skeleton--list' : 'ts-catalog-skeleton--grid'}`}
      aria-hidden="true"
    >
      {items.map((key) => (
        <div key={key} className="ts-skeleton-card">
          <div className="ts-skeleton-card__media" />
          <div className="ts-skeleton-card__body">
            <div className="ts-skeleton-card__line ts-skeleton-card__line--cat" />
            <div className="ts-skeleton-card__line ts-skeleton-card__line--title" />
            <div className="ts-skeleton-card__line ts-skeleton-card__line--specs" />
            <div className="ts-skeleton-card__footer">
              <div className="ts-skeleton-card__line ts-skeleton-card__line--price" />
              <div className="ts-skeleton-card__btn" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
