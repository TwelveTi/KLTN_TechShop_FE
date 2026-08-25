import type { QueryKey } from '@core/query'
import type { CatalogFilters } from '../types'

/**
 * Query key cho catalog.
 *
 * Taxonomy (danh mục, thương hiệu) đổi rất ít nên giữ tươi lâu; danh sách sản
 * phẩm khoá theo TẬP BỘ LỌC, nên đổi trang rồi quay lại là dùng cache.
 */
export const catalogKeys = {
  all: (): QueryKey => ['catalog'],
  categories: (): QueryKey => ['catalog', 'categories'],
  brands: (): QueryKey => ['catalog', 'brands'],
  products: (filters?: CatalogFilters): QueryKey =>
    filters === undefined ? ['catalog', 'products'] : ['catalog', 'products', productFilterKey(filters)],
  featured: (limit: number): QueryKey => ['catalog', 'featured', limit],
  product: (idOrSlug: string): QueryKey => ['catalog', 'product', idOrSlug],
  reviews: (productId: string, limit: number): QueryKey => ['catalog', 'reviews', productId, limit],
  reviewSummary: (productId: string): QueryKey => ['catalog', 'reviews', productId, 'summary'],
}

/**
 * Chỉ những trường ẢNH HƯỞNG TỚI TRUY VẤN được đưa vào key.
 *
 * `view` (lưới/danh sách) cố ý bị loại: đó là chuyện hiển thị phía client, và
 * nếu nó nằm trong key thì bật/tắt chế độ xem sẽ tạo ra một lần gọi mạng.
 */
function productFilterKey(filters: CatalogFilters) {
  return {
    q: filters.q?.trim() || undefined,
    category: filters.category,
    brands: filters.brands,
    minPriceVnd: filters.minPriceVnd,
    maxPriceVnd: filters.maxPriceVnd,
    inStock: filters.inStock,
    onSale: filters.onSale,
    rating: filters.rating,
    sort: filters.sort,
    page: filters.page,
    limit: filters.limit,
  }
}
