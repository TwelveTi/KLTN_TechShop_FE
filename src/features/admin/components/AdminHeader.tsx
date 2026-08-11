import { useEffect, useRef } from 'react'
import { Icon } from '../../../shared/components/Icon'
import type { AuthResult } from '../../auth/types'
import type { AdminSection } from '../types'

interface AdminHeaderProps {
  activeSection: AdminSection
  authResult: AuthResult | null
  loading: boolean
  searchQuery: string
  onSearchChange: (query: string) => void
  onRefresh: () => void
  onToggleMobileSidebar: () => void
  onBackToShop: () => void
}

const SECTION_TITLES: Record<AdminSection, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Dashboard Overview',
    subtitle: 'Store performance, live sales metrics, and fulfillment status',
  },
  products: {
    title: 'Product Catalog',
    subtitle: 'Manage inventory items, pricing, specs, variants, and stock',
  },
  categories: {
    title: 'Category Taxonomy',
    subtitle: 'Organize your store catalog into searchable departments',
  },
  brands: {
    title: 'Brand Partners',
    subtitle: 'Manufacturer directory and hardware brand associations',
  },
  orders: {
    title: 'Orders & Fulfillment',
    subtitle: 'Track customer orders, payment status, and shipping milestones',
  },
  users: {
    title: 'User Accounts',
    subtitle: 'Manage registered customer profiles and staff administrator roles',
  },
  planned: {
    title: 'Planned Modules',
    subtitle: 'Upcoming backend integrations and administrative features',
  },
}

export function AdminHeader({
  activeSection,
  authResult,
  loading,
  searchQuery,
  onSearchChange,
  onRefresh,
  onToggleMobileSidebar,
  onBackToShop,
}: AdminHeaderProps) {
  const searchInputRef = useRef<HTMLInputElement>(null)
  const meta = SECTION_TITLES[activeSection] || {
    title: 'Admin Console',
    subtitle: 'Store administration and inventory management',
  }

  // Focus search input on '/' shortcut when not inside another input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const adminName = authResult?.user.fullName || 'Admin User'
  const adminEmail = authResult?.user.email || 'admin@techshop.dev'
  const initials = adminName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <header className="ts-admin-header">
      <div className="ts-admin-header__left">
        <button
          type="button"
          className="ts-admin-header__menu-btn"
          onClick={onToggleMobileSidebar}
          aria-label="Toggle navigation menu"
        >
          <Icon name="menu" size={20} />
        </button>

        <div className="ts-admin-header__title-block">
          <nav className="ts-admin-header__breadcrumbs" aria-label="Breadcrumb">
            <span className="ts-admin-breadcrumb-root" onClick={onBackToShop}>TechShop</span>
            <span className="ts-admin-breadcrumb-sep">/</span>
            <span className="ts-admin-breadcrumb-current">{meta.title}</span>
          </nav>
          <h1 className="ts-admin-header__title">{meta.title}</h1>
        </div>
      </div>

      <div className="ts-admin-header__right">
        {/* Quick Search */}
        <div className="ts-admin-header__search">
          <span className="ts-admin-header__search-icon" aria-hidden="true">
            <Icon name="search" size={16} />
          </span>
          <input
            ref={searchInputRef}
            type="text"
            className="ts-admin-header__search-input"
            placeholder="Search catalog, orders, users... (Press /)"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="ts-admin-header__search-clear"
              onClick={() => onSearchChange('')}
              aria-label="Clear search"
            >
              <Icon name="x" size={14} />
            </button>
          )}
        </div>

        {/* Refresh button */}
        <button
          type="button"
          className={`ts-admin-btn-icon ${loading ? 'is-loading' : ''}`}
          onClick={onRefresh}
          disabled={loading}
          title="Refresh live data"
          aria-label="Refresh data"
        >
          <Icon name="refresh-cw" size={16} />
        </button>

        {/* User profile badge */}
        <div className="ts-admin-header__profile" title={adminEmail}>
          <div className="ts-admin-avatar">{initials}</div>
          <div className="ts-admin-profile-info">
            <span className="ts-admin-profile-name">{adminName}</span>
            <span className="ts-admin-profile-role">{adminEmail}</span>
          </div>
        </div>
      </div>
    </header>
  )
}
