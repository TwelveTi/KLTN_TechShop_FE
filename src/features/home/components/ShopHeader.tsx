import { useState } from 'react'
import type { AuthResult } from '../../auth/types'

type ShopHeaderProps = {
  authResult: AuthResult | null
  onSignIn: () => void
  onRegister: () => void
  onOpenAdmin: () => void
  onOpenProfile: () => void
  onOpenOrders: () => void
  onLogout: () => void | Promise<void>
}

export function HeaderIcon({ name }: { name: 'bell' | 'cart' | 'user' | 'orders' }) {
  const commonProps = {
    width: 21,
    height: 21,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }

  if (name === 'bell') {
    return (
      <svg {...commonProps}>
        <path d="M10 21h4" />
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      </svg>
    )
  }

  if (name === 'cart') {
    return (
      <svg {...commonProps}>
        <path d="M6 6h15l-2 8H8L6 3H3" />
        <circle cx="9" cy="20" r="1" />
        <circle cx="18" cy="20" r="1" />
      </svg>
    )
  }

  if (name === 'orders') {
    return (
      <svg {...commonProps}>
        <path d="M7 3h10l3 4v14H4V7l3-4Z" />
        <path d="M7 3v4h10V3" />
        <path d="M8 12h8" />
        <path d="M8 16h5" />
      </svg>
    )
  }

  return (
    <svg {...commonProps}>
      <path d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

export function ShopHeader({
  authResult,
  onSignIn,
  onRegister,
  onOpenAdmin,
  onOpenProfile,
  onOpenOrders,
  onLogout,
}: ShopHeaderProps) {
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false)
  const initials = authResult?.user.fullName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <header className="shop-header">
      <a className="shop-brand" href="/" aria-label="TechShop home">
        <span>TS</span>
        TechShop
      </a>

      <label className="shop-search">
        <span>Search</span>
        <input placeholder="Search laptops, phones, accessories..." />
        <button type="button">Search</button>
      </label>

      <div className="shop-actions" aria-label="Shop shortcuts">
        <button className="header-icon-button" type="button" aria-label="Open notifications">
          <HeaderIcon name="bell" />
          <span className="notification-dot" aria-hidden="true" />
        </button>
        <button className="header-icon-button" type="button" aria-label="Open cart">
          <HeaderIcon name="cart" />
          <span className="cart-count" aria-label="0 items in cart">
            0
          </span>
        </button>
      </div>

      <div className="shop-account">
        {authResult ? (
          <div className="account-menu-wrap">
            <button
              className="avatar-button"
              type="button"
              onClick={() => setIsAccountMenuOpen((isOpen) => !isOpen)}
              aria-expanded={isAccountMenuOpen}
              aria-label="Open account menu"
            >
              <span>{initials}</span>
              <div>
                <small>Welcome</small>
                <strong>{authResult.user.fullName}</strong>
              </div>
            </button>
            {isAccountMenuOpen && (
              <div className="account-menu">
                <p>{authResult.user.email}</p>
                <span>{authResult.user.role}</span>
                <button type="button" onClick={onOpenProfile}>
                  <HeaderIcon name="user" />
                  My profile
                </button>
                <button type="button" onClick={onOpenOrders}>
                  <HeaderIcon name="orders" />
                  My orders
                </button>
                {authResult.user.role === 'ADMIN' && (
                  <button type="button" onClick={onOpenAdmin}>
                    Admin Center
                  </button>
                )}
                <button type="button" onClick={onLogout}>
                  Sign out
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <button type="button" onClick={onSignIn}>
              Sign in
            </button>
            <button className="primary" type="button" onClick={onRegister}>
              Register
            </button>
          </>
        )}
      </div>
    </header>
  )
}
