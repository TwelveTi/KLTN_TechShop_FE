/**
 * PUBLIC API của feature `catalog`.
 *
 * `home` được phép tiêu thụ `useFeaturedProducts` — trang chủ là một bố cục
 * quanh dữ liệu catalog, không phải một nguồn dữ liệu riêng. Cạnh này được khai
 * báo trong allowlist của ESLint.
 */
export { useFeaturedProducts } from './hooks/useCatalog'
export type { CatalogFilters, ProductDetail } from './types'
