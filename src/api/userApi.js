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
}

export default userApi
