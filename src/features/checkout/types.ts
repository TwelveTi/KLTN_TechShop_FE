import type { CartLine } from '@domain/cart'

export type PaymentMethod = 'VNPAY' | 'COD'

export interface DeliveryMethod {
  id: string
  name: string
  description: string
  etaLabel: string
  fee: number
}

export interface PlaceOrderItemInput {
  productId: string
  variantId?: string | null
  quantity: number
}

export interface PlaceOrderInput {
  addressId: string
  paymentMethod: PaymentMethod
  deliveryMethodId: string
  note?: string
  items: PlaceOrderItemInput[]
  /** Optional voucher code. The backend re-validates and recomputes the amount. */
  discountCode?: string | null
}

/**
 * A voucher the shopper has applied at checkout.
 *
 * This is a PREVIEW: it reserves nothing, and the code can still be exhausted
 * by someone else before the order is placed. `subtotal` records what the
 * amount was computed against, so a changed basket can invalidate it.
 */
export interface AppliedDiscount {
  code: string
  name: string
  discountType: 'PERCENT' | 'FIXED'
  value: number
  subtotal: number
  discountAmount: number
  payable: number
}

/** Order returned by the backend after a successful create. */
export interface CreatedOrder {
  id: string
  orderCode: string
  status: string
  paymentStatus: string
  subtotalPrice: number
  shippingFee: number
  discountAmount: number
  totalPrice: number
}

export interface PlaceOrderResult {
  order: CreatedOrder
  /** Present only for VNPAY: the hosted gateway URL to redirect the browser to. */
  paymentUrl?: string
}

/** Dòng giỏ đang được thanh toán. Alias để đọc rõ ý ở chữ ký hàm. */
export type CheckoutLine = CartLine
