import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { ProductCard, type ProductItem } from '../../../shared/components/ProductCard'
import { Pagination } from '../../../shared/components/Pagination'
import { CatalogHeader } from '../components/CatalogHeader'
import { CategoryPills } from '../components/CategoryPills'
import { CatalogToolbar } from '../components/CatalogToolbar'
import { FilterSidebar } from '../components/FilterSidebar'
import { FilterDrawer } from '../components/FilterDrawer'
import { CompareDrawer } from '../components/CompareDrawer'
import { CatalogEmptyState } from '../components/CatalogEmptyState'
import { CatalogSkeleton } from '../components/CatalogSkeleton'
import { catalogApi, CATALOG_CATEGORIES, categoryTokensMatch } from '../api/catalogApi'
import { useCart } from '../../cart/context/CartContext'
import { useToast } from '../../../shared/components/Toast'
import type {
  CatalogFilters,
  CatalogResponse,
  SortOption,
  ViewMode,
} from '../types'
import '../styles/catalog.css'

export interface CatalogPageProps {
  onNavigateHome: () => void
  onOpenProduct?: (productId: string) => void
  onAddToCartSuccess?: (product: ProductItem) => void
}

// Parse initial filters from URL query parameters
function parseFiltersFromUrl(): CatalogFilters {
  const params = new URLSearchParams(window.location.search)

  const brandsParam = params.get('brand') || params.get('brands')
  const brands = brandsParam ? brandsParam.split(',').filter(Boolean) : []

  const minPrice = params.get('minPrice') ? Number(params.get('minPrice')) : undefined
  const maxPrice = params.get('maxPrice') ? Number(params.get('maxPrice')) : undefined
  const inStock = params.get('inStock') === '1' || params.get('inStock') === 'true'
  const onSale = params.get('onSale') === '1' || params.get('onSale') === 'true'
  const rating = params.get('rating') ? Number(params.get('rating')) : undefined
  const sort = (params.get('sort') as SortOption) || 'popular'
  const page = Math.max(1, Number(params.get('page')) || 1)
  const view = (params.get('view') as ViewMode) || 'grid'
  const category = params.get('category') || 'all'
  const q = params.get('q') || ''

  return {
    q,
    category,
    brands,
    minPrice,
    maxPrice,
    inStock,
    onSale,
    rating,
    sort,
    page,
    limit: 15,
    view,
  }
}

// Synchronize filters object into URL query string
function syncFiltersToUrl(filters: CatalogFilters) {
  const pathname = window.location.pathname
  const isCatalogPath =
    pathname.startsWith('/catalog') ||
    pathname.startsWith('/shop') ||
    pathname.startsWith('/search') ||
    pathname === '/products'

  if (!isCatalogPath) {
    return
  }

  const params = new URLSearchParams()

  if (filters.q && filters.q.trim()) {
    params.set('q', filters.q.trim())
  }
  if (filters.category && filters.category !== 'all') {
    params.set('category', filters.category)
  }
  if (filters.brands && filters.brands.length > 0) {
    params.set('brand', filters.brands.join(','))
  }
  if (filters.minPrice !== undefined && filters.minPrice > 0) {
    params.set('minPrice', String(filters.minPrice))
  }
  if (filters.maxPrice !== undefined && filters.maxPrice > 0) {
    params.set('maxPrice', String(filters.maxPrice))
  }
  if (filters.inStock) {
    params.set('inStock', '1')
  }
  if (filters.onSale) {
    params.set('onSale', '1')
  }
  if (filters.rating) {
    params.set('rating', String(filters.rating))
  }
  if (filters.sort && filters.sort !== 'popular') {
    params.set('sort', filters.sort)
  }
  if (filters.page > 1) {
    params.set('page', String(filters.page))
  }
  if (filters.view && filters.view !== 'grid') {
    params.set('view', filters.view)
  }

  const queryStr = params.toString()
  const newPath = queryStr ? `${pathname}?${queryStr}` : pathname

  if (`${window.location.pathname}${window.location.search}` !== newPath) {
    window.history.replaceState({}, '', newPath)
    // Tell the app shell the category/filters changed so the header's
    // department bar highlight re-syncs with the real current category.
    window.dispatchEvent(new Event('techshop:catalog-changed'))
  }
}

