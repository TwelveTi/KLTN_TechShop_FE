/**
 * Dựng query string — bỏ giá trị rỗng tự động.
 *
 * Thay cho khoảng 40 dòng `if (x) query.set(...)` lặp lại ở catalogApi,
 * adminApi và reviewApi.
 */

export type QueryValue = string | number | boolean | null | undefined | Array<string | number>

/**
 * Bỏ qua `undefined`, `null`, chuỗi rỗng và mảng rỗng. `false` được GIỮ LẠI —
 * `inStock=false` là một bộ lọc có nghĩa, khác với "không lọc".
 */
export function buildQuery(params: Record<string, QueryValue>): string {
  const search = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    if (Array.isArray(value)) {
      if (value.length === 0) continue
      search.set(key, value.join(','))
      continue
    }
    search.set(key, String(value))
  }

  return search.toString()
}

/** Nối path với query đã dựng; bỏ dấu `?` khi không có tham số nào. */
export function withQuery(path: string, params: Record<string, QueryValue>): string {
  const query = buildQuery(params)
  return query ? `${path}?${query}` : path
}
