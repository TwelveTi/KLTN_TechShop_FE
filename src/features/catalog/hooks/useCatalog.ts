import { useQuery } from '@core/query'
import { catalogApi } from '../api/catalogApi'
import { catalogKeys } from '../api/queryKeys'
import type { CatalogFilters } from '../types'

/**
 * Hook dữ liệu của catalog — thứ DUY NHẤT màn hình được gọi để lấy dữ liệu.
 *
 * Thay cho khuôn `useEffect + requestSeq + isLoading + try/catch` từng được
 * viết lại bằng tay ở `CatalogScreen`, `ProductDetailScreen`, `HomeScreen` và
 * `ProductReviews` — bốn bản, bốn mức độ chặt chẽ khác nhau.
 */

/** Taxonomy hầu như không đổi trong một phiên làm việc. */
const TAXONOMY_STALE_MS = 5 * 60_000
/** Danh sách sản phẩm: đủ tươi để thấy thay đổi, đủ lâu để đổi trang qua lại không gọi mạng. */
const PRODUCTS_STALE_MS = 30_000

export function useCategories() {
  return useQuery(catalogKeys.categories(), () => catalogApi.getCategories(), {
    staleTime: TAXONOMY_STALE_MS,
  })
}

export function useBrands() {
  return useQuery(catalogKeys.brands(), () => catalogApi.getBrands(), {
    staleTime: TAXONOMY_STALE_MS,
  })
}

/**
 * Danh sách sản phẩm đã lọc + phân trang.
 *
 * Hai điều đáng chú ý trong query key:
 *   - `view` (lưới ⇄ danh sách) KHÔNG nằm trong key, nên đổi chế độ xem không
 *     gọi mạng;
 *   - `resolvedCategory` CÓ nằm trong key, vì cùng một token "laptops" có thể
 *     quy về slug khác nhau tuỳ taxonomy đã tải hay chưa.
 */
export function useProducts(filters: CatalogFilters, resolvedCategory?: string) {
  return useQuery(
    [...catalogKeys.products(filters), resolvedCategory ?? null],
    () => catalogApi.listProducts(filters, resolvedCategory),
    { staleTime: PRODUCTS_STALE_MS },
  )
}

/** Sản phẩm nổi bật cho trang chủ. */
export function useFeaturedProducts(limit = 24) {
  return useQuery(catalogKeys.featured(limit), () => catalogApi.getFeatured(limit), {
    staleTime: PRODUCTS_STALE_MS,
  })
}

/** Chi tiết một sản phẩm. `enabled` hoãn lại khi chưa có id. */
export function useProduct(idOrSlug: string) {
  return useQuery(catalogKeys.product(idOrSlug), () => catalogApi.getProductById(idOrSlug), {
    staleTime: PRODUCTS_STALE_MS,
    enabled: Boolean(idOrSlug),
  })
}
