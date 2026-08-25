import type { CartLine } from '@domain/cart'
import type { Product } from '@domain/product'
import type { Vnd } from '@domain/money'

export interface CartContextValue {
  lines: CartLine[]
  cartCount: number
  subtotalVnd: Vnd
  /** True trong lúc đồng bộ giỏ với backend (ví dụ ngay sau khi đăng nhập). */
  isSyncing: boolean
  /**
   * Thêm sản phẩm vào giỏ. `true` nếu thành công, `false` khi backend từ chối
   * (hết hàng, không đặt được…). Chế độ khách luôn trả `true`.
   */
  addToCart: (product: Product, quantity?: number, opts?: { variantId?: string | null }) => Promise<boolean>
  updateQuantity: (lineId: string, quantity: number) => void
  removeFromCart: (lineId: string) => void
  restoreLine: (line: CartLine) => void
  clearCart: () => void
}
