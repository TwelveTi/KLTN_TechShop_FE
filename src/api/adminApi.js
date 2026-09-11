import axiosClient from './axiosClient'

// Toàn bộ API của trang quản trị. Tất cả đều yêu cầu tài khoản role ADMIN.
const adminApi = {
  // ----- Thống kê doanh thu -----
  getRevenueSummary: () => axiosClient.get('/admin/revenue/summary'),

  getDailyRevenue: (period = '30d') =>
    axiosClient.get('/admin/revenue/daily', { params: { period } }),

  getTopProducts: (limit = 5) =>
    axiosClient.get('/admin/revenue/products', { params: { limit } }),

  // ----- Sản phẩm -----
  getProducts: (params = {}) => axiosClient.get('/admin/products', { params }),

  getProduct: (id) => axiosClient.get(`/admin/products/${id}`),

  createProduct: (payload) => axiosClient.post('/admin/products', payload),

  updateProduct: (id, payload) => axiosClient.put(`/admin/products/${id}`, payload),

  deleteProduct: (id) => axiosClient.delete(`/admin/products/${id}`),

  uploadProductImages: (files) => {
    const formData = new FormData()
    files.forEach((file) => formData.append('images', file))
    return axiosClient.post('/admin/uploads/products/images', formData, { timeout: 45000 })
  },

  // ----- Danh mục -----
  getCategories: () => axiosClient.get('/admin/categories'),

  createCategory: (payload) => axiosClient.post('/admin/categories', payload),

  updateCategory: (id, payload) => axiosClient.put(`/admin/categories/${id}`, payload),

  deleteCategory: (id) => axiosClient.delete(`/admin/categories/${id}`),

  // ----- Thương hiệu -----
  getBrands: () => axiosClient.get('/admin/brands'),

  createBrand: (payload) => axiosClient.post('/admin/brands', payload),

  updateBrand: (id, payload) => axiosClient.put(`/admin/brands/${id}`, payload),

  deleteBrand: (id) => axiosClient.delete(`/admin/brands/${id}`),

  // ----- Đơn hàng -----
  getOrders: (params = {}) => axiosClient.get('/admin/orders', { params }),

  updateOrderStatus: (orderId, status, note) =>
    axiosClient.patch(`/admin/orders/${orderId}/status`, { status, note }),

  // ----- Người dùng -----
  getUsers: (params = {}) => axiosClient.get('/admin/users', { params }),

  createUser: (payload) => axiosClient.post('/admin/users', payload),

  updateUser: (id, payload) => axiosClient.put(`/admin/users/${id}`, payload),

  deleteUser: (id) => axiosClient.delete(`/admin/users/${id}`),
}

export default adminApi
