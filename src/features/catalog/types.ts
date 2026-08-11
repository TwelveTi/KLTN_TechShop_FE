import type { ProductItem } from '../../shared/components/ProductCard'

export type SortOption =
  | 'popular'
  | 'newest'
  | 'price_asc'
  | 'price_desc'
  | 'rating'
  | 'name_asc'

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
  minPrice?: number
  maxPrice?: number
  inStock?: boolean
  onSale?: boolean
  rating?: number
  specs?: string[]
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
  items: ProductItem[]
  pagination: CatalogMeta
  categories: CatalogCategory[]
  brands: CatalogBrand[]
  priceRange: { min: number; max: number }
}

export interface CompareItem extends ProductItem {
  brandName?: string
  specMap?: Record<string, string>
}

export interface ProductVariant {
  id: string
  name: string
  sku: string
  price?: string
  rawPrice?: number
  inStock: boolean
  isDefault?: boolean
}

export interface ProductSpecItem {
  group?: string
  name: string
  value: string
}

export interface ProductReview {
  id: string
  /** Reviewer display name. */
  user: string
  rating: number
  comment: string
  verifiedPurchase: boolean
  /** ISO timestamp. */
  createdAt: string
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

export interface ProductDetailData extends ProductItem {
  slug: string
  categorySlug: string
  brandSlug: string
  rawPrice: number
  rawOriginalPrice?: number
  discountPercent?: number
  inStock: boolean
  rating: number
  reviewCount: number
  shortDescription: string
  fullDescription: string
  galleryImages: string[]
  variants: ProductVariant[]
  specifications: ProductSpecItem[]
  highlights: string[]
  relatedProducts: ProductItem[]
}

