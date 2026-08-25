import { createContext } from 'react'
import type { AuthResult, AuthUser } from '../types'

/**
 * Đối tượng context + kiểu giá trị của nó.
 *
 * Tách khỏi provider và khỏi hook vì ba thứ này có lý do thay đổi khác nhau, và
 * vì Fast Refresh chỉ hoạt động khi một file export thuần component
 * (ARCHITECTURE.md §9: một hook mỗi file).
 *
 * `AuthContext` cố ý KHÔNG export ra ngoài thư mục này: cách duy nhất được phép
 * để đọc phiên là `useAuth()`.
 */
export interface AuthContextValue {
  authResult: AuthResult | null
  user: AuthUser | null
  isAuthenticated: boolean
  isAdmin: boolean
  /** True cho tới khi lần khôi phục phiên đầu tiên kết thúc. */
  isRestoringSession: boolean
  /** Ghi nhận đăng nhập/đăng ký thành công. */
  signIn: (result: AuthResult) => void
  /** Đăng xuất: báo backend thu hồi refresh-cookie, rồi xoá phiên cục bộ. */
  signOut: () => Promise<void>
  /** Xoá phiên cục bộ mà không gọi backend (dùng khi backend đã từ chối). */
  clearLocalSession: () => void
  /** Cập nhật hồ sơ sau khi sửa profile / đổi avatar. */
  updateUser: (user: AuthUser) => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
