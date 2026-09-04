/**
 * PUBLIC API của feature `recommendations`.
 *
 * Bề mặt cố ý chỉ có hai component. Trang tiêu thụ gợi ý bằng MỘT dòng và không
 * biết gì về `/recommendations`, về `X-Session-Id`, hay về việc outcome được báo
 * lại như thế nào — toàn bộ chuyện đó thuộc feature này.
 *
 * Hook và api KHÔNG được export: chưa có nơi nào ngoài feature cần chúng, và một
 * bề mặt nhỏ là thứ giữ cho việc đổi cách đo lường về sau chỉ là việc nội bộ.
 */
export { PersonalRecommendationRail } from './components/PersonalRecommendationRail'
export { SimilarProductsRail } from './components/SimilarProductsRail'
export type { ReasonCode, RecommendationSet, RecommendedItem } from './types'
