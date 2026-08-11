import type { ReactNode } from 'react'
import type { AuthResult } from '../../features/auth/types'
import { useCart } from '../../features/cart/context/CartContext'
import { GlobalHeader } from './GlobalHeader'
import { Footer } from '../components/Footer'
import './layout.css'

export interface UserLayoutProps {
  authResult: AuthResult | null
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
  showFooter?: boolean
  activeCategory?: string
  className?: string
  children: ReactNode
}

export function UserLayout({
  authResult,
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
  showFooter = true,
  activeCategory,
  className = '',
  children,
}: UserLayoutProps) {
  const { cartCount } = useCart()

  return (
    <div className={`ts-user-layout ${className}`}>
      <GlobalHeader
        authResult={authResult}
        cartCount={cartCount}
        onSignIn={onSignIn}
        onRegister={onRegister}
        onOpenAdmin={onOpenAdmin}
        onOpenProfile={onOpenProfile}
        onOpenOrders={onOpenOrders}
        onLogout={onLogout}
        onSearch={onSearch}
        onOpenCart={onOpenCart}
        onOpenCatalog={onOpenCatalog}
        showDepartmentBar={showDepartmentBar}
        activeCategory={activeCategory}
      />

      <div className="ts-user-layout__content">{children}</div>

      {showFooter && <Footer />}
    </div>
  )
}
