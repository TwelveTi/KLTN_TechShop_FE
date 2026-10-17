import { AlertCircle, CheckCircle2, Info } from 'lucide-react'
import Button from './Button'
import { useLanguage } from '../../context/LanguageContext'

// Khung thông báo trong trang. Một kiểu duy nhất cho cả lỗi, cảnh báo, thành công.
const TONES = {
  danger: { cls: 'bg-danger-soft text-danger-strong', Icon: AlertCircle },
  warning: { cls: 'bg-warning-soft text-warning-strong', Icon: AlertCircle },
  success: { cls: 'bg-success-soft text-success-strong', Icon: CheckCircle2 },
  info: { cls: 'bg-primary-soft text-primary', Icon: Info },
}

export default function Alert({ tone = 'danger', title, children, onRetry, retryLabel }) {
  const { t } = useLanguage()
  if (!children && !title) return null
  const { cls, Icon } = TONES[tone]

  // Nội dung là chuỗi, thường là lỗi từ API, thì tra từ điển luôn; câu chưa có bản dịch giữ nguyên.
  const body = typeof children === 'string' ? t(children) : children

  return (
    <div role={tone === 'danger' ? 'alert' : 'status'} className={`flex gap-3 rounded-md p-4 ${cls}`}>
      <Icon size={20} className="mt-0.5 shrink-0" aria-hidden />

      <div className="flex-1 text-sm">
        {title && <p className="font-semibold">{title}</p>}
        {body && <p className={title ? 'mt-0.5' : ''}>{body}</p>}

        {onRetry && (
          <Button size="sm" variant="secondary" onClick={onRetry} className="mt-3">
            {retryLabel || t('Try again')}
          </Button>
        )}
      </div>
    </div>
  )
}
