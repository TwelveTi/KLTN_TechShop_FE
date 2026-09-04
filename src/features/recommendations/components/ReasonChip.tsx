import { Icon, type IconName } from '@shared/ui/Icon'
import type { ReasonCode } from '../types'

/**
 * Nhãn "vì sao sản phẩm này".
 *
 * Đây là bề mặt GIẢI THÍCH ĐƯỢC của recommender: backend đã ghi lại thành phần
 * nào thắng điểm cho từng gợi ý (`reasonCode`), nên rail nói được lý do thật
 * thay vì một câu chung chung. Không có nó thì công thức hybrid 5 thành phần
 * hoàn toàn vô hình với người dùng — và với hội đồng.
 *
 * Văn bản ở đây là bản dịch 1-1 của mã backend, cố ý không suy diễn thêm: mã
 * `POPULAR_NOW` nghĩa là sản phẩm này chỉ ăn điểm phổ biến, và nói đúng như vậy
 * trung thực hơn là dán nhãn "dành riêng cho bạn".
 */
const REASON_LABELS: Record<ReasonCode, { label: string; icon: IconName }> = {
  MATCHES_YOUR_TASTE: { label: 'Matches your taste', icon: 'sparkles' },
  MATCHES_YOUR_SEARCH: { label: 'From your searches', icon: 'search' },
  LIKE_WHAT_YOU_BOUGHT: { label: 'Like what you bought', icon: 'shopping-bag' },
  SIMILAR_TO_VIEWED: { label: 'Similar to what you viewed', icon: 'eye' },
  POPULAR_NOW: { label: 'Popular right now', icon: 'trending-up' },
  SIMILAR_TO_THIS: { label: 'Similar hardware', icon: 'layers' },
}

export function ReasonChip({ reasonCode }: { reasonCode: ReasonCode }) {
  const reason = REASON_LABELS[reasonCode]

  return (
    <span className="ts-rec-reason">
      <Icon name={reason.icon} size={13} className="ts-rec-reason__icon" />
      <span className="ts-rec-reason__text">{reason.label}</span>
    </span>
  )
}
