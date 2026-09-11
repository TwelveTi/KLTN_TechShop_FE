import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
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
  { icon: Truck, label: 'Miễn phí giao hàng', detail: 'Cho đơn từ 1.000.000₫' },
  { icon: RotateCcw, label: 'Đổi trả 30 ngày', detail: 'Với lỗi kỹ thuật từ nhà sản xuất' },
  { icon: ShieldCheck, label: 'Bảo hành chính hãng', detail: 'Tối đa 24 tháng' },
  { icon: Headphones, label: 'Hỗ trợ kỹ thuật', detail: 'Tư vấn lắp đặt và sử dụng' },
]

export default function HomePage() {
  const { isLoggedIn } = useAuth()

  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadData()
  }, [])

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
            <p className="text-overline uppercase text-primary">Trợ lý AI của TechShop</p>
            <h1 className="mt-3 text-display text-balance text-heading">
              Chọn đúng máy ngay từ đầu
            </h1>
            <p className="mt-4 max-w-md text-lead text-body">
              Mô tả nhu cầu và ngân sách bằng tiếng Việt. Trợ lý tra cứu thông số thật của sản
              phẩm trong kho rồi gợi ý cho bạn, kèm lý do vì sao.
            </p>
            <LinkButton to="/advisor" variant="primary" size="lg" className="mt-7">
              Hỏi trợ lý AI
            </LinkButton>
          </div>

          <img
            src="https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=900&auto=format&fit=crop&q=80"
            alt="Laptop đặt trên bàn làm việc"
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
          <Alert title="Không tải được dữ liệu" onRetry={loadData}>
            {error}
          </Alert>
        </div>
      )}

      {/* Không có danh mục nào thì giấu hẳn khối, không hiện khung rỗng. */}
      {(loading || categories.length > 0) && !error && (
        <section className="pt-16">
          <SectionHead title="Mua theo danh mục" linkLabel="Xem tất cả" linkTo="/products" />

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
                    {category.productCount} sản phẩm
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
            title="Sản phẩm bán chạy"
            description="Những món được đặt nhiều nhất trong thời gian gần đây"
            linkLabel="Xem tất cả"
            linkTo="/products"
          />

          {loading ? (
            <ProductGridSkeleton count={8} />
          ) : products.length === 0 ? (
            <EmptyState
              icon={PackageSearch}
              title="Chưa có sản phẩm nào"
              description="Sản phẩm sẽ xuất hiện ở đây khi cửa hàng nhập hàng."
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
          <SectionHead title="Đang giảm giá" />
          <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
            {deals.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {isLoggedIn ? (
        <RecommendationRail
          title="Gợi ý dành riêng cho bạn"
          description="Dựa trên những sản phẩm bạn đã xem và đã mua"
          mode="personal"
        />
      ) : (
        <section className="pt-16">
          <div className="flex flex-wrap items-center justify-between gap-6 rounded-md border border-line bg-surface p-8">
            <div>
              <h2 className="text-h3">Đăng nhập để nhận gợi ý riêng</h2>
              <p className="mt-1.5 max-w-md text-sm text-muted">
                Có tài khoản, bạn giữ được giỏ hàng giữa các thiết bị và nhận danh sách gợi ý
                dựa trên những gì bạn thật sự quan tâm.
              </p>
            </div>
            <div className="flex gap-3">
              <LinkButton to="/register" variant="primary">
                Tạo tài khoản
              </LinkButton>
              <LinkButton to="/login" variant="secondary">
                Đăng nhập
              </LinkButton>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
