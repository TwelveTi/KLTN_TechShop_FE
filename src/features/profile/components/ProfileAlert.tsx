import { toErrorMessage } from '@core/http'
import { Icon } from '@shared/ui/Icon'

export interface ProfileAlertProps {
  notice?: string
  /** Chuỗi, hoặc bất kỳ giá trị nào bị `throw` (kể cả `ApiError`). */
  error?: unknown
}

/**
 * Băng thông báo dùng chung cho các màn hình tài khoản.
 *
 * Trước đây `notice`/`error` là hai `useState` ở `ProfilePage` và được chia sẻ
 * giữa cả năm tab, nên một lỗi từ tab Địa chỉ vẫn còn hiện khi chuyển sang tab
 * Bảo mật. Giờ mỗi màn hình có băng thông báo của riêng nó.
 */
export function ProfileAlert({ notice, error }: ProfileAlertProps) {
  const message = error ? toErrorMessage(error) : ''

  return (
    <>
      {notice && (
        <div className="ts-profile-alert ts-profile-alert--success" role="status">
          <Icon name="check" size={18} />
          <span>{notice}</span>
        </div>
      )}
      {message && (
        <div className="ts-profile-alert ts-profile-alert--error" role="alert">
          <Icon name="alert-triangle" size={18} />
          <span>{message}</span>
        </div>
      )}
    </>
  )
}
