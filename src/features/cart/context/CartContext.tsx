import { createContext, useContext, useEffect, useState, useMemo, type ReactNode } from 'react'
import type { ProductItem } from '../../../shared/components/ProductCard'
import type { CartContextValue, CartItem } from '../types'
import {
  readStoredCart,
  writeStoredCart,
  getCartTotalQuantity,
  getCartSubtotalAmount,
  createCartItemFromProduct,
} from '../lib/cartStorage'

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => readStoredCart())

  // Persist to storage whenever items change. This context is the single
  // source of truth in-tab — consumers read via useCart(), so we must NOT
  // re-read our own write back into state (that caused an update loop:
  // write → custom event → setItems(new ref) → write → …).
  useEffect(() => {
    writeStoredCart(items)
  }, [items])

  // Cross-tab sync only. The native `storage` event fires exclusively in
  // OTHER tabs, never the one that wrote, so there is no self-echo here.
  useEffect(() => {
    const handleStorageUpdate = (event: StorageEvent) => {
      if (event.key && event.key !== 'techshop_cart') return
      setItems(readStoredCart())
    }

    window.addEventListener('storage', handleStorageUpdate)
    return () => window.removeEventListener('storage', handleStorageUpdate)
  }, [])

  const cartCount = useMemo(() => getCartTotalQuantity(items), [items])
  const subtotal = useMemo(() => getCartSubtotalAmount(items), [items])
  const total = subtotal // Grand total in v1 matches subtotal (taxes/shipping calculated at checkout)

  const addToCart = (product: ProductItem, qty = 1) => {
    const id = product.id || String(product.name)

    setItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.id === id)

      if (existingIndex >= 0) {
        const next = [...prev]
        const currentItem = next[existingIndex]
        const maxStock = currentItem.maxStock || 20
        const newQty = Math.min(currentItem.quantity + qty, maxStock)

        next[existingIndex] = {
          ...currentItem,
          quantity: newQty,
        }
        return next
      }

      const newItem = createCartItemFromProduct(product, qty)
      return [newItem, ...prev]
    })
  }

  const updateQuantity = (id: string, quantity: number) => {
    setItems((prev) => {
      if (quantity <= 0) {
        return prev.filter((item) => item.id !== id)
      }

      return prev.map((item) => {
        if (item.id === id) {
          const maxStock = item.maxStock || 20
          return {
            ...item,
            quantity: Math.min(Math.max(1, quantity), maxStock),
          }
        }
        return item
      })
    })
  }

  const removeFromCart = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  const restoreItem = (item: CartItem) => {
    setItems((prev) => {
      const exists = prev.some((i) => i.id === item.id)
      if (exists) return prev
      return [item, ...prev]
    })
  }

  const clearCart = () => {
    setItems([])
  }

  const value: CartContextValue = {
    items,
    cartCount,
    subtotal,
    total,
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
