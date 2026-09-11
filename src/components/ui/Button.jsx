import { Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'

// Nút bấm dùng chung. Bốn mức độ quan trọng, ba cỡ.
// Mỗi màn hình chỉ được có MỘT nút primary.
const VARIANTS = {
  primary: 'bg-primary text-on-primary hover:bg-primary-hover',
  secondary: 'bg-surface text-body border border-line-strong hover:bg-sunken',
  ghost: 'text-primary hover:bg-primary-soft',
  danger: 'bg-danger text-white hover:bg-danger-strong',
}

const SIZES = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
}

const BASE = `inline-flex items-center justify-center gap-2 rounded-sm font-semibold whitespace-nowrap
  transition-colors duration-120 ease-out active:translate-y-px
  disabled:pointer-events-none disabled:opacity-50`

function classesFor(variant, size, fullWidth, className) {
  return `${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${fullWidth ? 'w-full' : ''} ${className}`
}

export default function Button({
  variant = 'secondary',
  size = 'md',
  isLoading = false,
  fullWidth = false,
  leadingIcon: LeadingIcon,
  className = '',
  children,
  ...props
}) {
  return (
    <button
      // Đang chờ thì chặn bấm tiếp nhưng giữ nguyên nhãn, để bề ngang không đổi.
      disabled={isLoading || props.disabled}
      aria-busy={isLoading || undefined}
      className={classesFor(variant, size, fullWidth, className)}
      {...props}
    >
      {isLoading ? (
        <Loader2 size={16} className="animate-spin" aria-hidden />
      ) : (
        LeadingIcon && <LeadingIcon size={16} aria-hidden />
      )}
      {children}
    </button>
  )
}

// Thứ dẫn người dùng sang trang khác phải là thẻ link, chỉ mượn lại kiểu của nút.
export function LinkButton({
  to,
  variant = 'secondary',
  size = 'md',
  fullWidth = false,
  leadingIcon: LeadingIcon,
  className = '',
  children,
  ...props
}) {
  return (
    <Link to={to} className={classesFor(variant, size, fullWidth, className)} {...props}>
      {LeadingIcon && <LeadingIcon size={16} aria-hidden />}
      {children}
    </Link>
  )
}
