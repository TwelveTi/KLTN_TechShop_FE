import type { QueryKey } from '@core/query'

/** Query key cho sổ địa chỉ của chính người đang đăng nhập. */
export const addressKeys = {
  all: (): QueryKey => ['addresses'],
  list: (): QueryKey => ['addresses', 'list'],
}
