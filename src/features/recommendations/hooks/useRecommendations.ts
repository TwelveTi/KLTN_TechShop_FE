import { useCallback } from 'react'
import { useQuery } from '@core/query'
import { useAuth } from '@features/auth'
import { recommendationApi } from '../api/recommendationApi'
import { recommendationKeys } from '../api/queryKeys'
import type { RecommendationOutcome, RecommendedItem } from '../types'

/**
 * Thứ DUY NHẤT màn hình gọi để lấy gợi ý.
 *
 * `staleTime` ở đây dài hơn catalog (5 phút thay vì 30 giây) vì hai lý do, và cả
 * hai đều quan trọng hơn độ tươi:
 *
 *  1. **Mỗi lần gọi `/recommendations` của người đã đăng nhập tạo một dòng
 *     `recommendation_results` mới.** Gọi lại mỗi lần điều hướng sẽ bơm số
 *     "shown" lên và làm loãng CTR — tức là làm sai chính con số chương Đánh giá
 *     đang đo. Backend cũng tự cache 15 phút (`CACHE_MINUTES`), nên gọi dày hơn
 *     thế chỉ tốn ghi.
 *  2. Một dải gợi ý xáo lại thứ tự mỗi lần khách bấm Back là giao diện tệ. Gợi
 *     ý nên đứng yên đủ lâu để đọc.
 */
const RECOMMENDATION_STALE_MS = 5 * 60_000

/**
 * Dải cá nhân hoá cho trang chủ.
 *
 * Hai chi tiết trong key và `enabled`:
 *   - `audience` là id người dùng (hoặc `'guest'`), nên gợi ý của hai tài khoản
 *     không bao giờ dùng chung một ô cache;
 *   - query bị hoãn cho tới khi khôi phục phiên xong. Không hoãn thì lần tải đầu
 *     của một người đã đăng nhập sẽ gọi mạng như khách, lưu kết quả popularity
 *     vào cache khoá `'guest'`, rồi gọi lần thứ hai — hai request và một dải
 *     nhấp nháy.
 */
export function useRecommendedForMe(limit = 12) {
  const { user, isRestoringSession } = useAuth()
  const audience = user?.id ?? 'guest'

  return useQuery(
    recommendationKeys.forMe(audience, limit),
    () => recommendationApi.getForMe({ limit }),
    { staleTime: RECOMMENDATION_STALE_MS, enabled: !isRestoringSession },
  )
}

/** Dải "sản phẩm tương tự" của trang chi tiết. */
export function useSimilarProducts(productId: string, limit = 8) {
  return useQuery(
    recommendationKeys.similar(productId, limit),
    () => recommendationApi.getSimilarTo(productId, { limit }),
    { staleTime: RECOMMENDATION_STALE_MS, enabled: Boolean(productId) },
  )
}

/**
 * Báo lại rằng một gợi ý đã được tác động.
 *
 * Cố ý KHÔNG dùng `useMutation`: không có gì để vô hiệu hoá, không có trạng thái
 * chờ nào để hiển thị, và **một lần báo thất bại không được cản việc khách đang
 * làm**. Khách bấm vào một sản phẩm là để xem sản phẩm đó — nếu endpoint đo
 * lường sập thì họ vẫn phải được điều hướng.
 *
 * Vì vậy mọi lời gọi ở đây là fire-and-forget và lỗi bị nuốt tại chỗ.
 */
export function useRecommendationTracking() {
  const track = useCallback((item: RecommendedItem, outcome: RecommendationOutcome) => {
    // `itemId` null nghĩa là backend không lưu dải này (khách vãng lai) — không
    // có dòng nào để quy kết, và bịa một id ra sẽ nhận 404.
    if (item.itemId) {
      void recommendationApi.recordOutcome(item.itemId, outcome).catch(() => {})
    }

    // Chỉ cú bấm mới là tín hiệu client được phép báo. `ADD_TO_CART` và
    // `PURCHASE` đã được server tự ghi ở `cartService` / `orderService`, báo
    // thêm ở đây là đếm đôi.
    if (outcome === 'CLICK') {
      void recommendationApi.reportRecommendationClick(item.product.id).catch(() => {})
    }
  }, [])

  return {
    trackClick: useCallback((item: RecommendedItem) => track(item, 'CLICK'), [track]),
    trackAddToCart: useCallback((item: RecommendedItem) => track(item, 'ADD_TO_CART'), [track]),
  }
}
