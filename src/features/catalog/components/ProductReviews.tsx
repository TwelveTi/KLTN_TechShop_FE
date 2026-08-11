import { useMemo, useState } from 'react'
import { Icon } from '../../../shared/components/Icon'
import { Button } from '../../../shared/components/Button'
import { Avatar } from '../../../shared/components/Avatar'
import { StarRating } from './StarRating'
import { getProductReviews } from '../lib/mockReviews'
import type { ProductDetailData, ProductReview } from '../types'

export interface ProductReviewsProps {
  product: ProductDetailData
}

const PAGE_SIZE = 4

const formatReviewDate = (iso: string): string => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function ReviewCard({ review }: { review: ProductReview }) {
  return (
    <article className="ts-review-card">
      <div className="ts-review-card__head">
        <Avatar name={review.user} size="sm" />
        <div className="ts-review-card__who">
          <div className="ts-review-card__name-row">
            <span className="ts-review-card__name">{review.user}</span>
            {review.verifiedPurchase && (
              <span className="ts-review-card__verified">
                <Icon name="shield-check" size={13} />
                Verified purchase
              </span>
            )}
          </div>
          <div className="ts-review-card__meta">
            <StarRating value={review.rating} size={14} aria-label={`${review.rating} out of 5 stars`} />
            <span className="ts-review-card__date">{formatReviewDate(review.createdAt)}</span>
          </div>
        </div>
      </div>
      <p className="ts-review-card__text">{review.comment}</p>
    </article>
  )
}

export function ProductReviews({ product }: ProductReviewsProps) {
  const data = useMemo(() => getProductReviews(product), [product])
  const [visible, setVisible] = useState(PAGE_SIZE)

  const maxBucket = Math.max(1, ...data.distribution.map((b) => b.count))
  const shownReviews = data.reviews.slice(0, visible)
  const hasMore = visible < data.reviews.length

  return (
    <section className="ts-pdp-reviews" aria-label="Customer reviews and ratings">
      <h2 className="ts-pdp-reviews__title">Reviews &amp; Ratings</h2>

      <div className="ts-pdp-reviews__overview">
        {/* Aggregate score */}
        <div className="ts-review-score">
          <span className="ts-review-score__value tabular-nums">{data.average.toFixed(1)}</span>
          <span className="ts-review-score__outof">/ 5</span>
          <StarRating
            value={data.average}
            size={20}
            className="ts-review-score__stars"
            aria-label={`Average rating ${data.average.toFixed(1)} out of 5`}
          />
          <span className="ts-review-score__count tabular-nums">
            Based on {data.total.toLocaleString()} {data.total === 1 ? 'review' : 'reviews'}
          </span>
        </div>

        {/* Distribution 5 -> 1 */}
        <div className="ts-review-dist" aria-label="Rating distribution">
          {data.distribution.map((bucket) => {
            const pct = data.total > 0 ? Math.round((bucket.count / data.total) * 100) : 0
            return (
              <div key={bucket.stars} className="ts-review-dist__row">
                <span className="ts-review-dist__label tabular-nums">
                  {bucket.stars}
                  <Icon name="star" size={12} fill="currentColor" stroke="currentColor" className="ts-review-dist__star" />
                </span>
                <span className="ts-review-dist__bar">
                  <span
                    className="ts-review-dist__bar-fill"
                    style={{ width: `${(bucket.count / maxBucket) * 100}%` }}
                  />
                </span>
                <span className="ts-review-dist__pct tabular-nums">{pct}%</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Individual reviews */}
      <div className="ts-pdp-reviews__list">
        {shownReviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>

      {hasMore && (
        <div className="ts-pdp-reviews__more">
          <Button
            variant="secondary"
            size="md"
            onClick={() => setVisible((v) => v + PAGE_SIZE)}
            trailingIcon={<Icon name="chevron-down" size={16} />}
          >
            Load more reviews
          </Button>
        </div>
      )}
    </section>
  )
}
