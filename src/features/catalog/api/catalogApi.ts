import { http } from '@core/http'
import type { Product } from '@domain/product'
import { withQuery } from '@shared/utils/url'
import { categoryIcon } from '../lib/categorySlug'
import type { CatalogBrand, CatalogCategory, CatalogFilters, ProductDetail, SortOption } from '../types'
import type { BrandListDto, CategoryListDto, ProductDto, ProductListDto } from './dto'
import { toProduct, toProductDetail } from './mappers'

/**
 * Catalog API — CHỈ endpoint và tham số.
 *
 * v1 gộp sáu trách nhiệm vào một file 435 dòng (HTTP, mapper, cache, format
 * tiền, tiện ích slug, icon danh mục). Giờ mapper ở `mappers.ts`, logic slug ở
 * `lib/categorySlug.ts`, định dạng ở `@shared/utils/money`, và cache là việc
 * của `@core/query` (GĐ4) — không còn biến module `cachedTaxonomy*` sống mãi
 * không bao giờ hết hạn.
 */

/** Danh mục mặc định khi taxonomy chưa tải xong hoặc backend lỗi. */
export const FALLBACK_CATEGORIES: CatalogCategory[] = [
  {
    id: 'all',
    name: 'All Products',
    slug: 'all',
    icon: 'package',
    description: 'Curated technology and hardware lineup.',
  },
]

const SORT_PARAM: Record<SortOption, string> = {
  price_asc: 'priceAsc',
  price_desc: 'priceDesc',
  rating: 'rating',
  newest: 'newest',
  name_asc: 'name',
  popular: 'bestSelling',
}

export const catalogApi = {
  async getCategories(): Promise<CatalogCategory[]> {
    try {
      const data = await http.get<CategoryListDto>('/categories')
      return [
        { id: 'all', name: 'All Products', slug: 'all', icon: 'package', count: data.totalProducts },
        ...data.items.map((item) => ({
          id: item.id,
          name: item.name,
          slug: item.slug,
          icon: categoryIcon(item.slug),
          count: item.productCount,
          description: item.description || `Official ${item.name} collection.`,
        })),
      ]
    } catch {
      return FALLBACK_CATEGORIES
    }
  },

  async getBrands(): Promise<CatalogBrand[]> {
    try {
      const data = await http.get<BrandListDto>('/brands')
      return data.items.map((item) => ({
        id: item.id,
        name: item.name,
        slug: item.slug,
        count: item.productCount,
      }))
    } catch {
      return []
    }
  },

  /**
   * Danh sách sản phẩm đã lọc + phân trang phía server.
   *
   * KHÔNG tự tải taxonomy nữa. v1 gọi `getCategories()` rồi `getBrands()` ngay
   * bên trong hàm này, nên mỗi lần đổi bộ lọc là ba round-trip nối đuôi và
   * danh mục/thương hiệu bị tải lại dù chúng gần như không đổi.
   *
   * `resolvedCategory` do nơi gọi truyền vào (đã quy từ token của department
   * bar về slug thật bằng taxonomy đã cache).
   */
  async listProducts(
    filters: CatalogFilters,
    resolvedCategory?: string,
  ): Promise<{ items: Product[]; pagination: ProductListDto['pagination'] }> {
    const path = withQuery('/products', {
      page: Math.max(1, filters.page || 1),
      limit: Math.max(1, filters.limit || 15),
      onlyActive: true,
      sort: SORT_PARAM[filters.sort] ?? SORT_PARAM.popular,
      keyword: filters.q?.trim(),
      category: resolvedCategory && resolvedCategory !== 'all' ? resolvedCategory : undefined,
      brands: filters.brands,
      minPrice: filters.minPriceVnd && filters.minPriceVnd > 0 ? filters.minPriceVnd : undefined,
      maxPrice: filters.maxPriceVnd && filters.maxPriceVnd > 0 ? filters.maxPriceVnd : undefined,
      inStock: filters.inStock ? true : undefined,
      onSale: filters.onSale ? true : undefined,
      rating: filters.rating && filters.rating > 0 ? filters.rating : undefined,
    })

    const data = await http.get<ProductListDto>(path)
    return { items: (data.items ?? []).map(toProduct), pagination: data.pagination }
  },

  /**
   * Sản phẩm cho trang chủ.
   *
   * v1 để `HomePage` tự gọi `apiClient` rồi tự map — một bản sao của mapper
   * catalog, kể cả URL ảnh dự phòng hardcode. Giờ nó gọi hàm này.
   */
  async getFeatured(limit = 24): Promise<Product[]> {
    const data = await http.get<ProductListDto>(withQuery('/products', { limit, onlyActive: true }))
    return (data.items ?? []).map(toProduct)
  },

  async getProductById(idOrSlug: string): Promise<ProductDetail | null> {
    if (!idOrSlug) return null

    const dto = await http.get<ProductDto | null>(`/products/${encodeURIComponent(idOrSlug)}`)
    if (!dto) return null

    return toProductDetail(dto, await catalogApi.getRelated(dto))
  },

  /** Sản phẩm cùng danh mục. Lỗi ở đây không được làm hỏng trang chi tiết. */
  async getRelated(dto: ProductDto, limit = 4): Promise<Product[]> {
    if (!dto.categoryId) return []
    try {
      const data = await http.get<ProductListDto>(
        withQuery('/products', { categoryId: dto.categoryId, limit: limit + 1, onlyActive: true }),
      )
      return (data.items ?? [])
        .filter((item) => item.id !== dto.id)
        .slice(0, limit)
        .map(toProduct)
    } catch {
      return []
    }
  },
}
