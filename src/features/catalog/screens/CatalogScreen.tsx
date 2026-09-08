import { useState, useMemo, useCallback } from 'react'
import type { Product } from '@domain/product'
import { useNavigate, useSearchParams } from '@core/router'
import { paths } from '@routes/paths'
import { toErrorMessage } from '@core/http'
import { Button } from '@shared/ui/Button'
import { ProductCard } from '@shared/ui/ProductCard'
import { Pagination } from '@shared/ui/Pagination'
import { CatalogHeader } from '../components/CatalogHeader'
import { CategoryPills } from '../components/CategoryPills'
import { CatalogToolbar } from '../components/CatalogToolbar'
import { FilterSidebar } from '../components/FilterSidebar'
import { FilterDrawer } from '../components/FilterDrawer'
import { CompareDrawer } from '../components/CompareDrawer'
import { CatalogEmptyState } from '../components/CatalogEmptyState'
import { CatalogSkeleton } from '../components/CatalogSkeleton'
import { FALLBACK_CATEGORIES } from '../api/catalogApi'
import { useBrands, useCategories, useProducts } from '../hooks/useCatalog'
import { findCategory, resolveCategorySlug } from '../lib/categorySlug'
import { useCart } from '@features/cart'
import { useToast } from '@shared/ui/useToast'
import type {
  CatalogFilters,
  SortOption,
  ViewMode,
} from '../types'
import '../styles/catalog.css'

/**
 * Bộ lọc catalog SỐNG TRONG URL.
 *
 * v1 giữ chúng trong `useState`, rồi phải: đồng bộ ngược ra URL bằng
 * `replaceState`, bắn event `techshop:catalog-changed` để header cập nhật chip
 * danh mục, và nghe `popstate` + `techshop:navigate` để đọc lại. Bốn cơ chế cho
 * một thứ dữ liệu. Giờ URL là nguồn sự thật duy nhất và `useSearchParams` lo
 * cả hai chiều.
 */
function readFilters(params: URLSearchParams): CatalogFilters {
  const brandsParam = params.get('brand') || params.get('brands')
  const number = (name: string) => (params.get(name) ? Number(params.get(name)) : undefined)
  const flag = (name: string) => params.get(name) === '1' || params.get(name) === 'true'

  return {
    q: params.get('q') || '',
    category: params.get('category') || 'all',
    brands: brandsParam ? brandsParam.split(',').filter(Boolean) : [],
    minPriceVnd: number('minPrice'),
    maxPriceVnd: number('maxPrice'),
    inStock: flag('inStock'),
    onSale: flag('onSale'),
    rating: number('rating'),
    sort: (params.get('sort') as SortOption) || 'popular',
    page: Math.max(1, Number(params.get('page')) || 1),
    limit: 15,
    view: (params.get('view') as ViewMode) || 'grid',
  }
}

/** Chiều ngược lại: bộ lọc → query string, bỏ mọi giá trị mặc định. */
function writeFilters(filters: CatalogFilters): URLSearchParams {
  const next = new URLSearchParams()
  const set = (name: string, value: string | number | undefined) => {
    if (value !== undefined && value !== '' && value !== 0) next.set(name, String(value))
  }

  set('q', filters.q?.trim())
  if (filters.category && filters.category !== 'all') next.set('category', filters.category)
  if (filters.brands.length > 0) next.set('brand', filters.brands.join(','))
  set('minPrice', filters.minPriceVnd)
  set('maxPrice', filters.maxPriceVnd)
  if (filters.inStock) next.set('inStock', '1')
  if (filters.onSale) next.set('onSale', '1')
  set('rating', filters.rating)
  if (filters.sort !== 'popular') next.set('sort', filters.sort)
  if (filters.page > 1) next.set('page', String(filters.page))
  if (filters.view !== 'grid') next.set('view', filters.view)

  return next
}

