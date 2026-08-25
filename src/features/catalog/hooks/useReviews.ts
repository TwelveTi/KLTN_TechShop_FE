import { useInvalidate, useMutation, useQuery } from '@core/query'
import { reviewApi, type ReviewInput } from '../api/reviewApi'
import { catalogKeys } from '../api/queryKeys'

/**
 * Đánh giá sản phẩm.
 *
 * Không còn phương án dự phòng bằng dữ liệu giả: v1 khi API lỗi sẽ hiển thị
 * đánh giá 5 sao của những người không tồn tại ("Sarah Chen", "David Okafor")
 * cho một sản phẩm thương mại thật, đồng thời che lỗi khỏi monitoring. Giờ lỗi
 * được hiển thị trung thực kèm nút thử lại.
 */

const REVIEWS_STALE_MS = 60_000

export function useReviewSummary(productId: string) {
  return useQuery(catalogKeys.reviewSummary(productId), () => reviewApi.getSummary(productId), {
    staleTime: REVIEWS_STALE_MS,
    enabled: Boolean(productId),
  })
}

/**
 * Danh sách đánh giá.
 *
 * Khoá theo `limit` chứ không theo `page`: giao diện là nút "Load more" (nối
 * thêm), nên xin một danh sách dài hơn cho ra đúng ngữ nghĩa đó và vẫn dùng
 * được cache khi người dùng quay lại.
 */
export function useReviews(productId: string, limit: number) {
  return useQuery(
    catalogKeys.reviews(productId, limit),
    () => reviewApi.getReviews(productId, { page: 1, limit }),
    { staleTime: REVIEWS_STALE_MS, enabled: Boolean(productId) },
  )
}

/** Vô hiệu cả danh sách VÀ phần tóm tắt — thêm một đánh giá làm đổi cả hai. */
function reviewInvalidations(productId: string) {
  return [catalogKeys.reviews(productId, 0).slice(0, 3), catalogKeys.product(productId)]
}

export function useSaveReview(productId: string) {
  const invalidate = useInvalidate()
  return useMutation(
    (reviewId: string | null, input: ReviewInput) =>
      reviewId ? reviewApi.updateReview(reviewId, input) : reviewApi.createReview(productId, input),
    {
      onSuccess: () => {
        for (const key of reviewInvalidations(productId)) invalidate(key)
      },
    },
  )
}

export function useDeleteReview(productId: string) {
  const invalidate = useInvalidate()
  return useMutation((reviewId: string) => reviewApi.deleteReview(reviewId), {
    onSuccess: () => {
      for (const key of reviewInvalidations(productId)) invalidate(key)
    },
  })
}
