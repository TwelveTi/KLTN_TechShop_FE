import { Link } from '@core/router'
import { paths } from '../paths'

export interface SignInRequiredProps {
  /** Quay lại đúng trang này sau khi đăng nhập xong. */
  returnTo?: string
  /** Thông điệp riêng cho khu vực quản trị. */
  admin?: boolean
  /** Đã đăng nhập nhưng không đủ quyền — khác hẳn với chưa đăng nhập. */
  forbidden?: boolean
}

/**
 * Chặn vào trang: nói rõ vì sao và cho một lối đi tiếp.
 *
 * Phân biệt "chưa đăng nhập" với "không đủ quyền" — v1 gộp cả hai vào một khối
 * `if` trong `AdminPage`.
 */
export function SignInRequired({ returnTo, admin, forbidden }: SignInRequiredProps) {
  if (forbidden) {
    return (
      <main className="ts-route-state">
        <h2 className="ts-route-state__title">Administrator access required</h2>
        <p className="ts-route-state__text">
          Your account does not have permission to open the store management console.
        </p>
        <Link to={paths.home()} className="ts-button ts-button--primary">
          Back to storefront
        </Link>
      </main>
    )
  }

  return (
    <main className="ts-route-state">
      <h2 className="ts-route-state__title">{admin ? 'Admin sign-in required' : 'Sign in to continue'}</h2>
      <p className="ts-route-state__text">
        {admin
          ? 'Sign in with an authorised administrator account to manage products, orders and users.'
          : 'This page is tied to your account. Sign in and we will bring you right back.'}
      </p>
      <Link
        to={paths.auth('login')}
        state={returnTo ? { returnTo } : undefined}
        className="ts-button ts-button--primary"
      >
        Sign in
      </Link>
    </main>
  )
}
