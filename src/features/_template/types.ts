/**
 * Type cục bộ của feature. Cái gì bên ngoài cần thì re-export ở `index.ts`.
 *
 * Đây KHÔNG phải chỗ đặt entity dùng chung — `Product`, `Order`, `User` thuộc
 * `@domain`. Ở đây chỉ đặt thứ chỉ feature này quan tâm (bộ lọc, view model).
 */
export interface ExampleFilters {
  q?: string
  page: number
  limit: number
}
