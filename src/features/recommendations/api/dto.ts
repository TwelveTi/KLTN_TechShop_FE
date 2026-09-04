/**
 * DTO — phản chiếu NGUYÊN VĂN payload của `recommendationService.decorate()`.
 *
 * Chỉ `mappers.ts` được đọc những kiểu này.
 *
 * Lưu ý một khác biệt so với `ProductDto` của catalog: ở đây backend đã chọn
 * sẵn ảnh chính và trả về MỘT `imageUrl`, không phải mảng `images[]`. Đó là lý
 * do feature này có mapper riêng thay vì gọi lại mapper của catalog — dựng một
 * `ProductDto` giả chỉ để đi qua hàm đó thì tệ hơn hai chục dòng thật thà.
 */

export interface RecommendedProductDto {
  id: string
  name: string
  slug?: string | null
  shortDescription?: string | null
  basePrice: number | string
  salePrice?: number | string | null
  status?: string
  stockQuantity?: number | string
  averageRating?: number | string
  reviewCount?: number | string
  isFeatured?: boolean
  imageUrl?: string | null
  category?: { id: string; name: string; slug: string } | null
  brand?: { id: string; name: string; slug: string } | null
}

export interface RecommendationItemDto {
  itemId: string | null
  rankPosition: number
  score: number
  reasonCode: string
  /** `{ parts, dominant, algorithmVersion }` — hiện chưa render, giữ để AI dùng. */
  reasonMetadata?: Record<string, unknown> | null
  product: RecommendedProductDto
}

/**
 * `GET /recommendations` trả đủ bốn trường; `GET .../similar` chỉ trả
 * `items` + `algorithmVersion`. Vì vậy mọi thứ ngoài `items` là tuỳ chọn.
 */
export interface RecommendationSetDto {
  items?: RecommendationItemDto[] | null
  strategy?: string
  algorithmVersion?: string
  personalised?: boolean
  weights?: Record<string, number>
}
