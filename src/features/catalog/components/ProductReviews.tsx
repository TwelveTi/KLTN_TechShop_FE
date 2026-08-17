import { useEffect, useState } from 'react'
import { Icon } from '../../../shared/components/Icon'
import { Button } from '../../../shared/components/Button'
import { Avatar } from '../../../shared/components/Avatar'
import { useToast } from '../../../shared/components/Toast'
import { StarRating } from './StarRating'
import { WriteReviewForm, type WriteReviewFormValues } from './WriteReviewForm'
import { getProductReviews } from '../lib/mockReviews'
import { reviewApi, type ReviewSummary } from '../api/reviewApi'
import type { AuthResult } from '../../auth/types'
import type { ProductDetailData, ProductReview } from '../types'

export interface ProductReviewsProps {
  product: ProductDetailData
  authResult?: AuthResult | null
  onSignIn?: () => void
}

const PAGE_SIZE = 5

const formatReviewDate = (iso: string): string => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function ReviewCard({
  review,
  isOwn,
  onEdit,
  onDelete,
}: {
  review: ProductReview
  isOwn?: boolean
  onEdit?: () => void
  onDelete?: () => void
}) {
  return (
    <article className={`ts-review-card ${isOwn ? 'ts-review-card--own' : ''}`}>
      <div className="ts-review-card__head">
        <Avatar name={review.user} src={review.avatarUrl ?? undefined} size="sm" />
        <div className="ts-review-card__who">
          <div className="ts-review-card__name-row">
            <span className="ts-review-card__name">{review.user}</span>
            {isOwn && <span className="ts-review-card__you">You</span>}
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

        {isOwn && (onEdit || onDelete) && (
          <div className="ts-review-card__actions">
            {onEdit && (
              <button type="button" className="ts-review-card__action" onClick={onEdit}>
                <Icon name="edit" size={14} />
                Edit
              </button>
            )}
            {onDelete && (
              <button type="button" className="ts-review-card__action ts-review-card__action--danger" onClick={onDelete}>
                <Icon name="trash" size={14} />
                Delete
              </button>
            )}
          </div>
        )}
      </div>

      {review.title && <h4 className="ts-review-card__headline">{review.title}</h4>}
      {review.comment && <p className="ts-review-card__text">{review.comment}</p>}
    </article>
  )
}

