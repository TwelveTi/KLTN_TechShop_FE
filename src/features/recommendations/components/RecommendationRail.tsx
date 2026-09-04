import { ProductCard } from '@shared/ui/ProductCard'
import { ReasonChip } from './ReasonChip'
import type { RecommendedItem } from '../types'
import '../styles/recommendations.css'

/**
 * Dải gợi ý — phần TRÌNH BÀY, không biết dữ liệu đến từ đâu.
 *
 * Hai container (`PersonalRecommendationRail`, `SimilarProductsRail`) sở hữu
 * hook và việc đo lường; ở đây chỉ có bố cục. Nhờ tách vậy mà thêm một rail mới
 * (ví dụ "khách mua sản phẩm này cũng mua") là viết thêm một container, không
 * phải sửa file này.
 *
 * Quy tắc rỗng: **không có gợi ý thì không render gì cả.** Một rail phụ trợ mà
 * hiện "chưa có dữ liệu" chỉ làm trang chủ trông như đang hỏng. Lỗi query cũng
 * đi vào cùng đường đó — `items` rỗng, rail biến mất, phần còn lại của trang
 * không việc gì.
 */

const SKELETON_COUNT = 5

export interface RecommendationRailProps {
  /** Dùng cho `aria-labelledby` và cho link neo tới dải này. */
  id: string
  title: string
  subtitle?: string
  items: RecommendedItem[]
  isLoading?: boolean
  /**
   * Hiện nhãn lý do trên từng thẻ.
   *
   * Tắt khi cả dải chung một lý do — in "Similar hardware" tám lần dưới một tiêu
   * đề đã nói đúng điều đó là nhiễu, không phải thông tin.
   */
  showReasons?: boolean
  onOpenProduct: (item: RecommendedItem) => void
  onAddToCart: (item: RecommendedItem) => void
}

export function RecommendationRail({
  id,
  title,
  subtitle,
  items,
  isLoading = false,
  showReasons = false,
  onOpenProduct,
  onAddToCart,
}: RecommendationRailProps) {
  const isEmpty = items.length === 0

  if (isEmpty && !isLoading) return null

  return (
    <section className="ts-rec-rail" id={id} aria-labelledby={`${id}-heading`}>
      <div className="ts-rec-rail__head">
        <div className="ts-rec-rail__headings">
          <h2 className="ts-rec-rail__title" id={`${id}-heading`}>
            {title}
          </h2>
          {subtitle && <p className="ts-rec-rail__subtitle">{subtitle}</p>}
        </div>
      </div>

      {isEmpty ? (
        <div className="ts-rec-rail__track" aria-busy="true" aria-label={`Loading ${title}`}>
          {Array.from({ length: SKELETON_COUNT }, (_, index) => (
            <div className="ts-rec-skeleton" key={index}>
              <div className="ts-rec-skeleton__media" />
              <div className="ts-rec-skeleton__line ts-rec-skeleton__line--meta" />
              <div className="ts-rec-skeleton__line ts-rec-skeleton__line--title" />
              <div className="ts-rec-skeleton__line ts-rec-skeleton__line--price" />
            </div>
          ))}
        </div>
      ) : (
        <ul className="ts-rec-rail__track">
          {items.map((item) => (
            <li className="ts-rec-slot" key={item.product.id}>
              {showReasons && <ReasonChip reasonCode={item.reasonCode} />}
              <ProductCard
                product={item.product}
                variant="default"
                showSave={false}
                onOpen={() => onOpenProduct(item)}
                onAddToCart={() => onAddToCart(item)}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
