import { http } from '@core/http'
import { setSession } from '../lib/sessionStore'
import type { AuthPayload, AuthResult, AuthUser } from '../types'

/**
 * Auth API.
 *
 * Không còn hàm bóc envelope riêng: `http` đã ném `ApiError` mang message của
 * backend cho mọi phản hồi không thành công, nên ở đây chỉ còn endpoint + kiểu.
 */

export const login = (payload: AuthPayload) =>
  http.post<AuthResult>('/auth/login', {
    email: payload.email,
    password: payload.password,
  })

export const register = (payload: AuthPayload) =>
  http.post<AuthResult>('/auth/register', {
    email: payload.email,
    password: payload.password,
    fullName: payload.fullName,
    phone: payload.phone,
  })

export const getCurrentUser = () => http.get<AuthUser>('/users/me', { auth: true })

export const logout = () => http.post<null>('/auth/logout')

/**
 * Đổi refresh-cookie lấy access token mới và ghi thẳng vào `sessionStore`.
 *
 * Đây cũng là hàm được TIÊM vào `httpClient` làm `refreshAccessToken`
 * (xem `app/bootstrap/configureHttp.ts`), nên `core` không cần biết endpoint
 * này tồn tại. Request cố ý KHÔNG đặt `auth: true` để không tự kích hoạt vòng
 * refresh đệ quy.
 *
 * Single-flight ở ngay đây, KHÔNG chỉ ở tầng http: hàm này còn được gọi trực
 * tiếp lúc khởi động, và StrictMode chạy effect hai lần — nếu không gộp thì
 * mỗi lần mở app sẽ bắn hai request refresh song song.
 */
let refreshInFlight: Promise<AuthResult | null> | null = null

export const refreshSession = (): Promise<AuthResult | null> => {
  if (!refreshInFlight) {
    refreshInFlight = http
      .post<AuthResult>('/auth/refresh')
      .catch(() => null)
      .then((result) => {
        setSession(result ?? null)
        return result
      })
      .finally(() => {
        refreshInFlight = null
      })
  }
  return refreshInFlight
}

// ── Xác minh email ──────────────────────────────────────────────────────────

/**
 * Gửi lại email xác minh cho người đang đăng nhập.
 *
 * Backend đẩy mail qua Kafka (`emailProducer.publishAccountVerification`) rồi
 * trả về ngay — nên lời gọi này thành công KHÔNG có nghĩa là mail đã tới hộp
 * thư, chỉ có nghĩa là nó đã được xếp hàng. Thông điệp cho người dùng phải nói
 * đúng điều đó.
 *
 * Lỗi đáng chú ý: 400 "Email is already verified" khi phiên trên máy đã cũ so
 * với server.
 */
export const resendVerificationEmail = async (): Promise<string> => {
  await http.post<null>('/auth/resend-verification', undefined, { auth: true })
  return 'Verification email is on its way. Check your inbox — and your spam folder.'
}

// ── Khôi phục mật khẩu (OTP 3 bước) ─────────────────────────────────────────

/**
 * Bước 1 — xin mã đặt lại. Backend trả thông điệp trung tính dù tài khoản có
 * tồn tại hay không (chống dò email); ta hiển thị nguyên văn.
 */
export const forgotPassword = async (email: string): Promise<string> => {
  await http.post<null>('/auth/forgot-password', { email })
  return 'If an account exists for that email, a reset code is on its way.'
}

/** Gửi lại mã. Backend có cooldown và trả 429 kèm thông điệp chờ nếu gọi sớm. */
export const resendResetOtp = async (email: string): Promise<string> => {
  await http.post<null>('/auth/resend-reset-otp', { email })
  return 'A new reset code is on its way.'
}

export interface VerifyResetOtpResult {
  resetToken: string
  expiresInMinutes: number
}

/**
 * Bước 2 — xác minh mã 6 số. Thành công thì backend cấp một reset token ngắn
 * hạn cho bước cuối (email + OTP không bao giờ đủ để đổi mật khẩu).
 */
export const verifyResetOtp = (email: string, otp: string) =>
  http.post<VerifyResetOtpResult>('/auth/verify-reset-otp', { email, otp })

/** Bước 3 — đặt mật khẩu mới bằng reset token. */
export const resetPassword = async (resetToken: string, newPassword: string): Promise<string> => {
  await http.post<null>('/auth/reset-password', { resetToken, newPassword })
  return 'Your password has been successfully updated.'
}

export interface ChangePasswordResult {
  revokedOtherSessions: number
  currentSessionKept: boolean
}

/**
 * Đổi mật khẩu khi đã đăng nhập. `userId` lấy từ token phía backend — không
 * bao giờ gửi từ đây. Phiên hiện tại được giữ, các phiên khác bị thu hồi.
 */
export const changePassword = async (
  currentPassword: string,
  newPassword: string,
): Promise<ChangePasswordResult> => {
  const data = await http.patch<Partial<ChangePasswordResult> | null>(
    '/auth/change-password',
    { currentPassword, newPassword },
    { auth: true },
  )

  return {
    revokedOtherSessions: data?.revokedOtherSessions ?? 0,
    currentSessionKept: data?.currentSessionKept ?? true,
  }
}
