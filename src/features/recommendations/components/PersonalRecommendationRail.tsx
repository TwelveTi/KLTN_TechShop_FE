import { useNavigate } from '@core/router'
import { paths } from '@routes/paths'
import { useCart } from '@features/cart'
import { useToast } from '@shared/ui/useToast'
import { EMPTY_SET } from '../api/mappers'
import { useRecommendationTracking, useRecommendedForMe } from '../hooks/useRecommendations'
import { RecommendationRail } from './RecommendationRail'
import type { RecommendedItem } from '../types'

/**
 * Dải gợi ý cá nhân hoá — `GET /recommendations`.
 *
 * Đặt được ở bất kỳ trang nào bằng một dòng; nó tự lo hook, điều hướng, thêm
 * giỏ và đo lường. Đây là lý do container tự gọi `useNavigate`/`useCart` thay vì
 * nhận callback từ trang: kiến trúc GĐ3 đã bỏ 12 prop callback điều hướng, và
 * một rail nhận 4 prop chỉ để làm những việc nó tự làm được là đi lùi.
 *
 * Tiêu đề đổi theo cờ `personalised` của backend. Khách chưa đăng nhập — hoặc
 * khách mới chưa có tín hiệu nào, khi backend rơi về `popularity-fallback` —
 * thấy "Trending right now". Chỉ khi thật sự có cá nhân hoá mới hứa
 * "Recommended for you".
 */
export function PersonalRecommendationRail({ limit = 12 }: { limit?: number }) {
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const { showToast } = useToast()
  const { trackClick, trackAddToCart } = useRecommendationTracking()
  const { data, isLoading } = useRecommendedForMe(limit)

  const set = data ?? EMPTY_SET

  const handleOpen = (item: RecommendedItem) => {
    // Báo trước rồi điều hướng: fire-and-forget nên không có await nào chặn, và
    // request vẫn bay đi kể cả khi component bị unmount ngay sau đó.
    trackClick(item)
    navigate(paths.product(item.product.id))
  }

  const handleAddToCart = async (item: RecommendedItem) => {
    const ok = await addToCart(item.product)
    if (!ok) return

    // Chỉ ghi nhận khi giỏ hàng thật sự nhận. Ghi trước khi biết kết quả sẽ đếm
    // cả những lần backend từ chối vì hết hàng — làm đẹp tỉ lệ chuyển đổi bằng
    // các cú thêm giỏ chưa từng xảy ra.
    trackAddToCart(item)
    showToast(`Added ${item.product.name} to cart`, { variant: 'success' })
  }

  return (
    <RecommendationRail
      id="ts-rec-for-you"
      title={set.personalised ? 'Recommended for you' : 'Trending right now'}
      subtitle={
        set.personalised
          ? 'Built from what you have searched, viewed, and bought.'
          : 'What other shoppers are buying this week.'
      }
      items={set.items}
      isLoading={isLoading}
      showReasons={set.personalised}
      onOpenProduct={handleOpen}
      onAddToCart={handleAddToCart}
    />
  )
}
