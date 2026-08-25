import { http } from '@core/http'
import { withQuery } from '@shared/utils/url'
import type { ExampleFilters } from '../types'
import type { ExampleDto, ExampleListDto } from './dto'
import { toExample, type Example } from './mappers'

/**
 * CHỈ endpoint và tham số.
 *
 * Không cache ở đây (việc của `@core/query`), không format (việc của
 * `@shared/utils`), không gọi `fetch` (việc của `@core/http`).
 */
export const exampleApi = {
  async list(filters: ExampleFilters): Promise<{ items: Example[]; total: number }> {
    const data = await http.get<ExampleListDto>(
      withQuery('/examples', { page: filters.page, limit: filters.limit, keyword: filters.q }),
    )
    return { items: (data.items ?? []).map(toExample), total: data.pagination.total }
  },

  async detail(id: string): Promise<Example> {
    return toExample(await http.get<ExampleDto>('/examples/' + encodeURIComponent(id)))
  },

  create: (payload: { name: string }) => http.post<ExampleDto>('/examples', payload, { auth: true }),
}
