import { useEffect, useRef } from 'react'
import { useSearchParams } from '@core/router'
import { useToast } from '@shared/ui/useToast'
import { refreshSession } from '../api/authApi'

/**
 * Xử lý kết quả của link xác minh email.
 *
 * Backend `GET /auth/verify-email?token=...` xác minh xong sẽ:
 *   1. đặt refresh-cookie (nên link đó ĐỒNG THỜI đăng nhập người dùng), rồi
 *   2. redirect về `{FRONTEND_URL}/?verified=success|already|error`.
 *
 * Trước khi có component này, tham số đó không ai đọc: người dùng bấm link
 * trong mail, bị đưa về trang chủ, và không có gì cho biết việc xác minh đã
 * thành công hay chưa — trong khi `emailVerifiedAt` trên máy vẫn là giá trị cũ,
 * nên nút "Verify Email" ở Hồ sơ vẫn hiện và đặt hàng vẫn bị chặn.
 *
 * Đặt bên trong `RouterProvider` ở `App`, nên nó chạy dù người dùng đáp xuống
 * route nào.
 */

const MESSAGES: Record<string, { text: string; variant: 'success' | 'info' | 'error' }> = {
  success: { text: 'Email verified. You can place orders now.', variant: 'success' },
  already: { text: 'This email was already verified.', variant: 'info' },
  error: {
    text: 'That verification link is invalid or has expired. Send a new one from your profile.',
    variant: 'error',
  },
}

export function EmailVerificationNotice() {
  const [params, setParams] = useSearchParams()
  const { showToast } = useToast()

  const status = params.get('verified')
  // Chống xử lý hai lần: StrictMode chạy effect đôi, và việc gỡ tham số khỏi
  // URL lại làm effect chạy lại một nhịp nữa.
  const handled = useRef<string | null>(null)

  useEffect(() => {
    if (!status || handled.current === status) return
    handled.current = status

    const message = MESSAGES[status] ?? MESSAGES.error
    showToast(message.text, { variant: message.variant, duration: 6000 })

    // Link đã đặt refresh-cookie: đổi nó lấy phiên thật, đồng thời kéo về
    // `emailVerifiedAt` mới nên banner ở Hồ sơ tự cập nhật.
    if (status !== 'error') void refreshSession()

    // Gỡ tham số để refresh trang không phát lại thông báo, và để URL sạch khi
    // người dùng chia sẻ.
    setParams(
      (current) => {
        const next = new URLSearchParams(current)
        next.delete('verified')
        return next
      },
      { replace: true, preserveScroll: true },
    )
  }, [status, showToast, setParams])

  return null
}
