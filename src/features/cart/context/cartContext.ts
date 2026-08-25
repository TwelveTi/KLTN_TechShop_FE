import { createContext } from 'react'
import type { CartContextValue } from '../types'

/**
 * Đối tượng context của giỏ hàng. Tách khỏi provider và hook — xem
 * `features/auth/context/authContext.ts` để biết lý do.
 *
 * Không export ra ngoài thư mục này: cách duy nhất đọc giỏ là `useCart()`.
 */
export const CartContext = createContext<CartContextValue | null>(null)
