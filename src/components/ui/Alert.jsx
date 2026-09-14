import { AlertCircle, CheckCircle2, Info } from 'lucide-react'
import Button from './Button'

// Khung thông báo trong trang. Một kiểu duy nhất cho cả lỗi, cảnh báo, thành công.
const TONES = {
  danger: { cls: 'bg-danger-soft text-danger-strong', Icon: AlertCircle },
  warning: { cls: 'bg-warning-soft text-warning-strong', Icon: AlertCircle },
  success: { cls: 'bg-success-soft text-success-strong', Icon: CheckCircle2 },
  info: { cls: 'bg-primary-soft text-primary', Icon: Info },
}

export default function Alert({ tone = 'danger', title, children, onRetry, retryLabel = 'Try again' }) {
  if (!children && !title) return null
  const { cls, Icon } = TONES[tone]

  return (
    <div role={tone === 'danger' ? 'alert' : 'status'} className={`flex gap-3 rounded-md p-4 ${cls}`}>
      <Icon size={20} className="mt-0.5 shrink-0" aria-hidden />

      <div className="flex-1 text-sm">
        {title && <p className="font-semibold">{title}</p>}
        {children && <p className={title ? 'mt-0.5' : ''}>{children}</p>}

        {onRetry && (
          <Button size="sm" variant="secondary" onClick={onRetry} className="mt-3">
            {retryLabel}
          </Button>
        )}
      </div>
    </div>
  )
}
