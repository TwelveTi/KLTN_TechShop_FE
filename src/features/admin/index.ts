/**
 * PUBLIC API của feature `admin`.
 *
 * `layouts/AdminLayout` (tầng 4) tiêu thụ các hook này để hiện badge số đơn
 * đang chờ và số hàng sắp hết trên sidebar.
 */
export { useAdminOrders, useLowStockProducts } from './hooks'
export { adminKeys } from './api/queryKeys'
