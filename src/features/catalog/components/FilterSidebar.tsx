import { useState, useEffect } from 'react'
import { Icon } from '../../../shared/components/Icon'
import { Button } from '../../../shared/components/Button'
import type { CatalogBrand, CatalogCategory, CatalogFilters } from '../types'

export interface FilterSidebarProps {
  categories: CatalogCategory[]
  brands: CatalogBrand[]
  filters: CatalogFilters
  onSelectCategory: (slug: string) => void
  onToggleBrand: (slug: string) => void
  onSetPriceRange: (min?: number, max?: number) => void
  onToggleInStock: () => void
  onToggleOnSale: () => void
  onSetRating: (rating?: number) => void
  onClearFilters: () => void
  className?: string
}

const PRICE_PRESETS = [
  { label: 'Under $100', min: 0, max: 100 },
  { label: '$100 – $500', min: 100, max: 500 },
  { label: '$500 – $1,500', min: 500, max: 1500 },
  { label: 'Over $1,500', min: 1500, max: 5000 },
]

export function FilterSidebar({
  categories,
  brands,
  filters,
  onSelectCategory,
  onToggleBrand,
  onSetPriceRange,
  onToggleInStock,
  onToggleOnSale,
  onSetRating,
  onClearFilters,
  className = '',
}: FilterSidebarProps) {
  const [brandSearch, setBrandSearch] = useState('')
  const [customMin, setCustomMin] = useState<string>(filters.minPrice !== undefined ? String(filters.minPrice) : '')
  const [customMax, setCustomMax] = useState<string>(filters.maxPrice !== undefined ? String(filters.maxPrice) : '')

  useEffect(() => {
    setCustomMin(filters.minPrice !== undefined ? String(filters.minPrice) : '')
    setCustomMax(filters.maxPrice !== undefined ? String(filters.maxPrice) : '')
  }, [filters.minPrice, filters.maxPrice])

  const filteredBrands = brands.filter((b) =>
    b.name.toLowerCase().includes(brandSearch.toLowerCase())
  )

  const handleApplyCustomPrice = (e: React.FormEvent) => {
    e.preventDefault()
    const minVal = customMin ? Number(customMin) : undefined
    const maxVal = customMax ? Number(customMax) : undefined
    onSetPriceRange(minVal, maxVal)
  }

  const isPresetActive = (min: number, max: number) => {
    return filters.minPrice === min && filters.maxPrice === max
  }

  return (
    <aside className={`ts-filter-sidebar ${className}`} aria-label="Product Facets and Filters">
      <div className="ts-filter-sidebar__header">
        <div className="ts-filter-sidebar__title-wrap">
          <Icon name="sliders-horizontal" size={16} className="ts-filter-sidebar__header-icon" />
          <h2 className="ts-filter-sidebar__title">Filter & Refine</h2>
        </div>
        <button
          type="button"
          className="ts-filter-sidebar__reset-btn"
          onClick={onClearFilters}
          title="Reset all filters"
        >
          Reset
        </button>
      </div>

      <div className="ts-filter-sidebar__groups">
        {/* Category Facet Group */}
        <div className="ts-facet-group">
          <h3 className="ts-facet-group__title">Categories</h3>
          <ul className="ts-facet-group__category-list">
            {categories.map((cat) => {
              const isActive = filters.category === cat.slug || (!filters.category && cat.slug === 'all')

              return (
                <li key={cat.id} className="ts-facet-group__category-item">
                  <button
                    type="button"
                    className={`ts-facet-group__category-btn ${isActive ? 'is-active' : ''}`}
                    onClick={() => onSelectCategory(cat.slug)}
                    aria-current={isActive ? 'true' : undefined}
                  >
                    <span className="ts-facet-group__category-name">{cat.name}</span>
                    {cat.count !== undefined && (
                      <span className="ts-facet-group__count tabular-nums">({cat.count})</span>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>

        {/* Price Range Facet Group */}
        <div className="ts-facet-group">
          <h3 className="ts-facet-group__title">Price Range</h3>

          {/* Quick presets */}
          <div className="ts-facet-group__presets">
            {PRICE_PRESETS.map((preset) => {
              const active = isPresetActive(preset.min, preset.max)

              return (
                <button
                  type="button"
                  key={preset.label}
                  className={`ts-facet-group__preset-chip ${active ? 'is-active' : ''}`}
                  onClick={() => {
                    if (active) {
                      onSetPriceRange(undefined, undefined)
                      setCustomMin('')
                      setCustomMax('')
                    } else {
                      onSetPriceRange(preset.min, preset.max)
                      setCustomMin(String(preset.min))
                      setCustomMax(String(preset.max))
                    }
                  }}
                  aria-pressed={active}
                >
                  {preset.label}
                </button>
              )
            })}
          </div>

          {/* Custom Min / Max Inputs */}
          <form className="ts-facet-group__price-inputs" onSubmit={handleApplyCustomPrice}>
            <div className="ts-facet-group__price-field">
              <span className="ts-facet-group__currency">$</span>
              <input
                type="number"
                min="0"
                placeholder="Min"
                className="ts-facet-group__input tabular-nums"
                value={customMin}
                onChange={(e) => setCustomMin(e.target.value)}
                aria-label="Minimum price in dollars"
              />
            </div>
            <span className="ts-facet-group__price-sep">–</span>
            <div className="ts-facet-group__price-field">
              <span className="ts-facet-group__currency">$</span>
              <input
                type="number"
                min="0"
                placeholder="Max"
                className="ts-facet-group__input tabular-nums"
                value={customMax}
                onChange={(e) => setCustomMax(e.target.value)}
                aria-label="Maximum price in dollars"
              />
            </div>
            <Button type="submit" variant="secondary" size="sm" className="ts-facet-group__price-btn">
              Go
            </Button>
          </form>
        </div>

        {/* Brand Facet Group */}
        <div className="ts-facet-group">
          <div className="ts-facet-group__title-row">
            <h3 className="ts-facet-group__title">Brands</h3>
            {filters.brands.length > 0 && (
              <span className="ts-facet-group__badge tabular-nums">{filters.brands.length}</span>
            )}
          </div>

          {/* Brand search filter */}
          <div className="ts-facet-group__search-wrap">
            <Icon name="search" size={14} className="ts-facet-group__search-icon" />
            <input
              type="text"
              placeholder="Search brands…"
              className="ts-facet-group__search-input"
              value={brandSearch}
              onChange={(e) => setBrandSearch(e.target.value)}
              aria-label="Filter brands by name"
            />
          </div>

          <div className="ts-facet-group__checkbox-list">
            {filteredBrands.map((brand) => {
              const isChecked = filters.brands.includes(brand.slug)

              return (
                <label key={brand.id} className="ts-facet-group__checkbox-label">
                  <input
                    type="checkbox"
                    className="ts-facet-group__checkbox"
                    checked={isChecked}
                    onChange={() => onToggleBrand(brand.slug)}
                  />
                  <span className="ts-facet-group__custom-box" aria-hidden="true">
                    {isChecked && <Icon name="check" size={12} />}
                  </span>
                  <span className="ts-facet-group__label-text">{brand.name}</span>
                  {brand.count !== undefined && (
                    <span className="ts-facet-group__count tabular-nums">({brand.count})</span>
                  )}
                </label>
              )
            })}
          </div>
        </div>

        {/* Availability & Deals Facet Group */}
        <div className="ts-facet-group">
          <h3 className="ts-facet-group__title">Availability & Deals</h3>
          <div className="ts-facet-group__toggles">
            <label className="ts-facet-group__toggle-row">
              <input
                type="checkbox"
                className="ts-facet-group__checkbox"
                checked={Boolean(filters.inStock)}
                onChange={onToggleInStock}
              />
              <span className="ts-facet-group__custom-box" aria-hidden="true">
                {filters.inStock && <Icon name="check" size={12} />}
              </span>
              <span className="ts-facet-group__label-text">In stock items only</span>
            </label>

            <label className="ts-facet-group__toggle-row">
              <input
                type="checkbox"
                className="ts-facet-group__checkbox"
                checked={Boolean(filters.onSale)}
                onChange={onToggleOnSale}
              />
              <span className="ts-facet-group__custom-box" aria-hidden="true">
                {filters.onSale && <Icon name="check" size={12} />}
              </span>
              <span className="ts-facet-group__label-text">Discounted deals only</span>
            </label>
          </div>
        </div>

        {/* Customer Rating Facet Group */}
        <div className="ts-facet-group">
          <h3 className="ts-facet-group__title">Customer Rating</h3>
          <div className="ts-facet-group__rating-list">
            {[4.5, 4.0, 3.5].map((stars) => {
              const isSelected = filters.rating === stars

              return (
                <button
                  type="button"
                  key={stars}
                  className={`ts-facet-group__rating-btn ${isSelected ? 'is-active' : ''}`}
                  onClick={() => onSetRating(isSelected ? undefined : stars)}
                  aria-pressed={isSelected}
                >
                  <div className="ts-facet-group__rating-stars">
                    <Icon name="star" size={14} className="ts-facet-group__star-filled" />
                    <span className="tabular-nums">{stars.toFixed(1)}</span>
                    <span className="ts-facet-group__rating-text">& above</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </aside>
  )
}
