import { Outlet } from '@core/router'

/**
 * Khung trống cho những màn hình tự lo phần chrome của mình:
 * đăng nhập/đăng ký và trang 404.
 */
export function BlankLayout() {
  return (
    <div className="ts-blank-layout">
      <Outlet />
    </div>
  )
}
