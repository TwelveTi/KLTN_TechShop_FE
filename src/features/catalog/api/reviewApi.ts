import { apiClient } from '../../../shared/api/apiClient'
import type { ApiResponse } from '../../../shared/types/api'
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

async function parse<T>(response: Response): Promise<T> {
  const body = (await response.json().catch(() => null)) as ApiResponse<T> | null
  if (!response.ok || body?.data === undefined || body?.data === null) {
    throw new Error(body?.message || 'Review request failed. Please try again.')
  }
  return body.data
}

export const reviewApi = {
  async getReviews(productId: string, opts: { page?: number; limit?: number } = {}): Promise<ReviewListResult> {
    const query = new URLSearchParams()
    query.set('page', String(Math.max(1, opts.page || 1)))
    query.set('limit', String(Math.max(1, opts.limit || 5)))

    const response = await apiClient(`/products/${encodeURIComponent(productId)}/reviews?${query.toString()}`)
    const data = await parse<ServerReviewList>(response)
    return {
      items: (data.items || []).map(mapReview),
      pagination: data.pagination,
    }
  },

  async getSummary(productId: string): Promise<ReviewSummary> {
    const response = await apiClient(`/products/${encodeURIComponent(productId)}/reviews/summary`)
    const data = await parse<ServerReviewSummary>(response)
    return mapSummary(data)
  },

  async createReview(productId: string, input: ReviewInput): Promise<ProductReview> {
    const response = await apiClient(`/products/${encodeURIComponent(productId)}/reviews`, {
      method: 'POST',
      auth: true,
      body: JSON.stringify(input),
    })
    return mapReview(await parse<ServerReview>(response))
  },

  async updateReview(reviewId: string, input: ReviewInput): Promise<ProductReview> {
    const response = await apiClient(`/reviews/${encodeURIComponent(reviewId)}`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify(input),
    })
    return mapReview(await parse<ServerReview>(response))
  },

  async deleteReview(reviewId: string): Promise<void> {
    const response = await apiClient(`/reviews/${encodeURIComponent(reviewId)}`, {
      method: 'DELETE',
      auth: true,
    })
    // Delete returns { data: null }; only surface transport/status errors.
    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as ApiResponse<null> | null
      throw new Error(body?.message || 'Could not delete your review.')
    }
  },
}
