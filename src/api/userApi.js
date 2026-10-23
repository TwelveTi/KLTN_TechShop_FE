import axiosClient from './axiosClient'

// Hồ sơ cá nhân và sổ địa chỉ giao hàng.
const userApi = {
  updateProfile: (payload) => axiosClient.put('/users/me', payload),

  uploadAvatar: (file) => {
    const formData = new FormData()
    formData.append('avatar', file)
    return axiosClient.post('/users/me/avatar', formData)
  },

  getAddresses: () => axiosClient.get('/addresses/me'),

  createAddress: (payload) => axiosClient.post('/addresses/me', payload),

  setDefaultAddress: (id) => axiosClient.put(`/addresses/me/${id}/default`),

  deleteAddress: (id) => axiosClient.delete(`/addresses/me/${id}`),

  getRecentKeywords: (limit = 10) =>
    axiosClient.get('/search-history/me/keywords', { params: { limit } }),

  // Từng lượt tìm kiếm kèm id, dùng khi cần xoá lẻ từng mục.
  getSearchHistory: (limit = 50) =>
    axiosClient.get('/search-history/me', { params: { limit } }),

  clearSearchHistory:() => axiosClient.delete('/search-history/me'),

  deleteSearchEntry: (id) => axiosClient.delete(`/search-history/me/${id}`),
}

export default userApi
