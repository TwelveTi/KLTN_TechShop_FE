import { Icon, type IconName } from '../components/Icon'

export interface Department {
  name: string
  slug: string
  icon: IconName
}

export const DEPARTMENTS: Department[] = [
  { name: 'Laptops', slug: 'laptops', icon: 'laptop' },
  { name: 'Smartphones', slug: 'smartphones', icon: 'smartphone' },
  { name: 'Keyboards', slug: 'keyboards', icon: 'keyboard' },
  { name: 'Mice', slug: 'mice', icon: 'mouse' },
  { name: 'Audio', slug: 'audio', icon: 'headphones' },
  { name: 'Monitors', slug: 'monitors', icon: 'monitor' },
]

export interface DepartmentBarProps {
  onSelectCategory?: (categorySlug?: string) => void
  activeCategory?: string
  className?: string
}

export function DepartmentBar({
  onSelectCategory,
  activeCategory,
  className = '',
}: DepartmentBarProps) {
  return (
    <nav className={`ts-dept-bar ${className}`} aria-label="Shop departments">
      <div className="ts-dept-bar__container">
        <span className="ts-dept-bar__label">Shop</span>
        <div className="ts-dept-bar__track">
          {DEPARTMENTS.map((dept) => {
            const isActive = activeCategory === dept.slug
            return (
              <button
                type="button"
                key={dept.name}
                className={`ts-dept-bar__chip ${isActive ? 'is-active' : ''}`}
                onClick={() => onSelectCategory?.(dept.slug)}
              >
                <Icon name={dept.icon} size={16} />
                <span>{dept.name}</span>
              </button>
            )
          })}
        </div>
        <button
          type="button"
          className="ts-dept-bar__all"
          onClick={() => onSelectCategory?.()}
        >
          All products <Icon name="arrow-right" size={14} />
        </button>
      </div>
    </nav>
  )
}
