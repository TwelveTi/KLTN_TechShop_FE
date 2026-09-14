import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronDown, LogOut, Package, Search, Settings, ShoppingCart, User } from 'lucide-react'
import Avatar from './ui/Avatar'
import BrandMark from './ui/BrandMark'
import { LinkButton } from './ui/Button'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'

// Thanh điều hướng trên cùng. Hai kiểu:
//  - storefront: đầy đủ tìm kiếm + giỏ hàng + tài khoản
//  - focused:    chỉ logo, dùng cho trang đăng nhập và đặt hàng để khách
//                không bị dụ bấm đi chỗ khác giữa chừng
export default function Header({ variant = 'storefront' }) {
  const { user, isLoggedIn, isAdmin, loading, logout } = useAuth()
  const { totalQuantity } = useCart()
  const navigate = useNavigate()

  const [keyword, setKeyword] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  // Bấm ra ngoài hoặc nhấn Escape thì đóng menu tài khoản.
  useEffect(() => {
    if (!menuOpen) return

    function onPointerDown(event) {
      if (!menuRef.current?.contains(event.target)) setMenuOpen(false)
    }
    function onKeyDown(event) {
      if (event.key === 'Escape') setMenuOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [menuOpen])

  function handleSearch(event) {
    event.preventDefault()
    navigate(`/products?keyword=${encodeURIComponent(keyword.trim())}`)
  }

  async function handleLogout() {
    await logout()
    setMenuOpen(false)
    navigate('/')
  }

  if (variant === 'focused') {
    return (
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex h-16 max-w-page items-center justify-between px-4 sm:px-8">
          <BrandMark />
          <span className="text-sm text-muted">Encrypted connection</span>
        </div>
      </header>
    )
  }

  const menuItems = [
    { to: '/profile', label: 'My account', icon: User },
    { to: '/my-orders', label: 'My orders', icon: Package },
    ...(isAdmin ? [{ to: '/admin', label: 'Admin dashboard', icon: Settings }] : []),
  ]

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface">
      <div className="mx-auto flex h-16 max-w-page items-center gap-4 px-4 sm:px-8">
        <BrandMark />

        <form onSubmit={handleSearch} className="relative hidden flex-1 sm:block">
          <label htmlFor="header-search" className="sr-only">
            Search products
          </label>
          <Search
            size={16}
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint"
          />
          <input
            id="header-search"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Search laptops, phones, accessories…"
            className="h-10 w-full rounded-full border border-line-strong bg-sunken pl-9 pr-4 text-base
              text-heading placeholder:text-faint"
          />
        </form>

        <div className="ml-auto flex items-center gap-2 sm:ml-0">
          <Link
            to="/cart"
            className="relative inline-flex size-10 items-center justify-center rounded-sm text-body
              hover:bg-sunken"
            aria-label={`Cart, ${totalQuantity} ${totalQuantity === 1 ? 'item' : 'items'}`}
          >
            <ShoppingCart size={20} aria-hidden />
            {totalQuantity > 0 && (
              <span
                aria-live="polite"
                className="tabular absolute right-1 top-1 min-w-4 rounded-full bg-primary px-1
                  text-center text-[11px] font-semibold leading-4 text-on-primary"
              >
                {totalQuantity}
              </span>
            )}
          </Link>

          {/* Chưa biết phiên đăng nhập thì để chỗ trống, tránh nhấp nháy chữ
              "Sign in" trước mặt người đang có phiên. */}
          {loading ? (
            <div className="size-9 rounded-full bg-sunken" />
          ) : isLoggedIn ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                className="flex items-center gap-1.5 rounded-full p-0.5 pr-2 hover:bg-sunken"
              >
                <Avatar name={user.fullName || user.email} src={user.avatarUrl} />
                <ChevronDown size={14} aria-hidden className="text-muted" />
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full z-40 mt-2 w-60 overflow-hidden rounded-md
                    border border-line bg-raised shadow-md"
                >
                  <div className="border-b border-line px-4 py-3">
                    <p className="truncate text-sm font-semibold text-heading">
                      {user.fullName || 'Customer'}
                    </p>
                    <p className="truncate text-caption text-muted">{user.email}</p>
                  </div>

                  {menuItems.map(({ to, label, icon: Icon }) => (
                    <Link
                      key={to}
                      to={to}
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-sunken"
                    >
                      <Icon size={16} aria-hidden className="text-muted" />
                      {label}
                    </Link>
                  ))}

                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 border-t border-line px-4 py-2.5
                      text-sm text-danger-strong hover:bg-sunken"
                  >
                    <LogOut size={16} aria-hidden />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <LinkButton to="/login" variant="ghost" size="sm" className="hidden sm:inline-flex">
                Sign in
              </LinkButton>
              <LinkButton to="/register" variant="primary" size="sm">
                Sign up
              </LinkButton>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
