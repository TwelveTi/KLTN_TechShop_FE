import type { Product } from '@domain/product'
import type { Vnd } from '@domain/money'

export type SortOption = 'popular' | 'newest' | 'price_asc' | 'price_desc' | 'rating' | 'name_asc'

export type ViewMode = 'grid' | 'list' | 'compact'

export interface CatalogCategory {
  id: string
  name: string
  slug: string
  icon?: string
  count?: number
  description?: string
}

export interface CatalogBrand {
  id: string
  name: string
  slug: string
  count?: number
}

export interface CatalogFilters {
  q?: string
  category?: string
  brands: string[]
  minPriceVnd?: Vnd
  maxPriceVnd?: Vnd
  inStock?: boolean
  onSale?: boolean
  rating?: number
  sort: SortOption
  page: number
  limit: number
  view: ViewMode
}

export interface CatalogMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface CatalogResponse {
  items: Product[]
  pagination: CatalogMeta
  categories: CatalogCategory[]
  brands: CatalogBrand[]
}

export interface ProductVariant {
  id: string
  name: string
  sku: string
  priceVnd: Vnd
  inStock: boolean
  isDefault?: boolean
}

export interface ProductSpecItem {
  group?: string
  name: string
  value: string
}

/** Sản phẩm ở trang chi tiết: `Product` cộng nội dung dài và biến thể. */
export interface ProductDetail extends Product {
  slug: string
  categorySlug: string
  brandSlug: string
  /** Giá niêm yết, luôn có (khác `originalPriceVnd` chỉ xuất hiện khi giảm giá). */
  basePriceVnd: Vnd
  inStock: boolean
  shortDescription: string
  fullDescription: string
  galleryImages: string[]
  variants: ProductVariant[]
  specifications: ProductSpecItem[]
  highlights: string[]
  relatedProducts: Product[]
}

export interface ProductReview {
  id: string
  /** Tên hiển thị của người đánh giá. */
  user: string
  /** Id backend — để nhận ra đánh giá của chính người đang đăng nhập. */
  userId?: string
  avatarUrl?: string | null
  rating: number
  title?: string | null
  comment: string
  verifiedPurchase: boolean
  createdAt: string
  updatedAt?: string
}

export interface ReviewDistributionBucket {
  stars: 1 | 2 | 3 | 4 | 5
  count: number
}

export interface ProductReviewsData {
  average: number
  total: number
  distribution: ReviewDistributionBucket[]
  reviews: ProductReview[]
}
