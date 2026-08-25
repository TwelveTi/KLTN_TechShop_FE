import type { Vnd } from './money'
import { DEFAULT_MAX_QUANTITY } from './product'

/**
 * CartLine — một dòng trong giỏ hàng.
 *
 * `id` là khoá của DÒNG, `productId` là khoá của SẢN PHẨM. Ở chế độ khách
 * (localStorage) hai giá trị này trùng nhau; ở chế độ đã đăng nhập `id` là id
 * cart-item của backend để `PATCH /cart/items/:id` nhắm đúng dòng.
 */
export interface CartLine {
  id: string
  productId?: string
  variantId?: string
  slug?: string
  name: string
  category: string
  brand?: string
  unitPriceVnd: Vnd
  /** Giá gốc khi đang giảm — để gạch ngang. */
  originalUnitPriceVnd?: Vnd
  imageUrl?: string
  quantity: number
  specs?: string
  specsList?: string[]
  maxStock?: number
  outOfStock?: boolean
  /** ISO timestamp — dùng cho bố cục nhóm theo ngày. */
  addedAt: string
}

/** Thành tiền của một dòng. */
export function lineTotalVnd(line: Pick<CartLine, 'unitPriceVnd' | 'quantity'>): Vnd {
  return line.unitPriceVnd * Math.max(0, line.quantity)
}

/** Tổng tiền hàng (chưa gồm phí ship và giảm giá). */
export function cartSubtotalVnd(lines: readonly CartLine[]): Vnd {
  return lines.reduce((total, line) => total + lineTotalVnd(line), 0)
}

/** Tổng số món — dùng cho badge trên header. */
export function cartQuantity(lines: readonly CartLine[]): number {
  return lines.reduce((total, line) => total + Math.max(0, line.quantity), 0)
}

/** Kẹp số lượng vào khoảng hợp lệ của dòng đó. */
export function clampQuantity(quantity: number, maxStock?: number): number {
  const ceiling = typeof maxStock === 'number' && maxStock > 0 ? maxStock : DEFAULT_MAX_QUANTITY
  return Math.min(Math.max(1, Math.floor(quantity)), ceiling)
}
