import { type AnchorHTMLAttributes, type MouseEvent, forwardRef } from 'react'
import { useNavigate, useRouteMatch } from './hooks'

export interface LinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  to: string
  replace?: boolean
  state?: unknown
  /** Class thêm vào khi đường dẫn hiện tại nằm trong nhánh `to`. */
  activeClassName?: string
  /** So khớp chính xác thay vì theo nhánh (dùng cho link về trang chủ). */
  exact?: boolean
}

/**
 * Link — điều hướng trong ứng dụng.
 *
 * Render `<a href>` thật, nên chuột giữa / Ctrl+click / "mở tab mới" / trình
 * đọc màn hình đều hoạt động đúng. Chỉ click trái thuần mới bị chặn để
 * `pushState` xử lý.
 *
 * Đây là thứ thay cho ~12 prop callback `onOpenX` mà v1 phải xâu chuỗi từ
 * `App.tsx` xuống mọi màn hình.
 */
export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  { to, replace, state, activeClassName, exact, className = '', onClick, target, ...rest },
  ref,
) {
  const navigate = useNavigate()
  const isActive = useRouteMatch(to, { exact })

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event)
    if (event.defaultPrevented) return
    // Nhường cho trình duyệt: mở tab mới, tải xuống, click giữa/phải.
    if (event.button !== 0) return
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    if (target && target !== '_self') return

    event.preventDefault()
    navigate(to, { replace, state })
  }

  const combined = [className, isActive && activeClassName ? activeClassName : ''].filter(Boolean).join(' ')

  return (
    <a
      ref={ref}
      href={to}
      className={combined}
      target={target}
      aria-current={isActive ? 'page' : undefined}
      onClick={handleClick}
      {...rest}
    />
  )
})
