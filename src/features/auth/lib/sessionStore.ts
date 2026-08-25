import type { AuthResult, AuthUser } from '../types'

/**
 * sessionStore — NGUỒN SỰ THẬT DUY NHẤT của phiên đăng nhập.
 *
 * v1 có HAI nguồn: biến module trong `authStorage.ts` và `useState` trong
 * `App.tsx`, được đồng bộ bằng tay ở bốn chỗ. Quên một chỗ là UI nói "đã đăng
 * nhập" trong khi mọi request đều 401 — và `apiClient` còn tự ý xoá token mà
 * React không hề biết.
 *
 * Ở đây chỉ còn một nơi giữ dữ liệu. React đăng ký vào nó bằng
 * `useSyncExternalStore` (xem `AuthProvider`), còn `httpClient` đọc token
 * đồng bộ qua `getAccessToken()`. Không có bản sao nào để lệch.
 *
 * Token cố ý chỉ nằm trong bộ nhớ — không `localStorage` — nên một tab mới
 * phải đi qua refresh-cookie. Đó là lựa chọn bảo mật, không phải thiếu sót.
 */

type Listener = () => void

let session: AuthResult | null = null
const listeners = new Set<Listener>()

function emit(): void {
  for (const listener of listeners) listener()
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** Snapshot cho `useSyncExternalStore`. Tham chiếu chỉ đổi khi phiên thật sự đổi. */
export function getSession(): AuthResult | null {
  return session
}

export function getAccessToken(): string | null {
  return session?.accessToken ?? null
}

export function setSession(next: AuthResult | null): void {
  if (session === next) return
  session = next
  emit()
}

export function clearSession(): void {
  setSession(null)
}

/** Cập nhật hồ sơ người dùng, giữ nguyên token hiện có. */
export function patchUser(user: AuthUser): void {
  if (!session) return
  setSession({ ...session, user })
}
