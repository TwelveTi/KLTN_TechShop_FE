import { useMutation, useQuery } from '@core/query'
import { exampleApi } from '../api/exampleApi'
import { exampleKeys } from '../api/queryKeys'
import type { ExampleFilters } from '../types'

/**
 * Thứ DUY NHẤT màn hình gọi để lấy dữ liệu.
 *
 * Hook không sở hữu state — nó chỉ đặt tên cho một cặp `(key, fetcher)`. Nhờ
 * vậy hai màn hình gọi cùng hook dùng chung cache, tự động.
 */

/** Đủ tươi để thấy thay đổi, đủ lâu để đổi trang qua lại không gọi mạng. */
const LIST_STALE_MS = 30_000

export function useExamples(filters: ExampleFilters) {
  return useQuery(exampleKeys.list(filters), () => exampleApi.list(filters), {
    staleTime: LIST_STALE_MS,
  })
}

/** `enabled` hoãn truy vấn khi chưa có id. */
export function useExample(id: string) {
  return useQuery(exampleKeys.detail(id), () => exampleApi.detail(id), {
    staleTime: LIST_STALE_MS,
    enabled: Boolean(id),
  })
}

/** Mutation khai báo `invalidates` — không tự nạp lại mọi thứ. */
export function useCreateExample() {
  return useMutation((payload: { name: string }) => exampleApi.create(payload), {
    invalidates: [exampleKeys.all()],
  })
}
