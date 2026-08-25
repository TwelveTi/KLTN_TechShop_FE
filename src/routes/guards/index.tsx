import { allow, redirect, renderInstead, type RouteGuard } from '@core/router'
import { paths } from '../paths'
import { SessionRestoring } from './SessionRestoring'
import { SignInRequired } from './SignInRequired'

/**
 * Guard — điều kiện vào một nhánh route.
 *
 * Guard là hàm thuần `(context) → decision`, chạy trong `RouteRenderer` TRƯỚC
 * khi render màn hình. v1 kiểm tra quyền ngay giữa thân component, nên mọi
 * state và effect nạp dữ liệu vẫn chạy trước khi biết người dùng có được vào
 * hay không.
 *
 * Mọi guard đều phải nhường khi `isRestoringSession` còn true — nếu không,
 * refresh trang ở `/profile` sẽ đá người dùng ra ngoài trong lúc refresh-cookie
 * còn đang bay.
 */

export const requireAuth: RouteGuard = ({ auth, location }) => {
  if (auth.isRestoringSession) return renderInstead(<SessionRestoring />)
  if (auth.isAuthenticated) return allow()
  return renderInstead(<SignInRequired returnTo={`${location.pathname}${location.search}`} />)
}

export const requireAdmin: RouteGuard = ({ auth, location }) => {
  if (auth.isRestoringSession) return renderInstead(<SessionRestoring />)
  if (!auth.isAuthenticated) {
    return renderInstead(<SignInRequired returnTo={`${location.pathname}${location.search}`} admin />)
  }
  if (!auth.isAdmin) return renderInstead(<SignInRequired forbidden />)
  return allow()
}

/** Người đã đăng nhập không cần ở lại màn hình đăng nhập. */
export const requireGuest: RouteGuard = ({ auth }) => {
  if (auth.isRestoringSession) return allow()
  return auth.isAuthenticated ? redirect(paths.home()) : allow()
}
