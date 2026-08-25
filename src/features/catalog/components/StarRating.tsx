import { Icon } from '@shared/ui/Icon'

export interface StarRatingProps {
  /** Rating value, may be fractional (e.g. 4.8). */
  value: number
  max?: number
  size?: number
  className?: string
  'aria-label'?: string
}

/**
 * Accessible star rating. Renders an empty (muted) row of stars with a gold,
 * width-clipped overlay so fractional ratings (4.8) display precisely.
 */
export function StarRating({
  value,
  max = 5,
  size = 16,
  className = '',
  'aria-label': ariaLabel,
}: StarRatingProps) {
  const clamped = Math.max(0, Math.min(max, value))
  const pct = (clamped / max) * 100
  const stars = Array.from({ length: max })

  return (
    <span
      className={`ts-star-rating ${className}`}
      role="img"
      aria-label={ariaLabel || `${clamped} out of ${max} stars`}
      style={{ ['--ts-star-size' as string]: `${size}px` }}
    >
      <span className="ts-star-rating__track" aria-hidden="true">
        {stars.map((_, i) => (
          <Icon key={`bg-${i}`} name="star" size={size} className="ts-star-rating__star" />
        ))}
      </span>
      <span className="ts-star-rating__fill" style={{ width: `${pct}%` }} aria-hidden="true">
        {stars.map((_, i) => (
          <Icon
            key={`fg-${i}`}
            name="star"
            size={size}
            className="ts-star-rating__star"
            fill="currentColor"
            stroke="currentColor"
          />
        ))}
      </span>
    </span>
  )
}
