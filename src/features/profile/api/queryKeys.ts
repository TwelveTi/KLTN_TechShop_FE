import type { QueryKey } from '@core/query'

/** Query key cho dữ liệu tài khoản của chính người đang đăng nhập. */
export const profileKeys = {
  all: (): QueryKey => ['profile'],
  orders: (): QueryKey => ['profile', 'orders'],
}
