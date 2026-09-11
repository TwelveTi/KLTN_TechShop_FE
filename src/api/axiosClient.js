import axios from 'axios'

// Kết nối tới backend. Mọi lời gọi API trong app đều đi qua file này.
const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true, // để trình duyệt gửi kèm cookie refresh token
  timeout: 60000,
})

// Đọc / ghi access token trong localStorage.
export const getToken = () => localStorage.getItem('accessToken')
export const setToken = (token) => localStorage.setItem('accessToken', token)
export const clearToken = () => localStorage.removeItem('accessToken')

// Mỗi khách (kể cả chưa đăng nhập) có một id riêng để backend nhớ hội thoại AI.
export function getVisitorId() {
  let id = localStorage.getItem('visitorId')
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem('visitorId', id)
  }
  return id
}

// Interceptor request: tự gắn token và visitor id vào mọi request.
axiosClient.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  config.headers['X-Session-Id'] = getVisitorId()
  return config
})

// Interceptor response: bóc lớp vỏ { code, message, data } của backend,
// và khi gặp 401 thì xin token mới một lần rồi gửi lại request.
axiosClient.interceptors.response.use(
  (response) => response.data?.data,
  async (error) => {
    const original = error.config

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const res = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true },
        )
        const newToken = res.data?.data?.accessToken
        if (newToken) {
          setToken(newToken)
          original.headers.Authorization = `Bearer ${newToken}`
          return axiosClient(original)
        }
      } catch {
        clearToken()
      }
    }

    // Ném ra thông báo lỗi của backend để màn hình hiển thị đúng nguyên nhân.
    const message =
      error.response?.data?.message || error.message || 'Không kết nối được máy chủ'
    return Promise.reject(new Error(message))
  },
)

export default axiosClient
