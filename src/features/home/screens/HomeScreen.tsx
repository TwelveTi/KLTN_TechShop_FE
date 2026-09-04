import { useMemo, useState } from 'react'
import { useNavigate } from '@core/router'
import { paths } from '@routes/paths'
import { useAuth } from '@features/auth'
import type { Product } from '@domain/product'
import { ProductCard } from '@shared/ui/ProductCard'
import { Icon, type IconName } from '@shared/ui/Icon'
import { Button } from '@shared/ui/Button'
import { Badge } from '@shared/ui/Badge'
import { useCart } from '@features/cart'
import { useToast } from '@shared/ui/useToast'
import { formatVnd } from '@shared/utils/money'
import { useFeaturedProducts } from '@features/catalog'
import { PersonalRecommendationRail } from '@features/recommendations'
import '../styles/home.css'

const serviceHighlights: Array<{ icon: IconName; title: string; desc: string }> = [
  { icon: 'truck', title: 'Fast, free shipping', desc: 'On all orders over 1.000.000₫' },
  { icon: 'rotate-ccw', title: '30-day returns', desc: 'Manufacturer replacement warranty' },
  { icon: 'shield-check', title: '2-year warranty', desc: '100% genuine guaranteed' },
  { icon: 'lock', title: 'Secure checkout', desc: 'SSL & VNPay protected' },
]

const scrollToId = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

/**
 * Trang chủ.
 *
 * Không còn nhận prop điều hướng: mọi đích đến đi qua `navigate(paths.*)`, và
 * phiên đăng nhập đọc từ `useAuth()`.
 */
