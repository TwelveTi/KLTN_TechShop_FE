import { useState, type FormEvent } from 'react'
import { Icon } from '@shared/ui/Icon'
import { Button } from '@shared/ui/Button'

export interface WriteReviewFormValues {
  rating: number
  title: string
  content: string
}

export interface WriteReviewFormProps {
  initial?: { rating?: number; title?: string | null; content?: string | null }
  submitting?: boolean
  submitLabel?: string
  onSubmit: (values: WriteReviewFormValues) => void
  onCancel?: () => void
}

const MAX_CONTENT = 5000
const MAX_TITLE = 255

export function WriteReviewForm({
  initial,
  submitting = false,
  submitLabel = 'Submit review',
  onSubmit,
  onCancel,
}: WriteReviewFormProps) {
  const [rating, setRating] = useState<number>(initial?.rating ?? 0)
  const [hover, setHover] = useState<number>(0)
  const [title, setTitle] = useState<string>(initial?.title ?? '')
  const [content, setContent] = useState<string>(initial?.content ?? '')
  const [error, setError] = useState<string | null>(null)

  const activeRating = hover || rating

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (rating < 1) {
      setError('Please select a star rating.')
      return
    }
    setError(null)
    onSubmit({ rating, title: title.trim(), content: content.trim() })
  }

  return (
    <form className="ts-review-form" onSubmit={handleSubmit}>
      <div className="ts-review-form__row">
        <span className="ts-review-form__label">Your rating</span>
        <div
          className="ts-review-form__stars"
          role="radiogroup"
          aria-label="Select a rating from 1 to 5 stars"
          onMouseLeave={() => setHover(0)}
        >
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className={`ts-review-form__star ${star <= activeRating ? 'is-active' : ''}`}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHover(star)}
              aria-label={`${star} star${star === 1 ? '' : 's'}`}
              aria-pressed={rating === star}
            >
              <Icon
                name="star"
                size={26}
                fill={star <= activeRating ? 'currentColor' : 'none'}
                stroke="currentColor"
              />
            </button>
          ))}
          {rating > 0 && <span className="ts-review-form__rating-value">{rating}/5</span>}
        </div>
      </div>

      <div className="ts-review-form__field">
        <label className="ts-review-form__label" htmlFor="ts-review-title">
          Headline <span className="ts-review-form__optional">(optional)</span>
        </label>
        <input
          id="ts-review-title"
          type="text"
          className="ts-review-form__input"
          value={title}
          maxLength={MAX_TITLE}
          placeholder="Sum up your experience in a line"
          onChange={(event) => setTitle(event.target.value)}
        />
      </div>

      <div className="ts-review-form__field">
        <label className="ts-review-form__label" htmlFor="ts-review-content">
          Your review <span className="ts-review-form__optional">(optional)</span>
        </label>
        <textarea
          id="ts-review-content"
          className="ts-review-form__textarea"
          value={content}
          maxLength={MAX_CONTENT}
          rows={4}
          placeholder="What did you like or dislike? How did it perform for your use case?"
          onChange={(event) => setContent(event.target.value)}
        />
        <span className="ts-review-form__counter tabular-nums">
          {content.length}/{MAX_CONTENT}
        </span>
      </div>

      {error && <p className="ts-review-form__error">{error}</p>}

      <div className="ts-review-form__actions">
        <Button type="submit" variant="primary" size="md" disabled={submitting}>
          {submitting ? 'Saving…' : submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="secondary" size="md" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}
