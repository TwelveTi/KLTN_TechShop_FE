import type { Vnd } from './money'

/**
 * Product — mô hình sản phẩm dùng chung cho toàn ứng dụng.
 *
 * Tầng `domain/` chỉ import trong nội bộ chính nó (ARCHITECTURE.md §3).
 *
 * Tiền là SỐ (`priceVnd`), không phải chuỗi đã format. Trước GĐ2 type này
 * mang `price: string` khiến giỏ hàng phải parse ngược bằng regex
 * (`parsePriceNumber`) và phải mang song song `price` + `rawPrice`. Cả hai
 * đều đã bị xoá.
 */
export interface Product {
  /** Id backend. Bắt buộc — mọi sản phẩm hiển thị đều đến từ server. */
  id: string
  name: string
  /** Tên danh mục để hiển thị. */
  category: string
  brand?: string
  /** Giá bán thực tế (đã áp khuyến mãi nếu có). */
  priceVnd: Vnd
  /** Giá gốc, chỉ có khi đang giảm giá — dùng để gạch ngang. */
  originalPriceVnd?: Vnd
  badge?: string
  isFeatured?: boolean
  /** Tóm tắt cấu hình dạng một dòng. */
  specs?: string
  specsList?: string[]
  imageUrl?: string
  outOfStock?: boolean
  rating?: number
  reviewCount?: number
  stockQuantity?: number
  shortDescription?: string
}

/** Có đang giảm giá không — dựa trên dữ liệu, không dựa vào chuỗi hiển thị. */
export function isOnSale(product: Pick<Product, 'priceVnd' | 'originalPriceVnd'>): boolean {
  const original = product.originalPriceVnd
  return typeof original === 'number' && original > product.priceVnd
}

/** Phần trăm giảm giá đã làm tròn, hoặc `undefined` nếu không giảm. */
export function discountPercent(
  product: Pick<Product, 'priceVnd' | 'originalPriceVnd'>,
): number | undefined {
  if (!isOnSale(product)) return undefined
  const original = product.originalPriceVnd as number
  return Math.round(((original - product.priceVnd) / original) * 100)
}

/** Có thể thêm vào giỏ không. */
export function isPurchasable(product: Pick<Product, 'outOfStock' | 'stockQuantity'>): boolean {
  if (product.outOfStock) return false
  if (typeof product.stockQuantity === 'number') return product.stockQuantity > 0
  return true
}

/**
 * Số lượng tối đa dùng khi backend CHƯA cho biết tồn kho.
 *
 * Đây là giá trị DỰ PHÒNG, không phải trần cứng cho mỗi đơn: khi đã biết tồn
 * kho thật thì tồn kho thật là trần. (Nếu về sau cửa hàng muốn giới hạn số
 * lượng mỗi đơn, đó là một quy tắc khác và phải đặt tên khác.)
 */
export const DEFAULT_MAX_QUANTITY = 20

export function maxOrderableQuantity(stockQuantity: number | undefined): number {
  if (typeof stockQuantity !== 'number' || stockQuantity <= 0) return DEFAULT_MAX_QUANTITY
  return stockQuantity
}
