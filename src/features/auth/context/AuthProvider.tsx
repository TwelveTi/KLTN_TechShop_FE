import { useCallback, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react'
import { queryCache } from '@core/query'
import { getCurrentUser, logout as logoutRequest, refreshSession } from '../api/authApi'
import { clearSession, getSession, patchUser, setSession, subscribe } from '../lib/sessionStore'
import type { AuthResult, AuthUser } from '../types'
import { AuthContext, type AuthContextValue } from './authContext'

/**
 * AuthProvider — phiên đăng nhập cho toàn ứng dụng.
 *
 * Dữ liệu KHÔNG nằm trong `useState` ở đây: nó nằm trong `sessionStore`, và
 * component đăng ký vào đó bằng `useSyncExternalStore`. Nhờ vậy `httpClient`
 * (tầng 0, không phải React) và giao diện luôn đọc CÙNG một giá trị — không có
 * hai bản sao để lệch như v1.
 *
 * Provider chỉ đóng góp hai thứ mà một store thuần không làm được:
 *   - chạy khôi phục phiên đúng MỘT lần lúc khởi động;
 *   - cờ `isRestoringSession` để route guard không đá người dùng ra ngoài
 *     trong lúc refresh-cookie còn đang bay.
 */

export function AuthProvider({ children }: { children: ReactNode }) {
  const authResult = useSyncExternalStore(subscribe, getSession, getSession)
  const [isRestoringSession, setIsRestoringSession] = useState(true)

  const accessToken = authResult?.accessToken ?? null

  // Khôi phục phiên từ refresh-cookie khi mở app.
  useEffect(() => {
    let active = true

    refreshSession()
      .catch(() => null)
      .finally(() => {
        if (active) setIsRestoringSession(false)
      })

    return () => {
      active = false
    }
  }, [])

  // Có token thì lấy hồ sơ mới nhất. Thất bại nghĩa là token không dùng được.
  useEffect(() => {
    if (!accessToken) return
    let active = true

    getCurrentUser()
      .then((user) => {
        if (active) patchUser(user)
      })
      .catch(() => {
        if (active) clearSession()
      })

    return () => {
      active = false
    }
  }, [accessToken])

  const signIn = useCallback((result: AuthResult) => {
    // Xoá cache của phiên trước để dữ liệu người dùng cũ không hiện ra trong
    // khoảnh khắc trước khi query mới trả về.
    queryCache.clear()
    setSession(result)
  }, [])

  const clearLocalSession = useCallback(() => {
    clearSession()
    queryCache.clear()
  }, [])

  const signOut = useCallback(async () => {
    try {
      await logoutRequest()
    } finally {
      clearSession()
      queryCache.clear()
    }
  }, [])

  const updateUser = useCallback((user: AuthUser) => patchUser(user), [])

  const value = useMemo<AuthContextValue>(
    () => ({
      authResult,
      user: authResult?.user ?? null,
      isAuthenticated: Boolean(accessToken),
      isAdmin: authResult?.user.role === 'ADMIN',
      isRestoringSession,
      signIn,
      signOut,
      clearLocalSession,
      updateUser,
    }),
    [authResult, accessToken, isRestoringSession, signIn, signOut, clearLocalSession, updateUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