export function CatalogPage({
  onNavigateHome,
  onOpenProduct,
  onAddToCartSuccess,
}: CatalogPageProps) {
  const { addToCart: addCartItem } = useCart()
  const { showToast } = useToast()
  const [filters, setFilters] = useState<CatalogFilters>(() => parseFiltersFromUrl())
  const [catalogData, setCatalogData] = useState<CatalogResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [comparedItems, setComparedItems] = useState<ProductItem[]>([])

  // Re-parse filters from the URL on Back/Forward and on app-shell navigation
  // (e.g. clicking a department chip in the header while already on the catalog).
  useEffect(() => {
    const handleLocation = () => {
      setFilters(parseFiltersFromUrl())
    }
    window.addEventListener('popstate', handleLocation)
    window.addEventListener('techshop:navigate', handleLocation)
    return () => {
      window.removeEventListener('popstate', handleLocation)
      window.removeEventListener('techshop:navigate', handleLocation)
    }
  }, [])

  // Sync filters to URL whenever state changes
  useEffect(() => {
    syncFiltersToUrl(filters)
  }, [filters])

  // Fetch catalog data when the *query* filters change. `view` is a purely
  // client-side concern, so it is deliberately excluded — toggling grid/list
  // must never trigger a network round-trip.
  const requestSeq = useRef(0)
  const fetchProducts = useCallback(async (currentFilters: CatalogFilters) => {
    const seq = ++requestSeq.current
    setIsLoading(true)
    try {
      const data = await catalogApi.getCatalog(currentFilters)
      // Last-write-wins: ignore a slow response superseded by a newer request.
      if (seq === requestSeq.current) {
        setCatalogData(data)
      }
    } finally {
      if (seq === requestSeq.current) {
        setIsLoading(false)
      }
    }
  }, [])

  const fetchKey = useMemo(
    () =>
      JSON.stringify({
        q: filters.q,
        category: filters.category,
        brands: filters.brands,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        inStock: filters.inStock,
        onSale: filters.onSale,
        rating: filters.rating,
        sort: filters.sort,
        page: filters.page,
        limit: filters.limit,
      }),
    [
      filters.q,
      filters.category,
      filters.brands,
      filters.minPrice,
      filters.maxPrice,
      filters.inStock,
      filters.onSale,
      filters.rating,
      filters.sort,
      filters.page,
      filters.limit,
    ],
  )

  useEffect(() => {
    fetchProducts(filters)
    // filters (incl. view) is intentionally read fresh; the query subset is in fetchKey.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchKey, fetchProducts])

  // Category selection handler
  const handleSelectCategory = (slug: string) => {
    setFilters((prev) => ({
      ...prev,
      category: slug,
      page: 1,
    }))
  }

  // Brand toggle handler
  const handleToggleBrand = (brandSlug: string) => {
    setFilters((prev) => {
      const exists = prev.brands.includes(brandSlug)
      const nextBrands = exists
        ? prev.brands.filter((b) => b !== brandSlug)
        : [...prev.brands, brandSlug]

      return {
        ...prev,
        brands: nextBrands,
        page: 1,
      }
    })
  }

  // Price range handler
  const handleSetPriceRange = (min?: number, max?: number) => {
    setFilters((prev) => ({
      ...prev,
      minPrice: min,
      maxPrice: max,
      page: 1,
    }))
  }

  // Toggle inStock
  const handleToggleInStock = () => {
    setFilters((prev) => ({
      ...prev,
      inStock: !prev.inStock,
      page: 1,
    }))
  }

  // Toggle onSale
  const handleToggleOnSale = () => {
    setFilters((prev) => ({
      ...prev,
      onSale: !prev.onSale,
      page: 1,
    }))
  }

  // Set rating
  const handleSetRating = (rating?: number) => {
    setFilters((prev) => ({
      ...prev,
      rating,
      page: 1,
    }))
  }

  // Sort change
  const handleChangeSort = (sort: SortOption) => {
    setFilters((prev) => ({
      ...prev,
      sort,
      page: 1,
    }))
  }

  // View mode change
  const handleChangeView = (view: ViewMode) => {
    setFilters((prev) => ({
      ...prev,
      view,
    }))
  }

  // Clear all filters
  const handleClearAllFilters = () => {
    setFilters((prev) => ({
      ...prev,
      q: '',
      category: 'all',
      brands: [],
      minPrice: undefined,
      maxPrice: undefined,
      inStock: false,
      onSale: false,
      rating: undefined,
      page: 1,
    }))
  }

  // Pagination page change
  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({
      ...prev,
      page: newPage,
    }))
    window.scrollTo({ top: 180, behavior: 'smooth' })
  }

  // Pagination load more
  const handleLoadMore = () => {
    setFilters((prev) => ({
      ...prev,
      page: prev.page + 1,
    }))
  }

  // Wishlist toggle
  const handleToggleSave = (productId: string) => {
    setSavedIds((prev) => {
      const next = new Set(prev)
      if (next.has(productId)) {
        next.delete(productId)
      } else {
        next.add(productId)
      }
      return next
    })
  }

  // Comparison toggle
  const handleToggleCompare = (product: ProductItem) => {
    setComparedItems((prev) => {
      const exists = prev.some((item) => (item.id || item.name) === (product.id || product.name))
      if (exists) {
        return prev.filter((item) => (item.id || item.name) !== (product.id || product.name))
      }
      if (prev.length >= 4) {
        return [...prev.slice(1), product]
      }
      return [...prev, product]
    })
  }

  // Add to cart feedback
  const handleAddToCart = (product: ProductItem) => {
    addCartItem(product)
    onAddToCartSuccess?.(product)
    showToast(`Added ${product.name} to cart`, { variant: 'success' })
  }

  // Active filter count computation
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.q && filters.q.trim()) count += 1
    if (filters.brands.length > 0) count += filters.brands.length
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) count += 1
    if (filters.inStock) count += 1
    if (filters.onSale) count += 1
    if (filters.rating) count += 1
    if (filters.category && filters.category !== 'all') count += 1
    return count
  }, [filters])

  // Selected category object
  const selectedCategoryObj = useMemo(() => {
    const cats = catalogData?.categories || CATALOG_CATEGORIES
    return (
      cats.find((c) => c.slug === filters.category) ||
      // Tolerant fallback so a plural/curated token (e.g. "laptops") still
      // resolves to the real "Laptop" category for the title / active chip.
      cats.find(
        (c) => categoryTokensMatch(c.slug, filters.category) || categoryTokensMatch(c.name, filters.category),
      ) ||
      cats[0]
    )
  }, [catalogData, filters.category])

  // Header Title & Subtitle computation
  const pageTitle = useMemo(() => {
    if (filters.q && filters.q.trim()) {
      return `Results for "${filters.q.trim()}"`
    }
    if (selectedCategoryObj && selectedCategoryObj.slug !== 'all') {
      return selectedCategoryObj.name
    }
    return 'The TechShop Marketplace'
  }, [filters.q, selectedCategoryObj])

  const pageSubtitle = useMemo(() => {
    if (filters.q && filters.q.trim()) {
      return 'Showing verified hardware matches from our catalog.'
    }
    if (selectedCategoryObj && selectedCategoryObj.description) {
      return selectedCategoryObj.description
    }
    return 'Explore curated ultrabooks, smartphones, custom peripherals, and high-performance workstation hardware.'
  }, [filters.q, selectedCategoryObj])

  const totalItems = catalogData?.pagination.total || 0
  const products = catalogData?.items || []

  // Check empty state type
  const emptyStateType = useMemo((): 'search' | 'filter' | 'category' | null => {
    if (!isLoading && products.length === 0) {
      if (filters.q) return 'search'
      if (activeFilterCount > 0) return 'filter'
      return 'category'
    }
    return null
  }, [isLoading, products.length, filters.q, activeFilterCount])

  const handleClearSearch = () => {
    setFilters((prev) => ({
      ...prev,
      q: '',
      page: 1,
    }))
  }

  return (
    <div className="ts-catalog-page">
      <main className="ts-catalog-content" id="main-catalog-content">
        {/* Header & Wayfinding */}
        <CatalogHeader
          title={pageTitle}
          subtitle={pageSubtitle}
          searchQuery={filters.q}
          selectedCategory={selectedCategoryObj}
          totalCount={totalItems}
          isLoading={isLoading}
          onNavigateHome={onNavigateHome}
          onNavigateCatalog={() => handleSelectCategory('all')}
          onClearSearch={handleClearSearch}
        />

        {/* Quick Category Switch Pills */}
        <CategoryPills
          categories={catalogData?.categories || CATALOG_CATEGORIES}
          selectedSlug={filters.category || 'all'}
          onSelectCategory={handleSelectCategory}
        />

        {/* Refinement Toolbar */}
        <CatalogToolbar
          filters={filters}
          activeFilterCount={activeFilterCount}
          selectedCategoryName={selectedCategoryObj?.slug !== 'all' ? selectedCategoryObj?.name : undefined}
          onOpenDrawer={() => setIsDrawerOpen(true)}
          onChangeSort={handleChangeSort}
          onChangeView={handleChangeView}
          onRemoveSearch={handleClearSearch}
          onRemoveCategory={() => handleSelectCategory('all')}
          onRemoveBrand={handleToggleBrand}
          onRemovePrice={() => handleSetPriceRange(undefined, undefined)}
          onRemoveInStock={handleToggleInStock}
          onRemoveOnSale={handleToggleOnSale}
          onRemoveRating={() => handleSetRating(undefined)}
          onClearAllFilters={handleClearAllFilters}
        />

        {/* Two-Region Body */}
        <div className="ts-catalog-layout">
          {/* Desktop Persistent Facets Sidebar */}
          <FilterSidebar
            categories={catalogData?.categories || CATALOG_CATEGORIES}
            brands={catalogData?.brands || []}
            filters={filters}
            onSelectCategory={handleSelectCategory}
            onToggleBrand={handleToggleBrand}
            onSetPriceRange={handleSetPriceRange}
            onToggleInStock={handleToggleInStock}
            onToggleOnSale={handleToggleOnSale}
            onSetRating={handleSetRating}
            onClearFilters={handleClearAllFilters}
          />

          {/* Results Column */}
          <section className="ts-catalog-results" aria-label="Product Search Results">
            {isLoading && products.length === 0 ? (
              <CatalogSkeleton count={filters.limit || 12} view={filters.view} />
            ) : emptyStateType ? (
              <CatalogEmptyState
                type={emptyStateType}
                searchQuery={filters.q}
                onClearFilters={handleClearAllFilters}
                onBrowseAll={() => {
                  setFilters((prev) => ({
                    ...prev,
                    q: '',
                    category: 'all',
                    brands: [],
                    minPrice: undefined,
                    maxPrice: undefined,
                    inStock: false,
                    onSale: false,
                    rating: undefined,
                    page: 1,
                  }))
                }}
              />
            ) : (
              <>
                <div
                  className={filters.view === 'list' ? 'ts-catalog-list' : 'ts-catalog-grid'}
                  role="region"
                  aria-label="Products Grid"
                >
                  {products.map((product, index) => {
                    const isSaved = savedIds.has(product.id || product.name)
                    const isCompared = comparedItems.some(
                      (item) => (item.id || item.name) === (product.id || product.name)
                    )

                    return (
                      <ProductCard
                        key={product.id || `${product.name}-${index}`}
                        product={product}
                        // Uniform grid: every card is the same size. (The first-card
                        // "featured" span made the grid look inconsistent.)
                        variant={
                          filters.view === 'list'
                            ? 'list'
                            : product.originalPrice
                            ? 'deal'
                            : 'default'
                        }
                        isSaved={isSaved}
                        isCompared={isCompared}
                        showSave={true}
                        showCompare={true}
                        onToggleSave={() => handleToggleSave(product.id || product.name)}
                        onToggleCompare={() => handleToggleCompare(product)}
                        onOpen={() => onOpenProduct?.(product.id || product.name)}
                        onAddToCart={() => handleAddToCart(product)}
                      />
                    )
                  })}
                </div>

                {/* Accessible Pagination */}
                <Pagination
                  variant="numbered"
                  page={filters.page}
                  pageSize={filters.limit || 15}
                  total={totalItems}
                  itemCount={products.length}
                  totalPages={catalogData?.pagination.totalPages}
                  onPageChange={handlePageChange}
                  onLoadMore={handleLoadMore}
                  isLoading={isLoading}
                />
              </>
            )}
          </section>
        </div>
      </main>

      {/* Mobile / Tablet Filter Drawer */}
      <FilterDrawer
        isOpen={isDrawerOpen}
        totalCount={totalItems}
        onClose={() => setIsDrawerOpen(false)}
        onApply={() => setIsDrawerOpen(false)}
        categories={catalogData?.categories || CATALOG_CATEGORIES}
        brands={catalogData?.brands || []}
        filters={filters}
        onSelectCategory={handleSelectCategory}
        onToggleBrand={handleToggleBrand}
        onSetPriceRange={handleSetPriceRange}
        onToggleInStock={handleToggleInStock}
        onToggleOnSale={handleToggleOnSale}
        onSetRating={handleSetRating}
        onClearFilters={handleClearAllFilters}
      />

      {/* Floating Compare Dock & Matrix Modal */}
      <CompareDrawer
        items={comparedItems}
        onRemoveItem={(id) =>
          setComparedItems((prev) => prev.filter((item) => (item.id || item.name) !== id))
        }
        onClearAll={() => setComparedItems([])}
        onAddToCart={handleAddToCart}
        onOpenProduct={onOpenProduct}
      />
    </div>
  )
}
