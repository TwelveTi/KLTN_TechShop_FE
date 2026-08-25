import { Icon, type IconName } from '@shared/ui/Icon'
import type { CatalogCategory } from '../types'

export interface CategoryPillsProps {
  categories: CatalogCategory[]
  selectedSlug: string
  onSelectCategory: (slug: string) => void
}

export function CategoryPills({
  categories,
  selectedSlug,
  onSelectCategory,
}: CategoryPillsProps) {
  const getCategoryIcon = (iconName?: string, slug?: string): IconName => {
    if (iconName) return iconName as IconName
    const lower = (slug || '').toLowerCase()
    if (lower.includes('laptop')) return 'laptop'
    if (lower.includes('phone') || lower.includes('smart')) return 'smartphone'
    if (lower.includes('key')) return 'keyboard'
    if (lower.includes('mouse') || lower.includes('mice')) return 'mouse'
    if (lower.includes('audio') || lower.includes('sound') || lower.includes('head')) return 'headphones'
    if (lower.includes('monitor') || lower.includes('display')) return 'monitor'
    if (lower.includes('component') || lower.includes('pc') || lower.includes('cpu')) return 'cpu'
    return 'package'
  }

  return (
    <nav className="ts-category-pills" aria-label="Quick Category Switch">
      <div className="ts-category-pills__track">
        {categories.map((cat) => {
          const isActive = (selectedSlug === cat.slug) || (!selectedSlug && cat.slug === 'all')

          return (
            <button
              type="button"
              key={cat.id}
              className={`ts-category-pills__btn ${isActive ? 'is-active' : ''}`}
              onClick={() => onSelectCategory(cat.slug)}
              aria-pressed={isActive}
            >
              <Icon name={getCategoryIcon(cat.icon, cat.slug)} size={16} className="ts-category-pills__icon" />
              <span className="ts-category-pills__name">{cat.name}</span>
              {cat.count !== undefined && (
                <span className="ts-category-pills__count tabular-nums">{cat.count}</span>
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
