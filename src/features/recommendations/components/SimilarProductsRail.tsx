import { useNavigate } from '@core/router'
import { paths } from '@routes/paths'
import { useCart } from '@features/cart'
import { useToast } from '@shared/ui/useToast'
import type { Product } from '@domain/product'
import { useRecommendationTracking, useSimilarProducts } from '../hooks/useRecommendations'
import { RecommendationRail } from './RecommendationRail'
import type { RecommendedItem } from '../types'

/**
 * Dải "sản phẩm tương tự" của trang chi tiết — `GET /recommendations/products/:id/similar`.
 *
 * ### Vì sao có `fallback`
 *
 * Ma trận `ProductSimilarity` được tính OFFLINE bằng một lượt batch
 * (`POST /admin/recommendations/similarity/rebuild`). Nếu lượt đó chưa chạy trên
 * database hiện tại, endpoint trả về đúng `items: []` — không phải lỗi, chỉ là
 * chưa có dữ liệu. Một trang sản phẩm mất hẳn dải liên quan vì một job chưa chạy
 * là kết quả tệ và rất khó đoán nguyên nhân khi demo.
 *
 * Nên khi engine không trả gì, rail hạ xuống danh sách cùng danh mục mà trang
 * chi tiết đã có sẵn — và **đổi luôn tiêu đề**. Đây là điểm quan trọng: dán nhãn
 * "Similar hardware" lên một danh sách cùng danh mục là nói quá về thứ hệ thống
 * đã làm. Nó cũng KHÔNG được đo lường (xem `usingFallback` bên dưới), vì những
 * sản phẩm này chưa bao giờ đi qua recommender.
 */
export function SimilarProductsRail({
  productId,
  fallback = [],
  limit = 8,
}: {
  productId: string
  fallback?: Product[]
  limit?: number
}) {
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const { showToast } = useToast()
  const { trackClick, trackAddToCart } = useRecommendationTracking()
  const { data, isLoading } = useSimilarProducts(productId, limit)

  const engineItems = data?.items ?? []
  const usingFallback = !isLoading && engineItems.length === 0 && fallback.length > 0
  const items = usingFallback ? fallback.map(toUntrackedItem) : engineItems

  const handleOpen = (item: RecommendedItem) => {
    // Không đo lường dải dự phòng. `itemId` của nó vốn là null nên
    // `recordOutcome` đã tự bỏ qua, nhưng `CLICK_RECOMMENDATION` thì không —
    // báo nó ở đây sẽ nhồi vào log hành vi những cú bấm mà recommender không hề
    // sinh ra, và làm sai chính hồ sơ sở thích mà nó sẽ đọc sau này.
    if (!usingFallback) trackClick(item)
    navigate(paths.product(item.product.id))
  }

  const handleAddToCart = async (item: RecommendedItem) => {
    const ok = await addToCart(item.product)
    if (!ok) return

    if (!usingFallback) trackAddToCart(item)
    showToast(`Added ${item.product.name} to cart`, { variant: 'success' })
  }

  return (
    <RecommendationRail
      id="ts-rec-similar"
      title={usingFallback ? 'More in this category' : 'Similar hardware'}
      subtitle={
        usingFallback
          ? 'Other products from the same category.'
          : 'Closest matches by category, brand, price and specifications.'
      }
      items={items}
      isLoading={isLoading}
      onOpenProduct={handleOpen}
      onAddToCart={handleAddToCart}
    />
  )
}

/**
 * Bọc một `Product` thường vào hình dạng `RecommendedItem` để dùng chung phần
 * trình bày.
 *
 * `itemId: null` là thật, không phải giá trị tạm: không có dòng gợi ý nào để quy
 * kết vì sản phẩm này không do recommender chọn.
 */
function toUntrackedItem(product: Product, index: number): RecommendedItem {
  return {
    itemId: null,
    rankPosition: index + 1,
    score: 0,
    reasonCode: 'SIMILAR_TO_THIS',
    product,
  }
}
