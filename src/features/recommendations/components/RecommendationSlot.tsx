import { useState } from 'react'
import { isApiError } from '@core/http'
import { Icon } from '@shared/ui/Icon'
import { ProductCard } from '@shared/ui/ProductCard'
import { recommendationApi } from '../api/recommendationApi'
import { ReasonChip } from './ReasonChip'
import type { RecommendedItem } from '../types'

/**
 * Một ô trong dải gợi ý: nhãn lý do, thẻ sản phẩm, và lời giải thích của AI.
 *
 * Là component riêng chứ không phải JSX nội tuyến trong `RecommendationRail`
 * vì mỗi ô có state RIÊNG (đã hỏi chưa, đang chờ, lỗi gì) — và hook không gọi
 * được bên trong một vòng `map`.
 *
 * Lời giải thích là một khối NỔI, neo ngay dưới nút và đè lên phần trên của thẻ.
 *
 * Bản đầu đặt nó dưới thẻ, để việc mở một ô không đẩy thẻ xuống và làm lệch cả
 * dải cuộn ngang. Bố cục thì đúng, dùng thì hỏng: đo được **383px** từ nút tới
 * chỗ chữ hiện ra, tức là nằm hẳn ngoài màn hình. Bấm xong, chờ mười giây, không
 * có gì đổi ở gần chỗ vừa bấm — không phân biệt được với một cái nút chết.
 *
 * Nổi đè lên thẻ giữ được cả hai: phản hồi nằm đúng chỗ bấm, mà không ô nào
 * xê dịch. Khối nằm gọn trong ranh giới của `<li>` nên `overflow` của dải cuộn
 * cũng không cắt mất nó.
 */

/**
 * Lỗi → câu nói cho người dùng, kèm việc có nên ẩn nút đi hay không.
 *
 * `retryable = false` nghĩa là bấm lại cũng vô ích: máy chủ chưa cấu hình khoá
 * AI (503), hoặc dòng gợi ý đã hết hạn (404) và chỉ tải lại trang mới có id mới.
 * Hai ca đó khoá việc gọi lại, nhưng nút vẫn bấm được — nó chuyển thành nút đóng
 * khối thông báo, vì một khối đè lên thẻ mà không tắt được thì tệ hơn hẳn.
 */
function toNotice(error: unknown): { text: string; retryable: boolean } {
  if (!isApiError(error)) {
    return { text: 'Chưa lấy được lời giải thích. Bạn thử lại nhé.', retryable: true }
  }

  if (error.status === 503) {
    return { text: 'Trợ lý AI chưa được bật trên máy chủ này.', retryable: false }
  }

  switch (error.kind) {
    case 'notFound':
      return { text: 'Gợi ý này đã cũ. Bạn tải lại trang để xem lý do nhé.', retryable: false }
    case 'rateLimited':
      return {
        text: error.message || 'Bạn hỏi hơi nhanh, đợi khoảng một phút rồi thử lại nhé.',
        retryable: true,
      }
    case 'network':
    case 'timeout':
      return { text: 'Không kết nối được tới máy chủ. Bạn thử lại nhé.', retryable: true }
    default:
      return { text: 'Máy chủ đang bận. Bạn thử lại sau ít phút nhé.', retryable: true }
  }
}

interface RecommendationSlotProps {
  item: RecommendedItem
  /** Hiện nhãn lý do và nút hỏi. Tắt khi cả dải chung một lý do. */
  showReason: boolean
  onOpen: () => void
  onAddToCart: () => void
}

export function RecommendationSlot({
  item,
  showReason,
  onOpen,
  onAddToCart,
}: RecommendationSlotProps) {
  const [explanation, setExplanation] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [isAsking, setIsAsking] = useState(false)
  const [isBlocked, setIsBlocked] = useState(false)
  /**
   * Đóng/mở tách khỏi `explanation`.
   *
   * Bản đầu dùng `explanation = null` làm trạng thái đóng, nên gấp lại rồi mở ra
   * là gọi model lần nữa — backend có cache thật nên không tốn hạn mức, nhưng
   * vẫn là một vòng mạng cho một đoạn chữ đang nằm sẵn trong bộ nhớ.
   */
  const [isOpen, setIsOpen] = useState(false)

  /**
   * `itemId` null nghĩa là backend KHÔNG lưu dải này (khách vãng lai). Không có
   * dòng nào để giải thích, nên nút không được xuất hiện — hỏi bừa một id bịa
   * ra chỉ nhận 404.
   */
  const canAsk = showReason && item.itemId !== null

  const ask = async () => {
    if (!item.itemId || isAsking) return

    // Đang mở thì bấm lần nữa là để đóng lại.
    if (isOpen) {
      setIsOpen(false)
      return
    }

    setIsOpen(true)

    // Đã có câu trả lời thì chỉ mở lại, không gọi mạng. `isBlocked` cũng dừng ở
    // đây: 503 và 404 là hai ca hỏi lại bao nhiêu lần cũng vô ích, nhưng nút vẫn
    // phải bấm được để đóng khối thông báo lại.
    if (explanation !== null || isBlocked) return

    setIsAsking(true)
    setNotice(null)

    try {
      const text = await recommendationApi.explain(item.itemId)
      // Model trả về chuỗi rỗng là một ca có thật (nghĩ hết ngân sách output).
      // Hiện một khối trống thì trông như giao diện hỏng.
      setExplanation(text || 'Chưa có lý do cụ thể cho gợi ý này.')
    } catch (error) {
      const { text, retryable } = toNotice(error)
      setNotice(text)
      if (!retryable) setIsBlocked(true)
    } finally {
      setIsAsking(false)
    }
  }

  return (
    <li className="ts-rec-slot">
      {showReason && (
        <div className="ts-rec-slot__reason">
          <ReasonChip reasonCode={item.reasonCode} />

          {canAsk && (
            <button
              type="button"
              className={`ts-rec-explain${isOpen ? ' is-open' : ''}`}
              onClick={() => void ask()}
              aria-expanded={isOpen}
            >
              <Icon name={isOpen ? 'chevron-up' : 'info'} size={13} />
              <span>Vì sao?</span>
            </button>
          )}

          {/* Neo vào hàng nhãn lý do, không vào cả ô: nhờ vậy nó luôn nằm ngay
              dưới nút vừa bấm, dù thẻ bên dưới cao bao nhiêu. */}
          {isOpen && (
            <div className="ts-rec-explain__popover">
              {isAsking && (
                <p className="ts-rec-explain__note ts-rec-explain__note--pending" role="status">
                  <Icon name="sparkles" size={13} />
                  <span>Đang hỏi AI…</span>
                </p>
              )}

              {!isAsking && explanation !== null && (
                <p className="ts-rec-explain__note">{explanation}</p>
              )}

              {!isAsking && notice !== null && (
                <p className="ts-rec-explain__note ts-rec-explain__note--error" role="alert">
                  {notice}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      <ProductCard
        product={item.product}
        variant="default"
        showSave={false}
        onOpen={onOpen}
        onAddToCart={onAddToCart}
      />
    </li>
  )
}
