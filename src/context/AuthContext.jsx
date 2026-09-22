import { createContext, useContext, useEffect, useState } from 'react'
import authApi from '../api/authApi'
import { clearToken, getToken, setToken } from '../api/axiosClient'

// Lưu thông tin người đăng nhập để mọi trang đều dùng được.
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Mở lại trang thì khôi phục phiên đăng nhập theo hai đường.
  useEffect(() => {
    restoreSession()
  }, [])

  async function restoreSession() {
    try {
      if (getToken()) {
        // Có token sẵn thì chỉ cần hỏi server xem còn dùng được không.
        setUser(await authApi.getMe())
      } else {
        // Không có token nhưng có thể vừa quay về từ Google hoặc từ link xác
        // minh email — hai luồng đó chỉ đặt cookie refresh, phải đổi lấy token.
        const data = await authApi.refresh()
        setToken(data.accessToken)
        setUser(data.user)
      }
    } catch {
      // Khách chưa đăng nhập cũng rơi vào đây, không có gì để dọn ngoài token hỏng.
      clearToken()
    } finally {
      setLoading(false)
    }
  }

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