export function CatalogScreen() {
  const navigate = useNavigate()
  const onOpenProduct = (productId: string) => navigate(paths.product(productId))
  const onNavigateHome = () => navigate(paths.home())
  const { addToCart: addCartItem } = useCart()
  const { showToast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = useMemo(() => readFilters(searchParams), [searchParams])
  const setFilters = useCallback(
    (update: (current: CatalogFilters) => CatalogFilters) =>
      setSearchParams((current) => writeFilters(update(readFilters(current)))),
    [setSearchParams],
  )
  // BA truy vấn độc lập, mỗi cái có vòng đời cache riêng: taxonomy gần như
  // không đổi (5 phút), danh sách sản phẩm đổi theo bộ lọc (30 giây).
  //
  // v1 gộp cả ba vào một lời gọi, nên đổi sort cũng tải lại danh mục và
  // thương hiệu — và cả ba đi tuần tự chứ không song song.
  const categoriesQuery = useCategories()
  const brandsQuery = useBrands()
  const categories = categoriesQuery.data ?? FALLBACK_CATEGORIES
  const brands = brandsQuery.data ?? []

  // Token của department bar ("laptops") được quy về slug thật bằng taxonomy
  // đã cache, rồi mới đưa vào truy vấn sản phẩm.
  const resolvedCategory = resolveCategorySlug(filters.category, categories)
  const catalog = useProducts(filters, resolvedCategory)

  // Ẩn danh mục KHÔNG có sản phẩm nào khỏi mặt tiền: một chip dẫn tới trang
  // rỗng chỉ làm người mua mất công. "All Products" và danh mục đang chọn thì
  // luôn giữ. (Dữ liệu seed hiện có hai danh mục cùng tên "Laptop", một cái
  // rỗng — chỗ đó cần dọn ở backend, xem ARCHITECTURE.md.)
  const visibleCategories = useMemo(
    () =>
      categories.filter(
        (category) =>
          category.slug === 'all' ||
          category.slug === resolvedCategory ||
          category.count === undefined ||
          category.count > 0,
      ),
    [categories, resolvedCategory],
  )
  const isLoading = catalog.isLoading
  // Dùng `isError` chứ KHÔNG so sánh `error !== null`: giá trị khởi tạo của
  // `error` là `undefined`, mà `undefined !== null` là true — bản cũ vì thế
  // hiện banner "Could not load products" ngay cả khi có đủ sản phẩm.
  const loadError = catalog.isError ? catalog.error : null
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [comparedItems, setComparedItems] = useState<Product[]>([])

  // Fetch catalog data when the *query* filters change. `view` is a purely
  // client-side concern, so it is deliberately excluded — toggling grid/list
  // must never trigger a network round-trip.
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
      minPriceVnd: min,
      maxPriceVnd: max,
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
      minPriceVnd: undefined,
      maxPriceVnd: undefined,
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
  const handleToggleCompare = (product: Product) => {
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
  const handleAddToCart = (product: Product) => {
    addCartItem(product)
    showToast(`Added ${product.name} to cart`, { variant: 'success' })
  }

  // Active filter count computation
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.q && filters.q.trim()) count += 1
    if (filters.brands.length > 0) count += filters.brands.length
    if (filters.minPriceVnd !== undefined || filters.maxPriceVnd !== undefined) count += 1
    if (filters.inStock) count += 1
    if (filters.onSale) count += 1
    if (filters.rating) count += 1
    if (filters.category && filters.category !== 'all') count += 1
    return count
  }, [filters])

  // Selected category object
  const selectedCategoryObj = useMemo(() => {
    // Khớp khoan dung: token số nhiều/curated ("laptops") vẫn ra đúng danh
    // mục "Laptop" cho tiêu đề và chip đang chọn. Logic ở lib/categorySlug.
    return findCategory(filters.category, categories)
  }, [categories, filters.category])

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

  const totalItems = catalog.data?.pagination.total ?? 0
  const products = catalog.data?.items ?? []

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
        {/* So khớp bằng slug ĐÃ RESOLVE: thanh department gửi token thân thiện
            ("smartphones") còn taxonomy dùng slug thật ("seed-smartphone"), nên
            so bằng token thô thì không chip nào sáng lên. */}
        <CategoryPills
          categories={visibleCategories}
          selectedSlug={resolvedCategory || 'all'}
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
            selectedSlug={resolvedCategory}
            categories={visibleCategories}
            brands={brands}
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
            {catalog.isError && (
              <div className="ts-catalog-error" role="alert">
                <p>{toErrorMessage(loadError, 'Could not load products.')}</p>
                <Button variant="secondary" size="sm" onClick={() => void catalog.refetch()}>
                  Try again
                </Button>
              </div>
            )}

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
                    minPriceVnd: undefined,
                    maxPriceVnd: undefined,
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
                            : product.originalPriceVnd
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
                  totalPages={catalog.data?.pagination.totalPages}
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
        categories={categories}
        brands={brands}
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
        // Gửi TÊN chứ không phải id: tool `find_products_by_name` của backend
        // tra theo tên, và tên cũng là thứ đọc được trong câu hỏi soạn sẵn ở
        // trang so sánh.
        onAskAi={() => navigate(paths.compare(comparedItems.map((item) => item.name)))}
      />
    </div>
  )
}
