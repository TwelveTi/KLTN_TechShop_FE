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
import { formatDate } from '../utils/format'

// Phần đánh giá ở cuối trang chi tiết sản phẩm.
export default function ProductReviews({ productId }) {
  const { isLoggedIn, user } = useAuth()

  const [reviews, setReviews] = useState([])
  const [summary, setSummary] = useState(null)
  const [pagination, setPagination] = useState(null)
  const [page, setPage] = useState(1)

  const [rating, setRating] = useState(5)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    loadReviews()
  }, [productId, page])

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

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setFormError('')
    try {
      await reviewApi.createReview(productId, { rating, title, content })
      setTitle('')
      setContent('')
      setRating(5)
      setPage(1)
      loadReviews()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(reviewId) {
    if (!confirm('Xoá đánh giá này?')) return
    try {
      await reviewApi.deleteReview(reviewId)
      loadReviews()
    } catch (err) {
      setFormError(err.message)
    }
  }

  const total = summary?.totalReviews || 0

  return (
    <section className="mt-16">
      <h2 className="text-h2">Đánh giá từ người mua</h2>

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
                  <p className="tabular mt-1 text-sm text-muted">{total} đánh giá</p>
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

          {isLoggedIn ? (
            <form
              onSubmit={handleSubmit}
              className="space-y-4 rounded-md border border-line bg-surface p-6 shadow-sm"
            >
              <p className="text-h4">Viết đánh giá của bạn</p>

              <div>
                <span className="mb-1.5 block text-sm font-medium text-heading">Chấm điểm</span>
                <StarRating value={rating} onChange={setRating} size={24} />
              </div>

              <Input
                label="Tiêu đề"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Tóm tắt trong một câu"
              />

              <Input
                as="textarea"
                rows={4}
                label="Nhận xét"
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder="Bạn dùng sản phẩm này thế nào?"
              />

              {formError && <Alert>{formError}</Alert>}

              <Button type="submit" variant="primary" isLoading={submitting} fullWidth>
                Gửi đánh giá
              </Button>
            </form>
          ) : (
            <div className="rounded-md border border-line bg-surface p-6 text-sm shadow-sm">
              <p className="text-muted">Đăng nhập để viết đánh giá cho sản phẩm này.</p>
              <LinkButton to="/login" variant="secondary" size="sm" className="mt-3">
                Đăng nhập
              </LinkButton>
            </div>
          )}
        </div>

        <div>
          {reviews.length === 0 ? (
            <EmptyState
              icon={MessageSquareOff}
              title="Chưa có đánh giá nào"
              description="Hãy là người đầu tiên chia sẻ cảm nhận về sản phẩm này."
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
                          {review.user?.name || 'Khách hàng'}
                        </span>
                        {review.verifiedPurchase && <Badge tone="success">Đã mua hàng</Badge>}
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(review.id)}
                          className="mt-2 !text-danger-strong"
                        >
                          Xoá đánh giá của tôi
                        </Button>
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
