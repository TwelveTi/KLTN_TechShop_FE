import { http } from '@core/http'
import type { AppliedDiscount, CreatedOrder, PlaceOrderInput, PlaceOrderResult } from '../types'

/**
 * Checkout / order / payment API client.
 *
 * Backend contract (implemented):
 *
 *   POST /api/v1/orders                      (auth + verified email,
 *                                             header `Idempotency-Key`)
 *     body: { addressId, paymentMethod: 'VNPAY'|'COD', deliveryMethodId, note?,
 *             items: [{ productId, variantId?, quantity }] }
 *     → 201 data: order { id, orderCode, status, paymentStatus,
 *                         subtotalPrice, shippingFee, discountAmount, totalPrice }
 *     The backend re-validates stock/price, computes the authoritative total,
 *     reserves stock, and removes the ordered lines from the server cart.
 *     Replaying the same Idempotency-Key returns the original order with 200.
 *
 *   POST /api/v1/payments/vnpay/create-url   (auth)
 *     body: { orderId }
 *     → data: { paymentUrl, orderCode, transactionCode, expiresAt }
 *     The browser is redirected to `paymentUrl`.
 *
 *   VNPay return: the gateway calls the BACKEND, which verifies the HMAC
 *   signature, settles the order, then redirects the browser to
 *     {FRONTEND_URL}/checkout/success?orderCode=..&orderId=..
 *     {FRONTEND_URL}/checkout/failed?orderCode=..&orderId=..&reason=..
 *
 * Note: `returnUrl` below is still sent for compatibility but the backend
 * ignores it — honouring a client-chosen redirect target would be an open
 * redirect, and the signature has to be checked server-side first.
 */

export const checkoutApi = {
  /**
   * Tạo đơn (COD hoặc VNPAY). Với VNPAY, xin luôn URL thanh toán để caller
   * chuyển hướng. Idempotency key bảo đảm refresh/thử lại dùng lại đúng đơn cũ
   * thay vì tạo đơn trùng.
   */
  async placeOrder(input: PlaceOrderInput, idempotencyKey: string): Promise<PlaceOrderResult> {
    const order = await http.post<CreatedOrder>('/orders', input, {
      auth: true,
      headers: { 'Idempotency-Key': idempotencyKey },
    })

    if (input.paymentMethod === 'VNPAY') {
      return { order, paymentUrl: await this.createVnpayUrl(order.id) }
    }

    return { order }
  },

  /**
   * Xem trước một mã giảm giá. Không giữ chỗ — mã vẫn có thể hết trước khi đặt
   * hàng, nên số tiền ở đây được backend xác nhận (và tính lại) lúc đặt đơn.
   */
  validateDiscount(code: string, subtotalVnd: number): Promise<AppliedDiscount> {
    return http.post<AppliedDiscount>(
      '/discounts/validate',
      { code, subtotal: subtotalVnd },
      { auth: true },
    )
  },

  async createVnpayUrl(orderId: string): Promise<string> {
    const returnUrl = `${window.location.origin}/checkout/success`
    const data = await http.post<{ paymentUrl: string }>(
      '/payments/vnpay/create-url',
      { orderId, returnUrl },
      { auth: true },
    )
    return data.paymentUrl
  },
}
