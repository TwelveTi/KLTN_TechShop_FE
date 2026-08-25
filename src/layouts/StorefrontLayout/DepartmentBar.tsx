import { Link } from '@core/router'
import { paths } from '@routes/paths'
import { Icon } from '@shared/ui/Icon'
import { DEPARTMENTS } from './departments'

export interface DepartmentBarProps {
  activeCategory?: string
  className?: string
}

// Tolerant category comparison so a chip highlights whether the active category
// arrived as the chip's own slug ("laptops"), the backend's real slug/name
// ("laptop"), or a localized variant. Strips accents + a trailing plural "s".
const normCategory = (value?: string): string =>
  (value || '')
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/s$/, '')

const departmentIsActive = (activeCategory?: string, slug?: string): boolean => {
  const a = normCategory(activeCategory)
  const b = normCategory(slug)
  return Boolean(a) && Boolean(b) && (a === b || a.includes(b) || b.includes(a))
}

export function DepartmentBar({ activeCategory, className = '' }: DepartmentBarProps) {
  return (
    <nav className={`ts-dept-bar ${className}`} aria-label="Shop departments">
      <div className="ts-dept-bar__container">
        <span className="ts-dept-bar__label">Shop</span>
        <div className="ts-dept-bar__track">
          {DEPARTMENTS.map((dept) => {
            const isActive = departmentIsActive(activeCategory, dept.slug)
            return (
              <Link
                key={dept.name}
                to={paths.catalog({ category: dept.slug })}
                className={`ts-dept-bar__chip ${isActive ? 'is-active' : ''}`}
              >
                <Icon name={dept.icon} size={16} />
                <span>{dept.name}</span>
              </Link>
            )
          })}
        </div>
        <Link to={paths.catalog()} className="ts-dept-bar__all">
          All products <Icon name="arrow-right" size={14} />
        </Link>
      </div>
    </nav>
  )
}
