import { Icon, type IconName } from '../../../shared/components/Icon'
import type { AdminSection } from '../types'

export interface SidebarItem {
  id: AdminSection
  label: string
  icon: IconName
  badge?: number | string
  badgeVariant?: 'neutral' | 'info' | 'warning' | 'danger'
}

interface AdminSidebarProps {
  activeSection: AdminSection
  onSelectSection: (section: AdminSection) => void
  onBackToShop: () => void
  onCloseMobile?: () => void
  pendingOrdersCount?: number
  lowStockCount?: number
}

export function AdminSidebar({
  activeSection,
  onSelectSection,
  onBackToShop,
  onCloseMobile,
  pendingOrdersCount = 0,
  lowStockCount = 0,
}: AdminSidebarProps) {
  const navItems: SidebarItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: 'grid' },
    {
      id: 'products',
      label: 'Products',
      icon: 'package',
      badge: lowStockCount > 0 ? `${lowStockCount} low` : undefined,
      badgeVariant: 'warning',
    },
    { id: 'categories', label: 'Categories', icon: 'folder' },
    { id: 'brands', label: 'Brands', icon: 'tag' },
    {
      id: 'orders',
      label: 'Orders',
      icon: 'shopping-bag',
      badge: pendingOrdersCount > 0 ? pendingOrdersCount : undefined,
      badgeVariant: 'info',
    },
    { id: 'users', label: 'Users', icon: 'users' },
    { id: 'planned', label: 'Planned Modules', icon: 'layers' },
  ]

  const handleNavClick = (sectionId: AdminSection) => {
    onSelectSection(sectionId)
    onCloseMobile?.()
  }

  return (
    <aside className="ts-admin-sidebar">
      <div className="ts-admin-sidebar__header">
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault()
            onBackToShop()
          }}
          className="ts-admin-brand"
        >
          <div className="ts-admin-brand__logo">TS</div>
          <div className="ts-admin-brand__meta">
            <span className="ts-admin-brand__name">TechShop</span>
            <span className="ts-admin-brand__tag">Admin Console</span>
          </div>
        </a>

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
          {navItems.map((item) => {
            const isActive = activeSection === item.id
            return (
              <button
                key={item.id}
                type="button"
                className={`ts-admin-nav-item ${isActive ? 'is-active' : ''}`}
                onClick={() => handleNavClick(item.id)}
                aria-current={isActive ? 'page' : undefined}
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
              </button>
            )
          })}
        </div>
      </nav>

      <div className="ts-admin-sidebar__footer">
        <button
          type="button"
          className="ts-admin-nav-item ts-admin-nav-item--back"
          onClick={onBackToShop}
        >
          <Icon name="arrow-left" size={18} />
          <span>Back to Storefront</span>
        </button>
      </div>
    </aside>
  )
}
