import axiosClient from './axiosClient'

// Đặt hàng và thanh toán.
const orderApi = {
  // Idempotency-Key giúp bấm đặt hàng hai lần không tạo ra hai đơn.
  createOrder: (payload) =>
    axiosClient.post('/orders', payload, {
      headers: { 'Idempotency-Key': crypto.randomUUID() },
    }),

  getMyOrders: () => axiosClient.get('/orders/me'),

  cancelOrder: (orderId, reason) => axiosClient.patch(`/orders/${orderId}/cancel`, { reason }),

  // Xin link thanh toán VNPay rồi chuyển hướng trình duyệt sang đó.
  createVnpayUrl: (orderId) => axiosClient.post('/payments/vnpay/create-url', { orderId }),

  validateDiscount: (code, subtotal) =>
    axiosClient.post('/discounts/validate', { code, subtotal }),
}

export default orderApi