export function HomeScreen() {
  const navigate = useNavigate()
  const { authResult } = useAuth()
  const onOpenProduct = (productId: string) => navigate(paths.product(productId))
  const onOpenCatalog = (category?: string) => navigate(paths.catalog({ category }))
  const onSignIn = () => navigate(paths.auth('login'))
  const onRegister = () => navigate(paths.auth('register'))
  const { addToCart } = useCart()
  const { showToast } = useToast()
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const { data: products = [] } = useFeaturedProducts(24)

  /**
   * Hai dải sản phẩm được SUY RA từ một lượt tải, không phải hai `useState`
   * được set trong `.then()`. v1 gọi `apiClient` trực tiếp rồi tự map DTO ngay
   * trong effect — một bản sao của mapper catalog.
   */
  const featuredProducts = useMemo(
    () => products.filter((product) => product.isFeatured).concat(products).slice(0, 8),
    [products],
  )
  const dealProducts = useMemo(
    () =>
      products
        .filter((product) => product.originalPriceVnd !== undefined)
        .concat(products.slice(4))
        .slice(0, 6),
    [products],
  )

  const handleAddToCart = (product: Product) => {
    addToCart(product)
    showToast(`Added ${product.name} to cart`, { variant: 'success' })
  }

  const toggleSave = (id: string) => {
    setSavedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const heroProduct = featuredProducts[0] || {
    id: '',
    name: 'Explore the collection',
    category: 'Flagship Technology',
    price: 'Best pricing',
    specs: '100% Genuine, 24-Month Warranty, 0% Installment',
  }
  const gridProducts = featuredProducts.slice(1)
  const heroSpecs = heroProduct.specs ? heroProduct.specs.split(', ') : []

  return (
    <div className="home-page">
      <main className="home-content">
        {/* Hero — asymmetric marquee with a dark product focal point */}
        <section className="hero" aria-label="Welcome to TechShop">
          <div className="hero__grid">
            <div className="hero__content reveal">
              <span className="hero__kicker">TechShop · 2026 lineup</span>
              <h1 className="hero__title">
                Serious tech,
                <br />
                <em>ready to ship.</em>
              </h1>
              <p className="hero__lead">
                Laptops, phones, and pro accessories — curated, warrantied for 24 months, and
                delivered fast nationwide. Browse freely; sign in when you want to save.
              </p>
              <div className="hero__actions">
                <Button
                  variant="primary"
                  size="lg"
                  trailingIcon={<Icon name="arrow-right" size={18} />}
                  onClick={() => (onOpenCatalog ? onOpenCatalog() : scrollToId('featured'))}
                >
                  Explore collection
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => (onOpenCatalog ? onOpenCatalog() : scrollToId('deals'))}
                >
                  See today's deals
                </Button>
              </div>
              <div className="hero__trust">
                <span>
                  <Icon name="truck" size={16} /> Free shipping from 1M
                </span>
                <span>
                  <Icon name="shield-check" size={16} /> 2-year warranty
                </span>
                <span>
                  <Icon name="rotate-ccw" size={16} /> 30-day returns
                </span>
              </div>
            </div>

            {heroProduct.id && (
              <aside
                className="hero__showcase reveal reveal--delay"
                aria-label={`Featured: ${heroProduct.name}`}
                style={{ cursor: 'pointer' }}
                onClick={() =>
                  onOpenProduct ? onOpenProduct(heroProduct.id || '') : onOpenCatalog?.('laptops')
                }
              >
                <div className="hero__sc-visual">
                  <Badge variant="accent" className="hero__sc-tag">
                    Featured
                  </Badge>
                  {heroProduct.imageUrl ? (
                    <img
                      src={heroProduct.imageUrl}
                      alt={heroProduct.name}
                      style={{ maxWidth: '180px', maxHeight: '180px', objectFit: 'contain' }}
                    />
                  ) : (
                    <Icon name="laptop" size={112} />
                  )}
                </div>
                <div className="hero__sc-info">
                  <span className="hero__sc-cat">{heroProduct.category}</span>
                  <span className="hero__sc-name">{heroProduct.name}</span>
                  <div className="hero__sc-specs">
                    {heroSpecs.map((spec) => (
                      <span className="hero__sc-spec" key={spec}>
                        {spec}
                      </span>
                    ))}
                  </div>
                  <div className="hero__sc-foot">
                    <div className="hero__sc-priceblock">
                      <span className="hero__sc-price tabular-nums">{formatVnd(heroProduct.priceVnd)}</span>
                      <span className="hero__sc-note">Ships free · 2-year warranty</span>
                    </div>
                    <Button
                      variant="primary"
                      size="md"
                      trailingIcon={<Icon name="arrow-right" size={16} />}
                      onClick={(e) => {
                        e.stopPropagation()
                        if (onOpenProduct) onOpenProduct(heroProduct.id || '')
                        else if (onOpenCatalog) onOpenCatalog('laptops')
                        else scrollToId('featured')
                      }}
                    >
                      View details
                    </Button>
                  </div>
                </div>
              </aside>
            )}
          </div>
        </section>

        {/* Trust strip — quiet hairline row of guarantees */}
        <section className="trust-strip" aria-label="Service guarantees">
          {serviceHighlights.map((item) => (
            <div className="trust-strip__item" key={item.title}>
              <Icon name={item.icon} size={20} className="trust-strip__icon" />
              <div className="trust-strip__text">
                <strong className="trust-strip__title">{item.title}</strong>
                <span className="trust-strip__desc">{item.desc}</span>
              </div>
            </div>
          ))}
        </section>

        {/* Gợi ý — đặt TRÊN "Featured products" một cách có chủ đích.
            "Featured" là do admin chọn, giống nhau với mọi khách; dải này được
            sinh từ hành vi của chính người đang xem, nên nó xứng đáng vị trí
            đọc trước. Với khách chưa đăng nhập nó tự hạ xuống "Trending right
            now", và nếu không có gợi ý nào thì nó không render gì cả. */}
        <PersonalRecommendationRail limit={12} />

        {/* Featured — dense product grid */}
        <section className="featured" id="featured" aria-labelledby="featured-heading">
          <div className="section-head">
            <h2 className="section-head__title" id="featured-heading">
              Featured products
            </h2>
            <button
              type="button"
              className="section-head__link"
              onClick={() => (onOpenCatalog ? onOpenCatalog() : scrollToId('featured'))}
            >
              View all <Icon name="arrow-right" size={16} />
            </button>
          </div>
          <div className="product-grid">
            {gridProducts.map((product) => (
              <ProductCard
                key={product.id || product.name}
                product={product}
                variant="default"
                isSaved={savedIds.has(product.id || '')}
                onToggleSave={() => toggleSave(product.id || '')}
                onOpen={() => onOpenProduct?.(product.id || product.name)}
                onAddToCart={() => handleAddToCart(product)}
              />
            ))}
          </div>
        </section>

        {/* Deals — a distinct horizontal rail */}
        {dealProducts.length > 0 && (
          <section className="deals" id="deals" aria-labelledby="deals-heading">
            <div className="section-head">
              <h2 className="section-head__title" id="deals-heading">
                Top Deals
              </h2>
              <button
                type="button"
                className="section-head__link"
                onClick={() => (onOpenCatalog ? onOpenCatalog() : scrollToId('deals'))}
              >
                All deals <Icon name="arrow-right" size={16} />
              </button>
            </div>
            <div className="deals__track">
              {dealProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  variant="deal"
                  isSaved={savedIds.has(product.id || '')}
                  onToggleSave={() => toggleSave(product.id || '')}
                  onOpen={() => onOpenProduct?.(product.id || product.name)}
                  onAddToCart={() => handleAddToCart(product)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Join — signed-out invitation */}
        {!authResult && (
          <section className="join" aria-label="Create an account">
            <div className="join__text">
              <h2 className="join__title">Save your cart. Sync everywhere.</h2>
              <p>
                Create a free account to keep wishlists, track orders, and receive exclusive
                recommendations tailored to your setup.
              </p>
            </div>
            <div className="join__actions">
              <Button variant="secondary" size="md" onClick={onSignIn}>
                Sign in
              </Button>
              <Button variant="primary" size="md" onClick={onRegister}>
                Create account
              </Button>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
