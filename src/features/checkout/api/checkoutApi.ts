import { apiClient } from '../../../shared/api/apiClient'
import type { ApiResponse } from '../../../shared/types/api'
import type { CreatedOrder, PlaceOrderInput, PlaceOrderResult } from '../types'

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

const readData = async <T>(response: Response, fallbackMessage: string): Promise<T> => {
  const body = (await response.json().catch(() => null)) as ApiResponse<T> | null
  if (!response.ok || body?.data === undefined || body?.data === null) {
    throw new Error(body?.message || fallbackMessage)
  }
  return body.data
}

export const checkoutApi = {
  /**
   * Create the order (COD or VNPAY). For VNPAY, also requests the hosted
   * payment URL so the caller can redirect. The idempotency key guarantees a
   * refresh/retry re-uses the same order instead of creating a duplicate.
   */
  async placeOrder(input: PlaceOrderInput, idempotencyKey: string): Promise<PlaceOrderResult> {
    const response = await apiClient('/orders', {
      method: 'POST',
      auth: true,
      headers: { 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify(input),
    })
    const order = await readData<CreatedOrder>(response, 'Could not place your order.')

    if (input.paymentMethod === 'VNPAY') {
      const paymentUrl = await this.createVnpayUrl(order.id)
      return { order, paymentUrl }
    }

    return { order }
  },

  async createVnpayUrl(orderId: string): Promise<string> {
    const returnUrl = `${window.location.origin}/checkout/success`
    const response = await apiClient('/payments/vnpay/create-url', {
      method: 'POST',
      auth: true,
      body: JSON.stringify({ orderId, returnUrl }),
    })
    const data = await readData<{ paymentUrl: string }>(response, 'Could not start the VNPay payment.')
    return data.paymentUrl
  },
}
