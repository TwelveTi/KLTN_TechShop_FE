import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Headphones, PackageSearch, RotateCcw, ShieldCheck, Truck } from 'lucide-react'
import productApi from '../api/productApi'
import ProductCard from '../components/ProductCard'
import RecommendationRail from '../components/RecommendationRail'
import Alert from '../components/ui/Alert'
import { LinkButton } from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import SectionHead from '../components/ui/SectionHead'
import { ProductGridSkeleton, Skeleton } from '../components/ui/Skeleton'
import { useAuth } from '../context/AuthContext'
import { getProductPrice } from '../utils/format'

// Cam kết dịch vụ — là chính sách cửa hàng, không phải số liệu bịa ra.
const SERVICE_HIGHLIGHTS = [
  { icon: Truck, label: 'Free delivery', detail: 'On orders over 1,000,000₫' },
  { icon: RotateCcw, label: '30-day returns', detail: 'For manufacturing defects' },
  { icon: ShieldCheck, label: 'Manufacturer warranty', detail: 'Up to 24 months' },
  { icon: Headphones, label: 'Technical support', detail: 'Help with setup and use' },
]

export default function HomePage() {
  const { isLoggedIn } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  // Quay về từ Google, backend gắn ?login=google để đánh dấu. AuthContext đã
  // đổi cookie lấy token rồi nên ở đây chỉ cần dọn URL cho sạch.
  useEffect(() => {
    if (searchParams.get('login') === 'google') {
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams])

  async function loadData() {
    setLoading(true)
    setError('')
    try {
      // Hai lời gọi không phụ thuộc nhau nên chạy song song cho nhanh.
      const [productData, categoryData] = await Promise.all([
        productApi.getProducts({ limit: 8, sort: 'bestSelling' }),
        productApi.getCategories(),
      ])
      setProducts(productData.items || [])
      setCategories(categoryData.items || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Dải khuyến mãi chỉ hiện khi thật sự có sản phẩm đang giảm giá.
  const deals = products.filter((product) => getProductPrice(product).onSale)

  return (
    <div className="mx-auto max-w-page px-4 sm:px-8">
      {/* Khối mở đầu: nền một màu phẳng, lệch trái, cao theo nội dung —
          không phải hero gradient tràn màn hình. */}
      <section className="mt-8 overflow-hidden rounded-lg bg-primary-soft">
        <div className="grid items-center gap-8 p-8 sm:p-12 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <p className="text-overline uppercase text-primary">The TechShop AI advisor</p>
            <h1 className="mt-3 text-display text-balance text-heading">
              Pick the right machine first time
            </h1>
            <p className="mt-4 max-w-md text-lead text-body">
              Describe what you need and your budget. The advisor looks up the real
              specifications of products in stock, then recommends one and tells you why.
            </p>
            <LinkButton to="/advisor" variant="primary" size="lg" className="mt-7">
              Ask the AI advisor
            </LinkButton>
          </div>

          <img
            src="https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=900&auto=format&fit=crop&q=80"
            alt="A laptop on a desk"
            // Ảnh lớn nhất màn hình đầu tiên, nên tải sớm thay vì lazy.
            fetchPriority="high"
            className="hidden aspect-4/3 w-full rounded-md object-cover lg:block"
          />
        </div>
      </section>

      {/* Dải trấn an: cố tình để giọng nhỏ, nó chỉ hỗ trợ chứ không giành chú ý. */}
      <section className="mt-6 rounded-md bg-sunken px-6 py-5">
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICE_HIGHLIGHTS.map(({ icon: Icon, label, detail }) => (
            <li key={label} className="flex items-start gap-3">
              <Icon size={20} aria-hidden className="mt-0.5 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-medium text-heading">{label}</p>
                <p className="text-caption text-muted">{detail}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {error && (
        <div className="mt-10">
          <Alert title="Could not load the data" onRetry={loadData}>
            {error}
          </Alert>
        </div>
      )}

      {/* Không có danh mục nào thì giấu hẳn khối, không hiện khung rỗng. */}
      {(loading || categories.length > 0) && !error && (
        <section className="pt-16">
          <SectionHead title="Shop by category" linkLabel="View all" linkTo="/products" />

          {loading ? (
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-24 rounded-md" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
              {categories.slice(0, 10).map((category) => (
                <Link
                  key={category.id}
                  to={`/products?category=${category.slug}`}
                  className="rounded-md border border-line bg-surface p-5 shadow-sm
                    transition-shadow duration-120 ease-out hover:shadow-md"
                >
                  <p className="text-h4 leading-snug text-heading">{category.name}</p>
                  <p className="tabular mt-1 text-caption text-muted">
                    {category.productCount} {category.productCount === 1 ? 'product' : 'products'}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}

      {!error && (
        <section className="pt-16">
          <SectionHead
            title="Best sellers"
            description="The most ordered items over the recent period"
            linkLabel="View all"
            linkTo="/products"
          />

          {loading ? (
            <ProductGridSkeleton count={8} />
          ) : products.length === 0 ? (
            <EmptyState
              icon={PackageSearch}
              title="No products yet"
              description="Products will appear here once the store stocks them."
            />
          ) : (
            <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Chỉ hiện khi có sản phẩm giảm giá thật — không bịa khuyến mãi. */}
      {!loading && deals.length > 0 && (
        <section className="pt-16">
          <SectionHead title="On sale" />
          <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
            {deals.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {isLoggedIn ? (
        <RecommendationRail
          title="Picked for you"
          description="Based on the products you have viewed and bought"
          mode="personal"
        />
      ) : (
        <section className="pt-16">
          <div className="flex flex-wrap items-center justify-between gap-6 rounded-md border border-line bg-surface p-8">
            <div>
              <h2 className="text-h3">Sign in for personal recommendations</h2>
              <p className="mt-1.5 max-w-md text-sm text-muted">
                With an account your cart follows you across devices, and recommendations are
                built from what you actually care about.
              </p>
            </div>
            <div className="flex gap-3">
              <LinkButton to="/register" variant="primary">
                Create an account
              </LinkButton>
              <LinkButton to="/login" variant="secondary">
                Sign in
              </LinkButton>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
