import { useCallback, useMemo } from 'react'
import { useSearchParams } from '@core/router'

/**
 * Gắn trạng thái của một bảng (trang, cỡ trang, sắp xếp, bộ lọc) vào query
 * string của URL.
 *
 * Thay cho 18 `useState` bộ lọc trong `AdminPage` v1. Đổi sang URL đem lại ba
 * thứ miễn phí: bookmark được, chia sẻ link được, và F5 không mất bộ lọc.
 *
 * Mọi thay đổi ghi bằng `replace` để việc lọc không làm ngập lịch sử Back.
 */

export interface TableQueryState {
  page: number
  pageSize: number
  search: string
  /** Bộ lọc tuỳ ý theo từng bảng, ví dụ `{ status: 'ACTIVE' }`. */
  filters: Record<string, string>
}

export interface UseTableQueryStateOptions {
  defaultPageSize?: number
  /** Tên các tham số lọc mà bảng này quan tâm. */
  filterKeys?: readonly string[]
}

export interface UseTableQueryStateResult extends TableQueryState {
  setPage: (page: number) => void
  setPageSize: (size: number) => void
  setSearch: (value: string) => void
  setFilter: (name: string, value: string) => void
  reset: () => void
  /** True khi có ít nhất một bộ lọc đang bật (không tính phân trang). */
  hasActiveFilters: boolean
}

export function useTableQueryState(
  options: UseTableQueryStateOptions = {},
): UseTableQueryStateResult {
  const { defaultPageSize = 10, filterKeys = [] } = options
  const [params, setParams] = useSearchParams()

  const page = Math.max(1, Number(params.get('page')) || 1)
  const pageSize = Math.max(1, Number(params.get('size')) || defaultPageSize)
  const search = params.get('q') ?? ''

  const filterSignature = filterKeys.map((key) => `${key}=${params.get(key) ?? ''}`).join('&')
  const filters = useMemo(() => {
    const result: Record<string, string> = {}
    for (const key of filterKeys) {
      const value = params.get(key)
      if (value) result[key] = value
    }
    return result
    // filterSignature là danh tính thật của tập bộ lọc.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterSignature])

  const patch = useCallback(
    (changes: Record<string, string | number | undefined>, resetPage = true) => {
      setParams((current) => {
        const next = new URLSearchParams(current)
        for (const [key, value] of Object.entries(changes)) {
          if (value === undefined || value === '') next.delete(key)
          else next.set(key, String(value))
        }
        // Đổi bộ lọc mà giữ nguyên trang cũ sẽ cho ra một trang trống.
        if (resetPage) next.delete('page')
        return next
      })
    },
    [setParams],
  )

  return {
    page,
    pageSize,
    search,
    filters,
    hasActiveFilters: Boolean(search) || Object.keys(filters).length > 0,
    setPage: useCallback((next: number) => patch({ page: next > 1 ? next : undefined }, false), [patch]),
    setPageSize: useCallback((size: number) => patch({ size }), [patch]),
    setSearch: useCallback((value: string) => patch({ q: value }), [patch]),
    setFilter: useCallback(
      (name: string, value: string) => patch({ [name]: value === 'ALL' ? undefined : value }),
      [patch],
    ),
    reset: useCallback(() => setParams(new URLSearchParams()), [setParams]),
  }
}
