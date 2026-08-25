import type { ReactNode } from 'react'
import { Icon } from './Icon'

export interface BreadcrumbItem {
  /**
   * Nội dung mắt xích. Nhận ReactNode để nơi gọi truyền thẳng một <Link> vào —
   * nhờ vậy component này (tầng 2) không cần biết gì về router (tầng 4).
   */
  label: ReactNode
  onClick?: () => void
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

export function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
  if (!items || items.length === 0) {
    return null
  }

  return (
    <nav className={`ts-breadcrumb ${className}`} aria-label="Breadcrumb">
      <ol className="ts-breadcrumb__list">
        {items.map((item, index) => {
          const isLast = index === items.length - 1

          return (
            <li key={`${item.label}-${index}`} className="ts-breadcrumb__item">
              {index > 0 && (
                <span className="ts-breadcrumb__separator" aria-hidden="true">
                  <Icon name="chevron-right" size={14} />
                </span>
              )}

              {isLast ? (
                <span className="ts-breadcrumb__current" aria-current="page">
                  {item.label}
                </span>
              ) : item.onClick ? (
                <button
                  type="button"
                  className="ts-breadcrumb__link ts-breadcrumb__link--btn"
                  onClick={item.onClick}
                >
                  {item.label}
                </button>
              ) : (
                <span className="ts-breadcrumb__text">{item.label}</span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
