import type { ProductItem } from '../../../shared/components/ProductCard'
import type { CartItem } from '../types'

const CART_STORAGE_KEY = 'techshop_cart'
const CART_EVENT_NAME = 'techshop_cart_updated'

const DEFAULT_INITIAL_CART: CartItem[] = []

/**
 * Filter out any old legacy mock products from previous development iterations
 * (e.g. products with IDs 'p-1', '$' prices, or old placeholder mock names).
 */
function isLegacyMockItem(item: any): boolean {
  if (!item || typeof item !== 'object') return true
  const id = String(item.id || '')
  const name = String(item.name || '')
  const price = String(item.price || '')

  // Legacy mock IDs were 'p-1', 'p-2', 'p-3', etc.
  if (/^p-\d+$/i.test(id)) return true
  if (price.startsWith('$')) return true

  const mockKeywords = [
    'aerobook',
    'novaphone',
    'pulse pro',
    'glidemouse',
    'beacon 4k',
    'prostation',
    'xps 15',
    'focusview',
    'sonicpods',
    'viper v3',
    'rog swift',
  ]
  if (mockKeywords.some((k) => name.toLowerCase().includes(k))) return true

  return false
}

/**
 * Ensure every item has an `addedAt`. Older stored carts (written before this
 * field existed) are migrated in place so grouping never breaks.
 */
function normalizeCart(items: CartItem[]): CartItem[] {
  const fallback = new Date().toISOString()
  return items.map((item) => (item.addedAt ? item : { ...item, addedAt: fallback }))
}

export function parsePriceNumber(priceStr: string | number | undefined): number {
  if (typeof priceStr === 'number') return priceStr
  if (!priceStr) return 0
  // Remove currency symbols, spaces, and thousand-separators (both dots and commas)
  const cleaned = String(priceStr).replace(/[^0-9]/g, '')
  return Number(cleaned) || 0
}

export function readStoredCart(): CartItem[] {
  if (typeof window === 'undefined') {
    return DEFAULT_INITIAL_CART
  }

  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(DEFAULT_INITIAL_CART))
      return DEFAULT_INITIAL_CART
    }
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      // Cleanse any legacy mock items from user's local storage
      const cleanItems = parsed.filter((item) => !isLegacyMockItem(item))
      if (cleanItems.length !== parsed.length) {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cleanItems))
      }
      return normalizeCart(cleanItems)
    }
    return DEFAULT_INITIAL_CART
  } catch {
    return DEFAULT_INITIAL_CART
  }
}

export function writeStoredCart(items: CartItem[]) {
  if (typeof window === 'undefined') return
  try {
    const cleanItems = items.filter((item) => !isLegacyMockItem(item))
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cleanItems))
    window.dispatchEvent(new CustomEvent(CART_EVENT_NAME, { detail: cleanItems }))
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
  const formattedPrice = product.price || `${rawPrice.toLocaleString('vi-VN')} ₫`

  return {
    id,
    name: product.name,
    category: product.category || 'Technology',
    brand: product.brand,
    price: formattedPrice,
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
  /** Human-readable heading, e.g. "TODAY" or "AUGUST 10, 2026". */
  label: string
  items: CartItem[]
}

const dateKeyOf = (iso: string): string => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 'unknown'
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
