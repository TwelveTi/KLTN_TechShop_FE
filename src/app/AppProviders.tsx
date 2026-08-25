import type { ReactNode } from 'react'
import { ToastProvider } from '@shared/ui/ToastProvider'
import { AuthProvider } from '@features/auth'
import { CartProvider } from '@features/cart'

/**
 * Thứ tự lồng provider KHÔNG tuỳ ý — nó là đồ thị phụ thuộc giữa các context
 * (ARCHITECTURE.md §7):
 *
 *   ToastProvider   ngoài cùng — Auth và Cart cần phát toast lỗi
 *   └── AuthProvider    Cart cần biết đã đăng nhập chưa để chọn chế độ giỏ
 *       └── CartProvider
 *
 * GĐ3 sẽ thêm RouterProvider vào trong cùng, để route guard đọc được Auth.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <AuthProvider>
        <CartProvider>{children}</CartProvider>
      </AuthProvider>
    </ToastProvider>
  )
}
