import type { ProductItem } from '../../shared/components/ProductCard'

export interface CartItem {
  id: string
  name: string
  category: string
  brand?: string
  price: string
  rawPrice: number
  originalPrice?: string
  rawOriginalPrice?: number
  imageUrl?: string
  quantity: number
  specs?: string
  specsList?: string[]
  maxStock?: number
  outOfStock?: boolean
  /**
   * ISO timestamp of when the item was added to the cart. Drives the
   * "grouped by date" layout. Locally we set this on add; a real backend
   * can later supply the same field without any UI change.
   */
  addedAt: string
}

export interface CartSummary {
  itemCount: number
  subtotal: number
  total: number
  shippingNotice: string
  taxNotice: string
}

export interface CartContextValue {
  items: CartItem[]
  cartCount: number
  subtotal: number
  total: number
  addToCart: (product: ProductItem, qty?: number) => void
  updateQuantity: (id: string, quantity: number) => void
  removeFromCart: (id: string) => void
  restoreItem: (item: CartItem) => void
  clearCart: () => void
}
