import type { Product } from '@domain/product'
import { toVnd } from '@shared/utils/money'
import { REASON_CODES, type ReasonCode, type RecommendationSet, type RecommendedItem } from '../types'
import type { RecommendationItemDto, RecommendationSetDto, RecommendedProductDto } from './dto'

/**
 * Mapper DTO → domain. Biên giới duy nhất giữa hình dạng của backend và ngôn
 * ngữ của ứng dụng.
 *
 * Đây cũng là nơi duy nhất tiền của rail được đưa về số nguyên VND.
 */

const KNOWN_REASONS = new Set<string>(REASON_CODES)

/**
 * Mã lạ → `POPULAR_NOW`.
 *
 * Backend có thể thêm một thành phần tính điểm mới trước khi FE biết tới nó
 * (README 6.5 còn ghi collaborative filtering là việc chưa làm). Rơi về một
 * nhãn thật thà tốt hơn là in chuỗi enum thô ra cho khách đọc, và tốt hơn là
 * ném lỗi làm mất cả rail vì một cái nhãn.
 */
function toReasonCode(raw: string): ReasonCode {
  return KNOWN_REASONS.has(raw) ? (raw as ReasonCode) : 'POPULAR_NOW'
}

function isOutOfStock(dto: RecommendedProductDto): boolean {
  return dto.status === 'OUT_OF_STOCK' || Number(dto.stockQuantity ?? 0) <= 0
}

function toProduct(dto: RecommendedProductDto): Product {
  const basePriceVnd = toVnd(dto.basePrice)
  const salePriceVnd = dto.salePrice == null ? null : toVnd(dto.salePrice)
  const hasDiscount = salePriceVnd !== null && salePriceVnd > 0 && salePriceVnd < basePriceVnd

  return {
    id: String(dto.id),
    name: dto.name,
    category: dto.category?.name || 'Technology',
    brand: dto.brand?.name || undefined,
    priceVnd: hasDiscount ? (salePriceVnd as number) : basePriceVnd,
    originalPriceVnd: hasDiscount ? basePriceVnd : undefined,
    badge: dto.isFeatured ? 'Featured' : hasDiscount ? 'Hot Deal' : undefined,
    isFeatured: Boolean(dto.isFeatured),
    // Không có ảnh dự phòng từ stock photo: `ProductCard` đã có placeholder
    // theo icon danh mục, và nó nói thật ("chưa có ảnh") thay vì gán cho sản
    // phẩm này một tấm ảnh của sản phẩm khác.
    imageUrl: dto.imageUrl || undefined,
    outOfStock: isOutOfStock(dto),
    shortDescription: dto.shortDescription || undefined,
    rating: Number(dto.averageRating || 0),
    reviewCount: Number(dto.reviewCount || 0),
    stockQuantity: Number(dto.stockQuantity || 0),
  }
}

function toRecommendedItem(dto: RecommendationItemDto): RecommendedItem {
  return {
    itemId: dto.itemId || null,
    rankPosition: Number(dto.rankPosition) || 0,
    score: Number(dto.score) || 0,
    reasonCode: toReasonCode(String(dto.reasonCode || '')),
    product: toProduct(dto.product),
  }
}

export function toRecommendationSet(dto: RecommendationSetDto | null): RecommendationSet {
  return {
    items: (dto?.items ?? []).filter((item) => item?.product?.id).map(toRecommendedItem),
    strategy: dto?.strategy || 'unknown',
    algorithmVersion: dto?.algorithmVersion || 'unknown',
    personalised: dto?.personalised === true,
  }
}

/** Rail rỗng — dùng khi query chưa chạy hoặc lỗi, để nơi gọi không phải kiểm `undefined`. */
export const EMPTY_SET: RecommendationSet = {
  items: [],
  strategy: 'unknown',
  algorithmVersion: 'unknown',
  personalised: false,
}
