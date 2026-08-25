import type { IconName } from '@shared/ui/Icon'

/** Danh mục hiển thị trên thanh Shop. Tách khỏi component để file kia chỉ export component. */
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

