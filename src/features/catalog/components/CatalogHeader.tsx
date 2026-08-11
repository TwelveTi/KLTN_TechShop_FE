import { Breadcrumb, type BreadcrumbItem } from '../../../shared/components/Breadcrumb'
import { Badge } from '../../../shared/components/Badge'
import { Icon } from '../../../shared/components/Icon'
import type { CatalogCategory } from '../types'

export interface CatalogHeaderProps {
  title: string
  subtitle?: string
  searchQuery?: string
  selectedCategory?: CatalogCategory
  totalCount: number
  isLoading?: boolean
  onNavigateHome: () => void
  onNavigateCatalog: () => void
  onClearSearch?: () => void
}

export function CatalogHeader({
  title,
  subtitle,
  searchQuery,
  selectedCategory,
  totalCount,
  isLoading = false,
  onNavigateHome,
  onNavigateCatalog,
  onClearSearch,
}: CatalogHeaderProps) {
  const breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Home', onClick: onNavigateHome },
    { label: 'Catalog', onClick: onNavigateCatalog },
  ]

  if (selectedCategory && selectedCategory.slug !== 'all') {
    breadcrumbItems.push({ label: selectedCategory.name })
  } else if (searchQuery) {
    breadcrumbItems.push({ label: `Search: "${searchQuery}"` })
  }

  return (
    <header className="ts-catalog-header">
      <Breadcrumb items={breadcrumbItems} />

      <div className="ts-catalog-header__content">
        <div className="ts-catalog-header__main">
          <div className="ts-catalog-header__kicker">
            <span className="ts-catalog-header__kicker-text">TechShop · Hardware & Systems</span>
            {searchQuery && (
              <Badge variant="accent" className="ts-catalog-header__search-badge">
                <Icon name="search" size={12} />
                <span>Query: "{searchQuery}"</span>
                {onClearSearch && (
                  <button
                    type="button"
                    onClick={onClearSearch}
                    className="ts-catalog-header__search-clear"
                    aria-label="Clear search query"
                    title="Clear search"
                  >
                    <Icon name="x" size={12} />
                  </button>
                )}
              </Badge>
            )}
          </div>

          <h1 className="ts-catalog-header__title">{title}</h1>

          {subtitle && <p className="ts-catalog-header__subtitle">{subtitle}</p>}
        </div>

        <div className="ts-catalog-header__meta" aria-live="polite">
          <span className="ts-catalog-header__count-badge">
            <span className="ts-catalog-header__count-dot" aria-hidden="true" />
            {isLoading ? (
              <span className="ts-catalog-header__count-text">Updating inventory…</span>
            ) : (
              <span className="ts-catalog-header__count-text tabular-nums">
                <strong>{totalCount}</strong> {totalCount === 1 ? 'product' : 'products'} available
              </span>
            )}
          </span>
        </div>
      </div>
    </header>
  )
}
