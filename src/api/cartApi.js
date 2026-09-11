import axiosClient from './axiosClient'

// Giỏ hàng trên server. Chỉ dùng khi đã đăng nhập; giá luôn do backend tính.
const cartApi = {
  getCart: () => axiosClient.get('/cart'),

  addItem: (productId, variantId, quantity) =>
    axiosClient.post('/cart/items', { productId, variantId: variantId || null, quantity }),

  updateItem: (itemId, quantity) => axiosClient.patch(`/cart/items/${itemId}`, { quantity }),

  removeItem: (itemId) => axiosClient.delete(`/cart/items/${itemId}`),

  clearCart: () => axiosClient.delete('/cart'),
}

export default cartApi
