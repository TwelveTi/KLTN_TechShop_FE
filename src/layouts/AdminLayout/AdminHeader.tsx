import { Link } from '@core/router'
import { paths } from '@routes/paths'
import { Icon } from '@shared/ui/Icon'
import { initials as toInitials } from '@shared/utils/text'
import type { AuthResult } from '@features/auth'

export type AdminSectionKey =
  | 'dashboard'
  | 'products'
  | 'categories'
  | 'brands'
  | 'orders'
  | 'users'
  | 'planned'

interface AdminHeaderProps {
  activeSection: AdminSectionKey
  authResult: AuthResult | null
  loading: boolean
  onRefresh: () => void
  onToggleMobileSidebar: () => void
}

const SECTION_TITLES: Record<AdminSectionKey, { title: string; subtitle: string }> = {
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
  onRefresh,
  onToggleMobileSidebar,
}: AdminHeaderProps) {
  const meta = SECTION_TITLES[activeSection] || {
    title: 'Admin Console',
    subtitle: 'Store administration and inventory management',
  }

  const adminName = authResult?.user.fullName || 'Admin User'
  const adminEmail = authResult?.user.email || 'admin@techshop.dev'
  const initials = toInitials(adminName)

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
            <Link to={paths.home()} exact className="ts-admin-breadcrumb-root">
              TechShop
            </Link>
            <span className="ts-admin-breadcrumb-sep">/</span>
            <span className="ts-admin-breadcrumb-current">{meta.title}</span>
          </nav>
          <h1 className="ts-admin-header__title">{meta.title}</h1>
        </div>
      </div>

      <div className="ts-admin-header__right">
        {/* v1 có một ô tìm kiếm "toàn cục" ở đây, rồi phải tự định tuyến ký tự
            gõ vào sang đúng bộ lọc của section đang mở. Giờ mỗi bảng có ô tìm
            riêng gắn thẳng vào query string của chính nó. */}

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
