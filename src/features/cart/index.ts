/**
 * PUBLIC API của feature `cart` — **platform feature**.
 *
 * Giỏ hàng cắt ngang ứng dụng: badge ở header, trang giỏ, và trang thanh toán
 * đều cần nó, và ba chỗ đó nằm ở ba nhánh cây khác nhau.
 */
export { CartProvider } from './context/CartProvider'
export { useCart } from './context/useCart'
export type { CartContextValue } from './types'
