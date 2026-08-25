import { useContext } from 'react'
import type { CartContextValue } from '../types'
import { CartContext } from './cartContext'

/** Đọc giỏ hàng. Cách duy nhất được phép truy cập `CartContext`. */
export function useCart(): CartContextValue {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart phải được dùng bên trong <CartProvider>')
  }
  return context
}
