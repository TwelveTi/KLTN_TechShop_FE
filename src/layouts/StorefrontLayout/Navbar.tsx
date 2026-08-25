import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from '@core/router'
import { paths } from '@routes/paths'
import { Icon } from '@shared/ui/Icon'
import { BrandMark } from '@shared/ui/BrandMark'
import { Avatar } from '@shared/ui/Avatar'
import { Button } from '@shared/ui/Button'

export interface NavbarUser {
  fullName: string
  email: string
  role: 'USER' | 'ADMIN' | string
}

export interface NavbarProps {
  user: NavbarUser | null
  cartCount?: number
  notificationCount?: number
  onLogout: () => void | Promise<void>
}

/**
 * Thanh điều hướng chính.
 *
 * Mọi ĐIỂM ĐẾN là `<Link>` tới `paths.*`; chỉ HÀNH ĐỘNG (đăng xuất) mới là
 * prop. v1 nhận 8 callback điều hướng, tất cả xâu chuỗi từ `App.tsx` — nghĩa
 * là thêm một mục menu phải sửa bốn file.
 */
export function Navbar({ user, cartCount = 0, notificationCount = 0, onLogout }: NavbarProps) {
  const navigate = useNavigate()
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
    const keyword = searchQuery.trim()
    if (keyword) navigate(paths.search(keyword))
  }

  return (
    <header className="ts-navbar">
      <div className="ts-navbar__container">
        <Link to={paths.home()} exact aria-label="TechShop homepage">
          <BrandMark />
        </Link>

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

          <Link
            to={paths.cart()}
            className="ts-navbar__icon-btn"
            aria-label={`Open cart with ${cartCount} ${cartCount === 1 ? 'item' : 'items'}`}
          >
            <Icon name="cart" size={20} />
            {cartCount > 0 && (
              <span className="ts-navbar__cart-badge tabular-nums" aria-hidden="true">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </Link>
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
                  <Link
                    to={paths.profile.root()}
                    className="ts-navbar__menu-item"
                    role="menuitem"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Icon name="user" size={16} />
                    My profile
                  </Link>
                  <Link
                    to={paths.profile.orders()}
                    className="ts-navbar__menu-item"
                    role="menuitem"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Icon name="orders" size={16} />
                    My orders
                  </Link>
                  {user.role === 'ADMIN' && (
                    <Link
                      to={paths.admin.root()}
                      className="ts-navbar__menu-item ts-navbar__menu-item--admin"
                      role="menuitem"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Icon name="sparkles" size={16} />
                      Admin Center
                    </Link>
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
              <Button variant="ghost" size="sm" onClick={() => navigate(paths.auth('login'))}>
                Sign in
              </Button>
              <Button variant="primary" size="sm" onClick={() => navigate(paths.auth('register'))}>
                Register
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
