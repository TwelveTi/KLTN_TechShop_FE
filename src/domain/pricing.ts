import type { Vnd } from './money'

/**
 * Chính sách giá của cửa hàng — tách khỏi màn hình checkout.
 *
 * Backend LUÔN là bên có thẩm quyền cuối cùng khi đặt hàng; những hàm ở đây
 * chỉ để hiển thị số cho khách trước khi bấm nút, và phải khớp công thức của
 * backend.
 */

export const FREE_SHIPPING_THRESHOLD_VND: Vnd = 1_000_000
export const STANDARD_SHIPPING_FEE_VND: Vnd = 30_000

export interface DeliveryMethod {
  id: string
  name: string
  description: string
  etaLabel: string
  feeVnd: Vnd
}

export const STANDARD_DELIVERY: DeliveryMethod = {
  id: 'standard',
  name: 'Standard delivery',
  description: 'Delivered by TechShop logistics partner',
  etaLabel: '2–4 business days',
  feeVnd: STANDARD_SHIPPING_FEE_VND,
}

export function getAvailableDeliveryMethods(): DeliveryMethod[] {
  return [STANDARD_DELIVERY]
}

/** Phí ship: miễn phí khi tiền hàng đạt ngưỡng. */
export function resolveShippingFeeVnd(subtotalVnd: Vnd, method: DeliveryMethod): Vnd {
  if (method.id === STANDARD_DELIVERY.id && subtotalVnd >= FREE_SHIPPING_THRESHOLD_VND) return 0
  return method.feeVnd
}

/**
 * Tổng tiền phải trả.
 *
 * Phí ship tính trên tiền hàng TRƯỚC giảm giá — khớp backend: voucher làm rẻ
 * hàng hoá, không mua được miễn phí giao hàng.
 */
export function orderTotalVnd(input: {
  subtotalVnd: Vnd
  discountVnd?: Vnd
  shippingFeeVnd: Vnd
}): Vnd {
  const discount = input.discountVnd ?? 0
  return Math.max(0, input.subtotalVnd - discount) + input.shippingFeeVnd
}
