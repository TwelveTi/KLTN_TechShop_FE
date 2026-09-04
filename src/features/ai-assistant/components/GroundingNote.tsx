import { useState } from 'react'
import { Icon } from '@shared/ui/Icon'
import { formatVndCompact } from '@shared/utils/money'
import type { AdvisorToolCall } from '../types'

/**
 * "Trợ lý đã tìm gì trong kho" — khối gấp mở dưới mỗi câu trả lời.
 *
 * Đây không phải trang trí. Luận điểm trung tâm của hệ thống là trợ lý KHÔNG
 * trả lời từ trí nhớ của model mà từ một truy vấn thật (BE README 7.0.1), và
 * một lời khẳng định không kiểm chứng được thì không thuyết phục được ai. Khối
 * này cho người dùng — và hội đồng chấm — thấy đúng bộ lọc đã chạy và trả về
 * bao nhiêu hàng.
 *
 * Mặc định đóng: người mua hàng cần câu trả lời, không cần tham số truy vấn.
 */

/** Tên kỹ thuật của tham số → chữ đọc được. Khoá lạ giữ nguyên, không nuốt. */
const ARG_LABELS: Record<string, string> = {
  categorySlug: 'danh mục',
  brandNames: 'thương hiệu',
  minPrice: 'giá từ',
  maxPrice: 'giá đến',
  specFilters: 'thông số',
  inStockOnly: 'chỉ còn hàng',
  sortBy: 'sắp xếp',
  limit: 'số lượng',
}

const OP_LABELS: Record<string, string> = {
  gte: '≥',
  lte: '≤',
  eq: '=',
  contains: 'chứa',
}

function isSpecFilter(value: unknown): value is { key: string; op: string; value: unknown } {
  return typeof value === 'object' && value !== null && 'key' in value && 'op' in value
}

/**
 * Giá rút gọn (`17,5 Tr`) vì mọi ngân sách trong hội thoại đều nói bằng triệu,
 * và một hàng bộ lọc chật chỗ không đọc nổi `17.490.000 ₫`.
 */
function formatValue(key: string, value: unknown): string {
  if (key === 'minPrice' || key === 'maxPrice') {
    return formatVndCompact(Number(value))
  }

  if (Array.isArray(value)) {
    return value
      .map((entry) =>
        isSpecFilter(entry)
          ? `${entry.key} ${OP_LABELS[entry.op] ?? entry.op} ${String(entry.value)}`
          : String(entry),
      )
      .join(', ')
  }

  if (typeof value === 'boolean') return value ? 'có' : 'không'

  return String(value)
}

export function GroundingNote({ toolCalls }: { toolCalls: AdvisorToolCall[] }) {
  const [isOpen, setIsOpen] = useState(false)

  // Trợ lý trả lời được mà không cần tra cứu (ví dụ câu từ chối ngoài phạm vi)
  // thì không có gì để trưng ra, và một khối rỗng chỉ gây tò mò vô ích.
  if (toolCalls.length === 0) return null

  return (
    <div className="ts-advisor-grounding">
      <button
        type="button"
        className="ts-advisor-grounding__toggle"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
      >
        <Icon name="search" size={14} />
        <span>
          Đã tra {toolCalls.length} lượt trong kho
        </span>
        <Icon name={isOpen ? 'chevron-up' : 'chevron-down'} size={14} />
      </button>

      {isOpen && (
        <ol className="ts-advisor-grounding__list">
          {toolCalls.map((call, index) => {
            const entries = Object.entries(call.args).filter(
              ([, value]) => value !== null && value !== undefined && value !== '',
            )

            return (
              <li className="ts-advisor-grounding__item" key={`${call.name}-${index}`}>
                <div className="ts-advisor-grounding__filters">
                  {entries.length === 0 ? (
                    <span className="ts-advisor-grounding__filter">không đặt bộ lọc nào</span>
                  ) : (
                    entries.map(([key, value]) => (
                      <span className="ts-advisor-grounding__filter" key={key}>
                        <span className="ts-advisor-grounding__filter-key">{ARG_LABELS[key] ?? key}</span>
                        {formatValue(key, value)}
                      </span>
                    ))
                  )}
                </div>
                <span className="ts-advisor-grounding__count">{call.resultCount} kết quả</span>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
