import type { AuthResult } from '../../auth/types'
import { Navbar } from '../../../shared/components/Navbar'

type ShopHeaderProps = {
  authResult: AuthResult | null
  onSignIn: () => void
  onRegister: () => void
  onOpenAdmin: () => void
  onOpenProfile: () => void
  onOpenOrders: () => void
  onLogout: () => void | Promise<void>
  onSearch?: (query: string) => void
  onOpenCart?: () => void
  cartCount?: number
}

// Backwards compatibility export for HeaderIcon
export function HeaderIcon({ name }: { name: 'bell' | 'cart' | 'user' | 'orders' }) {
  const commonProps = {
    width: 21,
    height: 21,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }

  if (name === 'bell') {
    return (
      <svg {...commonProps}>
        <path d="M10 21h4" />
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      </svg>
    )
  }

  if (name === 'cart') {
    return (
      <svg {...commonProps}>
        <path d="M6 6h15l-2 8H8L6 3H3" />
        <circle cx="9" cy="20" r="1" />
        <circle cx="18" cy="20" r="1" />
      </svg>
    )
  }

  if (name === 'orders') {
    return (
      <svg {...commonProps}>
        <path d="M7 3h10l3 4v14H4V7l3-4Z" />
        <path d="M7 3v4h10V3" />
        <path d="M8 12h8" />
        <path d="M8 16h5" />
      </svg>
    )
  }

  return (
    <svg {...commonProps}>
      <path d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

export function ShopHeader({
  authResult,
  onSignIn,
  onRegister,
  onOpenAdmin,
  onOpenProfile,
  onOpenOrders,
  onLogout,
  onSearch,
  onOpenCart,
  cartCount,
}: ShopHeaderProps) {
  return (
    <Navbar
      user={authResult?.user || null}
      onSignIn={onSignIn}
      onRegister={onRegister}
      onOpenAdmin={onOpenAdmin}
      onOpenProfile={onOpenProfile}
      onOpenOrders={onOpenOrders}
      onLogout={onLogout}
      onSearch={onSearch}
      onOpenCart={onOpenCart}
      cartCount={cartCount}
    />
  )
}


