import { createContext, useContext, useEffect, useState } from 'react'
import authApi from '../api/authApi'
import { clearToken, getToken, setToken } from '../api/axiosClient'

// Lưu thông tin người đăng nhập để mọi trang đều dùng được.
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Mở lại trang thì lấy token trong localStorage ra và hỏi server xem còn dùng được không.
  useEffect(() => {
    if (!getToken()) {
      setLoading(false)
      return
    }
    authApi
      .getMe()
      .then((data) => setUser(data))
      .catch(() => clearToken())
      .finally(() => setLoading(false))
  }, [])

  async function login(email, password) {
    const data = await authApi.login(email, password)
    setToken(data.accessToken)
    setUser(data.user)
    return data.user
  }

  async function register(payload) {
    const data = await authApi.register(payload)
    setToken(data.accessToken)
    setUser(data.user)
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
