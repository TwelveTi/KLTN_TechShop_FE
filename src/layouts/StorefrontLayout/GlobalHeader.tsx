import type { AuthResult } from '@features/auth'
import { Navbar } from './Navbar'
import { DepartmentBar } from './DepartmentBar'

export interface GlobalHeaderProps {
  authResult: AuthResult | null
  cartCount?: number
  notificationCount?: number
  onLogout: () => void | Promise<void>
  activeCategory?: string
  className?: string
}

/**
 * Header cố định trên cùng: thanh điều hướng + thanh danh mục.
 *
 * Chín prop `onOpenX` của v1 đã biến mất — Navbar và DepartmentBar tự render
 * `<Link>` tới `paths.*`. Chỉ còn `onLogout` là prop, vì đăng xuất là một HÀNH
 * ĐỘNG chứ không phải một điểm đến.
 */
export function GlobalHeader({
  authResult,
  cartCount = 0,
  notificationCount = 0,
  onLogout,
  activeCategory,
  className = '',
}: GlobalHeaderProps) {
  return (
    <div className={`ts-global-header ${className}`}>
      <Navbar
        user={authResult?.user ?? null}
        cartCount={cartCount}
        notificationCount={notificationCount}
        onLogout={onLogout}
      />
      <DepartmentBar activeCategory={activeCategory} />
    </div>
  )
}
