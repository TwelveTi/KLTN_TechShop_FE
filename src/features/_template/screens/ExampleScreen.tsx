import { useSearchParams } from '@core/router'
import { toErrorMessage } from '@core/http'
import { formatVnd } from '@shared/utils/money'
import { useExamples } from '../hooks/useExamples'

/**
 * Một screen = một route.
 *
 * Trách nhiệm: đọc URL state -> gọi hook -> ráp component. Không fetch, không
 * `pushState`, không logic nghiệp vụ. Ngân sách: 200 dòng, 5 `useState`.
 */
export function ExampleScreen() {
  // Bộ lọc sống trong URL, không trong useState: refresh và gửi link đều giữ
  // nguyên trạng thái, và Back/Forward hoạt động miễn phí.
  const [params, setParams] = useSearchParams()
  const page = Math.max(1, Number(params.get('page')) || 1)

  const query = useExamples({ page, limit: 20, q: params.get('q') ?? undefined })

  if (query.isLoading) return <p>Loading</p>
  if (query.isError) return <p role="alert">{toErrorMessage(query.error)}</p>

  return (
    <section>
      <ul>
        {(query.data?.items ?? []).map((item) => (
          <li key={item.id}>
            {item.name} {formatVnd(item.priceVnd)}
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() =>
          // setParams nhận URLSearchParams hoặc một updater — đặt một khoá mà
          // không mất các khoá khác đang có trong URL.
          setParams((current) => {
            const next = new URLSearchParams(current)
            next.set('page', String(page + 1))
            return next
          })
        }
      >
        Next page
      </button>
    </section>
  )
}

// `export default` chỉ dành cho module được lazy() nạp — quy ước duy nhất cho
// phép default export (ARCHITECTURE.md §9).
export default ExampleScreen
