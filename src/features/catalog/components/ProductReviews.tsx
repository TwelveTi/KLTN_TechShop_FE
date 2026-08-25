import { useState } from 'react'
import { formatCount } from '@shared/utils/number'
import { Icon } from '@shared/ui/Icon'
import { Button } from '@shared/ui/Button'
import { Avatar } from '@shared/ui/Avatar'
import { useToast } from '@shared/ui/useToast'
import { StarRating } from './StarRating'
import { WriteReviewForm, type WriteReviewFormValues } from './WriteReviewForm'
import { toErrorMessage } from '@core/http'
import { formatDate } from '@shared/utils/date'
import { useDeleteReview, useReviewSummary, useReviews, useSaveReview } from '../hooks/useReviews'
import type { AuthResult } from '@features/auth'
import type { ProductDetail, ProductReview } from '../types'

export interface ProductReviewsProps {
  product: ProductDetail
  authResult?: AuthResult | null
  onSignIn?: () => void
}

const PAGE_SIZE = 5


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
            <span className="ts-review-card__date">{formatDate(review.createdAt)}</span>
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

  // Số TRANG ĐANG HIỂN THỊ, không phải trang hiện tại: "Load more" là nối thêm,
  // nên ta xin một danh sách dài hơn thay vì trang kế tiếp — hợp với cache khoá
  // theo (productId, limit) và giữ được toàn bộ danh sách đã tải.
  const [pagesShown, setPagesShown] = useState(1)
  const [composing, setComposing] = useState(false)
  const [editing, setEditing] = useState(false)

  // ProductDetail luôn mang id thật (do mapper đặt); kiểu Product gốc để id là
  // tuỳ chọn nên ép về chuỗi xác định ở đây.
  const productId = product.id ?? ''

  const summaryQuery = useReviewSummary(productId)
  const listQuery = useReviews(productId, pagesShown * PAGE_SIZE)
  const saveReview = useSaveReview(productId)
  const deleteReview = useDeleteReview(productId)

  const summary = summaryQuery.data ?? { average: 0, total: 0, distribution: [] }
  const reviews = listQuery.data?.items ?? []
  const totalReviews = listQuery.data?.pagination.total ?? 0
  const loading = summaryQuery.isLoading || listQuery.isLoading
  const loadError = summaryQuery.error ?? listQuery.error
  const submitting = saveReview.isPending

  // Không cần effect reset khi đổi sản phẩm: ProductDetailScreen truyền
  // `key={product.id}`, nên React tạo lại component với state ban đầu.

  const myReview = currentUserId ? reviews.find((r) => r.userId && r.userId === currentUserId) : undefined

  const handleCreate = async (values: WriteReviewFormValues) => {
    try {
      await saveReview.mutate(null, {
        rating: values.rating,
        title: values.title || null,
        content: values.content || null,
      })
      showToast('Thanks! Your review has been posted.', { variant: 'success' })
      setComposing(false)
    } catch (error) {
      showToast(toErrorMessage(error, 'Could not post your review.'), { variant: 'error' })
    }
  }

  const handleUpdate = async (values: WriteReviewFormValues) => {
    if (!myReview) return
    try {
      await saveReview.mutate(myReview.id, {
        rating: values.rating,
        title: values.title || null,
        content: values.content || null,
      })
      showToast('Your review has been updated.', { variant: 'success' })
      setEditing(false)
    } catch (error) {
      showToast(toErrorMessage(error, 'Could not update your review.'), { variant: 'error' })
    }
  }

  const handleDelete = async () => {
    if (!myReview) return
    if (!window.confirm('Delete your review? This cannot be undone.')) return
    try {
      await deleteReview.mutate(myReview.id)
      showToast('Your review has been removed.', { variant: 'info' })
    } catch (error) {
      showToast(toErrorMessage(error, 'Could not delete your review.'), { variant: 'error' })
    }
  }

  const maxBucket = Math.max(1, ...summary.distribution.map((b) => b.count))
  const listReviews = myReview ? reviews.filter((r) => r.id !== myReview.id) : reviews
  const hasMore = reviews.length < totalReviews

  // Chỉ tăng số trang hiển thị — hook tự xin danh sách dài hơn, và quay lại
  // độ dài cũ thì lấy từ cache.
  const handleLoadMore = () => setPagesShown((shown) => shown + 1)

  const renderWriteArea = () => {
    // Không tải được đánh giá: nói thật, không thay bằng dữ liệu giả.
    if (loadError) {
      return (
        <div className="ts-review-signin" role="alert">
          <div>
            <h3 className="ts-review-signin__title">Reviews are unavailable right now</h3>
            <p className="ts-review-signin__desc">
              {toErrorMessage(loadError, 'We could not load reviews for this product.')}
            </p>
          </div>
          <Button variant="secondary" size="md" onClick={() => void listQuery.refetch()}>
            Try again
          </Button>
        </div>
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
            Based on {formatCount(summary.total)} {summary.total === 1 ? 'review' : 'reviews'}
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
            disabled={listQuery.isFetching}
            trailingIcon={<Icon name="chevron-down" size={16} />}
          >
            {listQuery.isFetching ? 'Loading…' : 'Load more reviews'}
          </Button>
        </div>
      )}
    </section>
  )
}
