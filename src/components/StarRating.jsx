import { Star } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'

// Số sao đánh giá. Truyền onChange vào thì người dùng bấm chọn được.
export default function StarRating({ value = 0, onChange, size = 16 }) {
  const { t } = useLanguage()
  const rounded = Math.round(value)

  // Chỉ đọc: một hình ảnh duy nhất kèm nhãn bằng chữ, không đọc rời từng sao.
  if (!onChange) {
    return (
      <span
        className="inline-flex items-center gap-0.5"
        aria-label={t('{value} out of 5 stars', { value: value.toFixed(1) })}
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={size}
            aria-hidden
            className={star <= rounded ? 'fill-warning text-warning' : 'text-line-strong'}
          />
        ))}
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          aria-label={t(star === 1 ? 'Rate {star} star' : 'Rate {star} stars', { star })}
          aria-pressed={star === value}
          className="rounded-xs p-0.5"
        >
          <Star
            size={size}
            aria-hidden
            className={star <= rounded ? 'fill-warning text-warning' : 'text-line-strong'}
          />
        </button>
      ))}
    </span>
  )
}
