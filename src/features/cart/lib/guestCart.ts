import { createVersionedStore } from '@core/storage/versionedStorage'
import { type CartLine, clampQuantity } from '@domain/cart'
import { maxOrderableQuantity, type Product } from '@domain/product'
import { dayKey, formatDayHeading } from '@shared/utils/date'

/**
 * Giỏ hàng của khách chưa đăng nhập, lưu trong localStorage.
 *
 * Version 2 = shape dùng `unitPriceVnd: number`. Giỏ v1 (giá là chuỗi đã
 * format) tự động bị bỏ khi đọc, nên không cần `parsePriceNumber` để đoán
 * ngược, và cũng không cần danh sách tên sản phẩm mock hardcode nữa.
 */
const GUEST_CART_VERSION = 2

const store = createVersionedStore<CartLine[]>({
  key: 'techshop_cart',
  version: GUEST_CART_VERSION,
  fallback: () => [],
  validate: (value): value is CartLine[] =>
    Array.isArray(value) && value.every((line) => typeof (line as CartLine)?.unitPriceVnd === 'number'),
})

export const readGuestCart = store.read
export const writeGuestCart = store.write
export const clearGuestCart = store.clear
export const subscribeGuestCart = store.subscribeCrossTab

/** Dựng một dòng giỏ từ sản phẩm trong catalog. */
export function toCartLine(product: Product, quantity = 1): CartLine {
  return {
    id: product.id,
    productId: product.id,
    name: product.name,
    category: product.category || 'Technology',
    brand: product.brand,
    unitPriceVnd: product.priceVnd,
    originalUnitPriceVnd: product.originalPriceVnd,
    imageUrl: product.imageUrl,
    quantity: clampQuantity(quantity, maxOrderableQuantity(product.stockQuantity)),
    specs: product.specs,
    specsList: product.specsList,
    maxStock: maxOrderableQuantity(product.stockQuantity),
    outOfStock: product.outOfStock,
    addedAt: new Date().toISOString(),
  }
}

export interface CartDateGroup {
  /** Khoá ngày (YYYY-MM-DD) để gom nhóm ổn định. */
  dateKey: string
  /** Tiêu đề hiển thị, ví dụ "AUGUST 24, 2026". */
  label: string
  lines: CartLine[]
}

/** Gom dòng giỏ theo ngày thêm vào, ngày mới nhất lên trước. */
export function groupCartLinesByDate(lines: readonly CartLine[]): CartDateGroup[] {
  const groups = new Map<string, CartDateGroup>()

  for (const line of lines) {
    const key = dayKey(line.addedAt)
    const existing = groups.get(key)
    if (existing) {
      existing.lines.push(line)
    } else {
      groups.set(key, { dateKey: key, label: formatDayHeading(line.addedAt), lines: [line] })
    }
  }

  return Array.from(groups.values()).sort((a, b) => (a.dateKey < b.dateKey ? 1 : -1))
}
