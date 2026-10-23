import { createContext, useContext, useEffect, useState } from 'react'
import cartApi from '../api/cartApi'
import { getProductImage, getVariantPrice, getVariantStock } from '../utils/format'
import { useAuth } from './AuthContext'

// Giỏ hàng có hai chế độ:
//  - chưa đăng nhập: lưu trong localStorage của trình duyệt
//  - đã đăng nhập:   lưu trên server, giá do backend tính lại
const CartContext = createContext(null)

const GUEST_CART_KEY = 'guestCart'

function readGuestCart() {
  try {
    return JSON.parse(localStorage.getItem(GUEST_CART_KEY)) || []
  } catch {
    return []
  }
}

function writeGuestCart(items) {
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items))
}

export function CartProvider({ children }) {
  const { isLoggedIn, loading: authLoading } = useAuth()
  const [items, setItems] = useState([])

  // Khi biết được đã đăng nhập hay chưa thì nạp giỏ tương ứng.
  // Lúc đăng nhập, đẩy giỏ khách lên server rồi xoá giỏ khách đi.
  useEffect(() => {
    if (authLoading) return

    async function mergeAndLoad() {
      if (!isLoggedIn) {
        setItems(readGuestCart())
        return
      }

      const guestItems = readGuestCart()
      for (const item of guestItems) {
        try {
          await cartApi.addItem(item.productId, item.variantId, item.quantity)
        } catch {
          // Tồn kho có thể đã giảm từ lúc thêm vào giỏ: thử lại với một chiếc thay vì bỏ mất cả dòng.
          // Sản phẩm đã gỡ hoặc hết hẳn hàng thì mới bỏ qua.
          await cartApi.addItem(item.productId, item.variantId, 1).catch(() => {})
        }
      }
      localStorage.removeItem(GUEST_CART_KEY)
      try {
        const cart = await cartApi.getCart()
        setItems(cart.items || [])
      } catch {
        setItems([])
      }
    }
    mergeAndLoad()
  }, [isLoggedIn, authLoading])

  async function addToCart(product, quantity = 1, variantId = null) {
    if (isLoggedIn) {
      const cart = await cartApi.addItem(product.id, variantId, quantity)
      setItems(cart.items || [])
      return
    }

    // Giỏ khách: giá, tồn kho và tên lấy theo biến thể đang chọn, số lượng không vượt tồn kho.
    const variant = product.variants?.find((item) => item.id === variantId) || null
    const { price } = getVariantPrice(product, variant)
    const stock = getVariantStock(product, variant)
    if (stock <= 0) throw new Error('This product is out of stock')
    const lineId = `${product.id}-${variantId || 'default'}`
    const next = [...readGuestCart()]
    const found = next.find((item) => item.id === lineId)

    if (found) {
      found.quantity = Math.min(found.quantity + quantity, stock)
    } else {
      next.unshift({
        id: lineId,
        productId: product.id,
        variantId,
        name: product.name,
        variantName: variant?.variantName || null,
        imageUrl: getProductImage(product),
        unitPrice: price,
        quantity: Math.min(quantity, stock),
        stock,
        inStock: stock > 0,
      })
    }
    writeGuestCart(next)
    setItems(next)
  }

  async function updateQuantity(itemId, quantity) {
    if (quantity < 1) return removeItem(itemId)

    if (isLoggedIn) {
      const cart = await cartApi.updateItem(itemId, quantity)
      setItems(cart.items || [])
      return
    }

    const next = readGuestCart().map((item) =>
      item.id === itemId ? { ...item, quantity: Math.min(quantity, item.stock ?? quantity) } : item,
    )
    writeGuestCart(next)
    setItems(next)
  }

  async function removeItem(itemId) {
    if (isLoggedIn) {
      const cart = await cartApi.removeItem(itemId)
      setItems(cart.items || [])
      return
    }

    const next = readGuestCart().filter((item) => item.id !== itemId)
    writeGuestCart(next)
    setItems(next)
  }

  async function clearCart() {
    if (isLoggedIn) {
      await cartApi.clearCart()
    } else {
      writeGuestCart([])
    }
    setItems([])
  }

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.unitPrice) * item.quantity,
    0,
  )

  const value = {
    items,
    totalQuantity,
    subtotal,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  return useContext(CartContext)
}
