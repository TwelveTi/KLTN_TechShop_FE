import { Icon } from '../../../shared/components/Icon'
import { Button } from '../../../shared/components/Button'

export interface CatalogEmptyStateProps {
  type: 'search' | 'filter' | 'category'
  searchQuery?: string
  onClearFilters: () => void
  onBrowseAll: () => void
}

export function CatalogEmptyState({
  type,
  searchQuery,
  onClearFilters,
  onBrowseAll,
}: CatalogEmptyStateProps) {
  if (type === 'search') {
    return (
      <div className="ts-catalog-empty" role="status">
        <div className="ts-catalog-empty__icon-wrap">
          <Icon name="search" size={40} className="ts-catalog-empty__icon" />
        </div>
        <h3 className="ts-catalog-empty__title">
          No results for &ldquo;{searchQuery || 'your query'}&rdquo;
        </h3>
        <p className="ts-catalog-empty__desc">
          Check the spelling, try fewer keywords, or explore our broad hardware categories.
        </p>
        <div className="ts-catalog-empty__actions">
          <Button variant="primary" size="md" onClick={onBrowseAll}>
            Browse all products
          </Button>
          <Button variant="secondary" size="md" onClick={onClearFilters}>
            Clear search filters
          </Button>
        </div>
      </div>
    )
  }

  if (type === 'filter') {
    return (
      <div className="ts-catalog-empty" role="status">
        <div className="ts-catalog-empty__icon-wrap">
          <Icon name="sliders-horizontal" size={40} className="ts-catalog-empty__icon" />
        </div>
        <h3 className="ts-catalog-empty__title">No products match these filters</h3>
        <p className="ts-catalog-empty__desc">
          Try loosening your price bounds or removing specific brand and availability filters.
        </p>
        <div className="ts-catalog-empty__actions">
          <Button variant="primary" size="md" onClick={onClearFilters}>
            Clear all filters
          </Button>
          <Button variant="secondary" size="md" onClick={onBrowseAll}>
            Reset to all catalog
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="ts-catalog-empty" role="status">
      <div className="ts-catalog-empty__icon-wrap">
        <Icon name="package" size={40} className="ts-catalog-empty__icon" />
      </div>
      <h3 className="ts-catalog-empty__title">Nothing in this category right now</h3>
      <p className="ts-catalog-empty__desc">
        We&rsquo;re currently updating this department with new 2026 hardware inventory.
      </p>
      <div className="ts-catalog-empty__actions">
        <Button variant="primary" size="md" onClick={onBrowseAll}>
          Browse all categories
        </Button>
      </div>
    </div>
  )
}
