import { Star } from 'lucide-react'

// Số sao đánh giá. Truyền onChange vào thì người dùng bấm chọn được.
export default function StarRating({ value = 0, onChange, size = 16 }) {
  const rounded = Math.round(value)

  // Chỉ đọc: một hình ảnh duy nhất kèm nhãn bằng chữ, không đọc rời từng sao.
  if (!onChange) {
    return (
      <span className="inline-flex items-center gap-0.5" aria-label={`${value.toFixed(1)} trên 5 sao`}>
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
          aria-label={`Chấm ${star} sao`}
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
