import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { toErrorMessage } from '@core/http'
import { type CartLine, cartQuantity, cartSubtotalVnd, clampQuantity } from '@domain/cart'
import type { Product } from '@domain/product'
import { useToast } from '@shared/ui/useToast'
import { useAuth } from '@features/auth'
import { cartApi } from '../api/cartApi'
import { clearGuestCart, readGuestCart, subscribeGuestCart, toCartLine, writeGuestCart } from '../lib/guestCart'
import type { CartContextValue } from '../types'
import { CartContext } from './cartContext'

// Chỉ id thật của backend (UUID v1–v5) mới gửi lên API giỏ hàng được.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const isUuid = (value?: string | null): value is string => typeof value === 'string' && UUID_RE.test(value)

export function CartProvider({ children }: { children: ReactNode }) {
  const { showToast } = useToast()
  const { isAuthenticated } = useAuth()
  const [lines, setLines] = useState<CartLine[]>(() => (isAuthenticated ? [] : readGuestCart()))
  const [isSyncing, setIsSyncing] = useState(false)

  // Bản sao ref của cờ đăng nhập để các hàm thao tác giỏ luôn đọc được chế độ
  // hiện tại mà không phải tạo lại mỗi lần auth đổi.
  const serverModeRef = useRef(false)
  const isServerMode = () => serverModeRef.current

  // Chỉ ghi localStorage ở chế độ khách. Đã đăng nhập thì backend là nguồn sự thật.
  useEffect(() => {
    if (!serverModeRef.current) writeGuestCart(lines)
  }, [lines])

  // Đồng bộ giữa các tab, chỉ cho giỏ khách. Sự kiện `storage` chỉ bắn ở tab
  // KHÁC, không bao giờ ở tab vừa ghi, nên không có vòng lặp tự vọng.
  useEffect(
    () =>
      subscribeGuestCart((nextLines) => {
        if (!serverModeRef.current) setLines(nextLines)
      }),
    [],
  )

  // Chuyển trạng thái đăng nhập:
  //  - khách → đã đăng nhập: hợp nhất giỏ khách vào giỏ server, rồi lấy giỏ
  //    server làm nguồn sự thật và xoá giỏ khách;
  //  - đã đăng nhập → khách (đăng xuất): quay lại giỏ khách cục bộ.
  useEffect(() => {
    let cancelled = false
    const wasServerMode = serverModeRef.current
    serverModeRef.current = isAuthenticated

    if (isAuthenticated && !wasServerMode) {
      void (async () => {
        setIsSyncing(true)
        try {
          // Hợp nhất theo kiểu cố-gắng-hết-sức: đẩy từng dòng khách lên server.
          // Một dòng hỏng (sản phẩm đã gỡ, hết hàng) không được chặn cả giỏ.
          for (const guestLine of readGuestCart()) {
            const productId = guestLine.productId ?? guestLine.id
            if (!isUuid(productId)) continue
            try {
              await cartApi.addItem({
                productId,
                variantId: isUuid(guestLine.variantId) ? guestLine.variantId : null,
                quantity: guestLine.quantity,
              })
            } catch {
              /* bỏ qua lỗi của từng dòng */
            }
          }

          const serverLines = await cartApi.get()
          if (cancelled) return
          setLines(serverLines)
          clearGuestCart()
        } catch (error) {
          if (!cancelled) showToast(toErrorMessage(error, 'Could not sync your cart.'), { variant: 'error' })
        } finally {
          if (!cancelled) setIsSyncing(false)
        }
      })()
    } else if (!isAuthenticated && wasServerMode) {
      setLines(readGuestCart())
    }

    return () => {
      cancelled = true
    }
    // showToast ổn định (từ ToastProvider); cố ý chỉ theo dõi trạng thái auth.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated])

  /** Kéo lại giỏ chuẩn từ server sau khi một cập nhật lạc quan thất bại. */
  const resyncFromServer = async () => {
    try {
      setLines(await cartApi.get())
    } catch {
      /* giữ nguyên trạng thái lạc quan nếu chính lần đồng bộ lại cũng hỏng */
    }
  }

  const reportFailure = (error: unknown, fallback: string) => {
    showToast(toErrorMessage(error, fallback), { variant: 'error' })
  }

  const addToCart: CartContextValue['addToCart'] = async (product: Product, quantity = 1, opts) => {
    const wanted = Math.max(1, quantity)

    if (isServerMode()) {
      if (!isUuid(product.id)) {
        showToast('This product is not available for online ordering yet.', { variant: 'error' })
        return false
      }
      try {
        setLines(
          await cartApi.addItem({
            productId: product.id,
            variantId: isUuid(opts?.variantId) ? opts?.variantId : null,
            quantity: wanted,
          }),
        )
        return true
      } catch (error) {
        reportFailure(error, 'Could not add this item to your cart.')
        return false
      }
    }

    setLines((prev) => {
      const index = prev.findIndex((line) => line.id === product.id)

      if (index >= 0) {
        const next = [...prev]
        const current = next[index]
        next[index] = {
          ...current,
          quantity: clampQuantity(current.quantity + wanted, current.maxStock),
        }
        return next
      }

      const line = toCartLine(product, wanted)
      if (opts?.variantId) line.variantId = opts.variantId
      return [line, ...prev]
    })
    return true
  }

  const updateQuantity: CartContextValue['updateQuantity'] = (lineId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(lineId)
      return
    }

    // Cập nhật lạc quan để bộ đếm số lượng phản hồi tức thì ở cả hai chế độ.
    setLines((prev) =>
      prev.map((line) =>
        line.id === lineId ? { ...line, quantity: clampQuantity(quantity, line.maxStock) } : line,
      ),
    )

    if (isServerMode()) {
      cartApi
        .updateItem(lineId, Math.max(1, quantity))
        .then(setLines)
        .catch((error: unknown) => {
          reportFailure(error, 'Could not update quantity.')
          void resyncFromServer()
        })
    }
  }

  const removeFromCart: CartContextValue['removeFromCart'] = (lineId) => {
    setLines((prev) => prev.filter((line) => line.id !== lineId))

    if (isServerMode()) {
      cartApi
        .removeItem(lineId)
        .then(setLines)
        .catch((error: unknown) => {
          reportFailure(error, 'Could not remove this item.')
          void resyncFromServer()
        })
    }
  }

  const restoreLine: CartContextValue['restoreLine'] = (line) => {
    if (isServerMode()) {
      const productId = line.productId ?? line.id
      if (!isUuid(productId)) return
      cartApi
        .addItem({
          productId,
          variantId: isUuid(line.variantId) ? line.variantId : null,
          quantity: line.quantity,
        })
        .then(setLines)
        .catch((error: unknown) => reportFailure(error, 'Could not restore this item.'))
      return
    }

    setLines((prev) => (prev.some((existing) => existing.id === line.id) ? prev : [line, ...prev]))
  }

  const clearCart: CartContextValue['clearCart'] = () => {
    setLines([])
    if (isServerMode()) {
      cartApi
        .clear()
        .then(setLines)
        .catch(() => void resyncFromServer())
    }
  }

  const cartCount = useMemo(() => cartQuantity(lines), [lines])
  const subtotalVnd = useMemo(() => cartSubtotalVnd(lines), [lines])

  const value: CartContextValue = {
    lines,
    cartCount,
    subtotalVnd,
    isSyncing,
    addToCart,
    updateQuantity,
    removeFromCart,
    restoreLine,
    clearCart,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
