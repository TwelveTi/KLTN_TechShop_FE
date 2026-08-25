import { http } from '@core/http'
import type { CartLine } from '@domain/cart'
import { toVnd } from '@shared/utils/money'

/**
 * Cart API. Nói chuyện với các endpoint giỏ hàng đã xác thực (`/cart*`) và map
 * payload của server sang `CartLine` của domain.
 *
 * Giá và tồn kho LUÔN do server quyết; frontend không bao giờ gửi số tiền lên.
 * Mọi lời gọi đều trả về toàn bộ giỏ đã được định giá lại.
 */

/** Payload thô của backend. Chỉ mapper bên dưới được đọc kiểu này. */
interface CartItemDto {
  id: string
  productId: string
  variantId: string | null
  name: string | null
  slug: string | null
  variantName: string | null
  sku: string | null
  imageUrl: string | null
  basePrice: number | string
  salePrice: number | string | null
  unitPrice: number | string
  quantity: number
  subtotal: number | string
  stock: number
  inStock: boolean
  isActive: boolean
  isAvailable: boolean
}

interface CartDto {
  id: string
  items: CartItemDto[]
  subtotal: number | string
  totalItems: number
  totalLines: number
}

function toCartLine(dto: CartItemDto): CartLine {
  const baseName = dto.name ?? 'Product'
  const isOnSale = dto.salePrice !== null && dto.salePrice !== undefined

  return {
    id: dto.id,
    productId: dto.productId,
    variantId: dto.variantId ?? undefined,
    slug: dto.slug ?? undefined,
    name: dto.variantName ? `${baseName} (${dto.variantName})` : baseName,
    // Payload giỏ hàng cố ý không trả category/brand; UI coi đây là nhãn phụ.
    category: '',
    brand: undefined,
    unitPriceVnd: toVnd(dto.unitPrice),
    originalUnitPriceVnd: isOnSale ? toVnd(dto.basePrice) : undefined,
    imageUrl: dto.imageUrl ?? undefined,
    quantity: dto.quantity,
    specs: dto.sku ?? undefined,
    maxStock: dto.stock,
    outOfStock: !dto.inStock,
    // Backend chưa trả timestamp theo dòng; đóng dấu "bây giờ" để bố cục nhóm
    // theo ngày vẫn render. Khi BE có `createdAt` thì map thẳng, UI không đổi.
    addedAt: new Date().toISOString(),
  }
}

const toCartLines = (cart: CartDto): CartLine[] => (cart.items || []).map(toCartLine)

export const cartApi = {
  async get(): Promise<CartLine[]> {
    return toCartLines(await http.get<CartDto>('/cart', { auth: true }))
  },

  async addItem(input: {
    productId: string
    variantId?: string | null
    quantity: number
  }): Promise<CartLine[]> {
    return toCartLines(
      await http.post<CartDto>(
        '/cart/items',
        {
          productId: input.productId,
          variantId: input.variantId ?? null,
          quantity: input.quantity,
        },
        { auth: true },
      ),
    )
  },

  async updateItem(itemId: string, quantity: number): Promise<CartLine[]> {
    return toCartLines(await http.patch<CartDto>(`/cart/items/${itemId}`, { quantity }, { auth: true }))
  },

  async removeItem(itemId: string): Promise<CartLine[]> {
    return toCartLines(await http.del<CartDto>(`/cart/items/${itemId}`, { auth: true }))
  },

  async clear(): Promise<CartLine[]> {
    return toCartLines(await http.del<CartDto>('/cart', { auth: true }))
  },
}
