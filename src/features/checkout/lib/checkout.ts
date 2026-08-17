import type { CartItem } from '../../cart/types'
import type { DeliveryMethod } from '../types'

// v1 delivery: a single, transparent standard method. The stated fee is a real
// method cost shown up-front; the backend remains authoritative at place-order.
const FREE_SHIPPING_THRESHOLD = 1_000_000
const STANDARD_SHIPPING_FEE = 30_000

export const STANDARD_DELIVERY: DeliveryMethod = {
  id: 'standard',
  name: 'Standard delivery',
  description: 'Delivered by TechShop logistics partner',
  etaLabel: '2–4 business days',
  fee: STANDARD_SHIPPING_FEE,
}

export const getAvailableDeliveryMethods = (): DeliveryMethod[] => [STANDARD_DELIVERY]

/** Shipping fee for the standard method: free above the threshold. */
export const resolveShippingFee = (subtotal: number, method: DeliveryMethod): number => {
  if (method.id === 'standard' && subtotal >= FREE_SHIPPING_THRESHOLD) return 0
  return method.fee
}

export const sumSubtotal = (items: CartItem[]): number =>
  items.reduce((sum, item) => sum + (item.rawPrice || 0) * (item.quantity || 1), 0)

export const sumQuantity = (items: CartItem[]): number =>
  items.reduce((sum, item) => sum + (item.quantity || 1), 0)

export const formatVnd = (value: number): string => `${Math.round(Number(value) || 0).toLocaleString('vi-VN')} ₫`

// ── Checkout selection hand-off (Cart → Checkout) ───────────────────────────
// The hand-rolled router has no route state, so the cart persists which line
// ids the shopper chose to check out. Checkout reads the live cart and filters
// by these ids (falling back to the whole cart if the hand-off is missing).
const SELECTION_KEY = 'techshop_checkout_selection'

export const setCheckoutSelection = (ids: string[]): void => {
  try {
    sessionStorage.setItem(SELECTION_KEY, JSON.stringify(ids))
  } catch {
    /* ignore storage errors */
  }
}

export const getCheckoutSelection = (): string[] | null => {
  try {
    const raw = sessionStorage.getItem(SELECTION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.map(String) : null
  } catch {
    return null
  }
}

export const clearCheckoutSelection = (): void => {
  try {
    sessionStorage.removeItem(SELECTION_KEY)
  } catch {
    /* ignore */
  }
}

/**
 * Stable idempotency key for a place-order attempt, kept for the lifetime of a
 * checkout session so a refresh/retry cannot create a duplicate order. A new key
 * is minted only when the cart selection changes.
 */
const IDEMPOTENCY_KEY = 'techshop_checkout_idempotency'

export const getIdempotencyKey = (selectionSignature: string): string => {
  try {
    const raw = sessionStorage.getItem(IDEMPOTENCY_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as { signature: string; key: string }
      if (parsed?.signature === selectionSignature && parsed.key) return parsed.key
    }
  } catch {
    /* fall through to mint a new key */
  }
  const key = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `idem-${Date.now()}`
  try {
    sessionStorage.setItem(IDEMPOTENCY_KEY, JSON.stringify({ signature: selectionSignature, key }))
  } catch {
    /* ignore */
  }
  return key
}

export const clearIdempotencyKey = (): void => {
  try {
    sessionStorage.removeItem(IDEMPOTENCY_KEY)
  } catch {
    /* ignore */
  }
}