export function ProductReviews({ product, authResult, onSignIn }: ProductReviewsProps) {
  const { showToast } = useToast()
  const currentUserId = authResult?.user?.id

  const [summary, setSummary] = useState<ReviewSummary>({ average: 0, total: 0, distribution: [] })
  const [reviews, setReviews] = useState<ProductReview[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [usingMock, setUsingMock] = useState(false)

  const [composing, setComposing] = useState(false)
  const [editing, setEditing] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // ProductDetailData always carries a real id (set by catalogApi); the base
  // ProductItem type marks it optional, so coerce to a definite string here.
  const productId = product.id ?? ''

  const loadReviews = async () => {
    setLoading(true)
    try {
      const [summaryData, listData] = await Promise.all([
        reviewApi.getSummary(productId),
        reviewApi.getReviews(productId, { page: 1, limit: PAGE_SIZE }),
      ])
      setSummary(summaryData)
      setReviews(listData.items)
      setPage(1)
      setTotalPages(listData.pagination.totalPages || 1)
      setUsingMock(false)
    } catch {
      // Backend unavailable — fall back to deterministic sample data so the
      // section still renders (offline/demo mode). Writing is disabled here.
      const mock = getProductReviews(product)
      setSummary({ average: mock.average, total: mock.total, distribution: mock.distribution })
      setReviews(mock.reviews)
      setPage(1)
      setTotalPages(1)
      setUsingMock(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setComposing(false)
    setEditing(false)
    void loadReviews()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId])

  const handleLoadMore = async () => {
    if (usingMock) return
    const next = page + 1
    setLoadingMore(true)
    try {
      const listData = await reviewApi.getReviews(productId, { page: next, limit: PAGE_SIZE })
      setReviews((prev) => [...prev, ...listData.items])
      setPage(next)
      setTotalPages(listData.pagination.totalPages || next)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not load more reviews.'
      showToast(message, { variant: 'error' })
    } finally {
      setLoadingMore(false)
    }
  }

  const myReview = currentUserId ? reviews.find((r) => r.userId && r.userId === currentUserId) : undefined

  const handleCreate = async (values: WriteReviewFormValues) => {
    setSubmitting(true)
    try {
      await reviewApi.createReview(productId, {
        rating: values.rating,
        title: values.title || null,
        content: values.content || null,
      })
      showToast('Thanks! Your review has been posted.', { variant: 'success' })
      setComposing(false)
      await loadReviews()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not post your review.'
      showToast(message, { variant: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdate = async (values: WriteReviewFormValues) => {
    if (!myReview) return
    setSubmitting(true)
    try {
      await reviewApi.updateReview(myReview.id, {
        rating: values.rating,
        title: values.title || null,
        content: values.content || null,
      })
      showToast('Your review has been updated.', { variant: 'success' })
      setEditing(false)
      await loadReviews()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not update your review.'
      showToast(message, { variant: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!myReview) return
    if (!window.confirm('Delete your review? This cannot be undone.')) return
    try {
      await reviewApi.deleteReview(myReview.id)
      showToast('Your review has been removed.', { variant: 'info' })
      await loadReviews()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not delete your review.'
      showToast(message, { variant: 'error' })
    }
  }

  const maxBucket = Math.max(1, ...summary.distribution.map((b) => b.count))
  const listReviews = myReview ? reviews.filter((r) => r.id !== myReview.id) : reviews
  const hasMore = !usingMock && page < totalPages

  const renderWriteArea = () => {
    // Offline/sample mode: writing is not available without the backend.
    if (usingMock) {
      return (
        <p className="ts-pdp-reviews__note">
          <Icon name="info" size={14} /> Showing sample reviews — connect to the store to post your own.
        </p>
      )
    }

    if (!currentUserId) {
      return (
        <div className="ts-review-signin">
          <div>
            <h3 className="ts-review-signin__title">Share your experience</h3>
            <p className="ts-review-signin__desc">Sign in to write a review for this product.</p>
          </div>
          {onSignIn && (
            <Button variant="primary" size="md" onClick={onSignIn}>
              Sign in to review
            </Button>
          )}
        </div>
      )
    }

    if (editing && myReview) {
      return (
        <div className="ts-review-compose">
          <h3 className="ts-review-compose__title">Edit your review</h3>
          <WriteReviewForm
            initial={{ rating: myReview.rating, title: myReview.title, content: myReview.comment }}
            submitting={submitting}
            submitLabel="Update review"
            onSubmit={handleUpdate}
            onCancel={() => setEditing(false)}
          />
        </div>
      )
    }

    if (myReview) {
      // The user's own review is rendered as a highlighted card with actions.
      return null
    }

    if (composing) {
      return (
        <div className="ts-review-compose">
          <h3 className="ts-review-compose__title">Write a review</h3>
          <WriteReviewForm
            submitting={submitting}
            onSubmit={handleCreate}
            onCancel={() => setComposing(false)}
          />
        </div>
      )
    }

    return (
      <div className="ts-review-cta">
        <Button variant="primary" size="md" leadingIcon={<Icon name="edit" size={16} />} onClick={() => setComposing(true)}>
          Write a review
        </Button>
      </div>
    )
  }

  return (
    <section className="ts-pdp-reviews" aria-label="Customer reviews and ratings">
      <h2 className="ts-pdp-reviews__title">Reviews &amp; Ratings</h2>

      <div className="ts-pdp-reviews__overview">
        {/* Aggregate score */}
        <div className="ts-review-score">
          <span className="ts-review-score__value tabular-nums">{summary.average.toFixed(1)}</span>
          <span className="ts-review-score__outof">/ 5</span>
          <StarRating
            value={summary.average}
            size={20}
            className="ts-review-score__stars"
            aria-label={`Average rating ${summary.average.toFixed(1)} out of 5`}
          />
          <span className="ts-review-score__count tabular-nums">
            Based on {summary.total.toLocaleString()} {summary.total === 1 ? 'review' : 'reviews'}
          </span>
        </div>

        {/* Distribution 5 -> 1 */}
        <div className="ts-review-dist" aria-label="Rating distribution">
          {summary.distribution.map((bucket) => {
            const pct = summary.total > 0 ? Math.round((bucket.count / summary.total) * 100) : 0
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

      {/* Write / edit area */}
      {renderWriteArea()}

      {/* The current user's own review, highlighted with edit/delete actions. */}
      {myReview && !editing && (
        <div className="ts-pdp-reviews__own">
          <ReviewCard review={myReview} isOwn onEdit={() => setEditing(true)} onDelete={handleDelete} />
        </div>
      )}

      {/* Individual reviews */}
      {loading ? (
        <div className="ts-pdp-reviews__list" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="ts-skeleton" style={{ height: '96px', borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      ) : listReviews.length === 0 && !myReview ? (
        <p className="ts-pdp-reviews__empty">No reviews yet. Be the first to share your thoughts.</p>
      ) : (
        <div className="ts-pdp-reviews__list">
          {listReviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}

      {hasMore && (
        <div className="ts-pdp-reviews__more">
          <Button
            variant="secondary"
            size="md"
            onClick={handleLoadMore}
            disabled={loadingMore}
            trailingIcon={<Icon name="chevron-down" size={16} />}
          >
            {loadingMore ? 'Loading…' : 'Load more reviews'}
          </Button>
        </div>
      )}
    </section>
  )
}
