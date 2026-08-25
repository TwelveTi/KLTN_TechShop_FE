/**
 * DTO — hình dạng payload của backend, phản chiếu NGUYÊN VĂN.
 *
 * Chỉ `mappers.ts` được đọc những kiểu này. Phần còn lại của ứng dụng chỉ thấy
 * `@domain/*`. Nhờ ranh giới đó, backend đổi tên field thì chỉ một file phải
 * sửa — thay vì rải `any` khắp nơi rồi hỏng âm thầm như v1.
 *
 * Tiền để dạng `number | string` vì backend trả decimal dưới cả hai dạng tuỳ
 * endpoint; `toVnd()` trong mapper chuẩn hoá lại.
 */

export interface ProductImageDto {
  imageUrl: string
  isPrimary?: boolean
}

export interface ProductVariantDto {
  id?: string
  sku?: string
  name?: string
  variantName?: string
  price?: number | string | null
  salePrice?: number | string | null
  stockQuantity?: number | string
  status?: string
  isDefault?: boolean
}

export interface ProductSpecificationDto {
  name?: string
  valueText?: string | null
  valueNumber?: number | null
  valueBoolean?: boolean | null
  definition?: { name?: string }
}

export interface ProductDto {
  id: string
  name: string
  slug?: string
  sku?: string
  shortDescription?: string | null
  description?: string | null
  basePrice: number | string
  salePrice?: number | string | null
  status?: string
  stockQuantity?: number | string
  isFeatured?: boolean
  averageRating?: number | string
  reviewCount?: number | string
  categoryId?: string
  category?: { name?: string; slug?: string }
  brand?: { name?: string; slug?: string }
  images?: ProductImageDto[]
  variants?: ProductVariantDto[]
  specifications?: ProductSpecificationDto[]
}

export interface PaginationDto {
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ProductListDto {
  items: ProductDto[]
  pagination: PaginationDto
}

export interface CategoryListDto {
  items: Array<{
    id: string
    name: string
    slug: string
    description?: string | null
    productCount: number
  }>
  totalProducts: number
}

export interface BrandListDto {
  items: Array<{
    id: string
    name: string
    slug: string
    productCount: number
  }>
}
