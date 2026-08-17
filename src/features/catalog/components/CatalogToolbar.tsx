import { Icon } from '../../../shared/components/Icon'
import { Button } from '../../../shared/components/Button'
import type { CatalogFilters, SortOption, ViewMode } from '../types'

export interface CatalogToolbarProps {
  filters: CatalogFilters
  activeFilterCount: number
  selectedCategoryName?: string
  onOpenDrawer: () => void
  onChangeSort: (sort: SortOption) => void
  onChangeView: (view: ViewMode) => void
  onRemoveSearch?: () => void
  onRemoveCategory?: () => void
  onRemoveBrand: (brand: string) => void
  onRemovePrice: () => void
  onRemoveInStock: () => void
  onRemoveOnSale: () => void
  onRemoveRating: () => void
  onClearAllFilters: () => void
}

const SORT_OPTIONS: Array<{ value: SortOption; label: string }> = [
  { value: 'popular', label: 'Featured & Popular' },
  { value: 'newest', label: 'Newest Arrivals' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'name_asc', label: 'Name: A to Z' },
]

export function CatalogToolbar({
  filters,
  activeFilterCount,
  selectedCategoryName,
  onOpenDrawer,
  onChangeSort,
  onChangeView,
  onRemoveSearch,
  onRemoveCategory,
  onRemoveBrand,
  onRemovePrice,
  onRemoveInStock,
  onRemoveOnSale,
  onRemoveRating,
  onClearAllFilters,
}: CatalogToolbarProps) {
  const hasActivePrice = (filters.minPrice !== undefined && filters.minPrice > 0) || (filters.maxPrice !== undefined && filters.maxPrice > 0)
  const hasActiveFilters = activeFilterCount > 0

  return (
    <div className="ts-catalog-toolbar">
      <div className="ts-catalog-toolbar__main">
        {/* Mobile / Tablet Filter Button */}
        <button
          type="button"
          className={`ts-catalog-toolbar__drawer-btn ${hasActiveFilters ? 'has-active' : ''}`}
          onClick={onOpenDrawer}
          aria-label={`Open filters panel, ${activeFilterCount} active filters`}
        >
          <Icon name="sliders-horizontal" size={16} />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="ts-catalog-toolbar__drawer-badge tabular-nums">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* View Mode Switcher */}
        <div className="ts-catalog-toolbar__view-switch" role="group" aria-label="Product layout style">
          <button
            type="button"
            className={`ts-catalog-toolbar__view-btn ${filters.view === 'grid' ? 'is-active' : ''}`}
            onClick={() => onChangeView('grid')}
            aria-label="Grid layout"
            aria-pressed={filters.view === 'grid'}
            title="Grid view"
          >
            <Icon name="grid" size={16} />
          </button>
          <button
            type="button"
            className={`ts-catalog-toolbar__view-btn ${filters.view === 'list' ? 'is-active' : ''}`}
            onClick={() => onChangeView('list')}
            aria-label="List layout"
            aria-pressed={filters.view === 'list'}
            title="List view"
          >
            <Icon name="list" size={16} />
          </button>
        </div>

        {/* Sort Selector */}
        <div className="ts-catalog-toolbar__sort-wrap">
          <label htmlFor="catalog-sort-select" className="ts-catalog-toolbar__sort-label">
            Sort:
          </label>
          <div className="ts-catalog-toolbar__select-box">
            <select
              id="catalog-sort-select"
              className="ts-catalog-toolbar__select"
              value={filters.sort}
              onChange={(e) => onChangeSort(e.target.value as SortOption)}
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <Icon name="chevron-down" size={14} className="ts-catalog-toolbar__select-icon" />
          </div>
        </div>
      </div>

      {/* Active Filter Chips Bar */}
      {hasActiveFilters && (
        <div className="ts-catalog-toolbar__chips-bar" aria-label="Applied filters">
          <span className="ts-catalog-toolbar__chips-label">Active:</span>

          <div className="ts-catalog-toolbar__chips-list">
            {filters.q && (
              <button
                type="button"
                className="ts-catalog-toolbar__chip ts-catalog-toolbar__chip--query"
                onClick={onRemoveSearch}
                aria-label={`Remove search query: ${filters.q}`}
              >
                <Icon name="search" size={12} />
                <span>Search: "{filters.q}"</span>
                <Icon name="x" size={13} />
              </button>
            )}

            {filters.category && filters.category !== 'all' && (
              <button
                type="button"
                className="ts-catalog-toolbar__chip ts-catalog-toolbar__chip--category"
                onClick={onRemoveCategory}
                aria-label={`Remove category filter: ${selectedCategoryName || filters.category}`}
              >
                <span>Category: {selectedCategoryName || filters.category}</span>
                <Icon name="x" size={13} />
              </button>
            )}

            {filters.brands.map((b) => (
              <button
                type="button"
                key={b}
                className="ts-catalog-toolbar__chip"
                onClick={() => onRemoveBrand(b)}
                aria-label={`Remove brand filter: ${b}`}
              >
                <span>Brand: {b}</span>
                <Icon name="x" size={13} />
              </button>
            ))}

            {hasActivePrice && (
              <button
                type="button"
                className="ts-catalog-toolbar__chip"
                onClick={onRemovePrice}
                aria-label="Remove price filter"
              >
                <span>
                  Price: {filters.minPrice !== undefined ? `${Number(filters.minPrice).toLocaleString('vi-VN')} ₫` : '0 ₫'} –{' '}
                  {filters.maxPrice !== undefined ? `${Number(filters.maxPrice).toLocaleString('vi-VN')} ₫` : 'Any'}
                </span>
                <Icon name="x" size={13} />
              </button>
            )}

            {filters.inStock && (
              <button
                type="button"
                className="ts-catalog-toolbar__chip"
                onClick={onRemoveInStock}
                aria-label="Remove in-stock filter"
              >
                <span>In Stock Only</span>
                <Icon name="x" size={13} />
              </button>
            )}

            {filters.onSale && (
              <button
                type="button"
                className="ts-catalog-toolbar__chip"
                onClick={onRemoveOnSale}
                aria-label="Remove on-sale filter"
              >
                <span>Deals & Sale</span>
                <Icon name="x" size={13} />
              </button>
            )}

            {filters.rating && filters.rating > 0 && (
              <button
                type="button"
                className="ts-catalog-toolbar__chip"
                onClick={onRemoveRating}
                aria-label={`Remove rating filter ${filters.rating} stars`}
              >
                <span>{filters.rating}★ & Above</span>
                <Icon name="x" size={13} />
              </button>
            )}

            <Button
              variant="ghost"
              size="sm"
              className="ts-catalog-toolbar__clear-all-btn"
              onClick={onClearAllFilters}
            >
              Clear all
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
