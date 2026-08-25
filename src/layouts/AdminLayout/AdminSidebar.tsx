import { Link, useRouteMatch } from '@core/router'
import { paths } from '@routes/paths'
import { Icon, type IconName } from '@shared/ui/Icon'

export interface SidebarItem {
  to: string
  label: string
  icon: IconName
  badge?: number | string
  badgeVariant?: 'neutral' | 'info' | 'warning' | 'danger'
}

interface AdminSidebarProps {
  onCloseMobile?: () => void
  isMobileOpen?: boolean
  pendingOrdersCount?: number
  lowStockCount?: number
}

/**
 * Điều hướng của khu quản trị.
 *
 * Mỗi mục là một `<Link>` tới URL thật, nên `/admin/orders` bookmark được, chia
 * sẻ được và F5 không mất chỗ. v1 giữ mục đang chọn trong `useState`
 * (`activeSection`) nên khu quản trị hoàn toàn không có URL riêng.
 */
export function AdminSidebar({
  onCloseMobile,
  isMobileOpen = false,
  pendingOrdersCount = 0,
  lowStockCount = 0,
}: AdminSidebarProps) {
  const navItems: SidebarItem[] = [
    { to: paths.admin.dashboard(), label: 'Dashboard', icon: 'grid' },
    {
      to: paths.admin.products(),
      label: 'Products',
      icon: 'package',
      badge: lowStockCount > 0 ? `${lowStockCount} low` : undefined,
      badgeVariant: 'warning',
    },
    { to: paths.admin.categories(), label: 'Categories', icon: 'folder' },
    { to: paths.admin.brands(), label: 'Brands', icon: 'tag' },
    {
      to: paths.admin.orders(),
      label: 'Orders',
      icon: 'shopping-bag',
      badge: pendingOrdersCount > 0 ? pendingOrdersCount : undefined,
      badgeVariant: 'info',
    },
    { to: paths.admin.users(), label: 'Users', icon: 'users' },
    { to: paths.admin.planned(), label: 'Planned Modules', icon: 'layers' },
  ]

  return (
    <aside className={`ts-admin-sidebar${isMobileOpen ? ' is-open' : ''}`}>
      <div className="ts-admin-sidebar__header">
        <Link to={paths.home()} exact className="ts-admin-brand">
          <div className="ts-admin-brand__logo">TS</div>
          <div className="ts-admin-brand__meta">
            <span className="ts-admin-brand__name">TechShop</span>
            <span className="ts-admin-brand__tag">Admin Console</span>
          </div>
        </Link>

        {onCloseMobile && (
          <button
            type="button"
            className="ts-admin-sidebar__close-btn"
            onClick={onCloseMobile}
            aria-label="Close sidebar"
          >
            <Icon name="x" size={18} />
          </button>
        )}
      </div>

      <nav className="ts-admin-sidebar__nav" aria-label="Admin Navigation">
        <div className="ts-admin-sidebar__nav-group">
          <span className="ts-admin-sidebar__group-label">Management</span>
          {navItems.map((item) => (
            <AdminNavItem key={item.to} item={item} onNavigate={onCloseMobile} />
          ))}
        </div>
      </nav>

      <div className="ts-admin-sidebar__footer">
        <Link to={paths.home()} exact className="ts-admin-nav-item ts-admin-nav-item--back">
          <Icon name="arrow-left" size={18} />
          <span>Back to Storefront</span>
        </Link>
      </div>
    </aside>
  )
}

/** Tách riêng vì trạng thái "đang chọn" cần một hook, và hook không gọi được trong vòng lặp. */
function AdminNavItem({ item, onNavigate }: { item: SidebarItem; onNavigate?: () => void }) {
  const isActive = useRouteMatch(item.to.split('?')[0])

  return (
    <Link
      to={item.to}
      className={`ts-admin-nav-item ${isActive ? 'is-active' : ''}`}
      onClick={onNavigate}
    >
      <Icon name={item.icon} size={18} className="ts-admin-nav-item__icon" />
      <span className="ts-admin-nav-item__label">{item.label}</span>
      {item.badge !== undefined && (
        <span
          className={`ts-admin-nav-item__badge ts-admin-nav-item__badge--${item.badgeVariant || 'neutral'}`}
        >
          {item.badge}
        </span>
      )}
    </Link>
  )
}
