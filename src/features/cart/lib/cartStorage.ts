import type { ProductItem } from '../../../shared/components/ProductCard'
import type { CartItem } from '../types'

const CART_STORAGE_KEY = 'techshop_cart'
const CART_EVENT_NAME = 'techshop_cart_updated'

// Seed cart with realistic initial items across two days so the
// "grouped by added date" layout is demonstrable on a fresh visit.
const DEFAULT_INITIAL_CART: CartItem[] = [
  {
    id: 'p-1',
    name: 'AeroBook Pro 14 (M3 Max)',
    category: 'Laptops',
    brand: 'Apple',
    price: '$1,899',
    rawPrice: 1899,
    quantity: 1,
    specs: 'M3 Max 12-core, 32GB RAM, 1TB SSD',
    specsList: ['M3 Max 12-core', '32GB RAM', '1TB SSD'],
    maxStock: 8,
    addedAt: '2026-08-10T09:15:00.000Z',
  },
  {
    id: 'p-3',
    name: 'Pulse Pro Wireless Mechanical Keyboard',
    category: 'Keyboards',
    brand: 'Keychron',
    price: '$149',
    rawPrice: 149,
    quantity: 1,
    specs: 'Hot-swappable, PBT keycaps, BT/2.4G',
    specsList: ['Hot-swappable', 'PBT Keycaps', 'BT/2.4G'],
    maxStock: 15,
    addedAt: '2026-08-10T08:40:00.000Z',
  },
  {
    id: 'p-6',
    name: 'SonicPods Max ANC Studio Headset',
    category: 'Audio',
    brand: 'Sony',
    price: '$179',
    rawPrice: 179,
    originalPrice: '$229',
    rawOriginalPrice: 229,
    quantity: 1,
    specs: 'Hybrid ANC, Hi-Res LDAC, 40h battery',
    specsList: ['Hybrid ANC', 'Hi-Res LDAC', '40h Battery'],
    maxStock: 20,
    addedAt: '2026-08-09T14:05:00.000Z',
  },
]

/**
 * Ensure every item has an `addedAt`. Older stored carts (written before this
 * field existed) are migrated in place so grouping never breaks. A real
 * backend response can be passed through the same normalizer.
 */
function normalizeCart(items: CartItem[]): CartItem[] {
  const fallback = new Date().toISOString()
  return items.map((item) => (item.addedAt ? item : { ...item, addedAt: fallback }))
}

export function parsePriceNumber(priceStr: string | number | undefined): number {
  if (typeof priceStr === 'number') return priceStr
  if (!priceStr) return 0
  const cleaned = String(priceStr).replace(/[^0-9.]/g, '')
  return Number(cleaned) || 0
}

export function readStoredCart(): CartItem[] {
  if (typeof window === 'undefined') {
    return DEFAULT_INITIAL_CART
  }

  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY)
    if (!raw) {
      // First visit: initialize with default initial cart
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(DEFAULT_INITIAL_CART))
      return DEFAULT_INITIAL_CART
    }
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? normalizeCart(parsed) : DEFAULT_INITIAL_CART
  } catch {
    return DEFAULT_INITIAL_CART
  }
}

export function writeStoredCart(items: CartItem[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
    window.dispatchEvent(new CustomEvent(CART_EVENT_NAME, { detail: items }))
  } catch {
    // Ignore storage write errors
  }
}

export function getCartTotalQuantity(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + (item.quantity || 1), 0)
}

export function getCartSubtotalAmount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.rawPrice * (item.quantity || 1), 0)
}

export function createCartItemFromProduct(product: ProductItem, qty = 1): CartItem {
  const rawPrice = parsePriceNumber(product.price)
  const rawOriginalPrice = product.originalPrice ? parsePriceNumber(product.originalPrice) : undefined
  const id = product.id || String(product.name)

  return {
    id,
    name: product.name,
    category: product.category || 'Hardware',
    brand: product.brand,
    price: product.price || `$${rawPrice.toLocaleString()}`,
    rawPrice,
    originalPrice: product.originalPrice,
    rawOriginalPrice,
    imageUrl: product.imageUrl,
    quantity: Math.max(1, qty),
    specs: product.specs,
    specsList: product.specsList,
    maxStock: product.stockQuantity || 20,
    outOfStock: product.outOfStock,
    addedAt: new Date().toISOString(),
  }
}

export interface CartDateGroup {
  /** Calendar day key (YYYY-MM-DD) used for stable grouping. */
  dateKey: string
  /** Human-readable heading, e.g. "AUGUST 10, 2026". */
  label: string
  items: CartItem[]
}

const dateKeyOf = (iso: string): string => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 'unknown'
  // Local calendar day (not UTC) so grouping matches what the user sees.
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const formatDateHeading = (iso: string): string => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 'Recently added'
  return d
    .toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    .toUpperCase()
}

/**
 * Group cart items by the calendar day they were added, newest day first.
 * Order within a day preserves the incoming array order. Purely derived —
 * no state — so it works identically for local or backend-provided carts.
 */
export function groupCartItemsByDate(items: CartItem[]): CartDateGroup[] {
  const groups = new Map<string, CartDateGroup>()

  for (const item of items) {
    const key = dateKeyOf(item.addedAt)
    const existing = groups.get(key)
    if (existing) {
      existing.items.push(item)
    } else {
      groups.set(key, { dateKey: key, label: formatDateHeading(item.addedAt), items: [item] })
    }
  }

  return Array.from(groups.values()).sort((a, b) => (a.dateKey < b.dateKey ? 1 : -1))
}
