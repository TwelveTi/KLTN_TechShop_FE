import type { Product } from '@domain/product'

/**
 * Từ vựng của recommender — do BACKEND định nghĩa, không phải FE suy đoán.
 *
 * Nguồn: `recommendationService.REASON_CODES` (README 6.4). Mỗi gợi ý mang mã
 * của THÀNH PHẦN THẮNG ĐIỂM, nên rail giải thích được chính nó thay vì nói
 * chung chung "dành cho bạn". Đây cũng là đầu vào của tính năng AI Explanation
 * (README 7) — chuỗi lý do đã có sẵn, AI chỉ diễn giải.
 */
export const REASON_CODES = [
  'MATCHES_YOUR_TASTE',
  'MATCHES_YOUR_SEARCH',
  'LIKE_WHAT_YOU_BOUGHT',
  'SIMILAR_TO_VIEWED',
  'POPULAR_NOW',
  'SIMILAR_TO_THIS',
] as const

export type ReasonCode = (typeof REASON_CODES)[number]

/** Ba mốc trên phễu, khớp `OUTCOMES` của backend. */
export type RecommendationOutcome = 'CLICK' | 'ADD_TO_CART' | 'PURCHASE'

export interface RecommendedItem {
  /**
   * Id của dòng `recommendation_items` để báo outcome về.
   *
   * `null` khi rail KHÔNG được backend lưu (khách chưa đăng nhập): không có
   * dòng nào để quy kết, và client không được bịa ra một id. Mọi nơi báo outcome
   * phải kiểm tra `null` trước.
   */
  itemId: string | null
  /** Vị trí 1-based do backend xếp — dùng khi báo outcome và khi đọc log. */
  rankPosition: number
  score: number
  reasonCode: ReasonCode
  product: Product
}

export interface RecommendationSet {
  items: RecommendedItem[]
  /**
   * Thuật toán đã sinh dải này: `hybrid` · `popularity` ·
   * `popularity-fallback` · hoặc tên một thành phần đơn lẻ khi ép `?strategy=`.
   */
  strategy: string
  /** `hybrid-v1`… — số đo trước và sau khi đổi công thức không so được với nhau. */
  algorithmVersion: string
  /**
   * Có thật là cá nhân hoá hay không.
   *
   * `false` cho khách chưa đăng nhập VÀ cho khách mới chưa có tín hiệu nào
   * (backend rơi về `popularity-fallback`). Rail đổi tiêu đề theo cờ này thay vì
   * hứa "dành riêng cho bạn" trên một danh sách bán chạy chung.
   */
  personalised: boolean
}
