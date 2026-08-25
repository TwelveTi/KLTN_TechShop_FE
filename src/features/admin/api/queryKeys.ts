import type { QueryKey } from '@core/query'

/**
 * Query key của khu vực quản trị.
 *
 * Key là mảng, feature trước, entity sau — nhờ vậy vô hiệu theo TIỀN TỐ hoạt
 * động: `invalidate(adminKeys.products())` quét mọi biến thể filter của bảng
 * sản phẩm mà không đụng tới doanh thu hay người dùng.
 *
 * Đây là hợp đồng giữa hook đọc và hook ghi — cả hai phải dùng chung file này.
 */
export const adminKeys = {
  all: (): QueryKey => ['admin'],

  dashboard: (): QueryKey => ['admin', 'dashboard'],
  revenueDaily: (period: string): QueryKey => ['admin', 'dashboard', 'revenue-daily', period],
  topProducts: (limit: number): QueryKey => ['admin', 'dashboard', 'top-products', limit],
  lowStock: (): QueryKey => ['admin', 'dashboard', 'low-stock'],

  products: (filters?: unknown): QueryKey =>
    filters === undefined ? ['admin', 'products'] : ['admin', 'products', filters],
  categories: (): QueryKey => ['admin', 'categories'],
  brands: (): QueryKey => ['admin', 'brands'],
  orders: (filters?: unknown): QueryKey =>
    filters === undefined ? ['admin', 'orders'] : ['admin', 'orders', filters],
  users: (filters?: unknown): QueryKey =>
    filters === undefined ? ['admin', 'users'] : ['admin', 'users', filters],
}
