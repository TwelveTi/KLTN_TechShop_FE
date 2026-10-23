import axiosClient from './axiosClient'

// Đăng nhập Google đi bằng cách chuyển cả trang, không phải gọi axios — luồng
// OAuth cần trình duyệt tự đi qua Google rồi quay về backend.
export const googleAuthUrl = () => `${import.meta.env.VITE_API_BASE_URL}/auth/google`

// Đăng nhập / đăng ký / quên mật khẩu.
const authApi = {
  login: (email, password) => axiosClient.post('/auth/login', { email, password }),

  register: (payload) => axiosClient.post('/auth/register', payload),

  logout: () => axiosClient.post('/auth/logout'),

  refresh: () => axiosClient.post('/auth/refresh'),

  getMe: () => axiosClient.get('/users/me'),

  resendVerification: () => axiosClient.post('/auth/resend-verification'),

  // Quên mật khẩu gồm 3 bước: xin mã OTP, xác minh mã, đặt mật khẩu mới.
  forgotPassword: (email) => axiosClient.post('/auth/forgot-password', { email }),

  resendResetOtp: (email) => axiosClient.post('/auth/resend-reset-otp', { email }),

  verifyResetOtp: (email, otp) => axiosClient.post('/auth/verify-reset-otp', { email, otp }),

  resetPassword: (resetToken, newPassword) =>
    axiosClient.post('/auth/reset-password', { resetToken, newPassword }),

  changePassword: (currentPassword, newPassword) =>
    axiosClient.patch('/auth/change-password', { currentPassword, newPassword }),

  checkEmail: (email) =>
    axiosClient.get('/auth/check-email', { params: { email } }),

  getSessions: () => axiosClient.get('/auth/sessions'),

  revokeSession: (id) => axiosClient.delete(`/auth/sessions/${id}`),

  revokeOtherSessions: () => axiosClient.post('/auth/sessions/revoke-others'),
}

export default authApi
