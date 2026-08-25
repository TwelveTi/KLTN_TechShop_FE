/**
 * PUBLIC API của feature `auth` — **platform feature**.
 *
 * Chỗ import hợp lệ duy nhất từ bên ngoài (ARCHITECTURE.md §3). `auth` là một
 * trong hai feature được phép cắt ngang cả ứng dụng; danh sách đó nằm trong
 * allowlist của ESLint và thêm cái thứ ba phải qua review.
 */
export { AuthProvider } from './context/AuthProvider'
export { useAuth } from './context/useAuth'
export type { AuthContextValue } from './context/authContext'
export type { AuthMode, AuthResult, AuthUser } from './types'
export { changePassword, refreshSession, resendVerificationEmail } from './api/authApi'
export { getPasswordChecklist, isPasswordSecure } from './lib/passwordValidation'
export { clearSession, getAccessToken } from './lib/sessionStore'
export { EmailVerificationNotice } from './components/EmailVerificationNotice'
