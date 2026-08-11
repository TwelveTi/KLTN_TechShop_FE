import { useState } from 'react'
import type { AuthResult } from '../../auth/types'
import { ProductCard, type ProductItem } from '../../../shared/components/ProductCard'
import { Icon, type IconName } from '../../../shared/components/Icon'
import { Button } from '../../../shared/components/Button'
import { Badge } from '../../../shared/components/Badge'
import { useCart } from '../../cart/context/CartContext'
import '../styles/home.css'

type HomePageProps = {
  authResult: AuthResult | null
  onSignIn: () => void
  onRegister: () => void
  onOpenCatalog?: (categorySlug?: string) => void
  onOpenProduct?: (productId: string) => void
}

const serviceHighlights: Array<{ icon: IconName; title: string; desc: string }> = [
  { icon: 'truck', title: 'Fast, free shipping', desc: 'On every order over $100' },
  { icon: 'rotate-ccw', title: '30-day returns', desc: 'No-questions-asked refunds' },
  { icon: 'shield-check', title: '2-year warranty', desc: 'Official coverage included' },
  { icon: 'lock', title: 'Secure checkout', desc: 'SSL & VNPay protected' },
]

const featuredProducts: ProductItem[] = [
  {
    id: '1',
    name: 'AeroBook Pro 14',
    category: 'Laptops',
    price: '$1,899',
    specs: 'M3 Max 12-core, 32GB RAM, 1TB SSD, Liquid Retina XDR',
  },
  {
    id: '2',
    name: 'NovaPhone X2 Ultra 5G',
    category: 'Smartphones',
    price: '$899',
    originalPrice: '$999',
    badge: '10% off',
    specs: 'OLED 120Hz, 50MP AI triple camera, 5000mAh battery',
  },
  {
    id: '3',
    name: 'Pulse Pro Wireless Mechanical Keyboard',
    category: 'Keyboards',
    price: '$149',
    badge: 'New',
    specs: 'Hot-swappable switches, PBT keycaps, tri-mode',
  },
  {
    id: '4',
    name: 'FocusView 27Q QHD 165Hz',
    category: 'Monitors',
    price: '$329',
    originalPrice: '$399',
    specs: '27-inch QHD, 99% sRGB, height adjustable',
  },
  {
    id: '5',
    name: 'SonicPods Max ANC Headset',
    category: 'Audio',
    price: '$179',
    specs: 'Active noise cancellation, 40h battery',
  },
  {
    id: '6',
    name: 'GlideMouse S Ultra-light',
    category: 'Mice',
    price: '$69',
    specs: '58g chassis, 26K DPI optical sensor',
  },
  {
    id: '7',
    name: 'Beacon 4K Pro Webcam',
    category: 'Accessories',
    price: '$129',
    specs: 'Sony sensor, HDR, AI auto-framing',
  },
]

const dealProducts: ProductItem[] = [
  {
    id: 'deal-1',
    name: 'ProStation Workstation Tower',
    category: 'PCs',
    price: '$1,499',
    originalPrice: '$1,999',
    badge: 'Save $500',
    specs: 'Core i9, RTX 4080, 64GB DDR5',
  },
  {
    id: 'deal-2',
    name: 'ClearSound Studio Headphones',
    category: 'Audio',
    price: '$119',
    originalPrice: '$159',
    badge: 'Save 25%',
    specs: 'Hi-Res audio, neutral EQ tuning',
  },
  {
    id: 'deal-3',
    name: 'FlexiDesk Dual Monitor Arm',
    category: 'Accessories',
    price: '$49',
    originalPrice: '$79',
    badge: 'Save $30',
    specs: 'Gas spring, 360° rotation',
  },
  {
    id: 'deal-4',
    name: 'VoltCharge 100W GaN Charger',
    category: 'Accessories',
    price: '$39',
    originalPrice: '$59',
    badge: 'Save $20',
    specs: '4-port, foldable pins, PD 3.1',
  },
]

const scrollToId = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export function HomePage({
  authResult,
  onSignIn,
  onRegister,
  onOpenCatalog,
  onOpenProduct,
}: HomePageProps) {
  const { addToCart } = useCart()
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [addedToast, setAddedToast] = useState<string | null>(null)

  const handleAddToCart = (product: ProductItem) => {
    addToCart(product)
    setAddedToast(`Added ${product.name} to cart`)
    setTimeout(() => {
      setAddedToast(null)
    }, 3000)
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

  const heroProduct = featuredProducts[0]
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
                Laptops, phones, and pro accessories — curated, warrantied, and delivered fast.
                Browse freely; sign in when you want to save.
              </p>
              <div className="hero__actions">
                <Button
                  variant="primary"
                  size="lg"
                  trailingIcon={<Icon name="arrow-right" size={18} />}
                  onClick={() => (onOpenCatalog ? onOpenCatalog() : scrollToId('featured'))}
                >
                  Explore the collection
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => (onOpenCatalog ? onOpenCatalog() : scrollToId('deals'))}
                >
                  See the deals
                </Button>
              </div>
              <div className="hero__trust">
                <span>
                  <Icon name="truck" size={16} /> Free shipping over $100
                </span>
                <span>
                  <Icon name="shield-check" size={16} /> 2-year warranty
                </span>
                <span>
                  <Icon name="rotate-ccw" size={16} /> 30-day returns
                </span>
              </div>
            </div>

            <aside
              className="hero__showcase reveal reveal--delay"
              aria-label={`Featured: ${heroProduct.name}`}
              style={{ cursor: 'pointer' }}
              onClick={() =>
                onOpenProduct ? onOpenProduct(heroProduct.id || 'p-1') : onOpenCatalog?.('laptops')
              }
            >
              <div className="hero__sc-visual">
                <Badge variant="accent" className="hero__sc-tag">
                  Featured
                </Badge>
                <Icon name="laptop" size={112} />
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
                    <span className="hero__sc-price tabular-nums">{heroProduct.price}</span>
                    <span className="hero__sc-note">Ships free · 2-year warranty</span>
                  </div>
                  <Button
                    variant="primary"
                    size="md"
                    trailingIcon={<Icon name="arrow-right" size={16} />}
                    onClick={(e) => {
                      e.stopPropagation()
                      if (onOpenProduct) onOpenProduct(heroProduct.id || 'p-1')
                      else if (onOpenCatalog) onOpenCatalog('laptops')
                      else scrollToId('featured')
                    }}
                  >
                    View details
                  </Button>
                </div>
              </div>
            </aside>
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
        <section className="deals" id="deals" aria-labelledby="deals-heading">
          <div className="section-head">
            <h2 className="section-head__title" id="deals-heading">
              This week&rsquo;s deals
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

        {/* Join — signed-out invitation */}
        {!authResult && (
          <section className="join" aria-label="Create an account">
            <div className="join__text">
              <h2 className="join__title">Save your cart. Sync everywhere.</h2>
              <p>
                Create a free account to keep wishlists, track orders, and get recommendations tuned
                to what you browse.
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

      {/* Add-to-cart toast */}
      {addedToast && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            backgroundColor: 'var(--neutral-900)',
            color: 'var(--neutral-0)',
            padding: '12px 20px',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 'var(--z-toast)' as unknown as number,
            fontSize: '0.875rem',
            fontWeight: 'var(--weight-medium)' as unknown as number,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            animation: 'ts-rise 200ms ease-out both',
          }}
        >
          <span>✓</span>
          <span>{addedToast}</span>
        </div>
      )}
    </div>
  )
}
