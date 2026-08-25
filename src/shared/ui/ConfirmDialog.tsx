import type { ReactNode } from 'react'
import { Button } from './Button'
import { Icon, type IconName } from './Icon'
import { Modal } from './Modal'

/**
 * Hộp thoại xác nhận DUY NHẤT của ứng dụng.
 *
 * Gộp từ `ConfirmDialog` (storefront) và `admin/ConfirmModal` ở GĐ5 — hai
 * component cùng bọc `Modal` + 2 `Button`, chỉ khác cái thứ hai có icon và
 * tên prop là `variant` thay vì `tone`. Hệ quả của việc để chúng song song là
 * hai khu vực của cùng một sản phẩm hỏi xác nhận theo hai kiểu khác nhau.
 */

export type ConfirmTone = 'primary' | 'danger' | 'warning'

export interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  /** `danger` cho hành động phá huỷ, `warning` cho hành động cần cân nhắc. */
  tone?: ConfirmTone
  /** Đặt `false` để bỏ icon (hộp thoại gọn, dùng cho xác nhận nhẹ). */
  showIcon?: boolean
  isLoading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

const TONE_ICON: Record<ConfirmTone, IconName> = {
  primary: 'info',
  danger: 'alert-triangle',
  warning: 'alert-triangle',
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'primary',
  showIcon = true,
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
      maxWidth="460px"
      // Hành động phá huỷ không được đóng bằng cách bấm ra ngoài — người dùng
      // phải chọn một cách có ý thức.
      closeOnBackdrop={tone !== 'danger'}
      footer={
        <div className="ts-confirm__actions">
          <Button variant="secondary" onClick={onCancel} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button
            variant={tone === 'danger' ? 'danger' : 'primary'}
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmLabel}
          </Button>
        </div>
      }
    >
      <div className="ts-confirm__body">
        {showIcon && (
          <span className={`ts-confirm__icon ts-confirm__icon--${tone}`} aria-hidden="true">
            <Icon name={TONE_ICON[tone]} size={20} />
          </span>
        )}
        <p className="ts-confirm__message">{message}</p>
      </div>
    </Modal>
  )
}
