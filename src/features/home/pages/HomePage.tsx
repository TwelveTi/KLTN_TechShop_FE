import { useCallback, useEffect, useState } from 'react'
import type { AuthResult } from '../../auth/types'
import { Toast } from '../../../shared/components/Toast'
import type { ToastType } from '../../../shared/components/Toast'
import { ShopHeader } from '../components/ShopHeader'
import '../styles/home.css'

type HomePageProps = {
  authResult: AuthResult | null
  onSignIn: () => void
  onRegister: () => void
  onOpenAdmin: () => void
  onOpenProfile: () => void
  onOpenOrders: () => void
  onLogout: () => void | Promise<void>
}

const categories = ['Laptops', 'Phones', 'Keyboards', 'Mice', 'Headsets', 'Monitors']

// Messages shown after the email verification link redirects back to the home
// page with a ?verified=<status> query param (set by the backend).
const verificationNotices: Record<string, { type: ToastType; message: string }> = {
  success: {
    type: 'success',
    message: 'Your email has been verified and you are now signed in. Welcome to TechShop!',
  },
  already: {
    type: 'info',
    message: 'Your email was already verified. You are signed in.',
  },
  error: {
    type: 'error',
    message: 'This verification link is invalid or has expired. Please sign in and request a new one.',
  },
}

const products = [
  {
    name: 'AeroBook Pro 14',
    category: 'Laptop',
    price: '$1,249',
    badge: 'Best seller',
    specs: 'Intel Core Ultra, 16GB RAM, 1TB SSD',
  },
  {
    name: 'NovaPhone X2',
    category: 'Smartphone',
    price: '$829',
    badge: 'New',
    specs: 'OLED 120Hz, 256GB, AI camera',
  },
  {
    name: 'Pulse RGB Keyboard',
    category: 'Keyboard',
    price: '$119',
    badge: 'Hot',
    specs: 'Mechanical switches, wireless mode',
  },
  {
    name: 'FocusView 27Q',
    category: 'Monitor',
    price: '$329',
    badge: 'Deal',
    specs: '27-inch QHD, 165Hz, IPS panel',
  },
  {
    name: 'SonicPods Max',
    category: 'Headset',
    price: '$159',
    badge: 'Recommended',
    specs: 'ANC, low-latency gaming mode',
  },
  {
    name: 'GlideMouse S',
    category: 'Mouse',
    price: '$69',
    badge: 'Top rated',
    specs: '58g, 26K DPI, USB-C charging',
  },
]

export function HomePage({
  authResult,
  onSignIn,
  onRegister,
  onOpenAdmin,
  onOpenProfile,
  onOpenOrders,
  onLogout,
}: HomePageProps) {
  const [verifyNotice, setVerifyNotice] = useState<{ type: ToastType; message: string } | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const verified = params.get('verified')

    if (verified && verificationNotices[verified]) {
      setVerifyNotice(verificationNotices[verified])
      // Drop the query param so a refresh does not re-trigger the toast.
      window.history.replaceState({}, '', window.location.pathname + window.location.hash)
    }
  }, [])

  const dismissVerifyNotice = useCallback(() => setVerifyNotice(null), [])

  return (
    <main className="home-page">
      {verifyNotice && (
        <Toast type={verifyNotice.type} message={verifyNotice.message} onClose={dismissVerifyNotice} />
      )}

      <ShopHeader
        authResult={authResult}
        onSignIn={onSignIn}
        onRegister={onRegister}
        onOpenAdmin={onOpenAdmin}
        onOpenProfile={onOpenProfile}
        onOpenOrders={onOpenOrders}
        onLogout={onLogout}
      />

      <section className="category-strip" aria-label="Product categories">
        {categories.map((category) => (
          <button type="button" key={category}>
            {category}
          </button>
        ))}
      </section>

      <section className="shop-hero">
        <div>
          <p>TechShop Deals</p>
          <h1>Find the right gear for work, gaming, and daily life.</h1>
          <span>
            Browse products first, sign in when you are ready to save carts, wishlists, and
            personalized recommendations.
          </span>
        </div>
        <div className="hero-offer">
          <strong>Up to 35% off</strong>
          <span>Selected laptops and accessories</span>
        </div>
      </section>

      <section className="content-grid">
        <aside className="filter-panel" aria-label="Shopping filters">
          <h2>Filters</h2>
          <label>
            Price range
            <select defaultValue="all">
              <option value="all">All prices</option>
              <option value="budget">Under $200</option>
              <option value="mid">$200 - $800</option>
              <option value="premium">Above $800</option>
            </select>
          </label>
          <label>
            Sort by
            <select defaultValue="popular">
              <option value="popular">Most popular</option>
              <option value="new">Newest</option>
              <option value="price-low">Price: low to high</option>
              <option value="price-high">Price: high to low</option>
            </select>
          </label>
        </aside>

        <section className="product-section" aria-labelledby="product-heading">
          <div className="section-title">
            <div>
              <p>Recommended for you</p>
              <h2 id="product-heading">Featured Products</h2>
            </div>
            <button type="button">View all</button>
          </div>

          <div className="product-grid">
            {products.map((product) => (
              <article className="product-card" key={product.name}>
                <div className="product-visual">
                  <span>{product.category.slice(0, 2).toUpperCase()}</span>
                </div>
                <div className="product-info">
                  <span>{product.badge}</span>
                  <h3>{product.name}</h3>
                  <p>{product.specs}</p>
                  <div>
                    <strong>{product.price}</strong>
                    <button type="button">Add</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  )
}
