import type { ProductItem } from '../../shared/components/ProductCard'

export interface CartItem {
  /**
   * UI key for the line. In guest (local) mode this is the product id. In
   * authenticated (server) mode this is the backend cart-item id, so quantity
   * updates and removals can target the exact line via `/cart/items/:itemId`.
   */
  id: string
  /**
   * Backend product id. Populated in server mode and (best-effort) in guest
   * mode so a guest cart can be merged into the server cart on login, and so
   * "open product" navigation always uses the product id, never the line id.
   */
  productId?: string
  /** Backend variant id when a specific variant was chosen. */
  variantId?: string
  /** Product slug (server mode) — handy for navigation/SEO links. */
  slug?: string
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
  /** True while the cart is being synced with the backend (e.g. after login). */
  isSyncing: boolean
  /**
   * Add a product to the cart. Resolves to `true` on success, `false` when the
   * backend rejected it (out of stock, not orderable, etc.). Guest mode always
   * resolves `true`. `opts.variantId` selects a specific backend variant.
   */
  addToCart: (product: ProductItem, qty?: number, opts?: { variantId?: string | null }) => Promise<boolean>
  updateQuantity: (id: string, quantity: number) => void
  removeFromCart: (id: string) => void
  restoreItem: (item: CartItem) => void
  clearCart: () => void
}
