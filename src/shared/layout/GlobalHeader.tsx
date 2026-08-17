import type { AuthResult } from '../../features/auth/types'
import { Navbar } from '../components/Navbar'
import { DepartmentBar } from './DepartmentBar'

export interface GlobalHeaderProps {
  authResult: AuthResult | null
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
  onOpenCatalog?: (categorySlug?: string) => void
  showDepartmentBar?: boolean
  activeCategory?: string
  className?: string
}

export function GlobalHeader({
  authResult,
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
  onOpenCatalog,
  showDepartmentBar = true,
  activeCategory,
  className = '',
}: GlobalHeaderProps) {
  // The header stays pinned to the top at all times (sticky via CSS); it never
  // auto-hides on scroll so navigation, search and cart are always reachable.
  return (
    <div className={`ts-global-header ${className}`}>
      <Navbar
        user={authResult?.user || null}
        cartCount={cartCount}
        notificationCount={notificationCount}
        onSignIn={onSignIn}
        onRegister={onRegister}
        onOpenAdmin={onOpenAdmin}
        onOpenProfile={onOpenProfile}
        onOpenOrders={onOpenOrders}
        onLogout={onLogout}
        onSearch={onSearch}
        onOpenCart={onOpenCart}
      />

      {showDepartmentBar && (
        <DepartmentBar
          onSelectCategory={onOpenCatalog}
          activeCategory={activeCategory}
        />
      )}
    </div>
  )
}
