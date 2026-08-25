import { useContext } from 'react'
import { AuthContext, type AuthContextValue } from './authContext'

/** Đọc phiên đăng nhập. Cách duy nhất được phép truy cập `AuthContext`. */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth phải được dùng bên trong <AuthProvider>')
  }
  return context
}
