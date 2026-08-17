import { createContext, useContext, useEffect, useRef, useState, useMemo, type ReactNode } from 'react'
import type { ProductItem } from '../../../shared/components/ProductCard'
import type { CartContextValue, CartItem } from '../types'
import {
  readStoredCart,
  writeStoredCart,
  getCartTotalQuantity,
  getCartSubtotalAmount,
  createCartItemFromProduct,
} from '../lib/cartStorage'
import { cartApi } from '../api/cartApi'
import { useToast } from '../../../shared/components/Toast'

const CartContext = createContext<CartContextValue | null>(null)

// Only real backend ids (UUID v1–v5) can be sent to the cart API. Mock/fallback
// products carry non-UUID ids, so we skip the server for those.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const isUuid = (value?: string | null): value is string => typeof value === 'string' && UUID_RE.test(value)

export function CartProvider({
  children,
  isAuthenticated = false,
}: {
  children: ReactNode
  /** When true, the cart is backed by the authenticated backend cart API. */
  isAuthenticated?: boolean
}) {
  const { showToast } = useToast()
  const [items, setItems] = useState<CartItem[]>(() => (isAuthenticated ? [] : readStoredCart()))
  const [isSyncing, setIsSyncing] = useState(false)

  // Ref mirror of the auth flag so the memoized cart methods always read the
  // current mode without being re-created on every auth change.
  const authedRef = useRef(false)
  const serverMode = () => authedRef.current

  // Persist to localStorage ONLY in guest mode. In server mode the backend is
  // the source of truth, so we never write server lines back to storage.
  useEffect(() => {
    if (!authedRef.current) {
      writeStoredCart(items)
    }
  }, [items])

  // Cross-tab sync for the guest cart only. The native `storage` event fires
  // exclusively in OTHER tabs, never the one that wrote, so no self-echo here.
  useEffect(() => {
    const handleStorageUpdate = (event: StorageEvent) => {
      if (authedRef.current) return
      if (event.key && event.key !== 'techshop_cart') return
      setItems(readStoredCart())
    }

    window.addEventListener('storage', handleStorageUpdate)
    return () => window.removeEventListener('storage', handleStorageUpdate)
  }, [])

  // React to auth transitions:
  //  - guest → authenticated: merge any guest cart into the server cart, then
  //    load the server cart as the source of truth and clear guest storage.
  //  - authenticated → guest (logout): fall back to the local guest cart.
  useEffect(() => {
    let cancelled = false
    const previous = authedRef.current
    authedRef.current = isAuthenticated

    if (isAuthenticated && !previous) {
      void (async () => {
        setIsSyncing(true)
        try {
          const guestItems = readStoredCart()

          // Best-effort merge: push each guest line to the server. Individual
          // failures (e.g. a stale/out-of-stock product) are ignored so one bad
          // line never blocks the rest of the cart.
          for (const guest of guestItems) {
            const productId = guest.productId ?? guest.id
            if (!isUuid(productId)) continue
            try {
              await cartApi.addItem({
                productId,
                variantId: isUuid(guest.variantId) ? guest.variantId : null,
                quantity: guest.quantity,
              })
            } catch {
              /* ignore individual merge failures */
            }
          }

          const serverItems = await cartApi.get()
          if (cancelled) return
          setItems(serverItems)
          writeStoredCart([]) // guest cart has been merged; clear it
        } catch (error) {
          if (!cancelled) {
            const message = error instanceof Error ? error.message : 'Could not sync your cart.'
            showToast(message, { variant: 'error' })
          }
        } finally {
          if (!cancelled) setIsSyncing(false)
        }
      })()
    } else if (!isAuthenticated && previous) {
      setItems(readStoredCart())
    }

    return () => {
      cancelled = true
    }
    // showToast is stable (from ToastProvider); intentionally keyed on auth only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated])

  // Re-pull the authoritative server cart after a failed optimistic mutation.
  const resyncFromServer = async () => {
    try {
      const serverItems = await cartApi.get()
      setItems(serverItems)
    } catch {
      /* keep the current optimistic state if the resync itself fails */
    }
  }

  const addToCart = async (
    product: ProductItem,
    qty = 1,
    opts?: { variantId?: string | null },
  ): Promise<boolean> => {
    const quantity = Math.max(1, qty)

    if (serverMode()) {
      const productId = product.id
      if (!isUuid(productId)) {
        showToast('This product is not available for online ordering yet.', { variant: 'error' })
        return false
      }
      try {
        const serverItems = await cartApi.addItem({
          productId,
          variantId: isUuid(opts?.variantId) ? opts?.variantId : null,
          quantity,
        })
        setItems(serverItems)
        return true
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Could not add this item to your cart.'
        showToast(message, { variant: 'error' })
        return false
      }
    }

    // Guest / local cart.
    const id = product.id || String(product.name)
    setItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.id === id)

      if (existingIndex >= 0) {
        const next = [...prev]
        const currentItem = next[existingIndex]
        const maxStock = currentItem.maxStock || 20
        next[existingIndex] = {
          ...currentItem,
          quantity: Math.min(currentItem.quantity + quantity, maxStock),
        }
        return next
      }

      const newItem = createCartItemFromProduct(product, quantity)
      // Remember the backend ids so this guest line can be merged on login.
      newItem.productId = product.id
      if (opts?.variantId) newItem.variantId = opts.variantId
      return [newItem, ...prev]
    })
    return true
  }

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id)
      return
    }

    // Optimistic update so the stepper stays snappy in both modes.
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item
        const maxStock = item.maxStock || 20
        return { ...item, quantity: Math.min(Math.max(1, quantity), maxStock) }
      }),
    )

    if (serverMode()) {
      const target = Math.max(1, quantity)
      cartApi
        .updateItem(id, target)
        .then(setItems)
        .catch((error) => {
          const message = error instanceof Error ? error.message : 'Could not update quantity.'
          showToast(message, { variant: 'error' })
          void resyncFromServer()
        })
    }
  }

  const removeFromCart = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))

    if (serverMode()) {
      cartApi
        .removeItem(id)
        .then(setItems)
        .catch((error) => {
          const message = error instanceof Error ? error.message : 'Could not remove this item.'
          showToast(message, { variant: 'error' })
          void resyncFromServer()
        })
    }
  }

  const restoreItem = (item: CartItem) => {
    if (serverMode()) {
      const productId = item.productId ?? item.id
      if (!isUuid(productId)) return
      cartApi
        .addItem({
          productId,
          variantId: isUuid(item.variantId) ? item.variantId : null,
          quantity: item.quantity,
        })
        .then(setItems)
        .catch((error) => {
          const message = error instanceof Error ? error.message : 'Could not restore this item.'
          showToast(message, { variant: 'error' })
        })
      return
    }

    setItems((prev) => {
      const exists = prev.some((i) => i.id === item.id)
      if (exists) return prev
      return [item, ...prev]
    })
  }

  const clearCart = () => {
    setItems([])

    if (serverMode()) {
      cartApi
        .clear()
        .then(setItems)
        .catch(() => {
          void resyncFromServer()
        })
    }
  }

  const cartCount = useMemo(() => getCartTotalQuantity(items), [items])
  const subtotal = useMemo(() => getCartSubtotalAmount(items), [items])
  const total = subtotal // Grand total in v1 matches subtotal (taxes/shipping at checkout)

  const value: CartContextValue = {
    items,
    cartCount,
    subtotal,
    total,
    isSyncing,
    addToCart,
    updateQuantity,
    removeFromCart,
    restoreItem,
    clearCart,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
