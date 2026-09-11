import axiosClient from './axiosClient'

// Đánh giá sản phẩm.
const reviewApi = {
  getReviews: (productId, page = 1, limit = 5) =>
    axiosClient.get(`/products/${productId}/reviews`, { params: { page, limit } }),

  getSummary: (productId) => axiosClient.get(`/products/${productId}/reviews/summary`),

  createReview: (productId, payload) =>
    axiosClient.post(`/products/${productId}/reviews`, payload),

  updateReview: (reviewId, payload) => axiosClient.patch(`/reviews/${reviewId}`, payload),

  deleteReview: (reviewId) => axiosClient.delete(`/reviews/${reviewId}`),
}

export default reviewApi
