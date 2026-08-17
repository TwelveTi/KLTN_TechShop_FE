import { useState, useRef, useEffect } from 'react'
import { Icon } from './Icon'
import { BrandMark } from './BrandMark'
import { Avatar } from './Avatar'
import { Button } from './Button'

export interface NavbarUser {
  fullName: string
  email: string
  role: 'USER' | 'ADMIN' | string
}

export interface NavbarProps {
  user: NavbarUser | null
  cartCount?: number
  notificationCount?: number
  onSignIn: () => void
  onRegister: () => void
  onOpenAdmin: () => void
  onOpenProfile: () => void
  onOpenOrders: () => void
  onLogout: () => void | Promise<void>
  onSearch?: (query: string) => void
  onOpenCart?: () => void
}

export function Navbar({
  user,
  cartCount = 0,
  notificationCount = 0,
  onSignIn,
  onRegister,
  onOpenAdmin,
  onOpenProfile,
  onOpenOrders,
  onLogout,
  onSearch,
  onOpenCart,
}: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isNotifOpen, setIsNotifOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const accountRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)

  // Close either popover on outside-click or Escape.
  useEffect(() => {
    if (!isMenuOpen && !isNotifOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false)
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false)
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false)
        setIsNotifOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isMenuOpen, isNotifOpen])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (onSearch && searchQuery.trim()) {
      onSearch(searchQuery.trim())
    }
  }

  return (
    <header className="ts-navbar">
      <div className="ts-navbar__container">
        <BrandMark />

        <form className="ts-navbar__search" onSubmit={handleSearchSubmit}>
          <label htmlFor="navbar-search-input" className="sr-only">
            Search laptops, phones, accessories
          </label>
          <Icon name="search" size={18} className="ts-navbar__search-icon" />
          <input
            id="navbar-search-input"
            type="text"
            className="ts-navbar__search-input"
            placeholder="Search laptops, phones, accessories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button type="submit" variant="ghost" size="sm" className="ts-navbar__search-btn">
            Search
          </Button>
        </form>

        <div className="ts-navbar__actions">
          <div className="ts-navbar__dropdown-wrap" ref={notifRef}>
            <button
              type="button"
              className="ts-navbar__icon-btn"
              aria-label="Open notifications"
              aria-expanded={isNotifOpen}
              aria-haspopup="menu"
              onClick={() => {
                setIsNotifOpen((prev) => !prev)
                setIsMenuOpen(false)
              }}
            >
              <Icon name="bell" size={20} />
              {notificationCount > 0 && (
                <span className="ts-navbar__badge-dot" aria-hidden="true" />
              )}
            </button>

            {isNotifOpen && (
              <div className="ts-navbar__menu ts-navbar__notif" role="menu">
                <div className="ts-navbar__menu-header">
                  <strong>Notifications</strong>
                </div>
                <div className="ts-navbar__menu-divider" />
                <div className="ts-navbar__notif-empty">
                  <Icon name="bell" size={28} />
                  <p>You’re all caught up</p>
                  <small>Order updates and alerts will appear here.</small>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            className="ts-navbar__icon-btn"
            onClick={onOpenCart}
            aria-label={`Open cart with ${cartCount} ${cartCount === 1 ? 'item' : 'items'}`}
          >
            <Icon name="cart" size={20} />
            {cartCount > 0 && (
              <span className="ts-navbar__cart-badge tabular-nums" aria-hidden="true">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </button>
        </div>

        <div className="ts-navbar__account" ref={accountRef}>
          {user ? (
            <div className="ts-navbar__dropdown-wrap">
              <button
                type="button"
                className="ts-navbar__avatar-btn"
                onClick={() => {
                  setIsMenuOpen((prev) => !prev)
                  setIsNotifOpen(false)
                }}
                aria-expanded={isMenuOpen}
                aria-haspopup="menu"
                aria-label="Open account menu"
              >
                <Avatar name={user.fullName} size="sm" />
                <div className="ts-navbar__user-info">
                  <span className="ts-navbar__greeting">Account</span>
                  <strong className="ts-navbar__user-name">{user.fullName}</strong>
                </div>
              </button>

              {isMenuOpen && (
                <div className="ts-navbar__menu" role="menu">
                  <div className="ts-navbar__menu-header">
                    <strong>{user.fullName}</strong>
                    <small>{user.email}</small>
                  </div>
                  <div className="ts-navbar__menu-divider" />
                  <button
                    type="button"
                    className="ts-navbar__menu-item"
                    role="menuitem"
                    onClick={() => {
                      setIsMenuOpen(false)
                      onOpenProfile()
                    }}
                  >
                    <Icon name="user" size={16} />
                    My profile
                  </button>
                  <button
                    type="button"
                    className="ts-navbar__menu-item"
                    role="menuitem"
                    onClick={() => {
                      setIsMenuOpen(false)
                      onOpenOrders()
                    }}
                  >
                    <Icon name="orders" size={16} />
                    My orders
                  </button>
                  {user.role === 'ADMIN' && (
                    <button
                      type="button"
                      className="ts-navbar__menu-item ts-navbar__menu-item--admin"
                      role="menuitem"
                      onClick={() => {
                        setIsMenuOpen(false)
                        onOpenAdmin()
                      }}
                    >
                      <Icon name="sparkles" size={16} />
                      Admin Center
                    </button>
                  )}
                  <div className="ts-navbar__menu-divider" />
                  <button
                    type="button"
                    className="ts-navbar__menu-item ts-navbar__menu-item--danger"
                    role="menuitem"
                    onClick={() => {
                      setIsMenuOpen(false)
                      onLogout()
                    }}
                  >
                    <Icon name="log-out" size={16} />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="ts-navbar__auth-btns">
              <Button variant="ghost" size="sm" onClick={onSignIn}>
                Sign in
              </Button>
              <Button variant="primary" size="sm" onClick={onRegister}>
                Register
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
