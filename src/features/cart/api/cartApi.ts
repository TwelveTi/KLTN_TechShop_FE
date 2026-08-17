import { apiClient } from '../../../shared/api/apiClient'
import type { ApiResponse } from '../../../shared/types/api'
import type { CartItem } from '../types'

/**
 * Cart API client. Talks to the authenticated backend cart endpoints
 * (`/api/v1/cart*`) and maps the server payload onto the `CartItem` shape the
 * cart UI already consumes, so no presentational component needs to change.
 *
 * Pricing/stock are ALWAYS resolved server-side; the frontend never sends money
 * values. Every call returns the full, freshly-priced cart.
 */

export interface ServerCartItem {
  id: string
  productId: string
  variantId: string | null
  name: string | null
  slug: string | null
  variantName: string | null
  sku: string | null
  imageUrl: string | null
  basePrice: number
  salePrice: number | null
  unitPrice: number
  quantity: number
  subtotal: number
  stock: number
  inStock: boolean
  isActive: boolean
  isAvailable: boolean
}

export interface ServerCart {
  id: string
  items: ServerCartItem[]
  subtotal: number
  totalItems: number
  totalLines: number
}

const formatVnd = (value: number): string => `${Math.round(Number(value) || 0).toLocaleString('vi-VN')} ₫`

export function mapServerCartItem(item: ServerCartItem): CartItem {
  const baseName = item.name ?? 'Product'
  const name = item.variantName ? `${baseName} (${item.variantName})` : baseName

  return {
    id: item.id,
    productId: item.productId,
    variantId: item.variantId ?? undefined,
    slug: item.slug ?? undefined,
    name,
    // The backend cart payload intentionally omits category/brand; the cart UI
    // treats these as optional labels, so an empty category is fine.
    category: '',
    brand: undefined,
    price: formatVnd(item.unitPrice),
    rawPrice: Number(item.unitPrice) || 0,
    originalPrice: item.salePrice != null ? formatVnd(item.basePrice) : undefined,
    rawOriginalPrice: item.salePrice != null ? Number(item.basePrice) : undefined,
    imageUrl: item.imageUrl ?? undefined,
    quantity: item.quantity,
    specs: item.sku ?? undefined,
    maxStock: item.stock,
    outOfStock: !item.inStock,
    // The backend does not return a per-line timestamp yet; stamp "now" so the
    // date-grouped cart layout still renders. Once BE exposes createdAt this can
    // map straight through without any UI change.
    addedAt: new Date().toISOString(),
  }
}

export function mapServerCart(cart: ServerCart): CartItem[] {
  return (cart.items || []).map(mapServerCartItem)
}

async function parseCart(response: Response): Promise<ServerCart> {
  const body = (await response.json().catch(() => null)) as ApiResponse<ServerCart> | null

  if (!response.ok || !body?.data) {
    throw new Error(body?.message || 'Cart request failed. Please try again.')
  }

  return body.data
}

export const cartApi = {
  async get(): Promise<CartItem[]> {
    const response = await apiClient('/cart', { auth: true })
    return mapServerCart(await parseCart(response))
  },

  async addItem(input: { productId: string; variantId?: string | null; quantity: number }): Promise<CartItem[]> {
    const response = await apiClient('/cart/items', {
      method: 'POST',
      auth: true,
      body: JSON.stringify({
        productId: input.productId,
        variantId: input.variantId ?? null,
        quantity: input.quantity,
      }),
    })
    return mapServerCart(await parseCart(response))
  },

  async updateItem(itemId: string, quantity: number): Promise<CartItem[]> {
    const response = await apiClient(`/cart/items/${itemId}`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify({ quantity }),
    })
    return mapServerCart(await parseCart(response))
  },

  async removeItem(itemId: string): Promise<CartItem[]> {
    const response = await apiClient(`/cart/items/${itemId}`, {
      method: 'DELETE',
      auth: true,
    })
    return mapServerCart(await parseCart(response))
  },

  async clear(): Promise<CartItem[]> {
    const response = await apiClient('/cart', {
      method: 'DELETE',
      auth: true,
    })
    return mapServerCart(await parseCart(response))
  },
}
