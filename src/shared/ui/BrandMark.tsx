import type { HTMLAttributes } from 'react'

export interface BrandMarkProps extends HTMLAttributes<HTMLSpanElement> {
  size?: 'sm' | 'md' | 'lg'
}

/**
 * Logo — THUẦN trình bày.
 *
 * v1 tự điều hướng bằng `pushState` cộng một `PopStateEvent` GIẢ để ép app
 * re-render: một component UI cấp thấp nhất điều khiển luồng cả ứng dụng.
 * Giờ nó chỉ vẽ; nơi gọi bọc nó trong `<Link>` nếu muốn bấm được.
 */
export function BrandMark({ size = 'md', className = '', ...rest }: BrandMarkProps) {
  const combined = ['ts-brandmark', `ts-brandmark--${size}`, className].filter(Boolean).join(' ')

  return (
    <span className={combined} {...rest}>
      <span className="ts-brandmark__logo" aria-hidden="true">
        TS
      </span>
      <span className="ts-brandmark__text">TechShop</span>
    </span>
  )
}
