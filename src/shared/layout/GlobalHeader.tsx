import { useState, useEffect } from 'react'
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
  const [headerHidden, setHeaderHidden] = useState(false)

  // Auto-hide the header on scroll down past threshold, reveal on scroll up.
  useEffect(() => {
    let lastY = window.scrollY
    let ticking = false

    const update = () => {
      const y = Math.max(0, window.scrollY)
      if (Math.abs(y - lastY) > 6) {
        setHeaderHidden(y > lastY && y > 90)
        lastY = y
      }
      ticking = false
    }

    const onScroll = () => {
      if (!ticking) {
        ticking = true
        requestAnimationFrame(update)
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className={`ts-global-header ${headerHidden ? 'ts-global-header--hidden' : ''} ${className}`}>
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
