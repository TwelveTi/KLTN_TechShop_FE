import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Bot,
  ChevronDown,
  Clock,
  LogOut,
  Package,
  Search,
  Settings,
  ShoppingCart,
  Trash2,
  User,
  X,
} from 'lucide-react'
import Avatar from './ui/Avatar'
import BrandMark from './ui/BrandMark'
import { LinkButton } from './ui/Button'
import LanguageToggle from './LanguageToggle'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useLanguage } from '../context/LanguageContext'
import userApi from '../api/userApi'

// Thanh điều hướng trên cùng. Hai kiểu:
//  - storefront: đầy đủ tìm kiếm + giỏ hàng + tài khoản
//  - focused:    chỉ logo, dùng cho trang đăng nhập và đặt hàng để khách
//                không bị dụ bấm đi chỗ khác giữa chừng
export default function Header({ variant = 'storefront' }) {
  const { user, isLoggedIn, isAdmin, loading, logout } = useAuth()
  const { totalQuantity } = useCart()
  const { t } = useLanguage()
  const navigate = useNavigate()

  const [keyword, setKeyword] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  const [searchFocused, setSearchFocused] = useState(false)
  const [recentKeywords, setRecentKeywords] = useState([])
  const searchRef = useRef(null)

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

  useEffect(() => {
    if (!searchFocused) return

    function onPointerDown(event) {
      if (!searchRef.current?.contains(event.target)) setSearchFocused(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [searchFocused])

  async function loadRecentKeywords() {
    if (!isLoggedIn) return
    try {
      const data = await userApi.getRecentKeywords(8)
      setRecentKeywords(data?.items || [])
    } catch {
      // Search history might not exist; silently ignore.
    }
  }

  function handleSearchFocus() {
    setSearchFocused(true)
    loadRecentKeywords()
  }

  function handleSearch(event) {
    event.preventDefault()
    setSearchFocused(false)
    navigate(`/products?keyword=${encodeURIComponent(keyword.trim())}`)
  }

  function handlePickKeyword(kw) {
    setKeyword(kw)
    setSearchFocused(false)
    navigate(`/products?keyword=${encodeURIComponent(kw)}`)
  }

  async function handleClearHistory() {
    try {
      await userApi.clearSearchHistory()
      setRecentKeywords([])
    } catch {
      // Ignore
    }
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
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted">{t('Encrypted connection')}</span>
            <LanguageToggle />
          </div>
        </div>
      </header>
    )
  }

  const menuItems = [
    { to: '/profile', label: t('My account'), icon: User },
    { to: '/my-orders', label: t('My orders'), icon: Package },
    ...(isAdmin ? [{ to: '/admin', label: t('Admin dashboard'), icon: Settings }] : []),
  ]

  const showDropdown = searchFocused && !keyword && recentKeywords.length > 0

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface">
      {/* Màn hình nhỏ: ô tìm kiếm rơi xuống hàng thứ hai thay vì biến mất. */}
      <div className="mx-auto flex max-w-page flex-wrap items-center gap-x-2 gap-y-2 px-4 py-3 sm:gap-x-4 sm:h-16 sm:flex-nowrap sm:px-8 sm:py-0">
        <BrandMark />

        <form
          ref={searchRef}
          onSubmit={handleSearch}
          className="relative order-last w-full sm:order-none sm:w-auto sm:flex-1"
        >
          <label htmlFor="header-search" className="sr-only">
            {t('Search products')}
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
            onFocus={handleSearchFocus}
            placeholder={t('Search laptops, phones, accessories…')}
            className="h-10 w-full rounded-full border border-line-strong bg-sunken pl-9 pr-4 text-base
              text-heading placeholder:text-faint"
          />

          {showDropdown && (
            <div className="absolute left-0 right-0 top-full z-40 mt-1 overflow-hidden rounded-md border border-line bg-raised shadow-md">
              <div className="flex items-center justify-between px-4 py-2">
                <span className="text-caption font-medium text-muted">{t('Recent searches')}</span>
                <button
                  type="button"
                  onClick={handleClearHistory}
                  className="flex items-center gap-1 text-caption text-muted hover:text-danger-strong"
                >
                  <Trash2 size={12} aria-hidden />
                  {t('Clear')}
                </button>
              </div>
              <ul>
                {recentKeywords.map((item) => (
                  <li key={item.keyword}>
                    <button
                      type="button"
                      onClick={() => handlePickKeyword(item.keyword)}
                      className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-body hover:bg-sunken"
                    >
                      <Clock size={14} aria-hidden className="shrink-0 text-faint" />
                      <span className="truncate">{item.keyword}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </form>

        <div className="ml-auto flex items-center gap-1 sm:ml-0 sm:gap-2">
          {/* Trợ lý AI là tính năng chính, nên có lối vào thường trực trên mọi trang. */}
          <Link
            to="/advisor"
            aria-label={t('AI advisor')}
            className="inline-flex h-10 items-center gap-1.5 rounded-sm px-2 text-sm font-medium text-body hover:bg-sunken"
          >
            <Bot size={20} aria-hidden />
            <span className="max-md:hidden">{t('AI advisor')}</span>
          </Link>

          <LanguageToggle />

          <Link
            to="/cart"
            className="relative inline-flex size-10 items-center justify-center rounded-sm text-body
              hover:bg-sunken"
            aria-label={t(totalQuantity === 1 ? 'Cart, {count} item' : 'Cart, {count} items', {
              count: totalQuantity,
            })}
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
                aria-label={t('Account menu')}
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                className="flex items-center gap-1.5 rounded-full p-0.5 hover:bg-sunken sm:pr-2"
              >
                <Avatar name={user.fullName || user.email} src={user.avatarUrl} />
                <ChevronDown size={14} aria-hidden className="text-muted max-sm:hidden" />
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full z-40 mt-2 w-60 overflow-hidden rounded-md
                    border border-line bg-raised shadow-md"
                >
                  <div className="border-b border-line px-4 py-3">
                    <p className="truncate text-sm font-semibold text-heading">
                      {user.fullName || t('Customer')}
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
                    {t('Sign out')}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* max-sm:hidden chứ không phải hidden: lớp inline-flex của nút sẽ đè mất hidden. */}
              <LinkButton to="/login" variant="ghost" size="sm" className="max-sm:hidden">
                {t('Sign in')}
              </LinkButton>
              <LinkButton to="/register" variant="primary" size="sm">
                {t('Sign up')}
              </LinkButton>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
