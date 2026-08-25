import type { QueryKey } from '@core/query'
import type { ExampleFilters } from '../types'

/**
 * Query key theo tiền tố: `['<feature>', '<entity>', ...args]`.
 *
 * Cấu trúc này cho phép vô hiệu theo nhánh — `invalidate(exampleKeys.all())`
 * quét mọi biến thể filter mà không đụng feature khác.
 */
export const exampleKeys = {
  all: (): QueryKey => ['example'],
  list: (filters: ExampleFilters): QueryKey => ['example', 'list', filters],
  detail: (id: string): QueryKey => ['example', 'detail', id],
}
