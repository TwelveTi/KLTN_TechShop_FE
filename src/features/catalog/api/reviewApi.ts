import { http } from '@core/http'
import type { ProductReview, ProductReviewsData, ReviewDistributionBucket } from '../types'

/**
 * Review API client. Talks to the backend review endpoints and maps the payload
 * onto the `ProductReview` / `ProductReviewsData` shapes the review UI consumes.
 *
 *   GET    /products/:productId/reviews          (public, paginated)
 *   GET    /products/:productId/reviews/summary   (public)
 *   POST   /products/:productId/reviews           (auth)
 *   PATCH  /reviews/:reviewId                      (auth, own review)
 *   DELETE /reviews/:reviewId                      (auth, own review)
 */

interface ServerReviewUser {
  id: string
  name: string
  avatarUrl: string | null
}

interface ServerReview {
  id: string
  productId: string
  rating: number
  title: string | null
  content: string | null
  verifiedPurchase: boolean
  createdAt: string
  updatedAt: string
  user: ServerReviewUser | null
}

interface ServerReviewList {
  items: ServerReview[]
  pagination: { total: number; page: number; limit: number; totalPages: number }
}

interface ServerReviewSummary {
  averageRating: number
  totalReviews: number
  distribution: Record<'1' | '2' | '3' | '4' | '5', number>
}

export interface ReviewListResult {
  items: ProductReview[]
  pagination: { total: number; page: number; limit: number; totalPages: number }
}

export type ReviewSummary = Pick<ProductReviewsData, 'average' | 'total' | 'distribution'>

export interface ReviewInput {
  rating: number
  title?: string | null
  content?: string | null
}

function mapReview(review: ServerReview): ProductReview {
  return {
    id: review.id,
    user: review.user?.name ?? 'Anonymous',
    userId: review.user?.id,
    avatarUrl: review.user?.avatarUrl ?? null,
    rating: review.rating,
    title: review.title,
    comment: review.content ?? '',
    verifiedPurchase: Boolean(review.verifiedPurchase),
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
  }
}

function mapSummary(summary: ServerReviewSummary): ReviewSummary {
  const distribution: ReviewDistributionBucket[] = ([5, 4, 3, 2, 1] as const).map((stars) => ({
    stars,
    count: Number(summary.distribution?.[String(stars) as '1' | '2' | '3' | '4' | '5'] || 0),
  }))

  return {
    average: Number(summary.averageRating) || 0,
    total: Number(summary.totalReviews) || 0,
    distribution,
  }
}

export const reviewApi = {
  async getReviews(productId: string, opts: { page?: number; limit?: number } = {}): Promise<ReviewListResult> {
    const query = new URLSearchParams({
      page: String(Math.max(1, opts.page || 1)),
      limit: String(Math.max(1, opts.limit || 5)),
    })
    const data = await http.get<ServerReviewList>(
      `/products/${encodeURIComponent(productId)}/reviews?${query}`,
    )
    return {
      items: (data.items || []).map(mapReview),
      pagination: data.pagination,
    }
  },

  async getSummary(productId: string): Promise<ReviewSummary> {
    const data = await http.get<ServerReviewSummary>(
      `/products/${encodeURIComponent(productId)}/reviews/summary`,
    )
    return mapSummary(data)
  },

  async createReview(productId: string, input: ReviewInput): Promise<ProductReview> {
    const data = await http.post<ServerReview>(
      `/products/${encodeURIComponent(productId)}/reviews`,
      input,
      { auth: true },
    )
    return mapReview(data)
  },

  async updateReview(reviewId: string, input: ReviewInput): Promise<ProductReview> {
    const data = await http.patch<ServerReview>(
      `/reviews/${encodeURIComponent(reviewId)}`,
      input,
      { auth: true },
    )
    return mapReview(data)
  },

  async deleteReview(reviewId: string): Promise<void> {
    await http.del<null>(`/reviews/${encodeURIComponent(reviewId)}`, { auth: true })
  },
}
