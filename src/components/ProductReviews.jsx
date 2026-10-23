import { useEffect, useState } from 'react'
import { MessageSquareOff } from 'lucide-react'
import reviewApi from '../api/reviewApi'
import Pagination from './Pagination'
import StarRating from './StarRating'
import Alert from './ui/Alert'
import Avatar from './ui/Avatar'
import Badge from './ui/Badge'
import Button, { LinkButton } from './ui/Button'
import EmptyState from './ui/EmptyState'
import Input from './ui/Input'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { formatDate } from '../utils/format'

// Phần đánh giá ở cuối trang chi tiết sản phẩm.
export default function ProductReviews({ productId }) {
  const { isLoggedIn, user } = useAuth()
  const { t } = useLanguage()

  const [reviews, setReviews] = useState([])
  const [summary, setSummary] = useState(null)
  const [pagination, setPagination] = useState(null)
  const [page, setPage] = useState(1)

  const [rating, setRating] = useState(5)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  // Id review đang sửa; null là đang viết mới.
  const [editingId, setEditingId] = useState(null)
  // Tăng số này để tải lại danh sách sau khi viết/xoá review.
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    async function loadReviews() {
      try {
        const [list, sum] = await Promise.all([
          reviewApi.getReviews(productId, page),
          reviewApi.getSummary(productId),
        ])
        setReviews(list.items || [])
        setPagination(list.pagination)
        setSummary(sum)
      } catch {
        setReviews([])
      }
    }
    loadReviews()
  }, [productId, page, reloadKey])

  const reloadReviews = () => setReloadKey((key) => key + 1)

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setFormError('')
    try {
      if (editingId) await reviewApi.updateReview(editingId, { rating, title, content })
      else await reviewApi.createReview(productId, { rating, title, content })
      resetForm()
      setPage(1)
      reloadReviews()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  function resetForm() {
    setEditingId(null)
    setTitle('')
    setContent('')
    setRating(5)
    setFormError('')
  }

  // Đổ review của mình vào form để sửa.
  function startEdit(review) {
    setEditingId(review.id)
    setRating(review.rating)
    setTitle(review.title || '')
    setContent(review.content || '')
    setFormError('')
  }

  async function handleDelete(reviewId) {
    if (!confirm(t('Delete this review?'))) return
    try {
      await reviewApi.deleteReview(reviewId)
      resetForm()
      reloadReviews()
    } catch (err) {
      setFormError(err.message)
    }
  }

  const total = summary?.totalReviews || 0
  // Mỗi người một review cho một sản phẩm, nên đã viết rồi thì ẩn form thay vì để gửi rồi mới báo lỗi.
  const hasMyReview = Boolean(user) && reviews.some((review) => review.user?.id === user.id)

  return (
    <section className="mt-16">
      <h2 className="text-h2">{t('Customer reviews')}</h2>

      <div className="mt-6 grid gap-8 lg:grid-cols-[320px_1fr]">
        <div className="space-y-6">
          {summary && total > 0 && (
            <div className="rounded-md border border-line bg-surface p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <p className="tabular text-display leading-none text-heading">
                  {summary.averageRating.toFixed(1)}
                </p>
                <div>
                  <StarRating value={summary.averageRating} />
                  <p className="tabular mt-1 text-sm text-muted">
                    {t(total === 1 ? '{count} review' : '{count} reviews', { count: total })}
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-1.5">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = summary.distribution?.[star] || 0
                  const percent = total ? (count / total) * 100 : 0
                  return (
                    <div key={star} className="flex items-center gap-2 text-caption">
                      <span className="tabular w-8 text-muted">{star} ★</span>
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-sunken">
                        <div className="h-full bg-warning" style={{ width: `${percent}%` }} />
                      </div>
                      <span className="tabular w-6 text-right text-faint">{count}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {isLoggedIn && hasMyReview && !editingId ? (
            <div className="rounded-md border border-line bg-surface p-6 text-sm text-muted shadow-sm">
              {t('You have reviewed this product. Use Edit on your review to change it.')}
            </div>
          ) : isLoggedIn ? (
            <form
              onSubmit={handleSubmit}
              className="space-y-4 rounded-md border border-line bg-surface p-6 shadow-sm"
            >
              <p className="text-h4">{editingId ? t('Edit your review') : t('Write your review')}</p>

              <div>
                <span className="mb-1.5 block text-sm font-medium text-heading">{t('Your rating')}</span>
                <StarRating value={rating} onChange={setRating} size={24} />
              </div>

              <Input
                label={t('Title')}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder={t('Sum it up in one line')}
              />

              <Input
                as="textarea"
                rows={4}
                label={t('Review')}
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder={t('How has this product worked for you?')}
              />

              {formError && <Alert>{formError}</Alert>}

              <Button type="submit" variant="primary" isLoading={submitting} fullWidth>
                {editingId ? t('Save changes') : t('Submit review')}
              </Button>
              {editingId && (
                <Button type="button" variant="ghost" onClick={resetForm} fullWidth>
                  {t('Cancel')}
                </Button>
              )}
            </form>
          ) : (
            <div className="rounded-md border border-line bg-surface p-6 text-sm shadow-sm">
              <p className="text-muted">{t('Sign in to review this product.')}</p>
              <LinkButton to="/login" variant="secondary" size="sm" className="mt-3">
                {t('Sign in')}
              </LinkButton>
            </div>
          )}
        </div>

        <div>
          {reviews.length === 0 ? (
            <EmptyState
              icon={MessageSquareOff}
              title={t('No reviews yet')}
              description={t('Be the first to share what you think of this product.')}
            />
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <article key={review.id} className="rounded-md border border-line bg-surface p-6 shadow-sm">
                  <div className="flex items-start gap-3">
                    <Avatar name={review.user?.name} src={review.user?.avatarUrl} />

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-heading">
                          {review.user?.name || t('Customer')}
                        </span>
                        {review.verifiedPurchase && <Badge tone="success">{t('Verified purchase')}</Badge>}
                        <span className="ml-auto text-caption text-faint">
                          {formatDate(review.createdAt)}
                        </span>
                      </div>

                      <div className="mt-1.5">
                        <StarRating value={review.rating} size={14} />
                      </div>

                      {review.title && (
                        <p className="mt-2 font-medium text-heading">{review.title}</p>
                      )}
                      <p className="mt-1 text-body">{review.content}</p>

                      {user && review.user?.id === user.id && (
                        <div className="mt-2 flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => startEdit(review)}>
                            {t('Edit')}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(review.id)}
                            className="!text-danger-strong"
                          >
                            {t('Delete my review')}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              ))}

              <Pagination page={page} totalPages={pagination?.totalPages} onChange={setPage} />
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
