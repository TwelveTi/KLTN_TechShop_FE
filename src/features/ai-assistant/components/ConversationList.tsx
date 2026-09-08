import { Icon } from '@shared/ui/Icon'
import { formatDateTime } from '@shared/utils/date'
import type { ConversationSummary } from '../types'

interface ConversationListProps {
  items: ConversationSummary[]
  activeId: string | null
  isLoading: boolean
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  onNew: () => void
}

/**
 * Cột lịch sử hội thoại của trang tư vấn.
 *
 * Nút xoá nằm trong từng dòng và `stopPropagation`: không có nó thì cú bấm nổi
 * lên dòng cha và mở đúng cuộc hội thoại vừa xoá.
 */
export function ConversationList({
  items,
  activeId,
  isLoading,
  onSelect,
  onDelete,
  onNew,
}: ConversationListProps) {
  return (
    <aside className="ts-advisor-sidebar" aria-label="Lịch sử tư vấn">
      <button type="button" className="ts-advisor-sidebar__new" onClick={onNew}>
        <Icon name="plus" size={16} />
        <span>Cuộc trò chuyện mới</span>
      </button>

      {isLoading && <p className="ts-advisor-sidebar__note">Đang tải lịch sử…</p>}

      {!isLoading && items.length === 0 && (
        <p className="ts-advisor-sidebar__note">
          Chưa có cuộc trò chuyện nào. Hỏi một câu để bắt đầu.
        </p>
      )}

      <ul className="ts-advisor-sidebar__list">
        {items.map((item) => (
          <li key={item.id}>
            <div className={`ts-advisor-sidebar__item${item.id === activeId ? ' is-active' : ''}`}>
              <button
                type="button"
                className="ts-advisor-sidebar__open"
                onClick={() => onSelect(item.id)}
                aria-current={item.id === activeId}
              >
                {/* Chỉ dòng so sánh mới đeo nhãn — xem ghi chú trong CSS. */}
                {item.mode === 'comparison' && (
                  <span className="ts-advisor-sidebar__badge">So sánh</span>
                )}
                <span className="ts-advisor-sidebar__title">{item.title}</span>
                {item.updatedAt && (
                  <span className="ts-advisor-sidebar__time">{formatDateTime(item.updatedAt)}</span>
                )}
              </button>

              <button
                type="button"
                className="ts-advisor-sidebar__delete"
                onClick={(event) => {
                  event.stopPropagation()
                  onDelete(item.id)
                }}
                aria-label={`Xoá cuộc trò chuyện ${item.title}`}
              >
                <Icon name="trash" size={14} />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </aside>
  )
}
