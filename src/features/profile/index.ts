/**
 * PUBLIC API của feature `profile`.
 *
 * Sổ địa chỉ KHÔNG còn ở đây: nó đã thành `@features/addresses` ở GĐ5, vì cả
 * Hồ sơ lẫn Thanh toán đều cần nó nên nó không thuộc về bên nào.
 */
export type { CustomerOrder, MyOrdersResponse } from './api/profileApi'
export { profileKeys } from './api/queryKeys'
