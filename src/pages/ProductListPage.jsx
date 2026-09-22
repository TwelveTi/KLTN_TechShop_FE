import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SearchX, SlidersHorizontal, X } from 'lucide-react'
import productApi from '../api/productApi'
import Pagination from '../components/Pagination'
import ProductCard from '../components/ProductCard'
import Alert from '../components/ui/Alert'
import Badge from '../components/ui/Badge'
import Breadcrumb from '../components/ui/Breadcrumb'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import { ProductGridSkeleton, Skeleton } from '../components/ui/Skeleton'

const SORT_OPTIONS = [
  { value: 'bestSelling', label: 'Best selling' },
  { value: 'newest', label: 'Newest' },
  { value: 'priceAsc', label: 'Price: low to high' },
  { value: 'priceDesc', label: 'Price: high to low' },
  { value: 'rating', label: 'Highest rated' },
]

const LIMIT = 12

// Phải nằm ngoài ProductListPage. Định nghĩa bên trong thì mỗi lần render là một
// kiểu component mới, nên React gỡ cả panel lọc xuống rồi dựng lại từ đầu.
function FacetGroup({ heading, options, paramKey, active, onSelect }) {
  return (
    <div>
      <p className="mb-2 text-overline uppercase text-faint">{heading}</p>
      <ul className="space-y-1">
        <li>
          <button
            onClick={() => onSelect(paramKey, '')}
            className={`rounded-xs text-sm ${!active ? 'font-semibold text-primary' : 'text-muted hover:text-body'}`}
          >
            All
          </button>
        </li>
        {options.map((option) => (
          <li key={option.id}>
            <button
              onClick={() => onSelect(paramKey, option.slug)}
              className={`rounded-xs text-left text-sm ${
                active === option.slug ? 'font-semibold text-primary' : 'text-muted hover:text-body'
              }`}
            >
              {option.name}
              <span className="tabular ml-1 text-faint">({option.productCount})</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function ProductListPage() {
  // Mọi trạng thái của khung nhìn nằm trên URL, nên link chia sẻ được, F5 không
  // mất bộ lọc, và nút Back của trình duyệt hoạt động đúng.
  const [searchParams, setSearchParams] = useSearchParams()

  const keyword = searchParams.get('keyword') || ''
  const category = searchParams.get('category') || ''
  const brand = searchParams.get('brand') || ''
  const sort = searchParams.get('sort') || 'bestSelling'
  const page = Number(searchParams.get('page')) || 1

  const [products, setProducts] = useState([])
  const [pagination, setPagination] = useState(null)
  const [categories, setCategories] = useState([])
  const [brands, setBrands] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)

  // Danh mục và thương hiệu gần như không đổi nên chỉ tải một lần.
  useEffect(() => {
    productApi.getCategories().then((data) => setCategories(data.items || [])).catch(() => {})
    productApi.getBrands().then((data) => setBrands(data.items || [])).catch(() => {})
  }, [])

  // Mỗi lần bộ lọc trên URL đổi thì gọi lại API danh sách sản phẩm.
  useEffect(() => {
    setLoading(true)
    setError('')

    productApi
      .getProducts({
        page,
        limit: LIMIT,
        sort,
        keyword: keyword || undefined,
        category: category || undefined,
        brands: brand || undefined,
      })
      .then((data) => {
        setProducts(data.items || [])
        setPagination(data.pagination)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [keyword, category, brand, sort, page])

  // Đổi một bộ lọc thì ghi lại lên URL và quay về trang 1.
  function updateFilter(key, value) {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    if (key !== 'page') next.delete('page')
    setSearchParams(next)
  }

  function clearAll() {
    setSearchParams(new URLSearchParams())
  }

  const activeCategory = categories.find((item) => item.slug === category)
  const activeBrand = brands.find((item) => item.slug === brand)

  // Các chip cho biết truy vấn hiện tại đang gồm những gì, bấm chữ X để bỏ từng cái.
  const activeFilters = [
    keyword && { key: 'keyword', label: `Keyword: ${keyword}` },
    activeCategory && { key: 'category', label: activeCategory.name },
    activeBrand && { key: 'brand', label: activeBrand.name },
  ].filter(Boolean)

  const title = keyword
    ? `Results for “${keyword}”`
    : activeCategory
      ? activeCategory.name
      : 'All products'


  const filterPanel = (
    <div className="space-y-6">
      {categories.length > 0 ? (
        <FacetGroup heading="Category" options={categories} paramKey="category" active={category} onSelect={updateFilter} />
      ) : (
        <Skeleton className="h-40" />
      )}
      {brands.length > 0 && (
        <FacetGroup heading="Brand" options={brands} paramKey="brand" active={brand} onSelect={updateFilter} />
      )}
    </div>
  )

  return (
    <div className="mx-auto max-w-wide px-4 py-8 sm:px-8">
      <Breadcrumb
        items={[{ label: 'Home', to: '/' }, { label: activeCategory?.name || 'Products' }]}
      />

      <div className="mt-3 flex flex-wrap items-baseline gap-3">
        <h1 className="text-h1">{title}</h1>
        {pagination && (
          <p className="tabular text-sm text-muted">
            {pagination.total} {pagination.total === 1 ? 'product' : 'products'}
          </p>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-8 lg:flex-row">
        {/* Desktop: bảng lọc luôn hiện bên trái để lọc đi lọc lại cho nhanh. */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-24 rounded-md border border-line bg-surface p-5 shadow-sm">
            {filterPanel}
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <Button
              variant="secondary"
              size="sm"
              leadingIcon={SlidersHorizontal}
              onClick={() => setFiltersOpen(true)}
              className="lg:hidden"
            >
              Filters{activeFilters.length > 0 ? ` · ${activeFilters.length}` : ''}
            </Button>

            <label className="ml-auto flex items-center gap-2 text-sm text-muted">
              Sort
              <select
                value={sort}
                onChange={(event) => updateFilter('sort', event.target.value)}
                className="h-9 rounded-sm border border-line-strong bg-surface px-2 text-sm text-heading"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {activeFilters.length > 0 && (
            <div className="mb-5 flex flex-wrap items-center gap-2">
              {activeFilters.map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => updateFilter(filter.key, '')}
                  className="rounded-full"
                  aria-label={`Remove filter ${filter.label}`}
                >
                  <Badge tone="primary">
                    {filter.label}
                    <X size={12} aria-hidden />
                  </Badge>
                </button>
              ))}
              <button onClick={clearAll} className="rounded-xs text-sm text-muted hover:text-body">
                Clear all
              </button>
            </div>
          )}

          {error && (
            <Alert title="Could not load the product list" onRetry={() => updateFilter('page', String(page))}>
              {error}
            </Alert>
          )}

          {loading && <ProductGridSkeleton count={LIMIT} />}

          {!loading && !error && products.length === 0 && (
            <EmptyState
              icon={SearchX}
              title="No products match these filters"
              description="Try removing one condition, or use a shorter keyword."
            />
          )}

          {!loading && !error && products.length > 0 && (
            <>
              <div className="grid grid-cols-2 gap-6 md:grid-cols-3">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              <Pagination
                page={page}
                totalPages={pagination?.totalPages}
                onChange={(nextPage) => updateFilter('page', String(nextPage))}
              />
            </>
          )}
        </div>
      </div>

      {/* Màn hình nhỏ: bảng lọc trượt ra từ bên trái, vẫn thấy kết quả phía sau. */}
      {filtersOpen && (
        <div
          className="fixed inset-0 z-50 flex bg-neutral-950/50 lg:hidden"
          onMouseDown={(event) => event.target === event.currentTarget && setFiltersOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Product filters"
            className="h-full w-80 max-w-[85vw] overflow-y-auto bg-surface p-5"
          >
            <div className="mb-5 flex items-center justify-between">
              <p className="text-h4">Filters</p>
              <button
                onClick={() => setFiltersOpen(false)}
                aria-label="Close filters"
                className="rounded-xs p-1 text-muted hover:bg-sunken"
              >
                <X size={18} aria-hidden />
              </button>
            </div>
            {filterPanel}
          </div>
        </div>
      )}
    </div>
  )
}
