import { Icon } from './Icon'

export interface BreadcrumbItem {
  label: string
  href?: string
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
              ) : item.href ? (
                <a href={item.href} className="ts-breadcrumb__link">
                  {item.label}
                </a>
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
