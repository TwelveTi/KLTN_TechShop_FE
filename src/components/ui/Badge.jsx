// Nhãn trạng thái nhỏ. Trạng thái luôn nói bằng CHỮ, màu chỉ là phụ trợ —
// người mù màu vẫn phải đọc được.
const TONES = {
  neutral: 'bg-sunken text-muted border-line',
  primary: 'bg-primary-soft text-primary border-transparent',
  success: 'bg-success-soft text-success-strong border-transparent',
  warning: 'bg-warning-soft text-warning-strong border-transparent',
  danger: 'bg-danger-soft text-danger-strong border-transparent',
}

export default function Badge({ tone = 'neutral', className = '', children }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-caption ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  )
}
