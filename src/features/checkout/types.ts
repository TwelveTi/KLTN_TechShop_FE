import type { CartItem } from '../cart/types'

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

/** The subset of checkout state derived from the cart selection. */
export interface CheckoutLine extends CartItem {}
