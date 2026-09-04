import { http } from '@core/http'
import { visitorHeaders } from '@core/identity'
import { withQuery } from '@shared/utils/url'
import type { RecommendationOutcome, RecommendationSet } from '../types'
import type { RecommendationSetDto } from './dto'
import { toRecommendationSet } from './mappers'

/**
 * Recommendation API — CHỈ endpoint và tham số.
 *
 * Hai ghi chú về `auth: true` trên các lời gọi đọc:
 *
 *  1. Nó cần thiết. `/recommendations` cá nhân hoá dựa trên `req.user`, nên
 *     không gửi token là nhận về danh sách bán chạy chung.
 *  2. Nó KHÔNG kích hoạt được refresh token. Backend dùng `optionalAuth`, và
 *     middleware đó cố tình không bao giờ trả 401 — token hết hạn được coi là
 *     "khách vãng lai". Nghĩa là httpClient không có 401 nào để bắt, và rail âm
 *     thầm hạ xuống popularity. Trong thực tế `AuthProvider` đã refresh lúc
 *     khởi động nên cửa sổ này hẹp; đây là một đánh đổi đã biết, không phải một
 *     chỗ bị bỏ sót.
 */

export const recommendationApi = {
  /** Dải cá nhân hoá. `strategy` chỉ dùng khi đo lường, giao diện không truyền. */
  async getForMe({ limit = 12, strategy }: { limit?: number; strategy?: string } = {}): Promise<RecommendationSet> {
    const dto = await http.get<RecommendationSetDto | null>(
      withQuery('/recommendations', { limit, strategy }),
      { auth: true, headers: visitorHeaders() },
    )
    return toRecommendationSet(dto)
  },

  /** Dải "sản phẩm tương tự" của một trang chi tiết, đọc từ ma trận similarity. */
  async getSimilarTo(productId: string, { limit = 8 }: { limit?: number } = {}): Promise<RecommendationSet> {
    const dto = await http.get<RecommendationSetDto | null>(
      withQuery(`/recommendations/products/${encodeURIComponent(productId)}/similar`, { limit }),
      { auth: true, headers: visitorHeaders() },
    )
    return toRecommendationSet(dto)
  },

  /**
   * Đóng vòng lặp đo lường: một gợi ý ĐÃ HIỆN được bấm / thêm giỏ / mua.
   *
   * Đây là nguyên liệu thô của `GET /admin/recommendations/stats` (CTR,
   * conversion) — tức là bảng số của chương Đánh giá. Không có lời gọi này thì
   * `clickedAt` mãi mãi NULL và mọi tỉ lệ đều bằng 0.
   */
  recordOutcome(itemId: string, outcome: RecommendationOutcome): Promise<unknown> {
    return http.post(
      `/recommendations/items/${encodeURIComponent(itemId)}/outcome`,
      { outcome },
      { auth: true, headers: visitorHeaders() },
    )
  },

  /**
   * Ghi tín hiệu `CLICK_RECOMMENDATION` vào log hành vi.
   *
   * Khác `recordOutcome` ở MỤC ĐÍCH, nên phải gọi cả hai:
   *   - `recordOutcome` cập nhật đúng dòng gợi ý đã sinh ra cú bấm → dùng để ĐO.
   *   - endpoint này thêm một sự kiện vào `user_behaviors` → dùng để HỌC, nó có
   *     trọng số 2 trong `UserPreferenceProfile`.
   *
   * `CLICK_RECOMMENDATION` là một trong hai loại backend cho client tự báo
   * (`CLIENT_REPORTABLE_TYPES`), vì server không thể tự thấy cú bấm này. Trước
   * khi có rail, nó là một tín hiệu được thiết kế xong mà chưa bao giờ có dữ liệu.
   *
   * TODO: khi feature behavior tracking đầy đủ ra đời (FAVORITE, batch flush),
   * chuyển lời gọi này sang đó và để rail chỉ tiêu thụ nó.
   */
  reportRecommendationClick(productId: string): Promise<unknown> {
    return http.post(
      '/behaviors',
      { behaviorType: 'CLICK_RECOMMENDATION', productId },
      { auth: true, headers: visitorHeaders() },
    )
  },
}
