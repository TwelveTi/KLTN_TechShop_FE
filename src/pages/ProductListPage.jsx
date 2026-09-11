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
  { value: 'bestSelling', label: 'Bán chạy nhất' },
  { value: 'newest', label: 'Mới nhất' },
  { value: 'priceAsc', label: 'Giá thấp đến cao' },
  { value: 'priceDesc', label: 'Giá cao đến thấp' },
  { value: 'rating', label: 'Đánh giá cao nhất' },
]

const LIMIT = 12

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
    keyword && { key: 'keyword', label: `Từ khoá: ${keyword}` },
    activeCategory && { key: 'category', label: activeCategory.name },
    activeBrand && { key: 'brand', label: activeBrand.name },
  ].filter(Boolean)

  const title = keyword
    ? `Kết quả cho “${keyword}”`
    : activeCategory
      ? activeCategory.name
      : 'Tất cả sản phẩm'

  function FacetGroup({ heading, options, paramKey, active }) {
    return (
      <div>
        <p className="mb-2 text-overline uppercase text-faint">{heading}</p>
        <ul className="space-y-1">
          <li>
            <button
              onClick={() => updateFilter(paramKey, '')}
              className={`rounded-xs text-sm ${!active ? 'font-semibold text-primary' : 'text-muted hover:text-body'}`}
            >
              Tất cả
            </button>
          </li>
          {options.map((option) => (
            <li key={option.id}>
              <button
                onClick={() => updateFilter(paramKey, option.slug)}
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

  const filterPanel = (
    <div className="space-y-6">
      {categories.length > 0 ? (
        <FacetGroup heading="Danh mục" options={categories} paramKey="category" active={category} />
      ) : (
        <Skeleton className="h-40" />
      )}
      {brands.length > 0 && (
        <FacetGroup heading="Thương hiệu" options={brands} paramKey="brand" active={brand} />
      )}
    </div>
  )

  return (
    <div className="mx-auto max-w-wide px-4 py-8 sm:px-8">
      <Breadcrumb
        items={[{ label: 'Trang chủ', to: '/' }, { label: activeCategory?.name || 'Sản phẩm' }]}
      />

      <div className="mt-3 flex flex-wrap items-baseline gap-3">
        <h1 className="text-h1">{title}</h1>
        {pagination && (
          <p className="tabular text-sm text-muted">{pagination.total} sản phẩm</p>
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
              Bộ lọc{activeFilters.length > 0 ? ` · ${activeFilters.length}` : ''}
            </Button>

            <label className="ml-auto flex items-center gap-2 text-sm text-muted">
              Sắp xếp
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
                  aria-label={`Bỏ lọc ${filter.label}`}
                >
                  <Badge tone="primary">
                    {filter.label}
                    <X size={12} aria-hidden />
                  </Badge>
                </button>
              ))}
              <button onClick={clearAll} className="rounded-xs text-sm text-muted hover:text-body">
                Xoá tất cả
              </button>
            </div>
          )}

          {error && (
            <Alert title="Không tải được danh sách sản phẩm" onRetry={() => updateFilter('page', String(page))}>
              {error}
            </Alert>
          )}

          {loading && <ProductGridSkeleton count={LIMIT} />}

          {!loading && !error && products.length === 0 && (
            <EmptyState
              icon={SearchX}
              title="Không có sản phẩm nào khớp bộ lọc"
              description="Thử bỏ bớt một điều kiện lọc hoặc dùng từ khoá ngắn hơn."
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
            aria-label="Bộ lọc sản phẩm"
            className="h-full w-80 max-w-[85vw] overflow-y-auto bg-surface p-5"
          >
            <div className="mb-5 flex items-center justify-between">
              <p className="text-h4">Bộ lọc</p>
              <button
                onClick={() => setFiltersOpen(false)}
                aria-label="Đóng bộ lọc"
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
