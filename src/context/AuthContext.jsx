import { createContext, useContext, useEffect, useState } from 'react'
import authApi from '../api/authApi'
import { clearToken, SESSION_ENDED_EVENT, setToken } from '../api/axiosClient'

// Lưu thông tin người đăng nhập để mọi trang đều dùng được.
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Mở lại trang thì access token trong bộ nhớ đã mất, đổi cookie refresh lấy token mới.
  // Đường này cũng dùng cho lúc quay về từ Google hoặc từ link xác minh email.
  useEffect(() => {
    async function restoreSession() {
      try {
        const data = await authApi.refresh()
        setToken(data.accessToken)
        setUser(data.user)
      } catch {
        // Khách chưa đăng nhập cũng rơi vào đây, không có gì để dọn ngoài token hỏng.
        clearToken()
      } finally {
        setLoading(false)
      }
    }
    restoreSession()
  }, [])

  // Phiên bị thu hồi từ máy khác: lời gọi API kế tiếp thất bại và báo về đây.
  useEffect(() => {
    const endSession = () => setUser(null)
    window.addEventListener(SESSION_ENDED_EVENT, endSession)
    return () => window.removeEventListener(SESSION_ENDED_EVENT, endSession)
  }, [])

  // Quay lại tab thì hỏi server một lần, để máy vừa bị thu hồi phiên thấy mình bị đăng xuất ngay.
  useEffect(() => {
    if (!user) return
    function recheck() {
      if (document.visibilityState === 'visible') authApi.getMe().catch(() => {})
    }
    document.addEventListener('visibilitychange', recheck)
    return () => document.removeEventListener('visibilitychange', recheck)
  }, [user])

  async function login(email, password) {
    const data = await authApi.login(email, password)
    setToken(data.accessToken)
    setUser(data.user)
    return data.user
  }

  // Đăng ký xong CHƯA đăng nhập: backend chỉ tạo tài khoản rồi gửi mail xác minh,
  // không cấp token nào. Phiên chỉ mở khi người dùng bấm link trong mail hoặc tự đăng nhập.
  async function register(payload) {
    const data = await authApi.register(payload)
    return data.user
  }

  async function logout() {
    try {
      await authApi.logout()
    } catch {
      // Server lỗi thì vẫn đăng xuất ở phía trình duyệt.
    }
    clearToken()
    setUser(null)
  }

  const value = {
    user,
    loading,
    isLoggedIn: !!user,
    isAdmin: user?.role === 'ADMIN',
    login,
    register,
    logout,
    setUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
