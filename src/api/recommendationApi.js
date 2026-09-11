import axiosClient from './axiosClient'

// Hệ thống gợi ý sản phẩm.
const recommendationApi = {
  // Gợi ý cá nhân hoá cho người đang đăng nhập.
  getForMe: (limit = 12) => axiosClient.get('/recommendations', { params: { limit } }),

  // Sản phẩm tương tự, hiển thị ở trang chi tiết.
  getSimilar: (productId, limit = 8) =>
    axiosClient.get(`/recommendations/products/${productId}/similar`, { params: { limit } }),

  // Hỏi AI "vì sao tôi được gợi ý sản phẩm này". Chỉ gọi khi khách bấm nút.
  explain: (itemId) => axiosClient.post(`/ai/recommendations/${itemId}/explain`),

  // Báo về server là gợi ý đã được bấm — số liệu để tính CTR ở chương đánh giá.
  recordOutcome: (itemId, outcome) =>
    axiosClient.post(`/recommendations/items/${itemId}/outcome`, { outcome }),

  // Ghi hành vi bấm vào gợi ý để hệ thống học sở thích người dùng.
  reportClick: (productId) =>
    axiosClient.post('/behaviors', { behaviorType: 'CLICK_RECOMMENDATION', productId }),
}

export default recommendationApi
