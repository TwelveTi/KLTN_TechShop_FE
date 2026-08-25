import { removeDiacritics } from '@shared/utils/text'
import type { CatalogCategory } from '../types'

/**
 * Khớp token danh mục.
 *
 * Thanh department ở header dùng những token "thân thiện" (`laptops`) mà không
 * thể biết slug thật của backend (`laptop`). Nhóm hàm này bắc cầu giữa hai bên.
 * Tách khỏi `catalogApi` vì đây là logic thuần, test được, không dính mạng.
 */

/** Thường hoá + bỏ dấu + bỏ "s" số nhiều: `"Laptops"` → `"laptop"`. */
export function normalizeCategoryToken(value?: string): string {
  return removeDiacritics(value || '')
    .toLowerCase()
    .trim()
    .replace(/s$/, '')
}

/** Hai token khớp nhau nếu gốc bằng nhau, hoặc cái này chứa cái kia. */
export function categoryTokensMatch(a?: string, b?: string): boolean {
  const left = normalizeCategoryToken(a)
  const right = normalizeCategoryToken(b)
  if (!left || !right) return false
  return left === right || left.includes(right) || right.includes(left)
}

/**
 * Quy một token bất kỳ về slug thật trong taxonomy đã tải.
 * Không khớp được thì trả nguyên token — để backend tự quyết.
 */
export function resolveCategorySlug(
  token: string | undefined,
  categories: readonly CatalogCategory[],
): string | undefined {
  if (!token || token === 'all') return token

  const exact = categories.find((category) => category.slug?.toLowerCase() === token.toLowerCase())
  if (exact) return exact.slug

  const fuzzy = categories.find(
    (category) => categoryTokensMatch(category.slug, token) || categoryTokensMatch(category.name, token),
  )
  return fuzzy ? fuzzy.slug : token
}

/** Tìm danh mục ứng với token đang chọn, để hiện tiêu đề và chip active. */
export function findCategory(
  token: string | undefined,
  categories: readonly CatalogCategory[],
): CatalogCategory | undefined {
  if (categories.length === 0) return undefined
  return (
    categories.find((category) => category.slug === token) ??
    categories.find(
      (category) => categoryTokensMatch(category.slug, token) || categoryTokensMatch(category.name, token),
    ) ??
    categories[0]
  )
}

/** Icon gợi ý cho một danh mục, suy từ slug/tên. */
export function categoryIcon(slugOrName: string): string {
  const value = (slugOrName || '').toLowerCase()
  if (value.includes('laptop') || value.includes('macbook')) return 'laptop'
  if (value.includes('phone') || value.includes('smart') || value.includes('tablet')) return 'smartphone'
  if (value.includes('key')) return 'keyboard'
  if (value.includes('mouse') || value.includes('mice')) return 'mouse'
  if (value.includes('audio') || value.includes('sound') || value.includes('head')) return 'headphones'
  if (value.includes('monitor') || value.includes('display')) return 'monitor'
  if (value.includes('component') || value.includes('pc') || value.includes('phu-kien')) return 'cpu'
  return 'package'
}
